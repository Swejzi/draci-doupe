/**
 * Routes pro práci s dovednostmi
 */

const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { staticCache, shortCache, noCache } = require('../middleware/cacheMiddleware');

// Middleware pro autentizaci
router.use(authenticateToken);

// Získání seznamu všech dovedností - statická data, dlouhá cache
router.get('/', staticCache, skillController.getAllSkillsHandler);

// Získání dovednosti podle ID - statická data, dlouhá cache
router.get('/:skillId', staticCache, skillController.getSkillByIdHandler);

// Získání dovedností podle kategorie - statická data, dlouhá cache
router.get('/category/:category', staticCache, skillController.getSkillsByCategoryHandler);

// Získání výchozích dovedností pro dané povolání - statická data, dlouhá cache
router.get('/class/:characterClass', staticCache, skillController.getDefaultSkillsForClassHandler);

// Získání dovedností postavy - krátká cache, protože se může měnit
router.get('/character/:characterId', shortCache, skillController.getCharacterSkillsHandler);

// Inicializace dovedností pro novou postavu - žádná cache pro POST požadavky
router.post('/initialize/:characterId', noCache, skillController.initializeCharacterSkillsHandler);

// Provedení testu dovednosti - žádná cache pro POST požadavky
router.post('/check/:characterId', noCache, skillController.performSkillCheckHandler);

// Zlepšení dovednosti - žádná cache pro POST požadavky
router.post('/improve/:characterId', noCache, skillController.improveSkillHandler);

module.exports = router;
