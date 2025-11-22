const Report = require('../models/Report');
const User = require('../models/User');
const Gamification = require('../models/Gamification');

// @desc    Get all reports for admin management
// @route   GET /api/admin/reports
// @access  Private (Admin/Moderator)
exports.getAllReports = async (req, res) => {
  try {
    const { 
      status, 
      category, 
      severity, 
      page = 1, 
      limit = 20,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    const reports = await Report.find(query)
      .populate('userId', 'name email phone avatar level points')
      .populate('assignedTo', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Report.countDocuments(query);

    res.json({
      success: true,
      reports,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalReports: count
    });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reports', 
      error: error.message 
    });
  }
};

// @desc    Update report status and assign
// @route   PUT /api/admin/reports/:id
// @access  Private (Admin/Moderator)
exports.updateReport = async (req, res) => {
  try {
    const { status, assignedTo, priority, estimatedResolutionTime } = req.body;

    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    const oldStatus = report.status;

    if (status) report.status = status;
    if (assignedTo) report.assignedTo = assignedTo;
    if (priority !== undefined) report.priority = priority;
    if (estimatedResolutionTime) report.estimatedResolutionTime = estimatedResolutionTime;
    
    if (status === 'resolved' && oldStatus !== 'resolved') {
      report.resolvedAt = new Date();
      report.verifiedBy = req.user.id;
    }

    await report.save();

    // Create notification for user
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: report.userId,
      type: 'report_update',
      title: 'Report Status Updated',
      message: `Your report "${report.title}" has been updated to ${status}`,
      data: { reportId: report._id, oldStatus, newStatus: status },
      link: `/reports/${report._id}`
    });

    // Emit socket event
    const io = req.app.get('io');
    io.emit('reportUpdated', report);

    res.json({
      success: true,
      report,
      message: 'Report updated successfully'
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update report', 
      error: error.message 
    });
  }
};

// @desc    Delete report
// @route   DELETE /api/admin/reports/:id
// @access  Private (Admin)
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    await report.deleteOne();

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete report', 
      error: error.message 
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments(query);

    // Get gamification data for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const gamification = await Gamification.findOne({ userId: user._id });
        return {
          ...user.toObject(),
          gamification
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStats,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalUsers: count
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users', 
      error: error.message 
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role' 
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user role', 
      error: error.message 
    });
  }
};

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/statistics
// @access  Private (Admin/Moderator)
exports.getAdminStatistics = async (req, res) => {
  try {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    // Overall stats
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const inProgressReports = await Report.countDocuments({ status: 'in-progress' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: lastMonth } 
    });

    // New reports today
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const newReportsToday = await Report.countDocuments({
      createdAt: { $gte: todayStart }
    });

    // Reports by category
    const reportsByCategory = await Report.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Reports by severity
    const reportsBySeverity = await Report.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    // Critical pending reports
    const criticalReports = await Report.find({
      severity: 'critical',
      status: { $in: ['pending', 'in-progress'] }
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Top reporters
    const topReporters = await Report.aggregate([
      {
        $group: {
          _id: '$userId',
          reportCount: { $sum: 1 }
        }
      },
      { $sort: { reportCount: -1 } },
      { $limit: 5 }
    ]);

    const topReportersWithDetails = await User.populate(topReporters, {
      path: '_id',
      select: 'name email avatar points level'
    });

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

    // Reports trend (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await Report.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });

      last7Days.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    res.json({
      success: true,
      statistics: {
        overview: {
          totalReports,
          pendingReports,
          inProgressReports,
          resolvedReports,
          totalUsers,
          activeUsers,
          newReportsToday,
          avgResolutionTime: avgResolutionTime.toFixed(2),
          resolutionRate: ((resolvedReports / totalReports) * 100).toFixed(1)
        },
        reportsByCategory,
        reportsBySeverity,
        criticalReports,
        topReporters: topReportersWithDetails,
        trend: last7Days
      }
    });
  } catch (error) {
    console.error('Get admin statistics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch statistics', 
      error: error.message 
    });
  }
};

// @desc    Bulk update reports status
// @route   PUT /api/admin/reports/bulk-update
// @access  Private (Admin/Moderator)
exports.bulkUpdateReports = async (req, res) => {
  try {
    const { reportIds, status, assignedTo } = req.body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Report IDs are required' 
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.verifiedBy = req.user.id;
    }

    const result = await Report.updateMany(
      { _id: { $in: reportIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} reports updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update reports', 
      error: error.message 
    });
  }
};

// @desc    Get all waste dump reports with location data for map view
// @route   GET /api/admin/waste-dump-map
// @access  Private (Admin/Moderator)
exports.getWasteDumpMapData = async (req, res) => {
  try {
    const { category, status, severity, dateFrom, dateTo } = req.query;

    const query = {};
    
    // Filter for waste-related categories
    if (category) {
      query.category = category;
    } else {
      query.category = { $in: ['waste', 'beach', 'street', 'park', 'other'] };
    }
    
    if (status) query.status = status;
    if (severity) query.severity = severity;
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Fetch reports with location data
    const reports = await Report.find(query)
      .populate('userId', 'name email phone avatar')
      .populate('assignedTo', 'name email')
      .select('title description category status severity location images createdAt resolvedAt userId assignedTo priority')
      .sort({ createdAt: -1 })
      .lean();

    // Filter out reports without valid coordinates
    const validReports = reports.filter(report => 
      report.location && 
      report.location.coordinates && 
      report.location.coordinates.length === 2 &&
      report.location.coordinates[0] !== 0 &&
      report.location.coordinates[1] !== 0
    );

    // Calculate statistics
    const stats = {
      total: validReports.length,
      pending: validReports.filter(r => r.status === 'pending').length,
      inProgress: validReports.filter(r => r.status === 'in-progress').length,
      resolved: validReports.filter(r => r.status === 'resolved').length,
      byCategory: {},
      bySeverity: {
        low: validReports.filter(r => r.severity === 'low').length,
        medium: validReports.filter(r => r.severity === 'medium').length,
        high: validReports.filter(r => r.severity === 'high').length,
        critical: validReports.filter(r => r.severity === 'critical').length
      }
    };

    // Count by category
    validReports.forEach(report => {
      stats.byCategory[report.category] = (stats.byCategory[report.category] || 0) + 1;
    });

    res.json({
      success: true,
      reports: validReports,
      stats,
      totalReports: validReports.length
    });
  } catch (error) {
    console.error('Get waste dump map data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch waste dump map data', 
      error: error.message 
    });
  }
};
