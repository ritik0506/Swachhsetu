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

router.post('/', protect, upload.array('images', 5), createReport);
router.get('/', getReports);
router.get('/my-reports', protect, getMyReports);
router.get('/:id', getReport);
router.put('/:id/status', protect, authorize('admin', 'moderator'), updateReportStatus);
router.post('/:id/upvote', protect, upvoteReport);
router.post('/:id/comment', protect, addComment);

module.exports = router;
