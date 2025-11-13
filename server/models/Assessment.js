const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessmentType: {
    type: String,
    enum: ['general_intake', 'vispdat_individual', 'vispdat_family', 'vispdat_youth', 
           'mental_health', 'substance_use', 'housing_assessment', 'custom'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  responses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  score: Number,
  recommendations: [String],
  status: {
    type: String,
    enum: ['draft', 'completed', 'reviewed', 'archived'],
    default: 'draft'
  },
  notes: String,
  followUpDate: Date,
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Assessment', assessmentSchema);
