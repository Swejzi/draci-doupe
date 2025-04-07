import axios from 'axios';
import { API_URL } from '../config';
import { getAuthHeader } from './authService';

const STORIES_URL = `${API_URL}/stories`;

// Funkce pro získání seznamu dostupných příběhů
const getAvailableStories = async () => {
  try {
    // Předpokládáme, že tento endpoint je veřejný
    const response = await axios.get(STORIES_URL, { headers: getAuthHeader() });
    return response.data; // Vrací pole objektů { id, title, description, author }
  } catch (error) {
    console.error('Chyba při načítání seznamu příběhů:', error.response?.data || error.message);
    throw error.response?.data || new Error('Chyba serveru při načítání seznamu příběhů.');
  }
};

// Funkce pro získání detailu příběhu
const getStoryDetails = async (storyId) => {
  try {
    // Předpokládáme, že tento endpoint je veřejný
    const response = await axios.get(`${STORIES_URL}/${storyId}`, { headers: getAuthHeader() });
    return response.data; // Vrací kompletní objekt příběhu
  } catch (error) {
    console.error(`Chyba při načítání detailu příběhu ${storyId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Chyba serveru při načítání detailu příběhu.');
  }
};

// Funkce pro získání dostupných ras a tříd pro příběh
const getStoryCharacterOptions = async (storyId) => {
  try {
    const storyData = await getStoryDetails(storyId);

    // Získání dostupných ras a tříd z initialSetup
    const availableRaces = storyData.initialSetup?.availableRaces || [];
    const availableClasses = storyData.initialSetup?.availableClasses || [];

    return {
      availableRaces,
      availableClasses,
      startingGold: storyData.initialSetup?.startingGold || 50,
      startingItems: storyData.initialSetup?.startingItems || []
    };
  } catch (error) {
    console.error(`Chyba při načítání možností postav pro příběh ${storyId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Chyba serveru při načítání možností postav.');
  }
};

export default {
  getAvailableStories,
  getStoryDetails,
  getStoryCharacterOptions,
};
