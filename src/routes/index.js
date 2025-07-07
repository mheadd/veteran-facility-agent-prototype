const express = require('express');
const router = express.Router();

// Import route modules
const facilities = require('./facilities');

// Use route modules
router.use('/facilities', facilities);

// Basic route for testing
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    services: ['VA Facilities', 'Weather', 'Geocoding'],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
