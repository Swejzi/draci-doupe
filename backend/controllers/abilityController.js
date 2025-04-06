const db = require('../config/db');
const abilitySystem = require('../utils/abilitySystem');

/**
 * Získání dostupných schopností pro postavu
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const getCharacterAbilities = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.characterId;

  try {
    // Ověření, že postava patří přihlášenému uživateli
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nenalezena nebo nepatří tomuto uživateli.' });
    }

    const character = characterResult.rows[0];

    // Získání schopností pro postavu
    const abilities = abilitySystem.getAvailableAbilities(character.class, character.level);

    // Pokud má postava již uložené schopnosti v databázi, sloučíme je s dostupnými
    let characterAbilities = abilities;
    if (character.abilities) {
      // Sloučení dostupných schopností s těmi, které jsou již uloženy v databázi
      characterAbilities = abilities.map(ability => {
        const existingAbility = character.abilities.find(a => a.id === ability.id);
        if (existingAbility) {
          return {
            ...ability,
            currentUses: existingAbility.currentUses,
            active: existingAbility.active,
            cooldownRemaining: existingAbility.cooldownRemaining
          };
        }
        return {
          ...ability,
          currentUses: ability.usesPerDay,
          active: ability.type === 'passive',
          cooldownRemaining: 0
        };
      });
    }

    res.status(200).json(characterAbilities);
  } catch (error) {
    console.error('Chyba při získávání schopností postavy:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání schopností postavy.' });
  }
};

/**
 * Inicializace schopností pro novou postavu
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const initializeCharacterAbilities = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.characterId;

  try {
    // Ověření, že postava patří přihlášenému uživateli
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nenalezena nebo nepatří tomuto uživateli.' });
    }

    const character = characterResult.rows[0];

    // Inicializace schopností
    const updatedCharacter = abilitySystem.initializeCharacterAbilities(character);

    // Uložení schopností do databáze
    await db.query(
      'UPDATE characters SET abilities = $1 WHERE id = $2',
      [JSON.stringify(updatedCharacter.abilities), characterId]
    );

    res.status(200).json({
      message: 'Schopnosti postavy byly úspěšně inicializovány.',
      abilities: updatedCharacter.abilities
    });
  } catch (error) {
    console.error('Chyba při inicializaci schopností postavy:', error);
    res.status(500).json({ message: 'Interní chyba serveru při inicializaci schopností postavy.' });
  }
};

/**
 * Použití schopnosti
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const useAbility = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.characterId;
  const abilityId = req.params.abilityId;
  const { target } = req.body;

  try {
    // Ověření, že postava patří přihlášenému uživateli
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nenalezena nebo nepatří tomuto uživateli.' });
    }

    const character = characterResult.rows[0];

    // Použití schopnosti
    const result = abilitySystem.useAbility(character, abilityId, target);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // Uložení aktualizovaných schopností a stavu postavy do databáze
    await db.query(
      'UPDATE characters SET abilities = $1, current_health = $2, current_mana = $3 WHERE id = $4',
      [JSON.stringify(character.abilities), character.current_health, character.current_mana, characterId]
    );

    res.status(200).json({
      message: result.message,
      effects: result.effects,
      character: {
        current_health: character.current_health,
        current_mana: character.current_mana,
        abilities: character.abilities
      }
    });
  } catch (error) {
    console.error('Chyba při použití schopnosti:', error);
    res.status(500).json({ message: 'Interní chyba serveru při použití schopnosti.' });
  }
};

/**
 * Obnovení schopností po odpočinku
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const refreshAbilitiesAfterRest = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.characterId;
  const { restType } = req.body;

  // Validace typu odpočinku
  if (restType !== 'short' && restType !== 'long') {
    return res.status(400).json({ message: 'Neplatný typ odpočinku. Povolené hodnoty jsou "short" nebo "long".' });
  }

  try {
    // Ověření, že postava patří přihlášenému uživateli
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nenalezena nebo nepatří tomuto uživateli.' });
    }

    const character = characterResult.rows[0];

    // Obnovení schopností
    const updatedCharacter = abilitySystem.refreshAbilitiesAfterRest(character, restType);

    // Uložení aktualizovaných schopností do databáze
    await db.query(
      'UPDATE characters SET abilities = $1 WHERE id = $2',
      [JSON.stringify(updatedCharacter.abilities), characterId]
    );

    res.status(200).json({
      message: `Schopnosti postavy byly úspěšně obnoveny po ${restType === 'short' ? 'krátkém' : 'dlouhém'} odpočinku.`,
      abilities: updatedCharacter.abilities
    });
  } catch (error) {
    console.error('Chyba při obnovení schopností postavy:', error);
    res.status(500).json({ message: 'Interní chyba serveru při obnovení schopností postavy.' });
  }
};

/**
 * Získání detailu schopnosti
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const getAbilityDetails = async (req, res) => {
  const abilityId = req.params.abilityId;

  try {
    // Získání detailu schopnosti
    const ability = abilitySystem.getAbilityDetails(abilityId);

    if (!ability) {
      return res.status(404).json({ message: `Schopnost s ID ${abilityId} nebyla nalezena.` });
    }

    res.status(200).json(ability);
  } catch (error) {
    console.error('Chyba při získávání detailu schopnosti:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání detailu schopnosti.' });
  }
};

module.exports = {
  getCharacterAbilities,
  initializeCharacterAbilities,
  useAbility,
  refreshAbilitiesAfterRest,
  getAbilityDetails
};
