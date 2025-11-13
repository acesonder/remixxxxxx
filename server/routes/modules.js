const express = require('express');
const router = express.Router();
const ModuleConfig = require('../models/ModuleConfig');
const { protect, authorize } = require('../middleware/auth');

// Get module configuration
router.get('/', async (req, res) => {
  try {
    const organizationId = req.query.organizationId || 'default';
    let config = await ModuleConfig.findOne({ organizationId });

    if (!config) {
      // Create default configuration if not exists
      config = await ModuleConfig.create({ organizationId });
    }

    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update module configuration
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const organizationId = req.body.organizationId || 'default';
    const updateData = req.body;

    let config = await ModuleConfig.findOne({ organizationId });

    if (!config) {
      config = await ModuleConfig.create(updateData);
    } else {
      config = await ModuleConfig.findOneAndUpdate(
        { organizationId },
        updateData,
        { new: true, runValidators: true }
      );
    }

    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update specific module
router.patch('/:moduleName', protect, authorize('admin'), async (req, res) => {
  try {
    const { moduleName } = req.params;
    const organizationId = req.body.organizationId || 'default';
    const moduleData = req.body;

    const config = await ModuleConfig.findOneAndUpdate(
      { organizationId },
      { [`modules.${moduleName}`]: moduleData },
      { new: true, runValidators: true, upsert: true }
    );

    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update branding
router.patch('/branding', protect, authorize('admin'), async (req, res) => {
  try {
    const organizationId = req.body.organizationId || 'default';
    const brandingData = req.body.branding;

    const config = await ModuleConfig.findOneAndUpdate(
      { organizationId },
      { branding: brandingData },
      { new: true, runValidators: true, upsert: true }
    );

    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update layout configuration
router.patch('/layout', protect, authorize('admin'), async (req, res) => {
  try {
    const organizationId = req.body.organizationId || 'default';
    const layoutData = req.body.layout;

    const config = await ModuleConfig.findOneAndUpdate(
      { organizationId },
      { layoutConfig: layoutData },
      { new: true, runValidators: true, upsert: true }
    );

    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
