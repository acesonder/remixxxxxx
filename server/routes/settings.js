const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ModuleConfig = require('../models/ModuleConfig');
const { protect } = require('../middleware/auth');

// Get user settings
router.get('/user', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('settings');
    res.json({ success: true, settings: user.settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user settings
router.put('/user', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { settings: req.body },
      { new: true }
    ).select('settings');

    res.json({ success: true, settings: user.settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update notification preferences
router.patch('/notifications', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.settings.notifications = { ...user.settings.notifications, ...req.body };
    await user.save();

    res.json({ success: true, notifications: user.settings.notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update privacy settings
router.patch('/privacy', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.settings.privacy = { ...user.settings.privacy, ...req.body };
    await user.save();

    res.json({ success: true, privacy: user.settings.privacy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update theme
router.patch('/theme', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'settings.theme': req.body.theme },
      { new: true }
    ).select('settings.theme');

    res.json({ success: true, theme: user.settings.theme });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export user data
router.get('/export', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ 
      success: true, 
      data: user,
      exportDate: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
