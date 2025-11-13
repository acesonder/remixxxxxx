const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');
const { protect, authorize } = require('../middleware/auth');

// Get appointments with filtering
router.get('/', protect, async (req, res) => {
  try {
    const { clientId, staffId, status, startDate, endDate, type } = req.query;
    let query = {};

    // Filter by user role
    if (req.user.role === 'client') {
      query.clientId = req.user._id;
    } else if (req.user.role !== 'admin') {
      query.$or = [
        { staffId: req.user._id },
        { clientId: req.user._id },
        { 'attendees.userId': req.user._id }
      ];
    }

    // Additional filters
    if (clientId) query.clientId = clientId;
    if (staffId) query.staffId = staffId;
    if (status) query.status = status;
    if (type) query.appointmentType = type;
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate('staffId', 'firstName lastName email')
      .populate('attendees.userId', 'firstName lastName')
      .sort({ startTime: 1 })
      .limit(100);

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get appointment by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('clientId', 'firstName lastName email phone')
      .populate('staffId', 'firstName lastName email phone')
      .populate('attendees.userId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions
    const isAuthorized = 
      req.user.role === 'admin' ||
      appointment.clientId._id.toString() === req.user._id.toString() ||
      appointment.staffId._id.toString() === req.user._id.toString() ||
      appointment.attendees.some(a => a.userId._id.toString() === req.user._id.toString());

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this appointment' });
    }

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new appointment
router.post('/', protect, authorize('admin', 'staff', 'worker', 'service_provider'), async (req, res) => {
  try {
    const appointmentData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Check for conflicts
    const conflicts = await Appointment.find({
      staffId: appointmentData.staffId,
      status: { $nin: ['cancelled', 'no_show'] },
      $or: [
        {
          startTime: { $lt: appointmentData.endTime },
          endTime: { $gt: appointmentData.startTime }
        }
      ]
    });

    if (conflicts.length > 0) {
      return res.status(400).json({ 
        message: 'Time slot conflicts with existing appointment',
        conflicts 
      });
    }

    const appointment = await Appointment.create(appointmentData);
    
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('clientId', 'firstName lastName email')
      .populate('staffId', 'firstName lastName email');

    res.status(201).json({ success: true, appointment: populatedAppointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update appointment
router.put('/:id', protect, authorize('admin', 'staff', 'worker', 'service_provider'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions
    const canUpdate = 
      req.user.role === 'admin' ||
      appointment.staffId.toString() === req.user._id.toString() ||
      appointment.createdBy.toString() === req.user._id.toString();

    if (!canUpdate) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('clientId staffId attendees.userId');

    res.json({ success: true, appointment: updatedAppointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel appointment
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions - client can cancel their own appointments
    const canCancel = 
      req.user.role === 'admin' ||
      appointment.clientId.toString() === req.user._id.toString() ||
      appointment.staffId.toString() === req.user._id.toString();

    if (!canCancel) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = req.body.reason || 'No reason provided';
    await appointment.save();

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete appointment
router.delete('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Availability routes

// Get staff availability
router.get('/availability/:userId', protect, async (req, res) => {
  try {
    const availability = await Availability.findOne({ userId: req.params.userId });

    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set/update availability
router.post('/availability', protect, authorize('admin', 'staff', 'worker', 'service_provider'), async (req, res) => {
  try {
    const availabilityData = {
      ...req.body,
      userId: req.body.userId || req.user._id
    };

    // Check permissions - can only set own availability unless admin
    if (req.user.role !== 'admin' && availabilityData.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot set availability for other users' });
    }

    let availability = await Availability.findOne({ userId: availabilityData.userId });

    if (availability) {
      availability = await Availability.findByIdAndUpdate(
        availability._id,
        availabilityData,
        { new: true, runValidators: true }
      );
    } else {
      availability = await Availability.create(availabilityData);
    }

    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get available time slots
router.get('/availability/:userId/slots', protect, async (req, res) => {
  try {
    const { date } = req.query; // Format: YYYY-MM-DD
    
    if (!date) {
      return res.status(400).json({ message: 'Date parameter required' });
    }

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();

    const availability = await Availability.findOne({ userId: req.params.userId });

    if (!availability) {
      return res.json({ success: true, slots: [] });
    }

    // Get regular schedule for the day
    const daySchedule = availability.regularSchedule.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!daySchedule) {
      return res.json({ success: true, slots: [] });
    }

    // Check for custom dates or blackouts
    const customDate = availability.customDates.find(cd => 
      cd.date.toDateString() === requestedDate.toDateString()
    );

    const isBlackedOut = availability.blackoutDates.some(bd => 
      requestedDate >= bd.startDate && requestedDate <= bd.endDate
    );

    if (isBlackedOut) {
      return res.json({ success: true, slots: [], message: 'Date is blacked out' });
    }

    const slots = customDate ? customDate.slots : daySchedule.slots;

    // Filter out booked slots
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      staffId: req.params.userId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled', 'no_show'] }
    });

    // Mark slots as booked
    const availableSlots = slots.map(slot => {
      const slotStart = new Date(requestedDate);
      const [startHour, startMinute] = slot.startTime.split(':');
      slotStart.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

      const slotEnd = new Date(requestedDate);
      const [endHour, endMinute] = slot.endTime.split(':');
      slotEnd.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

      const isBooked = bookedAppointments.some(apt => 
        (apt.startTime < slotEnd && apt.endTime > slotStart)
      );

      return {
        ...slot.toObject(),
        startDateTime: slotStart,
        endDateTime: slotEnd,
        isBooked
      };
    });

    res.json({ success: true, slots: availableSlots.filter(s => s.isAvailable && !s.isBooked) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
