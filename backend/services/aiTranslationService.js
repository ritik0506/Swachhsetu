const ollamaService = require('./ollamaService');
const { franc } = require('franc');

/**
 * AI Translation Service
 * Feature 3: Multi-language translation for reports and responses
 */
class AITranslationService {
  constructor() {
    this.enabled = process.env.ENABLE_AI_TRANSLATION === 'true';
    this.maxLength = parseInt(process.env.MAX_TRANSLATION_LENGTH) || 5000;
    
    // Supported languages
    this.languageMap = {
      'eng': 'English',
      'hin': 'Hindi',
      'mar': 'Marathi',
      'ben': 'Bengali',
      'tel': 'Telugu',
      'tam': 'Tamil',
      'guj': 'Gujarati',
      'kan': 'Kannada',
      'mal': 'Malayalam',
      'urd': 'Urdu',
      'pan': 'Punjabi',
      'ori': 'Odia'
    };
    
    this.reverseLanguageMap = Object.fromEntries(
      Object.entries(this.languageMap).map(([k, v]) => [v.toLowerCase(), k])
    );
  }

  /**
   * Detect language of text
   * @param {string} text - Text to analyze
   * @returns {Promise<object>} Language detection result
   */
  async detectLanguage(text) {
    if (!text || text.trim().length < 3) {
      return {
        code: 'und',
        name: 'Unknown',
        confidence: 0
      };
    }

    try {
      const langCode = franc(text, { 
        minLength: 3,
        only: Object.keys(this.languageMap)
      });
      
      return {
        code: langCode,
        name: this.languageMap[langCode] || 'Unknown',
        confidence: langCode !== 'und' ? 0.9 : 0.3,
        detected: true
      };
    } catch (error) {
      console.error('Language detection error:', error);
      return {
        code: 'und',
        name: 'Unknown',
        confidence: 0,
        detected: false
      };
    }
  }

  /**
   * Translate text to target language
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language name (e.g., 'Hindi', 'English')
   * @param {string} sourceLang - Source language (optional, will auto-detect)
   * @returns {Promise<object>} Translation result
   */
  async translate(text, targetLang = 'English', sourceLang = null) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Translation service is disabled'
      };
    }

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'Empty text provided'
      };
    }

    if (text.length > this.maxLength) {
      return {
        success: false,
        error: `Text too long (max ${this.maxLength} characters)`
      };
    }

    try {
      const startTime = Date.now();
      
      // Detect source language if not provided
      let detectedLang = sourceLang;
      if (!detectedLang) {
        const detection = await this.detectLanguage(text);
        detectedLang = detection.name;
      }
      
      // Skip translation if already in target language
      if (detectedLang.toLowerCase() === targetLang.toLowerCase()) {
        return {
          success: true,
          original: text,
          translated: text,
          source_lang: detectedLang,
          target_lang: targetLang,
          skipped: true,
          reason: 'Already in target language'
        };
      }
      
      // Build translation prompt
      const prompt = this.buildTranslationPrompt(text, detectedLang, targetLang);
      
      // Use Mistral for faster translation
      const response = await ollamaService.generate(prompt, 'mistral:7b', {
        temperature: 0.3,
        top_p: 0.9
      });
      
      if (!response.success) {
        return {
          success: false,
          error: 'Translation failed',
          details: response.error
        };
      }
      
      // Clean up the translation
      const translated = this.cleanTranslation(response.text);
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        original: text,
        translated: translated,
        source_lang: detectedLang,
        target_lang: targetLang,
        processing_time_ms: duration,
        model_used: response.model,
        character_count: text.length,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Translation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Translate to English (canonical language for processing)
   * @param {string} text - Text to translate
   * @returns {Promise<object>} Translation result
   */
  async translateToEnglish(text) {
    return this.translate(text, 'English');
  }

  /**
   * Translate from English to user's language
   * @param {string} text - English text
   * @param {string} userLanguage - User's preferred language
   * @returns {Promise<object>} Translation result
   */
  async translateToUserLanguage(text, userLanguage) {
    return this.translate(text, userLanguage, 'English');
  }

  /**
   * Batch translate multiple texts
   * @param {array} texts - Array of text strings
   * @param {string} targetLang - Target language
   * @returns {Promise<array>} Array of translation results
   */
  async batchTranslate(texts, targetLang = 'English') {
    const results = [];
    
    for (const text of texts) {
      const result = await this.translate(text, targetLang);
      results.push(result);
      
      // Small delay between requests
      await this.delay(300);
    }
    
    return results;
  }

  /**
   * Build translation prompt
   */
  buildTranslationPrompt(text, sourceLang, targetLang) {
    return `You are a professional translator specializing in Indian languages and civic/municipal terminology.

TASK: Translate the following text from ${sourceLang} to ${targetLang}.

GUIDELINES:
1. Maintain the original meaning and tone
2. Use appropriate formal/informal register
3. Keep technical terms related to hygiene, sanitation, and civic issues accurate
4. Preserve proper nouns (names, locations)
5. Keep numbers and measurements unchanged
6. For civic terms without direct translation, provide the closest equivalent with the English term in parentheses

SOURCE TEXT (${sourceLang}):
${text}

IMPORTANT: Provide ONLY the translated text in ${targetLang}. Do not include explanations, notes, or the original text. Just the translation.

TRANSLATION (${targetLang}):`;
  }

  /**
   * Clean translation output
   */
  cleanTranslation(text) {
    // Remove common AI response artifacts
    let cleaned = text.trim();
    
    // Remove markdown formatting
    cleaned = cleaned.replace(/```.*\n/g, '');
    cleaned = cleaned.replace(/```/g, '');
    
    // Remove "Translation:" prefix if present
    cleaned = cleaned.replace(/^(Translation|Translated text|Here is the translation):\s*/i, '');
    
    // Remove quotes if entire text is quoted
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    return cleaned.trim();
  }

  /**
   * Get supported languages list
   */
  getSupportedLanguages() {
    return Object.values(this.languageMap);
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language) {
    const normalized = language.toLowerCase();
    return Object.values(this.languageMap).some(
      lang => lang.toLowerCase() === normalized
    );
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AITranslationService();
