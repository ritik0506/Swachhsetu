const express = require('express');
const router = express.Router();
const {
  getStats,
  getLeaderboard,
  getRecentActivity,
  getHeatmapData
} = require('../controllers/dashboardController');

router.get('/stats', getStats);
router.get('/leaderboard', getLeaderboard);
router.get('/activity', getRecentActivity);
router.get('/heatmap', getHeatmapData);

module.exports = router;
