const express = require('express');
const router = express.Router();
const { Volunteer, VolunteerShift, VolunteerHours, VolunteerRecognition } = require('../models/Volunteer');
const { protect, authorize } = require('../middleware/auth');

// Volunteer Routes

// Get all volunteers
router.get('/', protect, async (req, res) => {
  try {
    const { status, skills, coordinator, page = 1, limit = 100 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (skills) query['skills.skill'] = { $in: skills.split(',') };
    if (coordinator) query.coordinator = coordinator;
    
    const volunteers = await Volunteer.find(query)
      .populate('userId', 'name email')
      .populate('coordinator', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Volunteer.countDocuments(query);
    
    res.json({
      volunteers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get volunteer by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('coordinator', 'name email');
    
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    
    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register volunteer
router.post('/', protect, async (req, res) => {
  try {
    const volunteer = new Volunteer({
      ...req.body,
      createdBy: req.user.userId
    });
    
    await volunteer.save();
    res.status(201).json(volunteer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update volunteer
router.put('/:id', protect, async (req, res) => {
  try {
    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    
    res.json(volunteer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update volunteer status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    const updateData = { status };
    if (status === 'approved') {
      updateData.approvedBy = req.user.userId;
      updateData.approvedDate = new Date();
    }
    
    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    
    res.json(volunteer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get total hours for volunteer
router.get('/:id/hours/total', protect, async (req, res) => {
  try {
    const result = await VolunteerHours.aggregate([
      { $match: { volunteerId: mongoose.Types.ObjectId(req.params.id), status: 'approved' } },
      { $group: { _id: null, totalHours: { $sum: '$hours' } } }
    ]);
    
    const totalHours = result.length > 0 ? result[0].totalHours : 0;
    
    // Update volunteer record
    await Volunteer.findByIdAndUpdate(req.params.id, { totalHours });
    
    res.json({ totalHours });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Shift Routes

// Get all shifts
router.get('/shifts', protect, async (req, res) => {
  try {
    const { status, startDate, endDate, coordinator, page = 1, limit = 100 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (coordinator) query.coordinator = coordinator;
    if (startDate || endDate) {
      query.shiftDate = {};
      if (startDate) query.shiftDate.$gte = new Date(startDate);
      if (endDate) query.shiftDate.$lte = new Date(endDate);
    }
    
    const shifts = await VolunteerShift.find(query)
      .populate('coordinator', 'name')
      .populate('volunteers.volunteerId', 'userId totalHours')
      .sort({ shiftDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await VolunteerShift.countDocuments(query);
    
    res.json({
      shifts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create shift
router.post('/shifts', protect, async (req, res) => {
  try {
    const shift = new VolunteerShift({
      ...req.body,
      coordinator: req.body.coordinator || req.user.userId,
      createdBy: req.user.userId
    });
    
    await shift.save();
    res.status(201).json(shift);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update shift
router.put('/shifts/:id', protect, async (req, res) => {
  try {
    const shift = await VolunteerShift.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    res.json(shift);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Volunteer signup for shift
router.post('/shifts/:id/signup', protect, async (req, res) => {
  try {
    const { volunteerId, role } = req.body;
    
    const shift = await VolunteerShift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    // Check if shift is full
    if (shift.maxVolunteers && shift.volunteers.length >= shift.maxVolunteers) {
      return res.status(400).json({ error: 'Shift is full' });
    }
    
    // Check if volunteer already signed up
    const alreadySignedUp = shift.volunteers.some(
      v => v.volunteerId.toString() === volunteerId
    );
    
    if (alreadySignedUp) {
      return res.status(400).json({ error: 'Volunteer already signed up for this shift' });
    }
    
    shift.volunteers.push({
      volunteerId,
      signupDate: new Date(),
      role,
      status: 'signed_up'
    });
    
    // Update isFull flag
    if (shift.maxVolunteers && shift.volunteers.length >= shift.maxVolunteers) {
      shift.isFull = true;
    }
    
    await shift.save();
    res.json(shift);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark shift attendance
router.patch('/shifts/:id/attendance', protect, async (req, res) => {
  try {
    const { volunteerId, checkInTime, checkOutTime, status } = req.body;
    
    const shift = await VolunteerShift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    const volunteerIndex = shift.volunteers.findIndex(
      v => v.volunteerId.toString() === volunteerId
    );
    
    if (volunteerIndex === -1) {
      return res.status(404).json({ error: 'Volunteer not found in shift' });
    }
    
    if (checkInTime) shift.volunteers[volunteerIndex].checkInTime = new Date(checkInTime);
    if (checkOutTime) shift.volunteers[volunteerIndex].checkOutTime = new Date(checkOutTime);
    if (status) shift.volunteers[volunteerIndex].status = status;
    
    // Calculate hours worked
    if (shift.volunteers[volunteerIndex].checkInTime && shift.volunteers[volunteerIndex].checkOutTime) {
      const hours = (new Date(shift.volunteers[volunteerIndex].checkOutTime) - 
                     new Date(shift.volunteers[volunteerIndex].checkInTime)) / (1000 * 60 * 60);
      shift.volunteers[volunteerIndex].hoursWorked = hours;
      
      // Automatically create hour record
      if (status === 'completed') {
        const hourRecord = new VolunteerHours({
          volunteerId,
          shiftId: shift._id,
          date: shift.shiftDate,
          startTime: shift.startTime,
          endTime: shift.endTime,
          hours,
          activity: shift.title,
          entryType: 'automatic',
          status: 'approved',
          approvedBy: req.user.userId,
          approvedDate: new Date(),
          createdBy: req.user.userId
        });
        await hourRecord.save();
      }
    }
    
    await shift.save();
    res.json(shift);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Hour Tracking Routes

// Get volunteer hours
router.get('/hours', protect, async (req, res) => {
  try {
    const { volunteerId, startDate, endDate, status, page = 1, limit = 100 } = req.query;
    
    const query = {};
    if (volunteerId) query.volunteerId = volunteerId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const hours = await VolunteerHours.find(query)
      .populate('volunteerId', 'userId')
      .populate('shiftId', 'title')
      .populate('approvedBy', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await VolunteerHours.countDocuments(query);
    
    res.json({
      hours,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log volunteer hours
router.post('/hours', protect, async (req, res) => {
  try {
    const hourRecord = new VolunteerHours({
      ...req.body,
      createdBy: req.user.userId
    });
    
    await hourRecord.save();
    res.status(201).json(hourRecord);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate hour reports
router.get('/hours/reports', protect, async (req, res) => {
  try {
    const { volunteerId, startDate, endDate, groupBy = 'volunteer' } = req.query;
    
    const matchQuery = { status: 'approved' };
    if (volunteerId) matchQuery.volunteerId = mongoose.Types.ObjectId(volunteerId);
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }
    
    let groupByField = '$volunteerId';
    if (groupBy === 'activity') groupByField = '$activity';
    if (groupBy === 'month') groupByField = { $dateToString: { format: '%Y-%m', date: '$date' } };
    
    const report = await VolunteerHours.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupByField,
          totalHours: { $sum: '$hours' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { totalHours: -1 } }
    ]);
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recognition Routes

// Get recognition awards
router.get('/recognition', protect, async (req, res) => {
  try {
    const { volunteerId, recognitionType, isPublic, page = 1, limit = 100 } = req.query;
    
    const query = {};
    if (volunteerId) query.volunteerId = volunteerId;
    if (recognitionType) query.recognitionType = recognitionType;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';
    
    const recognition = await VolunteerRecognition.find(query)
      .populate('volunteerId', 'userId totalHours')
      .populate('awardedBy', 'name')
      .sort({ awardDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await VolunteerRecognition.countDocuments(query);
    
    res.json({
      recognition,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create recognition
router.post('/recognition', protect, async (req, res) => {
  try {
    const recognition = new VolunteerRecognition({
      ...req.body,
      awardedBy: req.user.userId
    });
    
    await recognition.save();
    res.status(201).json(recognition);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get volunteer leaderboard
router.get('/recognition/leaderboard', protect, async (req, res) => {
  try {
    const { period = 'all', limit = 10 } = req.query;
    
    const matchQuery = { status: 'active' };
    
    const leaderboard = await Volunteer.find(matchQuery)
      .populate('userId', 'name')
      .sort({ totalHours: -1 })
      .limit(parseInt(limit))
      .select('userId totalHours shiftsCompleted');
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
