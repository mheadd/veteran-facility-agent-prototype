const express = require('express');
const router = express.Router();

const { getConfig } = require('../config');
const GeocodingService = require('../services/geocoding-simple');
const WeatherService = require('../services/weather');
const VAAPIService = require('../services/va-api');
const LLMService = require('../services/llm');
const TransitService = require('../services/transit');

// Initialize services
const geocoding = new GeocodingService();
const weather = new WeatherService();
const vaAPI = new VAAPIService();
const llm = new LLMService();
const transit = new TransitService();

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
 * Geocoding endpoint
 * POST /api/facilities/geocode
 * Body: { address: "string" }
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
      location: location
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
      radius: radius || getConfig('search.defaultRadius'),
      maxResults: getConfig('services.va.maxFacilities'),
      facilityType: facilityType
    });
    console.log(`Found ${facilities.length} facilities`);

    if (facilities.length === 0) {
      console.log('No facilities found, returning early');
      return res.json({
        location: location,
        facilities: [],
        message: 'No VA facilities found within the specified radius. Try increasing the search radius.',
        weatherAnalysis: null,
        transportationOptions: null
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

    // Step 4: Get transportation options if we have a nearest facility
    console.log('Step 4: Getting transportation options...');
    let transportationOptions = null;
    if (facilities.length > 0) {
      try {
        const destination = {
          lat: facilities[0].location.lat,
          lng: facilities[0].location.lng,
          address: facilities[0].location.address.full
        };

        transportationOptions = await transit.getTransportationOptions(location, destination, {
          includeTransit: true,
          includeDriving: true,
          includeWalking: true,
          includeBicycling: false
        });
        console.log('Transportation options retrieved');
      } catch (error) {
        console.log('Transportation options unavailable:', error.message);
        transportationOptions = {
          error: 'Transportation data temporarily unavailable',
          fallback: 'Consider public transit, driving, or rideshare services'
        };
      }
    }

    // Step 5: Get AI analysis and recommendations
    console.log('Step 5: Getting AI analysis...');
    let aiGuidance = null;
    try {
      // Only use LLM if service is available and we have facilities
      const isLLMAvailable = await llm.isAvailable();
      if (isLLMAvailable && facilities.length > 0) {
        console.log('LLM service available, generating intelligent analysis (this may take 1-2 minutes)...');
        const analysisStart = Date.now();
        const analysisContext = {
          query: req.body.query || req.body.address || 'Find nearby VA facilities',
          facilities: facilities,
          weather: weatherAnalysis,
          transportation: transportationOptions,
          location: location
        };
        
        const llmResult = await llm.analyzeFacilityFindings(analysisContext);
        const analysisEnd = Date.now();
        const analysisTime = ((analysisEnd - analysisStart) / 1000).toFixed(1);
        
        if (llmResult.success) {
          aiGuidance = llmResult.analysis;
          console.log(`AI analysis completed successfully in ${analysisTime} seconds`);
        } else {
          console.log(`AI analysis failed after ${analysisTime} seconds, using fallback:`, llmResult.error);
          aiGuidance = llmResult.fallback?.analysis || null;
        }
      } else {
        console.log('LLM service not available, skipping AI analysis');
      }
    } catch (error) {
      console.log('AI analysis error:', error.message);
    }

    // Step 6: Build response with recommendations
    console.log('Step 6: Building response...');
    const response = {
      location: location,
      facilities: facilities,
      nearestFacility: facilities[0],
      weatherAnalysis: weatherAnalysis,
      transportationOptions: transportationOptions,
      recommendations: generateRecommendations(facilities[0], weatherAnalysis, transportationOptions),
      aiGuidance: aiGuidance, // NEW: AI-powered analysis and recommendations
      searchParameters: {
        radius: radius || getConfig('search.defaultRadius'),
        facilityType: facilityType || getConfig('facilityTypes.all')
      },
      timestamp: new Date().toISOString()
    };

    console.log('Sending complete response');
    res.json(response);

  } catch (error) {
    console.error('Facility finder error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      error: 'Failed to find VA facilities',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Streaming version of facility finder with Server-Sent Events
 * POST /api/facilities/find-stream
 */
router.post('/find-stream', async (req, res) => {
  console.log('🚀 Starting streaming facility search...');
  
  // Set up Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  });

  // Helper function to send SSE data
  const sendSSE = (type, data) => {
    // Ensure data is properly structured and not undefined
    const safeData = data || { message: 'No data available' };
    const sseData = JSON.stringify({ 
      type, 
      data: safeData, 
      timestamp: new Date().toISOString() 
    });
    res.write(`data: ${sseData}\n\n`);
    // Flush to ensure data is sent immediately
    if (res.flush) res.flush();
  };

  // Send initial connection confirmation
  sendSSE('connection', { status: 'connected', message: 'Starting facility search...' });

  try {
    const { address, lat, lng, radius = 25, query } = req.body;
    
    // Step 1: Geocoding (fast)
    console.log('Step 1: Geocoding address...');
    sendSSE('status', { step: 'geocoding', message: 'Finding your location...' });
    
    let location;
    if (lat && lng) {
      location = { 
        lat, 
        lng, 
        address: address || `${lat}, ${lng}` 
      };
    } else if (!address) {
      throw new Error('Either address or coordinates (lat, lng) must be provided');
    } else {
      try {
        const geocodeResult = await geocoding.geocodeAddress(address);
        
        // Create a properly structured location object
        location = {
          lat: geocodeResult.lat,
          lng: geocodeResult.lng,
          // Use the formatted_address from the geocoding service, with fallback to original address
          address: geocodeResult.formatted_address || address,
          fullDetails: geocodeResult // Keep the full details
        };
        
        console.log('Geocoded address:', location.address);
      } catch (error) {
        console.error('Geocoding failed:', error);
        location = {
          address: address,  // Use the original address as fallback
          error: 'Geocoding failed'
        };
      }
    }
    
    const displayAddress = location.address || address || 'Unknown location';
    
    sendSSE('location', { 
      location, 
      message: `Location found: ${displayAddress}` 
    });

    // Step 2: Find facilities (fast)
    console.log('Step 2: Finding VA facilities...');
    sendSSE('status', { step: 'facilities', message: 'Searching for VA facilities...' });
    
    const facilities = await vaAPI.findFacilities(location.lat, location.lng, {
      radius: radius,
      limit: 5
    });

    if (!facilities || facilities.length === 0) {
      sendSSE('facilities', { 
        facilities: [], 
        message: 'No VA facilities found within the specified radius.' 
      });
      sendSSE('complete', { message: 'Search completed with no results' });
      return res.end();
    }

    sendSSE('facilities', { 
      facilities, 
      nearestFacility: facilities[0],
      message: `Found ${facilities.length} facilities near you` 
    });

    // Step 3: Get weather data (fast)
    console.log('Step 3: Getting weather data...');
    sendSSE('status', { step: 'weather', message: 'Checking weather conditions...' });
    
    let weatherAnalysis = null;
    let weatherResponseMessage = '';
    try {
      console.log(`Getting weather data for location: ${location.lat}, ${location.lng}`);
      
      if (!location.lat || !location.lng) {
        throw new Error('Invalid location coordinates for weather lookup');
      }
      
      // Use mock weather data to avoid API issues
      console.log('Using mock weather data for reliability');
      const locationName = location.address ? location.address.split(',')[0] : 'Your location';
      const weatherData = weather.getMockWeatherData(location.lat, location.lng, locationName);
      console.log('Weather data created:', JSON.stringify(weatherData.current));
      
      weatherAnalysis = weather.analyzeWeatherForTransport(weatherData);
      console.log('Weather analysis completed:', JSON.stringify(weatherAnalysis.current));
      
      // Always have properly formed data with mock data
      weatherResponseMessage = `Weather: ${weatherAnalysis.current.condition || 'Unknown'} conditions`;
      
      // Add user-friendly description if available
      if (weatherAnalysis.current.description) {
        weatherResponseMessage += ` (${weatherAnalysis.current.description})`;
      }
      
      sendSSE('weather', { 
        weather: weatherAnalysis,
        message: weatherResponseMessage
      });
    } catch (error) {
      console.log('Weather data unavailable:', error.message);
      weatherAnalysis = {
        error: 'Weather data temporarily unavailable',
        current: { 
          condition: 'Unknown', 
          temperature: 'Unknown',
          description: 'Service temporarily unavailable'
        },
        severity: 'unknown'
      };
      sendSSE('weather', { 
        weather: weatherAnalysis,
        message: 'Weather data temporarily unavailable' 
      });
    }

    // Step 4: Get transportation options (moderate speed)
    console.log('Step 4: Getting transportation options...');
    sendSSE('status', { step: 'transportation', message: 'Finding transportation options...' });
    
    let transportationOptions = null;
    try {
      // Verify facility data has expected structure before accessing
      if (!facilities || !facilities[0] || !facilities[0].location ||
          facilities[0].location.lat === undefined || facilities[0].location.lng === undefined) {
        throw new Error('Invalid facility data structure');
      }
      
      // Safely access facility address
      const facilityAddress = facilities[0].location.address && facilities[0].location.address.full 
                            ? facilities[0].location.address.full 
                            : 'Unknown address';
      
      const destination = {
        lat: facilities[0].location.lat,
        lng: facilities[0].location.lng,
        address: facilityAddress
      };

      transportationOptions = await transit.getTransportationOptions(location, destination, {
        includeTransit: true,
        includeDriving: true,
        includeWalking: true,
        includeBicycling: false
      });
      
      // Standardize options structure for consistent frontend access
      if (transportationOptions && !transportationOptions.options) {
        transportationOptions = {
          options: {
            driving: transportationOptions.driving,
            transit: transportationOptions.transit,
            walking: transportationOptions.walking
          }
        };
      }
      
      sendSSE('transportation', { 
        transportation: transportationOptions,
        message: 'Transportation options found' 
      });
    } catch (error) {
      console.log('Transportation options unavailable:', error.message);
      transportationOptions = {
        error: 'Transportation data temporarily unavailable',
        fallback: 'Consider public transit, driving, or rideshare services',
        options: null
      };
      sendSSE('transportation', { 
        transportation: transportationOptions,
        message: 'Transportation data temporarily unavailable' 
      });
    }

    // Step 5: Stream AI analysis (slow - this is where streaming helps!)
    console.log('Step 5: Starting AI analysis stream...');
    sendSSE('status', { step: 'ai_analysis', message: 'Generating AI recommendations...' });
    
    let aiGuidance = null;
    try {
      const isLLMAvailable = await llm.isAvailable();
      if (isLLMAvailable && facilities.length > 0) {
        console.log('LLM service available, starting streaming analysis...');
        
        // Create a comprehensive context for the LLM service
        const analysisContext = {
          query: query || address || 'Find nearby VA facilities',
          facilities: facilities,
          weather: weatherAnalysis,
          transportation: transportationOptions,
          location: {
            lat: location.lat,
            lng: location.lng,
            address: location.address || (location.fullDetails && location.fullDetails.formatted_address) || address || 'Unknown location',
            fullDetails: location.fullDetails
          }
        };
        
        console.log('Analysis context location:', analysisContext.location);
        
        // Stream the AI analysis in real-time
        const analysisResult = await llm.analyzeFacilityFindingsStream(
          analysisContext,
          (streamData) => {
            // Forward streaming chunks to client
            sendSSE('ai_analysis', streamData);
          }
        );
        
        if (analysisResult.success) {
          aiGuidance = analysisResult.analysis;
          console.log('AI analysis streaming completed successfully');
        } else {
          console.log('AI analysis failed, using fallback:', analysisResult.error);
          aiGuidance = analysisResult.fallback?.analysis || null;
          sendSSE('ai_analysis', {
            type: 'analysis_fallback',
            analysis: aiGuidance,
            message: 'Using fallback analysis due to AI service issue'
          });
        }
      } else {
        console.log('LLM service not available, skipping AI analysis');
        sendSSE('ai_analysis', {
          type: 'analysis_unavailable',
          message: 'AI analysis temporarily unavailable'
        });
      }
    } catch (error) {
      console.log('AI analysis error:', error.message);
      sendSSE('ai_analysis', {
        type: 'analysis_error',
        error: error.message,
        message: 'AI analysis encountered an error'
      });
    }

    // Step 6: Send final summary
    console.log('Step 6: Sending final summary...');
    const finalResponse = {
      location: location,
      facilities: facilities,
      nearestFacility: facilities[0],
      weatherAnalysis: weatherAnalysis,
      transportationOptions: transportationOptions,
      aiGuidance: aiGuidance,
      summary: {
        facilitiesFound: facilities.length,
        recommendedFacility: facilities[0]?.name,
        hasWeatherData: !!weatherAnalysis && !weatherAnalysis.error,
        hasTransportationData: !!transportationOptions && !transportationOptions.error,
        hasAIGuidance: !!aiGuidance
      }
    };

    sendSSE('complete', {
      response: finalResponse,
      message: 'Facility search completed successfully'
    });

    console.log('✅ Streaming facility search completed');

  } catch (error) {
    console.error('Streaming facility finder error:', error);
    sendSSE('error', {
      error: error.message,
      message: 'An error occurred during facility search'
    });
  } finally {
    // Close the SSE connection
    res.end();
  }
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
          radius: getConfig('search.smallRadius'),
          maxResults: getConfig('search.limitedResults') / 2
        });
        
        if (facilities.length > 0) {
          const nearest = facilities[0];
          facilityInfo = `Nearest facility: ${nearest.name} at ${nearest.location.address.full}, ${nearest.distance} miles away. Services include: ${nearest.services.slice(0, 3).map(s => s.description).join(', ')}.`;
        }
      } catch (error) {
        facilityInfo = "Could not determine specific facilities for your location";
      }
    }

    // Test route for LLM without transportation complexity
    const simplePrompt = `A veteran asks: "${query}"

Available info: ${facilityInfo}

Provide helpful advice in 2-3 sentences. Be supportive and specific.`;

    const response = await llm.generateResponse(simplePrompt, {
      temperature: getConfig('services.llm.presets.simple.temperature'),
      maxTokens: getConfig('services.llm.presets.simple.maxTokens')
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
 * Test weather service endpoint
 * GET /api/facilities/test-weather
 */
router.get('/test-weather', async (req, res) => {
  try {
    const { lat = 38.8977, lng = -77.0365 } = req.query;
    
    console.log(`Testing weather for coordinates: ${lat}, ${lng}`);
    
    // Use mock weather data to avoid API key issues
    const weatherData = weather.getMockWeatherData(parseFloat(lat), parseFloat(lng), "Washington DC");
    const analysis = weather.analyzeWeatherForTransport(weatherData);
    
    res.json({
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
      weatherData: weatherData,
      analysis: analysis,
      mockDataUsed: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Weather test error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      apiKeyConfigured: !!process.env.OPENWEATHERMAP_API_KEY,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test transit service endpoint
 * GET /api/facilities/test-transit
 */
router.get('/test-transit', async (req, res) => {
  try {
    const { 
      originLat = 38.8977, 
      originLng = -77.0365, 
      destLat = 38.9296, 
      destLng = -77.0107 
    } = req.query;

    const origin = {
      lat: parseFloat(originLat),
      lng: parseFloat(originLng),
      address: "Test Origin"
    };

    const destination = {
      lat: parseFloat(destLat),
      lng: parseFloat(destLng),
      address: "Test Destination"
    };

    console.log(`Testing transit from ${origin.lat},${origin.lng} to ${destination.lat},${destination.lng}`);

    const transportationOptions = await transit.getTransportationOptions(origin, destination, {
      includeTransit: true,
      includeDriving: true,
      includeWalking: true
    });

    res.json({
      origin: origin,
      destination: destination,
      transportationOptions: transportationOptions,
      apiKeyConfigured: !!process.env.GOOGLE_MAPS_API_KEY,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Transit test error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      apiKeyConfigured: !!process.env.GOOGLE_MAPS_API_KEY,
      timestamp: new Date().toISOString()
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
      {
        temperature: getConfig('services.llm.presets.test.temperature'),
        maxTokens: getConfig('services.llm.presets.test.maxTokens'),
        timeout: getConfig('services.llm.presets.test.timeout')
      }
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
 * Generate recommendations based on facility, weather, and transportation
 * @param {Object} facility - Nearest VA facility
 * @param {Object} weatherAnalysis - Weather analysis
 * @param {Object} transportationOptions - Transportation options
 * @returns {Object} - Recommendations
 */
function generateRecommendations(facility, weatherAnalysis, transportationOptions = null) {
  const recommendations = {
    transportation: [],
    timing: [],
    preparation: [],
    alternatives: [],
    weatherAlerts: []
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

  // Transportation-specific recommendations from transit service
  if (transportationOptions && !transportationOptions.error) {
    if (transportationOptions.recommendations) {
      recommendations.transportation.push(...transportationOptions.recommendations);
    }

    // Add specific transit route information
    if (transportationOptions.options?.transit?.available) {
      const transitRoute = transportationOptions.options.transit.bestRoute;
      if (transitRoute) {
        recommendations.transportation.push(`Public Transit: ${transitRoute.duration} via ${transitRoute.overview || 'public transportation'}`);
        
        // Add fare information if available
        if (transitRoute.fare) {
          recommendations.preparation.push(`Transit fare: ${transitRoute.fare.text}`);
        }
      }
    }

    // Add walking information if reasonable distance
    if (transportationOptions.options?.walking?.available) {
      const walkRoute = transportationOptions.options.walking.bestRoute;
      if (walkRoute && walkRoute.distanceValue < 3200) { // Less than 2 miles
        recommendations.transportation.push(`Walking: ${walkRoute.duration} (${walkRoute.distance})`);
      }
    }

    // Add driving information
    if (transportationOptions.options?.driving?.available) {
      const driveRoute = transportationOptions.options.driving.bestRoute;
      if (driveRoute) {
        recommendations.transportation.push(`Driving: ${driveRoute.duration} (${driveRoute.distance})`);
      }
    }

    // Add rideshare information
    if (transportationOptions.options?.rideshare?.available) {
      const rideshareOption = transportationOptions.options.rideshare.options[0];
      if (rideshareOption) {
        recommendations.alternatives.push(`Rideshare: ${rideshareOption.estimatedTime} (${rideshareOption.estimatedCost})`);
      }
    }
  } else if (transportationOptions && transportationOptions.error) {
    recommendations.alternatives.push('Transportation details unavailable - consider public transit, driving, or rideshare');
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

  // Operating status considerations
  if (facility.operatingStatus === 'CLOSED') {
    recommendations.alternatives.push('Facility is currently closed - verify hours before traveling');
    recommendations.preparation.push('Call ahead to confirm facility is open');
  } else if (facility.operatingStatus === 'LIMITED') {
    recommendations.preparation.push('Facility operating with limited services - call to confirm availability');
  }

  // Veterans-specific considerations
  recommendations.preparation.push('Bring your VA ID card and any required documentation');
  
  if (facility.contact?.phone) {
    recommendations.preparation.push(`Call ahead to confirm appointment: ${facility.contact.phone}`);
  }

  return recommendations;
}

module.exports = router;