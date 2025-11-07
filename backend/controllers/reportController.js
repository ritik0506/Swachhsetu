const Report = require('../models/Report');
const User = require('../models/User');
const Gamification = require('../models/Gamification');
const Notification = require('../models/Notification');

// Helper function to award points and check achievements
const awardPoints = async (userId, points, action) => {
  try {
    let gamification = await Gamification.findOne({ userId });
    
    // Create gamification profile if it doesn't exist
    if (!gamification) {
      gamification = await Gamification.create({
        userId,
        totalPoints: 0,
        stats: {}
      });
    }
    
    gamification.totalPoints += points;
    
    // Initialize stats object if it doesn't exist
    if (!gamification.stats) {
      gamification.stats = {};
    }
    gamification.stats[action] = (gamification.stats[action] || 0) + 1;
    
    // Update level
    gamification.level.xp += points;
    while (gamification.level.xp >= gamification.level.nextLevelXp) {
      gamification.level.current += 1;
      gamification.level.xp -= gamification.level.nextLevelXp;
      gamification.level.nextLevelXp = Math.floor(gamification.level.nextLevelXp * 1.5);
      
      // Create level up notification
      try {
        await Notification.create({
          userId,
          type: 'level_up',
          title: '🎉 Level Up!',
          message: `Congratulations! You've reached level ${gamification.level.current}`,
          priority: 'high'
        });
      } catch (notifError) {
        console.warn('Failed to create level up notification:', notifError.message);
      }
    }
    
    await gamification.save();
  } catch (error) {
    console.error('Award points error:', error);
    throw error;
  }
};

// @desc    Create new report
// @route   POST /api/reports
// @access  Private
exports.createReport = async (req, res) => {
  try {
    const { category, title, description, severity } = req.body;
    
    // Parse location if it's a string
    let locationData;
    if (typeof req.body.location === 'string') {
      locationData = JSON.parse(req.body.location);
    } else {
      locationData = req.body.location;
    }

    // Validate required fields
    if (!category || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category, title, and description'
      });
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
      console.warn('Failed to award points:', gamificationError.message);
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
      console.warn('Failed to emit socket event:', socketError.message);
    }

    res.status(201).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create report', 
      error: error.message 
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
    console.error('Get reports error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reports', 
      error: error.message 
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
    console.error('Get report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch report', 
      error: error.message 
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

    report.status = status;
    if (status === 'resolved') {
      report.resolvedAt = new Date();
      
      // Award points to report creator
      await awardPoints(report.userId, 20, 'reportsVerified');
    }

    await report.save();

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
    console.error('Update status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update report status', 
      error: error.message 
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
    console.error('Upvote error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upvote report', 
      error: error.message 
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
    console.error('Add comment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add comment', 
      error: error.message 
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
    console.error('Get my reports error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reports', 
      error: error.message 
    });
  }
};
