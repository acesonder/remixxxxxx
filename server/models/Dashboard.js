const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  layout: {
    columns: {
      type: Number,
      default: 12,
      min: 1,
      max: 24
    },
    widgets: [{
      id: String,
      widgetType: {
        type: String,
        enum: ['stat', 'chart', 'table', 'activity', 'calendar', 'map', 
               'progress', 'list', 'custom'],
        required: true
      },
      title: String,
      position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, required: true, min: 1 },
        height: { type: Number, required: true, min: 1 }
      },
      configuration: {
        dataSource: String,
        refreshInterval: Number, // in seconds
        filters: Map,
        displayOptions: Map,
        chartType: String,
        colorScheme: [String]
      },
      permissions: {
        viewRoles: [String],
        editRoles: [String]
      }
    }]
  },
  theme: {
    backgroundColor: String,
    textColor: String,
    cardColor: String,
    borderColor: String
  },
  permissions: {
    viewRoles: {
      type: [String],
      default: ['admin', 'staff']
    },
    editRoles: {
      type: [String],
      default: ['admin']
    }
  },
  refreshInterval: {
    type: Number,
    default: 300 // 5 minutes in seconds
  },
  lastAccessed: Date
}, {
  timestamps: true
});

// Index for searching and performance
dashboardSchema.index({ userId: 1, isDefault: 1 });
dashboardSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Dashboard', dashboardSchema);
