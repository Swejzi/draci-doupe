/**
 * Systém schopností (abilities) pro Dračí doupě
 * 
 * Tento modul poskytuje funkce pro práci se schopnostmi postav.
 * Schopnosti jsou speciální dovednosti, které postavy získávají na základě svého povolání a úrovně.
 */

// Definice základních schopností podle povolání
const CLASS_ABILITIES = {
  'Bojovník': [
    {
      id: 'second_wind',
      name: 'Druhý dech',
      description: 'Bojovník může jednou za odpočinek obnovit 1d10 + úroveň životů.',
      level: 1,
      usesPerDay: 1,
      cooldown: 0,
      type: 'active',
      effects: {
        healing: '1d10+level'
      }
    },
    {
      id: 'action_surge',
      name: 'Bojový zápal',
      description: 'Bojovník může jednou za odpočinek provést další akci ve svém tahu.',
      level: 2,
      usesPerDay: 1,
      cooldown: 0,
      type: 'active',
      effects: {
        extraAction: true
      }
    },
    {
      id: 'improved_critical',
      name: 'Zlepšený kritický zásah',
      description: 'Bojovník způsobí kritický zásah při hodu 19-20 na k20.',
      level: 3,
      usesPerDay: -1, // Neomezené použití
      cooldown: 0,
      type: 'passive',
      effects: {
        criticalRange: 19
      }
    }
  ],
  'Zloděj': [
    {
      id: 'sneak_attack',
      name: 'Zákeřný útok',
      description: 'Zloděj způsobí dodatečné zranění 1d6, pokud má výhodu při útoku nebo je cíl v boji s jiným nepřítelem.',
      level: 1,
      usesPerDay: -1, // Neomezené použití
      cooldown: 0,
      type: 'passive',
      effects: {
        extraDamage: '1d6',
        conditions: ['advantage', 'enemy_engaged']
      }
    },
    {
      id: 'cunning_action',
      name: 'Lstivá akce',
      description: 'Zloděj může jako bonusovou akci provést úhyb, skrytí nebo sprint.',
      level: 2,
      usesPerDay: -1, // Neomezené použití
      cooldown: 0,
      type: 'active',
      effects: {
        bonusActions: ['dash', 'disengage', 'hide']
      }
    },
    {
      id: 'uncanny_dodge',
      name: 'Neuvěřitelný úhyb',
      description: 'Zloděj může jako reakci snížit zranění z útoku na polovinu.',
      level: 5,
      usesPerDay: -1, // Neomezené použití
      cooldown: 0,
      type: 'reaction',
      effects: {
        damageDivider: 2
      }
    }
  ],
  'Kouzelník': [
    {
      id: 'arcane_recovery',
      name: 'Arkánová obnova',
      description: 'Kouzelník může jednou za den obnovit část své many po krátkém odpočinku.',
      level: 1,
      usesPerDay: 1,
      cooldown: 0,
      type: 'active',
      effects: {
        manaRecovery: 'level'
      }
    },
    {
      id: 'spell_mastery',
      name: 'Mistrovství kouzel',
      description: 'Kouzelník může seslat jedno kouzlo 1. úrovně bez utracení many.',
      level: 3,
      usesPerDay: 1,
      cooldown: 0,
      type: 'active',
      effects: {
        freeSpell: {
          level: 1,
          uses: 1
        }
      }
    }
  ],
  'Hraničář': [
    {
      id: 'natural_explorer',
      name: 'Průzkumník přírody',
      description: 'Hraničář má výhodu při hodech na přežití a stopování v přírodě.',
      level: 1,
      usesPerDay: -1, // Neomezené použití
      cooldown: 0,
      type: 'passive',
      effects: {
        skillAdvantage: ['survival', 'tracking']
      }
    },
    {
      id: 'hunters_mark',
      name: 'Lovcovo znamení',
      description: 'Hraničář může označit nepřítele a způsobovat mu dodatečné zranění 1d6.',
      level: 2,
      usesPerDay: 3,
      cooldown: 0,
      type: 'active',
      effects: {
        extraDamage: '1d6',
        duration: 'concentration'
      }
    }
  ],
  'Alchymista': [
    {
      id: 'quick_brewing',
      name: 'Rychlá příprava',
      description: 'Alchymista může připravit jednoduchý lektvar za poloviční čas.',
      level: 1,
      usesPerDay: 3,
      cooldown: 0,
      type: 'active',
      effects: {
        brewingTime: 0.5
      }
    },
    {
      id: 'potion_expertise',
      name: 'Lektvarová expertíza',
      description: 'Efekty lektvarů připravených alchymistou jsou o 50% silnější.',
      level: 3,
      usesPerDay: -1, // Neomezené použití
      cooldown: 0,
      type: 'passive',
      effects: {
        potionEffectMultiplier: 1.5
      }
    }
  ]
};

/**
 * Získání všech schopností pro dané povolání
 * @param {string} characterClass - Povolání postavy
 * @returns {Array} - Seznam všech schopností pro dané povolání
 */
function getAllAbilitiesForClass(characterClass) {
  // Převedení na malá písmena pro case-insensitive porovnání
  const normalizedClass = characterClass.toLowerCase();
  
  // Hledání odpovídajícího povolání v CLASS_ABILITIES
  for (const [className, abilities] of Object.entries(CLASS_ABILITIES)) {
    if (className.toLowerCase() === normalizedClass) {
      return abilities;
    }
  }
  
  // Pokud povolání není nalezeno, vrátíme prázdné pole
  return [];
}

/**
 * Získání dostupných schopností pro postavu podle povolání a úrovně
 * @param {string} characterClass - Povolání postavy
 * @param {number} level - Úroveň postavy
 * @returns {Array} - Seznam dostupných schopností
 */
function getAvailableAbilities(characterClass, level) {
  const allAbilities = getAllAbilitiesForClass(characterClass);
  
  // Filtrování schopností podle úrovně
  return allAbilities.filter(ability => ability.level <= level);
}

/**
 * Inicializace schopností pro novou postavu
 * @param {Object} character - Postava
 * @returns {Object} - Postava s inicializovanými schopnostmi
 */
function initializeCharacterAbilities(character) {
  if (!character) return null;
  
  // Získání dostupných schopností pro postavu
  const availableAbilities = getAvailableAbilities(character.class, character.level);
  
  // Inicializace pole schopností, pokud neexistuje
  if (!character.abilities) {
    character.abilities = [];
  }
  
  // Přidání dostupných schopností
  availableAbilities.forEach(ability => {
    // Kontrola, zda schopnost již není v seznamu
    const existingAbility = character.abilities.find(a => a.id === ability.id);
    if (!existingAbility) {
      character.abilities.push({
        ...ability,
        currentUses: ability.usesPerDay, // Nastavení aktuálního počtu použití
        active: ability.type === 'passive' // Pasivní schopnosti jsou vždy aktivní
      });
    }
  });
  
  return character;
}

/**
 * Aktualizace schopností postavy při zvýšení úrovně
 * @param {Object} character - Postava
 * @returns {Object} - Aktualizovaná postava
 */
function updateAbilitiesOnLevelUp(character) {
  if (!character) return null;
  
  // Získání nových schopností pro aktuální úroveň
  const newAbilities = getAvailableAbilities(character.class, character.level)
    .filter(ability => {
      // Filtrování schopností, které postava ještě nemá
      return !character.abilities || !character.abilities.some(a => a.id === ability.id);
    });
  
  // Přidání nových schopností
  if (newAbilities.length > 0) {
    if (!character.abilities) {
      character.abilities = [];
    }
    
    newAbilities.forEach(ability => {
      character.abilities.push({
        ...ability,
        currentUses: ability.usesPerDay,
        active: ability.type === 'passive'
      });
    });
  }
  
  return character;
}

/**
 * Použití schopnosti
 * @param {Object} character - Postava
 * @param {string} abilityId - ID schopnosti
 * @param {Object} target - Cíl schopnosti (volitelné)
 * @returns {Object} - Výsledek použití schopnosti
 */
function useAbility(character, abilityId, target = null) {
  if (!character || !character.abilities) {
    return {
      success: false,
      message: 'Postava nemá žádné schopnosti.'
    };
  }
  
  // Nalezení schopnosti
  const abilityIndex = character.abilities.findIndex(a => a.id === abilityId);
  if (abilityIndex === -1) {
    return {
      success: false,
      message: `Schopnost s ID ${abilityId} nebyla nalezena.`
    };
  }
  
  const ability = character.abilities[abilityIndex];
  
  // Kontrola, zda lze schopnost použít
  if (ability.usesPerDay !== -1 && ability.currentUses <= 0) {
    return {
      success: false,
      message: `Schopnost ${ability.name} již nemá žádná použití.`
    };
  }
  
  // Kontrola cooldownu
  if (ability.cooldownRemaining && ability.cooldownRemaining > 0) {
    return {
      success: false,
      message: `Schopnost ${ability.name} se ještě obnovuje. Zbývá ${ability.cooldownRemaining} kol.`
    };
  }
  
  // Aplikace efektů schopnosti
  const effects = applyAbilityEffects(character, ability, target);
  
  // Aktualizace počtu použití a cooldownu
  if (ability.usesPerDay !== -1) {
    character.abilities[abilityIndex].currentUses--;
  }
  
  if (ability.cooldown > 0) {
    character.abilities[abilityIndex].cooldownRemaining = ability.cooldown;
  }
  
  return {
    success: true,
    message: `Schopnost ${ability.name} byla úspěšně použita.`,
    effects
  };
}

/**
 * Aplikace efektů schopnosti
 * @param {Object} character - Postava
 * @param {Object} ability - Schopnost
 * @param {Object} target - Cíl schopnosti
 * @returns {Array} - Seznam aplikovaných efektů
 */
function applyAbilityEffects(character, ability, target) {
  const appliedEffects = [];
  
  if (!ability.effects) {
    return appliedEffects;
  }
  
  // Zpracování různých typů efektů
  if (ability.effects.healing) {
    // Zpracování léčení
    let healingAmount = 0;
    
    if (ability.effects.healing === '1d10+level') {
      // Příklad: Druhý dech (1d10 + úroveň)
      const rollResult = Math.floor(Math.random() * 10) + 1; // 1d10
      healingAmount = rollResult + character.level;
    } else if (typeof ability.effects.healing === 'number') {
      healingAmount = ability.effects.healing;
    }
    
    // Aplikace léčení
    if (healingAmount > 0) {
      const oldHealth = character.current_health;
      character.current_health = Math.min(character.max_health, character.current_health + healingAmount);
      const actualHealing = character.current_health - oldHealth;
      
      appliedEffects.push({
        type: 'healing',
        amount: actualHealing,
        description: `Obnoveno ${actualHealing} životů.`
      });
    }
  }
  
  if (ability.effects.manaRecovery) {
    // Zpracování obnovy many
    let manaAmount = 0;
    
    if (ability.effects.manaRecovery === 'level') {
      // Příklad: Arkánová obnova (úroveň)
      manaAmount = character.level;
    } else if (typeof ability.effects.manaRecovery === 'number') {
      manaAmount = ability.effects.manaRecovery;
    }
    
    // Aplikace obnovy many
    if (manaAmount > 0) {
      const oldMana = character.current_mana;
      character.current_mana = Math.min(character.max_mana, character.current_mana + manaAmount);
      const actualMana = character.current_mana - oldMana;
      
      appliedEffects.push({
        type: 'mana',
        amount: actualMana,
        description: `Obnoveno ${actualMana} many.`
      });
    }
  }
  
  // Další typy efektů by byly implementovány podobně
  
  return appliedEffects;
}

/**
 * Obnovení schopností po odpočinku
 * @param {Object} character - Postava
 * @param {string} restType - Typ odpočinku ('short' nebo 'long')
 * @returns {Object} - Aktualizovaná postava
 */
function refreshAbilitiesAfterRest(character, restType) {
  if (!character || !character.abilities) {
    return character;
  }
  
  // Aktualizace schopností
  character.abilities = character.abilities.map(ability => {
    // Kopie schopnosti
    const updatedAbility = { ...ability };
    
    // Obnovení cooldownu pro všechny typy odpočinku
    if (updatedAbility.cooldownRemaining) {
      updatedAbility.cooldownRemaining = 0;
    }
    
    // Obnovení použití podle typu odpočinku
    if (restType === 'long' || (restType === 'short' && ability.refreshOnShortRest)) {
      updatedAbility.currentUses = ability.usesPerDay;
    }
    
    return updatedAbility;
  });
  
  return character;
}

/**
 * Získání detailu schopnosti podle ID
 * @param {string} abilityId - ID schopnosti
 * @returns {Object|null} - Detail schopnosti nebo null, pokud schopnost nebyla nalezena
 */
function getAbilityDetails(abilityId) {
  // Procházení všech povolání a jejich schopností
  for (const abilities of Object.values(CLASS_ABILITIES)) {
    const ability = abilities.find(a => a.id === abilityId);
    if (ability) {
      return ability;
    }
  }
  
  return null;
}

module.exports = {
  getAllAbilitiesForClass,
  getAvailableAbilities,
  initializeCharacterAbilities,
  updateAbilitiesOnLevelUp,
  useAbility,
  refreshAbilitiesAfterRest,
  getAbilityDetails
};
