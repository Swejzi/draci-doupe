const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Načtení controlleru
const { authenticateToken } = require('../middleware/authMiddleware'); // Načtení middleware

// POST /api/auth/register - Registrace nového uživatele (nevyžaduje autentizaci)
router.post('/register', authController.register); 

// POST /api/auth/login - Přihlášení uživatele (nevyžaduje autentizaci)
router.post('/login', authController.login); 

// GET /api/auth/status - Získání stavu přihlášení (vyžaduje platný token)
router.get('/status', authenticateToken, authController.status); 

// POST /api/auth/logout - Odhlášení uživatele (vyžaduje platný token)
router.post('/logout', authenticateToken, authController.logout); 


module.exports = router;
