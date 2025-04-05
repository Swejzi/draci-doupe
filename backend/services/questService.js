const db = require('../config/db');
const storyService = require('./storyService');
const { applyQuestRewards } = require('../utils/gameMechanics');

/**
 * Získá aktivní úkoly pro dané herní sezení
 * @param {number} sessionId - ID herního sezení
 * @returns {Promise<Array>} - Seznam aktivních úkolů
 */
async function getActiveQuests(sessionId) {
  try {
    const result = await db.query(
      'SELECT game_state FROM game_sessions WHERE id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Herní sezení s ID ${sessionId} nebylo nalezeno.`);
    }

    const gameState = result.rows[0].game_state;
    return gameState.activeQuests || [];
  } catch (error) {
    console.error('Chyba při získávání aktivních úkolů:', error);
    throw error;
  }
}

/**
 * Přidá nový úkol do seznamu aktivních úkolů
 * @param {number} sessionId - ID herního sezení
 * @param {string} questId - ID úkolu
 * @returns {Promise<Object>} - Aktualizovaný seznam aktivních úkolů
 */
async function addQuest(sessionId, questId) {
  try {
    // Získání aktuálního stavu hry
    const sessionResult = await db.query(
      'SELECT game_state, story_id FROM game_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error(`Herní sezení s ID ${sessionId} nebylo nalezeno.`);
    }

    const gameState = sessionResult.rows[0].game_state;
    const storyId = sessionResult.rows[0].story_id;

    // Načtení dat příběhu
    const storyData = await storyService.loadStoryById(storyId);
    if (!storyData) {
      throw new Error(`Příběh s ID ${storyId} nebyl nalezen.`);
    }

    // Nalezení definice úkolu
    const questDefinition = storyData.quests.find(q => q.id === questId);
    if (!questDefinition) {
      throw new Error(`Úkol s ID ${questId} nebyl nalezen v příběhu.`);
    }

    // Přidání úkolu do seznamu aktivních úkolů
    if (!gameState.activeQuests) {
      gameState.activeQuests = [];
    }

    // Kontrola, zda úkol již není aktivní
    if (gameState.activeQuests.some(q => q.id === questId)) {
      return { message: `Úkol '${questDefinition.title}' je již aktivní.` };
    }

    // Přidání úkolu
    gameState.activeQuests.push({
      id: questId,
      title: questDefinition.title,
      completedObjectives: {},
      startedAt: new Date().toISOString()
    });

    // Aktualizace stavu hry
    await db.query(
      'UPDATE game_sessions SET game_state = $1 WHERE id = $2',
      [gameState, sessionId]
    );

    return {
      success: true,
      message: `Úkol '${questDefinition.title}' byl přidán do aktivních úkolů.`,
      quest: {
        id: questId,
        title: questDefinition.title,
        description: questDefinition.description,
        objectives: questDefinition.objectives
      }
    };
  } catch (error) {
    console.error('Chyba při přidávání úkolu:', error);
    throw error;
  }
}

/**
 * Aktualizuje stav splnění cíle úkolu
 * @param {number} sessionId - ID herního sezení
 * @param {string} questId - ID úkolu
 * @param {string} objectiveId - ID cíle
 * @param {boolean} completed - Zda je cíl splněn
 * @returns {Promise<Object>} - Výsledek aktualizace
 */
async function updateObjectiveStatus(sessionId, questId, objectiveId, completed) {
  try {
    // Získání aktuálního stavu hry
    const sessionResult = await db.query(
      'SELECT game_state, story_id, character_id FROM game_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error(`Herní sezení s ID ${sessionId} nebylo nalezeno.`);
    }

    const gameState = sessionResult.rows[0].game_state;
    const storyId = sessionResult.rows[0].story_id;
    const characterId = sessionResult.rows[0].character_id;

    // Načtení dat příběhu
    const storyData = await storyService.loadStoryById(storyId);
    if (!storyData) {
      throw new Error(`Příběh s ID ${storyId} nebyl nalezen.`);
    }

    // Nalezení úkolu v aktivních úkolech
    const questIndex = gameState.activeQuests?.findIndex(q => q.id === questId);
    if (questIndex === -1 || questIndex === undefined) {
      throw new Error(`Úkol s ID ${questId} není mezi aktivními úkoly.`);
    }

    // Nalezení definice úkolu
    const questDefinition = storyData.quests.find(q => q.id === questId);
    if (!questDefinition) {
      throw new Error(`Úkol s ID ${questId} nebyl nalezen v příběhu.`);
    }

    // Nalezení definice cíle
    const objectiveDefinition = questDefinition.objectives.find(o => o.id === objectiveId);
    if (!objectiveDefinition) {
      throw new Error(`Cíl s ID ${objectiveId} nebyl nalezen v úkolu.`);
    }

    // Aktualizace stavu cíle
    if (!gameState.activeQuests[questIndex].completedObjectives) {
      gameState.activeQuests[questIndex].completedObjectives = {};
    }

    if (completed) {
      gameState.activeQuests[questIndex].completedObjectives[objectiveId] = true;
    } else {
      delete gameState.activeQuests[questIndex].completedObjectives[objectiveId];
    }

    // Kontrola, zda jsou všechny cíle splněny
    const allObjectives = questDefinition.objectives.map(o => o.id);
    const completedObjectives = Object.keys(gameState.activeQuests[questIndex].completedObjectives);
    const allCompleted = allObjectives.every(objId => completedObjectives.includes(objId));

    let result = {
      success: true,
      message: `Stav cíle '${objectiveDefinition.description}' byl aktualizován.`,
      objectiveCompleted: completed
    };

    // Pokud jsou všechny cíle splněny, dokončíme úkol
    if (allCompleted) {
      // Získání postavy
      const characterResult = await db.query('SELECT * FROM characters WHERE id = $1', [characterId]);
      if (characterResult.rows.length === 0) {
        throw new Error(`Postava s ID ${characterId} nebyla nalezena.`);
      }
      const character = characterResult.rows[0];

      // Aplikace odměn
      if (questDefinition.rewards) {
        await applyQuestRewards(characterId, character, questDefinition.rewards);
        result.questCompleted = true;
        result.rewards = questDefinition.rewards;
        result.message = `Úkol '${questDefinition.title}' byl dokončen! Získáváš odměny.`;
      }

      // Přidání úkolu do dokončených úkolů
      if (!gameState.completedQuests) {
        gameState.completedQuests = [];
      }
      gameState.completedQuests.push({
        id: questId,
        title: questDefinition.title,
        completedAt: new Date().toISOString()
      });

      // Odstranění úkolu z aktivních úkolů
      gameState.activeQuests.splice(questIndex, 1);
    }

    // Aktualizace stavu hry
    await db.query(
      'UPDATE game_sessions SET game_state = $1 WHERE id = $2',
      [gameState, sessionId]
    );

    return result;
  } catch (error) {
    console.error('Chyba při aktualizaci stavu cíle:', error);
    throw error;
  }
}

/**
 * Získá detaily úkolu včetně aktuálního postupu
 * @param {number} sessionId - ID herního sezení
 * @param {string} questId - ID úkolu
 * @returns {Promise<Object>} - Detaily úkolu
 */
async function getQuestDetails(sessionId, questId) {
  try {
    // Získání aktuálního stavu hry
    const sessionResult = await db.query(
      'SELECT game_state, story_id FROM game_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error(`Herní sezení s ID ${sessionId} nebylo nalezeno.`);
    }

    const gameState = sessionResult.rows[0].game_state;
    const storyId = sessionResult.rows[0].story_id;

    // Načtení dat příběhu
    const storyData = await storyService.loadStoryById(storyId);
    if (!storyData) {
      throw new Error(`Příběh s ID ${storyId} nebyl nalezen.`);
    }

    // Nalezení definice úkolu
    const questDefinition = storyData.quests.find(q => q.id === questId);
    if (!questDefinition) {
      throw new Error(`Úkol s ID ${questId} nebyl nalezen v příběhu.`);
    }

    // Nalezení úkolu v aktivních úkolech
    const activeQuest = gameState.activeQuests?.find(q => q.id === questId);
    if (!activeQuest) {
      // Kontrola, zda je úkol mezi dokončenými
      const completedQuest = gameState.completedQuests?.find(q => q.id === questId);
      if (completedQuest) {
        return {
          ...questDefinition,
          status: 'completed',
          completedAt: completedQuest.completedAt
        };
      }
      return {
        ...questDefinition,
        status: 'not_started'
      };
    }

    // Příprava detailů úkolu
    const questDetails = {
      ...questDefinition,
      status: 'in_progress',
      startedAt: activeQuest.startedAt,
      objectives: questDefinition.objectives.map(obj => ({
        ...obj,
        completed: activeQuest.completedObjectives?.[obj.id] || false
      }))
    };

    return questDetails;
  } catch (error) {
    console.error('Chyba při získávání detailů úkolu:', error);
    throw error;
  }
}

module.exports = {
  getActiveQuests,
  addQuest,
  updateObjectiveStatus,
  getQuestDetails
};
