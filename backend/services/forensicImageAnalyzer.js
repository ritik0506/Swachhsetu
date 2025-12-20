const ollamaService = require('./ollamaService');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * Forensic Image Analysis Service
 * Validates citizen-submitted images for civic grievances
 * Filters spam, selfies, screenshots, and fraudulent uploads
 */
class ForensicImageAnalyzer {
  constructor() {
    this.enabled = process.env.ENABLE_FORENSIC_ANALYSIS !== 'false';
    this.visionModel = process.env.OLLAMA_VISION_MODEL || 'llava:7b';
    
    // Spam detection patterns
    this.spamIndicators = {
      selfieKeywords: ['selfie', 'face', 'person looking at camera', 'portrait', 'close-up face'],
      screenshotKeywords: ['screenshot', 'screen capture', 'google maps', 'mobile screen', 'app interface'],
      irrelevantKeywords: ['indoor furniture', 'pet', 'cat', 'dog', 'food', 'bedroom', 'living room'],
      qualityIssues: ['too blurry', 'too dark', 'out of focus', 'no clear subject']
    };

    // Civic categories with keywords
    this.civicCategories = {
      'Garbage Dump': ['garbage', 'trash', 'waste', 'litter', 'dumping', 'plastic', 'refuse'],
      'Pothole': ['pothole', 'road damage', 'crater', 'broken road', 'road crack', 'asphalt damage'],
      'Broken Streetlight': ['streetlight', 'lamp post', 'broken light', 'dark street', 'non-functional light'],
      'Water Logging': ['water logging', 'flood', 'stagnant water', 'water accumulation', 'drainage'],
      'Dead Animal': ['dead animal', 'carcass', 'deceased animal', 'animal body'],
      'Construction Debris': ['construction waste', 'debris', 'building material', 'cement', 'bricks'],
      'Sewer Overflow': ['sewage', 'sewer', 'overflow', 'drain blockage', 'manhole'],
      'None': ['unrelated', 'not civic issue', 'unclear']
    };
  }

  /**
   * Main forensic analysis function
   * @param {string} imagePath - Path to the uploaded image
   * @returns {Promise<object>} Analysis result with spam detection and classification
   */
  async analyzeImage(imagePath) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Forensic analysis service is disabled'
      };
    }

    try {
      const startTime = Date.now();

      // Step 1: Technical validation (quality, format, size)
      const technicalCheck = await this.technicalValidation(imagePath);
      if (!technicalCheck.valid) {
        return {
          success: true,
          is_spam: true,
          spam_reason: technicalCheck.reason,
          civic_category: 'None',
          severity_score: 0,
          visual_evidence: 'Image failed technical validation',
          processing_time_ms: Date.now() - startTime
        };
      }

      // Step 2: AI Vision Analysis
      const visionAnalysis = await this.performVisionAnalysis(imagePath);
      
      if (!visionAnalysis.success) {
        throw new Error('Vision analysis failed: ' + visionAnalysis.error);
      }

      // Step 3: Parse and validate results
      const result = {
        success: true,
        is_spam: visionAnalysis.is_spam,
        spam_reason: visionAnalysis.spam_reason || null,
        civic_category: visionAnalysis.civic_category || 'None',
        severity_score: visionAnalysis.severity_score || 0,
        visual_evidence: visionAnalysis.visual_evidence || 'No clear evidence found',
        confidence: visionAnalysis.confidence || 0.5,
        technical_metadata: technicalCheck.metadata,
        processing_time_ms: Date.now() - startTime,
        analyzed_at: new Date()
      };

      return result;

    } catch (error) {
      console.error('Forensic analysis error:', error);
      return {
        success: false,
        error: error.message,
        is_spam: false, // Default to not spam if analysis fails
        civic_category: 'None'
      };
    }
  }

  /**
   * Technical validation of image quality and format
   */
  async technicalValidation(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      
      // Check file size
      const stats = await fs.stat(imagePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      // Validation rules
      if (fileSizeMB > 10) {
        return {
          valid: false,
          reason: 'Image file size exceeds 10MB limit',
          metadata
        };
      }

      if (metadata.width < 200 || metadata.height < 200) {
        return {
          valid: false,
          reason: 'Image resolution too low (minimum 200x200 pixels)',
          metadata
        };
      }

      // Check for extreme aspect ratios (screenshots)
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio > 3 || aspectRatio < 0.3) {
        return {
          valid: false,
          reason: 'Suspicious aspect ratio - likely a screenshot or banner',
          metadata
        };
      }

      return {
        valid: true,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size_mb: fileSizeMB.toFixed(2),
          aspect_ratio: aspectRatio.toFixed(2)
        }
      };

    } catch (error) {
      console.error('Technical validation error:', error);
      return {
        valid: false,
        reason: 'Failed to read image file - corrupted or invalid format'
      };
    }
  }

  /**
   * Perform AI vision analysis using LLaVA
   */
  async performVisionAnalysis(imagePath) {
    try {
      // Convert image to base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      // Build forensic analysis prompt
      const prompt = this.buildForensicPrompt();

      // Call vision model
      const response = await ollamaService.generateWithVision(
        prompt,
        base64Image,
        this.visionModel,
        {
          temperature: 0.1, // Low temperature for consistent analysis
          top_p: 0.9
        }
      );

      if (!response.success) {
        throw new Error('Vision model failed: ' + response.error);
      }

      // Parse JSON response
      const analysis = this.parseVisionResponse(response.text);
      
      return {
        success: true,
        ...analysis
      };

    } catch (error) {
      console.error('Vision analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build forensic analysis prompt
   */
  buildForensicPrompt() {
    return `You are a Forensic Image Analyst for a Smart City Governance Platform. Your goal is to validate citizen-submitted images for civic grievances (garbage, roads, streetlights, etc.) and filter out spam or fraudulent uploads.

Analyze this image and return a strictly valid JSON object with the following fields:

1. "is_spam": (Boolean) - Set to true if the image is:
   - A selfie (person as primary subject)
   - A screenshot (photo of another screen, moiré patterns, app interface)
   - A meme or text-heavy image
   - Completely irrelevant (indoor furniture, pets, food, unrelated scenes)

2. "spam_reason": (String) - If spam, explain why. Examples:
   - "Image is a screenshot of a Google Map"
   - "Primary subject is a human face (selfie)"
   - "Image is too blurry to identify any civic issue"
   - "Indoor scene with no civic relevance"
   - null if not spam

3. "civic_category": (String) - Classify into ONE of these categories:
   - "Garbage Dump" - trash, litter, waste accumulation
   - "Pothole" - road damage, craters, broken asphalt
   - "Broken Streetlight" - non-functional lights, dark streets
   - "Water Logging" - stagnant water, floods, drainage issues
   - "Dead Animal" - animal carcass on road/public space
   - "Construction Debris" - building materials, cement, bricks
   - "Sewer Overflow" - sewage, drain blockage, manhole issues
   - "None" - if spam or unrelated

4. "severity_score": (Integer 1-10) - Estimate urgency:
   - 1-3: Minor issue (single plastic bottle, small crack)
   - 4-6: Moderate (medium-sized garbage pile, small pothole)
   - 7-9: Serious (large dump, major road damage)
   - 10: Critical (complete road blockage, major hazard)
   - 0: if spam

5. "visual_evidence": (String) - One-sentence description of what you see. Examples:
   - "Visible stagnant water covering approx 3 meters of road surface"
   - "Large pile of plastic bags and household waste blocking footpath"
   - "Deep pothole approximately 1 meter wide on main road"
   - "Streetlight pole broken and tilted at 45-degree angle"

6. "confidence": (Float 0.0-1.0) - Your confidence in this analysis

CRITICAL RULES:
- If a person is pointing at a civic issue, DO NOT mark as spam. Only mark spam if the person is the PRIMARY subject.
- If you see moiré patterns or UI elements, mark as screenshot spam.
- If the image is too blurry/dark to identify anything, mark as spam with reason "Poor image quality".
- Be conservative with severity scores - only use 8-10 for truly critical issues.
- Visual evidence must be specific and measurable when possible.

Respond with ONLY the JSON object. No explanations before or after.

JSON Response:`;
  }

  /**
   * Parse vision model response
   */
  parseVisionResponse(text) {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      const required = ['is_spam', 'civic_category', 'severity_score', 'visual_evidence'];
      for (const field of required) {
        if (parsed[field] === undefined) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate civic_category
      const validCategories = [
        'Garbage Dump', 'Pothole', 'Broken Streetlight', 'Water Logging',
        'Dead Animal', 'Construction Debris', 'Sewer Overflow', 'None'
      ];
      
      if (!validCategories.includes(parsed.civic_category)) {
        parsed.civic_category = 'None';
      }

      // Validate severity_score
      parsed.severity_score = Math.max(0, Math.min(10, parseInt(parsed.severity_score) || 0));

      // Ensure confidence is valid
      if (parsed.confidence === undefined) {
        parsed.confidence = 0.7;
      }
      parsed.confidence = Math.max(0, Math.min(1, parseFloat(parsed.confidence)));

      return parsed;

    } catch (error) {
      console.error('Failed to parse vision response:', error);
      console.error('Response text:', text);
      
      // Return safe default
      return {
        is_spam: false,
        spam_reason: null,
        civic_category: 'None',
        severity_score: 0,
        visual_evidence: 'Failed to parse AI response',
        confidence: 0.3
      };
    }
  }

  /**
   * Batch analyze multiple images
   */
  async batchAnalyze(imagePaths) {
    const results = [];
    
    for (const imagePath of imagePaths) {
      const result = await this.analyzeImage(imagePath);
      results.push({
        image: path.basename(imagePath),
        ...result
      });
      
      // Small delay between analyses
      await this.delay(500);
    }
    
    return results;
  }

  /**
   * Get spam statistics for a set of analyses
   */
  getSpamStatistics(analyses) {
    const total = analyses.length;
    const spamCount = analyses.filter(a => a.is_spam).length;
    const validCount = total - spamCount;
    
    // Category distribution
    const categoryDistribution = {};
    analyses
      .filter(a => !a.is_spam)
      .forEach(a => {
        categoryDistribution[a.civic_category] = 
          (categoryDistribution[a.civic_category] || 0) + 1;
      });

    // Average severity
    const avgSeverity = analyses
      .filter(a => !a.is_spam)
      .reduce((sum, a) => sum + a.severity_score, 0) / (validCount || 1);

    return {
      total_analyzed: total,
      spam_detected: spamCount,
      spam_percentage: ((spamCount / total) * 100).toFixed(1),
      valid_reports: validCount,
      category_distribution: categoryDistribution,
      average_severity: avgSeverity.toFixed(1),
      high_severity_count: analyses.filter(a => a.severity_score >= 7).length
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ForensicImageAnalyzer();
