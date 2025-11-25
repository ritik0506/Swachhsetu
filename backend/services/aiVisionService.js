const ollamaService = require('./ollamaService');
const path = require('path');
const fs = require('fs').promises;

/**
 * AI Vision Service
 * Image analysis and captioning using LLaVA model via Ollama
 */
class AIVisionService {
  constructor() {
    this.enabled = process.env.ENABLE_AI_VISION === 'true';
    this.visionModel = process.env.OLLAMA_VISION_MODEL || 'llava:7b';
  }

  /**
   * Analyze image and generate caption/description
   * @param {string} imagePath - Path to image file
   * @param {string} context - Additional context about the image
   * @returns {Promise<object>} Analysis results
   */
  async analyzeImage(imagePath, context = '') {
    if (!this.enabled) {
      return {
        success: false,
        error: 'AI vision is disabled',
        enabled: false
      };
    }

    try {
      const startTime = Date.now();

      // Read image file
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      // Build prompt
      const prompt = this.buildVisionPrompt(context);

      // Call Ollama vision API
      const response = await this.callVisionModel(prompt, base64Image);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Vision analysis failed'
        };
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        caption: response.description,
        analysis: response.analysis,
        issues_detected: response.issues || [],
        confidence: response.confidence || 0.8,
        processing_time_ms: duration,
        model_used: this.visionModel
      };

    } catch (error) {
      console.error('Image analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze multiple images
   */
  async analyzeMultipleImages(imagePaths, context = '') {
    const results = [];

    for (const imagePath of imagePaths) {
      const result = await this.analyzeImage(imagePath, context);
      results.push({
        imagePath,
        ...result
      });
    }

    // Combine captions
    const successfulResults = results.filter(r => r.success);
    const combinedCaption = successfulResults
      .map(r => r.caption)
      .join('. ');

    const allIssues = successfulResults
      .flatMap(r => r.issues_detected || []);

    return {
      success: successfulResults.length > 0,
      results,
      combined_caption: combinedCaption,
      all_issues: [...new Set(allIssues)], // Remove duplicates
      total_images: imagePaths.length,
      analyzed_images: successfulResults.length
    };
  }

  /**
   * Build vision analysis prompt
   */
  buildVisionPrompt(context) {
    return `You are analyzing a civic hygiene report image in India. ${context ? `Context: ${context}` : ''}

Analyze this image and provide:
1. A brief description of what you see (1-2 sentences)
2. Identify any cleanliness, hygiene, or infrastructure issues
3. Assess the severity (low/medium/high/critical)

Focus on:
- Garbage/waste accumulation
- Toilet/sanitation conditions
- Street cleanliness
- Infrastructure damage
- Public health hazards
- Water stagnation

Respond in JSON format:
{
  "description": "brief description",
  "issues": ["issue1", "issue2"],
  "severity": "low|medium|high|critical",
  "analysis": "detailed analysis",
  "confidence": 0.0-1.0
}`;
  }

  /**
   * Call Ollama vision model
   */
  async callVisionModel(prompt, base64Image) {
    try {
      // Check if vision model is available
      const health = await ollamaService.healthCheck();
      if (!health.models.some(m => m.name.includes('llava') || m.name.includes('vision'))) {
        console.warn('Vision model not available. Please run: ollama pull llava:7b');
        return {
          success: false,
          error: 'Vision model not available. Run: ollama pull llava:7b'
        };
      }

      // Make API call to Ollama with image
      const response = await fetch(`${ollamaService.baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.visionModel,
          prompt: prompt,
          images: [base64Image],
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Vision API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Try to parse JSON response
      let parsedData;
      try {
        // Extract JSON from response
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: treat as plain text description
          parsedData = {
            description: data.response,
            issues: [],
            severity: 'medium',
            analysis: data.response,
            confidence: 0.7
          };
        }
      } catch (parseError) {
        console.warn('Failed to parse vision response as JSON, using plain text');
        parsedData = {
          description: data.response,
          issues: [],
          severity: 'medium',
          analysis: data.response,
          confidence: 0.7
        };
      }

      return {
        success: true,
        ...parsedData
      };

    } catch (error) {
      console.error('Vision model call error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract key information from image for triage
   */
  async extractTriageInfo(imagePaths) {
    if (!imagePaths || imagePaths.length === 0) {
      return {
        success: true,
        hasImages: false,
        caption: null
      };
    }

    try {
      const analysis = await this.analyzeMultipleImages(imagePaths);
      
      return {
        success: true,
        hasImages: true,
        caption: analysis.combined_caption,
        issues: analysis.all_issues,
        image_analysis: analysis.results
      };
    } catch (error) {
      console.error('Error extracting triage info from images:', error);
      return {
        success: false,
        hasImages: true,
        error: error.message
      };
    }
  }
}

module.exports = new AIVisionService();
