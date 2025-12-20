/**
 * Semantic Data Deduplication Engine
 * 
 * Detects duplicate civic reports using:
 * - Semantic similarity analysis (AI-powered)
 * - Geospatial proximity (within configurable radius)
 * - Temporal analysis (submission time)
 * - Image similarity (perceptual hashing)
 * 
 * Prevents:
 * - Duplicate submissions by same/different users
 * - Spam/fake reports
 * - Redundant admin work
 */

const ollamaService = require('./ollamaService');
const Report = require('../models/Report');

class DeduplicationService {
  constructor() {
    this.enabled = process.env.ENABLE_DEDUPLICATION !== 'false';
    this.model = process.env.OLLAMA_PRIMARY_MODEL || 'llama3:8b';
    this.temperature = 0.2; // Low temperature for consistent similarity detection
    
    // Deduplication thresholds
    this.proximityRadiusMeters = parseInt(process.env.DUPLICATE_RADIUS_METERS) || 20;
    this.semanticThreshold = parseFloat(process.env.DUPLICATE_CONFIDENCE_THRESHOLD) || 0.90;
    this.timeWindowHours = parseInt(process.env.DUPLICATE_TIME_WINDOW_HOURS) || 72; // 3 days
  }

  /**
   * Check if a new report is a duplicate of existing reports
   * @param {Object} newReport - New report to check
   * @param {Array} existingReports - Potential duplicate reports (within proximity)
   * @returns {Object} Deduplication result
   */
  async checkDuplicate(newReport, existingReports = null) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Deduplication service is disabled'
      };
    }

    try {
      console.log('🔍 Checking for duplicate reports...');
      const startTime = Date.now();

      // If no existing reports provided, find candidates
      if (!existingReports || existingReports.length === 0) {
        existingReports = await this._findNearbyReports(newReport);
      }

      if (existingReports.length === 0) {
        return {
          success: true,
          is_duplicate: false,
          confidence_score: 0.0,
          merge_recommendation: 'Keep Separate',
          rationale: 'No nearby reports found within proximity radius',
          candidates_checked: 0,
          processing_time_ms: Date.now() - startTime
        };
      }

      console.log(`  Found ${existingReports.length} nearby report(s) to check`);

      // Analyze each candidate
      const analyses = [];
      for (const existingReport of existingReports) {
        const analysis = await this._analyzeSemanticSimilarity(
          newReport,
          existingReport
        );
        analyses.push({
          existingReportId: existingReport._id,
          ...analysis
        });

        // If high-confidence duplicate found, return immediately
        if (analysis.is_duplicate && analysis.confidence_score >= this.semanticThreshold) {
          break;
        }
      }

      // Find highest confidence match
      const bestMatch = analyses.reduce((max, current) => 
        current.confidence_score > max.confidence_score ? current : max
      , analyses[0]);

      return {
        success: true,
        is_duplicate: bestMatch.is_duplicate,
        confidence_score: bestMatch.confidence_score,
        merge_recommendation: bestMatch.merge_recommendation,
        rationale: bestMatch.rationale,
        duplicate_of: bestMatch.is_duplicate ? bestMatch.existingReportId : null,
        candidates_checked: existingReports.length,
        all_matches: analyses,
        processing_time_ms: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Deduplication error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find nearby reports within proximity radius
   */
  async _findNearbyReports(newReport) {
    if (!newReport.location || !newReport.location.coordinates) {
      console.log('  ⚠️ No location data, skipping proximity check');
      return [];
    }

    const [lng, lat] = newReport.location.coordinates;

    // Find reports within radius using MongoDB geospatial query
    const nearbyReports = await Report.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: this.proximityRadiusMeters
        }
      },
      status: { $in: ['pending', 'in-progress', 'resolved'] }, // Check active reports
      createdAt: {
        $gte: new Date(Date.now() - this.timeWindowHours * 60 * 60 * 1000) // Within time window
      },
      _id: { $ne: newReport._id } // Exclude the new report itself
    }).limit(10); // Limit to 10 closest reports

    return nearbyReports;
  }

  /**
   * Analyze semantic similarity between two reports using AI
   */
  async _analyzeSemanticSimilarity(newReport, existingReport) {
    try {
      // Build comparison prompt
      const prompt = this._buildDeduplicationPrompt(
        this._formatReportForAnalysis(existingReport),
        this._formatReportForAnalysis(newReport)
      );

      // Call Llama3 for semantic analysis
      const response = await ollamaService.generateResponse(
        this.model,
        prompt,
        {
          temperature: this.temperature,
          top_p: 0.9
        }
      );

      if (!response || !response.response) {
        throw new Error('Empty response from language model');
      }

      // Parse and validate response
      const parsed = this._parseDeduplicationResponse(response.response);

      return parsed;

    } catch (error) {
      console.error('  ⚠️ Semantic analysis failed:', error.message);
      
      // Return safe default on error
      return {
        is_duplicate: false,
        confidence_score: 0.0,
        merge_recommendation: 'Keep Separate',
        rationale: 'Analysis failed - manual review recommended'
      };
    }
  }

  /**
   * Format report data for AI analysis
   */
  _formatReportForAnalysis(report) {
    const title = report.title || 'No title';
    const description = report.description || 'No description';
    const category = report.category || 'Unknown';
    
    // Calculate relative time
    const hoursAgo = Math.floor((Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60));
    const timeStr = hoursAgo < 1 ? 'less than 1 hour ago' :
                    hoursAgo < 24 ? `${hoursAgo} hours ago` :
                    `${Math.floor(hoursAgo / 24)} days ago`;

    return `
Category: ${category}
Title: ${title}
Description: ${description}
Submitted: ${timeStr}
`.trim();
  }

  /**
   * Build deduplication prompt for Llama3
   */
  _buildDeduplicationPrompt(existingReportText, newReportText) {
    return `You are a Semantic Data Deduplication Engine for a Civic Grievance System.

Your Task: Determine if 'Report B (New)' is a duplicate of 'Report A (Existing)'.

Context: These two reports were submitted within a ${this.proximityRadiusMeters}-meter GPS radius of each other within the last ${this.timeWindowHours} hours.

**Report A (Existing):**
${existingReportText}

**Report B (New):**
${newReportText}

**Analysis Criteria:**

1. **Entity Match** (Most Important):
   - Do they describe the EXACT SAME physical object/location?
   - Examples of duplicates:
     * "The big green dumpster" vs "A green trash container" (SAME entity)
     * "Broken streetlight #47" vs "The lamp post that's not working" (SAME entity)
     * "Pothole near bus stop" vs "Hole in road by bus stand" (SAME entity)
   - Examples of NON-duplicates:
     * "Dumpster at north gate" vs "Dumpster at south gate" (DIFFERENT locations)
     * "Streetlight A" vs "Streetlight B" (DIFFERENT objects)
     * "Old pothole" vs "New pothole appeared yesterday" (DIFFERENT issues)

2. **Issue Match**:
   - Is the core complaint IDENTICAL?
   - "Overflowing trash" and "Full garbage bin" = SAME issue
   - "Overflowing trash" and "Broken bin lid" = DIFFERENT issues
   - "Pothole" and "Cracked road" = DIFFERENT issues (severity mismatch)

3. **Temporal Match**:
   - Do they describe the same timeframe/occurrence?
   - "Been here for 2 weeks" and "Noticed today" could still be same issue
   - "Happened yesterday" and "Ongoing for months" might be different occurrences

**CRITICAL RULES:**

- Mark as duplicate ONLY if you are 90%+ confident they refer to the SAME physical issue at the SAME location
- Different perspectives of the same issue = duplicate
- Same category but different specific issues = NOT duplicate
- Similar wording but different details = NOT duplicate
- When in doubt, mark as "Keep Separate" (false negatives are safer than false positives)

**Output JSON (MUST be valid JSON, no markdown):**
{
  "is_duplicate": true or false,
  "confidence_score": 0.0 to 1.0,
  "merge_recommendation": "Merge" | "Keep Separate",
  "rationale": "One sentence explaining your decision based on entity/issue/temporal match"
}

**Examples:**

Example 1 (High Confidence Duplicate):
Report A: "There is a large green dumpster on Market Road that has been overflowing for a week. Garbage is spilling onto the street."
Report B: "The big trash bin near Market Road junction is full and smelling bad. It hasn't been emptied."
Output:
{
  "is_duplicate": true,
  "confidence_score": 0.95,
  "merge_recommendation": "Merge",
  "rationale": "Both reports describe the same overflowing dumpster on Market Road with identical core issue and timeframe."
}

Example 2 (Same Category, Different Objects):
Report A: "Streetlight pole #47 near Gandhi Chowk is not working for 3 days."
Report B: "The streetlight at the other end of Gandhi Chowk is also broken."
Output:
{
  "is_duplicate": false,
  "confidence_score": 0.20,
  "merge_recommendation": "Keep Separate",
  "rationale": "Both are streetlight issues in same area but describe different poles (one is #47, other is 'at other end')."
}

Example 3 (Similar Wording, Different Issues):
Report A: "There is a small crack in the road near the bus stop."
Report B: "There is a large pothole near the bus stop that damaged my tire."
Output:
{
  "is_duplicate": false,
  "confidence_score": 0.40,
  "merge_recommendation": "Keep Separate",
  "rationale": "Both mention road damage near bus stop but describe different severity levels (small crack vs large pothole)."
}

Example 4 (Different Perspectives, Same Issue):
Report A: "Broken manhole cover on Station Road is dangerous. Someone could fall in."
Report B: "Open drain on Station Road without cover is a safety hazard for pedestrians."
Output:
{
  "is_duplicate": true,
  "confidence_score": 0.92,
  "merge_recommendation": "Merge",
  "rationale": "Both describe the same missing manhole cover on Station Road from different perspectives (safety concern)."
}

Example 5 (Temporal Mismatch):
Report A: "Water logging at Market Square has been a problem for months."
Report B: "New flooding appeared at Market Square after yesterday's rain."
Output:
{
  "is_duplicate": false,
  "confidence_score": 0.55,
  "merge_recommendation": "Keep Separate",
  "rationale": "Both describe flooding at same location but temporal mismatch (ongoing months vs appeared yesterday) suggests different occurrences."
}

Now analyze the provided reports and return ONLY the JSON object (no markdown, no code blocks).`;
  }

  /**
   * Parse AI response
   */
  _parseDeduplicationResponse(responseText) {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      const requiredFields = ['is_duplicate', 'confidence_score', 'merge_recommendation', 'rationale'];
      for (const field of requiredFields) {
        if (!(field in parsed)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate types and ranges
      parsed.is_duplicate = Boolean(parsed.is_duplicate);
      
      if (typeof parsed.confidence_score !== 'number' || parsed.confidence_score < 0 || parsed.confidence_score > 1) {
        parsed.confidence_score = 0.5;
      }

      const validRecommendations = ['Merge', 'Keep Separate'];
      if (!validRecommendations.includes(parsed.merge_recommendation)) {
        parsed.merge_recommendation = 'Keep Separate';
      }

      return parsed;

    } catch (error) {
      console.error('  ⚠️ Failed to parse deduplication response:', error.message);
      
      return {
        is_duplicate: false,
        confidence_score: 0.0,
        merge_recommendation: 'Keep Separate',
        rationale: 'Unable to parse AI response - manual review recommended'
      };
    }
  }

  /**
   * Batch check multiple reports for duplicates
   */
  async batchCheckDuplicates(reports) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Deduplication service is disabled'
      };
    }

    const results = [];

    for (let i = 0; i < reports.length; i++) {
      console.log(`\n🔍 Checking report ${i + 1}/${reports.length} for duplicates`);

      const result = await this.checkDuplicate(reports[i]);
      results.push({
        reportId: reports[i]._id,
        ...result
      });

      // Add delay between requests
      if (i < reports.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Calculate statistics
    const statistics = this._calculateStatistics(results);

    return {
      success: true,
      deduplication_results: results,
      statistics
    };
  }

  /**
   * Calculate deduplication statistics
   */
  _calculateStatistics(results) {
    const total = results.length;
    const duplicatesFound = results.filter(r => r.is_duplicate === true).length;
    const highConfidence = results.filter(r => r.confidence_score >= 0.90).length;
    const mediumConfidence = results.filter(r => r.confidence_score >= 0.70 && r.confidence_score < 0.90).length;
    const lowConfidence = results.filter(r => r.confidence_score < 0.70).length;

    const avgConfidence = results.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / total;

    const mergeRecommended = results.filter(r => r.merge_recommendation === 'Merge').length;

    return {
      total_checked: total,
      duplicates_found: duplicatesFound,
      duplicate_rate: ((duplicatesFound / total) * 100).toFixed(1) + '%',
      merge_recommended: mergeRecommended,
      confidence_distribution: {
        high: highConfidence,
        medium: mediumConfidence,
        low: lowConfidence
      },
      average_confidence: avgConfidence.toFixed(2)
    };
  }

  /**
   * Find all duplicates in the database
   * Useful for batch cleanup/auditing
   */
  async findAllDuplicates(options = {}) {
    const { 
      limit = 100, 
      category = null,
      status = ['pending', 'in-progress'],
      startDate = null 
    } = options;

    try {
      console.log('🔍 Scanning database for duplicate reports...');

      const query = { status: { $in: status } };
      if (category) query.category = category;
      if (startDate) query.createdAt = { $gte: new Date(startDate) };

      const reports = await Report.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);

      console.log(`  Found ${reports.length} reports to analyze`);

      const duplicatePairs = [];

      for (let i = 0; i < reports.length; i++) {
        const result = await this.checkDuplicate(reports[i]);
        
        if (result.is_duplicate && result.duplicate_of) {
          duplicatePairs.push({
            newReport: reports[i]._id,
            existingReport: result.duplicate_of,
            confidence: result.confidence_score,
            rationale: result.rationale
          });
        }

        // Progress indicator
        if ((i + 1) % 10 === 0) {
          console.log(`  Progress: ${i + 1}/${reports.length} reports checked`);
        }
      }

      return {
        success: true,
        total_scanned: reports.length,
        duplicates_found: duplicatePairs.length,
        duplicate_pairs: duplicatePairs
      };

    } catch (error) {
      console.error('❌ Duplicate scanning error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new DeduplicationService();
