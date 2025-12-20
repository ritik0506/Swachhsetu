const express = require('express');
const router = express.Router();

/**
 * Geocoding proxy to avoid CORS issues with Nominatim
 * GET /api/geocoding/search?q=query
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    // Use dynamic import for node-fetch (ESM module)
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`,
      {
        headers: {
          'User-Agent': 'SwachhSetu/1.0 (Hygiene Reporting App)',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim returned ${response.status}`);
    }

    const data = await response.json();
    res.json({ success: true, results: data });

  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Location search failed. Please try again or use GPS location.'
    });
  }
});

/**
 * Reverse geocoding - get address from coordinates
 * GET /api/geocoding/reverse?lat=28.6139&lon=77.2090
 */
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
    }

    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'User-Agent': 'SwachhSetu/1.0 (Hygiene Reporting App)',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim returned ${response.status}`);
    }

    const data = await response.json();
    res.json({ success: true, address: data });

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Address lookup failed'
    });
  }
});

module.exports = router;
