const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

// In-memory storage
const cases = new Map();
const resources = new Map();
const outreachLogs = new Map();

// Initialize default resources
const defaultResources = [
  {
    id: 'shelter-1',
    name: 'Downtown Emergency Shelter',
    type: 'shelter',
    address: '123 Main St',
    phone: '555-0100',
    capacity: 50,
    currentOccupancy: 35,
    services: ['beds', 'meals', 'showers'],
    available: true
  },
  {
    id: 'food-bank-1',
    name: 'Community Food Bank',
    type: 'food',
    address: '456 Oak Ave',
    phone: '555-0101',
    hours: 'Mon-Fri 9am-5pm',
    services: ['food-boxes', 'hot-meals'],
    available: true
  }
];

defaultResources.forEach(r => resources.set(r.id, r));

module.exports = (io, moduleManager) => {
  const { authenticateToken } = require('../auth');

  // Create new case
  router.post('/cases', authenticateToken, [
    body('clientName').isString().notEmpty(),
    body('age').optional().isNumeric(),
    body('location').optional().isString(),
    body('status').optional().isString()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clientName, age, gender, location, phone, notes, status } = req.body;
    const caseId = uuidv4();

    const caseData = {
      id: caseId,
      clientName,
      age,
      gender,
      location,
      phone,
      notes,
      status: status || 'active',
      assignedTo: req.user.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: []
    };

    cases.set(caseId, caseData);

    res.status(201).json(caseData);
  });

  // Get all cases
  router.get('/cases', authenticateToken, (req, res) => {
    const { status, assignedTo } = req.query;
    let allCases = Array.from(cases.values());

    if (status) {
      allCases = allCases.filter(c => c.status === status);
    }

    if (assignedTo) {
      allCases = allCases.filter(c => c.assignedTo === assignedTo);
    }

    res.json(allCases);
  });

  // Get specific case
  router.get('/cases/:caseId', authenticateToken, (req, res) => {
    const { caseId } = req.params;
    const caseData = cases.get(caseId);

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json(caseData);
  });

  // Update case
  router.put('/cases/:caseId', authenticateToken, (req, res) => {
    const { caseId } = req.params;
    const caseData = cases.get(caseId);

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const updates = req.body;
    const previousState = { ...caseData };

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id' && key !== 'history') {
        caseData[key] = updates[key];
      }
    });

    caseData.updatedAt = new Date().toISOString();
    caseData.history.push({
      updatedAt: caseData.updatedAt,
      updatedBy: req.user.userId,
      changes: updates
    });

    res.json(caseData);
  });

  // Add case note
  router.post('/cases/:caseId/notes', authenticateToken, [
    body('note').isString().notEmpty()
  ], (req, res) => {
    const { caseId } = req.params;
    const { note } = req.body;
    const caseData = cases.get(caseId);

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (!caseData.notes) caseData.notes = [];
    
    const noteEntry = {
      id: uuidv4(),
      note,
      addedBy: req.user.userId,
      addedAt: new Date().toISOString()
    };

    caseData.notes.push(noteEntry);
    caseData.updatedAt = new Date().toISOString();

    res.status(201).json(noteEntry);
  });

  // Log outreach activity
  router.post('/outreach', authenticateToken, [
    body('caseId').optional().isString(),
    body('location').isString().notEmpty(),
    body('activity').isString().notEmpty()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { caseId, location, activity, notes, contactsMade } = req.body;
    const logId = uuidv4();

    const log = {
      id: logId,
      caseId,
      location,
      activity,
      notes,
      contactsMade: contactsMade || 0,
      performedBy: req.user.userId,
      timestamp: new Date().toISOString()
    };

    if (!outreachLogs.has(req.user.userId)) {
      outreachLogs.set(req.user.userId, []);
    }

    outreachLogs.get(req.user.userId).push(log);

    res.status(201).json(log);
  });

  // Get outreach logs
  router.get('/outreach', authenticateToken, (req, res) => {
    const { startDate, endDate, caseId } = req.query;
    let logs = outreachLogs.get(req.user.userId) || [];

    if (caseId) {
      logs = logs.filter(l => l.caseId === caseId);
    }

    if (startDate) {
      logs = logs.filter(l => new Date(l.timestamp) >= new Date(startDate));
    }

    if (endDate) {
      logs = logs.filter(l => new Date(l.timestamp) <= new Date(endDate));
    }

    res.json(logs);
  });

  // Get resources
  router.get('/resources', authenticateToken, (req, res) => {
    const { type, available } = req.query;
    let allResources = Array.from(resources.values());

    if (type) {
      allResources = allResources.filter(r => r.type === type);
    }

    if (available !== undefined) {
      allResources = allResources.filter(r => r.available === (available === 'true'));
    }

    res.json(allResources);
  });

  // Add resource
  router.post('/resources', authenticateToken, [
    body('name').isString().notEmpty(),
    body('type').isString().notEmpty(),
    body('address').optional().isString()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const resourceId = uuidv4();
    const resource = {
      id: resourceId,
      ...req.body,
      available: true,
      createdAt: new Date().toISOString()
    };

    resources.set(resourceId, resource);

    res.status(201).json(resource);
  });

  // Update resource
  router.put('/resources/:resourceId', authenticateToken, (req, res) => {
    const { resourceId } = req.params;
    const resource = resources.get(resourceId);

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'id') {
        resource[key] = req.body[key];
      }
    });

    resource.updatedAt = new Date().toISOString();

    res.json(resource);
  });

  // Get statistics
  router.get('/statistics', authenticateToken, (req, res) => {
    const allCases = Array.from(cases.values());
    const userLogs = outreachLogs.get(req.user.userId) || [];

    const stats = {
      totalCases: allCases.length,
      activeCases: allCases.filter(c => c.status === 'active').length,
      closedCases: allCases.filter(c => c.status === 'closed').length,
      totalOutreach: userLogs.length,
      totalContacts: userLogs.reduce((sum, log) => sum + (log.contactsMade || 0), 0),
      resourcesByType: {}
    };

    Array.from(resources.values()).forEach(r => {
      if (!stats.resourcesByType[r.type]) {
        stats.resourcesByType[r.type] = 0;
      }
      stats.resourcesByType[r.type]++;
    });

    res.json(stats);
  });

  return router;
};
