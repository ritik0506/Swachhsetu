const ollamaService = require('./ollamaService');

/**
 * AI Chatbot Service
 * Conversational interface to guide users through report submission
 */
class AIChatbotService {
  constructor() {
    this.enabled = process.env.ENABLE_AI_CHATBOT !== 'false';
    this.sessionMemory = new Map(); // Store conversation context
    this.sessionTimeout = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Initialize or get session
   */
  getSession(sessionId) {
    if (!this.sessionMemory.has(sessionId)) {
      this.sessionMemory.set(sessionId, {
        messages: [],
        extractedData: {},
        currentStep: 'greeting',
        createdAt: Date.now()
      });
    }

    const session = this.sessionMemory.get(sessionId);
    
    // Check if session expired
    if (Date.now() - session.createdAt > this.sessionTimeout) {
      this.resetSession(sessionId);
      return this.sessionMemory.get(sessionId);
    }

    return session;
  }

  /**
   * Reset session
   */
  resetSession(sessionId) {
    this.sessionMemory.set(sessionId, {
      messages: [],
      extractedData: {},
      currentStep: 'greeting',
      createdAt: Date.now()
    });
  }

  /**
   * Chat with user and extract report data
   */
  async chat(sessionId, userMessage) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Chatbot service is disabled'
      };
    }

    try {
      const session = this.getSession(sessionId);
      
      // Add user message to history
      session.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });

      // Build conversation prompt
      const prompt = this.buildChatPrompt(session);

      // Get AI response
      const response = await ollamaService.generate(prompt, 'llama3:8b', {
        temperature: 0.7,
        top_p: 0.9
      });

      if (!response.success) {
        return {
          success: false,
          error: 'Failed to generate response'
        };
      }

      // Parse AI response
      const parsed = this.parseAIResponse(response.text);

      // Add assistant message to history
      session.messages.push({
        role: 'assistant',
        content: parsed.message,
        timestamp: new Date()
      });

      // Update extracted data
      if (parsed.extractedData) {
        session.extractedData = {
          ...session.extractedData,
          ...parsed.extractedData
        };
      }

      // Update current step
      if (parsed.nextStep) {
        session.currentStep = parsed.nextStep;
      }

      return {
        success: true,
        message: parsed.message,
        extractedData: session.extractedData,
        currentStep: session.currentStep,
        isComplete: parsed.isComplete || false,
        suggestions: parsed.suggestions || [],
        requiresInput: parsed.requiresInput !== false
      };

    } catch (error) {
      console.error('Chatbot error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build conversation prompt
   */
  buildChatPrompt(session) {
    const conversationHistory = session.messages
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    return `You are SwachhBot, a friendly AI assistant helping users report civic hygiene issues in India. Your goal is to gather all necessary information for a hygiene report through natural conversation.

CONVERSATION STEPS:
1. Greeting - Warm welcome, ask what issue they want to report
2. Category - Identify category (toilet/waste/restaurant/beach/street/park/water/other)
3. Description - Get detailed description of the issue
4. Location - Confirm location or ask for address/landmark
5. Severity - Assess urgency (low/medium/high/critical)
6. Photos - Remind to upload photos if not done
7. Confirmation - Summarize and confirm before submission

CURRENT EXTRACTED DATA:
${JSON.stringify(session.extractedData, null, 2)}

CURRENT STEP: ${session.currentStep}

CONVERSATION HISTORY:
${conversationHistory}

INSTRUCTIONS:
- Be warm, friendly, and empathetic
- Ask ONE question at a time
- Use simple language (many users speak Hindi/local languages)
- If user mentions multiple issues, focus on the most urgent first
- Extract and store: category, title, description, location, severity
- When you have enough info, set isComplete=true

Respond in this JSON format:
{
  "message": "Your friendly response to the user",
  "extractedData": {
    "category": "toilet|waste|restaurant|beach|street|park|water|other",
    "title": "Brief title (optional)",
    "description": "Detailed description (optional)",
    "location": "Address or landmark (optional)",
    "severity": "low|medium|high|critical (optional)"
  },
  "nextStep": "greeting|category|description|location|severity|photos|confirmation",
  "isComplete": false,
  "suggestions": ["Option 1", "Option 2", "Option 3"],
  "requiresInput": true
}

IMPORTANT: Provide ONLY the JSON response. No explanations before or after.`;
  }

  /**
   * Parse AI response
   */
  parseAIResponse(text) {
    try {
      // Try to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }

      // Fallback: treat entire text as message
      return {
        message: text,
        extractedData: {},
        nextStep: null,
        isComplete: false,
        suggestions: [],
        requiresInput: true
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        message: text,
        extractedData: {},
        nextStep: null,
        isComplete: false,
        suggestions: [],
        requiresInput: true
      };
    }
  }

  /**
   * Get greeting message
   */
  getGreeting() {
    return {
      success: true,
      message: "Hello! I'm SwachhBot 🤖\n\nI'm here to help you report hygiene issues quickly. Just describe the problem in your own words, and I'll guide you through the process.\n\nWhat issue would you like to report today?",
      extractedData: {},
      currentStep: 'greeting',
      isComplete: false,
      suggestions: [
        'Dirty public toilet',
        'Garbage accumulation',
        'Unhygienic restaurant',
        'Other issue'
      ],
      requiresInput: true
    };
  }

  /**
   * Clear old sessions (cleanup)
   */
  clearExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessionMemory.entries()) {
      if (now - session.createdAt > this.sessionTimeout) {
        this.sessionMemory.delete(sessionId);
        console.log(`Cleared expired session: ${sessionId}`);
      }
    }
  }

  /**
   * Get session statistics
   */
  getStats() {
    return {
      activeSessions: this.sessionMemory.size,
      sessions: Array.from(this.sessionMemory.entries()).map(([id, session]) => ({
        id,
        messageCount: session.messages.length,
        currentStep: session.currentStep,
        hasData: Object.keys(session.extractedData).length > 0,
        ageMinutes: Math.floor((Date.now() - session.createdAt) / 60000)
      }))
    };
  }
}

// Run cleanup every 5 minutes
const chatbotService = new AIChatbotService();
setInterval(() => {
  chatbotService.clearExpiredSessions();
}, 5 * 60 * 1000);

module.exports = chatbotService;
