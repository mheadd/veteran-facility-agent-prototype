const express = require('express');
const router = express.Router();

const GeocodingService = require('../services/geocoding-simple');
const WeatherService = require('../services/weather');
const VAAPIService = require('../services/va-api');
const LLMService = require('../services/llm');

// Initialize services
const geocoding = new GeocodingService();
const weather = new WeatherService();
const vaAPI = new VAAPIService();
const llm = new LLMService();

// Warm up the LLM model when the service starts
llm.warmUpModel().then(success => {
  if (success) {
    console.log('LLM model ready for use');
  } else {
    console.log('LLM model warm-up failed - will try on first request');
  }
}).catch(err => {
  console.log('LLM warm-up error:', err.message);
});

/**
 * Simple LLM query endpoint for testing
 * POST /api/facilities/simple-ask
 */
router.post('/simple-ask', async (req, res) => {
  try {
    const { query, location } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`Processing simple query: "${query}"`);

    // Get basic facility info if location provided
    let facilityInfo = "No specific location provided";
    if (location) {
      try {
        const locationData = await geocoding.geocodeAddress(location);
        const facilities = await vaAPI.findFacilities(locationData.lat, locationData.lng, {
          radius: 25,
          maxResults: 2
        });
        
        if (facilities.length > 0) {
          const nearest = facilities[0];
          facilityInfo = `Nearest facility: ${nearest.name} at ${nearest.location.address.full}, ${nearest.distance} miles away. Services include: ${nearest.services.slice(0, 3).map(s => s.description).join(', ')}.`;
        }
      } catch (error) {
        facilityInfo = "Could not determine specific facilities for your location";
      }
    }

    // Very simple prompt
    const simplePrompt = `A veteran asks: "${query}"

Available info: ${facilityInfo}

Provide helpful advice in 2-3 sentences. Be supportive and specific.`;

    const response = await llm.generateResponse(simplePrompt, {
      temperature: 0.5,
      maxTokens: 150
    });

    res.json({
      query: query,
      location: location,
      advice: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Simple LLM query error:', error);
    res.status(500).json({
      error: 'Failed to process query',
      message: error.message
    });
  }
});

/**
 * Test LLM service endpoint
 * GET /api/facilities/test-llm
 */
router.get('/test-llm', async (req, res) => {
  try {
    // Test if LLM service is available
    const isAvailable = await llm.isAvailable();
    console.log('LLM service available:', isAvailable);
    
    if (!isAvailable) {
      return res.json({
        available: false,
        error: 'Ollama service not reachable',
        ollamaUrl: process.env.OLLAMA_URL || 'http://ollama:11434'
      });
    }

    // Test a simple prompt
    const simpleResponse = await llm.generateResponse(
      "Hello, please respond with 'LLM is working correctly' if you can understand this message.",
      { temperature: 0.1, maxTokens: 50 }
    );

    res.json({
      available: true,
      model: process.env.DEFAULT_MODEL || 'llama3',
      response: simpleResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('LLM test error:', error);
    res.json({
      available: false,
      error: error.message,
      stack: error.stack,
      ollamaUrl: process.env.OLLAMA_URL || 'http://ollama:11434'
    });
  }
});

/**
 * Intelligent query endpoint - handles complex veteran questions with LLM
 * POST /api/facilities/ask
 * Body: { query: "string", location?: "string", context?: {} }
 */
router.post('/ask', async (req, res) => {
  try {
    const { query, location, context = {} } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required and must be a string'
      });
    }

    console.log(`Processing intelligent query: "${query}"`);

    // Step 1: Get location context if provided
    let locationData = null;
    if (location) {
      try {
        if (typeof location === 'string') {
          locationData = await geocoding.geocodeAddress(location);
        } else if (location.lat && location.lng) {
          locationData = location;
        }
      } catch (error) {
        console.log('Could not geocode location:', error.message);
      }
    }

    // Step 2: Find relevant facilities if we have location
    let facilities = [];
    let nearestFacility = null;
    if (locationData) {
      try {
        facilities = await vaAPI.findFacilities(locationData.lat, locationData.lng, {
          radius: 50,
          maxResults: 5
        });
        nearestFacility = facilities[0] || null;
      } catch (error) {
        console.log('Could not fetch facilities:', error.message);
      }
    }

    // Step 3: Get weather context if location available
    let weatherData = null;
    if (locationData) {
      try {
        weatherData = await weather.getWeatherData(locationData.lat, locationData.lng);
      } catch (error) {
        console.log('Weather data not available:', error.message);
      }
    }

    // Step 4: Analyze the query with LLM
    const analysisContext = {
      location: locationData,
      nearestFacility: nearestFacility,
      weather: weatherData?.current,
      services: nearestFacility?.services?.map(s => s.name) || []
    };

    const analysis = await llm.analyzeVeteranQuery(query, analysisContext);
    
    // Step 5: Enhance facility recommendations if we have facilities
    let enhancedRecommendations = null;
    if (facilities.length > 0 && analysis.success) {
      try {
        enhancedRecommendations = await llm.enhanceFacilityRecommendations(
          facilities, 
          analysis.analysis, 
          { weather: weatherData?.current }
        );
      } catch (error) {
        console.log('Could not enhance recommendations:', error.message);
      }
    }

    // Step 6: Generate conversational response
    const conversationalResponse = await llm.generateConversationalResponse(
      query,
      { facilities, nearestFacility, location: locationData },
      { weather: weatherData?.current }
    );

    // Build comprehensive response
    const response = {
      query: query,
      location: locationData,
      analysis: analysis.success ? analysis.analysis : null,
      facilities: facilities,
      nearestFacility: nearestFacility,
      enhancedRecommendations: enhancedRecommendations?.success ? enhancedRecommendations.enhanced : null,
      conversationalResponse: conversationalResponse,
      weatherContext: weatherData ? {
        condition: weatherData.current.condition,
        temperature: weatherData.current.temperature,
        impact: weatherData.current.condition.includes('rain') ? 'Consider transportation delays' : null
      } : null,
      timestamp: new Date().toISOString()
    };

    // Handle different response formats based on success
    if (!analysis.success) {
      response.fallbackAdvice = analysis.fallbackAdvice;
      response.error = "LLM analysis unavailable - providing basic information";
    }

    res.json(response);

  } catch (error) {
    console.error('Intelligent query error:', error);
    res.status(500).json({
      error: 'Failed to process intelligent query',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Debug endpoint to check geocoding service status
 * GET /api/facilities/debug
 */
router.get('/debug', async (req, res) => {
  try {
    const debug = {
      geocoding: {
        providersCount: geocoding.geocoders?.length || 0,
        providers: geocoding.geocoders?.map((g, i) => ({
          index: i,
          name: g.providerName || g.options?.provider || 'unknown',
          hasApiKey: g.hasValidApiKey ? 'yes' : 'no',
          apiKeyLength: g.options?.apiKey ? g.options.apiKey.length : 0
        })) || [],
        googleApiKey: process.env.GOOGLE_MAPS_API_KEY ? 'configured' : 'missing',
        weatherApiKey: process.env.OPENWEATHERMAP_API_KEY ? 'configured' : 'missing'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vaApiUrl: process.env.VA_API_BASE_URL
      }
    };
    
    res.json(debug);
  } catch (error) {
    res.status(500).json({
      error: 'Debug endpoint failed',
      message: error.message
    });
  }
});

/**
 * Main facility finder endpoint
 * POST /api/facilities/find
 * Body: { address: "string" } or { lat: number, lng: number }
 */
router.post('/find', async (req, res) => {
  try {
    const { address, lat, lng, radius, facilityType, includeWeather } = req.body;
    
    let location;
    
    // Step 1: Get coordinates
    if (lat && lng) {
      location = { lat: parseFloat(lat), lng: parseFloat(lng) };
      // Optionally get address for the coordinates
      try {
        const addressInfo = await geocoding.reverseGeocode(lat, lng);
        location.address = addressInfo.formatted_address;
      } catch (error) {
        console.log('Could not reverse geocode coordinates:', error.message);
        location.address = `${lat}, ${lng}`;
      }
    } else if (address) {
      location = await geocoding.geocodeAddress(address);
    } else {
      return res.status(400).json({
        error: 'Either address or coordinates (lat, lng) must be provided'
      });
    }

    console.log(`Finding VA facilities near: ${location.address || `${location.lat}, ${location.lng}`}`);

    // Step 2: Find VA facilities
    console.log('Step 2: Calling VA API...');
    const facilities = await vaAPI.findFacilities(location.lat, location.lng, {
      radius: radius || 50,
      maxResults: 5,
      facilityType: facilityType
    });
    console.log(`Found ${facilities.length} facilities`);

    if (facilities.length === 0) {
      console.log('No facilities found, returning early');
      return res.json({
        location: location,
        facilities: [],
        message: 'No VA facilities found within the specified radius. Try increasing the search radius.',
        weatherAnalysis: null
      });
    }

    // Step 3: Get weather data if requested or if closest facility is found
    console.log('Step 3: Getting weather data...');
    let weatherAnalysis = null;
    if (includeWeather !== false && facilities.length > 0) {
      try {
        console.log('Calling weather service...');
        const weatherData = await weather.getWeatherData(location.lat, location.lng);
        console.log('Weather data received, analyzing...');
        weatherAnalysis = weather.analyzeWeatherForTransport(weatherData);
        weatherAnalysis.rawData = weatherData;
        console.log('Weather analysis complete');
      } catch (error) {
        console.log('Weather data unavailable:', error.message);
        weatherAnalysis = {
          error: 'Weather data temporarily unavailable',
          severity: 'unknown'
        };
      }
    }

    // Step 4: Build response with recommendations
    console.log('Step 4: Building response...');
    console.log('Weather analysis:', JSON.stringify(weatherAnalysis, null, 2));
    const response = {
      location: location,
      facilities: facilities,
      nearestFacility: facilities[0],
      weatherAnalysis: weatherAnalysis,
      recommendations: generateRecommendations(facilities[0], weatherAnalysis),
      searchParameters: {
        radius: radius || 50,
        facilityType: facilityType || 'all'
      },
      timestamp: new Date().toISOString()
    };

    console.log('Sending complete response');
    res.json(response);

  } catch (error) {
    console.error('Facility finder error:', error);
    console.error('Error stack:', error.stack);
    
    // Return partial response if we have location but failed later
    if (location) {
      res.status(200).json({
        location: location,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        error: 'Failed to find VA facilities',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
});

/**
 * Get detailed information about a specific facility
 * GET /api/facilities/:facilityId
 */
router.get('/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { includeWeather } = req.query;

    const facility = await vaAPI.getFacilityDetails(facilityId);
    
    let weatherAnalysis = null;
    if (includeWeather === 'true') {
      try {
        const weatherData = await weather.getWeatherData(facility.location.lat, facility.location.lng);
        weatherAnalysis = weather.analyzeWeatherForTransport(weatherData);
      } catch (error) {
        console.log('Weather data unavailable:', error.message);
      }
    }

    res.json({
      facility: facility,
      weatherAnalysis: weatherAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Facility details error:', error);
    res.status(500).json({
      error: 'Failed to get facility details',
      message: error.message
    });
  }
});

/**
 * Search facilities by type or service
 * GET /api/facilities/search
 */
router.get('/search', async (req, res) => {
  try {
    const { lat, lng, type, service, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Latitude and longitude are required'
      });
    }

    const facilities = await vaAPI.findFacilities(parseFloat(lat), parseFloat(lng), {
      radius: parseInt(radius) || 50,
      facilityType: type,
      services: service
    });

    res.json({
      facilities: facilities,
      searchParameters: {
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        type: type,
        service: service,
        radius: parseInt(radius) || 50
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Facility search error:', error);
    res.status(500).json({
      error: 'Failed to search facilities',
      message: error.message
    });
  }
});

/**
 * Geocode an address
 * POST /api/facilities/geocode
 */
router.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        error: 'Address is required'
      });
    }

    const location = await geocoding.geocodeAddress(address);
    
    res.json({
      location: location,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({
      error: 'Failed to geocode address',
      message: error.message
    });
  }
});

/**
 * Generate recommendations based on facility and weather
 * @param {Object} facility - Nearest VA facility
 * @param {Object} weatherAnalysis - Weather analysis
 * @returns {Object} - Recommendations
 */
function generateRecommendations(facility, weatherAnalysis) {
  const recommendations = {
    transportation: [],
    timing: [],
    preparation: [],
    alternatives: []
  };

  if (!facility) {
    return recommendations;
  }

  // Distance-based recommendations
  if (facility.distance <= 5) {
    recommendations.transportation.push('Facility is nearby - walking or short drive recommended');
  } else if (facility.distance <= 20) {
    recommendations.transportation.push('Consider public transit or driving');
  } else {
    recommendations.transportation.push('Long distance - plan for extended travel time');
    recommendations.timing.push('Allow extra time for travel');
  }

  // Weather-based recommendations
  if (weatherAnalysis && weatherAnalysis.severity !== 'normal') {
    if (weatherAnalysis.recommendations && Array.isArray(weatherAnalysis.recommendations)) {
      recommendations.transportation.push(...weatherAnalysis.recommendations);
    }
    
    if (weatherAnalysis.severity === 'severe') {
      recommendations.timing.push('Consider rescheduling if appointment is not urgent');
      recommendations.preparation.push('Check facility operating status before traveling');
    }
    
    if (weatherAnalysis.warnings && Array.isArray(weatherAnalysis.warnings) && weatherAnalysis.warnings.length > 0) {
      recommendations.preparation.push(...weatherAnalysis.warnings);
    }
  }

  // Facility-specific recommendations
  if (facility.transportation?.hasShuttle) {
    recommendations.transportation.push('VA shuttle service available - contact facility for schedule');
  }

  if (facility.parking?.available) {
    recommendations.transportation.push('Parking available at facility');
  }

  // Veterans-specific considerations
  recommendations.preparation.push('Bring your VA ID card and any required documentation');
  
  if (facility.contact?.phone) {
    recommendations.preparation.push(`Call ahead to confirm appointment: ${facility.contact.phone}`);
  }

  return recommendations;
}

module.exports = router;