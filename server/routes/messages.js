const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// Get conversations for a user
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { recipientId: userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    res.json({ success: true, conversations: messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages in a conversation
router.get('/:conversationId', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId
    })
      .populate('senderId', 'firstName lastName avatar')
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a message
router.post('/', protect, async (req, res) => {
  try {
    const { recipientId, conversationId, content, messageType, attachments } = req.body;

    const message = await Message.create({
      senderId: req.user._id,
      recipientId,
      conversationId,
      content,
      messageType,
      attachments
    });

    const populatedMessage = await message.populate('senderId', 'firstName lastName avatar');

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark message as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message.readBy.some(r => r.userId.toString() === req.user._id.toString())) {
      message.readBy.push({
        userId: req.user._id,
        readAt: new Date()
      });
      await message.save();
    }

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete message
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    message.isDeleted = true;
    await message.save();

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
