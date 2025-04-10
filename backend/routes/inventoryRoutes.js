/**
 * Routes pro správu inventáře a předmětů
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { staticCache, shortCache, noCache } = require('../middleware/cacheMiddleware');

// Middleware pro autentizaci
router.use(authenticateToken);

// Získání inventáře postavy - krátká cache, protože se může měnit
router.get('/character/:characterId', shortCache, inventoryController.getInventory);

// Přidání předmětu do inventáře - žádná cache pro POST požadavky
router.post('/character/:characterId/add', noCache, inventoryController.addItem);

// Odebrání předmětu z inventáře - žádná cache pro POST požadavky
router.post('/character/:characterId/remove', noCache, inventoryController.removeItem);

// Použití spotřebního předmětu - žádná cache pro POST požadavky
router.post('/character/:characterId/use', noCache, inventoryController.useItem);

// Získání seznamu všech předmětů - statická data, dlouhá cache
router.get('/items', staticCache, inventoryController.getAllItems);

// Získání předmětu podle ID - statická data, dlouhá cache
router.get('/items/:itemId', staticCache, inventoryController.getItemById);

// Získání předmětů podle typu - statická data, dlouhá cache
router.get('/items/type/:type', staticCache, inventoryController.getItemsByType);

// Generování náhodného pokladu - žádná cache pro POST požadavky
router.post('/treasure/generate', noCache, inventoryController.generateTreasure);

// Přidání pokladu do inventáře postavy - žádná cache pro POST požadavky
router.post('/character/:characterId/treasure', noCache, inventoryController.addTreasure);

module.exports = router;
