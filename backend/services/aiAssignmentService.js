const ollamaService = require('./ollamaService');

/**
 * AI Inspector Assignment Service
 * Suggests optimal inspector assignment based on location, skills, availability, and workload
 */
class AIAssignmentService {
  /**
   * Suggest best inspector for a ticket
   * @param {Object} ticket - The ticket/report to assign
   * @param {Array} inspectorPool - Available inspectors with their details
   * @returns {Object} Assignment recommendation
   */
  async suggestInspector(ticket, inspectorPool) {
    try {
      // Step 1: Heuristic filtering to narrow down candidates
      const candidates = this.filterCandidates(ticket, inspectorPool);
      
      if (candidates.length === 0) {
        return {
          success: false,
          message: 'No suitable inspectors available',
          recommendedInspector: null
        };
      }
      
      // Step 2: If only one candidate, return immediately
      if (candidates.length === 1) {
        return {
          success: true,
          recommendedInspector: candidates[0],
          confidence: 0.95,
          reason: 'Only available inspector matching criteria',
          allScores: [{ inspector: candidates[0], score: 0.95 }]
        };
      }
      
      // Step 3: Use LLM for complex tie-breaking
      const aiRecommendation = await this.getAIRecommendation(ticket, candidates);
      
      return {
        success: true,
        ...aiRecommendation
      };
      
    } catch (error) {
      console.error('Error in suggestInspector:', error);
      return {
        success: false,
        error: error.message,
        recommendedInspector: null
      };
    }
  }
  
  /**
   * Filter inspectors based on hard constraints
   */
  filterCandidates(ticket, inspectorPool) {
    return inspectorPool.filter(inspector => {
      // Check availability
      if (!inspector.isAvailable || inspector.status !== 'active') {
        return false;
      }
      
      // Check skills match
      if (ticket.category && inspector.skills) {
        const hasSkill = inspector.skills.some(skill => 
          skill.toLowerCase().includes(ticket.category.toLowerCase()) ||
          ticket.category.toLowerCase().includes(skill.toLowerCase())
        );
        if (!hasSkill && !inspector.skills.includes('general')) {
          return false;
        }
      }
      
      // Check distance (if location available)
      if (ticket.location && inspector.currentLocation) {
        const distance = this.calculateDistance(
          ticket.location.coordinates,
          inspector.currentLocation.coordinates
        );
        // Filter out inspectors more than 20km away
        if (distance > 20) {
          return false;
        }
      }
      
      // Check workload capacity
      if (inspector.activeTickets >= (inspector.maxCapacity || 10)) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Get AI recommendation using LLM
   */
  async getAIRecommendation(ticket, candidates) {
    const prompt = this.buildAssignmentPrompt(ticket, candidates);
    
    try {
      const result = await ollamaService.generateJSON(
        prompt,
        process.env.OLLAMA_PRIMARY_MODEL || 'llama3:8b'
      );
      
      // Validate and normalize output
      const recommendation = this.validateAssignmentOutput(result, candidates);
      
      return recommendation;
      
    } catch (error) {
      console.error('Error getting AI recommendation:', error);
      // Fallback to heuristic scoring
      return this.fallbackAssignment(ticket, candidates);
    }
  }
  
  /**
   * Build prompt for AI assignment
   */
  buildAssignmentPrompt(ticket, candidates) {
    // Simplify candidates for prompt
    const simplifiedCandidates = candidates.map((c, idx) => ({
      id: idx,
      inspectorId: c._id?.toString() || c.id,
      name: c.name,
      skills: c.skills || [],
      activeTickets: c.activeTickets || 0,
      maxCapacity: c.maxCapacity || 10,
      distanceKm: ticket.location && c.currentLocation 
        ? this.calculateDistance(ticket.location.coordinates, c.currentLocation.coordinates).toFixed(2)
        : 'unknown',
      averageResolutionTime: c.averageResolutionTime || 'unknown',
      successRate: c.successRate || 'unknown',
      zone: c.assignedZone || 'unknown'
    }));
    
    return `You are an intelligent assignment system for a civic complaint management platform in India. Analyze the ticket and inspector pool to recommend the best inspector.

**Ticket Details:**
- Category: ${ticket.category}
- Title: ${ticket.title || 'N/A'}
- Description: ${ticket.description || 'N/A'}
- Severity: ${ticket.severity || 'medium'}
- Priority: ${ticket.priority || 0}
- Location: ${ticket.location?.address || 'Not specified'}

**Available Inspectors:**
${JSON.stringify(simplifiedCandidates, null, 2)}

**Assignment Criteria (in order of importance):**
1. Skills match with ticket category
2. Distance from ticket location (closer is better)
3. Current workload (fewer active tickets is better)
4. Past performance (higher success rate is better)
5. Average resolution time (faster is better)

**Instructions:**
- Recommend the SINGLE best inspector by their "id" (0-${candidates.length - 1})
- Provide a confidence score (0-1)
- Explain your reasoning clearly
- Consider workload balance - avoid overloading inspectors
- For urgent/critical issues, prioritize proximity and availability

**Output Format (valid JSON only):**
{
  "recommendedInspectorId": <id from 0 to ${candidates.length - 1}>,
  "confidence": <number between 0 and 1>,
  "primaryReason": "<one sentence reason>",
  "factors": {
    "skillsMatch": <number 0-1>,
    "proximityScore": <number 0-1>,
    "workloadScore": <number 0-1>,
    "performanceScore": <number 0-1>
  },
  "allScores": [
    {"inspectorId": <id>, "totalScore": <0-1>, "reason": "<brief>"},
    ...
  ]
}`;
  }
  
  /**
   * Validate and normalize AI output
   */
  validateAssignmentOutput(output, candidates) {
    try {
      // Ensure valid inspector ID
      const inspectorId = parseInt(output.recommendedInspectorId);
      if (isNaN(inspectorId) || inspectorId < 0 || inspectorId >= candidates.length) {
        throw new Error('Invalid inspector ID');
      }
      
      const recommendedInspector = candidates[inspectorId];
      
      // Normalize confidence
      let confidence = parseFloat(output.confidence) || 0.7;
      confidence = Math.max(0, Math.min(1, confidence));
      
      return {
        recommendedInspector,
        confidence,
        reason: output.primaryReason || 'Best match based on criteria',
        factors: output.factors || {},
        allScores: output.allScores || []
      };
      
    } catch (error) {
      console.error('Error validating assignment output:', error);
      throw error;
    }
  }
  
  /**
   * Fallback assignment using simple heuristic scoring
   */
  fallbackAssignment(ticket, candidates) {
    const scored = candidates.map(inspector => {
      let score = 0;
      
      // Skills match (0-0.4)
      if (inspector.skills?.includes(ticket.category)) {
        score += 0.4;
      } else if (inspector.skills?.includes('general')) {
        score += 0.2;
      }
      
      // Workload (0-0.3)
      const workloadRatio = inspector.activeTickets / (inspector.maxCapacity || 10);
      score += 0.3 * (1 - workloadRatio);
      
      // Distance (0-0.2)
      if (ticket.location && inspector.currentLocation) {
        const distance = this.calculateDistance(
          ticket.location.coordinates,
          inspector.currentLocation.coordinates
        );
        score += 0.2 * Math.max(0, 1 - distance / 20);
      } else {
        score += 0.1; // Partial score if distance unknown
      }
      
      // Performance (0-0.1)
      if (inspector.successRate) {
        score += 0.1 * (inspector.successRate / 100);
      }
      
      return { inspector, score };
    });
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    return {
      recommendedInspector: scored[0].inspector,
      confidence: scored[0].score,
      reason: 'Heuristic-based assignment (AI unavailable)',
      allScores: scored.map(s => ({
        inspector: s.inspector,
        score: s.score.toFixed(2)
      }))
    };
  }
  
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(coords1, coords2) {
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;
    
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Batch assignment for multiple tickets
   */
  async batchAssign(tickets, inspectorPool) {
    const results = [];
    
    for (const ticket of tickets) {
      try {
        const assignment = await this.suggestInspector(ticket, inspectorPool);
        results.push({
          ticketId: ticket._id || ticket.id,
          ...assignment
        });
        
        // Update inspector workload in pool for subsequent assignments
        if (assignment.success && assignment.recommendedInspector) {
          const inspector = inspectorPool.find(
            i => i._id?.toString() === assignment.recommendedInspector._id?.toString()
          );
          if (inspector) {
            inspector.activeTickets = (inspector.activeTickets || 0) + 1;
          }
        }
        
      } catch (error) {
        results.push({
          ticketId: ticket._id || ticket.id,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = new AIAssignmentService();
