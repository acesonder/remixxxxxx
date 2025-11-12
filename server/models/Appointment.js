const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  appointmentType: {
    type: String,
    enum: ['consultation', 'assessment', 'follow_up', 'group_session', 
           'therapy', 'case_review', 'intake', 'other'],
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['in_person', 'video', 'phone'],
      default: 'in_person'
    },
    address: String,
    room: String,
    videoLink: String,
    phoneNumber: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'cancelled', 'no_show', 'completed', 'rescheduled'],
    default: 'scheduled'
  },
  attendees: [{
    userId: mongoose.Schema.Types.ObjectId,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'tentative'],
      default: 'pending'
    },
    responseDate: Date
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'custom']
    },
    interval: Number,
    daysOfWeek: [Number], // 0 = Sunday, 6 = Saturday
    endDate: Date,
    endAfterOccurrences: Number
  },
  recurringSeriesId: String, // Link to parent recurring series
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'in_app'],
      required: true
    },
    timeBeforeMinutes: {
      type: Number,
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  notes: String,
  privateNotes: String, // Only visible to staff
  cancellationReason: String,
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }],
  metadata: Map, // Flexible field for custom data
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
appointmentSchema.index({ startTime: 1, endTime: 1 });
appointmentSchema.index({ clientId: 1, startTime: 1 });
appointmentSchema.index({ staffId: 1, startTime: 1 });
appointmentSchema.index({ status: 1, startTime: 1 });
appointmentSchema.index({ recurringSeriesId: 1 });

// Virtual for checking if appointment is past
appointmentSchema.virtual('isPast').get(function() {
  return this.endTime < new Date();
});

// Virtual for checking if appointment is today
appointmentSchema.virtual('isToday').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return this.startTime >= today && this.startTime < tomorrow;
});

module.exports = mongoose.model('Appointment', appointmentSchema);
