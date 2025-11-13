const mongoose = require('mongoose');

const caseManagementSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caseManagerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caseNumber: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'closed', 'pending'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  goals: [{
    description: String,
    targetDate: Date,
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'cancelled'],
      default: 'not_started'
    },
    progress: Number
  }],
  actionPlans: [{
    title: String,
    description: String,
    assignedTo: mongoose.Schema.Types.ObjectId,
    dueDate: Date,
    completed: Boolean,
    completedAt: Date
  }],
  notes: [{
    authorId: mongoose.Schema.Types.ObjectId,
    content: String,
    isPrivate: Boolean,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  documents: [{
    filename: String,
    url: String,
    category: String,
    uploadedBy: mongoose.Schema.Types.ObjectId,
    uploadedAt: Date
  }],
  teamMembers: [{
    userId: mongoose.Schema.Types.ObjectId,
    role: String
  }],
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    lastUpdated: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CaseManagement', caseManagementSchema);
