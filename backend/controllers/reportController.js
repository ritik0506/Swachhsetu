const Report = require('../models/Report');
const User = require('../models/User');
const Gamification = require('../models/Gamification');
const Notification = require('../models/Notification');
const { aiQueue } = require('../queues/aiQueue');
const FollowUp = require('../models/FollowUp');
const aiFollowupService = require('../services/aiFollowupService');
const deduplicationService = require('../services/deduplicationService');
const { awardPoints } = require('../utils/gamification');
const logger = require('../utils/logger');

// @desc    Create new report
// @route   POST /api/reports
// @access  Private
exports.createReport = async (req, res) => {
  try {
    const { category, title, description, severity } = req.body;

    // Parse location if it's a string (with error handling)
    let locationData;
    try {
      if (typeof req.body.location === 'string') {
        locationData = JSON.parse(req.body.location);
      } else {
        locationData = req.body.location;
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location format'
      });
    }

    // Validate required fields
    if (!category || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category, title, and description'
      });
    }

    // Check for duplicate reports (if enabled and not forcing)
    const forceSubmit = req.body.force === 'true';
    
    if (deduplicationService.enabled && !forceSubmit) {
      try {
        const reportData = {
          category,
          title,
          description,
          location: {
            type: 'Point',
            coordinates: locationData?.coordinates || [0, 0]
          },
          createdAt: new Date()
        };

        const dupCheck = await deduplicationService.checkDuplicate(reportData);
        
        if (dupCheck.success && dupCheck.is_duplicate && dupCheck.confidence_score >= 0.85) {
          // Return duplicate warning to frontend
          return res.status(409).json({
            success: false,
            isDuplicate: true,
            duplicateReport: dupCheck.duplicate_of,
            confidence: dupCheck.confidence_score,
            recommendation: dupCheck.merge_recommendation,
            rationale: dupCheck.rationale,
            message: 'A similar report already exists in this location. Are you sure you want to submit?'
          });
        }
      } catch (dupError) {
        logger.warn('Duplicate detection failed:', dupError.message);
        // Continue with report creation if duplicate check fails
      }
    }
    
    const report = await Report.create({
      userId: req.user.id,
      category,
      title,
      description,
      location: {
        type: 'Point',
        coordinates: locationData?.coordinates || [0, 0],
        address: locationData?.address || '',
        landmark: locationData?.landmark || ''
      },
      severity: severity || 'medium',
      images: req.files ? req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        uploadedAt: new Date()
      })) : []
    });

    // Award points for creating report (with error handling)
    try {
      await awardPoints(req.user.id, 10, 'reportsSubmitted');
    } catch (gamificationError) {
      logger.warn('Failed to award points:', gamificationError.message);
    }

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { reportsSubmitted: 1, points: 10 }
    });

    // Emit socket event
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('newReport', report);
      }
    } catch (socketError) {
      logger.warn('Failed to emit socket event:', socketError.message);
    }

    // Queue AI triage (async - don't wait)
    try {
      if (process.env.ENABLE_AI_TRIAGE === 'true') {
        await aiQueue.add('triage-report', {
          reportId: report._id.toString(),
          reportData: {
            category: report.category,
            title: report.title,
            description: report.description,
            location: report.location,
            severity: report.severity
          }
        });
        logger.debug(`AI triage queued for report ${report._id}`);
      }
    } catch (aiError) {
      logger.warn('Failed to queue AI triage:', aiError.message);
      // Don't fail the request if AI queueing fails
    }

    res.status(201).json({
      success: true,
      report
    });
  } catch (error) {
    logger.error('Create report error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create report'
    });
  }
};

// @desc    Get all reports
// @route   GET /api/reports
// @access  Public
exports.getReports = async (req, res) => {
  try {
    const { 
      category, 
      status, 
      severity, 
      page = 1, 
      limit = 10,
      lat,
      lng,
      radius = 5000 // 5km default
    } = req.query;

    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (severity) query.severity = severity;

    // Geospatial query if coordinates provided
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      };
    }

    const reports = await Report.find(query)
      .populate('userId', 'name avatar level')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Report.countDocuments(query);

    res.json({
      success: true,
      reports,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalReports: count
    });
  } catch (error) {
    logger.error('Get reports error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
};

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Public
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'name avatar level')
      .populate('comments.userId', 'name avatar');

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    // Increment views
    report.views += 1;
    await report.save();

    res.json({
      success: true,
      report
    });
  } catch (error) {
    logger.error('Get report error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report'
    });
  }
};

// @desc    Update report status
// @route   PUT /api/reports/:id/status
// @access  Private (Admin/Moderator)
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    const oldStatus = report.status;
    report.status = status;
    if (status === 'resolved') {
      report.resolvedAt = new Date();

      // Award points to report creator (50 points per FR-7 specification)
      await awardPoints(report.userId, 50, 'reportsVerified');
    }

    await report.save();

    // Queue automated follow-up if resolved
    if (status === 'resolved' && oldStatus !== 'resolved' && process.env.ENABLE_AI_FOLLOWUP === 'true') {
      try {
        const user = await User.findById(report.userId);
        if (user) {
          await aiQueue.add('generate-followup', {
            reportId: report._id.toString(),
            userId: user._id.toString(),
            userName: user.name,
            reportTitle: report.title,
            reportCategory: report.category,
            resolutionDate: report.resolvedAt,
            userLanguage: report.aiAnalysis?.language?.code || 'en',
            scheduledDelay: 48 * 60 * 60 * 1000 // 48 hours
          }, {
            delay: 48 * 60 * 60 * 1000 // Delay 48 hours
          });
          logger.debug(`Follow-up scheduled for report ${report._id}`);
        }
      } catch (followupError) {
        logger.warn('Failed to schedule follow-up:', followupError.message);
      }
    }

    // Create notification for report creator
    await Notification.create({
      userId: report.userId,
      type: 'report_update',
      title: 'Report Status Updated',
      message: `Your report has been marked as ${status}`,
      data: { reportId: report._id },
      link: `/reports/${report._id}`
    });

    // Emit socket event
    const io = req.app.get('io');
    io.emit('reportUpdated', report);

    res.json({
      success: true,
      report
    });
  } catch (error) {
    logger.error('Update status error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status'
    });
  }
};

// @desc    Upvote report
// @route   POST /api/reports/:id/upvote
// @access  Private
exports.upvoteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    // Remove from downvotes if exists
    report.downvotes = report.downvotes.filter(
      id => id.toString() !== req.user.id.toString()
    );

    // Toggle upvote
    const upvoteIndex = report.upvotes.findIndex(
      id => id.toString() === req.user.id.toString()
    );

    if (upvoteIndex > -1) {
      report.upvotes.splice(upvoteIndex, 1);
    } else {
      report.upvotes.push(req.user.id);
    }

    await report.save();

    res.json({
      success: true,
      upvotes: report.upvotes.length,
      downvotes: report.downvotes.length
    });
  } catch (error) {
    logger.error('Upvote error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to upvote report'
    });
  }
};

// @desc    Add comment to report
// @route   POST /api/reports/:id/comment
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;

    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    report.comments.push({
      userId: req.user.id,
      text,
      createdAt: new Date()
    });

    await report.save();

    // Award points
    await awardPoints(req.user.id, 5, 'commentsPosted');

    res.json({
      success: true,
      comments: report.comments
    });
  } catch (error) {
    logger.error('Add comment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

// @desc    Get user's reports
// @route   GET /api/reports/my-reports
// @access  Private
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    logger.error('Get my reports error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
};
