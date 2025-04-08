const db = require('../config/db');
const storyService = require('../services/storyService');
const memoryService = require('../services/memoryService');
const gemini = require('../config/gemini'); // Přejmenováno pro přehlednost
const {
  updateCharacterStats,
  determineInitiative,
  processAttackType,
  getAttackBonus,
  calculateDamage,
  applyDamageToNPC,
  rollDice,
  checkSuccess
} = require('../utils/gameMechanics');

// --- Pomocné funkce ---

// Funkce pro aktualizaci zdraví a many postavy v databázi
async function updateCharacterStatsInDB(characterId, character, healthChange = 0, manaChange = 0) {
  try {
    // Aktualizace zdraví a many v databázi
    await db.query(
      'UPDATE characters SET current_health = GREATEST(0, LEAST(max_health, current_health + $1)), current_mana = GREATEST(0, LEAST(max_mana, current_mana + $2)) WHERE id = $3',
      [healthChange, manaChange, characterId]
    );

    // Aktualizace hodnot v objektu character pro další použití
    character.current_health = Math.max(0, Math.min(character.max_health, character.current_health + healthChange));
    character.current_mana = Math.max(0, Math.min(character.max_mana, character.current_mana + manaChange));

    return character;
  } catch (error) {
    console.error('Chyba při aktualizaci stavu postavy:', error);
    throw error;
  }
}

// Funkce pro sestavení kontextu pro AI (dle zadání 9.2)
async function buildContext(gameState, characterId, storyId) {
  const characterResult = await db.query('SELECT * FROM characters WHERE id = $1', [characterId]);
  const character = characterResult.rows[0];
  const storyData = await storyService.loadStoryById(storyId);
  const currentLocation = storyData.locations.find(loc => loc.id === gameState.currentLocationId);

  // Získat seznam NPC ID pro aktuální lokaci (základní + dynamicky přidané)
  let npcIdsInLocation = [...(currentLocation?.npcs || [])];
  if (gameState.locationNpcOverrides && gameState.locationNpcOverrides[gameState.currentLocationId]) {
    npcIdsInLocation = [...new Set([...npcIdsInLocation, ...gameState.locationNpcOverrides[gameState.currentLocationId]])]; // Unikátní seznam
  }

  // Načtení detailů NPC v lokaci a jejich aktuálního stavu (zdraví) z gameState
  const npcsInLocationDetails = npcIdsInLocation
    ?.map(npcId => {
      const npcData = storyData.npcs.find(n => n.id === npcId);
      if (!npcData) return null;
      const npcState = gameState.npcStates?.[npcId];
      const currentHealth = npcState?.current_health ?? npcData.stats?.health;
      return currentHealth > 0 ? { ...npcData, current_health: currentHealth } : null;
    })
    .filter(n => n);

  const npcsInLocationString = npcsInLocationDetails?.map(n => `${n.name} (HP: ${n.current_health ?? '?'})`).join(', ') || 'Nikdo';

  const recentlyDefeatedNpcs = Object.values(gameState.npcStates || {})
    .filter(state => state.defeated && npcIdsInLocation.includes(state.id)) // Jen ty v aktuální lokaci
    .map(state => state.name)
    .join(', ');

  const lastLoot = gameState.lastLoot ? `Našel jsi: ${gameState.lastLoot.join(', ')}.` : '';
  const triggeredEventInfo = gameState.triggeredEventDetails ? `Právě se stalo: ${gameState.triggeredEventDetails}` : ''; // Info o události a následcích

  const recentHistory = gameState.ai_history ? gameState.ai_history.slice(-6) : [];

  const activeQuestsString = gameState.activeQuests?.map(q => {
    const questDef = storyData.quests?.find(qd => qd.title === q.title);
    const totalObjectives = questDef?.objectives?.length || 0;
    const completedCount = q.completedObjectives ? Object.keys(q.completedObjectives).length : 0;
    return `${q.title} (${completedCount}/${totalObjectives} cílů splněno)`;
  }).join(', ') || 'Žádné';

  // Pokud je hra u konce, pošleme jen jednoduchý kontext
  if (gameState.gameOver) {
    return `--- HRA SKONČILA ---
Důvod: ${gameState.gameOverReason || 'Neznámý'}
Postava hráče: ${character.name} (Úroveň: ${character.level})
--- KONEC KONTEXTU ---

Jsi Pán jeskyně. Hra skončila. Napiš krátkou závěrečnou zprávu pro hráče.`;
  }

  const basePrompt = `Jsi Pán jeskyně (PJ) v RPG hře Dračí doupě. Tvým úkolem je vést hráče dobrodružstvím, popisovat svět, řídit nehráčské postavy (NPC) a udržovat pravidla hry. Řiď se následujícími instrukcemi:
1. Příběh: Vyprávěj příběh založený na scénáři '${storyData.metadata?.title || storyData.title}'. Drž se hlavní dějové linky, ale umožni hráči svobodná rozhodnutí. Použij informace z aktuální lokace a o přítomných NPC (včetně jejich aktuálního zdraví). Reaguj na změny zdraví NPC. Pokud je NPC poraženo (zdraví 0), popiš to a dále ho ignoruj. Zmiň předměty nebo zlato, které hráč našel u poraženého NPC (viz kontext "Našel jsi: ...").
 2. Pravidla: Používej pravidla Dračího doupěte pro řešení akcí, bojů a používání dovedností.
    - Hody kostkou hráče: Pokud je pro akci hráče potřeba hod kostkou (např. útok, dovednost), uveď v tagu <mechanics> typ hodu, CÍLOVÉ ČÍSLO (DC) nebo OČ protivníka (pokud je relevantní a známé) a VÝSLEDEK HODU KOSTKOU (bez bonusů). Backend vyhodnotí úspěch/neúspěch.
    - Důsledky hodu hráče: V tagu <description> nebo <action> popiš POUZE důsledek akce, která byla v PŘEDCHOZÍM kole vyhodnocena backendem jako ÚSPĚŠNÁ. Pokud byl předchozí hod neúspěšný, v <description> popiš jen situaci bez důsledku neúspěšné akce. NEAPLIKUJ zranění ani jiné mechanické efekty v <mechanics> - backend to řeší.
    - Akce NPC: Pokud nějaké ŽIVÉ NPC útočí na hráče, uveď to v tagu <action> (např. "<action>Goblin útočí na hráče!</action>"). NEHÁZEJ za NPC na útok ani neuváděj zranění v <mechanics> - backend to vyřeší. Popiš pouze akci NPC v <description>. Poražené NPC nemohou útočit.
    - Použití předmětů: Pokud hráč použije předmět, pouze popiš akci v <description>. Backend se postará o aplikaci efektu.
    - Ostatní mechaniky: Pokud postava utrpí zranění nebo se léčí (NE z útoku NPC, NE z použití předmětu hráčem), uveď to explicitně v tagu <mechanics>. Pokud akce stojí manu, uveď to v <mechanics>.
    - Akce ve světě: Pokud hráč přechází do jiné lokace, získá předmět (NE jako loot z NPC), přijme nebo splní CÍL úkolu, uveď to VŽDY v tagu <action>.
 3. Styl komunikace: Piš poutavě, používej barvité popisy prostředí, postav a situací. Střídej popisné pasáže s přímou řečí NPC (v tagu <npc name="...">). Používej formát odpovědi s tagy <description>, <npc>, <action>, <mechanics>, <options>.
 4. Pamatuj si: Udržuj kontinuitu příběhu na základě historie interakcí a výsledků předchozích hodů kostkou.
5. Nehráčské postavy: Dej každé NPC unikátní osobnost dle popisu. Nech je reagovat na situaci. Poražené NPC jsou mimo hru.
6. Výzvy: Vytvářej vyvážené výzvy odpovídající úrovni postavy (${character.level}).
7. Adaptace: Přizpůsobuj příběh podle akcí hráče. Reaguj na neočekávané situace kreativně.
8. Herní mechaniky: Atributy postavy jsou: Síla:${character.strength}, Obratnost:${character.dexterity}, Odolnost:${character.constitution}, Inteligence:${character.intelligence}, Moudrost:${character.wisdom}, Charisma:${character.charisma}. Backend vyhodnocuje úspěšnost hodů a aplikuje mechanické důsledky.
9. Formát odpovědi: VŽDY odpověz pomocí XML-like tagů: <description>...</description>, <npc name="...">...</npc> (pro každou mluvící NPC), <action>...</action> (pokud se něco stane), <mechanics>...</mechanics> (pro hody kostkou hráče nebo jiné mechaniky), <options>...</options> (návrhy možných akcí).`;

  // Získání popisu lokace (s případnou modifikací)
  let locationDescription = currentLocation?.description || 'Žádný popis';
  if (gameState.locationStates?.[gameState.currentLocationId]?.description_suffix) {
    locationDescription += gameState.locationStates[gameState.currentLocationId].description_suffix;
  }


  const context = `
--- KONTEXT HRY ---
Příběh: ${storyData.metadata?.title || storyData.title} (${storyData.metadata?.description || storyData.description})
Aktuální lokace: ${currentLocation?.name || 'Neznámá'} (${locationDescription})
Přítomné (živé) NPC: ${npcsInLocationString}
${recentlyDefeatedNpcs ? `Nedávno poražené NPC: ${recentlyDefeatedNpcs}\n` : ''}
${lastLoot ? `${lastLoot}\n` : ''}
${triggeredEventInfo ? `${triggeredEventInfo}\n` : ''}
Postava hráče: ${character.name} (Rasa: ${character.race}, Třída: ${character.class}, Úroveň: ${character.level}, Zdraví: ${character.current_health}/${character.max_health}, Mana: ${character.current_mana}/${character.max_mana}, Zlato: ${character.gold})
Aktivní úkoly: ${activeQuestsString}
${gameState.lastDiceRoll ? `Poslední hod kostkou: ${gameState.lastDiceRoll.dice} = ${gameState.lastDiceRoll.result}${gameState.lastDiceRoll.success !== undefined ? (gameState.lastDiceRoll.success ? ' (Úspěch)' : ' (Neúspěch)') : ''}\n` : ''}
Poslední interakce:
${recentHistory.map(h => `${h.role === 'user' ? 'Hráč' : 'PJ'}: ${h.parts[0].text}`).join('\n')}
--- KONEC KONTEXTU ---

${basePrompt}
`;
  return context.trim();
}

// Funkce pro parsování odpovědi AI (dle zadání 9.3)
function parseAIResponse(response) {
  const result = {
    description: null,
    npcs: [],
    actions: [],
    mechanics: null,
    options: []
  };

  try {
    const descriptionMatch = response.match(/<description>([\s\S]*?)<\/description>/);
    if (descriptionMatch) result.description = descriptionMatch[1].trim();

    const npcMatches = response.matchAll(/<npc name="(.*?)">([\s\S]*?)<\/npc>/g);
    for (const match of npcMatches) {
      result.npcs.push({ name: match[1].trim(), dialogue: match[2].trim() });
    }

    // Detekce akcí v tagu <action>
    const actionMatches = response.matchAll(/<action>([\s\S]*?)<\/action>/g);
    for (const match of actionMatches) {
      result.actions.push(match[1].trim());
    }

    // Detekce akcí v popisu (např. přijetí úkolu)
    if (result.description) {
      const questAcceptInDescription = result.description.match(/přijímáš úkol ['"]?(.*?)['"]?[.!]/i) ||
                                      result.description.match(/získáváš úkol ['"]?(.*?)['"]?[.!]/i) ||
                                      result.description.match(/nový úkol: ['"]?(.*?)['"]?[.!]/i);

      if (questAcceptInDescription && questAcceptInDescription[1]) {
        const questAction = `přijímá úkol '${questAcceptInDescription[1].trim()}'`;
        console.log(`Detekce přijetí úkolu v popisu: ${questAction}`);
        result.actions.push(questAction);
      }
    }

    const mechanicsMatch = response.match(/<mechanics>([\s\S]*?)<\/mechanics>/);
    if (mechanicsMatch) result.mechanics = mechanicsMatch[1].trim();

    const optionsMatch = response.match(/<options>([\s\S]*?)<\/options>/);
    if (optionsMatch) {
      result.options = optionsMatch[1]
        .split('\n')
        .map(line => line.replace(/^- /, '').trim())
        .filter(line => line.length > 0);
    }

    if (!result.description && result.npcs.length === 0 && result.actions.length === 0 && !result.mechanics && result.options.length === 0) {
      console.warn('Odpověď AI neobsahovala očekávané tagy, vracím jako description.');
      result.description = response.trim();
    }

  } catch (parseError) {
    console.error('Chyba při parsování odpovědi AI:', parseError);
    result.description = response.trim();
  }

  return result;
}

// Funkce pro výpočet bonusu z atributu (jednoduchá verze DrD)
function getAttributeBonus(attributeValue) {
  const val = parseInt(attributeValue, 10);
  if (isNaN(val)) return 0;
  return Math.floor((val - 10) / 2);
}

// Funkce pro hod kostkou je importována z gameMechanics.js


// --- Controller funkce ---

// Zahájení nové hry nebo pokračování existující pro danou postavu
const startGame = async (req, res) => {
  const userId = req.user.userId;
  const { characterId, storyId } = req.body;

  if (!characterId || !storyId) {
    return res.status(400).json({ message: 'Chybí ID postavy nebo ID příběhu.' });
  }

  try {
    const charCheck = await db.query('SELECT * FROM characters WHERE id = $1 AND user_id = $2', [characterId, userId]);
    if (charCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Tato postava nepatří přihlášenému uživateli.' });
    }

    let sessionResult = await db.query('SELECT * FROM game_sessions WHERE character_id = $1', [characterId]);

    if (sessionResult.rows.length > 0) {
      // Kontrola, zda existující sezení je pro stejný příběh
      const existingSession = sessionResult.rows[0];

      if (existingSession.story_id === storyId) {
        // Pokud je to stejný příběh, pokračujeme v existujícím sezení
        console.log(`Pokračuje se v existujícím sezení pro postavu ${characterId} a příběh ${storyId}`);
        return res.status(200).json({
          message: 'Pokračuje se v existujícím herním sezení.',
          session: existingSession
        });
      } else {
        // Pokud je to jiný příběh, smažeme existující sezení a vytvoříme nové
        console.log(`Mažu existující sezení pro postavu ${characterId} a vytvářím nové pro příběh ${storyId}`);
        await db.query('DELETE FROM game_sessions WHERE character_id = $1', [characterId]);
      }
    }

    const storyData = await storyService.loadStoryById(storyId);
    if (!storyData) {
      return res.status(404).json({ message: `Příběh s ID '${storyId}' nebyl nalezen.` });
    }

    // Aktualizace zlata postavy podle startingGold v příběhu
    if (storyData.initialSetup && storyData.initialSetup.startingGold) {
      const character = charCheck.rows[0];
      // Aktualizujeme zlato pouze pokud je to nové sezení nebo jiný příběh
      await db.query('UPDATE characters SET gold = $1 WHERE id = $2',
        [storyData.initialSetup.startingGold, characterId]);
      console.log(`Zlato postavy ${characterId} nastaveno na ${storyData.initialSetup.startingGold} podle příběhu ${storyId}`);
    }

    const initialGameState = {
      storyId: storyId,
      storyTitle: storyData.metadata?.title || storyData.title,
      currentLocationId: storyData.initialSetup.startingLocation,
      activeQuests: [],
      npcStates: {},
      eventHistory: [],
      lastPlayerAction: null,
      lastAIResponse: parseAIResponse(storyData.initialSetup.introduction),
      memory_summary: null,
      last_summarized_history_length: 0
    };

    const initialAIHistory = [
      { role: 'model', parts: [{ text: storyData.initialSetup.introduction }] }
    ];

    sessionResult = await db.query(
      `INSERT INTO game_sessions (story_id, character_id, user_id, game_state, ai_history)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [storyId, characterId, userId, JSON.stringify(initialGameState), JSON.stringify(initialAIHistory)]
    );

    console.log(`Nové herní sezení vytvořeno pro postavu ${characterId} a příběh ${storyId}`);
    res.status(201).json({
      message: 'Nové herní sezení úspěšně vytvořeno.',
      session: sessionResult.rows[0]
    });

  } catch (error) {
    console.error('Chyba při zahajování hry:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Pro tuto postavu již existuje aktivní herní sezení.' });
    }
    res.status(500).json({ message: 'Interní chyba serveru při zahajování hry.' });
  }
};

// Funkce pro zpracování souboje s iniciativou
async function processCombat(gameState, character, npcs, storyData) {
  // Pokud není aktivní souboj, vytvoříme nový
  if (!gameState.combat || !gameState.combat.active) {
    // Vytvoříme nový souboj
    const combatOrder = determineInitiative(character, npcs);

    gameState.combat = {
      active: true,
      round: 1,
      turnIndex: 0,
      combatants: combatOrder,
      npcs: npcs.map(npc => ({
        id: npc.id,
        name: npc.name,
        currentHealth: npc.stats.health,
        maxHealth: npc.stats.health,
        defeated: false
      }))
    };

    return {
      newCombat: true,
      message: `Zahájen souboj! Pořadí: ${combatOrder.map(c => c.name).join(', ')}.`,
      currentTurn: combatOrder[0].id
    };
  }

  // Pokud je souboj již aktivní, posuneme se na další kolo nebo ukončíme souboj
  gameState.combat.turnIndex++;

  // Pokud jsme prošli všemi účastníky, začíná nové kolo
  if (gameState.combat.turnIndex >= gameState.combat.combatants.length) {
    gameState.combat.round++;
    gameState.combat.turnIndex = 0;
  }

  // Kontrola, zda jsou všechna NPC poražena
  const allNpcsDefeated = gameState.combat.npcs.every(npc => npc.defeated);
  if (allNpcsDefeated) {
    gameState.combat.active = false;
    return {
      combatEnded: true,
      message: 'Všichni nepřátelé byli poraženi!'
    };
  }

  // Kontrola, zda je hráč poražen
  if (character.current_health <= 0) {
    gameState.combat.active = false;
    return {
      combatEnded: true,
      playerDefeated: true,
      message: 'Byl jsi poražen v souboji!'
    };
  }

  // Vrátíme informace o aktuálním tahu
  const currentCombatant = gameState.combat.combatants[gameState.combat.turnIndex];
  return {
    currentTurn: currentCombatant.id,
    round: gameState.combat.round,
    message: `Kolo ${gameState.combat.round}: Na tahu je ${currentCombatant.name}.`
  };
}

// Zpracování akce hráče
const handlePlayerAction = async (req, res) => {
  const userId = req.user.userId;
  const sessionId = req.params.sessionId;
  const { action, target, attackType } = req.body;

  if (!action) {
    return res.status(400).json({ message: 'Chybí text akce hráče.' });
  }

  try {
    // 1. Načíst aktuální sezení, postavu a ověřit vlastníka
    const sessionResult = await db.query('SELECT * FROM game_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Herní sezení nenalezeno nebo nepatří tomuto uživateli.' });
    }
    let currentSession = sessionResult.rows[0];
    let gameState = currentSession.game_state;
    let aiHistory = currentSession.ai_history;

    if (gameState.gameOver) {
      console.log(`Pokus o akci ve skončené hře (sezení ${sessionId}).`);
      return res.status(400).json({ message: `Hra již skončila: ${gameState.gameOverReason}` });
    }

    delete gameState.lastLoot;
    delete gameState.triggeredEventDetails;

    const characterResult = await db.query('SELECT * FROM characters WHERE id = $1', [currentSession.character_id]);
    if (characterResult.rows.length === 0) {
      throw new Error(`Postava s ID ${currentSession.character_id} pro sezení ${sessionId} nenalezena.`);
    }
    const character = characterResult.rows[0];

    // --- Zpracování akce PŘED voláním AI ---
    let actionProcessedByBackend = false;
    let backendActionResult = null;

    // Zpracování souboje, pokud je aktivní
    if (gameState.combat && gameState.combat.active) {
      const currentCombatant = gameState.combat.combatants[gameState.combat.turnIndex];

      // Kontrola, zda je na tahu hráč
      if (currentCombatant.id === 'player') {
        console.log(`[Combat] Hráč je na tahu v kole ${gameState.combat.round}.`);

        // Detekce útoku z textu akce
        const attackMatch = action.match(/\b(rychlý|silný|obranný)?\s*útok\b.*?(?:na|proti)\s+([^\.,]+)/i);
        if (attackMatch) {
          const attackType = attackMatch[1] ? attackMatch[1].toLowerCase() : 'normální';
          const targetName = attackMatch[2].trim();

          console.log(`[Combat] Detekce útoku typu '${attackType}' na cíl '${targetName}'.`);

          // Najdeme cíl útoku v seznamu NPC v souboji
          const targetNpc = gameState.combat.npcs.find(npc =>
            npc.name.toLowerCase() === targetName.toLowerCase() && !npc.defeated
          );

          if (targetNpc) {
            // Zpracování útoku
            const attackModifiers = processAttackType(attackType, character, null);
            const attackRoll = rollDice('1d20') + attackModifiers.attackBonus;
            const targetAC = 12; // Základní hodnota, v reálné implementaci by byla získána z NPC

            const hit = attackRoll >= targetAC;

            if (hit) {
              // Výpočet zranění
              let damageDice = '1d4';
              switch (character.class) {
                case 'Bojovník': damageDice = '1d8'; break;
                case 'Hraničář': damageDice = '1d8'; break;
                case 'Zloděj': damageDice = '1d6'; break;
                case 'Klerik': damageDice = '1d6'; break;
              }

              const damageRoll = rollDice(damageDice);
              const strengthBonus = getAttributeBonus(character.strength);
              const totalDamage = Math.max(1, damageRoll + strengthBonus + attackModifiers.damageBonus);

              // Aplikace zranění NPC
              targetNpc.currentHealth -= totalDamage;
              if (targetNpc.currentHealth <= 0) {
                targetNpc.currentHealth = 0;
                targetNpc.defeated = true;
              }

              // Uložení výsledku útoku
              backendActionResult = {
                success: true,
                message: `Zasáhl jsi ${targetNpc.name} za ${totalDamage} zranění! ${targetNpc.defeated ? targetNpc.name + ' byl poražen!' : ''}`,
                combatAction: true,
                attackType,
                attackRoll,
                damage: totalDamage,
                targetName: targetNpc.name,
                targetDefeated: targetNpc.defeated
              };

              actionProcessedByBackend = true;
            } else {
              // Útok minul
              backendActionResult = {
                success: false,
                message: `Tvůj útok na ${targetNpc.name} minul!`,
                combatAction: true,
                attackType,
                attackRoll,
                targetName: targetNpc.name
              };

              actionProcessedByBackend = true;
            }

            // Posun na dalšího účastníka v souboji
            const combatResult = processCombat(gameState, character, [], null);
            if (combatResult.combatEnded) {
              backendActionResult.message += ` ${combatResult.message}`;
            }
          }
        }
      } else {
        // Pokud není na tahu hráč, vrátíme chybu
        backendActionResult = {
          success: false,
          message: `Není tvůj tah! Na tahu je ${currentCombatant.name}.`,
          combatAction: true
        };

        actionProcessedByBackend = true;
      }
    }

    const useItemMatch = action.match(/použij (.*?)(?:\.|$)/i);
    if (useItemMatch && useItemMatch[1]) {
      const itemName = useItemMatch[1].trim();
      console.log(`[Backend Action] Pokus o použití předmětu: ${itemName}`);
      backendActionResult = await useItemFromInventory(currentSession.character_id, itemName);
      if (backendActionResult?.success) {
        actionProcessedByBackend = true;
        if (backendActionResult.healthGained) {
          character.current_health = Math.min(character.current_health + backendActionResult.healthGained, character.max_health);
        }
        gameState.lastPlayerAction = action;
        gameState.lastAIResponse = {
          description: backendActionResult?.message || 'Akce provedena.',
          npcs: [], actions: [], mechanics: null, options: []
        };
        finalAIHistory = [...aiHistory, { role: 'user', parts: [{ text: action }] }, { role: 'model', parts: [{ text: `<description>${gameState.lastAIResponse.description}</description>` }] }];
      } else {
        console.log(`[Backend Action] Předmět ${itemName} nenalezen nebo nelze použít.`);
      }
    }

    // --- Volání AI (pokud akci nezpracoval backend) ---
    let parsedAIResponse;

    if (!actionProcessedByBackend) {
      // 2. Sestavit kontext a prompt pro AI
      const context = await buildContext(gameState, currentSession.character_id, currentSession.story_id);
      const playerActionTextForAI = target ? `${action} (cíl: ${target})` : action;
      const prompt = `${context}\n\nAkce hráče: ${playerActionTextForAI}\n\nOdpověz jako Pán jeskyně ve stanoveném formátu tagů.`;
      const currentAIHistory = [...aiHistory, { role: 'user', parts: [{ text: playerActionTextForAI }] }];

      // 3. Odeslat prompt do Gemini AI
      if (!gemini.model) throw new Error('Gemini model není inicializován.');
      const historyForAI = currentAIHistory.slice(-10);
      const messages = [...historyForAI.map(h => ({ role: h.role, parts: h.parts })), { role: 'user', parts: [{ text: prompt }] }];
      const aiResult = await gemini.model.generateContent({ contents: messages });
      const aiResponseText = aiResult.response.text();

      // 4. Zpracovat odpověď AI
      console.log('Odpověď AI před parsováním:', aiResponseText);
      parsedAIResponse = parseAIResponse(aiResponseText);
      console.log('Parsovaná odpověď AI:', JSON.stringify(parsedAIResponse));

      // 5. Aktualizovat gameState na základě odpovědi AI
      gameState.lastPlayerAction = action;
      gameState.lastAIResponse = parsedAIResponse;
      finalAIHistory = [...currentAIHistory, { role: 'model', parts: [{ text: aiResponseText }] }];

      // Zpracování akcí z AI odpovědi
      let newLocationId = null;
      let npcAttackers = [];
      if (parsedAIResponse.actions && parsedAIResponse.actions.length > 0) {
        const storyDataForActions = await storyService.loadStoryById(currentSession.story_id);

        for (const aiActionText of parsedAIResponse.actions) {
          const locationChangeMatch = aiActionText.match(/přechází do lokace '(.*?)'/i);
          if (locationChangeMatch && locationChangeMatch[1]) {
            newLocationId = locationChangeMatch[1].trim();
            console.log(`AI indikovalo změnu lokace na: ${newLocationId}`);
          }

          const itemGainMatch = aiActionText.match(/(získává|nachází|bere si) (.*?)(?:\.|$)/i);
          if (itemGainMatch && itemGainMatch[2]) {
            const itemName = itemGainMatch[2].trim();
            console.log(`AI indikovalo získání předmětu: ${itemName}`);
            await addItemToInventory(currentSession.character_id, itemName);
          }

          const questAcceptMatch = aiActionText.match(/přijímá úkol ['"]?(.*?)['"]?/i) || aiActionText.match(/získává úkol ['"]?(.*?)['"]?/i) || aiActionText.match(/nový úkol: ['"]?(.*?)['"]?/i);
          if (questAcceptMatch && questAcceptMatch[1]) {
            const questTitle = questAcceptMatch[1].trim();
            if (!gameState.activeQuests) gameState.activeQuests = [];
            if (!gameState.activeQuests.some(q => q.title === questTitle)) {
              console.log(`AI indikovalo přijetí úkolu: ${questTitle}`);
              console.log(`Aktuální aktivní úkoly před přidáním:`, JSON.stringify(gameState.activeQuests));

              // Detailní logování dat příběhu
              console.log(`Počet úkolů v datech příběhu:`, storyDataForActions?.quests?.length || 0);
              if (storyDataForActions?.quests) {
                console.log(`Názvy všech úkolů v příběhu:`, storyDataForActions.quests.map(q => q.title));
              }

              const questDefinition = storyDataForActions?.quests?.find(q => q.title === questTitle);
              if (questDefinition) {
                console.log(`Nalezena definice úkolu:`, JSON.stringify(questDefinition));
                gameState.activeQuests.push({
                  id: questDefinition.id,
                  title: questTitle,
                  type: questDefinition.type || 'main', // Přidání typu úkolu
                  completedObjectives: {}
                });
              } else {
                console.warn(`Nenalezena definice pro přijímaný úkol '${questTitle}'. Ukládám jen název.`);
                // Pokus o nalezení úkolu podle částečné shody
                const similarQuest = storyDataForActions?.quests?.find(q =>
                  q.title.toLowerCase().includes(questTitle.toLowerCase()) ||
                  questTitle.toLowerCase().includes(q.title.toLowerCase())
                );

                if (similarQuest) {
                  console.log(`Nalezen podobný úkol:`, JSON.stringify(similarQuest));
                  gameState.activeQuests.push({
                    id: similarQuest.id,
                    title: similarQuest.title,
                    type: similarQuest.type || 'main',
                    completedObjectives: {}
                  });
                } else {
                  gameState.activeQuests.push({
                    title: questTitle,
                    type: 'side', // Výchozí typ pro úkoly bez definice
                    completedObjectives: {}
                  });
                }
              }

              console.log(`Aktuální aktivní úkoly po přidání:`, JSON.stringify(gameState.activeQuests));
            }
          }

          const objectiveCompleteMatch = aiActionText.match(/splnil cíl '(.*?)' úkolu '(.*?)'/i);
          if (objectiveCompleteMatch && objectiveCompleteMatch[1] && objectiveCompleteMatch[2]) {
            const objectiveId = objectiveCompleteMatch[1].trim();
            const questTitle = objectiveCompleteMatch[2].trim();
            const questIndex = gameState.activeQuests?.findIndex(q => q.title === questTitle);

            if (questIndex > -1 && !gameState.activeQuests[questIndex].completedObjectives[objectiveId]) {
              console.log(`AI indikovalo splnění cíle '${objectiveId}' úkolu '${questTitle}'.`);
              if (!gameState.activeQuests[questIndex].completedObjectives) {
                gameState.activeQuests[questIndex].completedObjectives = {};
              }
              gameState.activeQuests[questIndex].completedObjectives[objectiveId] = true;

              const questDefinition = storyDataForActions?.quests?.find(q => q.title === questTitle);
              const allObjectives = questDefinition?.objectives?.map(o => o.id) || [];
              const completedObjectives = Object.keys(gameState.activeQuests[questIndex].completedObjectives);

              if (allObjectives.length > 0 && allObjectives.every(objId => completedObjectives.includes(objId))) {
                console.log(`Všechny cíle úkolu '${questTitle}' splněny!`);
                if (questDefinition?.rewards) {
                  await applyQuestRewards(currentSession.character_id, character, questDefinition.rewards);
                } else {
                  console.warn(`Nenalezena definice nebo odměny pro úkol '${questTitle}' v datech příběhu.`);
                }
                gameState.activeQuests.splice(questIndex, 1);
              }
            }
          }

          const npcAttackMatch = aiActionText.match(/(.*?) útočí na hráče/i);
          if (npcAttackMatch && npcAttackMatch[1]) {
            const npcName = npcAttackMatch[1].trim();
            console.log(`AI indikovalo útok NPC: ${npcName}`);
            npcAttackers.push(npcName);
          }

        }
      }
      if (newLocationId) {
        gameState.currentLocationId = newLocationId;
      }

      // Zpracovat tag <mechanics>
      let healthChange = 0;
      let manaChange = 0;
      let diceRollResult = null;
      let wasPlayerDiceRollSuccess = null;

      if (parsedAIResponse.mechanics) {
        const mechanicsText = parsedAIResponse.mechanics;

        // Zpracování hodu kostkou hráče
        const playerDiceRollMatch = mechanicsText.match(/Hod k(\d+)(?: na (.*?))?(?: proti (.*?))?(?: \(DC (\d+)\)| \(OČ (\d+)\))?: výsledek (\d+)/i);
        if (playerDiceRollMatch) {
          const diceType = `k${playerDiceRollMatch[1]}`;
          const rollResult = parseInt(playerDiceRollMatch[6], 10);
          const rollType = playerDiceRollMatch[2] ? playerDiceRollMatch[2].trim().toLowerCase() : null;
          const targetNameFromAI = playerDiceRollMatch[3] ? playerDiceRollMatch[3].trim() : null;
          const finalTargetName = targetNameFromAI || target;

          let dcValue = playerDiceRollMatch[4] ? parseInt(playerDiceRollMatch[4], 10) : (playerDiceRollMatch[5] ? parseInt(playerDiceRollMatch[5], 10) : null);
          if (dcValue === null && finalTargetName && rollType?.includes('útok')) {
            const storyDataForDC = await storyService.loadStoryById(currentSession.story_id);
            const targetNpcDef = storyDataForDC?.npcs?.find(n => n.name === finalTargetName);
            if (targetNpcDef && !(gameState.npcStates?.[targetNpcDef.id]?.defeated)) {
              dcValue = targetNpcDef.stats?.ac || 12;
            } else {
              console.log(`Cíl útoku '${finalTargetName}' nenalezen nebo je poražen.`);
              dcValue = 999;
            }
          } else if (dcValue === null) {
            dcValue = 12;
          }

          let attributeValue = 10;
          let bonus = 0;
          if (rollType?.includes('útok') || rollType?.includes('sílu')) { attributeValue = character.strength; bonus = getAttributeBonus(attributeValue); }
          else if (rollType?.includes('obratnost') || rollType?.includes('zručnost')) { attributeValue = character.dexterity; bonus = getAttributeBonus(attributeValue); }
          else if (rollType?.includes('odolnost')) { attributeValue = character.constitution; bonus = getAttributeBonus(attributeValue); }
          else if (rollType?.includes('inteligenci')) { attributeValue = character.intelligence; bonus = getAttributeBonus(attributeValue); }
          else if (rollType?.includes('moudrost')) { attributeValue = character.wisdom; bonus = getAttributeBonus(attributeValue); }
          else if (rollType?.includes('charisma')) { attributeValue = character.charisma; bonus = getAttributeBonus(attributeValue); }

          wasPlayerDiceRollSuccess = (rollResult + bonus) >= dcValue;

          diceRollResult = { dice: diceType, type: rollType, target: finalTargetName, result: rollResult, bonus: bonus, dc: dcValue, success: wasPlayerDiceRollSuccess };
          console.log(`Mechaniky Hráče: Zaznamenán hod ${diceRollResult.dice}${diceRollResult.type ? ' na ' + diceRollResult.type : ''}${diceRollResult.target ? ' proti ' + diceRollResult.target : ''}=${diceRollResult.result} (Bonus: ${bonus}, DC: ${dcValue}, Výsledek: ${wasPlayerDiceRollSuccess ? 'Úspěch' : 'Neúspěch'}).`);

          gameState.lastDiceRoll = diceRollResult;

          // Aplikovat zranění NPC POUZE pokud jde o úspěšný útok hráče na platný cíl
          if (rollType?.includes('útok') && wasPlayerDiceRollSuccess && dcValue < 999) {
            let damageDice = '1d4';
            switch (character.class) {
            case 'Bojovník': damageDice = '1d8'; break;
            case 'Hraničář': damageDice = '1d8'; break;
            case 'Zloděj': damageDice = '1d6'; break;
            case 'Klerik': damageDice = '1d6'; break;
            }

            // Zpracování různých typů útoků
            let attackModifiers = { damageBonus: 0 };

            // Detekce typu útoku z textu akce
            const attackTypeMatch = action.match(/\b(rychlý|silný|obranný)\s+útok\b/i);
            const detectedAttackType = attackTypeMatch ? attackTypeMatch[1].toLowerCase() : null;

            // Použití explicitně zadaného typu útoku nebo detekovaného z textu
            const finalAttackType = attackType || detectedAttackType || 'normální';

            // Získání modifikátorů podle typu útoku
            attackModifiers = processAttackType(finalAttackType, character, null);
            console.log(`Použit typ útoku: ${finalAttackType}, modifikátory:`, attackModifiers);

            const damageRoll = rollDice(damageDice);
            const strengthBonus = getAttributeBonus(character.strength);
            const totalDamage = Math.max(1, damageRoll + strengthBonus + attackModifiers.damageBonus);

            if (diceRollResult.target) {
              await applyDamageToNPC(gameState, currentSession.story_id, diceRollResult.target, totalDamage, currentSession.character_id);

              // Přidání informace o typu útoku do gameState
              if (!gameState.lastAttack) gameState.lastAttack = {};
              gameState.lastAttack = {
                type: finalAttackType,
                target: diceRollResult.target,
                damage: totalDamage,
                roll: diceRollResult.result,
                success: true
              };
            } else {
              console.warn('Úspěšný útok hráče, ale cíl nebyl specifikován.');
            }
          }

        } else {
          delete gameState.lastDiceRoll;
        }

        // Zpracování zranění/léčení hráče (NE z útoku hráče, NE z použití předmětu)
        const damageMatch = mechanicsText.match(/hráč ztrácí (\d+) život(ů|y)/i);
        if (damageMatch && damageMatch[1]) {
          healthChange -= parseInt(damageMatch[1], 10);
          console.log(`Mechaniky: Postava utrpěla zranění ${parseInt(damageMatch[1], 10)} HP (mimo hod/použití předmětu).`);
        }
        const healMatch = mechanicsText.match(/hráč (získává|léčí si) (\d+) život(ů|y)/i);
        if (healMatch && healMatch[2]) {
          healthChange += parseInt(healMatch[2], 10);
          console.log(`Mechaniky: Postava se vyléčila o ${parseInt(healMatch[2], 10)} HP (mimo hod/použití předmětu).`);
        }

        // Zpracování spotřeby many
        const manaCostMatch = mechanicsText.match(/(stojí|spotřebuje) (\d+) man(y|u)/i);
        if (manaCostMatch && manaCostMatch[2]) {
          if (wasPlayerDiceRollSuccess === true || wasPlayerDiceRollSuccess === null) {
            manaChange -= parseInt(manaCostMatch[2], 10);
            console.log(`Mechaniky: Akce spotřebovala ${parseInt(manaCostMatch[2], 10)} many.`);
          } else {
            console.log(`Mechaniky: Mana ${parseInt(manaCostMatch[2], 10)} nebyla spotřebována (Neúspěšný hod).`);
          }
        }

        // Zpracování získání many
        const manaGainMatch = mechanicsText.match(/získává (\d+) man(y|u)/i);
        if (manaGainMatch && manaGainMatch[1]) {
          manaChange += parseInt(manaGainMatch[1], 10);
          console.log(`Mechaniky: Postava získala ${parseInt(manaGainMatch[1], 10)} many.`);
        }
      } else {
        delete gameState.lastDiceRoll;
      }

      // --- Zpracování útoků NPC (po AI odpovědi) ---
      if (npcAttackers.length > 0) {
        const storyDataForNpcAttack = await storyService.loadStoryById(currentSession.story_id);
        const playerAC = 10 + getAttributeBonus(character.dexterity);
        console.log(`[NPC Attacks] Hráčovo OČ: ${playerAC}`);

        for (const attackerName of npcAttackers) {
          const npcDef = storyDataForNpcAttack?.npcs?.find(n => n.name === attackerName);
          if (!npcDef || gameState.npcStates?.[npcDef.id]?.defeated) {
            console.log(`[NPC Attacks] Útočník ${attackerName} nenalezen nebo je poražen.`);
            continue;
          }

          const npcRoll = Math.floor(Math.random() * 20) + 1;
          const npcAttackBonus = npcDef.stats?.attackBonus || 0;
          let npcAttributeBonusAttack = 0;
          if (npcDef.stats?.damageDice?.includes('d4')) {
            npcAttributeBonusAttack = getAttributeBonus(npcDef.stats?.dexterity || 10);
          } else {
            npcAttributeBonusAttack = getAttributeBonus(npcDef.stats?.strength || 10);
          }

          const npcAttackSuccess = (npcRoll + npcAttackBonus + npcAttributeBonusAttack) >= playerAC;

          console.log(`[NPC Attacks] ${attackerName} útočí: hod k20 = ${npcRoll} + ${npcAttackBonus}(base) + ${npcAttributeBonusAttack}(atr) vs OČ ${playerAC} -> ${npcAttackSuccess ? 'Zásah!' : 'Minul.'}`);

          if (npcAttackSuccess) {
            const npcDamageDice = npcDef.stats?.damageDice || '1d4';
            let npcAttributeBonusDamage = 0;
            if (npcDef.stats?.damageDice?.includes('d4')) {
            } else {
              npcAttributeBonusDamage = getAttributeBonus(npcDef.stats?.strength || 10);
            }
            const npcDamage = Math.max(1, rollDice(npcDamageDice) + npcAttributeBonusDamage);
            healthChange -= npcDamage;
            console.log(`[NPC Attacks] ${attackerName} způsobil ${npcDamage} (${npcDamageDice} + ${npcAttributeBonusDamage}) zranění.`);
            if (!parsedAIResponse.mechanics) parsedAIResponse.mechanics = '';
            else parsedAIResponse.mechanics += '\n';
            parsedAIResponse.mechanics += `${attackerName} tě zasáhl a způsobil ${npcDamage} zranění.`;
          }
        }
      }

      // Aktualizace zdraví a many postavy v DB (zahrnuje změny z mechanik i útoků NPC)
      await updateCharacterStatsInDB(currentSession.character_id, character, healthChange, manaChange);

      // Kontrola smrti hráče PO všech úpravách zdraví
      const finalCharacterState = await db.query('SELECT current_health FROM characters WHERE id = $1', [currentSession.character_id]);
      if (finalCharacterState.rows[0].current_health <= 0) {
        console.log(`Hráč ${character.name} (ID: ${character.id}) zemřel!`);
        gameState.gameOver = true;
        gameState.gameOverReason = 'Postava zemřela.';
        parsedAIResponse = {
          description: 'Tvé dobrodružství zde končí... Zemřel jsi.',
          npcs: [], actions: ['Hra skončila.'], mechanics: null, options: []
        };
        finalAIHistory[finalAIHistory.length - 1] = { role: 'model', parts: [{ text: '<description>Tvé dobrodružství zde končí... Zemřel jsi.</description><action>Hra skončila.</action>' }] };
      }

    } // Konec bloku if (!actionProcessedByBackend)


    // --- Zpracování událostí PO akci a AI ---
    if (!gameState.gameOver) {
      const storyDataForEvents = await storyService.loadStoryById(currentSession.story_id);
      const currentLocationEvents = storyDataForEvents.locations.find(loc => loc.id === gameState.currentLocationId)?.events || [];

      if (!gameState.eventHistory) gameState.eventHistory = [];

      for (const eventId of currentLocationEvents) {
        const eventDefinition = storyDataForEvents.events?.find(ev => ev.id === eventId);
        // Jednoduchý trigger: vstup do lokace poprvé
        if (eventDefinition && eventDefinition.trigger.includes('vstoupí do lokace') && !gameState.eventHistory.includes(eventId)) {
          console.log(`[Event Trigger] Spouštím událost: ${eventDefinition.name}`);
          gameState.eventHistory.push(eventId);

          // Zpracování následků události
          let eventConsequenceText = '';
          if (eventDefinition.outcomes && eventDefinition.outcomes[0]?.consequences) {
            const consequences = eventDefinition.outcomes[0].consequences;
            if (consequences.spawnNPC) {
              const npcToSpawnId = consequences.spawnNPC;
              const npcToSpawnData = storyDataForEvents.npcs.find(n => n.id === npcToSpawnId);
              if (npcToSpawnData) {
                if (!gameState.locationNpcOverrides) gameState.locationNpcOverrides = {};
                if (!gameState.locationNpcOverrides[gameState.currentLocationId]) gameState.locationNpcOverrides[gameState.currentLocationId] = [];
                if (!gameState.locationNpcOverrides[gameState.currentLocationId].includes(npcToSpawnId)) {
                  gameState.locationNpcOverrides[gameState.currentLocationId].push(npcToSpawnId);
                  console.log(`[Event Consequence] NPC ${npcToSpawnData.name} (ID: ${npcToSpawnId}) se objevilo v lokaci.`);
                  eventConsequenceText += ` ${npcToSpawnData.name} se náhle objeví!`;
                }
              } else {
                console.warn(`[Event Consequence] NPC k objevení s ID ${npcToSpawnId} nenalezeno.`);
              }
            }
            // Zpracování modifikace lokace
            if (consequences.modifyLocation) {
              const locToModify = consequences.modifyLocation.location;
              const changes = consequences.modifyLocation.changes;
              if (locToModify === gameState.currentLocationId) {
                if (!gameState.locationStates) gameState.locationStates = {};
                if (!gameState.locationStates[locToModify]) gameState.locationStates[locToModify] = {};
                gameState.locationStates[locToModify].description_suffix = (gameState.locationStates[locToModify].description_suffix || '') + changes;
                console.log(`[Event Consequence] Modifikuji lokaci ${locToModify}: ${changes}`);
                eventConsequenceText += ` ${changes}`;
              }
            }
          }

          gameState.triggeredEventDetails = `${eventDefinition.name}: ${eventDefinition.description}${eventConsequenceText}`;
        }
      }
    }


    // 7. Zkontrolovat, zda je vhodné aktualizovat shrnutí paměti
    const shouldUpdateMemorySummary = memoryService.shouldUpdateMemory(gameState, finalAIHistory);

    // Pokud je vhodné aktualizovat shrnutí paměti, spustíme aktualizaci asynchronně
    // Nebudeme čekat na dokončení, aby se nebrzdila odpověď uživateli
    if (shouldUpdateMemorySummary) {
      console.log(`Spouštím aktualizaci shrnutí paměti pro sezení ${sessionId}`);
      // Použijeme Promise.resolve().then() pro asynchronní zpracování bez čekání
      Promise.resolve().then(async () => {
        try {
          await memoryService.updateMemorySummary(sessionId);
          console.log(`Shrnutí paměti pro sezení ${sessionId} bylo aktualizováno na pozadí`);
        } catch (memoryError) {
          console.error(`Chyba při aktualizaci shrnutí paměti pro sezení ${sessionId}:`, memoryError);
        }
      });
    }

    // 8. Uložit aktualizované sezení do DB
    const updatedSessionResult = await db.query(
      'UPDATE game_sessions SET game_state = $1, ai_history = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [JSON.stringify(gameState), JSON.stringify(finalAIHistory), sessionId]
    );

    // 9. Odeslat odpověď klientovi
    res.status(200).json({
      message: 'Akce zpracována.',
      session: updatedSessionResult.rows[0]
    });

  } catch (error) {
    console.error(`Chyba při zpracování akce v sezení ${sessionId}:`, error);
    res.status(500).json({ message: 'Interní chyba serveru při zpracování akce.' });
  }
};

// Získání stavu konkrétního herního sezení
const getGameSession = async (req, res) => {
  const userId = req.user.userId;
  const sessionId = req.params.sessionId;

  try {
    const sessionResult = await db.query('SELECT * FROM game_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Herní sezení nenalezeno nebo nepatří tomuto uživateli.' });
    }
    res.status(200).json(sessionResult.rows[0]);
  } catch (error) {
    console.error(`Chyba při získávání sezení ${sessionId}:`, error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání herního sezení.' });
  }
};

// --- Pomocné funkce pro mechaniky ---

// Tyto funkce jsou nyní v backend/utils/gameMechanics.js a naimportovány výše.
// Ponechávám zde zakomentované pro referenci, pokud by import selhal.
/*
async function addItemToInventory(characterId, itemName) { ... }
async function useItemFromInventory(characterId, itemName) { ... }
async function applyQuestRewards(characterId, character, rewards) { ... }
async function updateCharacterStats(characterId, character, healthChange, manaChange) { ... }
async function applyDamageToNPC(gameState, storyId, npcName, damage, characterId) { ... }
*/

module.exports = {
  startGame,
  handlePlayerAction,
  getGameSession,
};

