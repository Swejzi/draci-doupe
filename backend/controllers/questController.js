const questService = require('../services/questService');

/**
 * Získá seznam aktivních úkolů pro dané herní sezení
 */
const getActiveQuests = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { type } = req.query; // Získání parametru typu z query
    const userId = req.user.userId;

    // Ověření, že uživatel má přístup k danému sezení
    const activeQuests = await questService.getActiveQuests(sessionId, type);

    res.status(200).json(activeQuests);
  } catch (error) {
    console.error('Chyba při získávání aktivních úkolů:', error);
    res.status(500).json({ message: error.message || 'Chyba při získávání aktivních úkolů.' });
  }
};

/**
 * Přidá nový úkol do seznamu aktivních úkolů
 */
const addQuest = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questId } = req.body;
    const userId = req.user.userId;

    if (!questId) {
      return res.status(400).json({ message: 'Chybí ID úkolu.' });
    }

    const result = await questService.addQuest(sessionId, questId);

    res.status(200).json(result);
  } catch (error) {
    console.error('Chyba při přidávání úkolu:', error);
    res.status(500).json({ message: error.message || 'Chyba při přidávání úkolu.' });
  }
};

/**
 * Aktualizuje stav splnění cíle úkolu
 */
const updateObjectiveStatus = async (req, res) => {
  try {
    const { sessionId, questId, objectiveId } = req.params;
    const { completed } = req.body;
    const userId = req.user.userId;

    if (completed === undefined) {
      return res.status(400).json({ message: 'Chybí parametr completed.' });
    }

    const result = await questService.updateObjectiveStatus(sessionId, questId, objectiveId, completed);

    res.status(200).json(result);
  } catch (error) {
    console.error('Chyba při aktualizaci stavu cíle:', error);
    res.status(500).json({ message: error.message || 'Chyba při aktualizaci stavu cíle.' });
  }
};

/**
 * Získá detaily úkolu včetně aktuálního postupu
 */
const getQuestDetails = async (req, res) => {
  try {
    const { sessionId, questId } = req.params;
    const userId = req.user.userId;

    const questDetails = await questService.getQuestDetails(sessionId, questId);

    res.status(200).json(questDetails);
  } catch (error) {
    console.error('Chyba při získávání detailů úkolu:', error);
    res.status(500).json({ message: error.message || 'Chyba při získávání detailů úkolu.' });
  }
};

module.exports = {
  getActiveQuests,
  addQuest,
  updateObjectiveStatus,
  getQuestDetails
};
