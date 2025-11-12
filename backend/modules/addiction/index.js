const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

// In-memory storage
const recoveryPlans = new Map();
const supportGroups = new Map();
const crisisResources = new Map();
const checkIns = new Map();

// Initialize default support groups
const defaultGroups = [
  {
    id: 'aa-downtown',
    name: 'AA Downtown Meeting',
    type: 'AA',
    schedule: 'Monday, Wednesday, Friday 7:00 PM',
    location: 'Community Center Room 101',
    contact: '555-0200',
    virtual: false
  },
  {
    id: 'na-online',
    name: 'NA Online Support',
    type: 'NA',
    schedule: 'Daily 8:00 PM',
    location: 'Virtual - Zoom',
    link: 'https://zoom.example.com/meeting',
    virtual: true
  }
];

defaultGroups.forEach(g => supportGroups.set(g.id, g));

// Initialize crisis resources
const defaultCrisisResources = [
  {
    id: 'crisis-hotline',
    name: 'Crisis Hotline',
    type: 'hotline',
    phone: '1-800-555-0100',
    available: '24/7',
    description: 'Immediate crisis support'
  },
  {
    id: 'emergency-services',
    name: 'Emergency Services',
    type: 'emergency',
    phone: '911',
    available: '24/7',
    description: 'Medical emergencies'
  }
];

defaultCrisisResources.forEach(r => crisisResources.set(r.id, r));

module.exports = (io, moduleManager) => {
  const { authenticateToken } = require('../auth');

  // Create recovery plan
  router.post('/recovery-plans', authenticateToken, [
    body('goals').isArray({ min: 1 }),
    body('startDate').isString()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { goals, startDate, supportSystem, triggers, copingStrategies } = req.body;
    const planId = uuidv4();

    const plan = {
      id: planId,
      userId: req.user.userId,
      goals: goals.map(g => ({ ...g, id: uuidv4(), completed: false })),
      startDate,
      supportSystem: supportSystem || [],
      triggers: triggers || [],
      copingStrategies: copingStrategies || [],
      status: 'active',
      createdAt: new Date().toISOString(),
      milestones: []
    };

    if (!recoveryPlans.has(req.user.userId)) {
      recoveryPlans.set(req.user.userId, []);
    }

    recoveryPlans.get(req.user.userId).push(plan);

    res.status(201).json(plan);
  });

  // Get user's recovery plans
  router.get('/recovery-plans', authenticateToken, (req, res) => {
    const plans = recoveryPlans.get(req.user.userId) || [];
    res.json(plans);
  });

  // Update recovery plan
  router.put('/recovery-plans/:planId', authenticateToken, (req, res) => {
    const { planId } = req.params;
    const plans = recoveryPlans.get(req.user.userId) || [];
    const plan = plans.find(p => p.id === planId);

    if (!plan) {
      return res.status(404).json({ error: 'Recovery plan not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id' && key !== 'userId') {
        plan[key] = updates[key];
      }
    });

    plan.updatedAt = new Date().toISOString();

    res.json(plan);
  });

  // Complete goal
  router.post('/recovery-plans/:planId/goals/:goalId/complete', authenticateToken, (req, res) => {
    const { planId, goalId } = req.params;
    const plans = recoveryPlans.get(req.user.userId) || [];
    const plan = plans.find(p => p.id === planId);

    if (!plan) {
      return res.status(404).json({ error: 'Recovery plan not found' });
    }

    const goal = plan.goals.find(g => g.id === goalId);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    goal.completed = true;
    goal.completedAt = new Date().toISOString();

    // Add milestone
    plan.milestones.push({
      id: uuidv4(),
      type: 'goal_completed',
      description: `Completed goal: ${goal.description || goal.name}`,
      date: new Date().toISOString()
    });

    res.json(plan);
  });

  // Daily check-in
  router.post('/check-ins', authenticateToken, [
    body('moodRating').isNumeric().isInt({ min: 1, max: 10 }),
    body('cravingLevel').optional().isNumeric().isInt({ min: 0, max: 10 })
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { moodRating, cravingLevel, notes, triggersExperienced, strategiesUsed } = req.body;
    const checkInId = uuidv4();

    const checkIn = {
      id: checkInId,
      userId: req.user.userId,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      moodRating,
      cravingLevel: cravingLevel || 0,
      notes,
      triggersExperienced: triggersExperienced || [],
      strategiesUsed: strategiesUsed || []
    };

    if (!checkIns.has(req.user.userId)) {
      checkIns.set(req.user.userId, []);
    }

    checkIns.get(req.user.userId).push(checkIn);

    res.status(201).json(checkIn);
  });

  // Get check-in history
  router.get('/check-ins', authenticateToken, (req, res) => {
    const { startDate, endDate } = req.query;
    let userCheckIns = checkIns.get(req.user.userId) || [];

    if (startDate) {
      userCheckIns = userCheckIns.filter(c => c.date >= startDate);
    }

    if (endDate) {
      userCheckIns = userCheckIns.filter(c => c.date <= endDate);
    }

    res.json(userCheckIns);
  });

  // Get support groups
  router.get('/support-groups', authenticateToken, (req, res) => {
    const { type, virtual } = req.query;
    let groups = Array.from(supportGroups.values());

    if (type) {
      groups = groups.filter(g => g.type === type);
    }

    if (virtual !== undefined) {
      groups = groups.filter(g => g.virtual === (virtual === 'true'));
    }

    res.json(groups);
  });

  // Add support group
  router.post('/support-groups', authenticateToken, [
    body('name').isString().notEmpty(),
    body('type').isString().notEmpty(),
    body('schedule').isString()
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const groupId = uuidv4();
    const group = {
      id: groupId,
      ...req.body,
      createdAt: new Date().toISOString()
    };

    supportGroups.set(groupId, group);

    res.status(201).json(group);
  });

  // Get crisis resources
  router.get('/crisis-resources', (req, res) => {
    res.json(Array.from(crisisResources.values()));
  });

  // Emergency alert (triggers notification)
  router.post('/emergency-alert', authenticateToken, [
    body('message').optional().isString()
  ], async (req, res) => {
    const { message } = req.body;

    // Log the alert
    const alertId = uuidv4();
    const alert = {
      id: alertId,
      userId: req.user.userId,
      message: message || 'User triggered emergency alert',
      timestamp: new Date().toISOString(),
      resources: Array.from(crisisResources.values())
    };

    // In production, this would:
    // 1. Notify emergency contacts
    // 2. Alert support team
    // 3. Send crisis resources
    
    console.log(`Emergency alert from user ${req.user.userId}`);

    res.json({
      message: 'Emergency alert sent',
      alert,
      immediateResources: Array.from(crisisResources.values())
    });
  });

  // Get recovery statistics
  router.get('/statistics', authenticateToken, (req, res) => {
    const plans = recoveryPlans.get(req.user.userId) || [];
    const userCheckIns = checkIns.get(req.user.userId) || [];

    const activePlan = plans.find(p => p.status === 'active');
    const totalGoals = activePlan?.goals.length || 0;
    const completedGoals = activePlan?.goals.filter(g => g.completed).length || 0;

    // Calculate streaks
    const sortedCheckIns = [...userCheckIns].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    let currentStreak = 0;
    let today = new Date().toISOString().split('T')[0];
    
    for (const checkIn of sortedCheckIns) {
      if (checkIn.date === today) {
        currentStreak++;
        today = new Date(new Date(today).setDate(new Date(today).getDate() - 1))
          .toISOString().split('T')[0];
      } else {
        break;
      }
    }

    const stats = {
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.status === 'active').length,
      goalsProgress: totalGoals > 0 ? (completedGoals / totalGoals * 100).toFixed(1) : 0,
      totalCheckIns: userCheckIns.length,
      currentStreak,
      averageMood: userCheckIns.length > 0
        ? (userCheckIns.reduce((sum, c) => sum + c.moodRating, 0) / userCheckIns.length).toFixed(1)
        : 0,
      averageCravingLevel: userCheckIns.length > 0
        ? (userCheckIns.reduce((sum, c) => sum + c.cravingLevel, 0) / userCheckIns.length).toFixed(1)
        : 0
    };

    res.json(stats);
  });

  return router;
};
