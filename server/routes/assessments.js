const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const { protect, authorize } = require('../middleware/auth');

// Get all assessments
router.get('/', protect, authorize('admin', 'staff', 'worker', 'service_provider'), async (req, res) => {
  try {
    const { clientId, assessmentType, status } = req.query;
    let query = {};

    if (clientId) query.clientId = clientId;
    if (assessmentType) query.assessmentType = assessmentType;
    if (status) query.status = status;

    const assessments = await Assessment.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate('assessorId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, assessments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get assessment by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('clientId', 'firstName lastName email')
      .populate('assessorId', 'firstName lastName email');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json({ success: true, assessment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create assessment
router.post('/', protect, authorize('admin', 'staff', 'worker', 'service_provider'), async (req, res) => {
  try {
    const assessmentData = {
      ...req.body,
      assessorId: req.user._id
    };

    const assessment = await Assessment.create(assessmentData);
    res.status(201).json({ success: true, assessment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update assessment
router.put('/:id', protect, authorize('admin', 'staff', 'worker', 'service_provider'), async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json({ success: true, assessment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete assessment
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json({ success: true, message: 'Assessment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
