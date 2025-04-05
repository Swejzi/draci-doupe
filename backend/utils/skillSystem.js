/**
 * Systém dovedností pro Dračí doupě
 * 
 * Tento modul obsahuje funkce pro práci s dovednostmi, jejich testy a efekty.
 */

const { rollDice, getAttributeBonus } = require('./gameMechanics');

/**
 * Kategorie dovedností
 */
const SKILL_CATEGORIES = {
  PHYSICAL: 'physical',       // Fyzické dovednosti
  SOCIAL: 'social',           // Sociální dovednosti
  MENTAL: 'mental',           // Mentální dovednosti
  STEALTH: 'stealth',         // Dovednosti plížení a skrývání
  PERCEPTION: 'perception',   // Dovednosti vnímání
  CRAFTING: 'crafting',       // Řemeslné dovednosti
  KNOWLEDGE: 'knowledge',     // Znalostní dovednosti
  SURVIVAL: 'survival',       // Dovednosti přežití
  MAGICAL: 'magical'          // Magické dovednosti
};

/**
 * Obtížnosti testů dovedností
 */
const DIFFICULTY_LEVELS = {
  VERY_EASY: { name: 'very_easy', dc: 5, description: 'Velmi snadný úkol, který zvládne téměř každý.' },
  EASY: { name: 'easy', dc: 10, description: 'Snadný úkol, který zvládne většina lidí.' },
  MEDIUM: { name: 'medium', dc: 15, description: 'Středně obtížný úkol, který vyžaduje určitou zkušenost.' },
  HARD: { name: 'hard', dc: 20, description: 'Obtížný úkol, který zvládnou jen zkušení jedinci.' },
  VERY_HARD: { name: 'very_hard', dc: 25, description: 'Velmi obtížný úkol, který zvládnou jen mistři.' },
  NEARLY_IMPOSSIBLE: { name: 'nearly_impossible', dc: 30, description: 'Téměř nemožný úkol, který zvládnou jen legendární jedinci.' }
};

/**
 * Základní dovednosti
 */
const BASE_SKILLS = [
  // Fyzické dovednosti
  {
    id: 'athletics',
    name: 'Atletika',
    description: 'Schopnost běhat, skákat, šplhat a provádět fyzicky náročné aktivity.',
    category: SKILL_CATEGORIES.PHYSICAL,
    attribute: 'strength',
    trainable: true,
    defaultTrained: false
  },
  {
    id: 'acrobatics',
    name: 'Akrobacie',
    description: 'Schopnost provádět akrobatické kousky, udržet rovnováhu a padat bezpečně.',
    category: SKILL_CATEGORIES.PHYSICAL,
    attribute: 'dexterity',
    trainable: true,
    defaultTrained: false
  },
  
  // Sociální dovednosti
  {
    id: 'persuasion',
    name: 'Přesvědčování',
    description: 'Schopnost přesvědčit ostatní pomocí logiky, charismatu nebo vyjednávání.',
    category: SKILL_CATEGORIES.SOCIAL,
    attribute: 'charisma',
    trainable: true,
    defaultTrained: false
  },
  {
    id: 'deception',
    name: 'Klamání',
    description: 'Schopnost lhát, podvádět a skrývat pravé úmysly.',
    category: SKILL_CATEGORIES.SOCIAL,
    attribute: 'charisma',
    trainable: true,
    defaultTrained: false
  },
  {
    id: 'intimidation',
    name: 'Zastrašování',
    description: 'Schopnost zastrašit ostatní pomocí hrozeb, fyzické přítomnosti nebo manipulace.',
    category: SKILL_CATEGORIES.SOCIAL,
    attribute: 'charisma',
    trainable: true,
    defaultTrained: false
  },
  
  // Mentální dovednosti
  {
    id: 'arcana',
    name: 'Arkána',
    description: 'Znalost magie, kouzel, magických předmětů a rituálů.',
    category: SKILL_CATEGORIES.MENTAL,
    attribute: 'intelligence',
    trainable: true,
    defaultTrained: false
  },
  {
    id: 'history',
    name: 'Historie',
    description: 'Znalost historických událostí, legend, tradic a osobností.',
    category: SKILL_CATEGORIES.KNOWLEDGE,
    attribute: 'intelligence',
    trainable: true,
    defaultTrained: false
  },
  {
    id: 'investigation',
    name: 'Vyšetřování',
    description: 'Schopnost hledat stopy, analyzovat důkazy a vyvozovat závěry.',
    category: SKILL_CATEGORIES.MENTAL,
    attribute: 'intelligence',
    trainable: true,
    defaultTrained: false
  },
  
  // Dovednosti plížení a skrývání
  {
    id: 'stealth',
    name: 'Plížení',
    description: 'Schopnost pohybovat se tiše a zůstat nepozorován.',
    category: SKILL_CATEGORIES.STEALTH,
    attribute: 'dexterity',
    trainable: true,
    defaultTrained: false
  },
  {
    id: 'sleight_of_hand',
    name: 'Obratnost rukou',
    description: 'Schopnost manipulovat s malými předměty, kapsářství a triky s kartami.',
    category: SKILL_CATEGORIES.STEALTH,
    attribute: 'dexterity',
    trainable: true,
    defaultTrained: false
  },
  
  // Dovednosti vnímání
  {
    id: 'perception',
    name: 'Vnímání',
    description: 'Schopnost všímat si detailů, hledat skryté předměty a být ostražitý.',
    category: SKILL_CATEGORIES.PERCEPTION,
    attribute: 'wisdom',
    trainable: true,
    defaultTrained: true // Každý má základní vnímání
  },
  {
    id: 'insight',
    name: 'Vhled',
    description: 'Schopnost číst emoce, odhalit lži a porozumět motivům ostatních.',
    category: SKILL_CATEGORIES.PERCEPTION,
    attribute: 'wisdom',
    trainable: true,
    defaultTrained: false
  },
  
  // Řemeslné dovednosti
  {
    id: 'lockpicking',
    name: 'Zámečnictví',
    description: 'Schopnost otevírat zámky bez klíče pomocí paklíčů.',
    category: SKILL_CATEGORIES.CRAFTING,
    attribute: 'dexterity',
    trainable: true,
    defaultTrained: false
  },
  {
    id: 'alchemy',
    name: 'Alchymie',
    description: 'Znalost alchymistických postupů, výroba lektvarů a jedů.',
    category: SKILL_CATEGORIES.CRAFTING,
    attribute: 'intelligence',
    trainable: true,
    defaultTrained: false
  },
  {
    id: 'smithing',
    name: 'Kovářství',
    description: 'Schopnost vyrábět a opravovat kovové předměty, zbraně a zbroje.',
    category: SKILL_CATEGORIES.CRAFTING,
    attribute: 'strength',
    trainable: true,
    defaultTrained: false
  },
  
  // Dovednosti přežití
  {
    id: 'survival',
    name: 'Přežití',
    description: 'Schopnost přežít v divočině, stopovat, lovit a orientovat se.',
    category: SKILL_CATEGORIES.SURVIVAL,
    attribute: 'wisdom',
    trainable: true,
    defaultTrained: false
  },
  {
    id: 'medicine',
    name: 'Medicína',
    description: 'Znalost léčení zranění, nemocí a jedů.',
    category: SKILL_CATEGORIES.SURVIVAL,
    attribute: 'wisdom',
    trainable: true,
    defaultTrained: false
  },
  {
    id: 'animal_handling',
    name: 'Zacházení se zvířaty',
    description: 'Schopnost uklidnit, trénovat a ovládat zvířata.',
    category: SKILL_CATEGORIES.SURVIVAL,
    attribute: 'wisdom',
    trainable: true,
    defaultTrained: false
  },
  
  // Magické dovednosti
  {
    id: 'spellcraft',
    name: 'Kouzlení',
    description: 'Schopnost sesílat a kontrolovat kouzla.',
    category: SKILL_CATEGORIES.MAGICAL,
    attribute: 'intelligence',
    trainable: true,
    defaultTrained: false
  },
  {
    id: 'ritual_casting',
    name: 'Rituální magie',
    description: 'Znalost magických rituálů a schopnost je provádět.',
    category: SKILL_CATEGORIES.MAGICAL,
    attribute: 'intelligence',
    trainable: true,
    defaultTrained: false
  }
];

/**
 * Výchozí dovednosti podle povolání
 */
const CLASS_DEFAULT_SKILLS = {
  'bojovník': ['athletics', 'intimidation', 'perception', 'survival'],
  'hraničář': ['athletics', 'stealth', 'perception', 'survival', 'animal_handling'],
  'klerik': ['insight', 'medicine', 'persuasion', 'history', 'religion'],
  'zloděj': ['acrobatics', 'stealth', 'sleight_of_hand', 'deception', 'lockpicking'],
  'kouzelník': ['arcana', 'history', 'investigation', 'spellcraft', 'ritual_casting'],
  'bard': ['persuasion', 'deception', 'performance', 'insight', 'history'],
  'paladin': ['athletics', 'intimidation', 'persuasion', 'medicine', 'religion'],
  'druid': ['animal_handling', 'nature', 'perception', 'survival', 'medicine']
};

/**
 * Získání všech dostupných dovedností
 * @returns {Array} - Seznam všech dovedností
 */
function getAllSkills() {
  return BASE_SKILLS;
}

/**
 * Získání dovednosti podle ID
 * @param {string} skillId - ID dovednosti
 * @returns {Object|null} - Dovednost nebo null, pokud neexistuje
 */
function getSkillById(skillId) {
  return BASE_SKILLS.find(skill => skill.id === skillId) || null;
}

/**
 * Získání dovedností podle kategorie
 * @param {string} category - Kategorie dovedností
 * @returns {Array} - Seznam dovedností v dané kategorii
 */
function getSkillsByCategory(category) {
  return BASE_SKILLS.filter(skill => skill.category === category);
}

/**
 * Získání výchozích dovedností pro dané povolání
 * @param {string} characterClass - Povolání postavy
 * @returns {Array} - Seznam výchozích dovedností
 */
function getDefaultSkillsForClass(characterClass) {
  const defaultSkillIds = CLASS_DEFAULT_SKILLS[characterClass.toLowerCase()] || [];
  return BASE_SKILLS.filter(skill => defaultSkillIds.includes(skill.id));
}

/**
 * Inicializace dovedností pro novou postavu
 * @param {Object} character - Postava
 * @returns {Object} - Postava s inicializovanými dovednostmi
 */
function initializeCharacterSkills(character) {
  // Získání výchozích dovedností pro povolání
  const defaultSkillIds = CLASS_DEFAULT_SKILLS[character.class.toLowerCase()] || [];
  
  // Inicializace všech dovedností
  const skills = {};
  
  BASE_SKILLS.forEach(skill => {
    // Výchozí hodnota je 0, pokud není dovednost trénovaná
    let value = 0;
    
    // Pokud je dovednost ve výchozích dovednostech povolání, nastavit hodnotu na 2
    if (defaultSkillIds.includes(skill.id)) {
      value = 2;
    }
    // Pokud je dovednost defaultně trénovaná, nastavit hodnotu na 1
    else if (skill.defaultTrained) {
      value = 1;
    }
    
    skills[skill.id] = {
      value: value,
      attribute: skill.attribute
    };
  });
  
  // Přidání dovedností do postavy
  character.skills = skills;
  
  return character;
}

/**
 * Výpočet bonusu dovednosti
 * @param {Object} character - Postava
 * @param {string} skillId - ID dovednosti
 * @returns {number} - Bonus dovednosti
 */
function calculateSkillBonus(character, skillId) {
  // Získání dovednosti
  const skill = getSkillById(skillId);
  if (!skill) {
    return 0;
  }
  
  // Získání hodnoty dovednosti z postavy
  const characterSkill = character.skills && character.skills[skillId];
  if (!characterSkill) {
    return 0;
  }
  
  // Získání bonusu z atributu
  const attributeBonus = getAttributeBonus(character[skill.attribute]);
  
  // Celkový bonus = bonus z atributu + hodnota dovednosti
  return attributeBonus + characterSkill.value;
}

/**
 * Provedení testu dovednosti
 * @param {Object} character - Postava
 * @param {string} skillId - ID dovednosti
 * @param {number} dc - Obtížnost testu (Difficulty Class)
 * @param {Object} options - Další možnosti testu
 * @returns {Object} - Výsledek testu
 */
function performSkillCheck(character, skillId, dc, options = {}) {
  // Získání dovednosti
  const skill = getSkillById(skillId);
  if (!skill) {
    return {
      success: false,
      message: `Dovednost s ID ${skillId} neexistuje.`,
      roll: 0,
      bonus: 0,
      total: 0,
      dc: dc
    };
  }
  
  // Výpočet bonusu dovednosti
  const skillBonus = calculateSkillBonus(character, skillId);
  
  // Hod kostkou (1d20)
  const roll = rollDice('1d20');
  
  // Přidání situačního bonusu/postihu
  const situationalBonus = options.situationalBonus || 0;
  
  // Celkový výsledek
  const total = roll + skillBonus + situationalBonus;
  
  // Kontrola, zda je test úspěšný
  const success = total >= dc;
  
  // Kontrola kritického úspěchu/neúspěchu
  const criticalSuccess = roll === 20;
  const criticalFailure = roll === 1;
  
  // Vytvoření výsledku
  const result = {
    success: criticalFailure ? false : (criticalSuccess ? true : success),
    criticalSuccess: criticalSuccess,
    criticalFailure: criticalFailure,
    roll: roll,
    bonus: skillBonus,
    situationalBonus: situationalBonus,
    total: total,
    dc: dc,
    margin: total - dc,
    skill: {
      id: skill.id,
      name: skill.name,
      attribute: skill.attribute
    }
  };
  
  // Přidání zprávy
  if (criticalSuccess) {
    result.message = `Kritický úspěch! ${character.name} exceluje v ${skill.name}.`;
  } else if (criticalFailure) {
    result.message = `Kritický neúspěch! ${character.name} selhal v ${skill.name}.`;
  } else if (success) {
    result.message = `Úspěch! ${character.name} uspěl v testu ${skill.name}.`;
  } else {
    result.message = `Neúspěch! ${character.name} neuspěl v testu ${skill.name}.`;
  }
  
  return result;
}

/**
 * Zlepšení dovednosti
 * @param {Object} character - Postava
 * @param {string} skillId - ID dovednosti
 * @param {number} amount - Množství bodů k přidání
 * @returns {Object} - Výsledek zlepšení
 */
function improveSkill(character, skillId, amount = 1) {
  // Získání dovednosti
  const skill = getSkillById(skillId);
  if (!skill) {
    return {
      success: false,
      message: `Dovednost s ID ${skillId} neexistuje.`
    };
  }
  
  // Kontrola, zda má postava inicializované dovednosti
  if (!character.skills) {
    character.skills = {};
  }
  
  // Kontrola, zda má postava danou dovednost
  if (!character.skills[skillId]) {
    character.skills[skillId] = {
      value: 0,
      attribute: skill.attribute
    };
  }
  
  // Maximální hodnota dovednosti je 10
  const maxSkillValue = 10;
  
  // Aktuální hodnota dovednosti
  const currentValue = character.skills[skillId].value;
  
  // Nová hodnota dovednosti (omezená maximem)
  const newValue = Math.min(currentValue + amount, maxSkillValue);
  
  // Aktualizace hodnoty dovednosti
  character.skills[skillId].value = newValue;
  
  // Vytvoření výsledku
  const result = {
    success: true,
    message: `Dovednost ${skill.name} byla zlepšena z ${currentValue} na ${newValue}.`,
    skill: {
      id: skill.id,
      name: skill.name,
      attribute: skill.attribute,
      oldValue: currentValue,
      newValue: newValue
    }
  };
  
  // Pokud se hodnota nezměnila (již na maximu)
  if (currentValue === newValue) {
    result.message = `Dovednost ${skill.name} je již na maximální hodnotě (${maxSkillValue}).`;
    result.success = false;
  }
  
  return result;
}

/**
 * Získání obtížnosti podle názvu
 * @param {string} difficultyName - Název obtížnosti
 * @returns {Object} - Obtížnost
 */
function getDifficultyByName(difficultyName) {
  return DIFFICULTY_LEVELS[difficultyName.toUpperCase()] || DIFFICULTY_LEVELS.MEDIUM;
}

/**
 * Získání obtížnosti podle DC
 * @param {number} dc - Difficulty Class
 * @returns {Object} - Obtížnost
 */
function getDifficultyByDC(dc) {
  // Seřazení obtížností podle DC
  const difficulties = Object.values(DIFFICULTY_LEVELS).sort((a, b) => a.dc - b.dc);
  
  // Nalezení nejvyšší obtížnosti, která je menší nebo rovna zadanému DC
  for (let i = difficulties.length - 1; i >= 0; i--) {
    if (dc >= difficulties[i].dc) {
      return difficulties[i];
    }
  }
  
  // Pokud není nalezena žádná obtížnost, vrátit nejnižší
  return difficulties[0];
}

module.exports = {
  SKILL_CATEGORIES,
  DIFFICULTY_LEVELS,
  BASE_SKILLS,
  CLASS_DEFAULT_SKILLS,
  getAllSkills,
  getSkillById,
  getSkillsByCategory,
  getDefaultSkillsForClass,
  initializeCharacterSkills,
  calculateSkillBonus,
  performSkillCheck,
  improveSkill,
  getDifficultyByName,
  getDifficultyByDC
};
