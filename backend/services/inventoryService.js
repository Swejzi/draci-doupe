/**
 * Služba pro správu inventáře a předmětů
 */

const db = require('../config/db');
const itemsData = require('../data/items');
const equipmentSystem = require('../utils/equipmentSystem');
const { rollDice } = require('../utils/gameMechanics');

/**
 * Získání inventáře postavy
 * @param {number} characterId - ID postavy
 * @returns {Promise<Array>} - Inventář postavy
 */
async function getCharacterInventory(characterId) {
  try {
    const result = await db.query(
      'SELECT inventory FROM characters WHERE id = $1',
      [characterId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Postava s ID ${characterId} nebyla nalezena.`);
    }

    return result.rows[0].inventory || [];
  } catch (error) {
    console.error('Chyba při získávání inventáře postavy:', error);
    throw error;
  }
}

/**
 * Přidání předmětu do inventáře postavy
 * @param {number} characterId - ID postavy
 * @param {string} itemId - ID předmětu
 * @param {number} [quantity=1] - Množství předmětu
 * @returns {Promise<Object>} - Aktualizovaný inventář
 */
async function addItemToInventory(characterId, itemId, quantity = 1) {
  try {
    // Získání postavy
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1',
      [characterId]
    );

    if (characterResult.rows.length === 0) {
      throw new Error(`Postava s ID ${characterId} nebyla nalezena.`);
    }

    const character = characterResult.rows[0];

    // Získání předmětu
    const item = itemsData.getItemById(itemId);
    if (!item) {
      throw new Error(`Předmět s ID ${itemId} nebyl nalezen.`);
    }

    // Přidání předmětu do inventáře
    const updatedItem = { ...item, quantity };
    const updatedCharacter = equipmentSystem.addItemToInventory(character, updatedItem);

    // Uložení aktualizovaného inventáře do databáze
    await db.query(
      'UPDATE characters SET inventory = $1 WHERE id = $2',
      [JSON.stringify(updatedCharacter.inventory), characterId]
    );

    return updatedCharacter.inventory;
  } catch (error) {
    console.error('Chyba při přidávání předmětu do inventáře:', error);
    throw error;
  }
}

/**
 * Odebrání předmětu z inventáře postavy
 * @param {number} characterId - ID postavy
 * @param {string} itemId - ID předmětu
 * @param {number} [quantity=1] - Množství předmětu k odebrání
 * @returns {Promise<Object>} - Aktualizovaný inventář
 */
async function removeItemFromInventory(characterId, itemId, quantity = 1) {
  try {
    // Získání postavy
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1',
      [characterId]
    );

    if (characterResult.rows.length === 0) {
      throw new Error(`Postava s ID ${characterId} nebyla nalezena.`);
    }

    const character = characterResult.rows[0];

    // Kontrola, zda postava má předmět v inventáři
    if (!character.inventory) {
      throw new Error('Postava nemá žádný inventář.');
    }

    const itemIndex = character.inventory.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error(`Předmět s ID ${itemId} nebyl nalezen v inventáři.`);
    }

    // Aktualizace množství nebo odebrání předmětu
    const item = character.inventory[itemIndex];
    if (item.stackable && item.quantity > quantity) {
      item.quantity -= quantity;
    } else {
      character.inventory.splice(itemIndex, 1);
    }

    // Uložení aktualizovaného inventáře do databáze
    await db.query(
      'UPDATE characters SET inventory = $1 WHERE id = $2',
      [JSON.stringify(character.inventory), characterId]
    );

    return character.inventory;
  } catch (error) {
    console.error('Chyba při odebírání předmětu z inventáře:', error);
    throw error;
  }
}

/**
 * Použití spotřebního předmětu
 * @param {number} characterId - ID postavy
 * @param {string} itemId - ID předmětu
 * @returns {Promise<Object>} - Výsledek použití předmětu
 */
async function useConsumableItem(characterId, itemId) {
  try {
    // Získání postavy
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1',
      [characterId]
    );

    if (characterResult.rows.length === 0) {
      throw new Error(`Postava s ID ${characterId} nebyla nalezena.`);
    }

    const character = characterResult.rows[0];

    // Kontrola, zda postava má předmět v inventáři
    if (!character.inventory) {
      throw new Error('Postava nemá žádný inventář.');
    }

    const itemIndex = character.inventory.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error(`Předmět s ID ${itemId} nebyl nalezen v inventáři.`);
    }

    const item = character.inventory[itemIndex];

    // Kontrola, zda je předmět spotřební
    if (item.type !== 'consumable') {
      throw new Error(`Předmět ${item.name} není spotřební.`);
    }

    // Aplikace efektů předmětu
    const effects = [];
    let healthChange = 0;
    let manaChange = 0;

    if (item.effects) {
      // Léčení
      if (item.effects.healing) {
        const healingAmount = rollDice(item.effects.healing);
        const oldHealth = character.current_health;
        character.current_health = Math.min(character.max_health, character.current_health + healingAmount);
        healthChange = character.current_health - oldHealth;
        
        effects.push({
          type: 'healing',
          amount: healthChange,
          description: `Obnoveno ${healthChange} životů.`
        });
      }

      // Obnovení many
      if (item.effects.mana) {
        const manaAmount = rollDice(item.effects.mana);
        const oldMana = character.current_mana;
        character.current_mana = Math.min(character.max_mana, character.current_mana + manaAmount);
        manaChange = character.current_mana - oldMana;
        
        effects.push({
          type: 'mana',
          amount: manaChange,
          description: `Obnoveno ${manaChange} many.`
        });
      }

      // Kouzlo ze svitku
      if (item.effects.spell) {
        effects.push({
          type: 'spell',
          spell: item.effects.spell,
          description: `Sesláno kouzlo ${item.effects.spell}.`
        });
      }
    }

    // Odebrání předmětu z inventáře
    if (item.stackable && item.quantity > 1) {
      item.quantity--;
    } else {
      character.inventory.splice(itemIndex, 1);
    }

    // Uložení aktualizované postavy do databáze
    await db.query(
      'UPDATE characters SET inventory = $1, current_health = $2, current_mana = $3 WHERE id = $4',
      [JSON.stringify(character.inventory), character.current_health, character.current_mana, characterId]
    );

    return {
      message: `Předmět ${item.name} byl úspěšně použit.`,
      effects,
      character: {
        current_health: character.current_health,
        current_mana: character.current_mana,
        inventory: character.inventory
      }
    };
  } catch (error) {
    console.error('Chyba při použití spotřebního předmětu:', error);
    throw error;
  }
}

/**
 * Generování náhodného pokladu
 * @param {Object} options - Možnosti pro generování pokladu
 * @param {number} [options.level=1] - Úroveň postavy/nepřítele
 * @param {string} [options.rarity='common'] - Vzácnost pokladu (common, uncommon, rare, epic, legendary)
 * @param {number} [options.itemCount=1] - Počet předmětů
 * @returns {Object} - Vygenerovaný poklad
 */
function generateTreasure(options = {}) {
  const level = options.level || 1;
  const rarity = options.rarity || 'common';
  const itemCount = options.itemCount || 1;

  // Určení množství zlata podle úrovně a vzácnosti
  let goldBase = 5 * level;
  let goldMultiplier = 1;

  switch (rarity) {
    case 'uncommon':
      goldMultiplier = 1.5;
      break;
    case 'rare':
      goldMultiplier = 2;
      break;
    case 'epic':
      goldMultiplier = 3;
      break;
    case 'legendary':
      goldMultiplier = 5;
      break;
  }

  const goldAmount = Math.floor(goldBase * goldMultiplier * (0.8 + Math.random() * 0.4));

  // Generování předmětů
  const items = [];
  for (let i = 0; i < itemCount; i++) {
    // Určení typu předmětu
    let itemType;
    const typeRoll = Math.random();
    
    if (typeRoll < 0.4) {
      itemType = 'consumable';
    } else if (typeRoll < 0.7) {
      itemType = 'weapon';
    } else if (typeRoll < 0.9) {
      itemType = 'armor';
    } else {
      itemType = 'accessory';
    }

    // Generování předmětu
    const item = itemsData.generateRandomItem({
      type: itemType,
      level
    });

    // Přidání množství pro spotřební předměty
    if (item.type === 'consumable') {
      item.quantity = Math.floor(Math.random() * 3) + 1;
    }

    items.push(item);
  }

  return {
    gold: goldAmount,
    items
  };
}

/**
 * Přidání pokladu do inventáře postavy
 * @param {number} characterId - ID postavy
 * @param {Object} treasure - Poklad k přidání
 * @returns {Promise<Object>} - Výsledek přidání pokladu
 */
async function addTreasureToInventory(characterId, treasure) {
  try {
    // Získání postavy
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1',
      [characterId]
    );

    if (characterResult.rows.length === 0) {
      throw new Error(`Postava s ID ${characterId} nebyla nalezena.`);
    }

    const character = characterResult.rows[0];

    // Přidání zlata
    const newGold = (character.gold || 0) + treasure.gold;

    // Přidání předmětů do inventáře
    let updatedCharacter = { ...character, gold: newGold };
    
    for (const item of treasure.items) {
      updatedCharacter = equipmentSystem.addItemToInventory(updatedCharacter, item);
    }

    // Uložení aktualizované postavy do databáze
    await db.query(
      'UPDATE characters SET inventory = $1, gold = $2 WHERE id = $3',
      [JSON.stringify(updatedCharacter.inventory), updatedCharacter.gold, characterId]
    );

    return {
      message: 'Poklad byl úspěšně přidán do inventáře.',
      gold: treasure.gold,
      items: treasure.items,
      character: {
        gold: updatedCharacter.gold,
        inventory: updatedCharacter.inventory
      }
    };
  } catch (error) {
    console.error('Chyba při přidávání pokladu do inventáře:', error);
    throw error;
  }
}

module.exports = {
  getCharacterInventory,
  addItemToInventory,
  removeItemFromInventory,
  useConsumableItem,
  generateTreasure,
  addTreasureToInventory
};
