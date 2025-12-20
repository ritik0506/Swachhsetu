/**
 * Advanced Linguistic Analyst Service
 * 
 * Processes multilingual voice transcripts (Hindi, Marathi, Tamil, English mix)
 * Extracts structured civic complaint data with translation, sentiment, and urgency.
 * 
 * Features:
 * - Multilingual translation to English
 * - Professional complaint summarization
 * - Language detection
 * - Location extraction
 * - Sentiment analysis (Neutral/Frustrated/Angry/Urgent)
 * - Urgency rating (High/Medium/Low)
 */

const ollamaService = require('./ollamaService');

class LinguisticAnalystService {
  constructor() {
    this.enabled = process.env.ENABLE_LINGUISTIC_ANALYSIS !== 'false';
    this.model = process.env.OLLAMA_PRIMARY_MODEL || 'llama3:8b';
    this.temperature = 0.3; // Low temperature for consistent extraction
    
    // Common Indian languages
    this.supportedLanguages = [
      'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 
      'Malayalam', 'Bengali', 'Gujarati', 'Punjabi', 'English'
    ];
    
    // Location indicators (transliterated)
    this.locationKeywords = [
      'road', 'street', 'chowk', 'nagar', 'colony', 'sector',
      'market', 'station', 'park', 'beach', 'area', 'zone',
      'marg', 'gali', 'mohalla', 'village', 'town'
    ];
    
    // Urgency indicators
    this.highUrgencyKeywords = [
      'flood', 'overflow', 'block', 'danger', 'accident', 'fire',
      'dead', 'smell', 'disease', 'emergency', 'immediate',
      'hazard', 'critical', 'urgent', 'serious'
    ];
    
    this.lowUrgencyKeywords = [
      'paint', 'fading', 'old', 'cosmetic', 'minor', 'small',
      'slight', 'eventually', 'when possible', 'not urgent'
    ];
  }

  /**
   * Analyze multilingual voice transcript
   * @param {string} voiceTranscript - Raw user speech (mixed languages)
   * @returns {Object} Structured complaint data
   */
  async analyzeTranscript(voiceTranscript) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Linguistic analysis service is disabled'
      };
    }

    // Validate input
    if (!voiceTranscript || typeof voiceTranscript !== 'string') {
      return {
        success: false,
        error: 'Invalid transcript: must be a non-empty string'
      };
    }

    const cleanTranscript = voiceTranscript.trim();
    
    if (cleanTranscript.length === 0) {
      return {
        success: false,
        error: 'Empty transcript provided'
      };
    }
    
    if (cleanTranscript.length < 5) {
      return {
        success: false,
        error: 'Transcript too short (minimum 5 characters required)'
      };
    }
    
    if (cleanTranscript.length > 5000) {
      return {
        success: false,
        error: 'Transcript too long (maximum 5000 characters allowed)'
      };
    }

    try {
      console.log('🗣️ Analyzing multilingual transcript...');
      console.log(`📝 Transcript length: ${cleanTranscript.length} characters`);
      console.log(`📝 Preview: ${cleanTranscript.substring(0, 100)}...`);
      
      const startTime = Date.now();

      // Build analysis prompt
      const prompt = this._buildAnalysisPrompt(cleanTranscript);

      // Call Llama3 for analysis with timeout
      console.log('🤖 Calling Llama3 model...');
      const response = await ollamaService.generate(
        prompt,
        this.model,
        {
          temperature: this.temperature,
          top_p: 0.9,
          num_predict: 512 // Limit response length
        }
      );

      if (!response || !response.text) {
        throw new Error('Empty response from language model');
      }
      
      console.log('✓ Model response received');
      console.log(`📄 Response preview: ${response.text.substring(0, 200)}...`);

      // Parse and validate response
      const parsedResult = this._parseAnalysisResponse(response.text);
      
      if (!parsedResult || typeof parsedResult !== 'object') {
        throw new Error('Failed to parse model response');
      }

      // Add metadata
      const processingTime = Date.now() - startTime;
      parsedResult.processing_time_ms = processingTime;
      parsedResult.analyzed_at = new Date().toISOString();
      parsedResult.original_transcript = cleanTranscript;
      parsedResult.model_used = this.model;

      console.log(`✓ Analysis completed in ${processingTime}ms`);
      console.log(`📊 Result: Language=${parsedResult.detected_language}, Urgency=${parsedResult.urgency_rating}, Sentiment=${parsedResult.sentiment_tone}`);

      return {
        success: true,
        ...parsedResult
      };
    } catch (error) {
      console.error('❌ Linguistic analysis error:', error.message);
      console.error('❌ Stack trace:', error.stack);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      
      if (error.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to Ollama service. Please ensure Ollama is running.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Analysis timeout. The AI model might be busy. Please try again.';
      } else if (error.message?.includes('parse') || error.message?.includes('JSON')) {
        errorMessage = 'Failed to parse AI response. The model might have returned invalid format.';
      }
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Build detailed analysis prompt for Llama3
   */
  _buildAnalysisPrompt(voiceTranscript) {
    return `You are an Advanced Linguistic Analyst for a Civic Grievance System. You will receive a raw transcript of a user speaking in a mix of Indian languages (Hindi, Marathi, Tamil, Telugu, Kannada, etc.) and English.

Your task is to parse this input and output a strictly valid JSON object.

**CRITICAL RULES:**

1. **Translation**: Translate ALL non-English words to English. Maintain the original meaning and context.

2. **Summarization**: Create a professional, concise complaint suitable for government officials:
   - Remove ALL pleasantries ("hello", "thank you", "please", "sir", "madam")
   - Remove filler words ("um", "uh", "like", "you know", "actually")
   - Keep only the core issue description
   - Use formal government language
   - Example: "Persistent garbage accumulation at Market Road junction"

3. **Language Detection**: Identify the PRIMARY language spoken (most words in that language)

4. **Location Extraction**:
   - Look for place names, street names, landmarks, areas
   - Extract exact location mention if present
   - Return null if no location mentioned
   - Examples: "Market Road", "Gandhi Chowk", "Sector 12", "near Railway Station"

5. **Sentiment Tone** - Analyze emotional state:
   - "Neutral": Calm, factual reporting
   - "Frustrated": Mild annoyance, repeated issue
   - "Angry": Strong emotion, loud, accusatory language
   - "Urgent": Time-sensitive, emergency tone, demanding immediate action

6. **Urgency Rating** - Based on issue severity:
   - "High": Flooding, sewage overflow, dead animals, fire hazards, accidents, major blockages
   - "Medium": Garbage piles, potholes, broken streetlights, water logging
   - "Low": Fading paint, minor cracks, cosmetic issues, old infrastructure

**Input Text:**
"${voiceTranscript}"

**Output JSON Structure (MUST be valid JSON, no markdown):**
{
  "english_translation": "Full translation of the user's speech",
  "summarized_complaint": "Professional, concise summary for government officials",
  "detected_language": "Primary language spoken (${this.supportedLanguages.join(', ')})",
  "extracted_location": "Location mentioned or null",
  "sentiment_tone": "Neutral | Frustrated | Angry | Urgent",
  "urgency_rating": "High | Medium | Low",
  "confidence": 0.0 to 1.0
}

**Examples:**

Example 1 (Hindi + English):
Input: "Hello sir, main Gandhi Chowk ke paas rehta hoon. Wahan pe bahut kachra jama ho gaya hai, do hafte se saaf nahi hua. Bahut bura smell aa raha hai. Please urgent action lijiye."
Output:
{
  "english_translation": "Hello sir, I live near Gandhi Chowk. There, a lot of garbage has accumulated, it hasn't been cleaned for two weeks. Very bad smell is coming. Please take urgent action.",
  "summarized_complaint": "Uncleared garbage accumulation at Gandhi Chowk for two weeks with foul odor",
  "detected_language": "Hindi",
  "extracted_location": "Gandhi Chowk",
  "sentiment_tone": "Urgent",
  "urgency_rating": "High",
  "confidence": 0.95
}

Example 2 (English - Neutral):
Input: "There's a small pothole on Nehru Road near the bus stop. It's been there for a month."
Output:
{
  "english_translation": "There's a small pothole on Nehru Road near the bus stop. It's been there for a month.",
  "summarized_complaint": "Small pothole on Nehru Road near bus stop, present for one month",
  "detected_language": "English",
  "extracted_location": "Nehru Road near bus stop",
  "sentiment_tone": "Neutral",
  "urgency_rating": "Medium",
  "confidence": 0.90
}

Example 3 (Marathi - Angry):
Input: "Arre saheb, mi kititi vaar complaint keli! Market Road la paani bharloy, ek mahina zala! Tumhi kahi karat nahi! Lokanchya ghadyat paani shirkun gela!"
Output:
{
  "english_translation": "Sir, I have complained so many times! Water has flooded Market Road, it's been a month! You are not doing anything! Water has entered people's homes!",
  "summarized_complaint": "Persistent water logging on Market Road for one month with water entering homes",
  "detected_language": "Marathi",
  "extracted_location": "Market Road",
  "sentiment_tone": "Angry",
  "urgency_rating": "High",
  "confidence": 0.92
}

Example 4 (Tamil - Frustrated):
Input: "Anna, enoda area la streetlight thodarndhu oru vaaram aaga ozhaikka vilai. Raathiri romba karuttaa irukkadhu. Kuzhandhaigal school ku pogga bayama irukkadhu."
Output:
{
  "english_translation": "Brother, the streetlight in my area has not been working for a week continuously. It is very dark at night. Children are afraid to go to school.",
  "summarized_complaint": "Non-functional streetlight in area for one week causing darkness and safety concerns",
  "detected_language": "Tamil",
  "extracted_location": null,
  "sentiment_tone": "Frustrated",
  "urgency_rating": "Medium",
  "confidence": 0.88
}

Now analyze the provided input text and return ONLY the JSON object (no markdown, no code blocks).`;
  }

  /**
   * Parse and validate AI response
   */
  _parseAnalysisResponse(responseText) {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      const requiredFields = [
        'english_translation',
        'summarized_complaint',
        'detected_language',
        'extracted_location',
        'sentiment_tone',
        'urgency_rating'
      ];

      for (const field of requiredFields) {
        if (!(field in parsed)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate enums
      const validSentiments = ['Neutral', 'Frustrated', 'Angry', 'Urgent'];
      const validUrgency = ['High', 'Medium', 'Low'];

      if (!validSentiments.includes(parsed.sentiment_tone)) {
        parsed.sentiment_tone = 'Neutral'; // Safe default
      }

      if (!validUrgency.includes(parsed.urgency_rating)) {
        parsed.urgency_rating = 'Medium'; // Safe default
      }

      // Validate confidence
      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
        parsed.confidence = 0.7; // Safe default
      }

      // Normalize language name
      if (parsed.detected_language && !this.supportedLanguages.includes(parsed.detected_language)) {
        // Try to match partial
        const matchedLang = this.supportedLanguages.find(lang => 
          lang.toLowerCase() === parsed.detected_language.toLowerCase()
        );
        parsed.detected_language = matchedLang || 'English';
      }

      // Clean up summarized complaint (remove any remaining pleasantries)
      parsed.summarized_complaint = this._cleanSummary(parsed.summarized_complaint);

      return parsed;
    } catch (error) {
      console.error('⚠️ Failed to parse linguistic analysis response:', error.message);
      
      // Return safe defaults when parsing fails
      return {
        english_translation: 'Unable to translate - manual review required',
        summarized_complaint: 'Civic complaint requires manual processing',
        detected_language: 'English',
        extracted_location: null,
        sentiment_tone: 'Neutral',
        urgency_rating: 'Medium',
        confidence: 0.3,
        parsing_error: true
      };
    }
  }

  /**
   * Clean summary by removing common pleasantries and filler words
   */
  _cleanSummary(summary) {
    const fillerWords = [
      /\bhello\b/gi,
      /\bhi\b/gi,
      /\bthank you\b/gi,
      /\bthanks\b/gi,
      /\bplease\b/gi,
      /\bkindly\b/gi,
      /\bsir\b/gi,
      /\bmadam\b/gi,
      /\bmister\b/gi,
      /\bmr\./gi,
      /\bmrs\./gi,
      /\bum\b/gi,
      /\buh\b/gi,
      /\byou know\b/gi,
      /\blike\b/gi,
      /\bactually\b/gi,
      /\bbasically\b/gi
    ];

    let cleaned = summary;
    fillerWords.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
  }

  /**
   * Batch analyze multiple transcripts
   */
  async batchAnalyze(transcripts) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Linguistic analysis service is disabled'
      };
    }

    const results = [];

    for (let i = 0; i < transcripts.length; i++) {
      console.log(`\n🗣️ Analyzing transcript ${i + 1}/${transcripts.length}`);

      const result = await this.analyzeTranscript(transcripts[i]);
      results.push({
        index: i,
        ...result
      });

      // Add delay between requests
      if (i < transcripts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Calculate statistics
    const statistics = this._calculateStatistics(results);

    return {
      success: true,
      analyses: results,
      statistics
    };
  }

  /**
   * Calculate batch statistics
   */
  _calculateStatistics(analyses) {
    const successful = analyses.filter(a => a.success === true);
    const total = analyses.length;

    // Language distribution
    const languages = {};
    successful.forEach(a => {
      const lang = a.detected_language || 'Unknown';
      languages[lang] = (languages[lang] || 0) + 1;
    });

    // Sentiment distribution
    const sentiments = {};
    successful.forEach(a => {
      const sentiment = a.sentiment_tone || 'Neutral';
      sentiments[sentiment] = (sentiments[sentiment] || 0) + 1;
    });

    // Urgency distribution
    const urgency = {};
    successful.forEach(a => {
      const urg = a.urgency_rating || 'Medium';
      urgency[urg] = (urgency[urg] || 0) + 1;
    });

    // Location extraction rate
    const withLocation = successful.filter(a => a.extracted_location !== null).length;

    // Average confidence
    const avgConfidence = successful.reduce((sum, a) => {
      return sum + (a.confidence || 0);
    }, 0) / (successful.length || 1);

    return {
      total_analyzed: total,
      successful_analyses: successful.length,
      failed_analyses: total - successful.length,
      success_rate: ((successful.length / total) * 100).toFixed(1) + '%',
      language_distribution: languages,
      sentiment_distribution: sentiments,
      urgency_distribution: urgency,
      location_extraction_rate: ((withLocation / successful.length) * 100).toFixed(1) + '%',
      average_confidence: avgConfidence.toFixed(2)
    };
  }
}

module.exports = new LinguisticAnalystService();
