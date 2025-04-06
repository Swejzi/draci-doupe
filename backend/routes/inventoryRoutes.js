/**
 * Routes pro správu inventáře a předmětů
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware pro autentizaci
router.use(authenticateToken);

// Získání inventáře postavy
router.get('/character/:characterId', inventoryController.getInventory);

// Přidání předmětu do inventáře
router.post('/character/:characterId/add', inventoryController.addItem);

// Odebrání předmětu z inventáře
router.post('/character/:characterId/remove', inventoryController.removeItem);

// Použití spotřebního předmětu
router.post('/character/:characterId/use', inventoryController.useItem);

// Získání seznamu všech předmětů
router.get('/items', inventoryController.getAllItems);

// Získání předmětu podle ID
router.get('/items/:itemId', inventoryController.getItemById);

// Získání předmětů podle typu
router.get('/items/type/:type', inventoryController.getItemsByType);

// Generování náhodného pokladu
router.post('/treasure/generate', inventoryController.generateTreasure);

// Přidání pokladu do inventáře postavy
router.post('/character/:characterId/treasure', inventoryController.addTreasure);

module.exports = router;
