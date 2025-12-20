/**
 * Geospatial Verification Service
 * 
 * Validates if the visual environment of an uploaded image matches the reported civic category.
 * Detects indoor/outdoor context mismatches to prevent fraud.
 * 
 * Examples:
 * - ✅ Valid: Pothole photo with asphalt road surface
 * - ❌ Invalid: Pothole photo showing tiled indoor floor
 * - ✅ Valid: Street light photo taken from window (light visible)
 * - ❌ Invalid: Garbage dump photo in bedroom
 */

const ollamaService = require('./ollamaService');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class GeospatialVerificationService {
  constructor() {
    this.enabled = process.env.ENABLE_GEOSPATIAL_VERIFICATION !== 'false';
    this.visionModel = process.env.OLLAMA_VISION_MODEL || 'llava:7b';
    this.temperature = 0.1; // Low temperature for consistent verification
  }

  /**
   * Verify if image context matches the reported category
   * @param {string} imagePath - Path to the image file
   * @param {string} reportCategory - Reported civic category
   * @returns {Object} Verification result with environment analysis
   */
  async verifyGeospatialContext(imagePath, reportCategory) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Geospatial verification service is disabled'
      };
    }

    try {
      console.log(`🌍 Verifying geospatial context for category: ${reportCategory}`);
      const startTime = Date.now();

      // Validate image exists
      const imageExists = await this._validateImageExists(imagePath);
      if (!imageExists) {
        return {
          success: false,
          error: 'Image file not found'
        };
      }

      // Extract image metadata
      const metadata = await this._extractMetadata(imagePath);

      // Perform vision-based verification
      const verificationResult = await this._performVisionVerification(
        imagePath,
        reportCategory,
        metadata
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        ...verificationResult,
        processing_time_ms: processingTime,
        verified_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Geospatial verification error:', error);
      return {
        success: false,
        error: error.message,
        verification_status: 'Error'
      };
    }
  }

  /**
   * Validate image file exists
   */
  async _validateImageExists(imagePath) {
    try {
      await fs.access(imagePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract image metadata using Sharp
   */
  async _extractMetadata(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        hasAlpha: metadata.hasAlpha,
        space: metadata.space
      };
    } catch (error) {
      console.error('⚠️ Metadata extraction failed:', error.message);
      return null;
    }
  }

  /**
   * Perform vision-based verification using LLaVA
   */
  async _performVisionVerification(imagePath, reportCategory, metadata) {
    try {
      // Read and encode image as base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      // Build verification prompt
      const prompt = this._buildVerificationPrompt(reportCategory);

      // Call LLaVA vision model
      const response = await ollamaService.generateVisionResponse(
        this.visionModel,
        prompt,
        base64Image,
        {
          temperature: this.temperature,
          top_p: 0.9
        }
      );

      if (!response || !response.response) {
        throw new Error('Empty response from vision model');
      }

      // Parse and validate response
      const parsedResult = this._parseVerificationResponse(response.response);

      // Add metadata
      parsedResult.image_metadata = metadata;

      return parsedResult;
    } catch (error) {
      console.error('❌ Vision verification failed:', error);
      throw new Error(`Vision verification failed: ${error.message}`);
    }
  }

  /**
   * Build detailed verification prompt for LLaVA
   */
  _buildVerificationPrompt(reportCategory) {
    // Map report categories to expected environments
    const categoryExpectations = {
      'toilet': {
        outdoor: true,
        keywords: ['public toilet', 'urinal', 'washroom', 'street', 'outdoor'],
        invalid_keywords: ['bedroom', 'home bathroom', 'residential']
      },
      'waste': {
        outdoor: true,
        keywords: ['garbage', 'trash', 'street', 'dump', 'road', 'pavement'],
        invalid_keywords: ['kitchen', 'living room', 'indoor', 'home']
      },
      'restaurant': {
        outdoor: false, // Can be indoor
        keywords: ['restaurant', 'kitchen', 'food establishment', 'dining'],
        invalid_keywords: ['bedroom', 'living room', 'residential kitchen']
      },
      'beach': {
        outdoor: true,
        keywords: ['beach', 'sand', 'ocean', 'sea', 'shore', 'coast'],
        invalid_keywords: ['indoor', 'home', 'bedroom', 'pool']
      },
      'street': {
        outdoor: true,
        keywords: ['street', 'road', 'asphalt', 'pavement', 'pothole', 'streetlight'],
        invalid_keywords: ['indoor', 'tile floor', 'carpet', 'bedroom']
      },
      'park': {
        outdoor: true,
        keywords: ['park', 'garden', 'grass', 'trees', 'playground', 'outdoor'],
        invalid_keywords: ['indoor', 'home garden', 'balcony plant']
      },
      'water': {
        outdoor: true,
        keywords: ['waterlogging', 'flood', 'puddle', 'street', 'road'],
        invalid_keywords: ['indoor', 'bathroom', 'sink', 'bucket']
      },
      'drainage': {
        outdoor: true,
        keywords: ['drain', 'sewer', 'manhole', 'street', 'road'],
        invalid_keywords: ['indoor', 'home drain', 'bathroom drain']
      }
    };

    const expectations = categoryExpectations[reportCategory.toLowerCase()] || {
      outdoor: true,
      keywords: ['outdoor', 'public', 'street'],
      invalid_keywords: ['indoor', 'home', 'residential']
    };

    return `You are a Geospatial Verification Expert. You are validating a citizen report claiming to be a "${reportCategory}" issue taken at ${expectations.outdoor ? 'an OUTDOOR public location' : 'a location'}.

Analyze the visual environment of the uploaded image and determine if the context supports the claim.

CRITICAL RULES:
1. **Indoor vs Outdoor Detection**:
   - Indoor: Walls, ceiling, furniture, residential items, tiled floors, carpets
   - Outdoor: Sky visible, street surfaces, asphalt, natural lighting, trees, buildings exterior
   - Semi-Outdoor: Balcony, garage, covered patio (partial walls, open to outside)

2. **Context Matching**:
   - Expected keywords for ${reportCategory}: ${expectations.keywords.join(', ')}
   - Invalid keywords (reject if found): ${expectations.invalid_keywords.join(', ')}

3. **Special Cases**:
   - Street Light reports: Can be taken from a window looking out. Mark as "Verified" if the street light is clearly visible outdoors, even if taken from indoors.
   - Pothole reports: MUST show asphalt/concrete road surface. Reject if tiled floor, carpet, or indoor surface.
   - Restaurant reports: Can be indoor (kitchen inspection), but reject residential kitchens.
   - Water Logging: MUST show outdoor flooding on streets/roads. Reject bathroom/sink water.

4. **Lighting Analysis**:
   - Daylight: Natural light, shadows, blue sky
   - Night - Artificial Light: Streetlights, outdoor lamps visible
   - Night - Flash Only: Camera flash, dark background, no context lighting
   - Flash-only night photos are SUSPICIOUS (may be indoor or manipulated)

5. **Verification Status**:
   - "Verified": Environment matches category expectations perfectly
   - "Suspicious": Ambiguous (e.g., semi-outdoor, unclear context, poor lighting)
   - "Rejected": Clear mismatch (indoor for outdoor category, wrong surface type)

Return ONLY a valid JSON object in this exact format:
{
  "environment_type": "Indoor" | "Outdoor" | "Semi-Outdoor (e.g., Balcony/Garage)",
  "lighting_condition": "Daylight" | "Night - Artificial Light" | "Night - Flash Only",
  "context_mismatch": true or false,
  "verification_status": "Verified" | "Suspicious" | "Rejected",
  "reasoning": "Step-by-step explanation based on visible elements (sky, walls, floor surface, lighting, background). Be specific about what you see.",
  "confidence": 0.0 to 1.0
}

Examples:

Example 1 (Pothole - Valid):
{
  "environment_type": "Outdoor",
  "lighting_condition": "Daylight",
  "context_mismatch": false,
  "verification_status": "Verified",
  "reasoning": "Image shows asphalt road surface with visible crack/hole. Sky visible in background. Natural daylight. Clear outdoor street environment matching pothole category.",
  "confidence": 0.95
}

Example 2 (Pothole - Invalid):
{
  "environment_type": "Indoor",
  "lighting_condition": "Night - Flash Only",
  "context_mismatch": true,
  "verification_status": "Rejected",
  "reasoning": "Image shows smooth tiled floor, not asphalt. Visible walls and indoor furniture in background. No sky or outdoor elements. Clear indoor residential setting contradicts pothole category.",
  "confidence": 0.90
}

Example 3 (Street Light - Valid from Window):
{
  "environment_type": "Semi-Outdoor (e.g., Balcony/Garage)",
  "lighting_condition": "Night - Artificial Light",
  "context_mismatch": false,
  "verification_status": "Verified",
  "reasoning": "Street light pole clearly visible outdoors with illuminated bulb. Photo taken from window (glass reflection visible) but street light itself is in outdoor public space. Valid for street light category.",
  "confidence": 0.85
}

Example 4 (Garbage Dump - Invalid):
{
  "environment_type": "Indoor",
  "lighting_condition": "Daylight",
  "context_mismatch": true,
  "verification_status": "Rejected",
  "reasoning": "Image shows bedroom interior with walls, bed visible. Small trash bag on tiled floor. This is residential indoor waste, not public outdoor garbage dump. Category mismatch.",
  "confidence": 0.92
}

Now analyze the provided image for category "${reportCategory}" and return the JSON.`;
  }

  /**
   * Parse and validate vision model response
   */
  _parseVerificationResponse(responseText) {
    try {
      // Extract JSON from response text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      const requiredFields = [
        'environment_type',
        'lighting_condition',
        'context_mismatch',
        'verification_status',
        'reasoning'
      ];

      for (const field of requiredFields) {
        if (!(field in parsed)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate enum values
      const validEnvironments = ['Indoor', 'Outdoor', 'Semi-Outdoor (e.g., Balcony/Garage)'];
      const validLighting = ['Daylight', 'Night - Artificial Light', 'Night - Flash Only'];
      const validStatus = ['Verified', 'Suspicious', 'Rejected'];

      if (!validEnvironments.includes(parsed.environment_type)) {
        parsed.environment_type = 'Outdoor'; // Safe default
      }

      if (!validLighting.includes(parsed.lighting_condition)) {
        parsed.lighting_condition = 'Daylight'; // Safe default
      }

      if (!validStatus.includes(parsed.verification_status)) {
        parsed.verification_status = 'Suspicious'; // Safe default
      }

      // Ensure boolean
      parsed.context_mismatch = Boolean(parsed.context_mismatch);

      // Ensure confidence is a number between 0 and 1
      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
        parsed.confidence = 0.5; // Safe default
      }

      return parsed;
    } catch (error) {
      console.error('⚠️ Failed to parse verification response:', error.message);
      // Return safe default when parsing fails
      return {
        environment_type: 'Outdoor',
        lighting_condition: 'Daylight',
        context_mismatch: false,
        verification_status: 'Suspicious',
        reasoning: 'Unable to parse AI response - manual review recommended',
        confidence: 0.3
      };
    }
  }

  /**
   * Batch verification for multiple images
   */
  async batchVerify(imagePaths, reportCategories) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Geospatial verification service is disabled'
      };
    }

    const results = [];

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const category = reportCategories[i] || reportCategories[0]; // Use first category if not enough provided

      console.log(`\n🌍 Verifying image ${i + 1}/${imagePaths.length}: ${path.basename(imagePath)}`);

      const result = await this.verifyGeospatialContext(imagePath, category);
      results.push({
        image: path.basename(imagePath),
        category: category,
        ...result
      });

      // Add delay between requests to prevent overwhelming the model
      if (i < imagePaths.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Calculate statistics
    const statistics = this._calculateVerificationStatistics(results);

    return {
      success: true,
      verifications: results,
      statistics
    };
  }

  /**
   * Calculate verification statistics
   */
  _calculateVerificationStatistics(verifications) {
    const total = verifications.length;
    const verified = verifications.filter(v => v.verification_status === 'Verified').length;
    const suspicious = verifications.filter(v => v.verification_status === 'Suspicious').length;
    const rejected = verifications.filter(v => v.verification_status === 'Rejected').length;
    const contextMismatches = verifications.filter(v => v.context_mismatch === true).length;

    // Environment distribution
    const environments = {};
    verifications.forEach(v => {
      const env = v.environment_type || 'Unknown';
      environments[env] = (environments[env] || 0) + 1;
    });

    // Lighting distribution
    const lighting = {};
    verifications.forEach(v => {
      const light = v.lighting_condition || 'Unknown';
      lighting[light] = (lighting[light] || 0) + 1;
    });

    // Average confidence
    const avgConfidence = verifications.reduce((sum, v) => {
      return sum + (v.confidence || 0);
    }, 0) / total;

    return {
      total_verified: total,
      verified_count: verified,
      suspicious_count: suspicious,
      rejected_count: rejected,
      verification_rate: ((verified / total) * 100).toFixed(1) + '%',
      rejection_rate: ((rejected / total) * 100).toFixed(1) + '%',
      context_mismatches: contextMismatches,
      mismatch_rate: ((contextMismatches / total) * 100).toFixed(1) + '%',
      environment_distribution: environments,
      lighting_distribution: lighting,
      average_confidence: avgConfidence.toFixed(2)
    };
  }
}

module.exports = new GeospatialVerificationService();
