// Test setup file for veteran facility agent

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.VA_API_BASE_URL = 'https://sandbox-api.va.gov/services/va_facilities/v1';
process.env.OLLAMA_URL = 'http://ollama:11434';
process.env.DEFAULT_MODEL = 'llama3';
process.env.REDIS_URL = 'redis://redis:6379';

// Mock external APIs if keys not available
if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.log('Warning: GOOGLE_MAPS_API_KEY not set - some geocoding tests may fail');
}

if (!process.env.VA_API_KEY) {
  console.log('Warning: VA_API_KEY not set - using fallback data for facility tests');
}

if (!process.env.OPENWEATHERMAP_API_KEY) {
  console.log('Note: Weather API key not set - weather tests will be skipped');
}

// Global test configuration
global.testConfig = {
  timeout: 60000,
  maxRetries: 3,
  testLocations: {
    washingtonDC: {
      address: "1600 Pennsylvania Avenue NW, Washington, DC 20500",
      lat: 38.8977,
      lng: -77.0365
    },
    syracuseNY: {
      address: "Syracuse, NY",
      lat: 43.0481,
      lng: -76.1474
    }
  },
  expectedFacilityFields: [
    'id', 'name', 'facilityType', 'location', 'contact', 
    'services', 'hours', 'distance', 'operatingStatus'
  ]
};

// Helper functions for tests
global.testHelpers = {
  /**
   * Wait for a condition to be true
   * @param {Function} condition - Function that returns true when ready
   * @param {number} timeout - Max time to wait in ms
   * @param {number} interval - Check interval in ms
   */
  waitFor: async (condition, timeout = 30000, interval = 1000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },

  /**
   * Validate facility object structure
   * @param {Object} facility - Facility object to validate
   */
  validateFacilityStructure: (facility) => {
    const requiredFields = global.testConfig.expectedFacilityFields;
    
    requiredFields.forEach(field => {
      if (!facility.hasOwnProperty(field)) {
        throw new Error(`Facility missing required field: ${field}`);
      }
    });

    // Validate nested structures
    if (facility.location) {
      if (!facility.location.lat || !facility.location.lng) {
        throw new Error('Facility location missing coordinates');
      }
      if (!facility.location.address) {
        throw new Error('Facility location missing address');
      }
    }

    if (facility.services && !Array.isArray(facility.services)) {
      throw new Error('Facility services must be an array');
    }

    return true;
  },

  /**
   * Check if LLM service is available for testing
   */
  isLLMAvailable: async () => {
    try {
      const axios = require('axios');
      const response = await axios.get(`${process.env.OLLAMA_URL}/api/tags`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  /**
   * Generate test data for various scenarios
   */
  generateTestScenarios: () => ({
    mentalHealthCrisis: {
      query: "I am having a mental health crisis and need immediate help",
      expectedKeywords: ['crisis', 'help', 'support', 'alone', 'sorry'],
      urgency: 'high'
    },
    disabilityBenefits: {
      query: "I need help with disability benefits",
      expectedKeywords: ['disability', 'benefits', 'claim', 'assistance'],
      urgency: 'medium'
    },
    educationBenefits: {
      query: "How do I use my GI Bill for college?",
      expectedKeywords: ['gi bill', 'education', 'college', 'benefits'],
      urgency: 'low'
    },
    homeLoan: {
      query: "Can the VA help me buy a house?",
      expectedKeywords: ['home loan', 'mortgage', 'house', 'buy'],
      urgency: 'low'
    },
    mobilityIssues: {
      query: "I have mobility issues and use a wheelchair",
      expectedKeywords: ['mobility', 'wheelchair', 'accessibility', 'medical'],
      urgency: 'medium'
    }
  })
};

// Setup and teardown hooks
beforeAll(async () => {
  console.log('🧪 Starting Veteran Facility Agent test suite...');
  
  // Check if required services are available
  const llmAvailable = await global.testHelpers.isLLMAvailable();
  if (llmAvailable) {
    console.log('✅ LLM service available for testing');
  } else {
    console.log('⚠️  LLM service not available - LLM tests will be conditional');
  }
});

afterAll(async () => {
  console.log('🎉 Test suite completed');
  
  // Clean up any test data if needed
  // This could include clearing test database entries, etc.
});

// Error handling for async tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = {
  testConfig: global.testConfig,
  testHelpers: global.testHelpers
};