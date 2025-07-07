const express = require('express');
const router = express.Router();

const GeocodingService = require('../services/geocoding-simple');
const WeatherService = require('../services/weather');
const VAAPIService = require('../services/va-api');

// Initialize services
const geocoding = new GeocodingService();
const weather = new WeatherService();
const vaAPI = new VAAPIService();

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