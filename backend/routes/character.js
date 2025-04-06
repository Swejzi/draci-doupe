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

// PUT /api/characters/:id - Aktualizace existující postavy
router.put('/:id', characterController.updateCharacter);

// DELETE /api/characters/:id - Smazání postavy
router.delete('/:id', characterController.deleteCharacter);

module.exports = router;
