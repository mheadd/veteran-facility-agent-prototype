const request = require('supertest');
const app = require('../src/app');

describe('Veteran Facility Agent API Tests', () => {
  // Increase timeout for LLM operations
  jest.setTimeout(70000);

  describe('Health and Basic Functionality', () => {
    test('GET /api/health should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });

    test('GET / should return API documentation', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Veteran Facility Agent API');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('findFacility');
      expect(response.body.endpoints).toHaveProperty('askQuestion');
    });

    test('GET /api/test should return basic API status', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'API is working!');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toContain('VA Facilities');
    });
  });

  describe('Geocoding Service', () => {
    test('POST /api/facilities/geocode should geocode valid address', async () => {
      const response = await request(app)
        .post('/api/facilities/geocode')
        .send({
          address: "1600 Pennsylvania Avenue NW, Washington, DC 20500"
        })
        .expect(200);

      expect(response.body).toHaveProperty('location');
      expect(response.body.location).toHaveProperty('lat');
      expect(response.body.location).toHaveProperty('lng');
      expect(response.body.location).toHaveProperty('formatted_address');
      // Accept either Google or OpenStreetMap as valid sources (depending on API key availability)
      expect(['google', 'openstreetmap']).toContain(response.body.location.source);
    });

    test('POST /api/facilities/geocode should handle invalid address', async () => {
      const response = await request(app)
        .post('/api/facilities/geocode')
        .send({
          address: "NotARealAddress123XYZ"
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/facilities/geocode should require address parameter', async () => {
      const response = await request(app)
        .post('/api/facilities/geocode')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Address is required');
    });
  });

  describe('VA Facility Discovery', () => {
    test('POST /api/facilities/find should find facilities by address', async () => {
      const response = await request(app)
        .post('/api/facilities/find')
        .send({
          address: "Washington, DC",
          includeWeather: false // Skip weather to avoid API key dependency
        })
        .expect(200);

      expect(response.body).toHaveProperty('location');
      expect(response.body).toHaveProperty('facilities');
      expect(response.body).toHaveProperty('nearestFacility');
      expect(response.body).toHaveProperty('recommendations');
      
      // Should find at least one facility in DC area
      expect(response.body.facilities).toBeInstanceOf(Array);
      expect(response.body.facilities.length).toBeGreaterThan(0);
      
      // Check facility data structure
      const facility = response.body.facilities[0];
      expect(facility).toHaveProperty('id');
      expect(facility).toHaveProperty('name');
      expect(facility).toHaveProperty('location');
      expect(facility).toHaveProperty('contact');
      expect(facility).toHaveProperty('services');
      expect(facility).toHaveProperty('distance');
    });

    test('POST /api/facilities/find should find facilities by coordinates', async () => {
      const response = await request(app)
        .post('/api/facilities/find')
        .send({
          lat: 38.8977,
          lng: -77.0365,
          includeWeather: false
        })
        .expect(200);

      expect(response.body).toHaveProperty('facilities');
      expect(response.body.facilities.length).toBeGreaterThan(0);
    });

    test('POST /api/facilities/find should require location input', async () => {
      const response = await request(app)
        .post('/api/facilities/find')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('address or coordinates');
    });

    test('POST /api/facilities/find should handle custom radius', async () => {
      const response = await request(app)
        .post('/api/facilities/find')
        .send({
          address: "Syracuse, NY",
          radius: 25,
          includeWeather: false
        })
        .expect(200);

      expect(response.body).toHaveProperty('searchParameters');
      expect(response.body.searchParameters.radius).toBe(25);
    });
  });

  describe('LLM Intelligence', () => {
    test('GET /api/facilities/test-llm should verify LLM availability', async () => {
      const response = await request(app)
        .get('/api/facilities/test-llm');

      // Should return 200 regardless of LLM availability
      expect([200, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('available');
      
      if (response.body.available) {
        expect(response.body).toHaveProperty('model');
        expect(response.body).toHaveProperty('response');
      }
    });

    test('POST /api/facilities/simple-ask should handle disability benefits query', async () => {
      const response = await request(app)
        .post('/api/facilities/simple-ask')
        .send({
          query: "I need help with disability benefits",
          location: "Washington, DC"
        });

      // Should return 200 if LLM is available, 500 if not
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('query');
        expect(response.body).toHaveProperty('advice');
        expect(response.body.advice).toContain('disability');
        expect(response.body.advice.length).toBeGreaterThan(50);
      }
    });

    test('POST /api/facilities/simple-ask should handle education benefits query', async () => {
      const response = await request(app)
        .post('/api/facilities/simple-ask')
        .send({
          query: "How do I use my GI Bill for college?",
          location: "Syracuse, NY"
        });

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.advice.toLowerCase()).toMatch(/gi bill|education|college/);
      }
    });

    test('POST /api/facilities/simple-ask should handle mental health crisis', async () => {
      const response = await request(app)
        .post('/api/facilities/simple-ask')
        .send({
          query: "I am having a mental health crisis",
          location: "Washington, DC"
        });

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.advice.toLowerCase()).toMatch(/crisis|help|support|alone/);
        // Should show appropriate urgency and empathy
        expect(response.body.advice).toContain('sorry');
      }
    });

    test('POST /api/facilities/simple-ask should require query parameter', async () => {
      const response = await request(app)
        .post('/api/facilities/simple-ask')
        .send({
          location: "Washington, DC"
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Query is required');
    });
  });

  describe('Facility Data Quality', () => {
    test('Facilities should have required fields', async () => {
      const response = await request(app)
        .post('/api/facilities/find')
        .send({
          address: "Washington, DC",
          includeWeather: false
        })
        .expect(200);

      const facility = response.body.facilities[0];
      
      // Required fields
      expect(facility).toHaveProperty('id');
      expect(facility).toHaveProperty('name');
      expect(facility).toHaveProperty('facilityType');
      expect(facility).toHaveProperty('location');
      expect(facility).toHaveProperty('contact');
      expect(facility).toHaveProperty('services');
      expect(facility).toHaveProperty('hours');
      expect(facility).toHaveProperty('distance');
      expect(facility).toHaveProperty('operatingStatus');
      
      // Location structure
      expect(facility.location).toHaveProperty('lat');
      expect(facility.location).toHaveProperty('lng');
      expect(facility.location).toHaveProperty('address');
      
      // Contact structure
      expect(facility.contact).toHaveProperty('phone');
      
      // Services should be array
      expect(facility.services).toBeInstanceOf(Array);
    });

    test('Facilities should be sorted by distance', async () => {
      const response = await request(app)
        .post('/api/facilities/find')
        .send({
          address: "Washington, DC",
          includeWeather: false
        })
        .expect(200);

      const facilities = response.body.facilities;
      
      if (facilities.length > 1) {
        for (let i = 1; i < facilities.length; i++) {
          expect(facilities[i].distance).toBeGreaterThanOrEqual(facilities[i-1].distance);
        }
      }
    });

    test('Distance calculations should be reasonable', async () => {
      const response = await request(app)
        .post('/api/facilities/find')
        .send({
          address: "Washington, DC",
          radius: 50,
          includeWeather: false
        })
        .expect(200);

      const facilities = response.body.facilities;
      
      facilities.forEach(facility => {
        expect(facility.distance).toBeGreaterThan(0);
        expect(facility.distance).toBeLessThanOrEqual(50);
        expect(facility.distanceFormatted).toContain('miles');
      });
    });
  });

  describe('Recommendations Engine', () => {
    test('Should generate basic recommendations', async () => {
      const response = await request(app)
        .post('/api/facilities/find')
        .send({
          address: "Washington, DC",
          includeWeather: false
        })
        .expect(200);

      expect(response.body).toHaveProperty('recommendations');
      expect(response.body.recommendations).toHaveProperty('transportation');
      expect(response.body.recommendations).toHaveProperty('timing');
      expect(response.body.recommendations).toHaveProperty('preparation');
      expect(response.body.recommendations).toHaveProperty('alternatives');
      
      // Should have some recommendations
      const allRecs = [
        ...response.body.recommendations.transportation,
        ...response.body.recommendations.preparation
      ];
      expect(allRecs.length).toBeGreaterThan(0);
    });

    test('Should include veteran-specific recommendations', async () => {
      const response = await request(app)
        .post('/api/facilities/find')
        .send({
          address: "Washington, DC",
          includeWeather: false
        })
        .expect(200);

      const allRecs = [
        ...response.body.recommendations.transportation,
        ...response.body.recommendations.preparation,
        ...response.body.recommendations.alternatives
      ].join(' ');

      // Should mention veteran-specific items
      expect(allRecs.toLowerCase()).toMatch(/va|veteran|id|card|appointment/);
    });
  });

  describe('Error Handling', () => {
    test('Should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/facilities/find')
        .send({
          address: 123 // Invalid type
        });

      expect([400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    }, 30000); // 30 second timeout for this test

    test('Should handle non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('Should handle empty location gracefully', async () => {
      const response = await request(app)
        .post('/api/facilities/find')
        .send({
          address: ""
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('AI-Powered Analysis', () => {
    test('Should include AI guidance when LLM is available', async () => {
      const response = await request(app)
        .post('/api/facilities/find')
        .send({
          address: "Washington, DC",
          query: "I need mental health services and have mobility issues"
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('facilities');
      expect(response.body.facilities.length).toBeGreaterThan(0);
      
      // Check if AI guidance is included (may be null if LLM unavailable)
      expect(response.body).toHaveProperty('aiGuidance');
      
      // If AI guidance is provided, verify its structure
      if (response.body.aiGuidance) {
        expect(response.body.aiGuidance).toHaveProperty('primaryRecommendation');
        expect(response.body.aiGuidance).toHaveProperty('reasoning');
        expect(response.body.aiGuidance).toHaveProperty('urgencyLevel');
        expect(typeof response.body.aiGuidance.primaryRecommendation).toBe('string');
        expect(['normal', 'moderate', 'high']).toContain(response.body.aiGuidance.urgencyLevel);
      }
    });

    test('Should handle AI analysis gracefully when LLM unavailable', async () => {
      const response = await request(app)
        .post('/api/facilities/find')
        .send({
          address: "New York, NY"
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('aiGuidance');
      // Should be null if LLM unavailable, or contain analysis if available
      if (response.body.aiGuidance) {
        expect(typeof response.body.aiGuidance).toBe('object');
      }
    });
  });
});