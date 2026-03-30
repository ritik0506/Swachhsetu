const express = require('express');
const router = express.Router();
const {
  createReport,
  getReports,
  getReport,
  updateReportStatus,
  upvoteReport,
  addComment,
  getMyReports
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { reportValidators } = require('../middleware/validators');

router.post('/', protect, upload.array('images', 5), reportValidators.create, createReport);
router.get('/', reportValidators.list, getReports);
router.get('/my-reports', protect, getMyReports);
router.get('/:id', reportValidators.getById, getReport);
router.put('/:id/status', protect, authorize('admin', 'moderator'), reportValidators.updateStatus, updateReportStatus);
router.post('/:id/upvote', protect, reportValidators.getById, upvoteReport);
router.post('/:id/comment', protect, reportValidators.addComment, addComment);

module.exports = router;
