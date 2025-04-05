const fs = require('fs').promises; // Použijeme asynchronní verzi fs
const path = require('path');

const storiesDirectory = path.join(__dirname, '../../stories'); // Cesta k adresáři stories

// Funkce pro načtení seznamu dostupných příběhů
const listAvailableStories = async () => {
  try {
    const files = await fs.readdir(storiesDirectory);
    const storyFiles = files.filter(file => file.endsWith('.json')); // Zatím podporujeme jen JSON

    const stories = await Promise.all(storyFiles.map(async (file) => {
      try {
        const filePath = path.join(storiesDirectory, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const storyData = JSON.parse(fileContent);
        // Vrátíme jen základní info pro seznam
        return {
          id: path.parse(file).name, // ID odvozené z názvu souboru
          title: storyData.metadata?.title || storyData.title || 'Neznámý název',
          description: storyData.metadata?.description || storyData.description || 'Bez popisu',
          author: storyData.metadata?.author || storyData.author || 'Neznámý autor',
          difficulty: storyData.metadata?.difficulty || 'Neznámá obtížnost'
        };
      } catch (parseError) {
        console.error(`Chyba při parsování souboru ${file}:`, parseError);
        return null; // Ignorovat soubory, které nelze parsovat
      }
    }));

    return stories.filter(story => story !== null); // Odstranit neúspěšně načtené příběhy
  } catch (error) {
    console.error('Chyba při čtení adresáře stories:', error);
    throw new Error('Nepodařilo se načíst seznam příběhů.');
  }
};

// Funkce pro načtení kompletního obsahu jednoho příběhu podle ID (názvu souboru bez přípony)
const loadStoryById = async (storyId) => {
  const filename = `${storyId}.json`;
  const filePath = path.join(storiesDirectory, filename);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const storyData = JSON.parse(fileContent);
    // Můžeme přidat validaci schématu příběhu zde, pokud je potřeba
    return storyData;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Soubor neexistuje
      return null;
    } else if (error instanceof SyntaxError) {
      // Chyba parsování JSON
      console.error(`Chyba parsování JSON v souboru ${filename}:`, error);
      throw new Error(`Příběh '${storyId}' má neplatný formát.`);
    } else {
      // Jiná chyba čtení souboru
      console.error(`Chyba při načítání příběhu ${storyId}:`, error);
      throw new Error(`Nepodařilo se načíst příběh '${storyId}'.`);
    }
  }
};

module.exports = {
  listAvailableStories,
  loadStoryById,
};
