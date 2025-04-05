/**
 * Systém kouzel pro Dračí doupě
 * 
 * Tento modul obsahuje funkce pro práci s kouzly, jejich sesílání a efekty.
 */

const { rollDice, getAttributeBonus } = require('./gameMechanics');

/**
 * Školy magie
 */
const MAGIC_SCHOOLS = {
  ABJURATION: 'abjuration',     // Ochranná magie
  CONJURATION: 'conjuration',   // Vyvolávací magie
  DIVINATION: 'divination',     // Věštecká magie
  ENCHANTMENT: 'enchantment',   // Očarovací magie
  EVOCATION: 'evocation',       // Zaklínací magie
  ILLUSION: 'illusion',         // Iluzorní magie
  NECROMANCY: 'necromancy',     // Nekromancie
  TRANSMUTATION: 'transmutation' // Přeměňovací magie
};

/**
 * Typy kouzel
 */
const SPELL_TYPES = {
  ATTACK: 'attack',       // Útočná kouzla
  DEFENSE: 'defense',     // Obranná kouzla
  HEALING: 'healing',     // Léčivá kouzla
  UTILITY: 'utility',     // Užitková kouzla
  BUFF: 'buff',           // Posilující kouzla
  DEBUFF: 'debuff',       // Oslabující kouzla
  CONTROL: 'control',     // Kontrolní kouzla
  SUMMONING: 'summoning'  // Vyvolávací kouzla
};

/**
 * Typy cílů kouzel
 */
const TARGET_TYPES = {
  SELF: 'self',           // Sám na sebe
  SINGLE: 'single',       // Jeden cíl
  MULTIPLE: 'multiple',   // Více cílů
  AREA: 'area',           // Oblast
  ALL: 'all'              // Všechny cíle
};

/**
 * Kontrola, zda má postava dostatek many pro seslání kouzla
 * @param {Object} character - Postava
 * @param {Object} spell - Kouzlo
 * @returns {boolean} - Má dostatek many?
 */
function hasEnoughMana(character, spell) {
  return character.current_mana >= spell.manaCost;
}

/**
 * Kontrola, zda postava může seslat kouzlo (podle povolání a úrovně)
 * @param {Object} character - Postava
 * @param {Object} spell - Kouzlo
 * @returns {boolean} - Může seslat kouzlo?
 */
function canCastSpell(character, spell) {
  // Kontrola povolání
  if (spell.allowedClasses && !spell.allowedClasses.includes(character.class.toLowerCase())) {
    return false;
  }

  // Kontrola úrovně
  if (spell.minLevel && character.level < spell.minLevel) {
    return false;
  }

  // Kontrola many
  if (!hasEnoughMana(character, spell)) {
    return false;
  }

  return true;
}

/**
 * Výpočet DC (Difficulty Class) kouzla
 * @param {Object} character - Postava
 * @param {Object} spell - Kouzlo
 * @returns {number} - DC kouzla
 */
function calculateSpellDC(character, spell) {
  // Základní DC podle úrovně kouzla
  let dc = 8 + Math.floor(spell.level / 2);

  // Přidat bonus z hlavního atributu pro kouzlení
  const spellcastingAttribute = getSpellcastingAttribute(character.class);
  dc += getAttributeBonus(character[spellcastingAttribute]);

  // Přidat bonus z úrovně postavy
  dc += Math.floor(character.level / 4);

  return dc;
}

/**
 * Získání hlavního atributu pro kouzlení podle povolání
 * @param {string} characterClass - Povolání postavy
 * @returns {string} - Název atributu
 */
function getSpellcastingAttribute(characterClass) {
  switch (characterClass.toLowerCase()) {
    case 'kouzelník':
    case 'čaroděj':
      return 'intelligence';
    case 'klerik':
    case 'druid':
      return 'wisdom';
    case 'bard':
    case 'paladin':
      return 'charisma';
    default:
      return 'intelligence';
  }
}

/**
 * Výpočet útočného bonusu pro kouzlo
 * @param {Object} character - Postava
 * @param {Object} spell - Kouzlo
 * @returns {number} - Útočný bonus
 */
function calculateSpellAttackBonus(character, spell) {
  // Získat hlavní atribut pro kouzlení
  const spellcastingAttribute = getSpellcastingAttribute(character.class);
  
  // Základní bonus z atributu
  let bonus = getAttributeBonus(character[spellcastingAttribute]);
  
  // Bonus z úrovně
  bonus += Math.floor(character.level / 2);
  
  // Bonus ze specializace (pokud existuje)
  if (character.specialization && character.specialization.school === spell.school) {
    bonus += 2;
  }
  
  return bonus;
}

/**
 * Seslání kouzla
 * @param {Object} character - Postava
 * @param {Object} spell - Kouzlo
 * @param {Object} target - Cíl kouzla
 * @returns {Object} - Výsledek seslání kouzla
 */
function castSpell(character, spell, target) {
  // Kontrola, zda může seslat kouzlo
  if (!canCastSpell(character, spell)) {
    return {
      success: false,
      message: `Nemůžeš seslat kouzlo ${spell.name}.`,
      reason: !hasEnoughMana(character, spell) ? 'not_enough_mana' : 'requirements_not_met'
    };
  }
  
  // Odečtení many
  character.current_mana -= spell.manaCost;
  
  // Výsledek seslání kouzla
  const result = {
    success: true,
    spell: spell.name,
    caster: character.name,
    manaCost: spell.manaCost,
    remainingMana: character.current_mana,
    effects: []
  };
  
  // Zpracování podle typu kouzla
  switch (spell.type) {
    case SPELL_TYPES.ATTACK:
      processAttackSpell(character, spell, target, result);
      break;
    case SPELL_TYPES.HEALING:
      processHealingSpell(character, spell, target, result);
      break;
    case SPELL_TYPES.BUFF:
      processBuffSpell(character, spell, target, result);
      break;
    case SPELL_TYPES.DEBUFF:
      processDebuffSpell(character, spell, target, result);
      break;
    case SPELL_TYPES.UTILITY:
      processUtilitySpell(character, spell, target, result);
      break;
    default:
      result.message = `Sesláno kouzlo ${spell.name}.`;
  }
  
  return result;
}

/**
 * Zpracování útočného kouzla
 * @param {Object} character - Postava
 * @param {Object} spell - Kouzlo
 * @param {Object} target - Cíl kouzla
 * @param {Object} result - Výsledek seslání kouzla
 */
function processAttackSpell(character, spell, target, result) {
  // Hod na útok kouzlem (pokud je potřeba)
  let hit = true;
  let attackRoll = 0;
  
  if (spell.requiresAttackRoll) {
    attackRoll = rollDice('1d20');
    const attackBonus = calculateSpellAttackBonus(character, spell);
    const totalAttack = attackRoll + attackBonus;
    
    // Kontrola, zda útok zasáhl
    hit = totalAttack >= target.armorClass;
    
    result.attackRoll = {
      roll: attackRoll,
      bonus: attackBonus,
      total: totalAttack,
      hit: hit
    };
  }
  
  // Pokud útok zasáhl nebo kouzlo nevyžaduje hod na útok
  if (hit) {
    // Výpočet zranění
    let damage = 0;
    
    if (spell.damage) {
      // Základní zranění z kouzla
      damage = rollDice(spell.damage);
      
      // Kritický zásah (hod 20)
      if (attackRoll === 20) {
        damage += rollDice(spell.damage);
        result.critical = true;
      }
      
      // Bonus ze specializace
      if (character.specialization && character.specialization.school === spell.school) {
        damage += Math.floor(character.level / 2);
      }
    }
    
    // Aplikace zranění na cíl
    if (damage > 0) {
      // Kontrola odolností
      if (target.resistances && target.resistances[spell.damageType]) {
        const resistancePercent = target.resistances[spell.damageType];
        const reducedDamage = Math.floor(damage * (1 - resistancePercent / 100));
        
        result.effects.push({
          type: 'damage',
          value: reducedDamage,
          original: damage,
          reduced: damage - reducedDamage,
          damageType: spell.damageType,
          resistance: resistancePercent
        });
        
        damage = reducedDamage;
      } else {
        result.effects.push({
          type: 'damage',
          value: damage,
          damageType: spell.damageType
        });
      }
      
      // Aplikace zranění
      if (target.current_health) {
        target.current_health = Math.max(0, target.current_health - damage);
        
        if (target.current_health === 0) {
          result.defeated = true;
        }
      }
    }
    
    // Aplikace dodatečných efektů
    if (spell.effects) {
      spell.effects.forEach(effect => {
        // Kontrola, zda efekt má být aplikován (hod na záchranu)
        let effectApplied = true;
        
        if (effect.savingThrow) {
          const dc = calculateSpellDC(character, spell);
          const saveRoll = rollDice('1d20');
          const saveBonus = getAttributeBonus(target[effect.savingThrow.attribute]);
          const totalSave = saveRoll + saveBonus;
          
          effectApplied = totalSave < dc;
          
          result.savingThrow = {
            attribute: effect.savingThrow.attribute,
            dc: dc,
            roll: saveRoll,
            bonus: saveBonus,
            total: totalSave,
            success: !effectApplied
          };
        }
        
        if (effectApplied) {
          // Aplikace efektu
          result.effects.push({
            type: effect.type,
            duration: effect.duration,
            value: effect.value
          });
          
          // Přidání efektu do seznamu aktivních efektů cíle
          if (!target.activeEffects) {
            target.activeEffects = [];
          }
          
          target.activeEffects.push({
            id: `${spell.id}_${effect.type}_${Date.now()}`,
            name: effect.name || spell.name,
            type: effect.type,
            value: effect.value,
            duration: effect.duration,
            remainingDuration: effect.duration,
            source: character.name
          });
        }
      });
    }
    
    result.message = `${character.name} seslal ${spell.name} na ${target.name} a způsobil ${damage} bodů ${spell.damageType} zranění.`;
    if (result.defeated) {
      result.message += ` ${target.name} byl poražen!`;
    }
  } else {
    result.message = `${character.name} se pokusil seslat ${spell.name} na ${target.name}, ale minul.`;
  }
}

/**
 * Zpracování léčivého kouzla
 * @param {Object} character - Postava
 * @param {Object} spell - Kouzlo
 * @param {Object} target - Cíl kouzla
 * @param {Object} result - Výsledek seslání kouzla
 */
function processHealingSpell(character, spell, target, result) {
  // Výpočet léčení
  let healing = 0;
  
  if (spell.healing) {
    // Základní léčení z kouzla
    healing = rollDice(spell.healing);
    
    // Bonus z moudrosti (pro léčivá kouzla)
    healing += getAttributeBonus(character.wisdom);
    
    // Bonus ze specializace
    if (character.specialization && character.specialization.school === spell.school) {
      healing += Math.floor(character.level / 2);
    }
  }
  
  // Aplikace léčení na cíl
  if (healing > 0) {
    result.effects.push({
      type: 'healing',
      value: healing
    });
    
    // Aplikace léčení
    if (target.current_health && target.max_health) {
      target.current_health = Math.min(target.max_health, target.current_health + healing);
    }
  }
  
  result.message = `${character.name} seslal ${spell.name} na ${target.name} a vyléčil ${healing} bodů zdraví.`;
}

/**
 * Zpracování posilujícího kouzla
 * @param {Object} character - Postava
 * @param {Object} spell - Kouzlo
 * @param {Object} target - Cíl kouzla
 * @param {Object} result - Výsledek seslání kouzla
 */
function processBuffSpell(character, spell, target, result) {
  // Aplikace efektů
  if (spell.effects) {
    spell.effects.forEach(effect => {
      result.effects.push({
        type: effect.type,
        duration: effect.duration,
        value: effect.value
      });
      
      // Přidání efektu do seznamu aktivních efektů cíle
      if (!target.activeEffects) {
        target.activeEffects = [];
      }
      
      target.activeEffects.push({
        id: `${spell.id}_${effect.type}_${Date.now()}`,
        name: effect.name || spell.name,
        type: effect.type,
        value: effect.value,
        duration: effect.duration,
        remainingDuration: effect.duration,
        source: character.name
      });
    });
  }
  
  result.message = `${character.name} seslal ${spell.name} na ${target.name}.`;
}

/**
 * Zpracování oslabujícího kouzla
 * @param {Object} character - Postava
 * @param {Object} spell - Kouzlo
 * @param {Object} target - Cíl kouzla
 * @param {Object} result - Výsledek seslání kouzla
 */
function processDebuffSpell(character, spell, target, result) {
  // Kontrola, zda efekty mají být aplikovány (hod na záchranu)
  let effectsApplied = true;
  
  if (spell.savingThrow) {
    const dc = calculateSpellDC(character, spell);
    const saveRoll = rollDice('1d20');
    const saveBonus = getAttributeBonus(target[spell.savingThrow.attribute]);
    const totalSave = saveRoll + saveBonus;
    
    effectsApplied = totalSave < dc;
    
    result.savingThrow = {
      attribute: spell.savingThrow.attribute,
      dc: dc,
      roll: saveRoll,
      bonus: saveBonus,
      total: totalSave,
      success: !effectsApplied
    };
  }
  
  if (effectsApplied) {
    // Aplikace efektů
    if (spell.effects) {
      spell.effects.forEach(effect => {
        result.effects.push({
          type: effect.type,
          duration: effect.duration,
          value: effect.value
        });
        
        // Přidání efektu do seznamu aktivních efektů cíle
        if (!target.activeEffects) {
          target.activeEffects = [];
        }
        
        target.activeEffects.push({
          id: `${spell.id}_${effect.type}_${Date.now()}`,
          name: effect.name || spell.name,
          type: effect.type,
          value: effect.value,
          duration: effect.duration,
          remainingDuration: effect.duration,
          source: character.name
        });
      });
    }
    
    result.message = `${character.name} seslal ${spell.name} na ${target.name}.`;
  } else {
    result.message = `${character.name} seslal ${spell.name} na ${target.name}, ale ${target.name} odolal efektu.`;
  }
}

/**
 * Zpracování užitkového kouzla
 * @param {Object} character - Postava
 * @param {Object} spell - Kouzlo
 * @param {Object} target - Cíl kouzla
 * @param {Object} result - Výsledek seslání kouzla
 */
function processUtilitySpell(character, spell, target, result) {
  // Aplikace efektů
  if (spell.effects) {
    spell.effects.forEach(effect => {
      result.effects.push({
        type: effect.type,
        duration: effect.duration,
        value: effect.value
      });
    });
  }
  
  result.message = `${character.name} seslal ${spell.name}.`;
}

/**
 * Aktualizace aktivních efektů na konci kola
 * @param {Object} character - Postava
 * @returns {Object} - Výsledek aktualizace
 */
function updateActiveEffects(character) {
  if (!character.activeEffects || character.activeEffects.length === 0) {
    return { updated: false };
  }
  
  const result = {
    updated: true,
    expiredEffects: [],
    remainingEffects: []
  };
  
  // Projít všechny aktivní efekty
  character.activeEffects = character.activeEffects.filter(effect => {
    // Snížit zbývající dobu trvání
    effect.remainingDuration--;
    
    // Kontrola, zda efekt vypršel
    if (effect.remainingDuration <= 0) {
      result.expiredEffects.push(effect);
      return false;
    }
    
    result.remainingEffects.push(effect);
    return true;
  });
  
  return result;
}

/**
 * Získání seznamu kouzel pro dané povolání a úroveň
 * @param {string} characterClass - Povolání postavy
 * @param {number} level - Úroveň postavy
 * @returns {Array} - Seznam dostupných kouzel
 */
function getAvailableSpells(characterClass, level) {
  // Zde by byla logika pro načtení kouzel z databáze nebo JSON souboru
  // Pro jednoduchost vrátíme několik základních kouzel
  
  const basicSpells = [
    {
      id: 'magic_missile',
      name: 'Magická střela',
      level: 1,
      school: MAGIC_SCHOOLS.EVOCATION,
      type: SPELL_TYPES.ATTACK,
      targetType: TARGET_TYPES.SINGLE,
      manaCost: 3,
      damage: '1d4+1',
      damageType: 'force',
      requiresAttackRoll: false,
      description: 'Vystřelíš tři magické střely, které automaticky zasáhnou cíl a způsobí silové zranění.',
      allowedClasses: ['kouzelník', 'čaroděj'],
      minLevel: 1
    },
    {
      id: 'cure_wounds',
      name: 'Léčení ran',
      level: 1,
      school: MAGIC_SCHOOLS.EVOCATION,
      type: SPELL_TYPES.HEALING,
      targetType: TARGET_TYPES.SINGLE,
      manaCost: 3,
      healing: '1d8',
      description: 'Dotykem vyléčíš zranění cíle.',
      allowedClasses: ['klerik', 'druid', 'paladin', 'bard'],
      minLevel: 1
    },
    {
      id: 'shield',
      name: 'Štít',
      level: 1,
      school: MAGIC_SCHOOLS.ABJURATION,
      type: SPELL_TYPES.BUFF,
      targetType: TARGET_TYPES.SELF,
      manaCost: 2,
      effects: [
        {
          type: 'ac_bonus',
          value: 5,
          duration: 3
        }
      ],
      description: 'Vytvoříš neviditelný štít, který tě chrání před útoky.',
      allowedClasses: ['kouzelník', 'čaroděj'],
      minLevel: 1
    },
    {
      id: 'bless',
      name: 'Požehnání',
      level: 1,
      school: MAGIC_SCHOOLS.ENCHANTMENT,
      type: SPELL_TYPES.BUFF,
      targetType: TARGET_TYPES.MULTIPLE,
      manaCost: 3,
      effects: [
        {
          type: 'attack_bonus',
          value: 1,
          duration: 10
        },
        {
          type: 'saving_throw_bonus',
          value: 1,
          duration: 10
        }
      ],
      description: 'Požehnáš až třem tvorům, kteří získají bonus k útokům a záchranným hodům.',
      allowedClasses: ['klerik', 'paladin'],
      minLevel: 1
    },
    {
      id: 'sleep',
      name: 'Spánek',
      level: 1,
      school: MAGIC_SCHOOLS.ENCHANTMENT,
      type: SPELL_TYPES.DEBUFF,
      targetType: TARGET_TYPES.AREA,
      manaCost: 4,
      effects: [
        {
          type: 'sleep',
          duration: 10
        }
      ],
      savingThrow: {
        attribute: 'wisdom'
      },
      description: 'Způsobíš, že tvorové v oblasti usnou.',
      allowedClasses: ['kouzelník', 'čaroděj', 'bard'],
      minLevel: 1
    },
    {
      id: 'fireball',
      name: 'Ohnivá koule',
      level: 3,
      school: MAGIC_SCHOOLS.EVOCATION,
      type: SPELL_TYPES.ATTACK,
      targetType: TARGET_TYPES.AREA,
      manaCost: 8,
      damage: '8d6',
      damageType: 'fire',
      savingThrow: {
        attribute: 'dexterity',
        halfDamageOnSuccess: true
      },
      description: 'Vytvoříš ohnivou kouli, která exploduje a způsobí ohnivé zranění všem v oblasti.',
      allowedClasses: ['kouzelník', 'čaroděj'],
      minLevel: 5
    }
  ];
  
  // Filtrovat kouzla podle povolání a úrovně
  return basicSpells.filter(spell => {
    return spell.allowedClasses.includes(characterClass.toLowerCase()) && spell.minLevel <= level;
  });
}

/**
 * Získání detailů kouzla podle ID
 * @param {string} spellId - ID kouzla
 * @returns {Object|null} - Detail kouzla nebo null, pokud kouzlo neexistuje
 */
function getSpellDetails(spellId) {
  // Zde by byla logika pro načtení kouzla z databáze nebo JSON souboru
  // Pro jednoduchost vrátíme několik základních kouzel
  
  const basicSpells = [
    {
      id: 'magic_missile',
      name: 'Magická střela',
      level: 1,
      school: MAGIC_SCHOOLS.EVOCATION,
      type: SPELL_TYPES.ATTACK,
      targetType: TARGET_TYPES.SINGLE,
      manaCost: 3,
      damage: '1d4+1',
      damageType: 'force',
      requiresAttackRoll: false,
      description: 'Vystřelíš tři magické střely, které automaticky zasáhnou cíl a způsobí silové zranění.',
      allowedClasses: ['kouzelník', 'čaroděj'],
      minLevel: 1
    },
    {
      id: 'cure_wounds',
      name: 'Léčení ran',
      level: 1,
      school: MAGIC_SCHOOLS.EVOCATION,
      type: SPELL_TYPES.HEALING,
      targetType: TARGET_TYPES.SINGLE,
      manaCost: 3,
      healing: '1d8',
      description: 'Dotykem vyléčíš zranění cíle.',
      allowedClasses: ['klerik', 'druid', 'paladin', 'bard'],
      minLevel: 1
    },
    {
      id: 'shield',
      name: 'Štít',
      level: 1,
      school: MAGIC_SCHOOLS.ABJURATION,
      type: SPELL_TYPES.BUFF,
      targetType: TARGET_TYPES.SELF,
      manaCost: 2,
      effects: [
        {
          type: 'ac_bonus',
          value: 5,
          duration: 3
        }
      ],
      description: 'Vytvoříš neviditelný štít, který tě chrání před útoky.',
      allowedClasses: ['kouzelník', 'čaroděj'],
      minLevel: 1
    },
    {
      id: 'bless',
      name: 'Požehnání',
      level: 1,
      school: MAGIC_SCHOOLS.ENCHANTMENT,
      type: SPELL_TYPES.BUFF,
      targetType: TARGET_TYPES.MULTIPLE,
      manaCost: 3,
      effects: [
        {
          type: 'attack_bonus',
          value: 1,
          duration: 10
        },
        {
          type: 'saving_throw_bonus',
          value: 1,
          duration: 10
        }
      ],
      description: 'Požehnáš až třem tvorům, kteří získají bonus k útokům a záchranným hodům.',
      allowedClasses: ['klerik', 'paladin'],
      minLevel: 1
    },
    {
      id: 'sleep',
      name: 'Spánek',
      level: 1,
      school: MAGIC_SCHOOLS.ENCHANTMENT,
      type: SPELL_TYPES.DEBUFF,
      targetType: TARGET_TYPES.AREA,
      manaCost: 4,
      effects: [
        {
          type: 'sleep',
          duration: 10
        }
      ],
      savingThrow: {
        attribute: 'wisdom'
      },
      description: 'Způsobíš, že tvorové v oblasti usnou.',
      allowedClasses: ['kouzelník', 'čaroděj', 'bard'],
      minLevel: 1
    },
    {
      id: 'fireball',
      name: 'Ohnivá koule',
      level: 3,
      school: MAGIC_SCHOOLS.EVOCATION,
      type: SPELL_TYPES.ATTACK,
      targetType: TARGET_TYPES.AREA,
      manaCost: 8,
      damage: '8d6',
      damageType: 'fire',
      savingThrow: {
        attribute: 'dexterity',
        halfDamageOnSuccess: true
      },
      description: 'Vytvoříš ohnivou kouli, která exploduje a způsobí ohnivé zranění všem v oblasti.',
      allowedClasses: ['kouzelník', 'čaroděj'],
      minLevel: 5
    }
  ];
  
  // Najít kouzlo podle ID
  return basicSpells.find(spell => spell.id === spellId) || null;
}

module.exports = {
  MAGIC_SCHOOLS,
  SPELL_TYPES,
  TARGET_TYPES,
  hasEnoughMana,
  canCastSpell,
  calculateSpellDC,
  getSpellcastingAttribute,
  calculateSpellAttackBonus,
  castSpell,
  updateActiveEffects,
  getAvailableSpells,
  getSpellDetails
};
