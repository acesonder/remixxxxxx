const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  documentType: {
    type: String,
    enum: ['policy', 'procedure', 'form', 'template', 'contract', 'report', 
           'consent', 'medical', 'legal', 'financial', 'other'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  file: {
    filename: {
      type: String,
      required: true
    },
    originalName: String,
    url: String,
    size: Number, // in bytes
    mimeType: String,
    hash: String // for duplicate detection
  },
  version: {
    type: Number,
    default: 1
  },
  versionHistory: [{
    version: Number,
    filename: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date,
    changeDescription: String,
    size: Number
  }],
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'archived', 'expired'],
    default: 'draft'
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateFields: [{
    fieldName: String,
    fieldType: {
      type: String,
      enum: ['text', 'number', 'date', 'signature', 'checkbox', 'dropdown']
    },
    isRequired: Boolean,
    defaultValue: String,
    options: [String] // for dropdown fields
  }],
  tags: [String],
  accessControl: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowedRoles: [{
      type: String,
      enum: ['admin', 'staff', 'worker', 'service_provider', 'client']
    }],
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    restrictedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  expirationDate: Date,
  reminderDays: Number, // days before expiration to send reminder
  relatedDocuments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  relatedTo: {
    entityType: {
      type: String,
      enum: ['user', 'case', 'assessment', 'incident', 'appointment']
    },
    entityId: mongoose.Schema.Types.ObjectId
  },
  signatures: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    signedAt: {
      type: Date,
      required: true
    },
    signatureType: {
      type: String,
      enum: ['electronic', 'digital', 'uploaded'],
      required: true
    },
    signatureData: String, // Base64 encoded signature image or digital signature
    ipAddress: String,
    deviceInfo: String,
    consentText: String
  }],
  workflow: {
    currentStep: Number,
    steps: [{
      stepNumber: Number,
      stepName: String,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      assignedRole: String,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'rejected'],
        default: 'pending'
      },
      completedAt: Date,
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      comments: String,
      dueDate: Date
    }]
  },
  ocrData: {
    isProcessed: {
      type: Boolean,
      default: false
    },
    extractedText: String,
    processedAt: Date,
    confidence: Number,
    language: String
  },
  metadata: {
    author: String,
    createdDate: Date,
    modifiedDate: Date,
    pageCount: Number,
    wordCount: Number,
    customFields: Map
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastAccessedAt: Date,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
documentSchema.index({ title: 'text', description: 'text', tags: 'text' });
documentSchema.index({ documentType: 1, category: 1 });
documentSchema.index({ status: 1, expirationDate: 1 });
documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ 'relatedTo.entityType': 1, 'relatedTo.entityId': 1 });
documentSchema.index({ isTemplate: 1 });
documentSchema.index({ 'file.hash': 1 });

// Virtual for checking if document is expired
documentSchema.virtual('isExpired').get(function() {
  return this.expirationDate && this.expirationDate < new Date();
});

// Virtual for checking if expiration is approaching
documentSchema.virtual('isExpirationApproaching').get(function() {
  if (!this.expirationDate || !this.reminderDays) return false;
  const daysUntilExpiration = Math.ceil((this.expirationDate - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiration <= this.reminderDays && daysUntilExpiration > 0;
});

module.exports = mongoose.model('Document', documentSchema);
