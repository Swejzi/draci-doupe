const storyService = require('../services/storyService');
const db = require('../config/db'); // Potřebné pro načtení postavy v buildContext
const { getAttributeBonus } = require('./gameMechanics'); // Potřebujeme bonus pro kontext

// Funkce pro sestavení kontextu pro AI (dle zadání 9.2)
async function buildContext(gameState, characterId, storyId) {
  const characterResult = await db.query('SELECT * FROM characters WHERE id = $1', [characterId]);
  const character = characterResult.rows[0]; 
  const storyData = await storyService.loadStoryById(storyId);
  const currentLocation = storyData.locations.find(loc => loc.id === gameState.currentLocationId);
  
  let npcIdsInLocation = [...(currentLocation?.npcs || [])];
  if (gameState.locationNpcOverrides && gameState.locationNpcOverrides[gameState.currentLocationId]) {
    npcIdsInLocation = [...new Set([...npcIdsInLocation, ...gameState.locationNpcOverrides[gameState.currentLocationId]])]; 
  }

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
    .filter(state => state.defeated && npcIdsInLocation.includes(state.id)) 
    .map(state => state.name)
    .join(', ');
      
  const lastLoot = gameState.lastLoot ? `Našel jsi: ${gameState.lastLoot.join(', ')}.` : '';
  const triggeredEventInfo = gameState.triggeredEventDetails ? `Právě se stalo: ${gameState.triggeredEventDetails}` : ''; 

  const recentHistory = gameState.ai_history ? gameState.ai_history.slice(-6) : []; 

  const activeQuestsString = gameState.activeQuests?.map(q => {
    const questDef = storyData.quests?.find(qd => qd.title === q.title);
    const totalObjectives = questDef?.objectives?.length || 0;
    const completedCount = q.completedObjectives ? Object.keys(q.completedObjectives).length : 0; 
    return `${q.title} (${completedCount}/${totalObjectives} cílů splněno)`;
  }).join(', ') || 'Žádné';

  // Informace o posledním hodu (útok nebo skill check)
  let lastRollInfo = '';
  if (gameState.lastDiceRoll) {
    const roll = gameState.lastDiceRoll;
    const successString = roll.success !== undefined ? (roll.success ? ' (Úspěch)' : ' (Neúspěch)') : '';
    if (roll.type?.includes('útok')) {
      lastRollInfo = `Poslední hod na útok: ${roll.dice} = ${roll.result}${successString}\n`;
    } else if (roll.type) { // Předpokládáme skill check, pokud má typ a není útok
      lastRollInfo = `Poslední hod na ${roll.type}: ${roll.dice} = ${roll.result}${successString}\n`;
    } else { // Obecný hod bez typu
      lastRollInfo = `Poslední hod kostkou: ${roll.dice} = ${roll.result}${successString}\n`;
    }
  }


  // Pokud je hra u konce, pošleme jen jednoduchý kontext
  if (gameState.gameOver) {
    return `--- HRA SKONČILA ---
Důvod: ${gameState.gameOverReason || 'Neznámý'}
Postava hráče: ${character.name} (Úroveň: ${character.level})
--- KONEC KONTEXTU ---

Jsi Pán jeskyně. Hra skončila. Napiš krátkou závěrečnou zprávu pro hráče.`;
  }

  const basePrompt = `Jsi Pán jeskyně (PJ) v RPG hře Dračí doupě. Tvým úkolem je vést hráče dobrodružstvím, popisovat svět, řídit nehráčské postavy (NPC) a udržovat pravidla hry. Řiď se následujícími instrukcemi:
1. Příběh: Vyprávěj příběh založený na scénáři '${storyData.title}'. Drž se hlavní dějové linky, ale umožni hráči svobodná rozhodnutí. Použij informace z aktuální lokace a o přítomných NPC. Reaguj na změny zdraví NPC a na právě spuštěné události. Pokud je NPC poraženo, popiš to a dále ho ignoruj. Zmiň předměty nebo zlato, které hráč našel u poraženého NPC.
 2. Pravidla: Používej pravidla Dračího doupěte pro řešení akcí, bojů a používání dovedností. 
    - Hody kostkou hráče (Útok): Pokud hráč útočí, uveď v tagu <mechanics> typ hodu ("Hod k20 na útok"), OČ protivníka (pokud je relevantní a známé) a VÝSLEDEK HODU KOSTKOU (bez bonusů). Příklad: "<mechanics>Hod k20 na útok proti Goblinovi (OČ 13): výsledek 15</mechanics>". Backend vyhodnotí úspěch/neúspěch.
    - Hody kostkou hráče (Dovednost): Pokud akce vyžaduje ověření dovednosti (např. páčení zámku, přesvědčování, šplhání), uveď v tagu <mechanics> typ hodu (např. "Hod na Obratnost (Páčení zámků)"), navrhované CÍLOVÉ ČÍSLO (DC) a VÝSLEDEK HODU KOSTKOU k20 (bez bonusů). Příklad: "<mechanics>Hod na Obratnost (Páčení zámků) DC 14: výsledek 12</mechanics>". Backend vyhodnotí úspěch/neúspěch.
    - Důsledky hodu hráče: V tagu <description> nebo <action> popiš POUZE důsledek akce, která byla v PŘEDCHOZÍM kole vyhodnocena backendem jako ÚSPĚŠNÁ (viz informace "Poslední hod..." v kontextu). Pokud byl předchozí hod neúspěšný, v <description> popiš jen situaci bez důsledku neúspěšné akce. NEAPLIKUJ zranění ani jiné mechanické efekty v <mechanics> - backend to řeší.
    - Akce NPC: Pokud nějaké ŽIVÉ NPC útočí na hráče, uveď to v tagu <action>. NEHÁZEJ za NPC na útok ani neuváděj zranění v <mechanics> - backend to vyřeší. Popiš pouze akci NPC v <description>. Poražené NPC nemohou útočit.
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

  const context = `
--- KONTEXT HRY ---
Příběh: ${storyData.title} (${storyData.description})
Aktuální lokace: ${currentLocation?.name || 'Neznámá'} (${currentLocation?.description || 'Žádný popis'})
Přítomné (živé) NPC: ${npcsInLocationString}
${recentlyDefeatedNpcs ? `Nedávno poražené NPC: ${recentlyDefeatedNpcs}\n` : ''}
${lastLoot ? `${lastLoot}\n` : ''}
${triggeredEventInfo ? `${triggeredEventInfo}\n` : ''}
Postava hráče: ${character.name} (Rasa: ${character.race}, Třída: ${character.class}, Úroveň: ${character.level}, Zdraví: ${character.current_health}/${character.max_health}, Mana: ${character.current_mana}/${character.max_mana}, Zlato: ${character.gold})
Aktivní úkoly: ${activeQuestsString}
${lastRollInfo}
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
    
    const actionMatches = response.matchAll(/<action>([\s\S]*?)<\/action>/g);
    for (const match of actionMatches) {
      result.actions.push(match[1].trim());
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

module.exports = {
  buildContext,
  parseAIResponse
};
