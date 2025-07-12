/**
 * Centralized configuration for the Veteran Facility Agent
 * This file contains all configurable values used throughout the application
 */

const config = {
  // Service Configuration
  services: {
    // VA API Service
    va: {
      defaultSearchRadius: 50,        // miles
      maxResultsMultiplier: 2,        // multiply by requested results for API call
      maxFacilities: 5,               // default max facilities to return
      cacheDuration: 3600,            // 1 hour in seconds
      baseUrl: 'https://sandbox-api.va.gov/services/va_facilities/v1',
      milesPerDegreeLat: 69,          // approximate miles per degree latitude
    },

    // Transit Service
    transit: {
      cacheDuration: 300,             // 5 minutes in seconds
      requestTimeout: 10000,          // 10 seconds in milliseconds
      rideshare: {
        estimatedTime: '15-25 minutes',
        estimatedCostRange: '$12-25',
        enabled: true,                // Enable rideshare options by default
        providers: ['uber', 'lyft'],  // Available rideshare providers
      }
    },

    // Weather Service
    weather: {
      cacheDuration: 300,             // 5 minutes in seconds
      requestTimeout: 10000,          // 10 seconds in milliseconds
      forecastHours: 24,              // hours to include in forecast
      forecastIntervalHours: 3,       // interval between forecast points
      analysisHours: 12,              // hours to analyze for recommendations
      temperatures: {
        freezing: 32,                 // Fahrenheit
        cold: 20,                     // Fahrenheit - consider cold weather gear
        hot: 95,                      // Fahrenheit - consider heat precautions
      }
    },

    // LLM Service
    llm: {
      timeout: 60000,                 // 60 seconds in milliseconds
      analysisTimeout: 120000,        // 120 seconds for complex analysis tasks
      availabilityTimeout: 5000,      // 5 seconds for availability checks
      defaultTemperature: 0.7,
      defaultMaxTokens: 1000,
      warmupPrompt: "Hi",
      warmupOptions: {
        maxTokens: 5,
        temperature: 0.1
      },
      presets: {
        facility: {
          temperature: 0.3,
          maxTokens: 400,               // Reduced for phi3:mini - more focused responses
          timeout: 60000                // Reduced timeout for faster model
        },
        emergency: {
          temperature: 0.4,
          maxTokens: 300,
          timeout: 45000                // Reduced timeout
        },
        recommendation: {
          temperature: 0.6,
          maxTokens: 300,
          timeout: 45000                // Reduced timeout
        },
        simple: {
          temperature: 0.5,
          maxTokens: 100,
          timeout: 20000                // Reduced timeout for simple queries
        },
        test: {
          temperature: 0.1,
          maxTokens: 50,
          timeout: 15000                // Reduced timeout for tests
        }
      }
    },

    // Geocoding Service
    geocoding: {
      requestTimeout: 10000,          // 10 seconds in milliseconds
    }
  },

  // Transportation Analysis
  transportation: {
    walking: {
      maxRecommendedDistance: 2,      // miles - max distance to recommend walking
      closeDistance: 0.5,             // miles - considered "very close"
      moderateDistance: 1,            // miles - considered "close"
      maxReasonableDistance: 3200,    // meters - max for walking suggestions
    },
    scoring: {
      walking: {
        base: 90,                     // base score for very close walking
        close: 70,                    // score for close walking
        moderate: 40,                 // score for moderate walking
        far: 10                       // score for far walking
      },
      transit: {
        base: 80,                     // base score for transit
        shortTimeBonus: 10,           // bonus for <= 30 min
        mediumTimeBonus: 5            // bonus for <= 60 min
      },
      driving: {
        base: 60,                     // base score for driving
        shortTimeBonus: 20,           // bonus for <= 15 min
        mediumTimeBonus: 10           // bonus for <= 30 min
      }
    },
    timeThresholds: {
      shortTransit: 30,               // minutes - short transit time
      mediumTransit: 60,              // minutes - medium transit time
      shortDrive: 15,                 // minutes - short drive time
      mediumDrive: 30,                // minutes - medium drive time
      longTime: 45                    // minutes - consider rideshare threshold
    }
  },

  // Search and Results
  search: {
    defaultRadius: 50,                // miles
    smallRadius: 25,                  // miles - for focused searches
    maxResultsPerType: 10,            // max results per facility type
    limitedResults: 4,                // results for simple queries
  },

  // API Response Configuration
  api: {
    timeout: 30000,                   // 30 seconds for API responses
    findTimeout: 150000,              // 2.5 minutes for find endpoint with AI analysis
    maxRetries: 3,                    // max retry attempts
  },

  // Facility Types
  facilityTypes: {
    all: 'all',
    medical: 'va_health_facility',
    benefits: 'va_benefits_facility',
    cemetery: 'va_cemetery'
  },

  // Test Configuration
  test: {
    timeout: 70000,                   // 70 seconds for Jest tests
    llmTimeout: 30000,                // 30 seconds for LLM tests
    defaultTestCoordinates: {
      lat: 38.8977,
      lng: -77.0365
    },
    defaultTestDestination: {
      lat: 38.9296,
      lng: -77.0107
    }
  },

  // Environment-specific overrides
  environments: {
    development: {
      // Override any values for development
      services: {
        llm: {
          timeout: 30000              // Shorter timeout for dev
        }
      }
    },
    test: {
      // Override any values for testing
      services: {
        va: {
          cacheDuration: 60           // Shorter cache for tests
        },
        transit: {
          cacheDuration: 60
        },
        weather: {
          cacheDuration: 60
        }
      }
    },
    production: {
      // Production-specific overrides
      api: {
        timeout: 60000                // Longer timeout for production
      }
    }
  }
};

/**
 * Get configuration value with environment-specific overrides
 * @param {string} path - Dot notation path to config value (e.g., 'services.va.defaultSearchRadius')
 * @param {*} defaultValue - Default value if not found
 * @returns {*} - Configuration value
 */
function getConfig(path, defaultValue = undefined) {
  const env = process.env.NODE_ENV || 'development';
  
  // Helper function to get nested property
  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Try environment-specific config first
  if (config.environments[env]) {
    const envValue = getNestedValue(config.environments[env], path);
    if (envValue !== undefined) {
      return envValue;
    }
  }

  // Fall back to base config
  const baseValue = getNestedValue(config, path);
  return baseValue !== undefined ? baseValue : defaultValue;
}

/**
 * Get all configuration for a service
 * @param {string} serviceName - Name of the service (e.g., 'va', 'transit', 'weather', 'llm')
 * @returns {Object} - Service configuration with environment overrides applied
 */
function getServiceConfig(serviceName) {
  const env = process.env.NODE_ENV || 'development';
  const baseConfig = config.services[serviceName] || {};
  const envOverrides = config.environments[env]?.services?.[serviceName] || {};
  
  return { ...baseConfig, ...envOverrides };
}

module.exports = {
  config,
  getConfig,
  getServiceConfig
};
