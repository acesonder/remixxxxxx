const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

// In-memory storage (replace with database in production)
const notifications = new Map(); // userId -> [notifications]
const userBadges = new Map(); // userId -> { module: count }

module.exports = (io, moduleManager) => {
  const { authenticateToken } = require('../auth');

  // Helper function to send notification
  const sendNotification = (userId, notification) => {
    if (!notifications.has(userId)) {
      notifications.set(userId, []);
    }
    notifications.get(userId).push(notification);

    // Update badge count
    if (!userBadges.has(userId)) {
      userBadges.set(userId, {});
    }
    const badges = userBadges.get(userId);
    badges[notification.module] = (badges[notification.module] || 0) + 1;

    // Emit via socket
    io.emit(`notification:${userId}`, {
      notification,
      badges: badges
    });
  };

  // Get user notifications
  router.get('/', authenticateToken, (req, res) => {
    const { unreadOnly } = req.query;
    let userNotifications = notifications.get(req.user.userId) || [];

    if (unreadOnly === 'true') {
      userNotifications = userNotifications.filter(n => !n.read);
    }

    res.json(userNotifications.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    ));
  });

  // Create notification (admin/system)
  router.post('/', authenticateToken, [
    body('userId').isString().notEmpty(),
    body('title').isString().notEmpty(),
    body('message').isString().notEmpty(),
    body('type').isIn(['info', 'success', 'warning', 'error']),
    body('module').optional().isString()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, title, message, type, module, action, link } = req.body;

    const notification = {
      id: uuidv4(),
      userId,
      title,
      message,
      type: type || 'info',
      module: module || 'system',
      action,
      link,
      read: false,
      timestamp: new Date().toISOString()
    };

    sendNotification(userId, notification);

    res.status(201).json(notification);
  });

  // Mark notification as read
  router.patch('/:notificationId/read', authenticateToken, (req, res) => {
    const { notificationId } = req.params;
    const userNotifications = notifications.get(req.user.userId) || [];
    
    const notification = userNotifications.find(n => n.id === notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.read = true;

    res.json(notification);
  });

  // Mark all notifications as read
  router.post('/read-all', authenticateToken, (req, res) => {
    const userNotifications = notifications.get(req.user.userId) || [];
    userNotifications.forEach(n => n.read = true);

    // Reset badges
    userBadges.set(req.user.userId, {});

    res.json({ message: 'All notifications marked as read' });
  });

  // Delete notification
  router.delete('/:notificationId', authenticateToken, (req, res) => {
    const { notificationId } = req.params;
    const userNotifications = notifications.get(req.user.userId) || [];
    
    const index = userNotifications.findIndex(n => n.id === notificationId);
    if (index === -1) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    userNotifications.splice(index, 1);

    res.json({ message: 'Notification deleted' });
  });

  // Get badge counts
  router.get('/badges', authenticateToken, (req, res) => {
    const badges = userBadges.get(req.user.userId) || {};
    const total = Object.values(badges).reduce((sum, count) => sum + count, 0);

    res.json({
      total,
      byModule: badges
    });
  });

  // Push notification preferences
  router.get('/preferences', authenticateToken, (req, res) => {
    // In production, retrieve from database
    res.json({
      pushEnabled: true,
      emailEnabled: true,
      modules: {
        messaging: { push: true, email: true },
        system: { push: true, email: false },
        assessment: { push: true, email: true }
      }
    });
  });

  router.put('/preferences', authenticateToken, [
    body('pushEnabled').optional().isBoolean(),
    body('emailEnabled').optional().isBoolean(),
    body('modules').optional().isObject()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // In production, save to database
    res.json({
      message: 'Preferences updated',
      preferences: req.body
    });
  });

  // Expose helper for other modules
  router.sendNotification = sendNotification;

  return router;
};
