import express from 'express';
import { createServer as createViteServer } from 'vite';

const app = express();
const API_KEY = '579b464db66ec23bdd000001bb40583cde044c0b64c4c24108233e7e';
const API_URL = 'https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';

// Proxy middleware for Data.gov.in Air Quality API
app.use('/api/air-quality', async (req, res) => {
  try {
    const url = new URL(API_URL);
    url.searchParams.append('api-key', API_KEY);
    url.searchParams.append('format', 'json');
    url.searchParams.append('limit', '100');
    url.searchParams.append('offset', '0');
    url.searchParams.append('filters[city]', 'Delhi');
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.records) {
      const formattedRecords = data.records.map(record => ({
        station: record.station || 'Unknown Station',
        city: record.city || 'Unknown City',
        latitude: record.latitude,
        longitude: record.longitude,
        pollutant_avg: record.pollutant_avg,
        pollutant_max: record.pollutant_max,
        pollutant_min: record.pollutant_min,
        last_update: record.last_update
      }));
      res.json(formattedRecords);
    } else {
      throw new Error('No records found in API response');
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch air quality data' });
  }
});

// Create and configure Vite server
async function createServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  // Use Vite's middleware
  app.use(vite.middlewares);
  
  const port = process.env.PORT || 5173;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Start server
createServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});