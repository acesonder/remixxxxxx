const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Get all users (admin/staff only)
router.get('/', protect, authorize('admin', 'staff', 'worker'), async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only update their own profile unless admin
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add friend
router.post('/:id/friends', protect, async (req, res) => {
  try {
    const { friendId } = req.body;
    const user = await User.findById(req.params.id);

    if (!user.friends.includes(friendId)) {
      user.friends.push(friendId);
      await user.save();
    }

    res.json({ success: true, user: await user.populate('friends', 'firstName lastName email') });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove friend
router.delete('/:id/friends/:friendId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.friends = user.friends.filter(f => f.toString() !== req.params.friendId);
    await user.save();

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user settings
router.patch('/:id/settings', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { settings: req.body },
      { new: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
