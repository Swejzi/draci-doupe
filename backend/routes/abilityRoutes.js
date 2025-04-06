/**
 * Routes pro práci se schopnostmi postav
 */

const express = require('express');
const router = express.Router();
const abilityController = require('../controllers/abilityController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware pro autentizaci
router.use(authenticateToken);

// Získání dostupných schopností pro postavu
router.get('/character/:characterId', abilityController.getCharacterAbilities);

// Inicializace schopností pro novou postavu
router.post('/initialize/:characterId', abilityController.initializeCharacterAbilities);

// Použití schopnosti
router.post('/use/:characterId/:abilityId', abilityController.useAbility);

// Obnovení schopností po odpočinku
router.post('/refresh/:characterId', abilityController.refreshAbilitiesAfterRest);

// Získání detailu schopnosti
router.get('/:abilityId', abilityController.getAbilityDetails);

module.exports = router;
