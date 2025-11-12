const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

// In-memory storage (replace with database in production)
const messages = new Map();
const conversations = new Map();
const userSockets = new Map(); // Map userId to socketId

module.exports = (io, moduleManager) => {
  // Get auth middleware
  const { authenticateToken } = require('../auth');

  // Socket.IO handling for real-time messaging
  io.on('connection', (socket) => {
    socket.on('user:register', (userId) => {
      userSockets.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} connected with socket ${socket.id}`);
    });

    socket.on('message:send', (data) => {
      const messageId = uuidv4();
      const message = {
        id: messageId,
        conversationId: data.conversationId,
        senderId: socket.userId,
        content: data.content,
        timestamp: new Date().toISOString(),
        read: false
      };

      // Store message
      if (!messages.has(data.conversationId)) {
        messages.set(data.conversationId, []);
      }
      messages.get(data.conversationId).push(message);

      // Emit to conversation participants
      const conversation = conversations.get(data.conversationId);
      if (conversation) {
        conversation.participants.forEach(participantId => {
          const socketId = userSockets.get(participantId);
          if (socketId) {
            io.to(socketId).emit('message:received', message);
          }
        });
      }
    });

    socket.on('message:typing', (data) => {
      const conversation = conversations.get(data.conversationId);
      if (conversation) {
        conversation.participants.forEach(participantId => {
          if (participantId !== socket.userId) {
            const socketId = userSockets.get(participantId);
            if (socketId) {
              io.to(socketId).emit('user:typing', {
                conversationId: data.conversationId,
                userId: socket.userId
              });
            }
          }
        });
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);
      }
    });
  });

  // Create new conversation
  router.post('/conversations', authenticateToken, [
    body('participants').isArray({ min: 1 }),
    body('title').optional().isString()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { participants, title } = req.body;
    const conversationId = uuidv4();

    // Add current user to participants
    const allParticipants = [...new Set([req.user.userId, ...participants])];

    const conversation = {
      id: conversationId,
      title: title || `Conversation ${conversationId.slice(0, 8)}`,
      participants: allParticipants,
      createdAt: new Date().toISOString(),
      lastMessageAt: null
    };

    conversations.set(conversationId, conversation);

    res.status(201).json(conversation);
  });

  // Get user's conversations
  router.get('/conversations', authenticateToken, (req, res) => {
    const userConversations = Array.from(conversations.values())
      .filter(conv => conv.participants.includes(req.user.userId))
      .map(conv => {
        const convMessages = messages.get(conv.id) || [];
        const lastMessage = convMessages[convMessages.length - 1];
        const unreadCount = convMessages.filter(m => 
          m.senderId !== req.user.userId && !m.read
        ).length;

        return {
          ...conv,
          lastMessage,
          unreadCount
        };
      });

    res.json(userConversations);
  });

  // Get conversation messages
  router.get('/conversations/:conversationId/messages', authenticateToken, (req, res) => {
    const { conversationId } = req.params;
    const conversation = conversations.get(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const conversationMessages = messages.get(conversationId) || [];
    res.json(conversationMessages);
  });

  // Send message (REST API alternative to socket)
  router.post('/conversations/:conversationId/messages', authenticateToken, [
    body('content').isString().notEmpty()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { conversationId } = req.params;
    const { content } = req.body;
    const conversation = conversations.get(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messageId = uuidv4();
    const message = {
      id: messageId,
      conversationId,
      senderId: req.user.userId,
      content,
      timestamp: new Date().toISOString(),
      read: false
    };

    if (!messages.has(conversationId)) {
      messages.set(conversationId, []);
    }
    messages.get(conversationId).push(message);

    // Update conversation
    conversation.lastMessageAt = message.timestamp;

    // Emit via socket to all participants
    conversation.participants.forEach(participantId => {
      const socketId = userSockets.get(participantId);
      if (socketId) {
        io.to(socketId).emit('message:received', message);
      }
    });

    res.status(201).json(message);
  });

  // Mark messages as read
  router.post('/conversations/:conversationId/read', authenticateToken, (req, res) => {
    const { conversationId } = req.params;
    const conversationMessages = messages.get(conversationId) || [];

    conversationMessages.forEach(msg => {
      if (msg.senderId !== req.user.userId) {
        msg.read = true;
      }
    });

    res.json({ message: 'Messages marked as read' });
  });

  // Get inbox summary
  router.get('/inbox', authenticateToken, (req, res) => {
    const userConversations = Array.from(conversations.values())
      .filter(conv => conv.participants.includes(req.user.userId));

    let totalUnread = 0;
    const recentMessages = [];

    userConversations.forEach(conv => {
      const convMessages = messages.get(conv.id) || [];
      const unread = convMessages.filter(m => 
        m.senderId !== req.user.userId && !m.read
      );
      totalUnread += unread.length;
      
      const lastMessage = convMessages[convMessages.length - 1];
      if (lastMessage) {
        recentMessages.push({
          conversation: conv,
          message: lastMessage
        });
      }
    });

    // Sort by most recent
    recentMessages.sort((a, b) => 
      new Date(b.message.timestamp) - new Date(a.message.timestamp)
    );

    res.json({
      totalUnread,
      totalConversations: userConversations.length,
      recentMessages: recentMessages.slice(0, 10)
    });
  });

  return router;
};
