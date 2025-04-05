import axios from 'axios';
import { API_URL } from '../config';
import { getAuthHeader } from './authService';

/**
 * Získá seznam aktivních úkolů pro dané herní sezení
 * @param {number} sessionId - ID herního sezení
 * @param {string} [type] - Typ úkolů k získání ('main', 'side' nebo undefined pro všechny)
 * @returns {Promise<Array>} - Seznam aktivních úkolů
 */
const getActiveQuests = async (sessionId, type) => {
  try {
    // Přidání parametru typu do URL, pokud je specifikován
    const url = type
      ? `${API_URL}/quests/session/${sessionId}?type=${type}`
      : `${API_URL}/quests/session/${sessionId}`;

    const response = await axios.get(url, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání aktivních úkolů:', error);
    throw error.response?.data || { message: 'Chyba při získávání aktivních úkolů.' };
  }
};

/**
 * Přidá nový úkol do seznamu aktivních úkolů
 * @param {number} sessionId - ID herního sezení
 * @param {string} questId - ID úkolu
 * @returns {Promise<Object>} - Výsledek přidání úkolu
 */
const addQuest = async (sessionId, questId) => {
  try {
    const response = await axios.post(`${API_URL}/quests/session/${sessionId}`, { questId }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při přidávání úkolu:', error);
    throw error.response?.data || { message: 'Chyba při přidávání úkolu.' };
  }
};

/**
 * Aktualizuje stav splnění cíle úkolu
 * @param {number} sessionId - ID herního sezení
 * @param {string} questId - ID úkolu
 * @param {string} objectiveId - ID cíle
 * @param {boolean} completed - Zda je cíl splněn
 * @returns {Promise<Object>} - Výsledek aktualizace
 */
const updateObjectiveStatus = async (sessionId, questId, objectiveId, completed) => {
  try {
    const response = await axios.patch(`${API_URL}/quests/session/${sessionId}/${questId}/${objectiveId}`, { completed }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při aktualizaci stavu cíle:', error);
    throw error.response?.data || { message: 'Chyba při aktualizaci stavu cíle.' };
  }
};

/**
 * Získá detaily úkolu včetně aktuálního postupu
 * @param {number} sessionId - ID herního sezení
 * @param {string} questId - ID úkolu
 * @returns {Promise<Object>} - Detaily úkolu
 */
const getQuestDetails = async (sessionId, questId) => {
  try {
    // Pokud úkol nemá ID (např. byl přidán bez definice), vrátíme základní informace
    if (!questId) {
      console.warn('Pokus o získání detailů úkolu bez ID');
      return {
        id: null,
        title: 'Neznámý úkol',
        description: 'Tento úkol nemá definici v příběhu.',
        status: 'in_progress',
        objectives: []
      };
    }

    const response = await axios.get(`${API_URL}/quests/session/${sessionId}/${questId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání detailů úkolu:', error);
    throw error.response?.data || { message: 'Chyba při získávání detailů úkolu.' };
  }
};

export default {
  getActiveQuests,
  addQuest,
  updateObjectiveStatus,
  getQuestDetails
};
