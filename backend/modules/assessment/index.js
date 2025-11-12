const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

// In-memory storage
const assessmentForms = new Map();
const assessmentResponses = new Map();

// Initialize default assessment forms
const defaultForms = [
  {
    id: 'intake-general',
    name: 'General Intake Assessment',
    description: 'Standard intake questionnaire',
    category: 'intake',
    version: '1.0.0',
    fields: [
      { id: 'name', label: 'Full Name', type: 'text', required: true },
      { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
      { id: 'contact', label: 'Contact Number', type: 'tel', required: true },
      { id: 'email', label: 'Email Address', type: 'email', required: false },
      { id: 'emergency_contact', label: 'Emergency Contact', type: 'text', required: true },
      { id: 'reason', label: 'Reason for Assessment', type: 'textarea', required: true }
    ],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'health-screening',
    name: 'Health Screening',
    description: 'Basic health assessment',
    category: 'health',
    version: '1.0.0',
    fields: [
      { id: 'height', label: 'Height (cm)', type: 'number', required: true },
      { id: 'weight', label: 'Weight (kg)', type: 'number', required: true },
      { id: 'medications', label: 'Current Medications', type: 'textarea', required: false },
      { id: 'allergies', label: 'Known Allergies', type: 'textarea', required: false },
      { id: 'conditions', label: 'Medical Conditions', type: 'textarea', required: false }
    ],
    active: true,
    createdAt: new Date().toISOString()
  }
];

defaultForms.forEach(f => assessmentForms.set(f.id, f));

module.exports = (io, moduleManager) => {
  const { authenticateToken } = require('../auth');

  // Get all assessment forms
  router.get('/forms', authenticateToken, (req, res) => {
    const { category, active } = req.query;
    let forms = Array.from(assessmentForms.values());

    if (category) {
      forms = forms.filter(f => f.category === category);
    }

    if (active !== undefined) {
      forms = forms.filter(f => f.active === (active === 'true'));
    }

    res.json(forms);
  });

  // Get specific form
  router.get('/forms/:formId', authenticateToken, (req, res) => {
    const { formId } = req.params;
    const form = assessmentForms.get(formId);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  });

  // Create assessment form (admin)
  router.post('/forms', authenticateToken, [
    body('name').isString().notEmpty(),
    body('description').isString(),
    body('category').isString(),
    body('fields').isArray({ min: 1 })
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, category, fields } = req.body;
    const formId = uuidv4();

    const form = {
      id: formId,
      name,
      description,
      category,
      version: '1.0.0',
      fields,
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: req.user.userId
    };

    assessmentForms.set(formId, form);

    res.status(201).json(form);
  });

  // Update assessment form
  router.put('/forms/:formId', authenticateToken, [
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('fields').optional().isArray()
  ], (req, res) => {
    const { formId } = req.params;
    const form = assessmentForms.get(formId);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        form[key] = updates[key];
      }
    });

    form.updatedAt = new Date().toISOString();

    res.json(form);
  });

  // Submit assessment response
  router.post('/responses', authenticateToken, [
    body('formId').isString().notEmpty(),
    body('responses').isObject()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { formId, responses } = req.body;
    const form = assessmentForms.get(formId);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Validate required fields
    const missingFields = form.fields
      .filter(f => f.required && !responses[f.id])
      .map(f => f.label);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        fields: missingFields
      });
    }

    const responseId = uuidv4();
    const response = {
      id: responseId,
      formId,
      formVersion: form.version,
      userId: req.user.userId,
      responses,
      submittedAt: new Date().toISOString(),
      status: 'submitted'
    };

    if (!assessmentResponses.has(req.user.userId)) {
      assessmentResponses.set(req.user.userId, []);
    }

    assessmentResponses.get(req.user.userId).push(response);

    res.status(201).json(response);
  });

  // Get user's assessment responses
  router.get('/responses', authenticateToken, (req, res) => {
    const { formId } = req.query;
    let responses = assessmentResponses.get(req.user.userId) || [];

    if (formId) {
      responses = responses.filter(r => r.formId === formId);
    }

    res.json(responses);
  });

  // Get specific response
  router.get('/responses/:responseId', authenticateToken, (req, res) => {
    const { responseId } = req.params;
    const userResponses = assessmentResponses.get(req.user.userId) || [];
    const response = userResponses.find(r => r.id === responseId);

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    res.json(response);
  });

  // Update response status (admin/reviewer)
  router.patch('/responses/:responseId/status', authenticateToken, [
    body('status').isIn(['submitted', 'reviewed', 'approved', 'rejected'])
  ], (req, res) => {
    const { responseId } = req.params;
    const { status, notes } = req.body;

    // Find response across all users (admin function)
    let found = false;
    for (const [userId, responses] of assessmentResponses.entries()) {
      const response = responses.find(r => r.id === responseId);
      if (response) {
        response.status = status;
        response.reviewedBy = req.user.userId;
        response.reviewedAt = new Date().toISOString();
        if (notes) response.reviewNotes = notes;
        found = true;
        return res.json(response);
      }
    }

    if (!found) {
      return res.status(404).json({ error: 'Response not found' });
    }
  });

  // Get assessment statistics
  router.get('/statistics', authenticateToken, (req, res) => {
    const userResponses = assessmentResponses.get(req.user.userId) || [];
    
    const stats = {
      total: userResponses.length,
      byForm: {},
      byStatus: {
        submitted: 0,
        reviewed: 0,
        approved: 0,
        rejected: 0
      }
    };

    userResponses.forEach(response => {
      // Count by form
      if (!stats.byForm[response.formId]) {
        const form = assessmentForms.get(response.formId);
        stats.byForm[response.formId] = {
          name: form?.name || 'Unknown',
          count: 0
        };
      }
      stats.byForm[response.formId].count++;

      // Count by status
      stats.byStatus[response.status]++;
    });

    res.json(stats);
  });

  return router;
};
