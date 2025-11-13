const mongoose = require('mongoose');

// Survey Schema
const surveySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  surveyType: {
    type: String,
    enum: ['feedback', 'satisfaction', 'nps', 'assessment', 'evaluation', 'poll', 'quiz', 'other'],
    default: 'feedback'
  },
  category: String,
  questions: [{
    questionNumber: {
      type: Number,
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      enum: ['multiple_choice', 'rating', 'text', 'yes_no', 'dropdown', 'checkbox', 'slider', 'matrix', 'ranking'],
      required: true
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    options: [String], // For multiple choice, dropdown, checkbox
    minValue: Number, // For rating, slider
    maxValue: Number,
    minLabel: String, // For slider labels
    maxLabel: String,
    logic: {
      enabled: Boolean,
      conditions: [{
        if: String, // Question reference or condition
        operator: {
          type: String,
          enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than']
        },
        value: String,
        then: {
          action: {
            type: String,
            enum: ['show', 'hide', 'skip_to']
          },
          target: String // Question number or section
        }
      }]
    }
  }],
  settings: {
    isAnonymous: {
      type: Boolean,
      default: false
    },
    allowMultipleResponses: {
      type: Boolean,
      default: false
    },
    showProgressBar: {
      type: Boolean,
      default: true
    },
    randomizeQuestions: {
      type: Boolean,
      default: false
    },
    requireLogin: {
      type: Boolean,
      default: false
    },
    collectEmail: {
      type: Boolean,
      default: false
    },
    sendConfirmation: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: false
    }
  },
  languages: [{
    code: String,
    name: String,
    isDefault: Boolean,
    translations: Map
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'archived'],
    default: 'draft'
  },
  startDate: Date,
  endDate: Date,
  targetAudience: {
    roles: [String],
    specificUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    tags: [String]
  },
  distribution: {
    method: {
      type: String,
      enum: ['email', 'link', 'embedded', 'qr_code'],
      default: 'link'
    },
    emailsSent: {
      type: Number,
      default: 0
    },
    lastSentAt: Date,
    publicLink: String,
    embedCode: String
  },
  responseCount: {
    type: Number,
    default: 0
  },
  completionRate: Number,
  averageTimeToComplete: Number, // in seconds
  npsScore: Number, // For NPS surveys
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Survey Response Schema
const surveyResponseSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  respondentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  respondentEmail: String,
  isAnonymous: {
    type: Boolean,
    default: false
  },
  answers: [{
    questionNumber: {
      type: Number,
      required: true
    },
    questionText: String,
    answer: mongoose.Schema.Types.Mixed, // Can be string, number, array, etc.
    answerText: String, // For display purposes
    score: Number // For scoring
  }],
  totalScore: Number,
  timeToComplete: Number, // in seconds
  ipAddress: String,
  deviceInfo: String,
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  isComplete: {
    type: Boolean,
    default: false
  },
  metadata: Map
}, {
  timestamps: true
});

// Indexes
surveySchema.index({ status: 1, createdAt: -1 });
surveySchema.index({ surveyType: 1 });
surveySchema.index({ 'targetAudience.roles': 1 });
surveySchema.index({ createdBy: 1 });

surveyResponseSchema.index({ surveyId: 1, completedAt: -1 });
surveyResponseSchema.index({ respondentId: 1 });
surveyResponseSchema.index({ isComplete: 1 });
surveyResponseSchema.index({ completedAt: 1 });

// Virtual for calculating response rate
surveySchema.virtual('responseRate').get(function() {
  if (!this.distribution.emailsSent || this.distribution.emailsSent === 0) {
    return 0;
  }
  return (this.responseCount / this.distribution.emailsSent) * 100;
});

const Survey = mongoose.model('Survey', surveySchema);
const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);

module.exports = {
  Survey,
  SurveyResponse
};
