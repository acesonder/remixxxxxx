const express = require('express');
const router = express.Router();
const { Survey, SurveyResponse } = require('../models/Survey');
const { protect, authorize } = require('../middleware/auth');

// Get all surveys
router.get('/', protect, async (req, res) => {
  try {
    const { status, surveyType } = req.query;
    let query = {};

    // Non-admins can only see surveys they created or are targeted to
    if (req.user.role !== 'admin') {
      query.$or = [
        { createdBy: req.user._id },
        { 'targetAudience.roles': req.user.role },
        { 'targetAudience.specificUsers': req.user._id }
      ];
    }

    if (status) query.status = status;
    if (surveyType) query.surveyType = surveyType;

    const surveys = await Survey.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, surveys });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get survey by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('targetAudience.specificUsers', 'firstName lastName email');

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    res.json({ success: true, survey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create survey
router.post('/', protect, authorize(['admin', 'staff', 'worker', 'service_provider']), async (req, res) => {
  try {
    const surveyData = {
      ...req.body,
      createdBy: req.user._id
    };

    const survey = await Survey.create(surveyData);
    const populatedSurvey = await Survey.findById(survey._id)
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({ success: true, survey: populatedSurvey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update survey
router.put('/:id', protect, authorize(['admin', 'staff', 'worker', 'service_provider']), async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    // Check permissions
    const canUpdate = 
      req.user.role === 'admin' ||
      survey.createdBy.toString() === req.user._id.toString();

    if (!canUpdate) {
      return res.status(403).json({ message: 'Not authorized to update this survey' });
    }

    const updatedSurvey = await Survey.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy');

    res.json({ success: true, survey: updatedSurvey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete survey
router.delete('/:id', protect, authorize(['admin', 'staff']), async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    await Survey.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Survey deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit survey response
router.post('/:id/responses', protect, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    if (survey.status !== 'active') {
      return res.status(400).json({ message: 'Survey is not active' });
    }

    // Check if user already responded (if not allowing multiple responses)
    if (!survey.settings.allowMultipleResponses && !survey.settings.isAnonymous) {
      const existingResponse = await SurveyResponse.findOne({
        surveyId: req.params.id,
        respondentId: req.user._id
      });

      if (existingResponse) {
        return res.status(400).json({ message: 'You have already responded to this survey' });
      }
    }

    const responseData = {
      surveyId: req.params.id,
      ...req.body,
      respondentId: survey.settings.isAnonymous ? null : req.user._id,
      isAnonymous: survey.settings.isAnonymous,
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent'],
      completedAt: new Date(),
      isComplete: true
    };

    // Calculate NPS if applicable
    if (survey.surveyType === 'nps') {
      const npsQuestion = responseData.answers.find(a => a.questionNumber === 1);
      if (npsQuestion) {
        const score = parseInt(npsQuestion.answer);
        // NPS categorization: 0-6 = Detractor, 7-8 = Passive, 9-10 = Promoter
        npsQuestion.score = score;
      }
    }

    const response = await SurveyResponse.create(responseData);

    // Update survey stats
    survey.responseCount += 1;
    
    // Update average time to complete
    if (responseData.timeToComplete) {
      const totalTime = (survey.averageTimeToComplete || 0) * (survey.responseCount - 1) + responseData.timeToComplete;
      survey.averageTimeToComplete = totalTime / survey.responseCount;
    }

    // Calculate NPS score
    if (survey.surveyType === 'nps') {
      const allResponses = await SurveyResponse.find({ 
        surveyId: req.params.id,
        isComplete: true 
      });
      
      let promoters = 0, detractors = 0;
      allResponses.forEach(r => {
        const npsAnswer = r.answers.find(a => a.score !== undefined);
        if (npsAnswer) {
          const score = npsAnswer.score;
          if (score >= 9) promoters++;
          else if (score <= 6) detractors++;
        }
      });
      
      survey.npsScore = Math.round(((promoters - detractors) / allResponses.length) * 100);
    }

    // Calculate completion rate
    if (survey.distribution.emailsSent > 0) {
      survey.completionRate = (survey.responseCount / survey.distribution.emailsSent) * 100;
    }

    await survey.save();

    res.status(201).json({ success: true, response });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get survey responses
router.get('/:id/responses', protect, authorize(['admin', 'staff', 'worker', 'service_provider']), async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    // Check permissions
    const canView = 
      req.user.role === 'admin' ||
      survey.createdBy.toString() === req.user._id.toString();

    if (!canView) {
      return res.status(403).json({ message: 'Not authorized to view responses' });
    }

    const responses = await SurveyResponse.find({ 
      surveyId: req.params.id,
      isComplete: true 
    })
    .populate('respondentId', 'firstName lastName email')
    .sort({ completedAt: -1 });

    res.json({ success: true, responses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get survey analytics
router.get('/:id/analytics', protect, authorize(['admin', 'staff', 'worker', 'service_provider']), async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    // Check permissions
    const canView = 
      req.user.role === 'admin' ||
      survey.createdBy.toString() === req.user._id.toString();

    if (!canView) {
      return res.status(403).json({ message: 'Not authorized to view analytics' });
    }

    const responses = await SurveyResponse.find({ 
      surveyId: req.params.id,
      isComplete: true 
    });

    // Calculate analytics per question
    const questionAnalytics = survey.questions.map(question => {
      const questionResponses = responses.map(r => 
        r.answers.find(a => a.questionNumber === question.questionNumber)
      ).filter(Boolean);

      let analytics = {
        questionNumber: question.questionNumber,
        questionText: question.questionText,
        questionType: question.questionType,
        responseCount: questionResponses.length
      };

      if (question.questionType === 'multiple_choice' || question.questionType === 'dropdown') {
        // Count responses for each option
        analytics.optionCounts = {};
        questionResponses.forEach(r => {
          const answer = r.answer;
          analytics.optionCounts[answer] = (analytics.optionCounts[answer] || 0) + 1;
        });
      } else if (question.questionType === 'rating' || question.questionType === 'slider') {
        // Calculate average rating
        const ratings = questionResponses.map(r => parseFloat(r.answer)).filter(n => !isNaN(n));
        analytics.average = ratings.length > 0 
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
          : 0;
        analytics.min = ratings.length > 0 ? Math.min(...ratings) : 0;
        analytics.max = ratings.length > 0 ? Math.max(...ratings) : 0;
      } else if (question.questionType === 'yes_no') {
        const yes = questionResponses.filter(r => r.answer === 'yes' || r.answer === true).length;
        const no = questionResponses.filter(r => r.answer === 'no' || r.answer === false).length;
        analytics.yes = yes;
        analytics.no = no;
        analytics.yesPercentage = responses.length > 0 ? (yes / responses.length) * 100 : 0;
      }

      return analytics;
    });

    const analyticsData = {
      surveyId: survey._id,
      title: survey.title,
      totalResponses: survey.responseCount,
      completionRate: survey.completionRate,
      averageTimeToComplete: survey.averageTimeToComplete,
      npsScore: survey.npsScore,
      responseRate: survey.responseRate,
      questionAnalytics
    };

    res.json({ success: true, analytics: analyticsData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export survey responses (CSV format data)
router.get('/:id/export', protect, authorize(['admin', 'staff']), async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    const responses = await SurveyResponse.find({ 
      surveyId: req.params.id,
      isComplete: true 
    }).populate('respondentId', 'firstName lastName email');

    // Format data for CSV export
    const exportData = responses.map(response => {
      const row = {
        responseId: response._id,
        respondent: response.isAnonymous ? 'Anonymous' : 
          (response.respondentId ? `${response.respondentId.firstName} ${response.respondentId.lastName}` : response.respondentEmail),
        completedAt: response.completedAt,
        timeToComplete: response.timeToComplete
      };

      // Add each answer as a column
      response.answers.forEach(answer => {
        const question = survey.questions.find(q => q.questionNumber === answer.questionNumber);
        const columnName = `Q${answer.questionNumber}: ${question?.questionText || 'Unknown'}`;
        row[columnName] = answer.answerText || answer.answer;
      });

      return row;
    });

    res.json({ success: true, data: exportData, survey: survey });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
