/**
 * Databáze předmětů pro Dračí doupě
 * 
 * Tento soubor obsahuje definice předmětů, které mohou postavy získat a používat.
 */

const { EQUIPMENT_TYPES, WEAPON_CATEGORIES, ARMOR_CATEGORIES } = require('../utils/equipmentSystem');

// Zbraně
const WEAPONS = [
  {
    id: 'dagger',
    name: 'Dýka',
    description: 'Malá bodná zbraň, vhodná pro rychlé útoky.',
    type: EQUIPMENT_TYPES.WEAPON,
    category: WEAPON_CATEGORIES.DAGGER,
    damage: '1d4',
    damageType: 'piercing',
    properties: ['finesse', 'light', 'thrown'],
    weight: 1,
    value: 2,
    effects: {
      damageBonus: 0
    }
  },
  {
    id: 'shortsword',
    name: 'Krátký meč',
    description: 'Jednoruční bodná zbraň, vhodná pro rychlé útoky.',
    type: EQUIPMENT_TYPES.WEAPON,
    category: WEAPON_CATEGORIES.SWORD,
    damage: '1d6',
    damageType: 'piercing',
    properties: ['finesse', 'light'],
    weight: 2,
    value: 10,
    effects: {
      damageBonus: 0
    }
  },
  {
    id: 'longsword',
    name: 'Dlouhý meč',
    description: 'Univerzální jednoruční zbraň s dobrou rovnováhou mezi rychlostí a silou.',
    type: EQUIPMENT_TYPES.WEAPON,
    category: WEAPON_CATEGORIES.SWORD,
    damage: '1d8',
    damageType: 'slashing',
    properties: ['versatile'],
    weight: 3,
    value: 15,
    effects: {
      damageBonus: 0
    },
    requirements: {
      strength: 10
    }
  },
  {
    id: 'greatsword',
    name: 'Obouruční meč',
    description: 'Mohutná obouruční zbraň, která způsobuje velké poškození.',
    type: EQUIPMENT_TYPES.WEAPON,
    category: WEAPON_CATEGORIES.SWORD,
    damage: '2d6',
    damageType: 'slashing',
    properties: ['heavy', 'two-handed'],
    weight: 6,
    value: 50,
    effects: {
      damageBonus: 0
    },
    requirements: {
      strength: 14
    }
  },
  {
    id: 'battleaxe',
    name: 'Bojová sekera',
    description: 'Těžká sekera, která způsobuje velké poškození.',
    type: EQUIPMENT_TYPES.WEAPON,
    category: WEAPON_CATEGORIES.AXE,
    damage: '1d8',
    damageType: 'slashing',
    properties: ['versatile'],
    weight: 4,
    value: 10,
    effects: {
      damageBonus: 0
    },
    requirements: {
      strength: 12
    }
  },
  {
    id: 'warhammer',
    name: 'Válečné kladivo',
    description: 'Těžké kladivo, které způsobuje drtivé poškození.',
    type: EQUIPMENT_TYPES.WEAPON,
    category: WEAPON_CATEGORIES.MACE,
    damage: '1d8',
    damageType: 'bludgeoning',
    properties: ['versatile'],
    weight: 2,
    value: 15,
    effects: {
      damageBonus: 0
    },
    requirements: {
      strength: 12
    }
  },
  {
    id: 'staff',
    name: 'Hůl',
    description: 'Dlouhá dřevěná hůl, často používaná kouzelníky jako fokus pro kouzla.',
    type: EQUIPMENT_TYPES.WEAPON,
    category: WEAPON_CATEGORIES.STAFF,
    damage: '1d6',
    damageType: 'bludgeoning',
    properties: ['versatile'],
    weight: 4,
    value: 2,
    effects: {
      damageBonus: 0
    }
  },
  {
    id: 'longbow',
    name: 'Dlouhý luk',
    description: 'Velký luk, který umožňuje střelbu na velké vzdálenosti.',
    type: EQUIPMENT_TYPES.WEAPON,
    category: WEAPON_CATEGORIES.BOW,
    damage: '1d8',
    damageType: 'piercing',
    properties: ['ammunition', 'heavy', 'two-handed'],
    range: [150, 600],
    weight: 2,
    value: 50,
    effects: {
      damageBonus: 0
    },
    requirements: {
      dexterity: 12
    }
  },
  {
    id: 'crossbow_light',
    name: 'Lehká kuše',
    description: 'Malá kuše, která se snadno nabíjí a je vhodná pro rychlou střelbu.',
    type: EQUIPMENT_TYPES.WEAPON,
    category: WEAPON_CATEGORIES.CROSSBOW,
    damage: '1d8',
    damageType: 'piercing',
    properties: ['ammunition', 'loading', 'two-handed'],
    range: [80, 320],
    weight: 5,
    value: 25,
    effects: {
      damageBonus: 0
    }
  },
  {
    id: 'wand_fire',
    name: 'Hůlka ohně',
    description: 'Magická hůlka, která umožňuje sesílat ohnivá kouzla.',
    type: EQUIPMENT_TYPES.WEAPON,
    category: WEAPON_CATEGORIES.WAND,
    damage: '1d4',
    damageType: 'fire',
    properties: ['magical'],
    weight: 1,
    value: 100,
    effects: {
      damageBonus: 1,
      spellBonus: {
        fire: 1
      }
    },
    requirements: {
      class: ['Kouzelník', 'Alchymista'],
      intelligence: 12
    }
  }
];

// Zbroje
const ARMORS = [
  {
    id: 'padded_armor',
    name: 'Vycpávaná zbroj',
    description: 'Lehká zbroj vyrobená z vrstev látky a vycpávek.',
    type: EQUIPMENT_TYPES.ARMOR,
    category: ARMOR_CATEGORIES.LIGHT,
    weight: 8,
    value: 5,
    effects: {
      ac: 1
    }
  },
  {
    id: 'leather_armor',
    name: 'Kožená zbroj',
    description: 'Zbroj vyrobená z tvrzené kůže.',
    type: EQUIPMENT_TYPES.ARMOR,
    category: ARMOR_CATEGORIES.LIGHT,
    weight: 10,
    value: 10,
    effects: {
      ac: 2
    }
  },
  {
    id: 'studded_leather',
    name: 'Pobíjená kožená zbroj',
    description: 'Kožená zbroj posílená kovovými cvočky.',
    type: EQUIPMENT_TYPES.ARMOR,
    category: ARMOR_CATEGORIES.LIGHT,
    weight: 13,
    value: 45,
    effects: {
      ac: 3
    }
  },
  {
    id: 'hide_armor',
    name: 'Zbroj z kůže zvířat',
    description: 'Zbroj vyrobená z kůže tlustokožců nebo jiných odolných zvířat.',
    type: EQUIPMENT_TYPES.ARMOR,
    category: ARMOR_CATEGORIES.MEDIUM,
    weight: 12,
    value: 10,
    effects: {
      ac: 3
    }
  },
  {
    id: 'chain_shirt',
    name: 'Kroužková košile',
    description: 'Lehká kroužková zbroj, která chrání trup.',
    type: EQUIPMENT_TYPES.ARMOR,
    category: ARMOR_CATEGORIES.MEDIUM,
    weight: 20,
    value: 50,
    effects: {
      ac: 4
    },
    requirements: {
      strength: 10
    }
  },
  {
    id: 'scale_mail',
    name: 'Šupinová zbroj',
    description: 'Zbroj vyrobená z překrývajících se kovových šupin.',
    type: EQUIPMENT_TYPES.ARMOR,
    category: ARMOR_CATEGORIES.MEDIUM,
    weight: 45,
    value: 50,
    effects: {
      ac: 5
    },
    requirements: {
      strength: 12
    }
  },
  {
    id: 'breastplate',
    name: 'Kyrys',
    description: 'Kovová plátová zbroj, která chrání trup.',
    type: EQUIPMENT_TYPES.ARMOR,
    category: ARMOR_CATEGORIES.MEDIUM,
    weight: 20,
    value: 400,
    effects: {
      ac: 5
    },
    requirements: {
      strength: 10
    }
  },
  {
    id: 'half_plate',
    name: 'Poloplátová zbroj',
    description: 'Plátová zbroj, která chrání trup a část končetin.',
    type: EQUIPMENT_TYPES.ARMOR,
    category: ARMOR_CATEGORIES.MEDIUM,
    weight: 40,
    value: 750,
    effects: {
      ac: 6
    },
    requirements: {
      strength: 12
    }
  },
  {
    id: 'ring_mail',
    name: 'Kroužková zbroj',
    description: 'Kožená zbroj s našitými kovovými kroužky.',
    type: EQUIPMENT_TYPES.ARMOR,
    category: ARMOR_CATEGORIES.HEAVY,
    weight: 40,
    value: 30,
    effects: {
      ac: 5
    },
    requirements: {
      strength: 12
    }
  },
  {
    id: 'chain_mail',
    name: 'Kroužkové brnění',
    description: 'Zbroj vyrobená z propojených kovových kroužků.',
    type: EQUIPMENT_TYPES.ARMOR,
    category: ARMOR_CATEGORIES.HEAVY,
    weight: 55,
    value: 75,
    effects: {
      ac: 6
    },
    requirements: {
      strength: 13
    }
  },
  {
    id: 'splint_armor',
    name: 'Lamelová zbroj',
    description: 'Zbroj vyrobená z vertikálních kovových plátů.',
    type: EQUIPMENT_TYPES.ARMOR,
    category: ARMOR_CATEGORIES.HEAVY,
    weight: 60,
    value: 200,
    effects: {
      ac: 7
    },
    requirements: {
      strength: 15
    }
  },
  {
    id: 'plate_armor',
    name: 'Plátová zbroj',
    description: 'Kompletní plátová zbroj, která poskytuje nejlepší ochranu.',
    type: EQUIPMENT_TYPES.ARMOR,
    category: ARMOR_CATEGORIES.HEAVY,
    weight: 65,
    value: 1500,
    effects: {
      ac: 8
    },
    requirements: {
      strength: 15
    }
  }
];

// Štíty
const SHIELDS = [
  {
    id: 'shield',
    name: 'Štít',
    description: 'Dřevěný nebo kovový štít, který poskytuje dodatečnou ochranu.',
    type: EQUIPMENT_TYPES.SHIELD,
    weight: 6,
    value: 10,
    effects: {
      ac: 2
    }
  },
  {
    id: 'tower_shield',
    name: 'Věžový štít',
    description: 'Velký štít, který poskytuje výbornou ochranu, ale omezuje pohyblivost.',
    type: EQUIPMENT_TYPES.SHIELD,
    weight: 15,
    value: 30,
    effects: {
      ac: 3,
      attributes: {
        dexterity: -1
      }
    },
    requirements: {
      strength: 13
    }
  }
];

// Doplňky
const ACCESSORIES = [
  {
    id: 'ring_protection',
    name: 'Prsten ochrany',
    description: 'Magický prsten, který poskytuje dodatečnou ochranu.',
    type: EQUIPMENT_TYPES.ACCESSORY,
    slot: 'ring_1',
    weight: 0.1,
    value: 500,
    effects: {
      ac: 1
    }
  },
  {
    id: 'amulet_health',
    name: 'Amulet zdraví',
    description: 'Magický amulet, který zvyšuje odolnost nositele.',
    type: EQUIPMENT_TYPES.ACCESSORY,
    slot: 'neck',
    weight: 0.2,
    value: 750,
    effects: {
      attributes: {
        constitution: 2
      }
    }
  },
  {
    id: 'cloak_protection',
    name: 'Plášť ochrany',
    description: 'Magický plášť, který poskytuje dodatečnou ochranu.',
    type: EQUIPMENT_TYPES.ACCESSORY,
    slot: 'cloak',
    weight: 1,
    value: 1000,
    effects: {
      ac: 1,
      resistances: {
        fire: 10,
        cold: 10
      }
    }
  },
  {
    id: 'belt_giant_strength',
    name: 'Opasek obří síly',
    description: 'Magický opasek, který zvyšuje sílu nositele.',
    type: EQUIPMENT_TYPES.ACCESSORY,
    slot: 'belt',
    weight: 0.5,
    value: 2000,
    effects: {
      attributes: {
        strength: 4
      }
    }
  },
  {
    id: 'gloves_dexterity',
    name: 'Rukavice obratnosti',
    description: 'Magické rukavice, které zvyšují obratnost nositele.',
    type: EQUIPMENT_TYPES.ACCESSORY,
    slot: 'hands',
    weight: 0.2,
    value: 1500,
    effects: {
      attributes: {
        dexterity: 2
      }
    }
  },
  {
    id: 'boots_elvenkind',
    name: 'Boty elfího lidu',
    description: 'Magické boty, které umožňují tichý pohyb.',
    type: EQUIPMENT_TYPES.ACCESSORY,
    slot: 'feet',
    weight: 0.5,
    value: 1000,
    effects: {
      skillBonus: {
        stealth: 5
      }
    }
  },
  {
    id: 'circlet_intellect',
    name: 'Čelenka intelektu',
    description: 'Magická čelenka, která zvyšuje inteligenci nositele.',
    type: EQUIPMENT_TYPES.ACCESSORY,
    slot: 'head',
    weight: 0.2,
    value: 2000,
    effects: {
      attributes: {
        intelligence: 2
      }
    }
  }
];

// Spotřební předměty
const CONSUMABLES = [
  {
    id: 'potion_healing',
    name: 'Lektvar léčení',
    description: 'Lektvar, který obnoví 2d4+2 životů.',
    type: 'consumable',
    subtype: 'potion',
    weight: 0.5,
    value: 50,
    stackable: true,
    effects: {
      healing: '2d4+2'
    }
  },
  {
    id: 'potion_greater_healing',
    name: 'Lektvar většího léčení',
    description: 'Lektvar, který obnoví 4d4+4 životů.',
    type: 'consumable',
    subtype: 'potion',
    weight: 0.5,
    value: 100,
    stackable: true,
    effects: {
      healing: '4d4+4'
    }
  },
  {
    id: 'potion_mana',
    name: 'Lektvar many',
    description: 'Lektvar, který obnoví 2d4+2 many.',
    type: 'consumable',
    subtype: 'potion',
    weight: 0.5,
    value: 75,
    stackable: true,
    effects: {
      mana: '2d4+2'
    }
  },
  {
    id: 'scroll_fireball',
    name: 'Svitek ohnivé koule',
    description: 'Svitek, který umožňuje seslat kouzlo Ohnivá koule.',
    type: 'consumable',
    subtype: 'scroll',
    weight: 0.1,
    value: 150,
    stackable: true,
    effects: {
      spell: 'fireball'
    },
    requirements: {
      intelligence: 13
    }
  }
];

// Všechny předměty
const ALL_ITEMS = [
  ...WEAPONS,
  ...ARMORS,
  ...SHIELDS,
  ...ACCESSORIES,
  ...CONSUMABLES
];

/**
 * Získání předmětu podle ID
 * @param {string} itemId - ID předmětu
 * @returns {Object|null} - Předmět nebo null, pokud nebyl nalezen
 */
function getItemById(itemId) {
  return ALL_ITEMS.find(item => item.id === itemId) || null;
}

/**
 * Získání předmětů podle typu
 * @param {string} type - Typ předmětu
 * @returns {Array} - Seznam předmětů daného typu
 */
function getItemsByType(type) {
  return ALL_ITEMS.filter(item => item.type === type);
}

/**
 * Získání zbraní podle kategorie
 * @param {string} category - Kategorie zbraně
 * @returns {Array} - Seznam zbraní dané kategorie
 */
function getWeaponsByCategory(category) {
  return WEAPONS.filter(weapon => weapon.category === category);
}

/**
 * Získání zbrojí podle kategorie
 * @param {string} category - Kategorie zbroje
 * @returns {Array} - Seznam zbrojí dané kategorie
 */
function getArmorsByCategory(category) {
  return ARMORS.filter(armor => armor.category === category);
}

/**
 * Získání předmětů podle úrovně
 * @param {number} level - Úroveň postavy
 * @returns {Array} - Seznam předmětů vhodných pro danou úroveň
 */
function getItemsByLevel(level) {
  return ALL_ITEMS.filter(item => {
    // Předměty bez požadavku na úroveň jsou vhodné pro všechny úrovně
    if (!item.requirements || !item.requirements.level) {
      return true;
    }
    return item.requirements.level <= level;
  });
}

/**
 * Získání předmětů vhodných pro dané povolání
 * @param {string} characterClass - Povolání postavy
 * @returns {Array} - Seznam předmětů vhodných pro dané povolání
 */
function getItemsForClass(characterClass) {
  return ALL_ITEMS.filter(item => {
    // Předměty bez požadavku na povolání jsou vhodné pro všechna povolání
    if (!item.requirements || !item.requirements.class) {
      return true;
    }
    return item.requirements.class.includes(characterClass);
  });
}

/**
 * Vytvoření náhodného předmětu
 * @param {Object} options - Možnosti pro generování předmětu
 * @param {string} [options.type] - Typ předmětu
 * @param {string} [options.category] - Kategorie předmětu
 * @param {number} [options.level] - Úroveň postavy
 * @param {string} [options.characterClass] - Povolání postavy
 * @returns {Object} - Náhodný předmět
 */
function generateRandomItem(options = {}) {
  let items = [...ALL_ITEMS];

  // Filtrování podle typu
  if (options.type) {
    items = items.filter(item => item.type === options.type);
  }

  // Filtrování podle kategorie
  if (options.category) {
    items = items.filter(item => item.category === options.category);
  }

  // Filtrování podle úrovně
  if (options.level) {
    items = items.filter(item => {
      if (!item.requirements || !item.requirements.level) {
        return true;
      }
      return item.requirements.level <= options.level;
    });
  }

  // Filtrování podle povolání
  if (options.characterClass) {
    items = items.filter(item => {
      if (!item.requirements || !item.requirements.class) {
        return true;
      }
      return item.requirements.class.includes(options.characterClass);
    });
  }

  // Pokud není nalezen žádný předmět, vrátíme základní dýku
  if (items.length === 0) {
    return getItemById('dagger');
  }

  // Vrácení náhodného předmětu
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}

module.exports = {
  WEAPONS,
  ARMORS,
  SHIELDS,
  ACCESSORIES,
  CONSUMABLES,
  ALL_ITEMS,
  getItemById,
  getItemsByType,
  getWeaponsByCategory,
  getArmorsByCategory,
  getItemsByLevel,
  getItemsForClass,
  generateRandomItem
};
