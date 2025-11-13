const mongoose = require('mongoose');

// Housing Unit Model
const housingUnitSchema = new mongoose.Schema({
  unitNumber: {
    type: String,
    required: true,
    unique: true
  },
  property: {
    name: String,
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  // Unit Details
  unitType: {
    type: String,
    enum: ['studio', 'one_bedroom', 'two_bedroom', 'three_bedroom', 'four_bedroom_plus', 'shared', 'dormitory'],
    required: true
  },
  bedrooms: Number,
  bathrooms: Number,
  squareFeet: Number,
  // Status
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'reserved', 'offline'],
    default: 'available'
  },
  // Accessibility
  accessibility: {
    wheelchairAccessible: Boolean,
    elevatorAccess: Boolean,
    hearingAccessible: Boolean,
    visualAccessible: Boolean
  },
  // Features
  features: [String], // furnished, kitchen, laundry, parking, etc.
  utilities: [String], // water, electric, gas, internet, etc.
  // Capacity
  maxOccupancy: Number,
  currentOccupancy: {
    type: Number,
    default: 0
  },
  // Financial
  rent: Number,
  deposit: Number,
  applicationFee: Number,
  // Lease
  currentLeaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease'
  },
  // Maintenance
  lastInspectionDate: Date,
  nextInspectionDate: Date,
  maintenanceNotes: String,
  notes: String
}, {
  timestamps: true
});

// Indexes
housingUnitSchema.index({ status: 1 });
housingUnitSchema.index({ unitType: 1 });

// Housing Application Model
const housingApplicationSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    required: true,
    unique: true
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Application Details
  applicationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'denied', 'waitlisted', 'withdrawn'],
    default: 'pending'
  },
  // Housing Preferences
  preferences: {
    unitTypes: [String],
    bedrooms: Number,
    maxRent: Number,
    moveInDate: Date,
    accessibility: [String],
    location: String
  },
  // Household Information
  householdSize: Number,
  householdMembers: [{
    name: String,
    relationship: String,
    age: Number,
    hasSpecialNeeds: Boolean,
    specialNeeds: String
  }],
  // Income & Employment
  monthlyIncome: Number,
  employmentStatus: String,
  employer: String,
  incomeVerification: [String], // document URLs
  // History
  housingHistory: [{
    address: String,
    landlord: String,
    phone: String,
    moveInDate: Date,
    moveOutDate: Date,
    reason: String
  }],
  // References
  references: [{
    name: String,
    relationship: String,
    phone: String,
    email: String
  }],
  // Background Check
  backgroundCheckConsent: Boolean,
  backgroundCheckDate: Date,
  backgroundCheckStatus: String,
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  priorityReason: String,
  // Processing
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedDate: Date,
  reviewNotes: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: Date,
  denialReason: String,
  notes: String
}, {
  timestamps: true
});

// Indexes
housingApplicationSchema.index({ applicantId: 1 });
housingApplicationSchema.index({ status: 1, priority: -1 });
housingApplicationSchema.index({ applicationDate: 1 });

// Lease Model
const leaseSchema = new mongoose.Schema({
  leaseNumber: {
    type: String,
    required: true,
    unique: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HousingUnit',
    required: true
  },
  // Tenant Information
  primaryTenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coTenants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    relationship: String
  }],
  // Lease Terms
  leaseType: {
    type: String,
    enum: ['fixed', 'month_to_month', 'subsidized', 'transitional'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  // Financial Terms
  monthlyRent: {
    type: Number,
    required: true
  },
  deposit: Number,
  lastMonthRent: Number,
  subsidy: {
    amount: Number,
    provider: String,
    programName: String
  },
  // Payment Schedule
  rentDueDay: {
    type: Number,
    min: 1,
    max: 31,
    default: 1
  },
  lateFeeAmount: Number,
  lateFeeGracePeriod: Number, // days
  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'expiring', 'expired', 'terminated', 'renewed'],
    default: 'pending'
  },
  // Move In/Out
  moveInDate: Date,
  moveInInspectionDate: Date,
  moveOutDate: Date,
  moveOutInspectionDate: Date,
  // Violations & Notices
  violations: [{
    date: Date,
    type: String,
    description: String,
    resolved: Boolean,
    resolvedDate: Date
  }],
  notices: [{
    date: Date,
    type: String, // warning, eviction, lease_violation, rent_increase
    description: String,
    dueDate: Date
  }],
  // Renewal
  renewalOffered: Boolean,
  renewalDate: Date,
  renewalStatus: String,
  // Termination
  terminationDate: Date,
  terminationReason: String,
  terminatedBy: String, // tenant, landlord, mutual
  // Documents
  documents: [String], // lease agreement, addendums, etc.
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
leaseSchema.index({ unitId: 1 });
leaseSchema.index({ primaryTenantId: 1 });
leaseSchema.index({ status: 1, endDate: 1 });

// Waitlist Model
const waitlistSchema = new mongoose.Schema({
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HousingApplication'
  },
  // Waitlist Details
  addedDate: {
    type: Date,
    default: Date.now
  },
  position: Number,
  // Preferences
  unitTypes: [String],
  bedrooms: Number,
  accessibility: [String],
  // Status
  status: {
    type: String,
    enum: ['active', 'offered', 'accepted', 'declined', 'expired', 'removed'],
    default: 'active'
  },
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  priorityPoints: {
    type: Number,
    default: 0
  },
  priorityReason: String,
  // Offers
  offers: [{
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HousingUnit'
    },
    offerDate: Date,
    expirationDate: Date,
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired'] },
    declineReason: String
  }],
  // Contact
  lastContactDate: Date,
  nextContactDate: Date,
  contactNotes: String,
  // Administrative
  notes: String,
  removedDate: Date,
  removalReason: String
}, {
  timestamps: true
});

// Indexes
waitlistSchema.index({ status: 1, priority: -1, position: 1 });
waitlistSchema.index({ applicantId: 1 });

const HousingUnit = mongoose.model('HousingUnit', housingUnitSchema);
const HousingApplication = mongoose.model('HousingApplication', housingApplicationSchema);
const Lease = mongoose.model('Lease', leaseSchema);
const Waitlist = mongoose.model('Waitlist', waitlistSchema);

module.exports = { HousingUnit, HousingApplication, Lease, Waitlist };
