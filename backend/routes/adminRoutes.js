const express = require('express');
const router = express.Router();
const {
  getAllReports,
  updateReport,
  deleteReport,
  getAllUsers,
  updateUserRole,
  getAdminStatistics,
  bulkUpdateReports
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes and restrict to admin/moderator
router.use(protect);
router.use(authorize('admin', 'moderator'));

// Report management
router.get('/reports', getAllReports);
router.put('/reports/:id', updateReport);
router.delete('/reports/:id', authorize('admin'), deleteReport);
router.put('/reports/bulk-update', bulkUpdateReports);

// User management (admin only)
router.get('/users', authorize('admin'), getAllUsers);
router.put('/users/:id/role', authorize('admin'), updateUserRole);

// Statistics
router.get('/statistics', getAdminStatistics);

module.exports = router;
