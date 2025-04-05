const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Všechny routy pro postavy vyžadují autentizaci
router.use(authenticateToken); 

// GET /api/characters - Získání všech postav přihlášeného uživatele
router.get('/', characterController.getCharacters);

// POST /api/characters - Vytvoření nové postavy
router.post('/', characterController.createCharacter);

// GET /api/characters/:id - Získání detailu konkrétní postavy
router.get('/:id', characterController.getCharacterById);

// TODO: Přidat routy pro PUT /api/characters/:id (aktualizace)
// TODO: Přidat routy pro DELETE /api/characters/:id (smazání)

module.exports = router;
