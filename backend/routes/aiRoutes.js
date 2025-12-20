const express = require('express');
const router = express.Router();
const ollamaService = require('../services/ollamaService');
const aiTriageService = require('../services/aiTriageService');
const aiTranslationService = require('../services/aiTranslationService');
const aiFollowupService = require('../services/aiFollowupService');
const aiAssignmentService = require('../services/aiAssignmentService');
const aiChatbotService = require('../services/aiChatbotService');
const forensicImageAnalyzer = require('../services/forensicImageAnalyzer');
const geospatialVerificationService = require('../services/geospatialVerificationService');
const linguisticAnalystService = require('../services/linguisticAnalystService');
const deduplicationService = require('../services/deduplicationService');
const notificationService = require('../services/notificationService');
const { aiQueue } = require('../queues/aiQueue');
const AIProcessingLog = require('../models/AIProcessingLog');
const Report = require('../models/Report');
const FollowUp = require('../models/FollowUp');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const { 
  sanitizeTranscript, 
  sanitizeChatMessage, 
  sanitizeImageData,
  sanitizeAIOutput,
  validateFileUpload 
} = require('../utils/sanitizer');

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/forensic-test/');
  },
  filename: (req, file, cb) => {
    cb(null, `test-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

/**
 * Get chatbot greeting
 * GET /api/ai/chatbot/greeting
 */
router.get('/chatbot/greeting', (req, res) => {
  const greeting = aiChatbotService.getGreeting();
  res.json(greeting);
});

/**
 * Chat with AI bot
 * POST /api/ai/chatbot/chat
 */
router.post('/chatbot/chat', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and message are required'
      });
    }
    
    // Sanitize input to prevent prompt injection
    const sanitizedMessage = sanitizeChatMessage(message);
    
    const response = await aiChatbotService.chat(sessionId, sanitizedMessage);
    
    // Sanitize output to prevent XSS
    const sanitizedResponse = sanitizeAIOutput(response);
    
    res.json(sanitizedResponse);
    
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reset chatbot session
 * POST /api/ai/chatbot/reset
 */
router.post('/chatbot/reset', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }
    
    aiChatbotService.resetSession(sessionId);
    const greeting = aiChatbotService.getGreeting();
    
    res.json({
      success: true,
      message: 'Session reset successfully',
      greeting
    });
    
  } catch (error) {
    console.error('Reset session error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get chatbot statistics
 * GET /api/ai/chatbot/stats
 */
router.get('/chatbot/stats', protect, (req, res) => {
  try {
    const stats = aiChatbotService.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Chatbot stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Forensic image analysis - Single image
 * POST /api/ai/forensic/analyze
 */
router.post('/forensic/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Validate file upload
    validateFileUpload(req.file);

    const analysis = await forensicImageAnalyzer.analyzeImage(req.file.path);
    
    // Sanitize output to prevent XSS
    const sanitizedAnalysis = sanitizeAIOutput(analysis);
    
    res.json(sanitizedAnalysis);
    
  } catch (error) {
    console.error('Forensic analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Forensic image analysis - Batch (up to 5 images)
 * POST /api/ai/forensic/batch
 */
router.post('/forensic/batch', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      });
    }

    // Validate all uploaded files
    req.files.forEach(file => validateFileUpload(file));

    const imagePaths = req.files.map(file => file.path);
    const analyses = await forensicImageAnalyzer.batchAnalyze(imagePaths);
    const stats = forensicImageAnalyzer.getSpamStatistics(analyses);
    
    // Sanitize output to prevent XSS
    const sanitizedResult = sanitizeAIOutput({
      success: true,
      analyses,
      statistics: stats
    });
    
    res.json(sanitizedResult);
    
  } catch (error) {
    console.error('Batch forensic analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Analyze image from existing report
 * POST /api/ai/forensic/report/:reportId
 */
router.post('/forensic/report/:reportId', protect, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { imageIndex } = req.body; // Which image to analyze (0-4)
    
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    if (!report.images || report.images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Report has no images'
      });
    }
    
    const imageToAnalyze = report.images[imageIndex || 0];
    if (!imageToAnalyze) {
      return res.status(400).json({
        success: false,
        error: 'Image index out of range'
      });
    }
    
    // Construct full path to image
    const imagePath = path.join(__dirname, '..', imageToAnalyze.url);
    
    const analysis = await forensicImageAnalyzer.analyzeImage(imagePath);
    
    // Update report with forensic analysis
    if (!report.aiAnalysis) {
      report.aiAnalysis = {};
    }
    report.aiAnalysis.forensicAnalysis = analysis;
    
    // If spam detected, flag the report
    if (analysis.is_spam) {
      report.aiAnalysis.spamDetected = true;
      report.aiAnalysis.spamReason = analysis.spam_reason;
    }
    
    await report.save();
    
    res.json({
      success: true,
      analysis,
      reportUpdated: true
    });
    
  } catch (error) {
    console.error('Report forensic analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===========================
// GEOSPATIAL VERIFICATION ROUTES
// ===========================

/**
 * Verify geospatial context of a single image
 * POST /api/ai/geospatial/verify
 * Body: image (file), category (string)
 */
router.post('/geospatial/verify', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const { category } = req.body;
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Report category is required'
      });
    }

    const imagePath = req.file.path;

    console.log(`🌍 Verifying geospatial context for image: ${req.file.filename}, category: ${category}`);

    const verificationResult = await geospatialVerificationService.verifyGeospatialContext(
      imagePath,
      category
    );

    res.json(verificationResult);

  } catch (error) {
    console.error('Geospatial verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Verify geospatial context for batch images
 * POST /api/ai/geospatial/batch
 * Body: images[] (files), categories[] (strings)
 */
router.post('/geospatial/batch', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      });
    }

    const { categories } = req.body;
    if (!categories) {
      return res.status(400).json({
        success: false,
        error: 'Report categories are required'
      });
    }

    // Parse categories if sent as JSON string
    const categoryArray = typeof categories === 'string' 
      ? JSON.parse(categories) 
      : categories;

    const imagePaths = req.files.map(file => file.path);

    console.log(`🌍 Batch verifying ${imagePaths.length} images`);

    const batchResult = await geospatialVerificationService.batchVerify(
      imagePaths,
      categoryArray
    );

    res.json(batchResult);

  } catch (error) {
    console.error('Batch geospatial verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Verify geospatial context for existing report
 * POST /api/ai/geospatial/report/:reportId
 * Body: { imageIndex: number }
 */
router.post('/geospatial/report/:reportId', protect, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { imageIndex = 0 } = req.body;

    // Find report
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Check if report has images
    if (!report.images || report.images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Report has no images'
      });
    }

    // Validate image index
    if (imageIndex < 0 || imageIndex >= report.images.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image index'
      });
    }

    const imagePath = path.join(__dirname, '..', report.images[imageIndex]);

    console.log(`🌍 Verifying geospatial context for report ${reportId}, image ${imageIndex}`);

    const verificationResult = await geospatialVerificationService.verifyGeospatialContext(
      imagePath,
      report.category
    );

    // Update report with verification result
    if (verificationResult.success) {
      report.aiAnalysis = report.aiAnalysis || {};
      report.aiAnalysis.geospatialVerification = {
        environment_type: verificationResult.environment_type,
        lighting_condition: verificationResult.lighting_condition,
        context_mismatch: verificationResult.context_mismatch,
        verification_status: verificationResult.verification_status,
        reasoning: verificationResult.reasoning,
        confidence: verificationResult.confidence,
        image_metadata: verificationResult.image_metadata,
        processing_time_ms: verificationResult.processing_time_ms,
        verified_at: verificationResult.verified_at
      };

      // Flag report if context mismatch detected
      if (verificationResult.context_mismatch || verificationResult.verification_status === 'Rejected') {
        report.aiAnalysis.contextMismatchDetected = true;
        report.aiAnalysis.contextMismatchReason = verificationResult.reasoning;
      }

      await report.save();
    }

    res.json({
      success: true,
      verification: verificationResult,
      reportUpdated: true
    });

  } catch (error) {
    console.error('Report geospatial verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===========================
// LINGUISTIC ANALYSIS ROUTES
// ===========================

/**
 * Analyze multilingual voice transcript
 * POST /api/ai/linguistic/analyze
 * Body: { transcript: string }
 */
router.post('/linguistic/analyze', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required'
      });
    }

    // Sanitize input to prevent prompt injection
    const sanitizedTranscript = sanitizeTranscript(transcript);

    console.log('🗣️ Analyzing multilingual transcript (sanitized)');

    const analysisResult = await linguisticAnalystService.analyzeTranscript(sanitizedTranscript);

    // Sanitize output to prevent XSS
    const sanitizedResult = sanitizeAIOutput(analysisResult);

    res.json(sanitizedResult);

  } catch (error) {
    console.error('Linguistic analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Batch analyze multiple transcripts
 * POST /api/ai/linguistic/batch
 * Body: { transcripts: string[] }
 */
router.post('/linguistic/batch', async (req, res) => {
  try {
    const { transcripts } = req.body;

    if (!transcripts || !Array.isArray(transcripts) || transcripts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transcripts array is required'
      });
    }

    if (transcripts.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 transcripts allowed per batch'
      });
    }

    console.log(`🗣️ Batch analyzing ${transcripts.length} transcripts`);

    const batchResult = await linguisticAnalystService.batchAnalyze(transcripts);

    res.json(batchResult);

  } catch (error) {
    console.error('Batch linguistic analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Analyze transcript and create/update report
 * POST /api/ai/linguistic/report/:reportId
 * Body: { transcript: string }
 */
router.post('/linguistic/report/:reportId', protect, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required'
      });
    }

    // Find report
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    console.log(`🗣️ Analyzing transcript for report ${reportId}`);

    const analysisResult = await linguisticAnalystService.analyzeTranscript(transcript);

    if (analysisResult.success) {
      // Update report with linguistic analysis
      report.aiAnalysis = report.aiAnalysis || {};
      report.aiAnalysis.linguisticAnalysis = {
        english_translation: analysisResult.english_translation,
        summarized_complaint: analysisResult.summarized_complaint,
        detected_language: analysisResult.detected_language,
        extracted_location: analysisResult.extracted_location,
        sentiment_tone: analysisResult.sentiment_tone,
        urgency_rating: analysisResult.urgency_rating,
        confidence: analysisResult.confidence,
        original_transcript: analysisResult.original_transcript,
        processing_time_ms: analysisResult.processing_time_ms,
        analyzed_at: analysisResult.analyzed_at
      };

      // Auto-fill report fields if empty
      if (!report.title && analysisResult.summarized_complaint) {
        report.title = analysisResult.summarized_complaint.substring(0, 100);
      }

      if (!report.description && analysisResult.english_translation) {
        report.description = analysisResult.english_translation;
      }

      // Update severity based on urgency
      if (analysisResult.urgency_rating === 'High' && !report.aiAnalysis.severity) {
        report.aiAnalysis.severity = 'high';
      } else if (analysisResult.urgency_rating === 'Low' && !report.aiAnalysis.severity) {
        report.aiAnalysis.severity = 'low';
      }

      // Flag angry sentiment for priority review
      if (analysisResult.sentiment_tone === 'Angry' || analysisResult.sentiment_tone === 'Urgent') {
        report.aiAnalysis.requiresImmediateAttention = true;
      }

      await report.save();
    }

    res.json({
      success: true,
      analysis: analysisResult,
      reportUpdated: true
    });

  } catch (error) {
    console.error('Report linguistic analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===========================
// DEDUPLICATION ROUTES
// ===========================

/**
 * Check if a report is a duplicate
 * POST /api/ai/deduplication/check
 * Body: { reportId: string }
 */
router.post('/deduplication/check', protect, async (req, res) => {
  try {
    const { reportId } = req.body;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        error: 'Report ID is required'
      });
    }

    // Find the report
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    console.log(`🔍 Checking if report ${reportId} is a duplicate`);

    const deduplicationResult = await deduplicationService.checkDuplicate(report);

    // If duplicate detected, update report
    if (deduplicationResult.is_duplicate && deduplicationResult.duplicate_of) {
      report.aiAnalysis = report.aiAnalysis || {};
      report.aiAnalysis.duplicateDetected = true;
      report.aiAnalysis.duplicateOf = deduplicationResult.duplicate_of;
      report.aiAnalysis.duplicateConfidence = deduplicationResult.confidence_score;
      report.aiAnalysis.duplicateRationale = deduplicationResult.rationale;
      
      await report.save();
    }

    res.json(deduplicationResult);

  } catch (error) {
    console.error('Deduplication check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Batch check multiple reports for duplicates
 * POST /api/ai/deduplication/batch
 * Body: { reportIds: string[] }
 */
router.post('/deduplication/batch', protect, async (req, res) => {
  try {
    const { reportIds } = req.body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Report IDs array is required'
      });
    }

    if (reportIds.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 20 reports allowed per batch'
      });
    }

    // Find all reports
    const reports = await Report.find({ _id: { $in: reportIds } });

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No reports found'
      });
    }

    console.log(`🔍 Batch checking ${reports.length} reports for duplicates`);

    const batchResult = await deduplicationService.batchCheckDuplicates(reports);

    res.json(batchResult);

  } catch (error) {
    console.error('Batch deduplication error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Find all duplicates in database
 * GET /api/ai/deduplication/scan
 * Query: ?limit=100&category=waste&status=pending
 */
router.get('/deduplication/scan', protect, async (req, res) => {
  try {
    const { limit, category, status, startDate } = req.query;

    const options = {
      limit: parseInt(limit) || 100,
      category: category || null,
      status: status ? status.split(',') : ['pending', 'in-progress'],
      startDate: startDate || null
    };

    console.log('🔍 Scanning database for duplicates...');

    const scanResult = await deduplicationService.findAllDuplicates(options);

    res.json(scanResult);

  } catch (error) {
    console.error('Duplicate scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Compare two specific reports
 * POST /api/ai/deduplication/compare
 * Body: { reportId1: string, reportId2: string }
 */
router.post('/deduplication/compare', protect, async (req, res) => {
  try {
    const { reportId1, reportId2 } = req.body;

    if (!reportId1 || !reportId2) {
      return res.status(400).json({
        success: false,
        error: 'Both report IDs are required'
      });
    }

    // Find both reports
    const [report1, report2] = await Promise.all([
      Report.findById(reportId1),
      Report.findById(reportId2)
    ]);

    if (!report1 || !report2) {
      return res.status(404).json({
        success: false,
        error: 'One or both reports not found'
      });
    }

    console.log(`🔍 Comparing reports ${reportId1} and ${reportId2}`);

    // Check if report1 is duplicate of report2
    const comparisonResult = await deduplicationService.checkDuplicate(report1, [report2]);

    res.json({
      success: true,
      report1: {
        id: report1._id,
        title: report1.title,
        category: report1.category
      },
      report2: {
        id: report2._id,
        title: report2.title,
        category: report2.category
      },
      ...comparisonResult
    });

  } catch (error) {
    console.error('Report comparison error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
