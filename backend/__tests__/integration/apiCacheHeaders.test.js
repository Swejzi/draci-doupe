/**
 * Integrační testy pro ověření cache hlaviček v API endpointech
 */

const request = require('supertest');
const express = require('express');
const inventoryRoutes = require('../../routes/inventoryRoutes');
const storyRoutes = require('../../routes/story');
const skillRoutes = require('../../routes/skillRoutes');
const jwt = require('jsonwebtoken');

// Mock pro db.query
jest.mock('../../config/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] })
}));

// Mock pro inventoryController
jest.mock('../../controllers/inventoryController', () => ({
  getInventory: (req, res) => res.json({ items: [] }),
  addItem: (req, res) => res.json({ message: 'Item added' }),
  removeItem: (req, res) => res.json({ message: 'Item removed' }),
  useItem: (req, res) => res.json({ message: 'Item used' }),
  getAllItems: (req, res) => res.json({ items: [] }),
  getItemById: (req, res) => res.json({ item: {} }),
  getItemsByType: (req, res) => res.json({ items: [] }),
  generateTreasure: (req, res) => res.json({ treasure: [] }),
  addTreasure: (req, res) => res.json({ message: 'Treasure added' })
}));

// Mock pro storyController
jest.mock('../../controllers/storyController', () => ({
  getAvailableStories: (req, res) => res.json({ stories: [] }),
  getStoryDetails: (req, res) => res.json({ story: {} })
}));

// Mock pro skillController
jest.mock('../../controllers/skillController', () => ({
  getAllSkillsHandler: (req, res) => res.json({ skills: [] }),
  getSkillByIdHandler: (req, res) => res.json({ skill: {} }),
  getSkillsByCategoryHandler: (req, res) => res.json({ skills: [] }),
  getDefaultSkillsForClassHandler: (req, res) => res.json({ skills: [] }),
  getCharacterSkillsHandler: (req, res) => res.json({ skills: [] }),
  initializeCharacterSkillsHandler: (req, res) => res.json({ message: 'Skills initialized' }),
  performSkillCheckHandler: (req, res) => res.json({ result: {} }),
  improveSkillHandler: (req, res) => res.json({ message: 'Skill improved' })
}));

// Vytvoření testovací Express aplikace
const app = express();
app.use(express.json());

// Mock pro middleware authenticateToken
jest.mock('../../middleware/authMiddleware', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { userId: 1 };
    next();
  }
}));

// Připojení testovaných routerů
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/skills', skillRoutes);

describe('API Cache Headers Tests', () => {

  describe('Inventory API', () => {
    it('should set short cache headers for character inventory', async () => {
      const response = await request(app).get('/api/inventory/character/1');

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('public, max-age=60');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
    });

    it('should set long cache headers for static item data', async () => {
      const response = await request(app).get('/api/inventory/items');

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('public, max-age=3600');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
    });

    it('should set no-cache headers for POST requests', async () => {
      const response = await request(app)
        .post('/api/inventory/character/1/add')
        .send({ itemId: 'sword' });

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('no-store, no-cache, must-revalidate');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
    });
  });

  describe('Story API', () => {
    it('should set long cache headers for stories list', async () => {
      const response = await request(app).get('/api/stories');

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('public, max-age=3600');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
    });

    it('should set long cache headers for story details', async () => {
      const response = await request(app).get('/api/stories/test-story');

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('public, max-age=3600');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
    });
  });

  describe('Skills API', () => {
    it('should set long cache headers for static skill data', async () => {
      const response = await request(app).get('/api/skills');

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('public, max-age=3600');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
    });

    it('should set short cache headers for character skills', async () => {
      const response = await request(app).get('/api/skills/character/1');

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('public, max-age=60');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
    });

    it('should set no-cache headers for skill improvement', async () => {
      const response = await request(app)
        .post('/api/skills/improve/1')
        .send({ skillId: 'stealth' });

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('no-store, no-cache, must-revalidate');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
    });
  });
});
