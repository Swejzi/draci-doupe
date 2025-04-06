/**
 * Systém vybavení (equipment) pro Dračí doupě
 * 
 * Tento modul poskytuje funkce pro práci s vybavením postav.
 * Vybavení jsou předměty, které postavy mohou nosit a používat, a které ovlivňují jejich statistiky.
 */

// Definice slotů pro vybavení
const EQUIPMENT_SLOTS = {
  WEAPON: 'weapon',       // Zbraň
  OFF_HAND: 'off_hand',   // Druhá ruka (štít, druhá zbraň)
  HEAD: 'head',           // Hlava (helma, čelenka)
  CHEST: 'chest',         // Hruď (zbroj, plášť)
  HANDS: 'hands',         // Ruce (rukavice)
  LEGS: 'legs',           // Nohy (kalhoty, chrániče)
  FEET: 'feet',           // Chodidla (boty)
  NECK: 'neck',           // Krk (amulet, náhrdelník)
  RING_1: 'ring_1',       // Prsten 1
  RING_2: 'ring_2',       // Prsten 2
  BELT: 'belt',           // Opasek
  CLOAK: 'cloak'          // Plášť
};

// Definice typů vybavení
const EQUIPMENT_TYPES = {
  WEAPON: 'weapon',       // Zbraň
  ARMOR: 'armor',         // Zbroj
  SHIELD: 'shield',       // Štít
  ACCESSORY: 'accessory'  // Doplněk (prsteny, amulety)
};

// Definice kategorií zbraní
const WEAPON_CATEGORIES = {
  SWORD: 'sword',         // Meč
  AXE: 'axe',             // Sekera
  MACE: 'mace',           // Palice
  DAGGER: 'dagger',       // Dýka
  STAFF: 'staff',         // Hůl
  BOW: 'bow',             // Luk
  CROSSBOW: 'crossbow',   // Kuše
  WAND: 'wand',           // Hůlka
  POLEARM: 'polearm'      // Tyčová zbraň
};

// Definice kategorií zbroje
const ARMOR_CATEGORIES = {
  LIGHT: 'light',         // Lehká zbroj
  MEDIUM: 'medium',       // Střední zbroj
  HEAVY: 'heavy'          // Těžká zbroj
};

// Mapování slotů na typy vybavení
const SLOT_TYPE_MAPPING = {
  [EQUIPMENT_SLOTS.WEAPON]: [EQUIPMENT_TYPES.WEAPON],
  [EQUIPMENT_SLOTS.OFF_HAND]: [EQUIPMENT_TYPES.WEAPON, EQUIPMENT_TYPES.SHIELD],
  [EQUIPMENT_SLOTS.HEAD]: [EQUIPMENT_TYPES.ARMOR],
  [EQUIPMENT_SLOTS.CHEST]: [EQUIPMENT_TYPES.ARMOR],
  [EQUIPMENT_SLOTS.HANDS]: [EQUIPMENT_TYPES.ARMOR],
  [EQUIPMENT_SLOTS.LEGS]: [EQUIPMENT_TYPES.ARMOR],
  [EQUIPMENT_SLOTS.FEET]: [EQUIPMENT_TYPES.ARMOR],
  [EQUIPMENT_SLOTS.NECK]: [EQUIPMENT_TYPES.ACCESSORY],
  [EQUIPMENT_SLOTS.RING_1]: [EQUIPMENT_TYPES.ACCESSORY],
  [EQUIPMENT_SLOTS.RING_2]: [EQUIPMENT_TYPES.ACCESSORY],
  [EQUIPMENT_SLOTS.BELT]: [EQUIPMENT_TYPES.ACCESSORY],
  [EQUIPMENT_SLOTS.CLOAK]: [EQUIPMENT_TYPES.ARMOR, EQUIPMENT_TYPES.ACCESSORY]
};

// Mapování povolání na povolené typy zbroje
const CLASS_ARMOR_RESTRICTIONS = {
  'Bojovník': [ARMOR_CATEGORIES.LIGHT, ARMOR_CATEGORIES.MEDIUM, ARMOR_CATEGORIES.HEAVY],
  'Hraničář': [ARMOR_CATEGORIES.LIGHT, ARMOR_CATEGORIES.MEDIUM],
  'Zloděj': [ARMOR_CATEGORIES.LIGHT],
  'Kouzelník': [],
  'Alchymista': [ARMOR_CATEGORIES.LIGHT]
};

// Mapování povolání na povolené kategorie zbraní
const CLASS_WEAPON_RESTRICTIONS = {
  'Bojovník': [WEAPON_CATEGORIES.SWORD, WEAPON_CATEGORIES.AXE, WEAPON_CATEGORIES.MACE, WEAPON_CATEGORIES.DAGGER, WEAPON_CATEGORIES.STAFF, WEAPON_CATEGORIES.BOW, WEAPON_CATEGORIES.CROSSBOW, WEAPON_CATEGORIES.POLEARM],
  'Hraničář': [WEAPON_CATEGORIES.SWORD, WEAPON_CATEGORIES.AXE, WEAPON_CATEGORIES.DAGGER, WEAPON_CATEGORIES.BOW, WEAPON_CATEGORIES.CROSSBOW],
  'Zloděj': [WEAPON_CATEGORIES.DAGGER, WEAPON_CATEGORIES.SWORD, WEAPON_CATEGORIES.CROSSBOW],
  'Kouzelník': [WEAPON_CATEGORIES.DAGGER, WEAPON_CATEGORIES.STAFF, WEAPON_CATEGORIES.WAND],
  'Alchymista': [WEAPON_CATEGORIES.DAGGER, WEAPON_CATEGORIES.STAFF, WEAPON_CATEGORIES.WAND]
};

/**
 * Kontrola, zda postava může používat daný předmět
 * @param {Object} character - Postava
 * @param {Object} item - Předmět
 * @returns {Object} - Výsledek kontroly { canUse: boolean, reason: string }
 */
function canUseItem(character, item) {
  if (!character || !item) {
    return { canUse: false, reason: 'Neplatná postava nebo předmět.' };
  }

  // Kontrola úrovně
  if (item.requirements && item.requirements.level && character.level < item.requirements.level) {
    return { 
      canUse: false, 
      reason: `Vyžaduje úroveň ${item.requirements.level}, postava má úroveň ${character.level}.` 
    };
  }

  // Kontrola povolání
  if (item.requirements && item.requirements.class && 
      item.requirements.class.length > 0 && 
      !item.requirements.class.includes(character.class)) {
    return { 
      canUse: false, 
      reason: `Pouze pro povolání: ${item.requirements.class.join(', ')}.` 
    };
  }

  // Kontrola atributů
  if (item.requirements) {
    for (const [attr, value] of Object.entries(item.requirements)) {
      if (['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].includes(attr)) {
        if (character[attr] < value) {
          return { 
            canUse: false, 
            reason: `Vyžaduje ${attr} ${value}, postava má ${character[attr]}.` 
          };
        }
      }
    }
  }

  // Kontrola typu zbroje
  if (item.type === EQUIPMENT_TYPES.ARMOR && item.category) {
    const allowedArmorCategories = CLASS_ARMOR_RESTRICTIONS[character.class] || [];
    if (!allowedArmorCategories.includes(item.category)) {
      return { 
        canUse: false, 
        reason: `Povolání ${character.class} nemůže používat zbroj typu ${item.category}.` 
      };
    }
  }

  // Kontrola kategorie zbraně
  if (item.type === EQUIPMENT_TYPES.WEAPON && item.category) {
    const allowedWeaponCategories = CLASS_WEAPON_RESTRICTIONS[character.class] || [];
    if (!allowedWeaponCategories.includes(item.category)) {
      return { 
        canUse: false, 
        reason: `Povolání ${character.class} nemůže používat zbraň typu ${item.category}.` 
      };
    }
  }

  return { canUse: true };
}

/**
 * Kontrola, zda předmět může být vybaven do daného slotu
 * @param {Object} item - Předmět
 * @param {string} slot - Slot
 * @returns {boolean} - Může být vybaven?
 */
function canEquipToSlot(item, slot) {
  if (!item || !slot) return false;

  // Kontrola, zda předmět má definovaný slot
  if (item.slot) {
    // Pokud má předmět konkrétní slot, musí odpovídat
    return item.slot === slot;
  }

  // Kontrola podle typu předmětu
  const allowedTypesForSlot = SLOT_TYPE_MAPPING[slot] || [];
  return allowedTypesForSlot.includes(item.type);
}

/**
 * Vybavení předmětu do slotu
 * @param {Object} character - Postava
 * @param {string} itemId - ID předmětu
 * @param {string} slot - Slot
 * @returns {Object} - Výsledek vybavení
 */
function equipItem(character, itemId, slot) {
  if (!character || !itemId || !slot) {
    return { 
      success: false, 
      message: 'Neplatná postava, předmět nebo slot.' 
    };
  }

  // Inicializace vybavení, pokud neexistuje
  if (!character.equipment) {
    character.equipment = {};
  }

  // Inicializace inventáře, pokud neexistuje
  if (!character.inventory) {
    character.inventory = [];
  }

  // Nalezení předmětu v inventáři
  const itemIndex = character.inventory.findIndex(item => item.id === itemId);
  if (itemIndex === -1) {
    return { 
      success: false, 
      message: `Předmět s ID ${itemId} nebyl nalezen v inventáři.` 
    };
  }

  const item = character.inventory[itemIndex];

  // Kontrola, zda postava může používat předmět
  const canUseResult = canUseItem(character, item);
  if (!canUseResult.canUse) {
    return { 
      success: false, 
      message: `Nelze vybavit předmět: ${canUseResult.reason}` 
    };
  }

  // Kontrola, zda předmět může být vybaven do daného slotu
  if (!canEquipToSlot(item, slot)) {
    return { 
      success: false, 
      message: `Předmět ${item.name} nelze vybavit do slotu ${slot}.` 
    };
  }

  // Pokud je již něco vybaveno v daném slotu, vrátíme to do inventáře
  if (character.equipment[slot]) {
    const oldItem = character.equipment[slot];
    
    // Odebrat efekty starého předmětu
    removeEquipmentEffects(character, oldItem);
    
    // Vrátit starý předmět do inventáře
    addItemToInventory(character, oldItem);
  }

  // Vybavení nového předmětu
  character.equipment[slot] = { ...item };
  
  // Aplikace efektů nového předmětu
  applyEquipmentEffects(character, item);
  
  // Odebrání předmětu z inventáře
  character.inventory.splice(itemIndex, 1);

  return { 
    success: true, 
    message: `Předmět ${item.name} byl úspěšně vybaven do slotu ${slot}.`,
    character
  };
}

/**
 * Sundání předmětu ze slotu
 * @param {Object} character - Postava
 * @param {string} slot - Slot
 * @returns {Object} - Výsledek sundání
 */
function unequipItem(character, slot) {
  if (!character || !slot) {
    return { 
      success: false, 
      message: 'Neplatná postava nebo slot.' 
    };
  }

  // Kontrola, zda je něco vybaveno v daném slotu
  if (!character.equipment || !character.equipment[slot]) {
    return { 
      success: false, 
      message: `Žádný předmět není vybaven ve slotu ${slot}.` 
    };
  }

  const item = character.equipment[slot];
  
  // Odebrat efekty předmětu
  removeEquipmentEffects(character, item);
  
  // Vrátit předmět do inventáře
  addItemToInventory(character, item);
  
  // Odstranit předmět ze slotu
  delete character.equipment[slot];

  return { 
    success: true, 
    message: `Předmět ${item.name} byl úspěšně sundán ze slotu ${slot}.`,
    character
  };
}

/**
 * Přidání předmětu do inventáře
 * @param {Object} character - Postava
 * @param {Object} item - Předmět
 * @returns {Object} - Aktualizovaná postava
 */
function addItemToInventory(character, item) {
  if (!character || !item) return character;

  // Inicializace inventáře, pokud neexistuje
  if (!character.inventory) {
    character.inventory = [];
  }

  // Kontrola, zda už předmět v inventáři je (pro stackovatelné předměty)
  if (item.stackable) {
    const existingItemIndex = character.inventory.findIndex(i => i.id === item.id);
    if (existingItemIndex !== -1) {
      // Zvýšení množství
      character.inventory[existingItemIndex].quantity = 
        (character.inventory[existingItemIndex].quantity || 1) + (item.quantity || 1);
      return character;
    }
  }

  // Přidání nového předmětu
  character.inventory.push({
    ...item,
    quantity: item.quantity || 1
  });

  return character;
}

/**
 * Aplikace efektů vybavení
 * @param {Object} character - Postava
 * @param {Object} item - Předmět
 * @returns {Object} - Aktualizovaná postava
 */
function applyEquipmentEffects(character, item) {
  if (!character || !item || !item.effects) return character;

  // Aplikace bonusů k atributům
  if (item.effects.attributes) {
    for (const [attr, bonus] of Object.entries(item.effects.attributes)) {
      if (!character.attributeBonuses) {
        character.attributeBonuses = {};
      }
      if (!character.attributeBonuses[attr]) {
        character.attributeBonuses[attr] = 0;
      }
      character.attributeBonuses[attr] += bonus;
    }
  }

  // Aplikace bonusu k AC (Armor Class)
  if (item.effects.ac) {
    if (!character.acBonus) {
      character.acBonus = 0;
    }
    character.acBonus += item.effects.ac;
  }

  // Aplikace bonusu k útoku
  if (item.effects.attackBonus) {
    if (!character.attackBonus) {
      character.attackBonus = 0;
    }
    character.attackBonus += item.effects.attackBonus;
  }

  // Aplikace bonusu k poškození
  if (item.effects.damageBonus) {
    if (!character.damageBonus) {
      character.damageBonus = 0;
    }
    character.damageBonus += item.effects.damageBonus;
  }

  // Aplikace odolností
  if (item.effects.resistances) {
    if (!character.resistances) {
      character.resistances = {};
    }
    for (const [type, value] of Object.entries(item.effects.resistances)) {
      if (!character.resistances[type]) {
        character.resistances[type] = 0;
      }
      character.resistances[type] += value;
    }
  }

  return character;
}

/**
 * Odebrání efektů vybavení
 * @param {Object} character - Postava
 * @param {Object} item - Předmět
 * @returns {Object} - Aktualizovaná postava
 */
function removeEquipmentEffects(character, item) {
  if (!character || !item || !item.effects) return character;

  // Odebrání bonusů k atributům
  if (item.effects.attributes) {
    for (const [attr, bonus] of Object.entries(item.effects.attributes)) {
      if (character.attributeBonuses && character.attributeBonuses[attr]) {
        character.attributeBonuses[attr] -= bonus;
        // Odstranění bonusu, pokud je 0
        if (character.attributeBonuses[attr] === 0) {
          delete character.attributeBonuses[attr];
        }
      }
    }
    // Odstranění objektu attributeBonuses, pokud je prázdný
    if (character.attributeBonuses && Object.keys(character.attributeBonuses).length === 0) {
      delete character.attributeBonuses;
    }
  }

  // Odebrání bonusu k AC
  if (item.effects.ac && character.acBonus) {
    character.acBonus -= item.effects.ac;
    if (character.acBonus === 0) {
      delete character.acBonus;
    }
  }

  // Odebrání bonusu k útoku
  if (item.effects.attackBonus && character.attackBonus) {
    character.attackBonus -= item.effects.attackBonus;
    if (character.attackBonus === 0) {
      delete character.attackBonus;
    }
  }

  // Odebrání bonusu k poškození
  if (item.effects.damageBonus && character.damageBonus) {
    character.damageBonus -= item.effects.damageBonus;
    if (character.damageBonus === 0) {
      delete character.damageBonus;
    }
  }

  // Odebrání odolností
  if (item.effects.resistances && character.resistances) {
    for (const [type, value] of Object.entries(item.effects.resistances)) {
      if (character.resistances[type]) {
        character.resistances[type] -= value;
        if (character.resistances[type] === 0) {
          delete character.resistances[type];
        }
      }
    }
    // Odstranění objektu resistances, pokud je prázdný
    if (Object.keys(character.resistances).length === 0) {
      delete character.resistances;
    }
  }

  return character;
}

/**
 * Výpočet celkové obranné hodnoty (AC) postavy
 * @param {Object} character - Postava
 * @returns {number} - Celková obranná hodnota
 */
function calculateTotalAC(character) {
  if (!character) return 0;

  // Základní AC
  let baseAC = 10;
  
  // Bonus z obratnosti
  const dexBonus = Math.floor((character.dexterity - 10) / 2);
  
  // Bonus ze zbroje a štítu
  let armorBonus = 0;
  let maxDexBonus = Infinity; // Omezení bonusu z obratnosti pro těžké zbroje
  
  if (character.equipment) {
    // Kontrola zbroje
    if (character.equipment[EQUIPMENT_SLOTS.CHEST] && 
        character.equipment[EQUIPMENT_SLOTS.CHEST].type === EQUIPMENT_TYPES.ARMOR) {
      const armor = character.equipment[EQUIPMENT_SLOTS.CHEST];
      armorBonus += armor.effects?.ac || 0;
      
      // Omezení bonusu z obratnosti pro střední a těžké zbroje
      if (armor.category === ARMOR_CATEGORIES.MEDIUM) {
        maxDexBonus = Math.min(maxDexBonus, 2);
      } else if (armor.category === ARMOR_CATEGORIES.HEAVY) {
        maxDexBonus = Math.min(maxDexBonus, 0);
      }
    }
    
    // Kontrola štítu
    if (character.equipment[EQUIPMENT_SLOTS.OFF_HAND] && 
        character.equipment[EQUIPMENT_SLOTS.OFF_HAND].type === EQUIPMENT_TYPES.SHIELD) {
      armorBonus += character.equipment[EQUIPMENT_SLOTS.OFF_HAND].effects?.ac || 0;
    }
  }
  
  // Omezení bonusu z obratnosti
  const limitedDexBonus = Math.min(dexBonus, maxDexBonus);
  
  // Další bonusy k AC
  const otherBonuses = character.acBonus || 0;
  
  // Celkové AC
  return baseAC + limitedDexBonus + armorBonus + otherBonuses;
}

/**
 * Získání všech vybavených předmětů postavy
 * @param {Object} character - Postava
 * @returns {Object} - Vybavené předměty podle slotů
 */
function getEquippedItems(character) {
  if (!character || !character.equipment) {
    return {};
  }
  
  return character.equipment;
}

/**
 * Získání aktuální zbraně postavy
 * @param {Object} character - Postava
 * @returns {Object|null} - Aktuální zbraň nebo null
 */
function getCurrentWeapon(character) {
  if (!character || !character.equipment) {
    return null;
  }
  
  // Kontrola hlavní zbraně
  if (character.equipment[EQUIPMENT_SLOTS.WEAPON] && 
      character.equipment[EQUIPMENT_SLOTS.WEAPON].type === EQUIPMENT_TYPES.WEAPON) {
    return character.equipment[EQUIPMENT_SLOTS.WEAPON];
  }
  
  // Kontrola zbraně v druhé ruce
  if (character.equipment[EQUIPMENT_SLOTS.OFF_HAND] && 
      character.equipment[EQUIPMENT_SLOTS.OFF_HAND].type === EQUIPMENT_TYPES.WEAPON) {
    return character.equipment[EQUIPMENT_SLOTS.OFF_HAND];
  }
  
  return null;
}

/**
 * Výpočet celkových bonusů z vybavení
 * @param {Object} character - Postava
 * @returns {Object} - Celkové bonusy
 */
function calculateEquipmentBonuses(character) {
  if (!character) return {};
  
  const bonuses = {
    attributes: {},
    ac: 0,
    attackBonus: 0,
    damageBonus: 0,
    resistances: {}
  };
  
  // Pokud postava nemá vybavení, vrátíme prázdné bonusy
  if (!character.equipment) {
    return bonuses;
  }
  
  // Procházení všech vybavených předmětů
  for (const item of Object.values(character.equipment)) {
    if (!item || !item.effects) continue;
    
    // Bonusy k atributům
    if (item.effects.attributes) {
      for (const [attr, value] of Object.entries(item.effects.attributes)) {
        if (!bonuses.attributes[attr]) {
          bonuses.attributes[attr] = 0;
        }
        bonuses.attributes[attr] += value;
      }
    }
    
    // Bonus k AC
    if (item.effects.ac) {
      bonuses.ac += item.effects.ac;
    }
    
    // Bonus k útoku
    if (item.effects.attackBonus) {
      bonuses.attackBonus += item.effects.attackBonus;
    }
    
    // Bonus k poškození
    if (item.effects.damageBonus) {
      bonuses.damageBonus += item.effects.damageBonus;
    }
    
    // Odolnosti
    if (item.effects.resistances) {
      for (const [type, value] of Object.entries(item.effects.resistances)) {
        if (!bonuses.resistances[type]) {
          bonuses.resistances[type] = 0;
        }
        bonuses.resistances[type] += value;
      }
    }
  }
  
  return bonuses;
}

/**
 * Získání efektivních hodnot atributů postavy (včetně bonusů z vybavení)
 * @param {Object} character - Postava
 * @returns {Object} - Efektivní hodnoty atributů
 */
function getEffectiveAttributes(character) {
  if (!character) return {};
  
  const attributes = {
    strength: character.strength || 10,
    dexterity: character.dexterity || 10,
    constitution: character.constitution || 10,
    intelligence: character.intelligence || 10,
    wisdom: character.wisdom || 10,
    charisma: character.charisma || 10
  };
  
  // Přidání bonusů z vybavení
  if (character.attributeBonuses) {
    for (const [attr, bonus] of Object.entries(character.attributeBonuses)) {
      if (attributes[attr] !== undefined) {
        attributes[attr] += bonus;
      }
    }
  }
  
  return attributes;
}

module.exports = {
  EQUIPMENT_SLOTS,
  EQUIPMENT_TYPES,
  WEAPON_CATEGORIES,
  ARMOR_CATEGORIES,
  canUseItem,
  canEquipToSlot,
  equipItem,
  unequipItem,
  addItemToInventory,
  calculateTotalAC,
  getEquippedItems,
  getCurrentWeapon,
  calculateEquipmentBonuses,
  getEffectiveAttributes
};
