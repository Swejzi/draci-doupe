const storyService = require('../services/storyService');

// Získání seznamu dostupných příběhů
const getAvailableStories = async (req, res) => {
  try {
    const stories = await storyService.listAvailableStories();
    res.status(200).json(stories);
  } catch (error) {
    console.error('Chyba v controlleru při získávání seznamu příběhů:', error);
    res.status(500).json({ message: error.message || 'Interní chyba serveru při získávání seznamu příběhů.' });
  }
};

// Získání detailu jednoho příběhu podle ID
const getStoryDetails = async (req, res) => {
  const storyId = req.params.id; // ID příběhu z URL

  try {
    const storyData = await storyService.loadStoryById(storyId);
    
    if (!storyData) {
      return res.status(404).json({ message: `Příběh s ID '${storyId}' nebyl nalezen.` });
    }
    
    // Můžeme se rozhodnout, zda vrátit celý obsah, nebo jen část (např. bez aiGuidelines)
    // Prozatím vrátíme vše
    res.status(200).json(storyData);

  } catch (error) {
    console.error(`Chyba v controlleru při získávání detailu příběhu ${storyId}:`, error);
    res.status(500).json({ message: error.message || `Interní chyba serveru při získávání detailu příběhu '${storyId}'.` });
  }
};

module.exports = {
  getAvailableStories,
  getStoryDetails,
};
