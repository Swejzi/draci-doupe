// Funkce pro výpočet bonusu z atributu
function getAttributeBonus(attributeValue) {
  if (!attributeValue) return 0;

  // Převést na číslo, pokud je to string
  const value = parseInt(attributeValue, 10);

  // Pokud není číslo, vrátit 0
  if (isNaN(value)) return 0;

  // Výpočet bonusu: (hodnota - 10) / 2, zaokrouhleno dolů
  return Math.floor((value - 10) / 2);
}

// Funkce pro hod kostkou (např. "1d6", "2d8+2")
function rollDice(diceString) {
  if (!diceString) return 0;
  const match = diceString.match(/(\d+)?d(\d+)(?:([+-])(\d+))?/i);
  if (!match) return 0;

  const numDice = match[1] ? parseInt(match[1], 10) : 1;
  const diceValue = parseInt(match[2], 10);
  const modifierSign = match[3];
  const modifierValue = match[4] ? parseInt(match[4], 10) : 0;

  let result = 0;
  for (let i = 0; i < numDice; i++) {
    // Generovat náhodné číslo od 1 do diceValue
    result += Math.floor(Math.random() * diceValue) + 1;
  }

  // Aplikovat modifikátor
  if (modifierSign === '+') {
    result += modifierValue;
  } else if (modifierSign === '-') {
    result -= modifierValue;
  }

  return result;
}

// Funkce pro kontrolu úspěchu hodu proti obtížnosti (DC)
function checkSuccess(roll, dc) {
  return roll >= dc;
}

// Funkce pro přidání předmětu do inventáře
function addItemToInventory(character, item) {
  if (!character.inventory) {
    character.inventory = [];
  }

  // Zkontrolovat, zda už předmět v inventáři je
  const existingItemIndex = character.inventory.findIndex(i => i.id === item.id);

  if (existingItemIndex >= 0) {
    // Pokud ano, zvýšit množství
    character.inventory[existingItemIndex].quantity += item.quantity || 1;
  } else {
    // Pokud ne, přidat nový předmět
    character.inventory.push({
      ...item,
      quantity: item.quantity || 1
    });
  }

  return character;
}

// Funkce pro použití předmětu z inventáře
function useItemFromInventory(character, itemId) {
  if (!character.inventory) return { success: false, message: 'Prázdný inventář' };

  const itemIndex = character.inventory.findIndex(i => i.id === itemId);
  if (itemIndex === -1) return { success: false, message: 'Předmět nenalezen' };

  const item = character.inventory[itemIndex];

  // Aplikovat efekty předmětu
  let effectsApplied = [];

  if (item.effects) {
    // Léčení
    if (item.effects.healing) {
      const healAmount = item.effects.healing;
      character.current_health = Math.min(character.max_health, character.current_health + healAmount);
      effectsApplied.push(`Léčení +${healAmount}`);
    }

    // Mana
    if (item.effects.mana) {
      const manaAmount = item.effects.mana;
      character.current_mana = Math.min(character.max_mana, character.current_mana + manaAmount);
      effectsApplied.push(`Mana +${manaAmount}`);
    }

    // Dočasné bonusy k atributům
    if (item.effects.attributes) {
      // Implementace dočasných bonusů by vyžadovala systém pro sledování trvání efektů
      // Pro jednoduchost zde neimplementováno
    }
  }

  // Snížit množství předmětu
  character.inventory[itemIndex].quantity--;

  // Pokud množství kleslo na 0, odstranit předmět z inventáře
  if (character.inventory[itemIndex].quantity <= 0) {
    character.inventory.splice(itemIndex, 1);
  }

  return {
    success: true,
    message: `Použit předmět ${item.name}`,
    effects: effectsApplied
  };
}

// Funkce pro výpočet útočného bonusu postavy
function getAttackBonus(character, weapon) {
  let bonus = 0;

  // Bonus z povolání a úrovně
  switch(character.class.toLowerCase()) {
    case 'bojovník':
    case 'paladin':
    case 'barbar':
      bonus += Math.floor(character.level / 2) + 1;
      break;
    case 'zloděj':
    case 'hraničář':
      bonus += Math.floor(character.level / 3) + 1;
      break;
    default:
      bonus += Math.floor(character.level / 4);
  }

  // Bonus z atributu
  if (weapon && weapon.type === 'ranged') {
    // Střelné zbraně používají obratnost
    bonus += getAttributeBonus(character.dexterity);
  } else {
    // Ostatní zbraně používají sílu
    bonus += getAttributeBonus(character.strength);
  }

  // Bonus ze zbraně
  if (weapon && weapon.effects && weapon.effects.attackBonus) {
    bonus += weapon.effects.attackBonus;
  }

  return bonus;
}

// Funkce pro výpočet zranění
function calculateDamage(character, weapon, attackRoll) {
  let damageFormula = weapon ? weapon.damage : '1d4'; // Základní zranění beze zbraně
  let damageBonus = 0;

  // Kritický zásah (hod 20)
  const isCritical = attackRoll === 20;

  // Bonus z atributu
  if (weapon && weapon.type === 'ranged') {
    // Střelné zbraně používají obratnost pro bonus k zranění, pokud mají vlastnost "finesse"
    if (weapon.properties && weapon.properties.includes('finesse')) {
      damageBonus += getAttributeBonus(character.dexterity);
    }
  } else {
    // Ostatní zbraně používají sílu
    damageBonus += getAttributeBonus(character.strength);
  }

  // Bonus ze zbraně
  if (weapon && weapon.effects && weapon.effects.damageBonus) {
    damageBonus += weapon.effects.damageBonus;
  }

  // Výpočet základního zranění
  let damage = rollDice(damageFormula);

  // Při kritickém zásahu zdvojnásobit hody kostkou
  if (isCritical) {
    damage += rollDice(damageFormula);
  }

  // Přidat bonus k zranění
  damage += damageBonus;

  // Minimální zranění je 1
  return Math.max(1, damage);
}

// Funkce pro aplikaci zranění NPC
function applyDamageToNPC(npc, damage) {
  if (!npc.current_health) {
    npc.current_health = npc.stats.health;
  }

  npc.current_health = Math.max(0, npc.current_health - damage);

  const isDead = npc.current_health <= 0;

  return {
    npc,
    damage,
    isDead,
    message: isDead ? `${npc.name} byl poražen!` : `${npc.name} utrpěl ${damage} zranění.`
  };
}

// Funkce pro aktualizaci stavu postavy (např. po odpočinku)
function updateCharacterStats(character, type) {
  switch(type) {
    case 'shortRest':
      // Krátký odpočinek obnoví část zdraví a many
      character.current_health = Math.min(
        character.max_health,
        character.current_health + Math.floor(character.max_health / 4)
      );
      character.current_mana = Math.min(
        character.max_mana,
        character.current_mana + Math.floor(character.max_mana / 4)
      );
      break;
    case 'longRest':
      // Dlouhý odpočinek obnoví veškeré zdraví a manu
      character.current_health = character.max_health;
      character.current_mana = character.max_mana;
      break;
  }

  return character;
}

// Funkce pro přidání zkušeností postavě
function addExperience(character, amount) {
  character.experience += amount;

  // Kontrola, zda postava dosáhla nové úrovně
  const experienceThresholds = [
    0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
    85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
  ];

  // Najít novou úroveň
  let newLevel = 1;
  for (let i = 1; i < experienceThresholds.length; i++) {
    if (character.experience >= experienceThresholds[i]) {
      newLevel = i + 1;
    } else {
      break;
    }
  }

  // Pokud postava dosáhla nové úrovně
  if (newLevel > character.level) {
    const oldLevel = character.level;
    character.level = newLevel;

    // Zvýšit maximální zdraví a manu
    // Toto je zjednodušený výpočet, v reálné hře by závisel na povolání a dalších faktorech
    const healthIncrease = rollDice('1d8') + getAttributeBonus(character.constitution);
    character.max_health += Math.max(1, healthIncrease);
    character.current_health = character.max_health; // Při zvýšení úrovně se obnoví zdraví

    if (character.max_mana > 0) {
      const manaIncrease = rollDice('1d6') + getAttributeBonus(character.intelligence);
      character.max_mana += Math.max(1, manaIncrease);
      character.current_mana = character.max_mana; // Při zvýšení úrovně se obnoví mana
    }

    return {
      leveledUp: true,
      oldLevel,
      newLevel,
      healthIncrease,
      manaIncrease: character.max_mana > 0 ? manaIncrease : 0
    };
  }

  return { leveledUp: false };
}

// Funkce pro aplikaci odměn z úkolu
function applyQuestRewards(character, rewards) {
  // Přidat zkušenosti
  if (rewards.experience) {
    addExperience(character, rewards.experience);
  }

  // Přidat zlato
  if (rewards.gold) {
    character.gold = (character.gold || 0) + rewards.gold;
  }

  // Přidat předměty
  if (rewards.items && rewards.items.length > 0) {
    rewards.items.forEach(item => {
      addItemToInventory(character, item);
    });
  }

  return character;
}

// Funkce pro výpočet iniciativy v souboji
function determineInitiative(character, npcs) {
  // Výpočet iniciativy pro hráče (založeno na obratnosti a náhodě)
  const playerInitiative = rollDice('1d20') + getAttributeBonus(character.dexterity);

  // Výpočet iniciativy pro každé NPC
  const npcInitiatives = npcs.map(npc => {
    const npcDexBonus = getAttributeBonus(npc.stats?.dexterity || 10);
    return {
      id: npc.id,
      name: npc.name,
      initiative: rollDice('1d20') + npcDexBonus
    };
  });

  // Seřazení podle iniciativy (sestupně)
  const allCombatants = [
    { id: 'player', name: character.name, initiative: playerInitiative },
    ...npcInitiatives
  ].sort((a, b) => b.initiative - a.initiative);

  return allCombatants;
}

// Funkce pro zpracování různých typů útoků
function processAttackType(attackType, character, weapon) {
  // Výchozí modifikátory
  let attackBonus = 0;
  let damageBonus = 0;
  let defenseBonus = 0;

  // Aplikace modifikátorů podle typu útoku
  switch(attackType) {
    case 'rychlý':
      attackBonus = 2;
      damageBonus = -1;
      break;
    case 'silný':
      attackBonus = -1;
      damageBonus = 3;
      break;
    case 'obranný':
      attackBonus = -1;
      defenseBonus = 2;
      break;
    default: // normální útok
      break;
  }

  // Získání základního útočného bonusu postavy
  const baseAttackBonus = getAttackBonus(character, weapon);

  return {
    attackBonus: baseAttackBonus + attackBonus,
    damageBonus,
    defenseBonus
  };
}

module.exports = {
  getAttributeBonus,
  rollDice,
  checkSuccess,
  addItemToInventory,
  useItemFromInventory,
  getAttackBonus,
  calculateDamage,
  applyDamageToNPC,
  updateCharacterStats,
  addExperience,
  applyQuestRewards,
  determineInitiative,
  processAttackType
};
