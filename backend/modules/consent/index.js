const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

// In-memory storage
const consentTemplates = new Map();
const userConsents = new Map(); // userId -> [consents]

// Initialize default templates
consentTemplates.set('terms', {
  id: 'terms',
  name: 'Terms of Service',
  version: '1.0.0',
  content: 'Terms of service content goes here...',
  required: true,
  createdAt: new Date().toISOString()
});

consentTemplates.set('privacy', {
  id: 'privacy',
  name: 'Privacy Policy',
  version: '1.0.0',
  content: 'Privacy policy content goes here...',
  required: true,
  createdAt: new Date().toISOString()
});

module.exports = (io, moduleManager) => {
  const { authenticateToken } = require('../auth');

  // Get all consent templates
  router.get('/templates', (req, res) => {
    res.json(Array.from(consentTemplates.values()));
  });

  // Get specific template
  router.get('/templates/:templateId', (req, res) => {
    const { templateId } = req.params;
    const template = consentTemplates.get(templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  });

  // Create/Update consent template (admin)
  router.post('/templates', authenticateToken, [
    body('id').isString().notEmpty(),
    body('name').isString().notEmpty(),
    body('content').isString().notEmpty(),
    body('version').isString().notEmpty(),
    body('required').isBoolean()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id, name, content, version, required } = req.body;

    const template = {
      id,
      name,
      content,
      version,
      required,
      createdAt: consentTemplates.has(id) 
        ? consentTemplates.get(id).createdAt 
        : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    consentTemplates.set(id, template);

    res.status(201).json(template);
  });

  // Get user's consent records
  router.get('/user', authenticateToken, (req, res) => {
    const consents = userConsents.get(req.user.userId) || [];
    res.json(consents);
  });

  // Record user consent
  router.post('/accept', authenticateToken, [
    body('templateId').isString().notEmpty()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { templateId } = req.body;
    const template = consentTemplates.get(templateId);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (!userConsents.has(req.user.userId)) {
      userConsents.set(req.user.userId, []);
    }

    const consent = {
      id: uuidv4(),
      userId: req.user.userId,
      templateId: template.id,
      templateVersion: template.version,
      acceptedAt: new Date().toISOString(),
      ipAddress: req.ip
    };

    userConsents.get(req.user.userId).push(consent);

    res.status(201).json(consent);
  });

  // Check if user has accepted required consents
  router.get('/status', authenticateToken, (req, res) => {
    const requiredTemplates = Array.from(consentTemplates.values())
      .filter(t => t.required);
    
    const userConsentRecords = userConsents.get(req.user.userId) || [];
    
    const status = requiredTemplates.map(template => {
      const consent = userConsentRecords.find(c => 
        c.templateId === template.id && c.templateVersion === template.version
      );

      return {
        templateId: template.id,
        templateName: template.name,
        version: template.version,
        required: template.required,
        accepted: !!consent,
        acceptedAt: consent?.acceptedAt
      };
    });

    const allRequired = status
      .filter(s => s.required)
      .every(s => s.accepted);

    res.json({
      allRequiredAccepted: allRequired,
      consents: status
    });
  });

  // Withdraw consent
  router.post('/withdraw/:templateId', authenticateToken, (req, res) => {
    const { templateId } = req.params;
    
    if (!userConsents.has(req.user.userId)) {
      return res.status(404).json({ error: 'No consents found' });
    }

    const consents = userConsents.get(req.user.userId);
    const index = consents.findIndex(c => c.templateId === templateId);

    if (index === -1) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    const withdrawal = {
      id: uuidv4(),
      userId: req.user.userId,
      templateId,
      withdrawnAt: new Date().toISOString()
    };

    consents.splice(index, 1);

    res.json({
      message: 'Consent withdrawn',
      withdrawal
    });
  });

  return router;
};
