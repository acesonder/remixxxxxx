const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  incidentNumber: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  incidentType: {
    type: String,
    enum: ['safety', 'behavioral', 'medical', 'property', 'policy_violation', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  location: {
    address: String,
    latitude: Number,
    longitude: Number
  },
  involvedParties: [{
    userId: mongoose.Schema.Types.ObjectId,
    role: String,
    statement: String
  }],
  witnesses: [{
    name: String,
    contact: String,
    statement: String
  }],
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    uploadedAt: Date
  }],
  status: {
    type: String,
    enum: ['reported', 'under_review', 'resolved', 'closed'],
    default: 'reported'
  },
  followUpActions: [{
    action: String,
    assignedTo: mongoose.Schema.Types.ObjectId,
    dueDate: Date,
    completed: Boolean,
    completedAt: Date,
    notes: String
  }],
  resolution: String,
  incidentDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Incident', incidentSchema);
