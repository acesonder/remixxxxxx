const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduleType: {
    type: String,
    enum: ['regular', 'custom', 'override'],
    default: 'regular'
  },
  regularSchedule: [{
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6 // 0 = Sunday, 6 = Saturday
    },
    slots: [{
      startTime: {
        type: String,
        required: true // Format: "HH:MM" (24-hour)
      },
      endTime: {
        type: String,
        required: true
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }]
  }],
  customDates: [{
    date: {
      type: Date,
      required: true
    },
    slots: [{
      startTime: String,
      endTime: String,
      isAvailable: {
        type: Boolean,
        default: true
      }
    }],
    reason: String // e.g., "Conference", "Vacation", "Special hours"
  }],
  blackoutDates: [{
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    reason: String,
    isAllDay: {
      type: Boolean,
      default: true
    }
  }],
  timezone: {
    type: String,
    default: 'America/New_York'
  },
  slotDuration: {
    type: Number,
    default: 30 // Default appointment slot duration in minutes
  },
  bufferTime: {
    type: Number,
    default: 0 // Minutes of buffer between appointments
  },
  maxAppointmentsPerDay: Number,
  advanceBookingDays: {
    type: Number,
    default: 30 // How far in advance clients can book
  },
  minimumNoticeHours: {
    type: Number,
    default: 24 // Minimum hours notice required for booking
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for quick lookups
availabilitySchema.index({ userId: 1 });
availabilitySchema.index({ 'customDates.date': 1 });
availabilitySchema.index({ 'blackoutDates.startDate': 1, 'blackoutDates.endDate': 1 });

module.exports = mongoose.model('Availability', availabilitySchema);
