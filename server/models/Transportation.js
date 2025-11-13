const mongoose = require('mongoose');

// Vehicle Model
const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    unique: true
  },
  vehicleType: {
    type: String,
    enum: ['sedan', 'suv', 'van', 'bus', 'wheelchair_accessible', 'other'],
    required: true
  },
  make: String,
  model: String,
  year: Number,
  licensePlate: String,
  vin: String,
  // Capacity
  passengerCapacity: {
    type: Number,
    required: true
  },
  wheelchairCapacity: {
    type: Number,
    default: 0
  },
  // Status
  status: {
    type: String,
    enum: ['available', 'in_use', 'maintenance', 'out_of_service'],
    default: 'available'
  },
  // Specifications
  features: [String], // GPS, AC, wheelchair_lift, etc.
  fuelType: { type: String, enum: ['gasoline', 'diesel', 'electric', 'hybrid'] },
  color: String,
  // Maintenance
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  maintenanceMileage: Number,
  currentMileage: Number,
  // Insurance & Registration
  insuranceProvider: String,
  insurancePolicyNumber: String,
  insuranceExpirationDate: Date,
  registrationExpirationDate: Date,
  // Assignment
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  homeLocation: {
    address: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  notes: String
}, {
  timestamps: true
});

// Indexes
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ assignedDriver: 1 });

// Ride Request Model
const rideRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    required: true,
    unique: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Trip Details
  rideType: {
    type: String,
    enum: ['one_way', 'round_trip', 'recurring'],
    required: true
  },
  purpose: {
    type: String,
    enum: ['medical', 'work', 'shopping', 'social', 'education', 'other'],
    required: true
  },
  // Pickup
  pickupLocation: {
    address: {
      type: String,
      required: true
    },
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    instructions: String
  },
  pickupDate: {
    type: Date,
    required: true
  },
  pickupTime: {
    type: String,
    required: true
  },
  // Dropoff
  dropoffLocation: {
    address: {
      type: String,
      required: true
    },
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    instructions: String
  },
  appointmentTime: String,
  estimatedDuration: Number, // minutes
  // Return trip (for round trips)
  returnPickupTime: String,
  returnPickupLocation: String,
  // Passenger Details
  passengerCount: {
    type: Number,
    default: 1
  },
  wheelchairNeeded: {
    type: Boolean,
    default: false
  },
  specialNeeds: [String],
  accompaniedBy: String,
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'assigned', 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  // Assignment
  assignedRideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride'
  },
  // Recurring
  isRecurring: Boolean,
  recurrencePattern: {
    frequency: String, // daily, weekly, monthly
    daysOfWeek: [Number],
    endDate: Date
  },
  // Administrative
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: Date,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  notes: String,
  cancellationReason: String
}, {
  timestamps: true
});

// Indexes
rideRequestSchema.index({ clientId: 1, pickupDate: 1 });
rideRequestSchema.index({ status: 1 });
rideRequestSchema.index({ pickupDate: 1 });

// Ride Model (Scheduled/Completed Rides)
const rideSchema = new mongoose.Schema({
  rideNumber: {
    type: String,
    required: true,
    unique: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RideRequest',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Schedule
  scheduledPickupTime: {
    type: Date,
    required: true
  },
  scheduledDropoffTime: Date,
  // Actual Times
  actualPickupTime: Date,
  actualDropoffTime: Date,
  // Locations (copied from request for historical record)
  pickupLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  dropoffLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  // Route
  plannedRoute: {
    distance: Number, // miles
    duration: Number, // minutes
    waypoints: [{
      latitude: Number,
      longitude: Number,
      timestamp: Date
    }]
  },
  actualRoute: {
    distance: Number,
    duration: Number,
    waypoints: [{
      latitude: Number,
      longitude: Number,
      timestamp: Date
    }]
  },
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'driver_enroute', 'passenger_picked_up', 'in_transit', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  // Tracking
  currentLocation: {
    latitude: Number,
    longitude: Number,
    lastUpdated: Date
  },
  // Mileage
  startMileage: Number,
  endMileage: Number,
  totalMileage: Number,
  // Passengers
  passengerCount: Number,
  // Notes
  driverNotes: String,
  clientNotes: String,
  incidentReports: [String],
  // Rating
  driverRating: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    ratedAt: Date
  },
  clientRating: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    ratedAt: Date
  },
  cancellationReason: String
}, {
  timestamps: true
});

// Indexes
rideSchema.index({ driverId: 1, scheduledPickupTime: 1 });
rideSchema.index({ vehicleId: 1, scheduledPickupTime: 1 });
rideSchema.index({ clientId: 1 });
rideSchema.index({ status: 1 });

// Route Model (Optimized Routes)
const routeSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: true
  },
  routeDate: {
    type: Date,
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Stops
  stops: [{
    stopNumber: Number,
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride'
    },
    stopType: { type: String, enum: ['pickup', 'dropoff'] },
    location: {
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    scheduledTime: Date,
    actualTime: Date,
    status: { type: String, enum: ['pending', 'completed', 'skipped'], default: 'pending' },
    notes: String
  }],
  // Route Summary
  totalDistance: Number,
  totalDuration: Number,
  totalStops: Number,
  // Status
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  // Optimization
  isOptimized: {
    type: Boolean,
    default: false
  },
  optimizationScore: Number,
  // Times
  startTime: Date,
  endTime: Date,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
routeSchema.index({ routeDate: 1, driverId: 1 });
routeSchema.index({ vehicleId: 1 });
routeSchema.index({ status: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const RideRequest = mongoose.model('RideRequest', rideRequestSchema);
const Ride = mongoose.model('Ride', rideSchema);
const Route = mongoose.model('Route', routeSchema);

module.exports = { Vehicle, RideRequest, Ride, Route };
