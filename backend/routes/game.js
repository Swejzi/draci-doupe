const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Všechny herní routy vyžadují autentizaci
router.use(authenticateToken); 

// POST /api/game/start - Zahájení nové hry nebo pokračování
router.post('/start', gameController.startGame);

// GET /api/game/session/:sessionId - Získání stavu konkrétního sezení
router.get('/session/:sessionId', gameController.getGameSession);

// POST /api/game/session/:sessionId/action - Odeslání akce hráče
router.post('/session/:sessionId/action', gameController.handlePlayerAction);

// TODO: Přidat případné další routy (např. pro získání seznamu aktivních sezení uživatele)

module.exports = router;
