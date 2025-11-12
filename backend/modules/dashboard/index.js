const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

// In-memory storage
const dashboards = new Map(); // userId -> dashboard config
const widgets = new Map(); // widgetId -> widget definition

// Initialize default widgets
const defaultWidgets = [
  {
    id: 'stats-overview',
    name: 'Statistics Overview',
    type: 'stats',
    category: 'analytics',
    description: 'Display key statistics and metrics',
    defaultSize: { w: 6, h: 4 }
  },
  {
    id: 'recent-activity',
    name: 'Recent Activity',
    type: 'activity',
    category: 'general',
    description: 'Show recent user activities',
    defaultSize: { w: 6, h: 6 }
  },
  {
    id: 'notifications-feed',
    name: 'Notifications Feed',
    type: 'notifications',
    category: 'communication',
    description: 'Display recent notifications',
    defaultSize: { w: 4, h: 5 }
  },
  {
    id: 'quick-actions',
    name: 'Quick Actions',
    type: 'actions',
    category: 'general',
    description: 'Frequently used actions',
    defaultSize: { w: 4, h: 3 }
  },
  {
    id: 'chart-widget',
    name: 'Chart Widget',
    type: 'chart',
    category: 'analytics',
    description: 'Customizable data visualization',
    defaultSize: { w: 8, h: 6 }
  }
];

defaultWidgets.forEach(w => widgets.set(w.id, w));

module.exports = (io, moduleManager) => {
  const { authenticateToken } = require('../auth');

  // Get available widgets
  router.get('/widgets', authenticateToken, (req, res) => {
    res.json(Array.from(widgets.values()));
  });

  // Get user's dashboard configuration
  router.get('/', authenticateToken, (req, res) => {
    let dashboard = dashboards.get(req.user.userId);

    if (!dashboard) {
      // Create default dashboard
      dashboard = {
        userId: req.user.userId,
        layout: [
          { i: 'stats-overview', x: 0, y: 0, w: 6, h: 4 },
          { i: 'recent-activity', x: 6, y: 0, w: 6, h: 6 },
          { i: 'notifications-feed', x: 0, y: 4, w: 4, h: 5 }
        ],
        widgets: {
          'stats-overview': { enabled: true, config: {} },
          'recent-activity': { enabled: true, config: {} },
          'notifications-feed': { enabled: true, config: {} }
        },
        theme: 'light',
        createdAt: new Date().toISOString()
      };
      dashboards.set(req.user.userId, dashboard);
    }

    res.json(dashboard);
  });

  // Update dashboard layout
  router.put('/layout', authenticateToken, [
    body('layout').isArray()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { layout } = req.body;
    let dashboard = dashboards.get(req.user.userId);

    if (!dashboard) {
      dashboard = {
        userId: req.user.userId,
        layout: [],
        widgets: {},
        theme: 'light',
        createdAt: new Date().toISOString()
      };
    }

    dashboard.layout = layout;
    dashboard.updatedAt = new Date().toISOString();
    dashboards.set(req.user.userId, dashboard);

    res.json(dashboard);
  });

  // Add widget to dashboard
  router.post('/widgets/:widgetId', authenticateToken, [
    body('position').optional().isObject(),
    body('config').optional().isObject()
  ], (req, res) => {
    const { widgetId } = req.params;
    const { position, config } = req.body;

    const widget = widgets.get(widgetId);
    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    let dashboard = dashboards.get(req.user.userId);
    if (!dashboard) {
      dashboard = {
        userId: req.user.userId,
        layout: [],
        widgets: {},
        theme: 'light',
        createdAt: new Date().toISOString()
      };
    }

    // Add to layout
    const layoutItem = position || {
      i: widgetId,
      x: 0,
      y: 0,
      w: widget.defaultSize.w,
      h: widget.defaultSize.h
    };
    dashboard.layout.push(layoutItem);

    // Add to widgets config
    dashboard.widgets[widgetId] = {
      enabled: true,
      config: config || {}
    };

    dashboard.updatedAt = new Date().toISOString();
    dashboards.set(req.user.userId, dashboard);

    res.json(dashboard);
  });

  // Remove widget from dashboard
  router.delete('/widgets/:widgetId', authenticateToken, (req, res) => {
    const { widgetId } = req.params;
    const dashboard = dashboards.get(req.user.userId);

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    // Remove from layout
    dashboard.layout = dashboard.layout.filter(item => item.i !== widgetId);

    // Remove from widgets config
    delete dashboard.widgets[widgetId];

    dashboard.updatedAt = new Date().toISOString();

    res.json(dashboard);
  });

  // Configure widget
  router.put('/widgets/:widgetId/config', authenticateToken, [
    body('config').isObject()
  ], (req, res) => {
    const { widgetId } = req.params;
    const { config } = req.body;

    const dashboard = dashboards.get(req.user.userId);
    if (!dashboard || !dashboard.widgets[widgetId]) {
      return res.status(404).json({ error: 'Widget not found in dashboard' });
    }

    // Prevent prototype pollution by filtering out dangerous keys
    const safeConfig = Object.keys(config)
      .filter(key => !['__proto__', 'constructor', 'prototype'].includes(key))
      .reduce((obj, key) => {
        obj[key] = config[key];
        return obj;
      }, {});

    dashboard.widgets[widgetId].config = {
      ...dashboard.widgets[widgetId].config,
      ...safeConfig
    };

    dashboard.updatedAt = new Date().toISOString();

    res.json(dashboard.widgets[widgetId]);
  });

  // Get widget data
  router.get('/widgets/:widgetId/data', authenticateToken, (req, res) => {
    const { widgetId } = req.params;

    // Mock data based on widget type
    const widget = widgets.get(widgetId);
    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    let data = {};

    switch (widget.type) {
      case 'stats':
        data = {
          totalUsers: 1234,
          activeToday: 89,
          newThisWeek: 23,
          completionRate: 78.5
        };
        break;
      case 'activity':
        data = {
          activities: [
            { action: 'User login', timestamp: new Date().toISOString() },
            { action: 'Assessment completed', timestamp: new Date().toISOString() },
            { action: 'Message sent', timestamp: new Date().toISOString() }
          ]
        };
        break;
      case 'notifications':
        data = {
          notifications: [
            { title: 'New message', time: '5 min ago' },
            { title: 'Assessment due', time: '1 hour ago' }
          ]
        };
        break;
      case 'chart':
        data = {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          values: [12, 19, 3, 5, 2, 3, 9]
        };
        break;
      default:
        data = { message: 'No data available' };
    }

    res.json(data);
  });

  return router;
};
