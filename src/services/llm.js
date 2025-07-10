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
      // Only log warm-up errors if not using dummy URL (for CI)
      if (!this.ollamaUrl.includes('dummy')) {
        console.error('Model warm-up failed:', error.message);
      }
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
      timeout = this.timeout,
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

      console.log(`Sending prompt to ${model}... (timeout: ${timeout}ms)`);
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, payload, {
        timeout: timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = response.data.response;
      console.log(`LLM response received (${result.length} characters)`);
      return result;

    } catch (error) {
      // Only log errors if not using dummy URL (for CI)
      if (!this.ollamaUrl.includes('dummy')) {
        console.error('LLM service error:', error.message);
      }
      throw new Error(`Failed to generate LLM response: ${error.message}`);
    }
  }

  /**
   * Generate a streaming response using the LLM with real-time token emission
   * @param {string} prompt - The prompt to send to the LLM
   * @param {Function} onChunk - Callback function for each token/chunk received
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - The complete LLM response
   */
  async generateResponseStream(prompt, onChunk, options = {}) {
    const {
      model = this.model,
      temperature = this.config.defaultTemperature,
      maxTokens = this.config.defaultMaxTokens,
      timeout = this.timeout,
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
        stream: true  // Enable streaming mode
      };

      // Add system prompt if provided
      if (systemPrompt) {
        payload.system = systemPrompt;
      }

      console.log(`Starting streaming response from ${model}... (timeout: ${timeout}ms)`);
      
      // Use native fetch for streaming support (better than axios for this)
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines from buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (data.response) {
                  fullResponse += data.response;
                  // Call the callback with the new token
                  if (onChunk) {
                    onChunk(data.response, fullResponse);
                  }
                }
                
                // Check if streaming is complete
                if (data.done) {
                  console.log(`Streaming response completed (${fullResponse.length} characters)`);
                  return fullResponse;
                }
              } catch (parseError) {
                // Skip malformed JSON lines
                console.warn('Failed to parse streaming response line:', line);
              }
            }
          }
        }
        
        return fullResponse;
        
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      // Only log errors if not using dummy URL (for CI)
      if (!this.ollamaUrl.includes('dummy')) {
        console.error('LLM streaming error:', error.message);
      }
      throw new Error(`Failed to generate streaming LLM response: ${error.message}`);
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
      // Only log availability errors if not using dummy URL (for CI)
      if (!this.ollamaUrl.includes('dummy')) {
        console.error('LLM service not available:', error.message);
      }
      return false;
    }
  }

  /**
   * Analyze facility findings and provide intelligent recommendations
   * @param {Object} context - Context including query, facilities, weather, transportation
   * @returns {Promise<Object>} - Structured AI analysis and recommendations
   */
  async analyzeFacilityFindings(context) {
    try {
      const { query, facilities, weather, transportation, location } = context;
      
      // Build context summary for the LLM
      const facilitySummary = facilities.slice(0, 3).map(f => ({
        name: f.name,
        type: f.type,
        distance: f.distance,
        services: f.services?.slice(0, 3) || [],
        hours: f.hours
      }));

      const weatherSummary = weather ? {
        current: weather.current?.condition || 'Unknown',
        temperature: weather.current?.temperature || 'Unknown',
        severity: weather.severity || 'normal',
        recommendations: weather.recommendations?.slice(0, 2) || []
      } : null;

      const transportSummary = transportation && !transportation.error ? {
        walking: transportation.options?.walking?.available ? 
          `${transportation.options.walking.bestRoute?.duration} (${transportation.options.walking.bestRoute?.distance})` : 'Not available',
        driving: transportation.options?.driving?.available ? 
          `${transportation.options.driving.bestRoute?.duration}` : 'Not available',
        transit: transportation.options?.transit?.available ? 
          `${transportation.options.transit.bestRoute?.duration}` : 'Not available'
      } : null;

      const analysisPrompt = `You are a VA facility advisor helping a veteran.

REQUEST: "${query || 'Find nearby VA facilities'}"
LOCATION: ${location?.address || 'Not specified'}

TOP FACILITIES:
${facilitySummary.map((f, i) => 
  `${i + 1}. ${f.name} - ${f.distance}mi, ${f.type}`
).join('\n')}

WEATHER: ${weatherSummary ? 
  `${weatherSummary.current}, ${weatherSummary.temperature}°F` : 
  'Unknown'}

TRANSPORT: ${transportSummary ? 
  `Drive: ${transportSummary.driving}, Walk: ${transportSummary.walking}` : 
  'Unknown'}

Respond in JSON:
{
  "primaryRecommendation": "which facility and why",
  "reasoning": "brief reason",
  "travelAdvice": "best transport method", 
  "weatherConsiderations": "weather impact if any",
  "additionalTips": "veteran-specific tip",
  "urgencyLevel": "normal"
}`;

      const response = await this.generateResponse(analysisPrompt, {
        ...this.config.presets.facility,
        timeout: this.config.presets.facility.timeout || this.config.analysisTimeout
      });
      
      // Try to parse as JSON, fall back to text analysis if needed
      try {
        const analysis = JSON.parse(response);
        return {
          success: true,
          analysis: analysis,
          rawResponse: response
        };
      } catch (parseError) {
        // If JSON parsing fails, extract key information from text
        return {
          success: true,
          analysis: {
            primaryRecommendation: this.extractMainRecommendation(response),
            reasoning: "Based on proximity, services, and current conditions",
            travelAdvice: this.extractTravelAdvice(response),
            weatherConsiderations: weatherSummary ? 
              `Consider ${weatherSummary.severity} weather conditions` : null,
            additionalTips: "Contact the facility ahead of time to confirm services and hours",
            urgencyLevel: this.determineUrgency(query || '')
          },
          rawResponse: response,
          fallbackMode: true
        };
      }

    } catch (error) {
      console.error('LLM facility analysis error:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: {
          analysis: {
            primaryRecommendation: "Visit the nearest facility for your needs",
            reasoning: "Based on proximity and available services",
            travelAdvice: "Choose the most convenient transportation method",
            urgencyLevel: "normal"
          }
        }
      };
    }
  }

  /**
   * Analyze facility findings with streaming response for real-time updates
   * @param {Object} context - Context including query, facilities, weather, transportation
   * @param {Function} onChunk - Callback for streaming updates
   * @returns {Promise<Object>} - Structured AI analysis and recommendations
   */
  async analyzeFacilityFindingsStream(context, onChunk) {
    try {
      const { query, facilities, weather, transportation, location } = context;
      
      // Ensure we have a valid location with proper address
      const locationInfo = {
        address: location?.address || 
                (location?.fullDetails?.formatted_address) || 
                'Unknown location',
        lat: location?.lat,
        lng: location?.lng
      };
      
      // Build context summary for the LLM (same as non-streaming version)
      const facilitySummary = facilities.slice(0, 3).map(f => ({
        name: f.name,
        type: f.type,
        distance: f.distance,
        services: f.services?.slice(0, 3) || [],
        hours: f.hours
      }));

      const weatherSummary = weather ? {
        current: weather.current?.condition || 'Unknown',
        temperature: weather.current?.temperature || 'Unknown',
        severity: weather.severity || 'normal',
        recommendations: weather.recommendations?.slice(0, 2) || []
      } : null;

      const transportSummary = transportation && !transportation.error ? {
        walking: transportation.options?.walking?.available ? 
          `${transportation.options.walking.bestRoute?.duration} (${transportation.options.walking.bestRoute?.distance})` : 'Not available',
        driving: transportation.options?.driving?.available ? 
          `${transportation.options.driving.bestRoute?.duration}` : 'Not available',
        transit: transportation.options?.transit?.available ? 
          `${transportation.options.transit.bestRoute?.duration}` : 'Not available'
      } : null;

      // Enhanced prompt for streaming with clearer structure
      const analysisPrompt = `You are a VA facility advisor helping a veteran. Provide a structured analysis that flows naturally.

REQUEST: "${query || 'Find nearby VA facilities'}"
LOCATION: ${locationInfo.address}

TOP FACILITIES:
${facilitySummary.map((f, i) => 
  `${i + 1}. ${f.name} - ${f.distance}mi, ${f.type}`
).join('\n')}

WEATHER: ${weatherSummary ? 
  `${weatherSummary.current}, ${weatherSummary.temperature}°F` : 
  'Unknown'}

TRANSPORT: ${transportSummary ? 
  `Drive: ${transportSummary.driving}, Walk: ${transportSummary.walking}` : 
  'Unknown'}

Provide a structured response in this format:

PRIMARY_RECOMMENDATION: [Start with your main facility recommendation and why]

REASONING: [Brief explanation of why this is the best choice]

TRAVEL_ADVICE: [Best transportation method and any considerations]

WEATHER_CONSIDERATIONS: [Any weather-related advice if applicable]

ADDITIONAL_TIPS: [Veteran-specific tips or reminders]

URGENCY_LEVEL: [normal/moderate/high]`;

      let accumulatedResponse = '';
      let currentAnalysis = {
        primaryRecommendation: '',
        reasoning: '',
        travelAdvice: '',
        weatherConsiderations: '',
        additionalTips: '',
        urgencyLevel: 'normal'
      };

      // Stream the response and parse progressively
      const fullResponse = await this.generateResponseStream(
        analysisPrompt,
        (chunk, fullText) => {
          accumulatedResponse = fullText;
          
          // Parse the current state of the analysis
          const updatedAnalysis = this.parseProgressiveAnalysis(accumulatedResponse);
          
          // Only send update if we have new meaningful content
          if (this.hasNewAnalysisContent(updatedAnalysis, currentAnalysis)) {
            currentAnalysis = updatedAnalysis;
            if (onChunk) {
              onChunk({
                type: 'analysis_chunk',
                analysis: currentAnalysis,
                isComplete: false
              });
            }
          }
        },
        {
          ...this.config.presets.facility,
          timeout: this.config.presets.facility.timeout || this.config.analysisTimeout
        }
      );

      // Final parsing of complete response
      const finalAnalysis = this.parseProgressiveAnalysis(fullResponse);
      
      // Send completion signal
      if (onChunk) {
        onChunk({
          type: 'analysis_complete',
          analysis: finalAnalysis,
          isComplete: true
        });
      }

      return {
        success: true,
        analysis: finalAnalysis,
        rawResponse: fullResponse
      };

    } catch (error) {
      console.error('LLM streaming facility analysis error:', error.message);
      
      // Send error to stream
      if (onChunk) {
        onChunk({
          type: 'analysis_error',
          error: error.message,
          fallback: {
            primaryRecommendation: "Visit the nearest facility for your needs",
            reasoning: "Based on proximity and available services",
            travelAdvice: "Choose the most convenient transportation method",
            weatherConsiderations: weatherSummary ? 
              `Consider ${weatherSummary.severity} weather conditions` : null,
            additionalTips: "Contact the facility ahead of time to confirm services and hours",
            urgencyLevel: "normal"
          }
        });
      }

      return {
        success: false,
        error: error.message,
        fallback: {
          analysis: {
            primaryRecommendation: "Visit the nearest facility for your needs",
            reasoning: "Based on proximity and available services",
            travelAdvice: "Choose the most convenient transportation method",
            weatherConsiderations: weatherSummary ? 
              `Consider ${weatherSummary.severity} weather conditions` : null,
            additionalTips: "Contact the facility ahead of time to confirm services and hours",
            urgencyLevel: "normal"
          }
        }
      };
    }
  }

  /**
   * Parse progressive analysis from streaming response
   * @param {string} text - Accumulated response text
   * @returns {Object} - Parsed analysis object
   */
  parseProgressiveAnalysis(text) {
    const analysis = {
      primaryRecommendation: '',
      reasoning: '',
      travelAdvice: '',
      weatherConsiderations: '',
      additionalTips: '',
      urgencyLevel: 'normal'
    };

    // Extract sections using pattern matching
    const sections = {
      'PRIMARY_RECOMMENDATION': 'primaryRecommendation',
      'REASONING': 'reasoning', 
      'TRAVEL_ADVICE': 'travelAdvice',
      'WEATHER_CONSIDERATIONS': 'weatherConsiderations',
      'ADDITIONAL_TIPS': 'additionalTips',
      'URGENCY_LEVEL': 'urgencyLevel'
    };

    for (const [sectionKey, analysisKey] of Object.entries(sections)) {
      const regex = new RegExp(`${sectionKey}:\\s*([^]*?)(?=\\n[A-Z_]+:|$)`, 'i');
      const match = text.match(regex);
      if (match) {
        analysis[analysisKey] = match[1].trim().replace(/\n+/g, ' ');
      }
    }

    return analysis;
  }

  /**
   * Check if analysis has new meaningful content
   * @param {Object} newAnalysis - New analysis object
   * @param {Object} currentAnalysis - Current analysis object
   * @returns {boolean} - True if there's new content
   */
  hasNewAnalysisContent(newAnalysis, currentAnalysis) {
    return Object.keys(newAnalysis).some(key => 
      newAnalysis[key] !== currentAnalysis[key] && 
      newAnalysis[key].length > currentAnalysis[key].length
    );
  }

  /**
   * Extract main recommendation from text response
   */
  extractMainRecommendation(text) {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('recommend') && line.length > 20) {
        return line.trim();
      }
    }
    return "Consider the nearest facility that meets your needs";
  }

  /**
   * Extract travel advice from text response
   */
  extractTravelAdvice(text) {
    const transportKeywords = ['drive', 'walk', 'bus', 'transit', 'ride'];
    const lines = text.split('\n');
    for (const line of lines) {
      if (transportKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        return line.trim();
      }
    }
    return "Choose the transportation method that works best for you";
  }

  /**
   * Determine urgency level from query
   */
  determineUrgency(query) {
    const urgentKeywords = ['emergency', 'urgent', 'crisis', 'immediately', 'asap', 'now'];
    const moderateKeywords = ['soon', 'appointment', 'today', 'quickly'];
    
    const lowerQuery = query.toLowerCase();
    if (urgentKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'high';
    }
    if (moderateKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'moderate';
    }
    return 'normal';
  }
}

module.exports = LLMService;