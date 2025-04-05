/**
 * Controller pro práci s dovednostmi
 */

const { performSkillCheck, initializeCharacterSkills, improveSkill } = require('../utils/gameMechanics');
const { getAllSkills, getSkillById, getSkillsByCategory, getDefaultSkillsForClass } = require('../utils/skillSystem');
const db = require('../config/db');

/**
 * Získání seznamu všech dovedností
 */
const getAllSkillsHandler = async (req, res) => {
  try {
    const skills = getAllSkills();
    res.status(200).json(skills);
  } catch (error) {
    console.error('Chyba při získávání dovedností:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání dovedností.' });
  }
};

/**
 * Získání dovednosti podle ID
 */
const getSkillByIdHandler = async (req, res) => {
  try {
    const { skillId } = req.params;
    const skill = getSkillById(skillId);
    
    if (!skill) {
      return res.status(404).json({ message: `Dovednost s ID ${skillId} nebyla nalezena.` });
    }
    
    res.status(200).json(skill);
  } catch (error) {
    console.error('Chyba při získávání dovednosti:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání dovednosti.' });
  }
};

/**
 * Získání dovedností podle kategorie
 */
const getSkillsByCategoryHandler = async (req, res) => {
  try {
    const { category } = req.params;
    const skills = getSkillsByCategory(category);
    
    res.status(200).json(skills);
  } catch (error) {
    console.error('Chyba při získávání dovedností podle kategorie:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání dovedností podle kategorie.' });
  }
};

/**
 * Získání výchozích dovedností pro dané povolání
 */
const getDefaultSkillsForClassHandler = async (req, res) => {
  try {
    const { characterClass } = req.params;
    const skills = getDefaultSkillsForClass(characterClass);
    
    res.status(200).json(skills);
  } catch (error) {
    console.error('Chyba při získávání výchozích dovedností pro povolání:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání výchozích dovedností pro povolání.' });
  }
};

/**
 * Inicializace dovedností pro novou postavu
 */
const initializeCharacterSkillsHandler = async (req, res) => {
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
    
    // Kontrola, zda postava již nemá inicializované dovednosti
    if (character.skills && Object.keys(character.skills).length > 0) {
      return res.status(400).json({ message: 'Postava již má inicializované dovednosti.' });
    }
    
    // Inicializace dovedností
    const updatedCharacter = initializeCharacterSkills(character);
    
    // Aktualizace postavy v databázi
    await db.query(
      'UPDATE characters SET skills = $1 WHERE id = $2',
      [updatedCharacter.skills, characterId]
    );
    
    res.status(200).json({
      message: 'Dovednosti byly úspěšně inicializovány.',
      skills: updatedCharacter.skills
    });
  } catch (error) {
    console.error('Chyba při inicializaci dovedností:', error);
    res.status(500).json({ message: 'Interní chyba serveru při inicializaci dovedností.' });
  }
};

/**
 * Provedení testu dovednosti
 */
const performSkillCheckHandler = async (req, res) => {
  try {
    const { characterId } = req.params;
    const { skillId, difficulty, options } = req.body;
    const userId = req.user.userId;
    
    if (!skillId || !difficulty) {
      return res.status(400).json({ message: 'Chybí ID dovednosti nebo obtížnost testu.' });
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
    
    // Kontrola, zda má postava inicializované dovednosti
    if (!character.skills || Object.keys(character.skills).length === 0) {
      return res.status(400).json({ message: 'Postava nemá inicializované dovednosti.' });
    }
    
    // Provedení testu dovednosti
    const result = performSkillCheck(character, skillId, difficulty, options);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Chyba při provádění testu dovednosti:', error);
    res.status(500).json({ message: 'Interní chyba serveru při provádění testu dovednosti.' });
  }
};

/**
 * Zlepšení dovednosti
 */
const improveSkillHandler = async (req, res) => {
  try {
    const { characterId } = req.params;
    const { skillId, amount } = req.body;
    const userId = req.user.userId;
    
    if (!skillId) {
      return res.status(400).json({ message: 'Chybí ID dovednosti.' });
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
    
    // Kontrola, zda má postava inicializované dovednosti
    if (!character.skills || Object.keys(character.skills).length === 0) {
      return res.status(400).json({ message: 'Postava nemá inicializované dovednosti.' });
    }
    
    // Zlepšení dovednosti
    const result = improveSkill(character, skillId, amount || 1);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    // Aktualizace postavy v databázi
    await db.query(
      'UPDATE characters SET skills = $1 WHERE id = $2',
      [character.skills, characterId]
    );
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Chyba při zlepšování dovednosti:', error);
    res.status(500).json({ message: 'Interní chyba serveru při zlepšování dovednosti.' });
  }
};

/**
 * Získání dovedností postavy
 */
const getCharacterSkillsHandler = async (req, res) => {
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
    
    // Kontrola, zda má postava inicializované dovednosti
    if (!character.skills || Object.keys(character.skills).length === 0) {
      return res.status(400).json({ message: 'Postava nemá inicializované dovednosti.' });
    }
    
    // Získání všech dovedností
    const allSkills = getAllSkills();
    
    // Vytvoření rozšířeného seznamu dovedností s hodnotami postavy
    const characterSkills = allSkills.map(skill => {
      const characterSkill = character.skills[skill.id] || { value: 0, attribute: skill.attribute };
      return {
        ...skill,
        value: characterSkill.value,
        bonus: character[skill.attribute] ? Math.floor((character[skill.attribute] - 10) / 2) + characterSkill.value : characterSkill.value
      };
    });
    
    res.status(200).json(characterSkills);
  } catch (error) {
    console.error('Chyba při získávání dovedností postavy:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání dovedností postavy.' });
  }
};

module.exports = {
  getAllSkillsHandler,
  getSkillByIdHandler,
  getSkillsByCategoryHandler,
  getDefaultSkillsForClassHandler,
  initializeCharacterSkillsHandler,
  performSkillCheckHandler,
  improveSkillHandler,
  getCharacterSkillsHandler
};
