/**
 * Controller pro práci s reputací
 */

const { 
  initializeCharacterReputation, 
  changeReputation, 
  getPriceModifier, 
  hasRequiredReputation, 
  getNpcFaction 
} = require('../utils/gameMechanics');
const storyService = require('../services/storyService');
const db = require('../config/db');

/**
 * Inicializace reputace pro novou postavu
 */
const initializeCharacterReputationHandler = async (req, res) => {
  try {
    const { characterId } = req.params;
    const { storyId } = req.body;
    const userId = req.user.userId;

    if (!storyId) {
      return res.status(400).json({ message: 'Chybí ID příběhu.' });
    }

    // Ověření, že uživatel má přístup k dané postavě
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nebyla nalezena nebo k ní nemáte přístup.' });
    }

    const character = characterResult.rows[0];

    // Kontrola, zda postava již nemá inicializovanou reputaci
    if (character.reputation && Object.keys(character.reputation).length > 0) {
      return res.status(400).json({ message: 'Postava již má inicializovanou reputaci.' });
    }

    // Načtení dat příběhu
    const storyData = await storyService.loadStoryById(storyId);
    if (!storyData) {
      return res.status(404).json({ message: `Příběh s ID ${storyId} nebyl nalezen.` });
    }

    // Inicializace reputace
    const updatedCharacter = initializeCharacterReputation(character, storyData);

    // Aktualizace postavy v databázi
    await db.query(
      'UPDATE characters SET reputation = $1 WHERE id = $2',
      [updatedCharacter.reputation, characterId]
    );

    res.status(200).json({
      message: 'Reputace byla úspěšně inicializována.',
      reputation: updatedCharacter.reputation
    });
  } catch (error) {
    console.error('Chyba při inicializaci reputace:', error);
    res.status(500).json({ message: 'Interní chyba serveru při inicializaci reputace.' });
  }
};

/**
 * Změna reputace u frakce
 */
const changeReputationHandler = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { factionId, amount } = req.body;
    const userId = req.user.userId;

    if (!factionId || amount === undefined) {
      return res.status(400).json({ message: 'Chybí ID frakce nebo množství bodů.' });
    }

    // Získání herního sezení
    const sessionResult = await db.query(
      'SELECT * FROM game_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Herní sezení nebylo nalezeno nebo k němu nemáte přístup.' });
    }

    const session = sessionResult.rows[0];

    // Získání postavy
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1',
      [session.character_id]
    );

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nebyla nalezena.' });
    }

    const character = characterResult.rows[0];

    // Kontrola, zda má postava inicializovanou reputaci
    if (!character.reputation) {
      character.reputation = {};
    }

    // Načtení dat příběhu
    const storyData = await storyService.loadStoryById(session.story_id);
    if (!storyData) {
      return res.status(404).json({ message: `Příběh s ID ${session.story_id} nebyl nalezen.` });
    }

    // Změna reputace
    const result = changeReputation(character, storyData, factionId, amount);

    // Aktualizace postavy v databázi
    await db.query(
      'UPDATE characters SET reputation = $1 WHERE id = $2',
      [character.reputation, character.id]
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Chyba při změně reputace:', error);
    res.status(500).json({ message: 'Interní chyba serveru při změně reputace.' });
  }
};

/**
 * Získání reputace postavy
 */
const getCharacterReputationHandler = async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user.userId;

    // Ověření, že uživatel má přístup k dané postavě
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nebyla nalezena nebo k ní nemáte přístup.' });
    }

    const character = characterResult.rows[0];

    // Kontrola, zda má postava inicializovanou reputaci
    if (!character.reputation || Object.keys(character.reputation).length === 0) {
      return res.status(400).json({ message: 'Postava nemá inicializovanou reputaci.' });
    }

    res.status(200).json(character.reputation);
  } catch (error) {
    console.error('Chyba při získávání reputace postavy:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání reputace postavy.' });
  }
};

/**
 * Získání cenového modifikátoru na základě reputace
 */
const getPriceModifierHandler = async (req, res) => {
  try {
    const { characterId } = req.params;
    const { factionId } = req.query;
    const userId = req.user.userId;

    if (!factionId) {
      return res.status(400).json({ message: 'Chybí ID frakce.' });
    }

    // Ověření, že uživatel má přístup k dané postavě
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nebyla nalezena nebo k ní nemáte přístup.' });
    }

    const character = characterResult.rows[0];

    // Kontrola, zda má postava inicializovanou reputaci
    if (!character.reputation || Object.keys(character.reputation).length === 0) {
      return res.status(400).json({ message: 'Postava nemá inicializovanou reputaci.' });
    }

    // Získání cenového modifikátoru
    const priceModifier = getPriceModifier(character, factionId);

    res.status(200).json({ priceModifier });
  } catch (error) {
    console.error('Chyba při získávání cenového modifikátoru:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání cenového modifikátoru.' });
  }
};

/**
 * Kontrola, zda má postava dostatečnou reputaci pro úkol
 */
const checkRequiredReputationHandler = async (req, res) => {
  try {
    const { characterId } = req.params;
    const { factionId, requiredReputation } = req.query;
    const userId = req.user.userId;

    if (!factionId || requiredReputation === undefined) {
      return res.status(400).json({ message: 'Chybí ID frakce nebo požadovaná hodnota reputace.' });
    }

    // Ověření, že uživatel má přístup k dané postavě
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nebyla nalezena nebo k ní nemáte přístup.' });
    }

    const character = characterResult.rows[0];

    // Kontrola, zda má postava inicializovanou reputaci
    if (!character.reputation || Object.keys(character.reputation).length === 0) {
      return res.status(400).json({ message: 'Postava nemá inicializovanou reputaci.' });
    }

    // Kontrola, zda má postava dostatečnou reputaci
    const hasRequired = hasRequiredReputation(character, factionId, parseInt(requiredReputation, 10));

    res.status(200).json({ hasRequiredReputation: hasRequired });
  } catch (error) {
    console.error('Chyba při kontrole požadované reputace:', error);
    res.status(500).json({ message: 'Interní chyba serveru při kontrole požadované reputace.' });
  }
};

/**
 * Získání frakcí z příběhu
 */
const getFactionsFromStoryHandler = async (req, res) => {
  try {
    const { storyId } = req.params;

    // Načtení dat příběhu
    const storyData = await storyService.loadStoryById(storyId);
    if (!storyData) {
      return res.status(404).json({ message: `Příběh s ID ${storyId} nebyl nalezen.` });
    }

    // Získání frakcí
    const factions = storyData.factions || [];

    res.status(200).json(factions);
  } catch (error) {
    console.error('Chyba při získávání frakcí z příběhu:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání frakcí z příběhu.' });
  }
};

module.exports = {
  initializeCharacterReputationHandler,
  changeReputationHandler,
  getCharacterReputationHandler,
  getPriceModifierHandler,
  checkRequiredReputationHandler,
  getFactionsFromStoryHandler
};
