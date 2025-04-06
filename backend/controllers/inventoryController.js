/**
 * Controller pro správu inventáře a předmětů
 */

const inventoryService = require('../services/inventoryService');
const itemsData = require('../data/items');

/**
 * Získání inventáře postavy
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const getInventory = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.characterId;

  try {
    // Ověření, že postava patří přihlášenému uživateli
    const inventory = await inventoryService.getCharacterInventory(characterId);
    
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Chyba při získávání inventáře:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání inventáře.' });
  }
};

/**
 * Přidání předmětu do inventáře
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const addItem = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.characterId;
  const { itemId, quantity } = req.body;

  // Validace vstupních dat
  if (!itemId) {
    return res.status(400).json({ message: 'Chybí ID předmětu.' });
  }

  try {
    const inventory = await inventoryService.addItemToInventory(
      characterId,
      itemId,
      quantity || 1
    );
    
    res.status(200).json({
      message: 'Předmět byl úspěšně přidán do inventáře.',
      inventory
    });
  } catch (error) {
    console.error('Chyba při přidávání předmětu do inventáře:', error);
    res.status(500).json({ message: 'Interní chyba serveru při přidávání předmětu do inventáře.' });
  }
};

/**
 * Odebrání předmětu z inventáře
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const removeItem = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.characterId;
  const { itemId, quantity } = req.body;

  // Validace vstupních dat
  if (!itemId) {
    return res.status(400).json({ message: 'Chybí ID předmětu.' });
  }

  try {
    const inventory = await inventoryService.removeItemFromInventory(
      characterId,
      itemId,
      quantity || 1
    );
    
    res.status(200).json({
      message: 'Předmět byl úspěšně odebrán z inventáře.',
      inventory
    });
  } catch (error) {
    console.error('Chyba při odebírání předmětu z inventáře:', error);
    res.status(500).json({ message: 'Interní chyba serveru při odebírání předmětu z inventáře.' });
  }
};

/**
 * Použití spotřebního předmětu
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const useItem = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.characterId;
  const { itemId } = req.body;

  // Validace vstupních dat
  if (!itemId) {
    return res.status(400).json({ message: 'Chybí ID předmětu.' });
  }

  try {
    const result = await inventoryService.useConsumableItem(characterId, itemId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Chyba při použití předmětu:', error);
    res.status(500).json({ message: 'Interní chyba serveru při použití předmětu.' });
  }
};

/**
 * Získání seznamu všech předmětů
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const getAllItems = (req, res) => {
  try {
    const items = itemsData.ALL_ITEMS;
    res.status(200).json(items);
  } catch (error) {
    console.error('Chyba při získávání seznamu předmětů:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání seznamu předmětů.' });
  }
};

/**
 * Získání předmětu podle ID
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const getItemById = (req, res) => {
  const itemId = req.params.itemId;

  try {
    const item = itemsData.getItemById(itemId);
    
    if (!item) {
      return res.status(404).json({ message: `Předmět s ID ${itemId} nebyl nalezen.` });
    }
    
    res.status(200).json(item);
  } catch (error) {
    console.error('Chyba při získávání předmětu:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání předmětu.' });
  }
};

/**
 * Získání předmětů podle typu
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const getItemsByType = (req, res) => {
  const type = req.params.type;

  try {
    const items = itemsData.getItemsByType(type);
    res.status(200).json(items);
  } catch (error) {
    console.error('Chyba při získávání předmětů podle typu:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání předmětů podle typu.' });
  }
};

/**
 * Generování náhodného pokladu
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const generateTreasure = (req, res) => {
  const { level, rarity, itemCount } = req.body;

  try {
    const treasure = inventoryService.generateTreasure({
      level: level || 1,
      rarity: rarity || 'common',
      itemCount: itemCount || 1
    });
    
    res.status(200).json(treasure);
  } catch (error) {
    console.error('Chyba při generování pokladu:', error);
    res.status(500).json({ message: 'Interní chyba serveru při generování pokladu.' });
  }
};

/**
 * Přidání pokladu do inventáře postavy
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const addTreasure = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.characterId;
  const { treasure } = req.body;

  // Validace vstupních dat
  if (!treasure) {
    return res.status(400).json({ message: 'Chybí poklad k přidání.' });
  }

  try {
    const result = await inventoryService.addTreasureToInventory(characterId, treasure);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Chyba při přidávání pokladu do inventáře:', error);
    res.status(500).json({ message: 'Interní chyba serveru při přidávání pokladu do inventáře.' });
  }
};

module.exports = {
  getInventory,
  addItem,
  removeItem,
  useItem,
  getAllItems,
  getItemById,
  getItemsByType,
  generateTreasure,
  addTreasure
};
