const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const { protect, authorize } = require('../middleware/auth');

// Get all resources
router.get('/', protect, async (req, res) => {
  try {
    const { category, resourceType, search, tags } = req.query;
    let query = { isActive: true };

    // Access control based on user role
    if (!['admin', 'staff', 'worker', 'service_provider'].includes(req.user.role)) {
      query.accessLevel = 'public';
    }

    if (category) query.category = category;
    if (resourceType) query.resourceType = resourceType;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const resources = await Resource.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ success: true, resources });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get resource by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName email');

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Increment views
    resource.views += 1;
    await resource.save();

    res.json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create resource
router.post('/', protect, authorize('admin', 'staff', 'service_provider'), async (req, res) => {
  try {
    const resourceData = {
      ...req.body,
      uploadedBy: req.user._id
    };

    const resource = await Resource.create(resourceData);
    res.status(201).json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update resource
router.put('/:id', protect, authorize('admin', 'staff', 'service_provider'), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Increment version if content changed
    if (req.body.fileUrl || req.body.externalUrl) {
      req.body.version = resource.version + 1;
    }

    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, resource: updatedResource });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete resource
router.delete('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
