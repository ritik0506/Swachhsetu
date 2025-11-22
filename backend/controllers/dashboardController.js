const Report = require('../models/Report');
const User = require('../models/User');
const Gamification = require('../models/Gamification');

// @desc    Get user-specific dashboard
// @route   GET /api/dashboard/user
// @access  Private
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's reports
    const userReports = await Report.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('issueType description status createdAt resolvedAt location');

    const totalReports = await Report.countDocuments({ userId });
    const resolvedReports = await Report.countDocuments({ userId, status: 'resolved' });
    const pendingReports = await Report.countDocuments({ userId, status: 'pending' });
    const inProgressReports = await Report.countDocuments({ userId, status: 'in-progress' });

    // Calculate average response time for user's reports
    const resolvedWithTime = await Report.find({
      userId,
      status: 'resolved',
      resolvedAt: { $exists: true }
    }).select('createdAt resolvedAt');

    let avgResponseTime = 0;
    if (resolvedWithTime.length > 0) {
      const totalTime = resolvedWithTime.reduce((acc, report) => {
        const diff = report.resolvedAt - report.createdAt;
        return acc + diff;
      }, 0);
      avgResponseTime = totalTime / resolvedWithTime.length / (1000 * 60 * 60); // in hours
    }

    // Get user's gamification data
    const gamificationData = await Gamification.findOne({ userId });

    res.json({
      success: true,
      data: {
        stats: {
          totalReports,
          resolvedReports,
          pendingReports,
          inProgressReports,
          averageResponseTime: avgResponseTime.toFixed(1),
          userPoints: gamificationData?.totalPoints || 0,
          userLevel: gamificationData?.level?.current || 1,
          userRank: 0 // Can calculate rank if needed
        },
        recentReports: userReports
      }
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user dashboard', 
      error: error.message 
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Public
exports.getStats = async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const inProgressReports = await Report.countDocuments({ status: 'in-progress' });
    const totalUsers = await User.countDocuments();

    // Category breakdown
    const categoryStats = await Report.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Severity breakdown
    const severityStats = await Report.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    // Reports over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reportsOverTime = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Average resolution time
    const resolvedWithTime = await Report.find({
      status: 'resolved',
      resolvedAt: { $exists: true }
    }).select('createdAt resolvedAt');

    let avgResolutionTime = 0;
    if (resolvedWithTime.length > 0) {
      const totalTime = resolvedWithTime.reduce((acc, report) => {
        const diff = report.resolvedAt - report.createdAt;
        return acc + diff;
      }, 0);
      avgResolutionTime = totalTime / resolvedWithTime.length / (1000 * 60 * 60); // in hours
    }

    res.json({
      success: true,
      stats: {
        totalReports,
        resolvedReports,
        pendingReports,
        inProgressReports,
        totalUsers,
        avgResolutionTime: avgResolutionTime.toFixed(2),
        resolutionRate: totalReports > 0 ? ((resolvedReports / totalReports) * 100).toFixed(1) : 0,
        categoryStats,
        severityStats,
        reportsOverTime
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch statistics', 
      error: error.message 
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/dashboard/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 10, type = 'points' } = req.query;

    let sortField = 'totalPoints';
    if (type === 'reports') sortField = 'stats.reportsSubmitted';
    if (type === 'level') sortField = 'level.current';

    const leaderboard = await Gamification.find()
      .populate('userId', 'name avatar')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch leaderboard', 
      error: error.message 
    });
  }
};

// @desc    Get recent activity
// @route   GET /api/dashboard/activity
// @access  Public
exports.getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const recentReports = await Report.find()
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('title category status createdAt location');

    res.json({
      success: true,
      activity: recentReports
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch activity', 
      error: error.message 
    });
  }
};

// @desc    Get heatmap data
// @route   GET /api/dashboard/heatmap
// @access  Public
exports.getHeatmapData = async (req, res) => {
  try {
    const reports = await Report.find({ 
      status: { $in: ['pending', 'in-progress'] } 
    }).select('location severity');

    const heatmapData = reports.map(report => ({
      lat: report.location.coordinates[1],
      lng: report.location.coordinates[0],
      intensity: report.severity === 'critical' ? 1 : 
                 report.severity === 'high' ? 0.75 : 
                 report.severity === 'medium' ? 0.5 : 0.25
    }));

    res.json({
      success: true,
      heatmapData
    });
  } catch (error) {
    console.error('Get heatmap error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch heatmap data', 
      error: error.message 
    });
  }
};
