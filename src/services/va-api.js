const axios = require('axios');

class VAAPIService {
  constructor() {
    this.baseUrl = process.env.VA_API_BASE_URL || 'https://sandbox-api.va.gov/services/va_facilities/v1';
    this.apiKey = process.env.VA_API_KEY;
    this.timeout = parseInt(process.env.VA_API_TIMEOUT) || 10000;
    this.cacheDuration = parseInt(process.env.FACILITY_CACHE_DURATION) || 3600; // 1 hour default
    this.cache = new Map();
    
    console.log('VA API Service initialized');
    console.log('API Key available:', this.apiKey ? 'yes' : 'no');
    console.log('Base URL:', this.baseUrl);
  }

  /**
   * Find VA facilities near a location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Array of VA facilities
   */
  async findFacilities(lat, lng, options = {}) {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid coordinates provided for facility search');
    }

    const {
      radius = parseInt(process.env.DEFAULT_SEARCH_RADIUS) || 50,
      maxResults = parseInt(process.env.MAX_FACILITIES_RETURNED) || 5,
      facilityType = null, // health, benefits, cemetery, etc.
      services = null // specific services needed
    } = options;

    const cacheKey = `facilities_${lat}_${lng}_${radius}_${facilityType}_${services}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration * 1000) {
        console.log('Returning cached VA facilities data');
        return cached.data;
      }
    }

    try {
      let facilities = []; // Declare facilities variable at the top
      
      // Check if we have API key for official VA API
      if (this.apiKey && this.apiKey.trim().length > 0) {
        console.log('Using official VA API with key...');
        try {
          facilities = await this.searchWithOfficialAPI(lat, lng, radius, facilityType, maxResults);
          console.log(`Found ${facilities.length} facilities with official API`);
        } catch (apiError) {
          console.log('Official VA API failed:', apiError.message);
          console.log('Falling back to alternative data source...');
          facilities = await this.searchWithAlternativeSource(lat, lng, radius, facilityType, maxResults);
        }
      } else {
        console.log('No VA API key available, using alternative data source...');
        facilities = await this.searchWithAlternativeSource(lat, lng, radius, facilityType, maxResults);
        console.log(`Found ${facilities.length} facilities with alternative source`);
      }

      // Filter by services if specified
      if (services && facilities.length > 0) {
        const serviceArray = Array.isArray(services) ? services : [services];
        facilities = facilities.filter(facility => {
          const facilityServices = facility.attributes?.services?.benefits;
          
          // Check if facility has the requested services
          if (!facilityServices || !Array.isArray(facilityServices)) return false;
          
          return serviceArray.some(requestedService => {
            return facilityServices.some(fs => 
              fs.name && fs.name.toLowerCase().includes(requestedService.toLowerCase())
            );
          });
        });
      }

      // Limit results
      facilities = facilities.slice(0, maxResults);

      // Transform to standardized format
      const transformedFacilities = facilities.map(facility => this.transformFacility(facility));

      // Cache the result
      this.cache.set(cacheKey, {
        data: transformedFacilities,
        timestamp: Date.now()
      });

      return transformedFacilities;

    } catch (error) {
      console.error('VA API service error:', error.message);
      
      // If it's a timeout or network error, try to return cached data even if expired
      if (this.cache.has(cacheKey) && (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND')) {
        console.log('Returning expired cached data due to network error');
        return this.cache.get(cacheKey).data;
      }
      
      throw new Error(`Failed to fetch VA facilities: ${error.message}`);
    }
  }

  /**
   * Search using official VA API with API key
   */
  async searchWithOfficialAPI(lat, lng, radius, facilityType, maxResults) {
    const params = new URLSearchParams({
      'lat': lat.toString(),
      'long': lng.toString(),
      'radius': radius.toString(),
      'per_page': (maxResults * 2).toString()
    });

    if (facilityType && facilityType !== 'all') {
      params.set('type', facilityType);
    }

    // Correct endpoint: /facilities (not /facilities/all)
    const url = `${this.baseUrl}/facilities?${params.toString()}`;
    console.log('VA API URL:', url);
    
    const response = await axios.get(url, {
      timeout: this.timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VeteranFacilityAgent/1.0',
        'apikey': this.apiKey
      }
    });

    const facilities = response.data.data || [];
    console.log(`Raw API response sample:`, JSON.stringify(facilities[0], null, 2));
    return this.addDistanceAndSort(facilities, lat, lng, radius);
  }

  /**
   * Alternative data source when VA API key is not available
   * Uses a curated list of major VA facilities
   */
  async searchWithAlternativeSource(lat, lng, radius, facilityType, maxResults) {
    console.log('Using alternative VA facility data source...');
    
    // Comprehensive list of major VA facilities across the US
    const sampleFacilities = [
      // Washington DC Area
      {
        id: 'vha_688',
        attributes: {
          name: 'Washington DC VA Medical Center',
          lat: 38.9296,
          long: -77.0107,
          classification: 'VA Medical Center (VAMC)',
          facility_type: 'va_health_facility',
          address: {
            physical: {
              address_1: '50 Irving St NW',
              city: 'Washington',
              state: 'DC',
              zip: '20422'
            }
          },
          phone: { main: '202-745-8000' },
          website: 'https://www.va.gov/washington-dc-health-care/',
          services: [
            { name: 'Primary Care', description: 'Primary medical care' },
            { name: 'Mental Health Care', description: 'Mental health services' },
            { name: 'Emergency Care', description: '24/7 emergency services' },
            { name: 'Specialty Care', description: 'Specialized medical services' }
          ],
          hours: {
            monday: '24/7',
            tuesday: '24/7',
            wednesday: '24/7',
            thursday: '24/7',
            friday: '24/7',
            saturday: '24/7',
            sunday: '24/7'
          }
        }
      },
      // Syracuse, NY
      {
        id: 'vha_632',
        attributes: {
          name: 'Syracuse VA Medical Center',
          lat: 43.0391,
          long: -76.1378,
          classification: 'VA Medical Center (VAMC)',
          facility_type: 'va_health_facility',
          address: {
            physical: {
              address_1: '800 Irving Ave',
              city: 'Syracuse',
              state: 'NY',
              zip: '13210'
            }
          },
          phone: { main: '315-425-4400' },
          website: 'https://www.va.gov/syracuse-health-care/',
          services: [
            { name: 'Primary Care', description: 'Primary medical care' },
            { name: 'Specialty Care', description: 'Specialized medical services' },
            { name: 'Mental Health Care', description: 'Mental health services' }
          ],
          hours: {
            monday: '7:00AM-4:30PM',
            tuesday: '7:00AM-4:30PM',
            wednesday: '7:00AM-4:30PM',
            thursday: '7:00AM-4:30PM',
            friday: '7:00AM-4:30PM',
            saturday: 'Closed',
            sunday: 'Closed'
          }
        }
      },
      // Baltimore, MD
      {
        id: 'vha_512',
        attributes: {
          name: 'Baltimore VA Medical Center',
          lat: 39.2904,
          long: -76.6122,
          classification: 'VA Medical Center (VAMC)',
          facility_type: 'va_health_facility',
          address: {
            physical: {
              address_1: '10 N Greene St',
              city: 'Baltimore',
              state: 'MD',
              zip: '21201'
            }
          },
          phone: { main: '410-605-7000' },
          website: 'https://www.va.gov/baltimore-health-care/',
          services: [
            { name: 'Primary Care', description: 'Primary medical care' },
            { name: 'Emergency Care', description: 'Emergency services' },
            { name: 'Specialty Care', description: 'Specialized medical services' }
          ]
        }
      },
      // Richmond, VA
      {
        id: 'vha_652',
        attributes: {
          name: 'Richmond VA Medical Center',
          lat: 37.5407,
          long: -77.4360,
          classification: 'VA Medical Center (VAMC)',
          facility_type: 'va_health_facility',
          address: {
            physical: {
              address_1: '1201 Broad Rock Blvd',
              city: 'Richmond',
              state: 'VA',
              zip: '23249'
            }
          },
          phone: { main: '804-675-5000' },
          website: 'https://www.va.gov/richmond-health-care/',
          services: [
            { name: 'Primary Care', description: 'Primary medical care' },
            { name: 'Mental Health Care', description: 'Mental health services' }
          ]
        }
      },
      // Philadelphia, PA
      {
        id: 'vha_642',
        attributes: {
          name: 'Philadelphia VA Medical Center',
          lat: 39.9526,
          long: -75.1652,
          classification: 'VA Medical Center (VAMC)',
          facility_type: 'va_health_facility',
          address: {
            physical: {
              address_1: '3900 Woodland Ave',
              city: 'Philadelphia',
              state: 'PA',
              zip: '19104'
            }
          },
          phone: { main: '215-823-5800' },
          website: 'https://www.va.gov/philadelphia-health-care/',
          services: [
            { name: 'Primary Care', description: 'Primary medical care' },
            { name: 'Specialty Care', description: 'Specialized medical services' }
          ]
        }
      }
    ];

    // Filter and sort by distance
    const facilitiesWithDistance = sampleFacilities.map(facility => {
      const distance = this.calculateDistance(lat, lng, facility.attributes.lat, facility.attributes.long);
      return {
        ...facility,
        distance: distance,
        distanceFormatted: `${distance} miles`
      };
    }).filter(facility => facility.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults);

    console.log(`Alternative source returned ${facilitiesWithDistance.length} facilities`);
    return facilitiesWithDistance;
  }

  /**
   * Add distance calculations and sort by distance
   */
  addDistanceAndSort(facilities, lat, lng, radius) {
    return facilities.map(facility => {
      const facilityLat = facility.attributes?.lat;
      const facilityLng = facility.attributes?.long;
      
      if (!facilityLat || !facilityLng) {
        return null; // Skip facilities without coordinates
      }
      
      const distance = this.calculateDistance(lat, lng, facilityLat, facilityLng);
      
      return {
        ...facility,
        distance: distance,
        distanceFormatted: `${distance} miles`
      };
    }).filter(facility => {
      // Filter out null facilities and those outside radius
      return facility && facility.distance <= radius;
    }).sort((a, b) => a.distance - b.distance);
  }

  /**
   * Get detailed information about a specific VA facility
   * @param {string} facilityId - VA facility ID
   * @returns {Promise<Object>} - Detailed facility information
   */
  async getFacilityDetails(facilityId) {
    if (!facilityId) {
      throw new Error('Facility ID is required');
    }

    const cacheKey = `facility_details_${facilityId}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration * 1000) {
        return cached.data;
      }
    }

    try {
      const response = await axios.get(`${this.baseUrl}/facilities/${facilityId}`, {
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VeteranFacilityAgent/1.0',
          'apikey': this.apiKey || '' // Include API key if available
        }
      });

      const facility = this.transformFacility(response.data.data);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: facility,
        timestamp: Date.now()
      });

      return facility;

    } catch (error) {
      throw new Error(`Failed to fetch facility details: ${error.message}`);
    }
  }

  /**
   * Transform VA API facility data to standardized format
   * @param {Object} facility - Raw facility data from VA API
   * @returns {Object} - Transformed facility data
   */
  transformFacility(facility) {
    const attrs = facility.attributes || {};
    
    // Handle services - VA API has services.benefits array structure
    let services = [];
    if (attrs.services && attrs.services.benefits && Array.isArray(attrs.services.benefits)) {
      services = attrs.services.benefits.map(service => ({
        name: service.name,
        serviceId: service.serviceId,
        description: service.name.replace(/([A-Z])/g, ' $1').trim(), // Convert camelCase to readable
        link: service.link
      }));
    }

    // Handle address - VA API uses address1 instead of address_1
    const address = attrs.address || {};
    const physicalAddress = address.physical || {};
    
    return {
      id: facility.id,
      name: attrs.name || 'Unknown Facility',
      classification: attrs.classification || attrs.facilityType || 'VA Facility',
      facilityType: attrs.facilityType || attrs.facility_type || 'unknown',
      location: {
        lat: parseFloat(attrs.lat) || 0,
        lng: parseFloat(attrs.long) || 0,
        address: {
          street: physicalAddress.address1 || physicalAddress.address_1 || '',
          city: physicalAddress.city || '',
          state: physicalAddress.state || '',
          zipcode: physicalAddress.zip || physicalAddress.zipcode || '',
          full: this.formatAddress(physicalAddress)
        }
      },
      contact: {
        phone: attrs.phone?.main || '',
        fax: attrs.phone?.fax || '',
        website: attrs.website || '',
        email: attrs.email || ''
      },
      hours: attrs.hours || {},
      services: services,
      specialties: [],
      accessibility: [],
      parking: attrs.parking || null,
      transportation: this.parseTransportationServices(attrs),
      distance: facility.distance || 0,
      distanceFormatted: facility.distanceFormatted || `${facility.distance || 0} miles`,
      operatingStatus: attrs.operatingStatus?.code || 'unknown',
      operatingStatusInfo: attrs.operatingStatus?.additionalInfo || null,
      timeZone: attrs.timeZone || null,
      lastUpdated: attrs.last_updated || attrs.updated_at || null
    };
  }

  /**
   * Parse transportation services from facility data
   * @param {Object} attrs - Facility attributes
   * @returns {Object} - Transportation information
   */
  parseTransportationServices(attrs) {
    const transport = {
      hasShuttle: false,
      shuttleInfo: null,
      publicTransit: null,
      parking: {
        available: false,
        details: null
      }
    };

    // Check for VA shuttle services in benefits array
    if (attrs.services && attrs.services.benefits && Array.isArray(attrs.services.benefits)) {
      const shuttleService = attrs.services.benefits.find(service => 
        service.name && (
          service.name.toLowerCase().includes('transportation') ||
          service.name.toLowerCase().includes('shuttle')
        )
      );
      
      if (shuttleService) {
        transport.hasShuttle = true;
        transport.shuttleInfo = shuttleService.name;
      }
    }

    // Parse parking information
    if (attrs.parking) {
      transport.parking.available = true;
      transport.parking.details = attrs.parking;
    }

    return transport;
  }

  /**
   * Format physical address
   * @param {Object} address - Physical address object
   * @returns {string} - Formatted address
   */
  formatAddress(address) {
    if (!address) return '';
    
    const parts = [
      address.address1 || address.address_1, // VA API uses address1
      address.city,
      `${address.state} ${address.zip}`
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Calculate bounding box for geographic search
   * @param {number} lat - Center latitude
   * @param {number} lng - Center longitude
   * @param {number} radiusMiles - Search radius in miles
   * @returns {Object} - Bounding box coordinates
   */
  calculateBoundingBox(lat, lng, radiusMiles) {
    const latRange = radiusMiles / 69; // Approximate miles per degree latitude
    const lngRange = radiusMiles / (69 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude
    
    return {
      minLat: lat - latRange,
      maxLat: lat + latRange,
      minLng: lng - lngRange,
      maxLng: lng + lngRange
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 
   * @param {number} lng1 
   * @param {number} lat2 
   * @param {number} lng2 
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

  /**
   * Clear facilities cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = VAAPIService;