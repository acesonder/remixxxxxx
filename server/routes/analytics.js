const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Dashboard = require('../models/Dashboard');
const Assessment = require('../models/Assessment');
const CaseManagement = require('../models/CaseManagement');
const User = require('../models/User');
const Incident = require('../models/Incident');
const { protect, authorize } = require('../middleware/auth');

// Get all reports
router.get('/reports', protect, authorize('admin', 'staff', 'service_provider'), async (req, res) => {
  try {
    const { category, isTemplate, search } = req.query;
    let query = {};

    // Only show user's reports or public/template reports
    if (req.user.role !== 'admin') {
      query.$or = [
        { createdBy: req.user._id },
        { isPublic: true },
        { isTemplate: true }
      ];
    }

    if (category) query.category = category;
    if (isTemplate !== undefined) query.isTemplate = isTemplate === 'true';
    if (search) {
      query.$text = { $search: search };
    }

    const reports = await Report.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get report by ID
router.get('/reports/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('schedule.recipients', 'firstName lastName email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check permissions
    if (!report.isPublic && 
        report.createdBy._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this report' });
    }

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new report
router.post('/reports', protect, authorize('admin', 'staff', 'service_provider'), async (req, res) => {
  try {
    const reportData = {
      ...req.body,
      createdBy: req.user._id
    };

    const report = await Report.create(reportData);
    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update report
router.put('/reports/:id', protect, authorize('admin', 'staff', 'service_provider'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check permissions
    if (report.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this report' });
    }

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, report: updatedReport });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate report data
router.post('/reports/:id/generate', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check permissions
    if (!report.isPublic && 
        report.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to generate this report' });
    }

    // Generate report based on configuration
    let data;
    const { dataSource, filters } = report.configuration;

    switch (dataSource) {
      case 'assessments':
        data = await generateAssessmentReport(filters);
        break;
      case 'cases':
        data = await generateCaseReport(filters);
        break;
      case 'users':
        data = await generateUserReport(filters);
        break;
      case 'incidents':
        data = await generateIncidentReport(filters);
        break;
      default:
        data = { message: 'Data source not implemented' };
    }

    // Update report with generated data
    report.generatedData = {
      lastGenerated: new Date(),
      data: data,
      recordCount: Array.isArray(data) ? data.length : 0
    };
    await report.save();

    res.json({ success: true, data, recordCount: report.generatedData.recordCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export report
router.get('/reports/:id/export', protect, async (req, res) => {
  try {
    const { format } = req.query; // csv, excel, pdf
    const report = await Report.findById(req.params.id);

    if (!report || !report.generatedData || !report.generatedData.data) {
      return res.status(404).json({ message: 'Report data not found. Generate report first.' });
    }

    // Check permissions
    if (!report.isPublic && 
        report.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to export this report' });
    }

    // For now, return JSON. In production, implement actual export formats
    res.json({ 
      success: true, 
      format: format || 'json',
      data: report.generatedData.data,
      message: 'Export functionality - implement with libraries like csv-writer, exceljs, pdfkit'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete report
router.delete('/reports/:id', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check permissions
    if (report.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard routes

// Get user's dashboards
router.get('/dashboards', protect, async (req, res) => {
  try {
    const query = { userId: req.user._id };
    
    const dashboards = await Dashboard.find(query).sort({ isDefault: -1, createdAt: -1 });

    res.json({ success: true, dashboards });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard by ID
router.get('/dashboards/:id', protect, async (req, res) => {
  try {
    const dashboard = await Dashboard.findById(req.params.id);

    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }

    // Check permissions
    if (dashboard.userId.toString() !== req.user._id.toString() && 
        !dashboard.isPublic &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this dashboard' });
    }

    // Update last accessed
    dashboard.lastAccessed = new Date();
    await dashboard.save();

    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create dashboard
router.post('/dashboards', protect, async (req, res) => {
  try {
    const dashboardData = {
      ...req.body,
      userId: req.user._id
    };

    const dashboard = await Dashboard.create(dashboardData);
    res.status(201).json({ success: true, dashboard });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update dashboard
router.put('/dashboards/:id', protect, async (req, res) => {
  try {
    const dashboard = await Dashboard.findById(req.params.id);

    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }

    // Check permissions
    if (dashboard.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this dashboard' });
    }

    const updatedDashboard = await Dashboard.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, dashboard: updatedDashboard });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete dashboard
router.delete('/dashboards/:id', protect, async (req, res) => {
  try {
    const dashboard = await Dashboard.findById(req.params.id);

    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }

    // Check permissions
    if (dashboard.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this dashboard' });
    }

    await Dashboard.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Dashboard deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper functions for generating reports

async function generateAssessmentReport(filters) {
  const query = {};
  
  if (filters.dateRange) {
    query.createdAt = {
      $gte: new Date(filters.dateRange.start),
      $lte: new Date(filters.dateRange.end)
    };
  }

  if (filters.status) {
    query.status = { $in: filters.status };
  }

  const assessments = await Assessment.find(query)
    .populate('clientId', 'firstName lastName')
    .populate('assessorId', 'firstName lastName')
    .select('assessmentType title score status createdAt')
    .lean();

  return assessments;
}

async function generateCaseReport(filters) {
  const query = {};
  
  if (filters.dateRange) {
    query.createdAt = {
      $gte: new Date(filters.dateRange.start),
      $lte: new Date(filters.dateRange.end)
    };
  }

  if (filters.status) {
    query.status = { $in: filters.status };
  }

  const cases = await CaseManagement.find(query)
    .populate('clientId', 'firstName lastName')
    .populate('caseManagerId', 'firstName lastName')
    .select('caseNumber status priority createdAt')
    .lean();

  return cases;
}

async function generateUserReport(filters) {
  const query = {};
  
  if (filters.roles) {
    query.role = { $in: filters.roles };
  }

  if (filters.dateRange) {
    query.createdAt = {
      $gte: new Date(filters.dateRange.start),
      $lte: new Date(filters.dateRange.end)
    };
  }

  const users = await User.find(query)
    .select('firstName lastName email role isActive createdAt lastLogin')
    .lean();

  return users;
}

async function generateIncidentReport(filters) {
  const query = {};
  
  if (filters.dateRange) {
    query.incidentDate = {
      $gte: new Date(filters.dateRange.start),
      $lte: new Date(filters.dateRange.end)
    };
  }

  if (filters.status) {
    query.status = { $in: filters.status };
  }

  const incidents = await Incident.find(query)
    .populate('reportedBy', 'firstName lastName')
    .select('incidentNumber title incidentType severity status incidentDate')
    .lean();

  return incidents;
}

module.exports = router;
