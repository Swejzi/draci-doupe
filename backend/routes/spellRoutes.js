/**
 * Routes pro práci s kouzly
 */

const express = require('express');
const router = express.Router();
const spellController = require('../controllers/spellController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware pro autentizaci
router.use(authenticateToken);

// Získání seznamu dostupných kouzel pro postavu
router.get('/character/:characterId', spellController.getAvailableSpells);

// Seslání kouzla v souboji
router.post('/cast/:sessionId', spellController.castSpell);

// Aktualizace aktivních efektů kouzel
router.post('/effects/:sessionId', spellController.updateSpellEffects);

module.exports = router;
