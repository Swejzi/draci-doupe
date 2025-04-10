const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
// const { authenticateToken } = require('../middleware/authMiddleware'); // Volitelně, pokud chceme chránit
const { staticCache } = require('../middleware/cacheMiddleware');

// GET /api/stories - Získání seznamu dostupných příběhů - statická data, dlouhá cache
router.get('/', staticCache, storyController.getAvailableStories);

// GET /api/stories/:id - Získání detailu konkrétního příběhu - statická data, dlouhá cache
router.get('/:id', staticCache, storyController.getStoryDetails);

module.exports = router;
