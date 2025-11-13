const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  reportType: {
    type: String,
    enum: ['custom', 'assessment', 'case_summary', 'service_utilization', 
           'demographic', 'outcome', 'financial', 'incident'],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  configuration: {
    dataSource: {
      type: String,
      enum: ['assessments', 'cases', 'users', 'incidents', 'resources', 'messages'],
      required: true
    },
    filters: {
      dateRange: {
        start: Date,
        end: Date
      },
      status: [String],
      roles: [String],
      tags: [String],
      customFilters: Map
    },
    groupBy: [String],
    aggregations: [{
      field: String,
      operation: {
        type: String,
        enum: ['count', 'sum', 'avg', 'min', 'max']
      }
    }],
    sortBy: {
      field: String,
      order: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'desc'
      }
    }
  },
  visualization: {
    type: {
      type: String,
      enum: ['table', 'bar', 'line', 'pie', 'heatmap', 'scatter'],
      default: 'table'
    },
    chartConfig: Map
  },
  schedule: {
    enabled: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    dayOfWeek: Number,
    dayOfMonth: Number,
    time: String,
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    lastRun: Date,
    nextRun: Date
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['operational', 'compliance', 'performance', 'financial', 'custom'],
    default: 'custom'
  },
  tags: [String],
  generatedData: {
    lastGenerated: Date,
    data: mongoose.Schema.Types.Mixed,
    recordCount: Number
  }
}, {
  timestamps: true
});

// Index for searching
reportSchema.index({ title: 'text', description: 'text', tags: 'text' });
reportSchema.index({ createdBy: 1, createdAt: -1 });
reportSchema.index({ isTemplate: 1, category: 1 });

module.exports = mongoose.model('Report', reportSchema);
