const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['housing', 'employment', 'healthcare', 'legal', 'education', 
           'food', 'clothing', 'transportation', 'mental_health', 'substance_abuse', 'other'],
    required: true
  },
  resourceType: {
    type: String,
    enum: ['document', 'link', 'service', 'contact', 'facility'],
    required: true
  },
  fileUrl: String,
  externalUrl: String,
  contactInfo: {
    name: String,
    phone: String,
    email: String,
    address: String
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  tags: [String],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  accessLevel: {
    type: String,
    enum: ['public', 'staff_only', 'admin_only'],
    default: 'staff_only'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resource', resourceSchema);
