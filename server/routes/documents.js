const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { protect, authorize } = require('../middleware/auth');

// Get documents with filtering and search
router.get('/', protect, async (req, res) => {
  try {
    const { 
      search, 
      type, 
      category, 
      status, 
      isTemplate,
      entityType,
      entityId,
      tags 
    } = req.query;
    
    let query = {};

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (type) query.documentType = type;
    if (category) query.category = category;
    if (status) query.status = status;
    if (isTemplate !== undefined) query.isTemplate = isTemplate === 'true';
    
    if (entityType && entityId) {
      query['relatedTo.entityType'] = entityType;
      query['relatedTo.entityId'] = entityId;
    }

    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }

    // Access control - users can only see documents they have access to
    if (req.user.role !== 'admin') {
      query.$or = [
        { 'accessControl.isPublic': true },
        { 'accessControl.allowedRoles': req.user.role },
        { 'accessControl.allowedUsers': req.user._id },
        { uploadedBy: req.user._id }
      ];
      
      // Exclude documents with user in restricted list
      query['accessControl.restrictedUsers'] = { $ne: req.user._id };
    }

    const documents = await Document.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName')
      .populate('signatures.userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get document by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email')
      .populate('signatures.userId', 'firstName lastName email')
      .populate('workflow.steps.assignedTo', 'firstName lastName')
      .populate('workflow.steps.completedBy', 'firstName lastName')
      .populate('relatedDocuments');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check access permissions
    const hasAccess = 
      req.user.role === 'admin' ||
      document.accessControl.isPublic ||
      document.accessControl.allowedRoles.includes(req.user.role) ||
      document.accessControl.allowedUsers.some(u => u.toString() === req.user._id.toString()) ||
      document.uploadedBy._id.toString() === req.user._id.toString();

    const isRestricted = document.accessControl.restrictedUsers.some(
      u => u.toString() === req.user._id.toString()
    );

    if (!hasAccess || isRestricted) {
      return res.status(403).json({ message: 'Access denied to this document' });
    }

    // Update access tracking
    document.downloadCount += 1;
    document.lastAccessedAt = new Date();
    await document.save();

    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create document
router.post('/', protect, authorize('admin', 'staff', 'worker', 'service_provider'), async (req, res) => {
  try {
    const documentData = {
      ...req.body,
      uploadedBy: req.user._id
    };

    // Check for duplicate files using hash
    if (documentData.file?.hash) {
      const duplicate = await Document.findOne({ 'file.hash': documentData.file.hash });
      if (duplicate) {
        return res.status(400).json({ 
          message: 'Duplicate file detected',
          existingDocument: duplicate 
        });
      }
    }

    const document = await Document.create(documentData);
    
    const populatedDocument = await Document.findById(document._id)
      .populate('uploadedBy', 'firstName lastName email');

    res.status(201).json({ success: true, document: populatedDocument });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update document
router.put('/:id', protect, authorize('admin', 'staff', 'worker', 'service_provider'), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions
    const canUpdate = 
      req.user.role === 'admin' ||
      document.uploadedBy.toString() === req.user._id.toString();

    if (!canUpdate) {
      return res.status(403).json({ message: 'Not authorized to update this document' });
    }

    // If updating the file, save version history
    if (req.body.file && req.body.file.filename !== document.file.filename) {
      document.versionHistory.push({
        version: document.version,
        filename: document.file.filename,
        url: document.file.url,
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
        changeDescription: req.body.changeDescription || 'File updated',
        size: document.file.size
      });
      document.version += 1;
    }

    // Update document
    Object.assign(document, req.body);
    document.modifiedBy = req.user._id;
    await document.save();

    const updatedDocument = await Document.findById(document._id)
      .populate('uploadedBy modifiedBy signatures.userId');

    res.json({ success: true, document: updatedDocument });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete document
router.delete('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions
    const canDelete = 
      req.user.role === 'admin' ||
      document.uploadedBy.toString() === req.user._id.toString();

    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized to delete this document' });
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add signature to document
router.post('/:id/sign', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user already signed
    const alreadySigned = document.signatures.some(
      sig => sig.userId.toString() === req.user._id.toString()
    );

    if (alreadySigned) {
      return res.status(400).json({ message: 'Document already signed by this user' });
    }

    const signature = {
      userId: req.user._id,
      signedAt: new Date(),
      signatureType: req.body.signatureType || 'electronic',
      signatureData: req.body.signatureData,
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent'],
      consentText: req.body.consentText
    };

    document.signatures.push(signature);
    await document.save();

    const updatedDocument = await Document.findById(document._id)
      .populate('signatures.userId', 'firstName lastName email');

    res.json({ success: true, document: updatedDocument });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update workflow step
router.patch('/:id/workflow/:stepNumber', protect, authorize('admin', 'staff', 'worker', 'service_provider'), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const step = document.workflow.steps.find(s => s.stepNumber === parseInt(req.params.stepNumber));

    if (!step) {
      return res.status(404).json({ message: 'Workflow step not found' });
    }

    // Check if user is assigned to this step or is admin
    const canUpdate = 
      req.user.role === 'admin' ||
      (step.assignedTo && step.assignedTo.toString() === req.user._id.toString()) ||
      step.assignedRole === req.user.role;

    if (!canUpdate) {
      return res.status(403).json({ message: 'Not authorized to update this workflow step' });
    }

    // Update step
    step.status = req.body.status || step.status;
    step.comments = req.body.comments || step.comments;
    
    if (req.body.status === 'completed') {
      step.completedAt = new Date();
      step.completedBy = req.user._id;
      
      // Move to next step if available
      const nextStep = document.workflow.steps.find(s => s.stepNumber === step.stepNumber + 1);
      if (nextStep) {
        document.workflow.currentStep = nextStep.stepNumber;
      }
    }

    await document.save();

    const updatedDocument = await Document.findById(document._id)
      .populate('workflow.steps.assignedTo workflow.steps.completedBy');

    res.json({ success: true, document: updatedDocument });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get document templates
router.get('/templates/list', protect, async (req, res) => {
  try {
    const templates = await Document.find({ 
      isTemplate: true,
      $or: [
        { 'accessControl.isPublic': true },
        { 'accessControl.allowedRoles': req.user.role }
      ]
    })
    .populate('uploadedBy', 'firstName lastName')
    .sort({ title: 1 });

    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create document from template
router.post('/templates/:id/create', protect, async (req, res) => {
  try {
    const template = await Document.findById(req.params.id);

    if (!template || !template.isTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Create new document from template
    const newDocument = new Document({
      title: req.body.title || template.title,
      description: req.body.description || template.description,
      documentType: template.documentType,
      category: template.category,
      file: template.file,
      templateFields: template.templateFields,
      tags: template.tags,
      accessControl: req.body.accessControl || template.accessControl,
      uploadedBy: req.user._id,
      relatedTo: req.body.relatedTo
    });

    await newDocument.save();

    const populatedDocument = await Document.findById(newDocument._id)
      .populate('uploadedBy', 'firstName lastName email');

    res.status(201).json({ success: true, document: populatedDocument });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get expiring documents
router.get('/expiring/soon', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.days) || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const expiringDocuments = await Document.find({
      expirationDate: {
        $gte: new Date(),
        $lte: futureDate
      },
      status: { $ne: 'archived' }
    })
    .populate('uploadedBy', 'firstName lastName email')
    .sort({ expirationDate: 1 });

    res.json({ success: true, documents: expiringDocuments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
