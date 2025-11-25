const ollamaService = require('./ollamaService');

/**
 * AI Follow-up Service
 * Feature 4: Automated follow-up message generation
 */
class AIFollowupService {
  constructor() {
    this.enabled = process.env.ENABLE_AI_FOLLOWUP === 'true';
  }

  /**
   * Generate personalized follow-up message after report resolution
   * @param {object} data - Follow-up data
   * @returns {Promise<object>} Generated message
   */
  async generateFollowup(data) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Follow-up service is disabled'
      };
    }

    try {
      const {
        userName,
        reportTitle,
        reportCategory,
        resolutionNotes,
        resolvedDate,
        userLanguage = 'English',
        tone = 'friendly'
      } = data;

      const startTime = Date.now();
      
      // Build personalized prompt
      const prompt = this.buildFollowupPrompt(data);
      
      // Use Mistral for creative text generation
      const response = await ollamaService.generate(prompt, 'mistral:7b', {
        temperature: 0.7,  // Higher for more creative, natural language
        top_p: 0.9
      });
      
      if (!response.success) {
        return {
          success: false,
          error: 'Failed to generate follow-up',
          details: response.error
        };
      }
      
      // Clean up the message
      const message = this.cleanMessage(response.text);
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        message: message,
        language: userLanguage,
        tone: tone,
        processing_time_ms: duration,
        model_used: response.model,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Follow-up generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate follow-up prompt
   */
  buildFollowupPrompt(data) {
    const {
      userName,
      reportTitle,
      reportCategory,
      resolutionNotes,
      resolvedDate,
      userLanguage,
      tone
    } = data;

    const categoryMap = {
      'waste': 'waste management',
      'toilet': 'public toilet facility',
      'restaurant': 'restaurant hygiene',
      'beach': 'beach cleanliness',
      'street': 'street cleaning',
      'park': 'park maintenance',
      'water': 'water quality',
      'drainage': 'drainage system'
    };

    const categoryText = categoryMap[reportCategory] || 'civic issue';

    return `You are writing a follow-up message for SwachhSetu, a civic hygiene platform. A citizen's report has been resolved and you need to thank them, confirm the resolution, and encourage continued engagement.

CONTEXT:
- Citizen Name: ${userName}
- Report: ${reportTitle}
- Category: ${categoryText}
- Resolution Notes: ${resolutionNotes}
- Resolved On: ${resolvedDate}
- Message Language: ${userLanguage}
- Tone: ${tone}

TASK:
Write a personalized follow-up message in ${userLanguage} that:
1. Thanks the citizen by name for reporting the issue
2. Confirms the issue has been resolved
3. Briefly mentions what was done (based on resolution notes)
4. Asks if they're satisfied with the resolution
5. Encourages them to report future issues
6. Includes a call-to-action (reply "Yes" if satisfied, or "No" to reopen)

TONE GUIDELINES:
- ${tone === 'friendly' ? 'Warm and conversational' : 'Professional but approachable'}
- Grateful and appreciative
- Brief and clear (3-4 sentences)
- Positive and encouraging
- Use first person ("we", "our team")

MESSAGE STRUCTURE:
[Greeting + Thank you] → [Resolution confirmation] → [Satisfaction check] → [Call-to-action]

IMPORTANT: 
- Write ONLY the message text in ${userLanguage}
- No subject line, no signature, no formatting markers
- Keep it under 500 characters
- Make it feel personal, not template-like

MESSAGE:`;
  }

  /**
   * Generate reopening notification
   * @param {object} data - Report data
   * @returns {Promise<object>} Generated message
   */
  async generateReopenNotification(data) {
    try {
      const {
        userName,
        reportTitle,
        reopenReason,
        userLanguage = 'English'
      } = data;

      const prompt = `Write a brief message in ${userLanguage} acknowledging that a citizen named ${userName} has reopened their report about "${reportTitle}" because: ${reopenReason}. 

Assure them we're looking into it again and will resolve it properly this time. Keep it under 200 characters. Write ONLY the message text.

MESSAGE:`;

      const response = await ollamaService.generate(prompt, 'mistral:7b', {
        temperature: 0.6
      });

      if (!response.success) {
        return {
          success: false,
          error: 'Failed to generate notification'
        };
      }

      return {
        success: true,
        message: this.cleanMessage(response.text),
        language: userLanguage
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate progress update message
   * @param {object} data - Progress data
   * @returns {Promise<object>} Generated message
   */
  async generateProgressUpdate(data) {
    try {
      const {
        userName,
        reportTitle,
        currentStatus,
        progressNotes,
        userLanguage = 'English'
      } = data;

      const prompt = `Write a brief progress update in ${userLanguage} for ${userName} about their report "${reportTitle}". 

Current status: ${currentStatus}
Progress: ${progressNotes}

Let them know work is in progress and give them an update. Keep it friendly and brief (under 300 characters). Write ONLY the message text.

MESSAGE:`;

      const response = await ollamaService.generate(prompt, 'mistral:7b', {
        temperature: 0.6
      });

      if (!response.success) {
        return {
          success: false,
          error: 'Failed to generate update'
        };
      }

      return {
        success: true,
        message: this.cleanMessage(response.text),
        language: userLanguage
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate thank you message for feedback
   * @param {object} data - Feedback data
   * @returns {Promise<object>} Generated message
   */
  async generateFeedbackAcknowledgment(data) {
    try {
      const {
        userName,
        feedbackType,  // 'positive' or 'negative'
        userLanguage = 'English'
      } = data;

      const prompt = feedbackType === 'positive'
        ? `Write a brief thank you message in ${userLanguage} to ${userName} for their positive feedback on our service. Encourage them to keep reporting issues. Keep it warm and brief (under 150 characters). Write ONLY the message text.

MESSAGE:`
        : `Write a brief apology message in ${userLanguage} to ${userName} acknowledging their negative feedback. Assure them we'll improve. Keep it sincere and brief (under 150 characters). Write ONLY the message text.

MESSAGE:`;

      const response = await ollamaService.generate(prompt, 'mistral:7b', {
        temperature: 0.6
      });

      if (!response.success) {
        return {
          success: false,
          error: 'Failed to generate acknowledgment'
        };
      }

      return {
        success: true,
        message: this.cleanMessage(response.text),
        language: userLanguage
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean message output
   */
  cleanMessage(text) {
    let cleaned = text.trim();
    
    // Remove markdown
    cleaned = cleaned.replace(/```.*\n/g, '');
    cleaned = cleaned.replace(/```/g, '');
    cleaned = cleaned.replace(/\*\*/g, '');
    cleaned = cleaned.replace(/\*/g, '');
    
    // Remove "MESSAGE:" prefix if present
    cleaned = cleaned.replace(/^(MESSAGE|Message|Here is the message):\s*/i, '');
    
    // Remove quotes if entire message is quoted
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    return cleaned.trim();
  }

  /**
   * Batch generate follow-ups
   * @param {array} dataArray - Array of follow-up data
   * @returns {Promise<array>} Array of generated messages
   */
  async batchGenerateFollowups(dataArray) {
    const results = [];
    
    for (const data of dataArray) {
      const result = await this.generateFollowup(data);
      results.push({
        reportId: data.reportId,
        userId: data.userId,
        ...result
      });
      
      // Small delay between generations
      await this.delay(500);
    }
    
    return results;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AIFollowupService();
