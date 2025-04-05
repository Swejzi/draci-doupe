/**
 * Routes pro práci s reputací
 */

const express = require('express');
const router = express.Router();
const reputationController = require('../controllers/reputationController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware pro autentizaci
router.use(authenticateToken);

// Inicializace reputace pro novou postavu
router.post('/initialize/:characterId', reputationController.initializeCharacterReputationHandler);

// Změna reputace u frakce
router.post('/change/:sessionId', reputationController.changeReputationHandler);

// Získání reputace postavy
router.get('/character/:characterId', reputationController.getCharacterReputationHandler);

// Získání cenového modifikátoru na základě reputace
router.get('/price-modifier/:characterId', reputationController.getPriceModifierHandler);

// Kontrola, zda má postava dostatečnou reputaci pro úkol
router.get('/check-required/:characterId', reputationController.checkRequiredReputationHandler);

// Získání frakcí z příběhu
router.get('/factions/:storyId', reputationController.getFactionsFromStoryHandler);

module.exports = router;
