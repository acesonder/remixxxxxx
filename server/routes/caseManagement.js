const express = require('express');
const router = express.Router();
const CaseManagement = require('../models/CaseManagement');
const { protect, authorize } = require('../middleware/auth');

// Get all cases
router.get('/', protect, authorize('admin', 'staff', 'worker', 'service_provider'), async (req, res) => {
  try {
    const { clientId, caseManagerId, status, priority } = req.query;
    let query = {};

    if (clientId) query.clientId = clientId;
    if (caseManagerId) query.caseManagerId = caseManagerId;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const cases = await CaseManagement.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate('caseManagerId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, cases });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get case by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const caseData = await CaseManagement.findById(req.params.id)
      .populate('clientId', 'firstName lastName email')
      .populate('caseManagerId', 'firstName lastName email')
      .populate('teamMembers.userId', 'firstName lastName email role');

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    res.json({ success: true, case: caseData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create case
router.post('/', protect, authorize('admin', 'staff', 'worker', 'service_provider'), async (req, res) => {
  try {
    const caseData = {
      ...req.body,
      caseManagerId: req.user._id,
      caseNumber: `CASE-${Date.now()}`
    };

    const newCase = await CaseManagement.create(caseData);
    res.status(201).json({ success: true, case: newCase });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update case
router.put('/:id', protect, authorize('admin', 'staff', 'worker', 'service_provider'), async (req, res) => {
  try {
    const caseData = await CaseManagement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    res.json({ success: true, case: caseData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add note to case
router.post('/:id/notes', protect, authorize('admin', 'staff', 'worker', 'service_provider'), async (req, res) => {
  try {
    const caseData = await CaseManagement.findById(req.params.id);

    caseData.notes.push({
      authorId: req.user._id,
      content: req.body.content,
      isPrivate: req.body.isPrivate || false
    });

    await caseData.save();

    res.json({ success: true, case: caseData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update location
router.patch('/:id/location', protect, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    const caseData = await CaseManagement.findByIdAndUpdate(
      req.params.id,
      {
        location: {
          latitude,
          longitude,
          address,
          lastUpdated: new Date()
        }
      },
      { new: true }
    );

    res.json({ success: true, case: caseData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete case
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const caseData = await CaseManagement.findByIdAndDelete(req.params.id);

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    res.json({ success: true, message: 'Case deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
