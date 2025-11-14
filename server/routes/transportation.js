const express = require('express');
const router = express.Router();
const { Vehicle, RideRequest, Ride, Route } = require('../models/Transportation');
const { protect, authorize } = require('../middleware/auth');

// Vehicle Routes

// Get all vehicles
router.get('/vehicles', protect, async (req, res) => {
  try {
    const { status, vehicleType, page = 1, limit = 100 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (vehicleType) query.vehicleType = vehicleType;
    
    const vehicles = await Vehicle.find(query)
      .populate('assignedDriver', 'name phone')
      .sort({ vehicleNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Vehicle.countDocuments(query);
    
    res.json({
      vehicles,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vehicle by ID
router.get('/vehicles/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('assignedDriver', 'name phone email');
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create vehicle
router.post('/vehicles', protect, async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update vehicle
router.put('/vehicles/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ride Request Routes

// Get all ride requests
router.get('/requests', protect, async (req, res) => {
  try {
    const { status, clientId, pickupDate, page = 1, limit = 100 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (clientId) query.clientId = clientId;
    if (pickupDate) {
      const date = new Date(pickupDate);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      query.pickupDate = { $gte: date, $lt: nextDate };
    }
    
    const requests = await RideRequest.find(query)
      .populate('clientId', 'name phone')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ pickupDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await RideRequest.countDocuments(query);
    
    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create ride request
router.post('/requests', protect, async (req, res) => {
  try {
    // Generate unique request number
    const count = await RideRequest.countDocuments();
    const requestNumber = `REQ-${Date.now()}-${count + 1}`;
    
    const request = new RideRequest({
      ...req.body,
      requestNumber,
      requestedBy: req.user.userId
    });
    
    await request.save();
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update ride request
router.put('/requests/:id', protect, async (req, res) => {
  try {
    const request = await RideRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!request) {
      return res.status(404).json({ error: 'Ride request not found' });
    }
    
    res.json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Approve ride request
router.patch('/requests/:id/approve', protect, async (req, res) => {
  try {
    const request = await RideRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: req.user.userId,
        approvedDate: new Date()
      },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ error: 'Ride request not found' });
    }
    
    res.json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ride Routes

// Get all rides
router.get('/rides', protect, async (req, res) => {
  try {
    const { status, driverId, vehicleId, clientId, startDate, endDate, page = 1, limit = 100 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (driverId) query.driverId = driverId;
    if (vehicleId) query.vehicleId = vehicleId;
    if (clientId) query.clientId = clientId;
    if (startDate || endDate) {
      query.scheduledPickupTime = {};
      if (startDate) query.scheduledPickupTime.$gte = new Date(startDate);
      if (endDate) query.scheduledPickupTime.$lte = new Date(endDate);
    }
    
    const rides = await Ride.find(query)
      .populate('vehicleId', 'vehicleNumber vehicleType')
      .populate('driverId', 'name phone')
      .populate('clientId', 'name phone')
      .populate('requestId')
      .sort({ scheduledPickupTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Ride.countDocuments(query);
    
    res.json({
      rides,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create ride from request
router.post('/rides', protect, async (req, res) => {
  try {
    // Generate unique ride number
    const count = await Ride.countDocuments();
    const rideNumber = `RIDE-${Date.now()}-${count + 1}`;
    
    const ride = new Ride({
      ...req.body,
      rideNumber
    });
    
    await ride.save();
    
    // Update request status
    if (req.body.requestId) {
      await RideRequest.findByIdAndUpdate(req.body.requestId, {
        status: 'assigned',
        assignedRideId: ride._id
      });
    }
    
    res.status(201).json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update ride
router.put('/rides/:id', protect, async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    
    res.json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update ride status
router.patch('/rides/:id/status', protect, async (req, res) => {
  try {
    const { status, location } = req.body;
    
    const updateData = { status };
    
    // Update timestamps based on status
    if (status === 'driver_enroute') {
      // Driver is on the way to pick up
    } else if (status === 'passenger_picked_up') {
      updateData.actualPickupTime = new Date();
    } else if (status === 'completed') {
      updateData.actualDropoffTime = new Date();
      
      // Calculate total mileage
      const ride = await Ride.findById(req.params.id);
      if (ride && ride.startMileage && ride.endMileage) {
        updateData.totalMileage = ride.endMileage - ride.startMileage;
      }
    }
    
    // Update current location if provided
    if (location) {
      updateData.currentLocation = {
        ...location,
        lastUpdated: new Date()
      };
    }
    
    const ride = await Ride.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    
    res.json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update ride location (GPS tracking)
router.patch('/rides/:id/location', protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    const ride = await Ride.findById(req.params.id);
    
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    
    // Update current location
    ride.currentLocation = {
      latitude,
      longitude,
      lastUpdated: new Date()
    };
    
    // Add to actual route waypoints
    if (!ride.actualRoute) {
      ride.actualRoute = { waypoints: [] };
    }
    ride.actualRoute.waypoints.push({
      latitude,
      longitude,
      timestamp: new Date()
    });
    
    await ride.save();
    
    res.json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route Routes

// Get all routes
router.get('/routes', protect, async (req, res) => {
  try {
    const { status, driverId, routeDate, page = 1, limit = 100 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (driverId) query.driverId = driverId;
    if (routeDate) {
      const date = new Date(routeDate);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      query.routeDate = { $gte: date, $lt: nextDate };
    }
    
    const routes = await Route.find(query)
      .populate('vehicleId', 'vehicleNumber vehicleType')
      .populate('driverId', 'name phone')
      .populate('stops.rideId')
      .sort({ routeDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Route.countDocuments(query);
    
    res.json({
      routes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create route
router.post('/routes', protect, async (req, res) => {
  try {
    const route = new Route({
      ...req.body,
      createdBy: req.user.userId
    });
    
    await route.save();
    res.status(201).json(route);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Optimize route
router.post('/routes/:id/optimize', protect, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    // Simple optimization: sort stops by location proximity
    // In production, use a route optimization API like Google Maps or MapBox
    // This is a placeholder for the optimization logic
    
    route.isOptimized = true;
    route.optimizationScore = 85; // Placeholder score
    
    await route.save();
    
    res.json(route);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update route stop status
router.patch('/routes/:id/stops/:stopNumber', protect, async (req, res) => {
  try {
    const { status, actualTime } = req.body;
    
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    const stop = route.stops.find(s => s.stopNumber === parseInt(req.params.stopNumber));
    
    if (!stop) {
      return res.status(404).json({ error: 'Stop not found' });
    }
    
    if (status) stop.status = status;
    if (actualTime) stop.actualTime = new Date(actualTime);
    
    await route.save();
    
    res.json(route);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
