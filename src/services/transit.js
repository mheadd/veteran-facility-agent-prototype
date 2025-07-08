const axios = require('axios');
const { getServiceConfig } = require('../config');

class TransitService {
  constructor() {
    this.config = getServiceConfig('transit');
    this.googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.directionsApiKey = process.env.GOOGLE_DIRECTIONS_API_KEY || this.googleApiKey;
    this.cacheDuration = parseInt(process.env.TRANSIT_CACHE_DURATION) || this.config.cacheDuration;
    this.cache = new Map();
    
    console.log('Transit Service initialized');
    console.log('Google API Key available:', this.googleApiKey ? 'yes' : 'no');
  }

  /**
   * Get comprehensive transportation options between two points
   * @param {Object} origin - {lat, lng, address}
   * @param {Object} destination - {lat, lng, address}
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Transportation options
   */
  async getTransportationOptions(origin, destination, options = {}) {
    const {
      includeTransit = true,
      includeDriving = true,
      includeWalking = true,
      includeBicycling = false,
      departureTime = 'now',
      arrivalTime = null
    } = options;

    if (!origin || !destination) {
      throw new Error('Origin and destination are required');
    }

    const cacheKey = `transit_${origin.lat}_${origin.lng}_${destination.lat}_${destination.lng}_${departureTime}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration * 1000) {
        console.log('Returning cached transit data');
        return cached.data;
      }
    }

    try {
      const transportOptions = {
        transit: null,
        driving: null,
        walking: null,
        bicycling: null,
        rideshare: null
      };

      // Get different transportation modes
      const promises = [];

      if (includeTransit && this.directionsApiKey) {
        promises.push(this.getDirections(origin, destination, 'transit', departureTime, arrivalTime));
      }

      if (includeDriving && this.directionsApiKey) {
        promises.push(this.getDirections(origin, destination, 'driving', departureTime));
      }

      if (includeWalking && this.directionsApiKey) {
        promises.push(this.getDirections(origin, destination, 'walking'));
      }

      if (includeBicycling && this.directionsApiKey) {
        promises.push(this.getDirections(origin, destination, 'bicycling'));
      }

      // Execute all API calls in parallel
      const results = await Promise.allSettled(promises);
      
      let resultIndex = 0;
      if (includeTransit && this.directionsApiKey) {
        if (results[resultIndex].status === 'fulfilled') {
          transportOptions.transit = this.parseDirectionsResponse(results[resultIndex].value, 'transit');
        }
        resultIndex++;
      }

      if (includeDriving && this.directionsApiKey) {
        if (results[resultIndex].status === 'fulfilled') {
          transportOptions.driving = this.parseDirectionsResponse(results[resultIndex].value, 'driving');
        }
        resultIndex++;
      }

      if (includeWalking && this.directionsApiKey) {
        if (results[resultIndex].status === 'fulfilled') {
          transportOptions.walking = this.parseDirectionsResponse(results[resultIndex].value, 'walking');
        }
        resultIndex++;
      }

      if (includeBicycling && this.directionsApiKey) {
        if (results[resultIndex].status === 'fulfilled') {
          transportOptions.bicycling = this.parseDirectionsResponse(results[resultIndex].value, 'bicycling');
        }
        resultIndex++;
      }

      // Add rideshare options (deep links only)
      transportOptions.rideshare = this.generateRideshareOptions(origin, destination);

      // Calculate best options and add recommendations
      const analysis = this.analyzeTransportationOptions(transportOptions, origin, destination);

      const result = {
        origin: origin,
        destination: destination,
        options: transportOptions,
        recommendations: analysis.recommendations,
        bestOption: analysis.bestOption,
        summary: analysis.summary,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('Transit service error:', error.message);
      throw new Error(`Failed to get transportation options: ${error.message}`);
    }
  }

  /**
   * Get directions from Google Directions API
   * @param {Object} origin 
   * @param {Object} destination 
   * @param {string} mode - transit, driving, walking, bicycling
   * @param {string} departureTime 
   * @param {string} arrivalTime 
   * @returns {Promise<Object>}
   */
  async getDirections(origin, destination, mode, departureTime = null, arrivalTime = null) {
    if (!this.directionsApiKey) {
      throw new Error('Google Directions API key not configured');
    }

    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: mode,
      key: this.directionsApiKey
    });

    // Add time parameters for transit
    if (mode === 'transit') {
      if (arrivalTime) {
        params.set('arrival_time', arrivalTime);
      } else if (departureTime === 'now') {
        params.set('departure_time', 'now');
      } else if (departureTime) {
        params.set('departure_time', departureTime);
      }
      
      // Get alternative routes for transit
      params.set('alternatives', 'true');
      params.set('transit_routing_preference', 'fewer_transfers');
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
    console.log(`Getting ${mode} directions...`);

    const response = await axios.get(url, {
      timeout: this.config.requestTimeout,
      headers: {
        'User-Agent': 'VeteranFacilityAgent/1.0'
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Directions API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
    }

    return response.data;
  }

  /**
   * Parse Google Directions API response
   * @param {Object} response 
   * @param {string} mode 
   * @returns {Object}
   */
  parseDirectionsResponse(response, mode) {
    if (!response.routes || response.routes.length === 0) {
      return {
        available: false,
        error: 'No routes found'
      };
    }

    const routes = response.routes.map(route => {
      const leg = route.legs[0]; // Assuming single leg journey
      
      const routeInfo = {
        duration: leg.duration?.text,
        durationValue: leg.duration?.value, // seconds
        distance: leg.distance?.text,
        distanceValue: leg.distance?.value, // meters
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        overview: route.summary,
        steps: []
      };

      // Parse steps with detailed instructions
      if (leg.steps) {
        routeInfo.steps = leg.steps.map(step => {
          const stepInfo = {
            instruction: step.html_instructions?.replace(/<[^>]*>/g, ''), // Remove HTML tags
            duration: step.duration?.text,
            distance: step.distance?.text,
            travelMode: step.travel_mode
          };

          // Add transit-specific information
          if (step.transit_details) {
            stepInfo.transit = {
              line: step.transit_details.line?.short_name || step.transit_details.line?.name,
              vehicle: step.transit_details.line?.vehicle?.name,
              departureStop: step.transit_details.departure_stop?.name,
              arrivalStop: step.transit_details.arrival_stop?.name,
              departureTime: step.transit_details.departure_time?.text,
              arrivalTime: step.transit_details.arrival_time?.text,
              numStops: step.transit_details.num_stops,
              headsign: step.transit_details.headsign
            };
          }

          return stepInfo;
        });
      }

      // Add fare information if available
      if (route.fare) {
        routeInfo.fare = {
          currency: route.fare.currency,
          value: route.fare.value,
          text: route.fare.text
        };
      }

      return routeInfo;
    });

    return {
      available: true,
      mode: mode,
      routes: routes,
      bestRoute: routes[0], // Google returns best route first
      alternatives: routes.slice(1)
    };
  }

  /**
   * Generate rideshare options with deep links
   * @param {Object} origin 
   * @param {Object} destination 
   * @returns {Object}
   */
  generateRideshareOptions(origin, destination) {
    const uberLink = `uber://?action=setPickup&pickup[latitude]=${origin.lat}&pickup[longitude]=${origin.lng}&dropoff[latitude]=${destination.lat}&dropoff[longitude]=${destination.lng}`;
    const uberWebLink = `https://uber.com/ul/?pickup[latitude]=${origin.lat}&pickup[longitude]=${origin.lng}&dropoff[latitude]=${destination.lat}&dropoff[longitude]=${destination.lng}`;
    
    const lyftLink = `lyft://ridetype?id=lyft&destination[latitude]=${destination.lat}&destination[longitude]=${destination.lng}&pickup[latitude]=${origin.lat}&pickup[longitude]=${origin.lng}`;
    const lyftWebLink = `https://lyft.com/ride?destination[latitude]=${destination.lat}&destination[longitude]=${destination.lng}&pickup[latitude]=${origin.lat}&pickup[longitude]=${origin.lng}`;

    return {
      available: true,
      options: [
        {
          provider: 'Uber',
          deepLink: uberLink,
          webLink: uberWebLink,
          estimatedTime: this.config.rideshare.estimatedTime,
          estimatedCost: this.config.rideshare.estimatedCostRange,
          description: 'Request an Uber ride'
        },
        {
          provider: 'Lyft',
          deepLink: lyftLink,
          webLink: lyftWebLink,
          estimatedTime: this.config.rideshare.estimatedTime,
          estimatedCost: this.config.rideshare.estimatedCostRange,
          description: 'Request a Lyft ride'
        }
      ]
    };
  }

  /**
   * Analyze transportation options and provide recommendations
   * @param {Object} options 
   * @param {Object} origin 
   * @param {Object} destination 
   * @returns {Object}
   */
  analyzeTransportationOptions(options, origin, destination) {
    const recommendations = [];
    let bestOption = null;
    let bestScore = 0;

    // Score each available option
    const scoredOptions = [];

    if (options.walking?.available && options.walking.bestRoute) {
      const walkTime = options.walking.bestRoute.durationValue / 60; // minutes
      const walkDistance = options.walking.bestRoute.distanceValue / 1609; // miles
      
      let score = 0;
      if (walkDistance <= 0.5) score = 90; // Very close
      else if (walkDistance <= 1) score = 70; // Close
      else if (walkDistance <= 2) score = 40; // Walkable
      else score = 10; // Too far
      
      scoredOptions.push({
        type: 'walking',
        score: score,
        time: walkTime,
        distance: walkDistance,
        data: options.walking
      });
    }

    if (options.transit?.available && options.transit.bestRoute) {
      const transitTime = options.transit.bestRoute.durationValue / 60; // minutes
      let score = 80; // Base score for transit
      
      // Bonus for shorter time
      if (transitTime <= 30) score += 10;
      else if (transitTime <= 60) score += 5;
      
      scoredOptions.push({
        type: 'transit',
        score: score,
        time: transitTime,
        data: options.transit
      });
    }

    if (options.driving?.available && options.driving.bestRoute) {
      const driveTime = options.driving.bestRoute.durationValue / 60; // minutes
      let score = 60; // Base score for driving
      
      // Bonus for shorter time
      if (driveTime <= 15) score += 20;
      else if (driveTime <= 30) score += 10;
      
      scoredOptions.push({
        type: 'driving',
        score: score,
        time: driveTime,
        data: options.driving
      });
    }

    // Find best option
    scoredOptions.forEach(option => {
      if (option.score > bestScore) {
        bestScore = option.score;
        bestOption = {
          type: option.type,
          score: option.score,
          reason: this.getBestOptionReason(option),
          data: option.data
        };
      }
    });

    // Generate recommendations
    if (scoredOptions.length === 0) {
      recommendations.push('No transportation options available - consider rideshare services');
    } else {
      recommendations.push(...this.generateTransportRecommendations(scoredOptions));
    }

    return {
      recommendations: recommendations,
      bestOption: bestOption,
      summary: `${scoredOptions.length} transportation options available`
    };
  }

  /**
   * Get reason for best option selection
   * @param {Object} option 
   * @returns {string}
   */
  getBestOptionReason(option) {
    switch (option.type) {
      case 'walking':
        if (option.distance <= 0.5) return 'Very short distance, easy walk';
        if (option.distance <= 1) return 'Close enough for a pleasant walk';
        return 'Walkable distance, good exercise option';
      case 'transit':
        return 'Public transit provides good value and avoids parking concerns';
      case 'driving':
        return 'Driving offers flexibility and direct route';
      case 'bicycling':
        return 'Bicycling is efficient and environmentally friendly';
      default:
        return 'Recommended based on time and convenience';
    }
  }

  /**
   * Generate specific transportation recommendations
   * @param {Array} scoredOptions 
   * @returns {Array}
   */
  generateTransportRecommendations(scoredOptions) {
    const recommendations = [];
    
    // Sort by score
    scoredOptions.sort((a, b) => b.score - a.score);
    
    const best = scoredOptions[0];
    
    if (best.type === 'walking' && best.distance <= 1) {
      recommendations.push(`Walking recommended: ${Math.round(best.distance * 10) / 10} miles in ${Math.round(best.time)} minutes`);
    } else if (best.type === 'transit') {
      recommendations.push(`Public transit recommended: ${Math.round(best.time)} minutes travel time`);
    } else if (best.type === 'driving') {
      recommendations.push(`Driving recommended: ${Math.round(best.time)} minutes drive time`);
    }
    
    // Add alternatives
    if (scoredOptions.length > 1) {
      const alternative = scoredOptions[1];
      recommendations.push(`Alternative: ${alternative.type} (${Math.round(alternative.time)} minutes)`);
    }
    
    // Add rideshare suggestion for longer distances or poor weather
    const hasLongDistance = scoredOptions.some(opt => opt.time > 45);
    if (hasLongDistance) {
      recommendations.push('For convenience, consider rideshare services (Uber/Lyft)');
    }
    
    return recommendations;
  }

  /**
   * Clear transit cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = TransitService;