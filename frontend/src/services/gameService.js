import axios from 'axios';
import { API_URL } from '../config';
import { getAuthHeader } from './authService';

const GAME_URL = `${API_URL}/game`;

// Funkce pro zahájení nové hry nebo pokračování
const startGame = async (characterId, storyId) => {
  try {
    const response = await axios.post(`${GAME_URL}/start`, { characterId, storyId }, { headers: getAuthHeader() });
    return response.data; // Vrací { message, session }
  } catch (error) {
    console.error('Chyba při zahajování hry:', error.response?.data || error.message);
    throw error.response?.data || new Error('Chyba serveru při zahajování hry.');
  }
};

// Funkce pro získání stavu herního sezení
const getGameSession = async (sessionId) => {
  try {
    const response = await axios.get(`${GAME_URL}/session/${sessionId}`, { headers: getAuthHeader() });
    return response.data; // Vrací objekt session
  } catch (error) {
    console.error(`Chyba při načítání sezení ${sessionId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Chyba serveru při načítání herního sezení.');
  }
};

// Funkce pro odeslání akce hráče
const handlePlayerAction = async (sessionId, action, target = null) => {
  try {
    const payload = target ? { action, target } : { action };
    const response = await axios.post(`${GAME_URL}/session/${sessionId}/action`, payload, { headers: getAuthHeader() });
    return response.data; // Vrací { message, session } s aktualizovaným stavem
  } catch (error) {
    console.error(`Chyba při odesílání akce v sezení ${sessionId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Chyba serveru při zpracování akce.');
  }
};

export default {
  startGame,
  getGameSession,
  handlePlayerAction,
};
