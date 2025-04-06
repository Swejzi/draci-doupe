/**
 * Routes pro práci s vybavením postav
 */

const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware pro autentizaci
router.use(authenticateToken);

// Získání vybavených předmětů postavy
router.get('/character/:characterId', equipmentController.getEquippedItems);

// Vybavení předmětu
router.post('/equip/:characterId', equipmentController.equipItem);

// Sundání předmětu
router.post('/unequip/:characterId', equipmentController.unequipItem);

// Získání efektivních hodnot atributů postavy
router.get('/attributes/:characterId', equipmentController.getEffectiveAttributes);

// Kontrola, zda postava může používat předmět
router.get('/check/:characterId/:itemId', equipmentController.checkItemUsability);

module.exports = router;
