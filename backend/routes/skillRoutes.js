/**
 * Routes pro práci s dovednostmi
 */

const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware pro autentizaci
router.use(authenticateToken);

// Získání seznamu všech dovedností
router.get('/', skillController.getAllSkillsHandler);

// Získání dovednosti podle ID
router.get('/:skillId', skillController.getSkillByIdHandler);

// Získání dovedností podle kategorie
router.get('/category/:category', skillController.getSkillsByCategoryHandler);

// Získání výchozích dovedností pro dané povolání
router.get('/class/:characterClass', skillController.getDefaultSkillsForClassHandler);

// Získání dovedností postavy
router.get('/character/:characterId', skillController.getCharacterSkillsHandler);

// Inicializace dovedností pro novou postavu
router.post('/initialize/:characterId', skillController.initializeCharacterSkillsHandler);

// Provedení testu dovednosti
router.post('/check/:characterId', skillController.performSkillCheckHandler);

// Zlepšení dovednosti
router.post('/improve/:characterId', skillController.improveSkillHandler);

module.exports = router;
