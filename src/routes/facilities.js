const express = require('express');
const router = express.Router();

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

    // Step 5: Build response with recommendations
    console.log('Step 5: Building response...');
    const response = {
      location: location,
      facilities: facilities,
      nearestFacility: facilities[0],
      weatherAnalysis: weatherAnalysis,
      transportationOptions: transportationOptions,
      recommendations: generateRecommendations(facilities[0], weatherAnalysis, transportationOptions),
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
    
    res.status(500).json({
      error: 'Failed to find VA facilities',
      message: error.message,
      timestamp: new Date().toISOString()
    });
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

    // Test route for LLM without transportation complexity
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
 * Test weather service endpoint
 * GET /api/facilities/test-weather
 */
router.get('/test-weather', async (req, res) => {
  try {
    const { lat = 38.8977, lng = -77.0365 } = req.query;
    
    console.log(`Testing weather for coordinates: ${lat}, ${lng}`);
    
    // Test weather service directly
    const weatherData = await weather.getWeatherData(parseFloat(lat), parseFloat(lng));
    const analysis = weather.analyzeWeatherForTransport(weatherData);
    
    res.json({
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
      weatherData: weatherData,
      analysis: analysis,
      apiKeyConfigured: !!process.env.OPENWEATHERMAP_API_KEY,
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
    recommendations.alternatives.push('⚠️ Facility is currently closed - verify hours before traveling');
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