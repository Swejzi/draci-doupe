/**
 * Integrační testy pro ověření cache hlaviček
 */

const request = require('supertest');
const express = require('express');
const { staticCache, shortCache, noCache } = require('../../middleware/cacheMiddleware');

// Vytvoření testovací Express aplikace
const app = express();

// Testovací endpointy s různými cache strategiemi
app.get('/static', staticCache, (req, res) => res.json({ message: 'Static data' }));
app.get('/short', shortCache, (req, res) => res.json({ message: 'Short-lived data' }));
app.get('/dynamic', noCache, (req, res) => res.json({ message: 'Dynamic data' }));
app.post('/update', noCache, (req, res) => res.json({ message: 'Update successful' }));

describe('Cache Headers Integration Tests', () => {
  
  it('should set long cache headers for static data', async () => {
    const response = await request(app).get('/static');
    
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('public, max-age=3600');
    expect(response.headers['pragma']).toBe('no-cache');
    expect(response.headers['expires']).toBe('0');
    // ETag by měl být povolen, takže by neměl být explicitně nastaven na false
    expect(response.headers['etag']).toBeDefined();
  });
  
  it('should set short cache headers for semi-dynamic data', async () => {
    const response = await request(app).get('/short');
    
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('public, max-age=60');
    expect(response.headers['pragma']).toBe('no-cache');
    expect(response.headers['expires']).toBe('0');
    // ETag by měl být povolen, takže by neměl být explicitně nastaven na false
    expect(response.headers['etag']).toBeDefined();
  });
  
  it('should set no-cache headers for dynamic data', async () => {
    const response = await request(app).get('/dynamic');
    
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store, no-cache, must-revalidate');
    expect(response.headers['pragma']).toBe('no-cache');
    expect(response.headers['expires']).toBe('0');
    // ETag by měl být vypnutý
    expect(response.headers['etag']).toBe('false');
  });
  
  it('should set no-cache headers for POST requests', async () => {
    const response = await request(app).post('/update');
    
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store, no-cache, must-revalidate');
    expect(response.headers['pragma']).toBe('no-cache');
    expect(response.headers['expires']).toBe('0');
    // ETag by měl být vypnutý
    expect(response.headers['etag']).toBe('false');
  });
});
