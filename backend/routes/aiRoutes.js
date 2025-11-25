const express = require('express');
const router = express.Router();
const ollamaService = require('../services/ollamaService');
const aiTriageService = require('../services/aiTriageService');
const aiTranslationService = require('../services/aiTranslationService');
const aiFollowupService = require('../services/aiFollowupService');
const aiAssignmentService = require('../services/aiAssignmentService');
const notificationService = require('../services/notificationService');
const { aiQueue } = require('../queues/aiQueue');
const AIProcessingLog = require('../models/AIProcessingLog');
const Report = require('../models/Report');
const FollowUp = require('../models/FollowUp');
const { protect } = require('../middleware/authMiddleware');

/**
 * Health check for Ollama service
 * GET /api/ai/health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await ollamaService.healthCheck();
    res.json({
      status: health.status,
      message: health.message,
      availableModels: health.models || []
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * Manual triage trigger for a report
 * POST /api/ai/triage/:reportId
 */
router.post('/triage/:reportId', protect, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { force } = req.body; // Force re-triage even if already done
    
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if already triaged
    if (report.aiAnalysis?.triageCompleted && !force) {
      return res.json({
        message: 'Report already triaged',
        analysis: report.aiAnalysis
      });
    }
    
    // Add to queue
    const job = await aiQueue.add('triage-report', {
      reportId: reportId,
      reportData: {
        category: report.category,
        title: report.title,
        description: report.description,
        location: report.location,
        severity: report.severity
      }
    });
    
    res.json({
      message: 'Triage queued successfully',
      jobId: job.id,
      status: 'processing'
    });
    
  } catch (error) {
    console.error('Error in manual triage:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Translate text
 * POST /api/ai/translate
 */
router.post('/translate', protect, async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;
    
    if (!text || !targetLanguage) {
      return res.status(400).json({ 
        message: 'Text and target language are required' 
      });
    }
    
    const result = await aiTranslationService.translate(
      text,
      targetLanguage,
      sourceLanguage
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('Error in translation:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Generate follow-up message
 * POST /api/ai/followup
 */
router.post('/followup', protect, async (req, res) => {
  try {
    const {
      reportId,
      userName,
      reportTitle,
      reportCategory,
      resolutionDetails,
      resolutionDate,
      actionTaken,
      userLanguage,
      tone
    } = req.body;
    
    if (!reportId || !userName || !reportTitle) {
      return res.status(400).json({
        message: 'Report ID, user name, and report title are required'
      });
    }
    
    const result = await aiFollowupService.generateFollowup({
      userName,
      reportTitle,
      reportCategory,
      resolutionDetails,
      resolutionDate,
      actionTaken,
      userLanguage: userLanguage || 'en',
      tone: tone || 'friendly'
    });
    
    // Create follow-up record
    if (result.success) {
      const report = await Report.findById(reportId);
      if (report) {
        const followUp = new FollowUp({
          reportId,
          userId: report.userId,
          messageText: result.message,
          messageType: 'resolution',
          userLanguage: userLanguage || 'en',
          scheduledAt: new Date(),
          channel: 'in-app',
          status: 'pending'
        });
        await followUp.save();
      }
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Error generating follow-up:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Suggest inspector assignment
 * POST /api/ai/assign
 */
router.post('/assign', protect, async (req, res) => {
  try {
    const { reportId, inspectorPool } = req.body;
    
    if (!reportId || !inspectorPool) {
      return res.status(400).json({
        message: 'Report ID and inspector pool are required'
      });
    }
    
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    const ticket = {
      _id: report._id,
      category: report.category,
      title: report.title,
      description: report.description,
      severity: report.severity,
      priority: report.priority,
      location: report.location
    };
    
    const result = await aiAssignmentService.suggestInspector(ticket, inspectorPool);
    
    // If assignment successful and confidence high enough, notify inspector
    if (result.success && 
        result.recommendedInspector && 
        result.confidence >= parseFloat(process.env.AI_AUTO_ASSIGN_THRESHOLD || 0.85)) {
      
      try {
        // Notify inspector
        await notificationService.notifyInspectorAssignment(
          result.recommendedInspector,
          ticket
        );
        console.log(`Inspector ${result.recommendedInspector._id} notified of assignment`);
      } catch (notifyError) {
        console.warn('Failed to notify inspector:', notifyError.message);
        // Don't fail the request if notification fails
      }
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Error in inspector assignment:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get AI processing logs
 * GET /api/ai/logs
 */
router.get('/logs', protect, async (req, res) => {
  try {
    const { jobType, status, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (jobType) query.jobType = jobType;
    if (status) query.status = status;
    
    const logs = await AIProcessingLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await AIProcessingLog.countDocuments(query);
    
    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get AI processing statistics
 * GET /api/ai/stats
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const stats = await AIProcessingLog.getStats(startDate, new Date());
    const errors = await AIProcessingLog.getRecentErrors(10);
    
    // Get queue stats
    const queueStats = await aiQueue.getJobCounts();
    
    res.json({
      processingStats: stats,
      recentErrors: errors,
      queueStats
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get pending follow-ups
 * GET /api/ai/followups/pending
 */
router.get('/followups/pending', protect, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const followups = await FollowUp.getPendingMessages(parseInt(limit));
    
    res.json({
      count: followups.length,
      followups
    });
    
  } catch (error) {
    console.error('Error fetching pending follow-ups:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get follow-up delivery statistics
 * GET /api/ai/followups/stats
 */
router.get('/followups/stats', protect, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const deliveryStats = await FollowUp.getDeliveryStats(startDate, new Date());
    const satisfactionRate = await FollowUp.getUserSatisfactionRate(startDate, new Date());
    
    res.json({
      deliveryStats,
      satisfactionRate
    });
    
  } catch (error) {
    console.error('Error fetching follow-up stats:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get job status
 * GET /api/ai/job/:jobId
 */
router.get('/job/:jobId', protect, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await aiQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const state = await job.getState();
    const progress = job.progress;
    
    res.json({
      jobId: job.id,
      state,
      progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn
    });
    
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
