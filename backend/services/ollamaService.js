const axios = require('axios');

/**
 * Ollama Service - Core AI integration service
 * Handles communication with local Ollama instance
 */
class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.primaryModel = process.env.OLLAMA_PRIMARY_MODEL || 'llama3:8b';
    this.secondaryModel = process.env.OLLAMA_SECONDARY_MODEL || 'mistral:7b';
    this.timeout = parseInt(process.env.OLLAMA_TIMEOUT) || 120000;
    this.maxRetries = parseInt(process.env.OLLAMA_MAX_RETRIES) || 3;
  }

  /**
   * Generate text using Ollama
   * @param {string} prompt - The prompt to send to the model
   * @param {string} model - Model name (optional)
   * @param {object} options - Generation options
   * @returns {Promise<object>} Response object
   */
  async generate(prompt, model = null, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${this.baseURL}/api/generate`,
          {
            model: model || this.primaryModel,
            prompt: prompt,
            stream: false,
            options: {
              temperature: options.temperature || 0.7,
              top_p: options.top_p || 0.9,
              top_k: options.top_k || 40,
              num_predict: options.num_predict || 512,
              ...options
            }
          },
          { timeout: this.timeout }
        );
        
        return {
          success: true,
          text: response.data.response,
          model: response.data.model,
          context: response.data.context,
          total_duration: response.data.total_duration,
          load_duration: response.data.load_duration,
          prompt_eval_count: response.data.prompt_eval_count,
          eval_count: response.data.eval_count
        };
      } catch (error) {
        lastError = error;
        console.error(`Ollama generation error (attempt ${attempt}/${this.maxRetries}):`, error.message);
        
        if (attempt < this.maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          await this.delay(Math.pow(2, attempt - 1) * 1000);
        }
      }
    }
    
    return {
      success: false,
      error: lastError?.message || 'Failed to generate response',
      attempts: this.maxRetries
    };
  }

  /**
   * Generate JSON output using Ollama
   * @param {string} prompt - The prompt to send
   * @param {string} model - Model name (optional)
   * @returns {Promise<object>} Response with parsed JSON
   */
  async generateJSON(prompt, model = null) {
    const enhancedPrompt = `${prompt}

IMPORTANT: Respond ONLY with valid JSON. No explanations, no markdown, no code blocks. Just pure JSON.`;

    const response = await this.generate(
      enhancedPrompt,
      model,
      { 
        temperature: 0.3,  // Lower temperature for more consistent output
        top_p: 0.9
      }
    );
    
    if (response.success) {
      try {
        // Extract JSON from response (handles markdown code blocks)
        let jsonText = response.text.trim();
        
        // Remove markdown code blocks if present
        jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Find JSON object
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          response.json = JSON.parse(jsonMatch[0]);
          response.parsed = true;
        } else {
          response.parsed = false;
          response.parseError = 'No JSON object found in response';
        }
      } catch (e) {
        console.error('JSON parse error:', e.message);
        response.parsed = false;
        response.parseError = e.message;
      }
    }
    
    return response;
  }

  /**
   * Check Ollama health status
   * @returns {Promise<object>} Health status
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000
      });
      
      const models = response.data.models || [];
      const hasRequiredModels = models.some(m => 
        m.name.includes('llama3') || m.name.includes('mistral')
      );
      
      return {
        status: 'healthy',
        connected: true,
        baseURL: this.baseURL,
        models: models.map(m => ({
          name: m.name,
          size: m.size,
          modified: m.modified_at
        })),
        hasRequiredModels,
        primaryModel: this.primaryModel,
        secondaryModel: this.secondaryModel
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        baseURL: this.baseURL
      };
    }
  }

  /**
   * List available models
   * @returns {Promise<array>} List of models
   */
  async listModels() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      console.error('Error listing models:', error.message);
      return [];
    }
  }

  /**
   * Pull a model from Ollama registry
   * @param {string} modelName - Name of the model to pull
   * @returns {Promise<object>} Pull status
   */
  async pullModel(modelName) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/pull`,
        { name: modelName },
        { timeout: 300000 } // 5 minutes for model download
      );
      
      return {
        success: true,
        model: modelName,
        status: response.data.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Estimate tokens (rough approximation)
   * @param {string} text - Text to estimate
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

module.exports = new OllamaService();
