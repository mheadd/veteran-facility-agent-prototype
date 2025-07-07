const axios = require('axios');
const NodeGeocoder = require('node-geocoder');

class GeocodingService {
  constructor() {
    this.googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.mapboxApiKey = process.env.MAPBOX_API_KEY;
    
    console.log('Initializing geocoding service...');
    console.log('Google API Key present:', this.googleApiKey ? 'yes' : 'no');
    console.log('MapBox API Key present:', this.mapboxApiKey ? 'yes' : 'no');
    
    // Initialize geocoder with multiple providers
    this.geocoders = [];
    
    try {
      // Google Maps Geocoding (primary) - should be first since you have the API key
      if (this.googleApiKey && this.googleApiKey.trim().length > 0) {
        const googleGeocoder = NodeGeocoder({
          provider: 'google',
          apiKey: this.googleApiKey.trim(),
          formatter: null
        });
        googleGeocoder.providerName = 'google';
        googleGeocoder.hasValidApiKey = true;
        this.geocoders.push(googleGeocoder);
        console.log('Google Maps geocoding configured with API key');
      } else {
        console.log('Google Maps API key not available');
      }
      
      // MapBox (fallback)
      if (this.mapboxApiKey && this.mapboxApiKey.trim().length > 0) {
        const mapboxGeocoder = NodeGeocoder({
          provider: 'mapbox',
          apiKey: this.mapboxApiKey.trim(),
          formatter: null
        });
        mapboxGeocoder.providerName = 'mapbox';
        mapboxGeocoder.hasValidApiKey = true;
        this.geocoders.push(mapboxGeocoder);
        console.log('MapBox geocoding configured with API key');
      } else {
        console.log('MapBox API key not available');
      }
      
      // OpenStreetMap (free fallback) - with proper headers
      const osmGeocoder = NodeGeocoder({
        provider: 'openstreetmap',
        formatter: null,
        httpAdapter: 'https',
        extra: {
          'User-Agent': 'VeteranFacilityAgent/1.0 (contact@veteranfacilityagent.com)',
          'Referer': 'https://veteranfacilityagent.com'
        }
      });
      osmGeocoder.providerName = 'openstreetmap';
      osmGeocoder.hasValidApiKey = false;
      this.geocoders.push(osmGeocoder);
      console.log('OpenStreetMap geocoding configured as fallback');
      
    } catch (error) {
      console.error('Error initializing geocoders:', error);
      throw new Error('Failed to initialize geocoding services');
    }
    
    console.log(`Initialized ${this.geocoders.length} geocoding providers`);
    
    if (this.geocoders.length === 0) {
      throw new Error('No geocoding providers could be initialized');
    }
  }

  /**
   * Convert address to coordinates
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

    let lastError;
    
    // Try each geocoder in order
    for (let i = 0; i < this.geocoders.length; i++) {
      try {
        const geocoder = this.geocoders[i];
        const providerName = geocoder.providerName || geocoder.options?.provider || `provider-${i+1}`;
        console.log(`Attempting geocoding with ${providerName}...`);
        
        const results = await geocoder.geocode(address);
        
        if (results && results.length > 0) {
          const result = results[0];
          console.log(`Geocoding successful with ${providerName}`);
          return {
            lat: result.latitude,
            lng: result.longitude,
            formatted_address: result.formattedAddress || address,
            source: providerName,
            confidence: result.extra?.confidence || 1,
            components: {
              city: result.city,
              state: result.administrativeLevels?.level1short || result.state,
              country: result.countryCode,
              zipcode: result.zipcode
            }
          };
        } else {
          console.log(`${providerName} returned no results`);
        }
      } catch (error) {
        const geocoder = this.geocoders[i];
        const providerName = geocoder.providerName || geocoder.options?.provider || `provider-${i+1}`;
        console.log(`${providerName} geocoding failed:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    throw new Error(`Geocoding failed for address "${address}": ${lastError?.message || 'All providers failed'}`);
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

    let lastError;
    
    for (let i = 0; i < this.geocoders.length; i++) {
      try {
        const results = await this.geocoders[i].reverse({ lat, lon: lng });
        
        if (results && results.length > 0) {
          const result = results[0];
          return {
            formatted_address: result.formattedAddress,
            components: {
              street: result.streetName,
              city: result.city,
              state: result.administrativeLevels?.level1short || result.state,
              country: result.countryCode,
              zipcode: result.zipcode
            },
            source: this.geocoders[i].options.provider || 'unknown'
          };
        }
      } catch (error) {
        console.log(`Reverse geocoder ${i + 1} failed:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    throw new Error(`Reverse geocoding failed for coordinates ${lat}, ${lng}: ${lastError?.message}`);
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
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees 
   * @returns {number}
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validate US address format
   * @param {string} address 
   * @returns {boolean}
   */
  isValidUSAddress(address) {
    // Basic US address validation
    const usAddressPattern = /\d+.*,.*[A-Z]{2}\s*\d{5}(-\d{4})?/i;
    return usAddressPattern.test(address);
  }
}

module.exports = GeocodingService;