import axios from 'axios';
import authHeader from './authHeader'; // Funkce pro získání hlavičky s tokenem

const API_URL = 'http://localhost:3001/api/characters';

// Funkce pro získání postav přihlášeného uživatele
const getMyCharacters = async () => {
  try {
    const response = await axios.get(API_URL, { headers: authHeader() });
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

  try {
    const response = await axios.post(API_URL, dataToSend, { headers: authHeader() });
    return response.data; // Vrací { message, character }
  } catch (error) {
    console.error('Chyba při vytváření postavy:', error.response?.data || error.message);
    throw error.response?.data || new Error('Chyba serveru při vytváření postavy.');
  }
};

// Funkce pro získání detailu postavy
const getCharacterDetails = async (characterId) => {
  try {
    const response = await axios.get(`${API_URL}/${characterId}`, { headers: authHeader() });
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
