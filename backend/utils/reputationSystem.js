/**
 * Systém reputace a frakcí pro Dračí doupě
 *
 * Tento modul obsahuje funkce pro práci s reputací hráče u různých frakcí.
 */

/**
 * Úrovně reputace
 */
const REPUTATION_LEVELS = {
  HATED: {
    name: 'hated',
    threshold: -100,
    description: 'Nenáviděný',
    effects: {
      prices: 2.0,
      dialogue: 'hostile',
      quests: false
    }
  },
  DISLIKED: {
    name: 'disliked',
    threshold: -50,
    description: 'Neoblíbený',
    effects: {
      prices: 1.5,
      dialogue: 'unfriendly',
      quests: false
    }
  },
  NEUTRAL: {
    name: 'neutral',
    threshold: 0,
    description: 'Neutrální',
    effects: {
      prices: 1.0,
      dialogue: 'neutral',
      quests: true
    }
  },
  LIKED: {
    name: 'liked',
    threshold: 50,
    description: 'Oblíbený',
    effects: {
      prices: 0.9,
      dialogue: 'friendly',
      quests: true
    }
  },
  RESPECTED: {
    name: 'respected',
    threshold: 100,
    description: 'Respektovaný',
    effects: {
      prices: 0.8,
      dialogue: 'respectful',
      quests: true
    }
  },
  HONORED: {
    name: 'honored',
    threshold: 150,
    description: 'Ctěný',
    effects: {
      prices: 0.7,
      dialogue: 'honored',
      quests: true
    }
  },
  EXALTED: {
    name: 'exalted',
    threshold: 200,
    description: 'Vyvýšený',
    effects: {
      prices: 0.6,
      dialogue: 'exalted',
      quests: true
    }
  }
};

/**
 * Inicializace reputace pro novou postavu
 * @param {Object} character - Postava
 * @param {Array} factions - Seznam frakcí
 * @returns {Object} - Postava s inicializovanou reputací
 */
function initializeCharacterReputation(character, factions) {
  // Kontrola, zda má postava inicializovanou reputaci
  if (!character.reputation) {
    character.reputation = {};
  }

  // Inicializace reputace pro každou frakci
  factions.forEach(faction => {
    if (!character.reputation[faction.id]) {
      character.reputation[faction.id] = {
        value: faction.baseAttitude === 'friendly' ? 50 :
               faction.baseAttitude === 'hostile' ? -50 : 0,
        level: getReputationLevel(faction.baseAttitude === 'friendly' ? 50 :
                                 faction.baseAttitude === 'hostile' ? -50 : 0)
      };
    }
  });

  return character;
}

/**
 * Získání úrovně reputace podle hodnoty
 * @param {number} value - Hodnota reputace
 * @returns {Object} - Úroveň reputace
 */
function getReputationLevel(value) {
  // Seřazení úrovní reputace podle prahu (od nejvyššího po nejnižší)
  const levels = Object.values(REPUTATION_LEVELS).sort((a, b) => b.threshold - a.threshold);

  // Nalezení první úrovně, jejíž práh je nižší nebo roven hodnotě reputace
  for (const level of levels) {
    if (value >= level.threshold) {
      return level;
    }
  }

  // Pokud není nalezena žádná úroveň, vrátit HATED
  return REPUTATION_LEVELS.HATED;
}

/**
 * Změna reputace u frakce
 * @param {Object} character - Postava
 * @param {string} factionId - ID frakce
 * @param {number} amount - Množství bodů k přidání (může být záporné)
 * @returns {Object} - Výsledek změny reputace
 */
function changeReputation(character, factionId, amount) {
  // Kontrola, zda má postava inicializovanou reputaci
  if (!character.reputation) {
    character.reputation = {};
  }

  // Kontrola, zda má postava reputaci u dané frakce
  if (!character.reputation[factionId]) {
    character.reputation[factionId] = {
      value: 0,
      level: REPUTATION_LEVELS.NEUTRAL
    };
  }

  // Aktuální hodnota reputace
  const currentValue = character.reputation[factionId].value;
  const currentLevel = character.reputation[factionId].level;

  // Nová hodnota reputace (omezená na rozsah -200 až 200)
  const newValue = Math.max(-200, Math.min(200, currentValue + amount));

  // Nová úroveň reputace
  const newLevel = getReputationLevel(newValue);

  // Aktualizace reputace
  character.reputation[factionId].value = newValue;
  character.reputation[factionId].level = newLevel;

  // Vytvoření výsledku
  const result = {
    success: true,
    faction: factionId,
    oldValue: currentValue,
    newValue: newValue,
    oldLevel: currentLevel,
    newLevel: newLevel,
    levelChanged: currentLevel.name !== newLevel.name
  };

  // Přidání zprávy
  if (amount > 0) {
    result.message = `Vaše reputace u frakce ${factionId} se zvýšila o ${amount} bodů.`;
  } else if (amount < 0) {
    result.message = `Vaše reputace u frakce ${factionId} se snížila o ${Math.abs(amount)} bodů.`;
  } else {
    result.message = `Vaše reputace u frakce ${factionId} se nezměnila.`;
  }

  // Přidání informace o změně úrovně
  if (result.levelChanged) {
    result.message += ` Vaše úroveň reputace se změnila na "${newLevel.description}".`;
  }

  return result;
}

/**
 * Získání reputace u frakce
 * @param {Object} character - Postava
 * @param {string} factionId - ID frakce
 * @returns {Object} - Reputace u frakce
 */
function getReputationWithFaction(character, factionId) {
  // Kontrola, zda má postava inicializovanou reputaci
  if (!character.reputation) {
    return {
      value: 0,
      level: REPUTATION_LEVELS.NEUTRAL
    };
  }

  // Kontrola, zda má postava reputaci u dané frakce
  if (!character.reputation[factionId]) {
    return {
      value: 0,
      level: REPUTATION_LEVELS.NEUTRAL
    };
  }

  return character.reputation[factionId];
}

/**
 * Výpočet cenového modifikátoru na základě reputace
 * @param {Object} character - Postava
 * @param {string} factionId - ID frakce
 * @returns {number} - Cenový modifikátor (1.0 = standardní cena)
 */
function getPriceModifier(character, factionId) {
  const reputation = getReputationWithFaction(character, factionId);
  return reputation.level.effects.prices;
}

/**
 * Kontrola, zda má postava dostatečnou reputaci pro úkol
 * @param {Object} character - Postava
 * @param {string} factionId - ID frakce
 * @param {number} requiredReputation - Požadovaná hodnota reputace
 * @returns {boolean} - Má dostatečnou reputaci?
 */
function hasRequiredReputation(character, factionId, requiredReputation) {
  const reputation = getReputationWithFaction(character, factionId);
  return reputation.value >= requiredReputation;
}

/**
 * Získání všech frakcí ze story dat
 * @param {Object} storyData - Data příběhu
 * @returns {Array} - Seznam frakcí
 */
function getFactionsFromStory(storyData) {
  return storyData.factions || [];
}

/**
 * Získání frakce podle ID
 * @param {Object} storyData - Data příběhu
 * @param {string} factionId - ID frakce
 * @returns {Object|null} - Frakce nebo null, pokud neexistuje
 */
function getFactionById(storyData, factionId) {
  const factions = getFactionsFromStory(storyData);
  return factions.find(faction => faction.id === factionId) || null;
}

/**
 * Získání frakce NPC
 * @param {Object} storyData - Data příběhu
 * @param {string} npcId - ID NPC
 * @returns {Object|null} - Frakce nebo null, pokud NPC nemá frakci
 */
function getNpcFaction(storyData, npcId) {
  const npc = storyData.npcs.find(n => n.id === npcId);
  if (!npc || !npc.faction) {
    return null;
  }

  return getFactionById(storyData, npc.faction);
}

/**
 * Získání vztahu mezi frakcemi
 * @param {Object} storyData - Data příběhu
 * @param {string} faction1Id - ID první frakce
 * @param {string} faction2Id - ID druhé frakce
 * @returns {string} - Vztah ('ally', 'enemy', 'neutral')
 */
function getFactionRelationship(storyData, faction1Id, faction2Id) {
  const faction1 = getFactionById(storyData, faction1Id);
  if (!faction1) {
    return 'neutral';
  }

  if (faction1.allies && faction1.allies.includes(faction2Id)) {
    return 'ally';
  }

  if (faction1.enemies && faction1.enemies.includes(faction2Id)) {
    return 'enemy';
  }

  return 'neutral';
}

/**
 * Získání modifikátoru reputace na základě vztahu frakcí
 * @param {Object} storyData - Data příběhu
 * @param {string} targetFactionId - ID cílové frakce
 * @param {string} affectedFactionId - ID ovlivněné frakce
 * @param {number} amount - Základní množství bodů
 * @returns {number} - Modifikované množství bodů
 */
function getReputationModifierFromRelationship(storyData, targetFactionId, affectedFactionId, amount) {
  const relationship = getFactionRelationship(storyData, targetFactionId, affectedFactionId);

  switch (relationship) {
    case 'ally':
      return Math.floor(amount * 0.5); // 50% reputace pro spojence
    case 'enemy':
      return Math.floor(amount * -0.5); // -50% reputace pro nepřátele
    default:
      return 0; // Žádná změna pro neutrální frakce
  }
}

/**
 * Změna reputace u frakce s ovlivněním spřátelených a nepřátelských frakcí
 * @param {Object} character - Postava
 * @param {Object} storyData - Data příběhu
 * @param {string} factionId - ID frakce
 * @param {number} amount - Množství bodů k přidání (může být záporné)
 * @returns {Object} - Výsledek změny reputace
 */
function changeReputationWithFactionRelationships(character, storyData, factionId, amount) {
  // Změna reputace u hlavní frakce
  const mainResult = changeReputation(character, factionId, amount);
  const results = [mainResult];

  // Získání všech frakcí
  const factions = getFactionsFromStory(storyData);

  // Změna reputace u spřátelených a nepřátelských frakcí
  factions.forEach(faction => {
    if (faction.id === factionId) {
      return; // Přeskočit hlavní frakci
    }

    const modifiedAmount = getReputationModifierFromRelationship(storyData, factionId, faction.id, amount);
    if (modifiedAmount !== 0) {
      const result = changeReputation(character, faction.id, modifiedAmount);
      results.push(result);
    }
  });

  return {
    success: true,
    mainResult: mainResult,
    relatedResults: results.slice(1)
  };
}

module.exports = {
  REPUTATION_LEVELS,
  initializeCharacterReputation,
  getReputationLevel,
  changeReputation,
  getReputationWithFaction,
  getPriceModifier,
  hasRequiredReputation,
  getFactionsFromStory,
  getFactionById,
  getNpcFaction,
  getFactionRelationship,
  getReputationModifierFromRelationship,
  changeReputationWithFactionRelationships
};
