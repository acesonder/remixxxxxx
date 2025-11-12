const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// In-memory storage
const userThemes = new Map(); // userId -> theme config
const systemThemes = new Map();

// Initialize default themes
const defaultThemes = [
  {
    id: 'light',
    name: 'Light',
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      background: '#ffffff',
      text: '#212529'
    },
    fonts: {
      primary: 'Inter, sans-serif',
      heading: 'Inter, sans-serif'
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      primary: '#0d6efd',
      secondary: '#6c757d',
      success: '#198754',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#0dcaf0',
      background: '#212529',
      text: '#f8f9fa'
    },
    fonts: {
      primary: 'Inter, sans-serif',
      heading: 'Inter, sans-serif'
    }
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    colors: {
      primary: '#0000ff',
      secondary: '#808080',
      success: '#00ff00',
      danger: '#ff0000',
      warning: '#ffff00',
      info: '#00ffff',
      background: '#000000',
      text: '#ffffff'
    },
    fonts: {
      primary: 'Arial, sans-serif',
      heading: 'Arial, sans-serif'
    }
  }
];

defaultThemes.forEach(t => systemThemes.set(t.id, t));

module.exports = (io, moduleManager) => {
  const { authenticateToken } = require('../auth');

  // Get available system themes
  router.get('/themes', (req, res) => {
    res.json(Array.from(systemThemes.values()));
  });

  // Get user's theme configuration
  router.get('/theme', authenticateToken, (req, res) => {
    const userTheme = userThemes.get(req.user.userId);
    
    if (!userTheme) {
      // Return default light theme
      return res.json({
        userId: req.user.userId,
        themeId: 'light',
        customizations: {},
        ...systemThemes.get('light')
      });
    }

    res.json(userTheme);
  });

  // Set user's theme
  router.put('/theme', authenticateToken, [
    body('themeId').isString().notEmpty()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { themeId, customizations } = req.body;
    const systemTheme = systemThemes.get(themeId);

    if (!systemTheme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    const userTheme = {
      userId: req.user.userId,
      themeId,
      customizations: customizations || {},
      ...systemTheme,
      updatedAt: new Date().toISOString()
    };

    userThemes.set(req.user.userId, userTheme);

    res.json(userTheme);
  });

  // Customize theme colors
  router.patch('/theme/colors', authenticateToken, [
    body('colors').isObject()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let userTheme = userThemes.get(req.user.userId);
    
    if (!userTheme) {
      userTheme = {
        userId: req.user.userId,
        themeId: 'light',
        customizations: {},
        ...systemThemes.get('light')
      };
    }

    userTheme.colors = {
      ...userTheme.colors,
      ...req.body.colors
    };

    userTheme.customizations.colors = req.body.colors;
    userTheme.updatedAt = new Date().toISOString();

    userThemes.set(req.user.userId, userTheme);

    res.json(userTheme);
  });

  // Get layout options
  router.get('/layouts', (req, res) => {
    const layouts = [
      {
        id: 'default',
        name: 'Default Layout',
        sidebar: 'left',
        header: 'fixed',
        footer: 'static',
        containerWidth: 'fluid'
      },
      {
        id: 'minimal',
        name: 'Minimal Layout',
        sidebar: 'collapsed',
        header: 'minimal',
        footer: 'hidden',
        containerWidth: 'boxed'
      },
      {
        id: 'full-width',
        name: 'Full Width',
        sidebar: 'right',
        header: 'static',
        footer: 'static',
        containerWidth: 'full'
      }
    ];

    res.json(layouts);
  });

  // Get/Set user layout preference
  router.get('/layout', authenticateToken, (req, res) => {
    const userTheme = userThemes.get(req.user.userId);
    const layout = userTheme?.layout || {
      id: 'default',
      sidebar: 'left',
      header: 'fixed',
      footer: 'static',
      containerWidth: 'fluid'
    };

    res.json(layout);
  });

  router.put('/layout', authenticateToken, [
    body('layout').isObject()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let userTheme = userThemes.get(req.user.userId);
    
    if (!userTheme) {
      userTheme = {
        userId: req.user.userId,
        themeId: 'light',
        customizations: {},
        ...systemThemes.get('light')
      };
    }

    userTheme.layout = req.body.layout;
    userTheme.updatedAt = new Date().toISOString();

    userThemes.set(req.user.userId, userTheme);

    res.json(userTheme);
  });

  // Get available effects
  router.get('/effects', (req, res) => {
    const effects = [
      {
        id: 'animations',
        name: 'Animations',
        options: ['none', 'subtle', 'normal', 'enhanced']
      },
      {
        id: 'transitions',
        name: 'Transitions',
        options: ['none', 'fast', 'normal', 'slow']
      },
      {
        id: 'shadows',
        name: 'Shadows',
        options: ['none', 'subtle', 'normal', 'strong']
      },
      {
        id: 'blur',
        name: 'Background Blur',
        options: ['none', 'light', 'medium', 'heavy']
      }
    ];

    res.json(effects);
  });

  // Get/Set user effects preferences
  router.get('/effects/preferences', authenticateToken, (req, res) => {
    const userTheme = userThemes.get(req.user.userId);
    const effects = userTheme?.effects || {
      animations: 'normal',
      transitions: 'normal',
      shadows: 'normal',
      blur: 'light'
    };

    res.json(effects);
  });

  router.put('/effects/preferences', authenticateToken, [
    body('effects').isObject()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let userTheme = userThemes.get(req.user.userId);
    
    if (!userTheme) {
      userTheme = {
        userId: req.user.userId,
        themeId: 'light',
        customizations: {},
        ...systemThemes.get('light')
      };
    }

    userTheme.effects = req.body.effects;
    userTheme.updatedAt = new Date().toISOString();

    userThemes.set(req.user.userId, userTheme);

    res.json(userTheme);
  });

  // Reset to defaults
  router.post('/reset', authenticateToken, (req, res) => {
    userThemes.delete(req.user.userId);
    
    res.json({
      message: 'UI preferences reset to defaults',
      theme: systemThemes.get('light')
    });
  });

  return router;
};
