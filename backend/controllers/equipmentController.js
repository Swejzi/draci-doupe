const db = require('../config/db');
const equipmentSystem = require('../utils/equipmentSystem');

/**
 * Získání vybavených předmětů postavy
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const getEquippedItems = async (req, res) => {
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

    // Získání vybavených předmětů
    const equippedItems = equipmentSystem.getEquippedItems(character);

    // Výpočet celkové obranné hodnoty (AC)
    const totalAC = equipmentSystem.calculateTotalAC(character);

    // Výpočet celkových bonusů z vybavení
    const equipmentBonuses = equipmentSystem.calculateEquipmentBonuses(character);

    res.status(200).json({
      equippedItems,
      totalAC,
      equipmentBonuses
    });
  } catch (error) {
    console.error('Chyba při získávání vybavených předmětů:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání vybavených předmětů.' });
  }
};

/**
 * Vybavení předmětu
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const equipItem = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.characterId;
  const { itemId, slot } = req.body;

  // Validace vstupních dat
  if (!itemId || !slot) {
    return res.status(400).json({ message: 'Chybí ID předmětu nebo slot.' });
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

    // Vybavení předmětu
    const result = equipmentSystem.equipItem(character, itemId, slot);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // Uložení aktualizované postavy do databáze
    await db.query(
      `UPDATE characters 
       SET equipment = $1, inventory = $2, 
           attributeBonuses = $3, acBonus = $4, 
           attackBonus = $5, damageBonus = $6, 
           resistances = $7
       WHERE id = $8`,
      [
        JSON.stringify(character.equipment || {}),
        JSON.stringify(character.inventory || []),
        JSON.stringify(character.attributeBonuses || {}),
        character.acBonus || 0,
        character.attackBonus || 0,
        character.damageBonus || 0,
        JSON.stringify(character.resistances || {}),
        characterId
      ]
    );

    // Výpočet celkové obranné hodnoty (AC)
    const totalAC = equipmentSystem.calculateTotalAC(character);

    res.status(200).json({
      message: result.message,
      equippedItems: character.equipment,
      inventory: character.inventory,
      totalAC
    });
  } catch (error) {
    console.error('Chyba při vybavování předmětu:', error);
    res.status(500).json({ message: 'Interní chyba serveru při vybavování předmětu.' });
  }
};

/**
 * Sundání předmětu
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const unequipItem = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.characterId;
  const { slot } = req.body;

  // Validace vstupních dat
  if (!slot) {
    return res.status(400).json({ message: 'Chybí slot.' });
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

    // Sundání předmětu
    const result = equipmentSystem.unequipItem(character, slot);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // Uložení aktualizované postavy do databáze
    await db.query(
      `UPDATE characters 
       SET equipment = $1, inventory = $2, 
           attributeBonuses = $3, acBonus = $4, 
           attackBonus = $5, damageBonus = $6, 
           resistances = $7
       WHERE id = $8`,
      [
        JSON.stringify(character.equipment || {}),
        JSON.stringify(character.inventory || []),
        JSON.stringify(character.attributeBonuses || {}),
        character.acBonus || 0,
        character.attackBonus || 0,
        character.damageBonus || 0,
        JSON.stringify(character.resistances || {}),
        characterId
      ]
    );

    // Výpočet celkové obranné hodnoty (AC)
    const totalAC = equipmentSystem.calculateTotalAC(character);

    res.status(200).json({
      message: result.message,
      equippedItems: character.equipment,
      inventory: character.inventory,
      totalAC
    });
  } catch (error) {
    console.error('Chyba při sundávání předmětu:', error);
    res.status(500).json({ message: 'Interní chyba serveru při sundávání předmětu.' });
  }
};

/**
 * Získání efektivních hodnot atributů postavy
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const getEffectiveAttributes = async (req, res) => {
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

    // Získání efektivních hodnot atributů
    const effectiveAttributes = equipmentSystem.getEffectiveAttributes(character);

    res.status(200).json(effectiveAttributes);
  } catch (error) {
    console.error('Chyba při získávání efektivních hodnot atributů:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání efektivních hodnot atributů.' });
  }
};

/**
 * Kontrola, zda postava může používat předmět
 * @param {Object} req - HTTP požadavek
 * @param {Object} res - HTTP odpověď
 */
const checkItemUsability = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.characterId;
  const { itemId } = req.params;

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

    // Nalezení předmětu v inventáři
    if (!character.inventory) {
      return res.status(404).json({ message: 'Postava nemá žádný inventář.' });
    }

    const item = character.inventory.find(item => item.id === itemId);
    if (!item) {
      return res.status(404).json({ message: `Předmět s ID ${itemId} nebyl nalezen v inventáři.` });
    }

    // Kontrola, zda postava může používat předmět
    const result = equipmentSystem.canUseItem(character, item);

    res.status(200).json(result);
  } catch (error) {
    console.error('Chyba při kontrole použitelnosti předmětu:', error);
    res.status(500).json({ message: 'Interní chyba serveru při kontrole použitelnosti předmětu.' });
  }
};

module.exports = {
  getEquippedItems,
  equipItem,
  unequipItem,
  getEffectiveAttributes,
  checkItemUsability
};
