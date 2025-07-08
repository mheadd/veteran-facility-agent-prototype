const axios = require('axios');
const { getServiceConfig } = require('../config');

class LLMService {
  constructor() {
    this.config = getServiceConfig('llm');
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.DEFAULT_MODEL || 'llama3';
    this.timeout = parseInt(process.env.MODEL_TIMEOUT) || this.config.timeout;
    
    console.log('LLM Service initialized');
    console.log('Ollama URL:', this.ollamaUrl);
    console.log('Default model:', this.model);
    console.log('Timeout:', this.timeout + 'ms');
  }

  /**
   * Warm up the model by sending a simple prompt
   * @returns {Promise<boolean>}
   */
  async warmUpModel() {
    try {
      console.log('Warming up model...');
      const start = Date.now();
      await this.generateResponse(this.config.warmupPrompt, this.config.warmupOptions);
      const duration = Date.now() - start;
      console.log(`Model warmed up in ${duration}ms`);
      return true;
    } catch (error) {
      console.error('Model warm-up failed:', error.message);
      return false;
    }
  }

  /**
   * Generate a response using the LLM
   * @param {string} prompt - The prompt to send to the LLM
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - The LLM response
   */
  async generateResponse(prompt, options = {}) {
    const {
      model = this.model,
      temperature = this.config.defaultTemperature,
      maxTokens = this.config.defaultMaxTokens,
      systemPrompt = null
    } = options;

    try {
      const payload = {
        model: model,
        prompt: prompt,
        options: {
          temperature: temperature,
          num_predict: maxTokens
        },
        stream: false
      };

      // Add system prompt if provided
      if (systemPrompt) {
        payload.system = systemPrompt;
      }

      console.log(`Sending prompt to ${model}...`);
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, payload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = response.data.response;
      console.log(`LLM response received (${result.length} characters)`);
      return result;

    } catch (error) {
      console.error('LLM service error:', error.message);
      throw new Error(`Failed to generate LLM response: ${error.message}`);
    }
  }

  /**
   * Analyze a veteran's complex query and provide intelligent recommendations
   * @param {string} query - The veteran's question or request
   * @param {Object} context - Context including location, facilities, weather
   * @returns {Promise<Object>} - Structured analysis and recommendations
   */
  async analyzeVeteranQuery(query, context = {}) {
    const systemPrompt = `You are a knowledgeable assistant specializing in helping US military veterans navigate VA services and facilities. You provide compassionate, accurate, and actionable guidance.

Key principles:
- Prioritize veteran wellbeing and urgent needs
- Provide specific, actionable advice
- Be aware of common veteran challenges (mobility, PTSD, financial constraints)
- Respect the veteran's service and sacrifice
- Direct to appropriate VA resources and services

Current context:
- Location: ${context.location?.formatted_address || 'Unknown'}
- Nearest VA facility: ${context.nearestFacility?.name || 'None found'}
- Weather conditions: ${context.weather?.condition || 'Unknown'}
- Available services: ${context.services?.join(', ') || 'Unknown'}`;

    const analysisPrompt = `
Veteran Query: "${query}"

Context: Location: ${context.location?.formatted_address || 'Unknown'}, Nearest facility: ${context.nearestFacility?.name || 'None'}

Analyze this veteran's request briefly:

1. What do they need?
2. How urgent is it? (low/medium/high)
3. What should they do next? (max 3 steps)

Keep response under 200 words and respond in JSON format:
{
  "understanding": "brief analysis",
  "urgency": "low|medium|high", 
  "recommendations": ["step 1", "step 2"],
  "nextSteps": ["action 1", "action 2"]
}`;

    try {
      const response = await this.generateResponse(analysisPrompt, {
        systemPrompt: systemPrompt,
        temperature: this.config.presets.facility.temperature,
        maxTokens: this.config.presets.facility.maxTokens
      });

      // Try to parse as JSON, fallback to structured text if needed
      try {
        const analysis = JSON.parse(response);
        return {
          success: true,
          analysis: analysis,
          rawResponse: response
        };
      } catch (parseError) {
        // If JSON parsing fails, return structured text response
        return {
          success: true,
          analysis: {
            understanding: "Complex query requiring human review",
            urgency: "medium",
            recommendations: [response.slice(0, 500)],
            resources: [],
            considerations: ["LLM response needs manual review"],
            nextSteps: ["Contact VA representative directly"]
          },
          rawResponse: response
        };
      }

    } catch (error) {
      console.error('Failed to analyze veteran query:', error);
      return {
        success: false,
        error: error.message,
        fallbackAdvice: "Please contact your nearest VA facility directly for personalized assistance."
      };
    }
  }

  /**
   * Enhance facility recommendations with LLM intelligence
   * @param {Array} facilities - List of facilities
   * @param {Object} veteranNeeds - Analyzed veteran needs
   * @param {Object} context - Additional context (weather, location, etc.)
   * @returns {Promise<Object>} - Enhanced recommendations
   */
  async enhanceFacilityRecommendations(facilities, veteranNeeds, context = {}) {
    if (!facilities || facilities.length === 0) {
      return { recommendations: [], reasoning: "No facilities available" };
    }

    const facilitySummary = facilities.map(f => ({
      name: f.name,
      type: f.facilityType,
      distance: f.distance,
      services: f.services.map(s => s.name).slice(0, 5), // Top 5 services
      status: f.operatingStatus,
      hours: f.hours
    }));

    const enhancementPrompt = `
As a veteran services expert, help prioritize these VA facilities based on a veteran's specific needs.

VETERAN NEEDS: ${JSON.stringify(veteranNeeds)}
AVAILABLE FACILITIES: ${JSON.stringify(facilitySummary)}
CONTEXT: Weather: ${context.weather?.condition || 'unknown'}, Time: ${new Date().toLocaleString()}

Provide facility recommendations with reasoning. Consider:
- Service match to veteran needs
- Distance and accessibility
- Operating status and hours
- Weather impact on travel
- Facility type appropriateness

Respond in JSON format:
{
  "primaryRecommendation": {
    "facilityId": "facility_id",
    "reasoning": "Why this is the best choice",
    "urgencyNote": "Any time-sensitive considerations"
  },
  "alternatives": [
    {
      "facilityId": "alt_facility_id", 
      "reasoning": "Why this is a good backup option"
    }
  ],
  "travelAdvice": "Specific guidance for getting there",
  "timingRecommendation": "Best time to visit"
}`;

    try {
      const response = await this.generateResponse(enhancementPrompt, {
        temperature: this.config.presets.emergency.temperature,
        maxTokens: this.config.presets.emergency.maxTokens
      });

      try {
        const enhanced = JSON.parse(response);
        return { success: true, enhanced: enhanced, rawResponse: response };
      } catch (parseError) {
        return {
          success: true,
          enhanced: {
            primaryRecommendation: {
              facilityId: facilities[0].id,
              reasoning: response.slice(0, 200),
              urgencyNote: "Standard priority"
            },
            alternatives: [],
            travelAdvice: "Use standard transportation options",
            timingRecommendation: "During normal business hours"
          },
          rawResponse: response
        };
      }

    } catch (error) {
      console.error('Failed to enhance recommendations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate conversational response for veteran queries
   * @param {string} query - The veteran's question
   * @param {Object} facilityData - Available facility information
   * @param {Object} context - Additional context
   * @returns {Promise<string>} - Conversational response
   */
  async generateConversationalResponse(query, facilityData, context = {}) {
    const systemPrompt = `You are a friendly, knowledgeable VA assistant helping a veteran. Be conversational, empathetic, and practical. Always acknowledge their service and provide clear, actionable guidance.

Available information:
- Facilities: ${facilityData.facilities?.length || 0} found
- Nearest: ${facilityData.nearestFacility?.name || 'None'}
- Location: ${facilityData.location?.formatted_address || 'Unknown'}
- Weather: ${context.weather?.condition || 'Unknown'}`;

    const conversationalPrompt = `
Veteran asks: "${query}"

Provide a helpful, conversational response that:
1. Acknowledges their question with empathy
2. Gives specific, actionable advice based on the available facilities
3. Mentions practical considerations (distance, hours, services)
4. Ends with next steps or offers additional help

Keep the tone professional but warm, like speaking with a fellow veteran who understands military service.`;

    try {
      const response = await this.generateResponse(conversationalPrompt, {
        systemPrompt: systemPrompt,
        temperature: this.config.presets.recommendation.temperature,
        maxTokens: this.config.presets.recommendation.maxTokens
      });

      return response;

    } catch (error) {
      console.error('Failed to generate conversational response:', error);
      return "I understand you're looking for help with VA services. While I'm having trouble processing your request right now, I'd recommend contacting your nearest VA facility directly. They'll be able to provide personalized assistance for your specific needs.";
    }
  }

  /**
   * Check if the LLM service is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
        timeout: this.config.availabilityTimeout
      });
      return response.status === 200;
    } catch (error) {
      console.error('LLM service not available:', error.message);
      return false;
    }
  }
}

module.exports = LLMService;