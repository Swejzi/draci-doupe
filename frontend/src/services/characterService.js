import axios from 'axios';
import { API_URL } from '../config';
import { getAuthHeader } from './authService';

const CHARACTERS_URL = `${API_URL}/characters`;

// Funkce pro získání postav přihlášeného uživatele
const getMyCharacters = async () => {
  try {
    const response = await axios.get(CHARACTERS_URL, { headers: getAuthHeader() });
    return response.data; // Vrací pole postav
  } catch (error) {
    console.error('Chyba při načítání postav:', error.response?.data || error.message);
    throw error.response?.data || new Error('Chyba serveru při načítání postav.');
  }
};

// Funkce pro vytvoření nové postavy
const createCharacter = async (characterData) => {
  // Přejmenování characterClass na class pro backend
  const dataToSend = { ...characterData, class: characterData.characterClass };
  delete dataToSend.characterClass;

  // Kontrola, zda je zadáno storyId
  if (!dataToSend.storyId) {
    throw new Error('Chybí ID příběhu pro vytvoření postavy.');
  }

  try {
    const response = await axios.post(CHARACTERS_URL, dataToSend, { headers: getAuthHeader() });
    return response.data; // Vrací { message, character }
  } catch (error) {
    console.error('Chyba při vytváření postavy:', error.response?.data || error.message);
    throw error.response?.data || new Error('Chyba serveru při vytváření postavy.');
  }
};

// Funkce pro získání detailu postavy
const getCharacterDetails = async (characterId) => {
  try {
    const response = await axios.get(`${CHARACTERS_URL}/${characterId}`, { headers: getAuthHeader() });
    return response.data; // Vrací objekt postavy
  } catch (error) {
    console.error(`Chyba při načítání detailu postavy ${characterId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Chyba serveru při načítání detailu postavy.');
  }
};


// TODO: Přidat funkce pro update a delete

export default {
  getMyCharacters,
  createCharacter,
  getCharacterDetails,
};
