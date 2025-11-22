const express = require('express');
const router = express.Router();
const {
  getScheduleByArea,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  subscribeToSchedule,
  unsubscribeFromSchedule,
  getUniqueLocations,
  getTodaySchedules,
  markCollection
} = require('../controllers/garbageController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/schedule', getScheduleByArea);
router.get('/schedule/:id', getScheduleById);
router.get('/locations', getUniqueLocations);
router.get('/today', getTodaySchedules);

// Protected routes
router.post('/schedule/:id/subscribe', protect, subscribeToSchedule);
router.delete('/schedule/:id/subscribe', protect, unsubscribeFromSchedule);

// Admin routes
router.post('/schedule', protect, authorize('admin', 'moderator'), createSchedule);
router.put('/schedule/:id', protect, authorize('admin', 'moderator'), updateSchedule);
router.delete('/schedule/:id', protect, authorize('admin'), deleteSchedule);
router.post('/schedule/:id/mark-collection', protect, authorize('admin', 'moderator'), markCollection);

module.exports = router;
