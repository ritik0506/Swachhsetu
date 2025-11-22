const express = require('express');
const router = express.Router();
const {
  getUserDashboard,
  getStats,
  getLeaderboard,
  getRecentActivity,
  getHeatmapData
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// User-specific dashboard (requires auth)
router.get('/user', protect, getUserDashboard);

// Public routes
router.get('/stats', getStats);
router.get('/leaderboard', getLeaderboard);
router.get('/activity', getRecentActivity);
router.get('/heatmap', getHeatmapData);

module.exports = router;
