const mongoose = require('mongoose');

// Volunteer Model
const volunteerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'active', 'inactive', 'suspended', 'rejected'],
    default: 'pending'
  },
  // Personal Information
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  // Skills and Interests
  skills: [{
    skill: String,
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    verified: { type: Boolean, default: false }
  }],
  interests: [String],
  // Availability
  availability: [{
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday
    startTime: String,
    endTime: String,
    isAvailable: Boolean
  }],
  // Background Check
  backgroundCheck: {
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'approved', 'rejected', 'expired'] },
    checkType: [String], // criminal, reference, driving, credit
    completedDate: Date,
    expirationDate: Date,
    provider: String,
    cost: Number,
    documents: [String]
  },
  // Preferences
  preferences: {
    tshirtSize: String,
    dietaryRestrictions: [String],
    languagesSpoken: [String],
    transportation: Boolean,
    remoteOnly: Boolean
  },
  // References
  references: [{
    name: String,
    relationship: String,
    phone: String,
    email: String,
    contacted: Boolean,
    contactedDate: Date
  }],
  // Groups and Teams
  groups: [{
    groupName: String,
    role: String,
    joinedDate: Date
  }],
  // Statistics
  totalHours: {
    type: Number,
    default: 0
  },
  shiftsCompleted: {
    type: Number,
    default: 0
  },
  // Administrative
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  internalNotes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: Date
}, {
  timestamps: true
});

// Indexes
volunteerSchema.index({ userId: 1 });
volunteerSchema.index({ status: 1 });
volunteerSchema.index({ 'skills.skill': 1 });
volunteerSchema.index({ coordinator: 1 });

// Volunteer Shift Model
const volunteerShiftSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  shiftDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  location: {
    type: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    isRemote: Boolean
  },
  // Requirements
  skillsRequired: [String],
  minVolunteers: {
    type: Number,
    default: 1
  },
  maxVolunteers: Number,
  roles: [{
    roleName: String,
    count: Number,
    filled: { type: Number, default: 0 }
  }],
  // Volunteers
  volunteers: [{
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Volunteer'
    },
    signupDate: Date,
    role: String,
    status: { type: String, enum: ['signed_up', 'confirmed', 'completed', 'no_show', 'cancelled'], default: 'signed_up' },
    checkInTime: Date,
    checkOutTime: Date,
    hoursWorked: Number,
    notes: String
  }],
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  isFull: {
    type: Boolean,
    default: false
  },
  // Recurrence
  isRecurring: Boolean,
  recurrencePattern: {
    frequency: String, // daily, weekly, biweekly, monthly
    daysOfWeek: [Number],
    endDate: Date
  },
  // Administrative
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String
}, {
  timestamps: true
});

// Indexes
volunteerShiftSchema.index({ shiftDate: 1, status: 1 });
volunteerShiftSchema.index({ coordinator: 1 });
volunteerShiftSchema.index({ 'volunteers.volunteerId': 1 });

// Volunteer Hours Model
const volunteerHoursSchema = new mongoose.Schema({
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
    required: true
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VolunteerShift'
  },
  date: {
    type: Date,
    required: true
  },
  startTime: String,
  endTime: String,
  hours: {
    type: Number,
    required: true
  },
  activity: {
    type: String,
    required: true
  },
  description: String,
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedDate: Date,
  // Approval
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: Date,
  rejectionReason: String,
  // Entry type
  entryType: {
    type: String,
    enum: ['automatic', 'manual'],
    default: 'manual'
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
volunteerHoursSchema.index({ volunteerId: 1, date: 1 });
volunteerHoursSchema.index({ shiftId: 1 });
volunteerHoursSchema.index({ status: 1 });

// Volunteer Recognition Model
const volunteerRecognitionSchema = new mongoose.Schema({
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
    required: true
  },
  recognitionType: {
    type: String,
    enum: ['award', 'certificate', 'badge', 'milestone', 'thank_you'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  // Award Details
  awardDate: {
    type: Date,
    default: Date.now
  },
  milestone: {
    type: String,
    enum: ['10_hours', '25_hours', '50_hours', '100_hours', '250_hours', '500_hours', '1000_hours', 'other']
  },
  points: {
    type: Number,
    default: 0
  },
  // Badge/Certificate
  badgeImage: String,
  certificateUrl: String,
  // Visibility
  isPublic: {
    type: Boolean,
    default: true
  },
  // Administrative
  awardedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String
}, {
  timestamps: true
});

// Indexes
volunteerRecognitionSchema.index({ volunteerId: 1, awardDate: -1 });
volunteerRecognitionSchema.index({ recognitionType: 1 });
volunteerRecognitionSchema.index({ isPublic: 1 });

const Volunteer = mongoose.model('Volunteer', volunteerSchema);
const VolunteerShift = mongoose.model('VolunteerShift', volunteerShiftSchema);
const VolunteerHours = mongoose.model('VolunteerHours', volunteerHoursSchema);
const VolunteerRecognition = mongoose.model('VolunteerRecognition', volunteerRecognitionSchema);

module.exports = { Volunteer, VolunteerShift, VolunteerHours, VolunteerRecognition };
