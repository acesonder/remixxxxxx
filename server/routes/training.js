const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const { Course, Certification, ComplianceRecord } = require('../models/Training');

// ==================== COURSES ====================

// Get all courses
router.get('/courses', auth, async (req, res) => {
  try {
    const { status, category, difficulty, search } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    const courses = await Course.find(filter)
      .populate('instructor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get course by ID
router.get('/courses/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName email')
      .populate('prerequisites', 'title');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create course
router.post('/courses', auth, checkRole(['admin', 'staff']), async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      createdBy: req.user.userId
    };
    
    const course = new Course(courseData);
    await course.save();
    
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update course
router.put('/courses/:id', auth, checkRole(['admin', 'staff']), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Enroll in course
router.post('/courses/:id/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (course.status !== 'published') {
      return res.status(400).json({ error: 'Course is not available for enrollment' });
    }
    
    // Check if already enrolled
    const existingEnrollment = course.enrollments.find(
      e => e.userId.toString() === req.user.userId
    );
    
    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }
    
    // Check max enrollments
    if (course.maxEnrollments && course.enrollments.length >= course.maxEnrollments) {
      return res.status(400).json({ error: 'Course is full' });
    }
    
    course.enrollments.push({
      userId: req.user.userId,
      status: 'enrolled',
      progress: {
        completedLessons: [],
        quizScores: [],
        overallProgress: 0
      }
    });
    
    await course.save();
    
    res.json({ message: 'Enrolled successfully', enrollment: course.enrollments[course.enrollments.length - 1] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update course progress
router.patch('/courses/:id/progress', auth, async (req, res) => {
  try {
    const { lessonNumber, quizScore, quizAttempts } = req.body;
    
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const enrollment = course.enrollments.find(
      e => e.userId.toString() === req.user.userId
    );
    
    if (!enrollment) {
      return res.status(400).json({ error: 'Not enrolled in this course' });
    }
    
    // Update completed lessons
    if (lessonNumber && !enrollment.progress.completedLessons.includes(lessonNumber)) {
      enrollment.progress.completedLessons.push(lessonNumber);
    }
    
    // Update quiz scores
    if (quizScore !== undefined) {
      const existingScoreIndex = enrollment.progress.quizScores.findIndex(
        s => s.lessonNumber === lessonNumber
      );
      
      if (existingScoreIndex >= 0) {
        enrollment.progress.quizScores[existingScoreIndex].score = Math.max(
          enrollment.progress.quizScores[existingScoreIndex].score,
          quizScore
        );
        enrollment.progress.quizScores[existingScoreIndex].attempts = quizAttempts || 1;
        enrollment.progress.quizScores[existingScoreIndex].completedAt = new Date();
      } else {
        enrollment.progress.quizScores.push({
          lessonNumber,
          score: quizScore,
          attempts: quizAttempts || 1,
          completedAt: new Date()
        });
      }
    }
    
    // Calculate overall progress
    const totalLessons = course.lessons.length;
    const completedLessons = enrollment.progress.completedLessons.length;
    enrollment.progress.overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    enrollment.progress.lastAccessed = new Date();
    
    if (enrollment.progress.overallProgress === 100) {
      enrollment.status = 'completed';
    } else if (enrollment.progress.overallProgress > 0) {
      enrollment.status = 'in_progress';
    }
    
    await course.save();
    
    res.json({ message: 'Progress updated', progress: enrollment.progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark course complete (issues certificate if configured)
router.post('/courses/:id/complete', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const enrollment = course.enrollments.find(
      e => e.userId.toString() === req.user.userId
    );
    
    if (!enrollment) {
      return res.status(400).json({ error: 'Not enrolled in this course' });
    }
    
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    enrollment.progress.overallProgress = 100;
    
    // Issue certificate if configured
    if (course.certificationIssued && !enrollment.certificateIssued) {
      const certification = new Certification({
        userId: req.user.userId,
        certificationType: 'training',
        name: `${course.title} Completion Certificate`,
        description: course.description,
        issuingOrganization: 'Organization Name',
        issueDate: new Date(),
        courseId: course._id,
        status: 'active'
      });
      
      await certification.save();
      
      enrollment.certificateIssued = true;
      enrollment.certificateId = certification._id;
    }
    
    await course.save();
    
    res.json({ 
      message: 'Course completed successfully', 
      enrollment,
      certificateIssued: enrollment.certificateIssued 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CERTIFICATIONS ====================

// Get all certifications
router.get('/certifications', auth, async (req, res) => {
  try {
    const { status, userId, certificationType } = req.query;
    const filter = {};
    
    // Non-admin users can only see their own certifications
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      filter.userId = req.user.userId;
    } else if (userId) {
      filter.userId = userId;
    }
    
    if (status) filter.status = status;
    if (certificationType) filter.certificationType = certificationType;
    
    const certifications = await Certification.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('courseId', 'title')
      .sort({ issueDate: -1 })
      .limit(100);
    
    res.json(certifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Issue certification
router.post('/certifications', auth, checkRole(['admin', 'staff']), async (req, res) => {
  try {
    const certification = new Certification(req.body);
    await certification.save();
    
    res.status(201).json(certification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Renew certification
router.patch('/certifications/:id/renew', auth, checkRole(['admin', 'staff']), async (req, res) => {
  try {
    const { renewalDate, expirationDate } = req.body;
    
    const certification = await Certification.findByIdAndUpdate(
      req.params.id,
      {
        renewalDate: renewalDate || new Date(),
        expirationDate,
        status: 'active'
      },
      { new: true }
    );
    
    if (!certification) {
      return res.status(404).json({ error: 'Certification not found' });
    }
    
    res.json(certification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user certifications
router.get('/certifications/user/:userId', auth, async (req, res) => {
  try {
    // Users can only view their own certifications unless admin/staff
    if (req.user.userId !== req.params.userId && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const certifications = await Certification.find({ userId: req.params.userId })
      .populate('courseId', 'title')
      .sort({ issueDate: -1 });
    
    res.json(certifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expiring certifications
router.get('/certifications/expiring', auth, checkRole(['admin', 'staff']), async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.days) || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const expiring = await Certification.find({
      expirationDate: { $lte: futureDate, $gte: new Date() },
      status: 'active'
    })
      .populate('userId', 'firstName lastName email')
      .sort({ expirationDate: 1 });
    
    res.json(expiring);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMPLIANCE ====================

// Get compliance records
router.get('/compliance', auth, async (req, res) => {
  try {
    const { userId, status, complianceType } = req.query;
    const filter = {};
    
    // Non-admin users can only see their own compliance records
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      filter.userId = req.user.userId;
    } else if (userId) {
      filter.userId = userId;
    }
    
    if (status) filter.status = status;
    if (complianceType) filter.complianceType = complianceType;
    
    const records = await ComplianceRecord.find(filter)
      .populate('userId', 'firstName lastName')
      .populate('completedBy', 'firstName lastName')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ dueDate: 1 })
      .limit(100);
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create compliance requirement
router.post('/compliance', auth, checkRole(['admin', 'staff']), async (req, res) => {
  try {
    const record = new ComplianceRecord(req.body);
    await record.save();
    
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark compliance complete
router.patch('/compliance/:id/complete', auth, async (req, res) => {
  try {
    const { evidence, notes } = req.body;
    
    const record = await ComplianceRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({ error: 'Compliance record not found' });
    }
    
    // Check permissions
    if (req.user.userId !== record.userId.toString() && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    record.status = 'completed';
    record.completedDate = new Date();
    record.completedBy = req.user.userId;
    
    if (evidence) {
      record.evidence = record.evidence.concat(evidence);
    }
    
    if (notes) {
      record.notes = notes;
    }
    
    // Set next due date if recurring
    if (record.frequency && record.frequency !== 'once') {
      const nextDue = new Date(record.completedDate);
      switch (record.frequency) {
        case 'annual':
          nextDue.setFullYear(nextDue.getFullYear() + 1);
          break;
        case 'biannual':
          nextDue.setMonth(nextDue.getMonth() + 6);
          break;
        case 'quarterly':
          nextDue.setMonth(nextDue.getMonth() + 3);
          break;
        case 'monthly':
          nextDue.setMonth(nextDue.getMonth() + 1);
          break;
      }
      record.nextDueDate = nextDue;
    }
    
    await record.save();
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get due compliance items
router.get('/compliance/due', auth, checkRole(['admin', 'staff']), async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.days) || 7;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const dueItems = await ComplianceRecord.find({
      dueDate: { $lte: futureDate },
      status: { $in: ['pending', 'in_progress'] }
    })
      .populate('userId', 'firstName lastName email')
      .sort({ dueDate: 1 });
    
    res.json(dueItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TRANSCRIPTS & CERTIFICATES ====================

// Get training transcript for a user
router.get('/transcripts/:userId', auth, async (req, res) => {
  try {
    // Users can only view their own transcript unless admin/staff
    if (req.user.userId !== req.params.userId && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get all completed courses
    const courses = await Course.find({
      'enrollments.userId': req.params.userId,
      'enrollments.status': 'completed'
    }).select('title category difficulty duration enrollments completedAt');
    
    const completedCourses = courses.map(course => {
      const enrollment = course.enrollments.find(e => e.userId.toString() === req.params.userId);
      return {
        courseId: course._id,
        title: course.title,
        category: course.category,
        difficulty: course.difficulty,
        duration: course.duration,
        completedAt: enrollment.completedAt,
        certificateIssued: enrollment.certificateIssued
      };
    });
    
    // Get all certifications
    const certifications = await Certification.find({ userId: req.params.userId })
      .select('name certificationType issueDate expirationDate status');
    
    // Calculate total training hours
    const totalHours = completedCourses.reduce((sum, course) => sum + (course.duration || 0), 0) / 60;
    
    // Get compliance status
    const complianceRecords = await ComplianceRecord.find({ userId: req.params.userId })
      .select('title status dueDate completedDate');
    
    const transcript = {
      userId: req.params.userId,
      generatedAt: new Date(),
      completedCourses,
      certifications,
      totalHours: Math.round(totalHours * 10) / 10,
      complianceRecords,
      summary: {
        totalCoursesCompleted: completedCourses.length,
        totalCertifications: certifications.filter(c => c.status === 'active').length,
        expiredCertifications: certifications.filter(c => c.status === 'expired').length,
        complianceItems: {
          completed: complianceRecords.filter(r => r.status === 'completed').length,
          pending: complianceRecords.filter(r => r.status === 'pending').length,
          overdue: complianceRecords.filter(r => r.status === 'overdue').length
        }
      }
    };
    
    res.json(transcript);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get certificate details
router.get('/certificates/:certId', auth, async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.certId)
      .populate('userId', 'firstName lastName email')
      .populate('courseId', 'title description');
    
    if (!certification) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    // Anyone with auth can verify certificates
    res.json(certification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
