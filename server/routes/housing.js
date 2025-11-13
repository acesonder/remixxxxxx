const express = require('express');
const router = express.Router();
const { HousingUnit, HousingApplication, Lease, Waitlist } = require('../models/Housing');
const auth = require('../middleware/auth');

// Housing Unit Routes

// Get all housing units
router.get('/units', auth, async (req, res) => {
  try {
    const { status, unitType, accessibility, page = 1, limit = 100 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (unitType) query.unitType = unitType;
    if (accessibility) {
      query[`accessibility.${accessibility}`] = true;
    }
    
    const units = await HousingUnit.find(query)
      .populate('currentLeaseId')
      .sort({ unitNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await HousingUnit.countDocuments(query);
    
    res.json({
      units,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unit by ID
router.get('/units/:id', auth, async (req, res) => {
  try {
    const unit = await HousingUnit.findById(req.params.id)
      .populate('currentLeaseId');
    
    if (!unit) {
      return res.status(404).json({ error: 'Housing unit not found' });
    }
    
    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create housing unit
router.post('/units', auth, async (req, res) => {
  try {
    const unit = new HousingUnit(req.body);
    await unit.save();
    res.status(201).json(unit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update housing unit
router.put('/units/:id', auth, async (req, res) => {
  try {
    const unit = await HousingUnit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!unit) {
      return res.status(404).json({ error: 'Housing unit not found' });
    }
    
    res.json(unit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get available units
router.get('/units/available/list', auth, async (req, res) => {
  try {
    const { unitType, bedrooms, maxRent } = req.query;
    
    const query = { status: 'available' };
    if (unitType) query.unitType = unitType;
    if (bedrooms) query.bedrooms = { $gte: parseInt(bedrooms) };
    if (maxRent) query.rent = { $lte: parseFloat(maxRent) };
    
    const units = await HousingUnit.find(query).sort({ rent: 1 });
    
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Housing Application Routes

// Get all applications
router.get('/applications', auth, async (req, res) => {
  try {
    const { status, applicantId, priority, page = 1, limit = 100 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (applicantId) query.applicantId = applicantId;
    if (priority) query.priority = priority;
    
    const applications = await HousingApplication.find(query)
      .populate('applicantId', 'name email phone')
      .populate('reviewedBy', 'name')
      .sort({ priority: -1, applicationDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await HousingApplication.countDocuments(query);
    
    res.json({
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create housing application
router.post('/applications', auth, async (req, res) => {
  try {
    // Generate unique application number
    const count = await HousingApplication.countDocuments();
    const applicationNumber = `APP-${Date.now()}-${count + 1}`;
    
    const application = new HousingApplication({
      ...req.body,
      applicationNumber
    });
    
    await application.save();
    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update housing application
router.put('/applications/:id', auth, async (req, res) => {
  try {
    const application = await HousingApplication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Approve/Deny application
router.patch('/applications/:id/review', auth, async (req, res) => {
  try {
    const { status, reviewNotes, denialReason } = req.body;
    
    const updateData = {
      status,
      reviewedBy: req.user.userId,
      reviewedDate: new Date(),
      reviewNotes
    };
    
    if (status === 'approved') {
      updateData.approvedBy = req.user.userId;
      updateData.approvedDate = new Date();
    } else if (status === 'denied') {
      updateData.denialReason = denialReason;
    }
    
    const application = await HousingApplication.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Lease Routes

// Get all leases
router.get('/leases', auth, async (req, res) => {
  try {
    const { status, unitId, tenantId, page = 1, limit = 100 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (unitId) query.unitId = unitId;
    if (tenantId) query.primaryTenantId = tenantId;
    
    const leases = await Lease.find(query)
      .populate('unitId', 'unitNumber property')
      .populate('primaryTenantId', 'name email phone')
      .sort({ startDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Lease.countDocuments(query);
    
    res.json({
      leases,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create lease
router.post('/leases', auth, async (req, res) => {
  try {
    // Generate unique lease number
    const count = await Lease.countDocuments();
    const leaseNumber = `LEASE-${Date.now()}-${count + 1}`;
    
    const lease = new Lease({
      ...req.body,
      leaseNumber,
      createdBy: req.user.userId
    });
    
    await lease.save();
    
    // Update unit status and current lease
    await HousingUnit.findByIdAndUpdate(req.body.unitId, {
      status: 'occupied',
      currentLeaseId: lease._id,
      currentOccupancy: 1 + (req.body.coTenants ? req.body.coTenants.length : 0)
    });
    
    res.status(201).json(lease);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update lease
router.put('/leases/:id', auth, async (req, res) => {
  try {
    const lease = await Lease.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }
    
    res.json(lease);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Terminate lease
router.patch('/leases/:id/terminate', auth, async (req, res) => {
  try {
    const { terminationReason, terminatedBy, moveOutDate } = req.body;
    
    const lease = await Lease.findByIdAndUpdate(
      req.params.id,
      {
        status: 'terminated',
        terminationDate: new Date(),
        terminationReason,
        terminatedBy,
        moveOutDate
      },
      { new: true }
    );
    
    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }
    
    // Update unit status
    await HousingUnit.findByIdAndUpdate(lease.unitId, {
      status: 'available',
      currentLeaseId: null,
      currentOccupancy: 0
    });
    
    res.json(lease);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get expiring leases
router.get('/leases/expiring/soon', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + parseInt(days));
    
    const leases = await Lease.find({
      status: 'active',
      endDate: { $gte: now, $lte: futureDate }
    })
      .populate('unitId', 'unitNumber')
      .populate('primaryTenantId', 'name email phone')
      .sort({ endDate: 1 });
    
    res.json(leases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Waitlist Routes

// Get waitlist
router.get('/waitlist', auth, async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 100 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    const waitlist = await Waitlist.find(query)
      .populate('applicantId', 'name email phone')
      .populate('applicationId')
      .sort({ priority: -1, priorityPoints: -1, position: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Waitlist.countDocuments(query);
    
    res.json({
      waitlist,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to waitlist
router.post('/waitlist', auth, async (req, res) => {
  try {
    // Calculate position
    const count = await Waitlist.countDocuments({ status: 'active' });
    
    const waitlistEntry = new Waitlist({
      ...req.body,
      position: count + 1
    });
    
    await waitlistEntry.save();
    res.status(201).json(waitlistEntry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update waitlist entry
router.put('/waitlist/:id', auth, async (req, res) => {
  try {
    const entry = await Waitlist.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!entry) {
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Make housing offer
router.post('/waitlist/:id/offer', auth, async (req, res) => {
  try {
    const { unitId, expirationDate } = req.body;
    
    const entry = await Waitlist.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }
    
    entry.offers.push({
      unitId,
      offerDate: new Date(),
      expirationDate,
      status: 'pending'
    });
    
    entry.status = 'offered';
    
    await entry.save();
    
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
