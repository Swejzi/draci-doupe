const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
// const { authenticateToken } = require('../middleware/authMiddleware'); // Volitelně, pokud chceme chránit

// GET /api/stories - Získání seznamu dostupných příběhů
router.get('/', storyController.getAvailableStories);

// GET /api/stories/:id - Získání detailu konkrétního příběhu
router.get('/:id', storyController.getStoryDetails);

module.exports = router;
