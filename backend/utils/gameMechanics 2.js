const db = require('../config/db');
const storyService = require('../services/storyService'); // Potřebné pro applyDamageToNPC

// Funkce pro výpočet bonusu z atributu (jednoduchá verze DrD)
function getAttributeBonus(attributeValue) {
    const val = parseInt(attributeValue, 10);
    if (isNaN(val)) return 0; 
    return Math.floor((val - 10) / 2);
}

// Funkce pro hod kostkou (např. "1d6", "2d8+2")
function rollDice(diceString) {
    const match = diceString.match(/(\d+)?d(\d+)(?:([+-])(\d+))?/i);
    if (!match) return 0; 

    const numDice = match[1] ? parseInt(match[1], 10) : 1;
    const diceValue = parseInt(match[2], 10);
    const modifierSign = match[3];
    const modifierValue = match[4] ? parseInt(match[4], 10) : 0;

    let total = 0;
    for (let i = 0; i < numDice; i++) {
        total += Math.floor(Math.random() * diceValue) + 1;
    }

    if (modifierSign === '+') {
        total += modifierValue;
    } else if (modifierSign === '-') {
        total -= modifierValue;
    }

    return Math.max(0, total); 
}

// Funkce pro přidání předmětu do inventáře
async function addItemToInventory(characterId, itemName) {
    try {
        const inventoryResult = await db.query('SELECT inventory FROM characters WHERE id = $1', [characterId]);
        if (inventoryResult.rows.length === 0) return;
        let inventory = inventoryResult.rows[0].inventory || []; 
        const existingItemIndex = inventory.findIndex(item => item.name === itemName);
        if (existingItemIndex > -1) {
            inventory[existingItemIndex].quantity = (inventory[existingItemIndex].quantity || 1) + 1;
        } else {
            inventory.push({ name: itemName, quantity: 1 });
        }
        await db.query('UPDATE characters SET inventory = $1 WHERE id = $2', [JSON.stringify(inventory), characterId]);
        console.log(`[addItemToInventory] Předmět '${itemName}' přidán do inventáře postavy ${characterId}.`);
    } catch (error) {
        console.error(`[addItemToInventory] Chyba při přidávání předmětu '${itemName}' postavě ${characterId}:`, error);
    }
}

// Funkce pro použití předmětu z inventáře
async function useItemFromInventory(characterId, itemName) {
    // Jednoduchý příklad pro léčivý lektvar
    if (itemName.toLowerCase().includes('léčivý lektvar')) {
        try {
            const inventoryResult = await db.query('SELECT inventory FROM characters WHERE id = $1', [characterId]);
            if (inventoryResult.rows.length === 0) return { success: false, message: "Postava nenalezena." };
            
            let inventory = inventoryResult.rows[0].inventory || [];
            const itemIndex = inventory.findIndex(item => item.name.toLowerCase().includes('léčivý lektvar'));

            if (itemIndex > -1 && inventory[itemIndex].quantity > 0) { 
                const healthGained = 20; 
                
                inventory[itemIndex].quantity -= 1;
                if (inventory[itemIndex].quantity <= 0) {
                    inventory.splice(itemIndex, 1);
                }
                
                 const charHealthResult = await db.query('SELECT current_health, max_health FROM characters WHERE id = $1', [characterId]);
                 const currentHealth = charHealthResult.rows[0].current_health;
                 const maxHealth = charHealthResult.rows[0].max_health;
                 let newHealth = Math.min(currentHealth + healthGained, maxHealth); 

                await db.query('UPDATE characters SET inventory = $1, current_health = $2 WHERE id = $3', [JSON.stringify(inventory), newHealth, characterId]);
                
                console.log(`[useItemFromInventory] Postava ${characterId} použila ${itemName}, vyléčeno ${healthGained} HP.`);
                return { success: true, message: `Použil jsi ${itemName} a vyléčil sis ${healthGained} životů.`, healthGained: healthGained };
            } else {
                return { success: false, message: `Nemáš v inventáři ${itemName}.` };
            }
        } catch (error) {
            console.error(`[useItemFromInventory] Chyba při použití předmětu '${itemName}' postavou ${characterId}:`, error);
            return { success: false, message: "Chyba při použití předmětu." };
        }
    } else {
        return { success: false, message: `Nevíš, jak použít ${itemName}.` };
    }
}

// Funkce pro aplikaci odměn za úkol
async function applyQuestRewards(characterId, character, rewards) {
    let characterUpdates = [];
    let updateParams = [];
    let paramIndex = 1;
    let currentLevel = character.level; 
    let currentXP = character.experience;    

    if (rewards.experience) {
        characterUpdates.push(`experience = experience + $${paramIndex++}`);
        updateParams.push(rewards.experience);
        console.log(`Přidávám ${rewards.experience} XP.`);
    }
    if (rewards.gold) {
        characterUpdates.push(`gold = gold + $${paramIndex++}`);
        updateParams.push(rewards.gold);
        console.log(`Přidávám ${rewards.gold} zlata.`);
    }
    
    if (characterUpdates.length > 0) {
        updateParams.push(characterId); 
        const updateQuery = `UPDATE characters SET ${characterUpdates.join(', ')} WHERE id = $${paramIndex}`;
        try {
            const updateResult = await db.query(updateQuery + ' RETURNING level, experience, gold', updateParams); 
            if (updateResult.rows.length > 0) {
                currentLevel = updateResult.rows[0].level; 
                currentXP = updateResult.rows[0].experience; 
                character.gold = updateResult.rows[0].gold; 
                console.log(`XP/Zlato pro postavu ${characterId} aktualizováno.`);
            } else {
                 console.error(`Nepodařilo se aktualizovat XP/zlato pro postavu ${characterId}`);
            }
        } catch(dbError) {
             console.error(`Chyba DB při aktualizaci XP/zlata pro postavu ${characterId}:`, dbError);
        }
    }

    // Kontrola level up
    const xpNeededForNextLevel = currentLevel * 100; 
    if (currentXP >= xpNeededForNextLevel) {
        const newLevel = currentLevel + 1;
        let healthIncrease = 0;
        let manaIncrease = 0;
        const conBonus = getAttributeBonus(character.constitution);
        const intBonus = getAttributeBonus(character.intelligence);

        switch (character.class) { 
            case 'Bojovník': healthIncrease = 6 + conBonus; break; 
            case 'Kouzelník': healthIncrease = 3 + conBonus; manaIncrease = 3 + intBonus; break; 
            case 'Hraničář': healthIncrease = 5 + conBonus; break; 
            case 'Zloděj': healthIncrease = 4 + conBonus; break; 
            case 'Alchymista': healthIncrease = 4 + conBonus; manaIncrease = 2 + intBonus; break; 
            default: healthIncrease = 4 + conBonus; 
        }
        healthIncrease = Math.max(1, healthIncrease); 
        manaIncrease = Math.max(0, manaIncrease); 

        console.log(`Postava ${characterId} postoupila na úroveň ${newLevel}! Zvýšení HP: ${healthIncrease}, Zvýšení Many: ${manaIncrease}`);
        try {
            await db.query(
                'UPDATE characters SET level = $1, max_health = max_health + $2, current_health = current_health + $2, max_mana = max_mana + $3, current_mana = current_mana + $3 WHERE id = $4', 
                [newLevel, healthIncrease, manaIncrease, characterId]
            );
            character.level = newLevel;
            character.max_health += healthIncrease;
            character.current_health += healthIncrease; 
            character.max_mana += manaIncrease;
            character.current_mana += manaIncrease;
        } catch (levelUpError) {
             console.error(`Chyba DB při level up postavy ${characterId}:`, levelUpError);
        }
    }

    if (rewards.items && Array.isArray(rewards.items)) {
        for (const itemNameOrId of rewards.items) {
            await addItemToInventory(characterId, itemNameOrId);
        }
    }
}

// Funkce pro aktualizaci statistik postavy (HP, Mana)
async function updateCharacterStats(characterId, character, healthChange, manaChange) {
     let needsUpdate = false;
    let updateFields = [];
    let updateValues = [];
    let valueIndex = 1;

    if (healthChange !== 0) {
        const currentHealth = character.current_health; 
        const maxHealth = character.max_health;
        let newHealth = Math.min(currentHealth + healthChange, maxHealth); 
        updateFields.push(`current_health = $${valueIndex++}`);
        updateValues.push(newHealth);
        needsUpdate = true;
        console.log(`Nové zdraví postavy ${characterId}: ${newHealth}`);
    }
    if (manaChange !== 0) {
        const currentMana = character.current_mana;
        const maxMana = character.max_mana;
        let newMana = Math.min(currentMana + manaChange, maxMana); 
        newMana = Math.max(newMana, 0); 
        updateFields.push(`current_mana = $${valueIndex++}`);
        updateValues.push(newMana);
        needsUpdate = true;
        console.log(`Nová mana postavy ${characterId}: ${newMana}`);
    }

    if (needsUpdate) {
        try {
            updateValues.push(characterId); 
            const updateQuery = `UPDATE characters SET ${updateFields.join(', ')} WHERE id = $${valueIndex}`;
            await db.query(updateQuery, updateValues);
            // Aktualizujeme i lokální objekt postavy po úspěšném DB update
            if (healthChange !== 0) character.current_health = updateValues[updateFields.indexOf(`current_health = $1`)]; // Index se může lišit
            if (manaChange !== 0) character.current_mana = updateValues[updateFields.indexOf(`current_mana = $${healthChange !== 0 ? 2 : 1}`)]; // Index se může lišit
        } catch (dbError) {
             console.error(`Chyba DB při aktualizaci zdraví/many postavy ${characterId}:`, dbError);
        }
    }
}

// Funkce pro aplikaci zranění na NPC
async function applyDamageToNPC(gameState, storyId, npcName, damage, characterId) { // Přidán characterId pro loot
    if (!gameState.npcStates) gameState.npcStates = {};
    
    const storyData = await storyService.loadStoryById(storyId);
    const npcDefinition = storyData?.npcs?.find(n => n.name === npcName);
    if (!npcDefinition) {
        console.warn(`[applyDamageToNPC] NPC s jménem '${npcName}' nenalezeno v datech příběhu.`);
        return; 
    }
    const npcId = npcDefinition.id;

    if (!gameState.npcStates[npcId]) {
        gameState.npcStates[npcId] = { 
            id: npcId, 
            name: npcName,
            current_health: npcDefinition.stats?.health,
            defeated: false 
        };
    }

    if (!gameState.npcStates[npcId].defeated) {
        let currentNpcHealth = gameState.npcStates[npcId].current_health;
        currentNpcHealth = Math.max(0, currentNpcHealth - damage); 
        gameState.npcStates[npcId].current_health = currentNpcHealth;
        console.log(`[applyDamageToNPC] NPC '${npcName}' (ID: ${npcId}) utrpělo ${damage} zranění. Nové zdraví: ${currentNpcHealth}`);

        if (currentNpcHealth <= 0) {
            console.log(`[applyDamageToNPC] NPC '${npcName}' bylo poraženo!`);
            gameState.npcStates[npcId].defeated = true; 
            
            // Zpracování lootu
            if (npcDefinition.loot && Array.isArray(npcDefinition.loot)) {
                 console.log(`[applyDamageToNPC] Zpracovávám loot pro ${npcName}: ${npcDefinition.loot.join(', ')}`);
                 gameState.lastLoot = []; 
                 let goldToAdd = 0;
                 
                 if (!characterId) { 
                     console.error("[applyDamageToNPC] Chybí characterId pro zpracování lootu!");
                     return; 
                 }

                 for (const itemNameToAdd of npcDefinition.loot) {
                     const goldMatch = itemNameToAdd.match(/(\d+) zlatých/i);
                     if (goldMatch && goldMatch[1]) {
                         goldToAdd += parseInt(goldMatch[1], 10);
                         gameState.lastLoot.push(itemNameToAdd); 
                     } else {
                         await addItemToInventory(characterId, itemNameToAdd); 
                         gameState.lastLoot.push(itemNameToAdd); 
                     }
                 }
                 // Přidat zlato, pokud nějaké bylo
                 if (goldToAdd > 0) {
                     try {
                         await db.query('UPDATE characters SET gold = gold + $1 WHERE id = $2', [goldToAdd, characterId]); 
                         console.log(`Přidáno ${goldToAdd} zlata postavě ${characterId}.`);
                     } catch (dbError) {
                          console.error(`Chyba DB při přidávání zlata postavě ${characterId}:`, dbError);
                     }
                 }
            }
        }
    } else {
         console.log(`[applyDamageToNPC] Pokus o zranění již poraženého NPC '${npcName}'.`);
    }
}

module.exports = {
    getAttributeBonus,
    rollDice,
    addItemToInventory,
    useItemFromInventory,
    applyQuestRewards,
    updateCharacterStats,
    applyDamageToNPC
};
