const mongoose = require('mongoose');

// Course Schema
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: {
    type: String,
    enum: ['compliance', 'professional_development', 'technical', 'soft_skills', 'safety', 'orientation', 'other'],
    default: 'other'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  duration: Number, // minutes
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lessons: [{
    lessonNumber: Number,
    title: String,
    description: String,
    lessonType: {
      type: String,
      enum: ['video', 'document', 'quiz', 'assignment', 'discussion', 'live_session'],
      required: true
    },
    contentUrl: String,
    duration: Number, // minutes
    content: String, // For text content
    quiz: {
      questions: [{
        questionNumber: Number,
        questionText: String,
        questionType: {
          type: String,
          enum: ['multiple_choice', 'true_false', 'short_answer', 'essay']
        },
        choices: [String],
        correctAnswer: String,
        points: { type: Number, default: 1 }
      }],
      passingScore: Number,
      timeLimit: Number // minutes
    },
    isRequired: { type: Boolean, default: true },
    orderIndex: Number
  }],
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  certificationIssued: { type: Boolean, default: false },
  certificateTemplate: String,
  maxEnrollments: Number,
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  tags: [String],
  thumbnail: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrollments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    enrolledAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['enrolled', 'in_progress', 'completed', 'dropped'],
      default: 'enrolled'
    },
    progress: {
      completedLessons: [Number],
      quizScores: [{
        lessonNumber: Number,
        score: Number,
        attempts: Number,
        completedAt: Date
      }],
      overallProgress: { type: Number, default: 0 }, // percentage
      lastAccessed: Date
    },
    completedAt: Date,
    certificateIssued: { type: Boolean, default: false },
    certificateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Certification' }
  }],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Indexes
courseSchema.index({ status: 1, category: 1 });
courseSchema.index({ 'enrollments.userId': 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ tags: 1 });

// Certification Schema
const certificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  certificationType: {
    type: String,
    enum: ['training', 'license', 'credential', 'degree', 'skill'],
    required: true
  },
  name: { type: String, required: true },
  description: String,
  issuingOrganization: String,
  credentialNumber: String,
  credentialUrl: String,
  issueDate: { type: Date, required: true },
  expirationDate: Date,
  renewalDate: Date,
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked', 'pending_renewal'],
    default: 'active'
  },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  verificationUrl: String,
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  renewalReminders: [{
    reminderDate: Date,
    sent: { type: Boolean, default: false }
  }],
  competencies: [String],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Indexes
certificationSchema.index({ userId: 1, status: 1 });
certificationSchema.index({ expirationDate: 1 });
certificationSchema.index({ status: 1 });

// Virtuals
certificationSchema.virtual('isExpired').get(function() {
  return this.expirationDate && this.expirationDate < new Date();
});

certificationSchema.virtual('isExpiringSoon').get(function() {
  if (!this.expirationDate) return false;
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.expirationDate < thirtyDaysFromNow;
});

// Compliance Record Schema
const complianceRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  complianceType: {
    type: String,
    enum: ['training', 'certification', 'background_check', 'health_screening', 'policy_acknowledgment', 'safety', 'legal', 'regulatory'],
    required: true
  },
  title: { type: String, required: true },
  description: String,
  requirement: String,
  dueDate: Date,
  completedDate: Date,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'overdue', 'expired'],
    default: 'pending'
  },
  frequency: {
    type: String,
    enum: ['once', 'annual', 'biannual', 'quarterly', 'monthly', 'custom']
  },
  nextDueDate: Date,
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  evidence: [{
    type: String,
    description: String,
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  relatedCertification: { type: mongoose.Schema.Types.ObjectId, ref: 'Certification' },
  relatedCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  notes: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Indexes
complianceRecordSchema.index({ userId: 1, status: 1 });
complianceRecordSchema.index({ dueDate: 1 });
complianceRecordSchema.index({ status: 1, dueDate: 1 });

// Virtuals
complianceRecordSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'completed';
});

const Course = mongoose.model('Course', courseSchema);
const Certification = mongoose.model('Certification', certificationSchema);
const ComplianceRecord = mongoose.model('ComplianceRecord', complianceRecordSchema);

module.exports = { Course, Certification, ComplianceRecord };
