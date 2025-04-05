const express = require('express');
const router = express.Router();
const questController = require('../controllers/questController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware pro ověření přístupu k hernímu sezení
const verifySessionAccess = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    // Ověření, že uživatel má přístup k danému sezení
    const db = require('../config/db');
    const result = await db.query(
      'SELECT id FROM game_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Nemáte přístup k tomuto hernímu sezení.' });
    }

    next();
  } catch (error) {
    console.error('Chyba při ověřování přístupu k hernímu sezení:', error);
    res.status(500).json({ message: 'Chyba při ověřování přístupu k hernímu sezení.' });
  }
};

// Aplikace middleware pro všechny routes
router.use(authenticateToken);

// Získání aktivních úkolů pro dané herní sezení
router.get('/session/:sessionId', verifySessionAccess, questController.getActiveQuests);

// Přidání nového úkolu do seznamu aktivních úkolů
router.post('/session/:sessionId', verifySessionAccess, questController.addQuest);

// Získání detailů úkolu včetně aktuálního postupu
router.get('/session/:sessionId/:questId', verifySessionAccess, questController.getQuestDetails);

// Aktualizace stavu splnění cíle úkolu
router.patch('/session/:sessionId/:questId/:objectiveId', verifySessionAccess, questController.updateObjectiveStatus);

module.exports = router;
