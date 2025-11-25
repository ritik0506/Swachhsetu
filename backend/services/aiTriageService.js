const ollamaService = require('./ollamaService');
const { franc } = require('franc');
const aiVisionService = require('./aiVisionService');
const geospatialService = require('./geospatialService');

/**
 * AI Triage Service
 * Feature 1: Automatic report classification and triage
 */
class AITriageService {
  constructor() {
    this.enabled = process.env.ENABLE_AI_TRIAGE === 'true';
    this.confidenceThreshold = parseFloat(process.env.AI_CONFIDENCE_THRESHOLD) || 0.7;
  }

  /**
   * Triage a report using AI
   * @param {object} report - Report data
   * @returns {Promise<object>} Triage results
   */
  async triageReport(report) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'AI triage is disabled',
        enabled: false
      };
    }

    try {
      const startTime = Date.now();
      const { description, title, category, location, images } = report;
      
      // 1. Detect language
      const detectedLanguage = this.detectLanguage(description);
      
      // 2. Analyze images if available
      let imageAnalysis = null;
      if (images && images.length > 0 && process.env.ENABLE_AI_VISION === 'true') {
        try {
          const imagePaths = images.map(img => {
            // Handle both URL formats and file paths
            if (img.url) {
              return img.url.startsWith('/uploads/') 
                ? `./uploads/${img.url.split('/uploads/')[1]}`
                : img.url;
            }
            return img;
          });
          
          imageAnalysis = await aiVisionService.extractTriageInfo(imagePaths);
          console.log('Image analysis completed:', imageAnalysis.success);
        } catch (visionError) {
          console.warn('Image analysis failed, continuing without it:', visionError.message);
        }
      }
      
      // 3. Get geospatial context
      let geoContext = null;
      if (location && location.coordinates) {
        try {
          const contextData = await geospatialService.enrichReportContext({ location });
          if (contextData.success) {
            geoContext = geospatialService.buildContextString(contextData);
            console.log('Geospatial context:', geoContext);
          }
        } catch (geoError) {
          console.warn('Geospatial context failed, continuing without it:', geoError.message);
        }
      }
      
      // 4. Build context-rich prompt (include image and geo context if available)
      const prompt = this.buildTriagePrompt(
        description, 
        title, 
        category, 
        location,
        imageAnalysis,
        geoContext
      );
      
      // 3. Call Llama3 for classification
      const response = await ollamaService.generateJSON(prompt, 'llama3:8b');
      
      if (!response.success || !response.parsed) {
        return {
          success: false,
          error: 'Failed to parse AI response',
          raw_response: response.text,
          parse_error: response.parseError
        };
      }
      
      // 4. Validate and enrich response
      const triageResult = this.validateTriageOutput(response.json);
      
      // 5. Determine action based on confidence
      const shouldAutoProcess = triageResult.confidence >= this.confidenceThreshold;
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        analysis: {
          language: detectedLanguage,
          ...triageResult,
          should_auto_process: shouldAutoProcess,
          processing_time_ms: duration,
          model_used: response.model,
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('Triage error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Detect language of text
   * @param {string} text - Text to analyze
   * @returns {object} Language detection result
   */
  detectLanguage(text) {
    try {
      const langCode = franc(text, { minLength: 3, only: ['eng', 'hin', 'mar', 'ben', 'tel', 'tam', 'guj', 'kan', 'mal', 'urd'] });
      
      const languageMap = {
        'eng': 'English',
        'hin': 'Hindi',
        'mar': 'Marathi',
        'ben': 'Bengali',
        'tel': 'Telugu',
        'tam': 'Tamil',
        'guj': 'Gujarati',
        'kan': 'Kannada',
        'mal': 'Malayalam',
        'urd': 'Urdu'
      };
      
      return {
        code: langCode,
        name: languageMap[langCode] || 'Unknown',
        confidence: langCode !== 'und' ? 0.9 : 0.3
      };
    } catch (error) {
      return {
        code: 'und',
        name: 'Unknown',
        confidence: 0
      };
    }
  }

  /**
   * Build AI prompt for triage
   */
  buildTriagePrompt(description, title, category, location, imageAnalysis = null, geoContext = null) {
    const locationStr = location?.address || location?.landmark || 'Unknown location';
    
    // Add image analysis context if available
    let imageContext = '';
    if (imageAnalysis && imageAnalysis.success && imageAnalysis.hasImages) {
      imageContext = `\n\nIMAGE ANALYSIS:
Caption: ${imageAnalysis.caption || 'N/A'}
Detected Issues: ${imageAnalysis.issues?.join(', ') || 'None detected'}`;
    }
    
    // Add geospatial context if available
    let geoContextStr = '';
    if (geoContext) {
      geoContextStr = `\n\nGEOSPATIAL CONTEXT:
${geoContext}`;
    }
    
    return `You are an AI assistant for SwachhSetu, a civic hygiene monitoring platform in India. Analyze this citizen report and provide structured classification.

REPORT DETAILS:
Title: ${title}
Description: ${description}
Submitted Category: ${category}
Location: ${locationStr}${imageContext}${geoContextStr}

TASK:
Analyze the report and provide classification in the following JSON format:

{
  "refined_category": "string",
  "severity": "string",
  "priority": number,
  "suggested_title": "string",
  "recommended_action": "string",
  "confidence": number,
  "rationale": "string",
  "tags": ["string"],
  "requires_immediate_attention": boolean,
  "estimated_resolution_time": "string"
}

FIELD SPECIFICATIONS:

1. refined_category: Choose the most accurate category
   Options: "toilet", "waste", "restaurant", "beach", "street", "park", "water", "drainage", "other"

2. severity: Assess urgency and health impact
   - "low": Minor issue, cosmetic problem, no immediate risk
   - "medium": Noticeable problem, needs attention within days
   - "high": Significant issue, health concerns, urgent action needed
   - "critical": Severe health/safety risk, immediate response required

3. priority: Processing priority (1-5)
   1 = Can wait, 2 = Standard, 3 = Important, 4 = Urgent, 5 = Critical

4. suggested_title: Clear, concise title in 8-12 words that describes the core issue

5. recommended_action: What system should do
   - "create_ticket": Standard issue, create work ticket
   - "notify_inspector": Needs field inspection immediately
   - "escalate": Serious issue, escalate to senior staff
   - "requires_review": Unclear or complex, needs human review
   - "ignore": Spam, duplicate, or invalid report

6. confidence: Your confidence in this classification (0.0 to 1.0)
   > 0.85 = Very confident
   0.70-0.85 = Confident
   0.50-0.70 = Moderate confidence
   < 0.50 = Low confidence, needs review

7. rationale: Brief explanation in 30-50 words explaining your classification

8. tags: 3-5 relevant tags for categorization and search (e.g., ["overflow", "public_health", "monsoon"])

9. requires_immediate_attention: true if severity is critical or high priority

10. estimated_resolution_time: Expected time to resolve ("hours", "days", "weeks")

CLASSIFICATION GUIDELINES:
- Overflowing waste bins → medium/high severity
- Blocked drains during monsoon → high/critical severity
- Broken street lights → low/medium severity
- Restaurant hygiene violations → high severity
- Toilet facility issues → medium/high severity
- Water contamination → critical severity
- General cleanliness complaints → low/medium severity

Consider location context: Issues near schools, hospitals, markets are higher priority.

Provide ONLY the JSON response, no additional text.`;
  }

  /**
   * Validate and normalize AI output
   */
  validateTriageOutput(json) {
    const validCategories = ['toilet', 'waste', 'restaurant', 'beach', 'street', 'park', 'water', 'drainage', 'other'];
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    const validActions = ['create_ticket', 'notify_inspector', 'escalate', 'requires_review', 'ignore'];
    
    return {
      refined_category: validCategories.includes(json.refined_category) 
        ? json.refined_category 
        : json.refined_category || 'other',
      severity: validSeverities.includes(json.severity) 
        ? json.severity 
        : 'medium',
      priority: Math.min(Math.max(parseInt(json.priority) || 3, 1), 5),
      suggested_title: json.suggested_title || 'Civic Issue Report',
      recommended_action: validActions.includes(json.recommended_action) 
        ? json.recommended_action 
        : 'requires_review',
      confidence: Math.min(Math.max(parseFloat(json.confidence) || 0.5, 0), 1),
      rationale: json.rationale || 'Automated classification based on report content',
      tags: Array.isArray(json.tags) ? json.tags.slice(0, 5) : [],
      requires_immediate_attention: json.requires_immediate_attention === true,
      estimated_resolution_time: json.estimated_resolution_time || 'days'
    };
  }

  /**
   * Batch triage multiple reports
   * @param {array} reports - Array of reports
   * @returns {Promise<array>} Triage results
   */
  async batchTriage(reports) {
    const results = [];
    
    for (const report of reports) {
      const result = await this.triageReport(report);
      results.push({
        reportId: report._id || report.id,
        ...result
      });
      
      // Small delay to avoid overwhelming Ollama
      await this.delay(500);
    }
    
    return results;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AITriageService();
