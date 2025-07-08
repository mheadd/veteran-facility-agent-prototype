const axios = require('axios');
const { getServiceConfig } = require('../config');

class SimpleGeocodingService {
  constructor() {
    this.config = getServiceConfig('geocoding');
    this.googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.weatherApiKey = process.env.OPENWEATHERMAP_API_KEY;
    
    console.log('Simple Geocoding Service initialized');
    console.log('Google API Key available:', this.googleApiKey ? 'yes' : 'no');
    console.log('Google API Key length:', this.googleApiKey ? this.googleApiKey.length : 0);
  }

  /**
   * Convert address to coordinates using Google Maps API directly
   * @param {string} address - Address to geocode
   * @returns {Promise<Object>} - {lat, lng, formatted_address}
   */
  async geocodeAddress(address) {
    if (!address || typeof address !== 'string') {
      throw new Error('Invalid address provided');
    }

    // Check if input is already coordinates
    const coordsMatch = address.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordsMatch) {
      return {
        lat: parseFloat(coordsMatch[1]),
        lng: parseFloat(coordsMatch[2]),
        formatted_address: address,
        source: 'coordinates'
      };
    }

    // Try Google Maps first
    if (this.googleApiKey) {
      try {
        return await this.geocodeWithGoogle(address);
      } catch (error) {
        console.log('Google geocoding failed:', error.message);
        // Fall through to OpenStreetMap
      }
    }

    // Fallback to OpenStreetMap
    try {
      return await this.geocodeWithOSM(address);
    } catch (error) {
      throw new Error(`Geocoding failed for address "${address}": ${error.message}`);
    }
  }

  /**
   * Geocode using Google Maps API
   * @param {string} address 
   * @returns {Promise<Object>}
   */
  async geocodeWithGoogle(address) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json`;
    const params = {
      address: address,
      key: this.googleApiKey
    };

    console.log('Attempting Google Maps geocoding...');
    
    const response = await axios.get(url, { 
      params,
      timeout: this.config.requestTimeout,
      headers: {
        'User-Agent': 'VeteranFacilityAgent/1.0'
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      
      // Extract state from address components
      const stateComponent = result.address_components.find(
        component => component.types.includes('administrative_area_level_1')
      );
      
      // Extract city
      const cityComponent = result.address_components.find(
        component => component.types.includes('locality')
      );
      
      // Extract zipcode
      const zipComponent = result.address_components.find(
        component => component.types.includes('postal_code')
      );
      
      console.log('Google geocoding successful');
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted_address: result.formatted_address,
        source: 'google',
        confidence: 1,
        components: {
          city: cityComponent?.long_name,
          state: stateComponent?.short_name,
          country: 'US',
          zipcode: zipComponent?.long_name
        }
      };
    } else {
      throw new Error(`Google API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
    }
  }

  /**
   * Geocode using OpenStreetMap Nominatim
   * @param {string} address 
   * @returns {Promise<Object>}
   */
  async geocodeWithOSM(address) {
    const url = `https://nominatim.openstreetmap.org/search`;
    const params = {
      q: address,
      format: 'json',
      limit: 1,
      countrycodes: 'us',
      addressdetails: 1
    };

    console.log('Attempting OpenStreetMap geocoding...');
    
    const response = await axios.get(url, {
      params,
      timeout: this.config.requestTimeout,
      headers: {
        'User-Agent': 'VeteranFacilityAgent/1.0 (contact@veteranfacilityagent.com)',
        'Referer': 'https://veteranfacilityagent.com'
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      
      console.log('OpenStreetMap geocoding successful');
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formatted_address: result.display_name,
        source: 'openstreetmap',
        confidence: parseFloat(result.importance) || 0.5,
        components: {
          city: result.address?.city || result.address?.town,
          state: result.address?.state,
          country: result.address?.country_code?.toUpperCase(),
          zipcode: result.address?.postcode
        }
      };
    } else {
      throw new Error('No results found from OpenStreetMap');
    }
  }

  /**
   * Reverse geocode coordinates to address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} - Address information
   */
  async reverseGeocode(lat, lng) {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid coordinates provided');
    }

    // Try Google first
    if (this.googleApiKey) {
      try {
        return await this.reverseGeocodeWithGoogle(lat, lng);
      } catch (error) {
        console.log('Google reverse geocoding failed:', error.message);
      }
    }

    // Fallback to OSM
    try {
      return await this.reverseGeocodeWithOSM(lat, lng);
    } catch (error) {
      throw new Error(`Reverse geocoding failed: ${error.message}`);
    }
  }

  /**
   * Reverse geocode using Google Maps
   * @param {number} lat 
   * @param {number} lng 
   * @returns {Promise<Object>}
   */
  async reverseGeocodeWithGoogle(lat, lng) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json`;
    const params = {
      latlng: `${lat},${lng}`,
      key: this.googleApiKey
    };

    const response = await axios.get(url, { params, timeout: this.config.requestTimeout });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        formatted_address: result.formatted_address,
        source: 'google'
      };
    } else {
      throw new Error(`Google reverse geocoding error: ${response.data.status}`);
    }
  }

  /**
   * Reverse geocode using OpenStreetMap
   * @param {number} lat 
   * @param {number} lng 
   * @returns {Promise<Object>}
   */
  async reverseGeocodeWithOSM(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse`;
    const params = {
      lat: lat,
      lon: lng,
      format: 'json',
      addressdetails: 1
    };

    const response = await axios.get(url, {
      params,
      timeout: this.config.requestTimeout,
      headers: {
        'User-Agent': 'VeteranFacilityAgent/1.0 (contact@veteranfacilityagent.com)',
        'Referer': 'https://veteranfacilityagent.com'
      }
    });

    if (response.data && response.data.display_name) {
      return {
        formatted_address: response.data.display_name,
        source: 'openstreetmap'
      };
    } else {
      throw new Error('No results from OpenStreetMap reverse geocoding');
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - First point latitude
   * @param {number} lng1 - First point longitude
   * @param {number} lat2 - Second point latitude
   * @param {number} lng2 - Second point longitude
   * @returns {number} - Distance in miles
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees 
   * @returns {number}
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = SimpleGeocodingService;