/**
 * Controller pro práci s kouzly
 */

const { getCharacterSpells, processSpellAttack, updateActiveSpellEffects } = require('../utils/gameMechanics');
const db = require('../config/db');

/**
 * Získání seznamu dostupných kouzel pro postavu
 */
const getAvailableSpells = async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user.userId;

    // Ověření, že uživatel má přístup k dané postavě
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nebyla nalezena nebo k ní nemáte přístup.' });
    }

    const character = characterResult.rows[0];
    const spells = getCharacterSpells(character);

    res.status(200).json(spells);
  } catch (error) {
    console.error('Chyba při získávání dostupných kouzel:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání dostupných kouzel.' });
  }
};

/**
 * Seslání kouzla v souboji
 */
const castSpell = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { spellId, targetId } = req.body;
    const userId = req.user.userId;

    if (!spellId || !targetId) {
      return res.status(400).json({ message: 'Chybí ID kouzla nebo ID cíle.' });
    }

    // Získání herního sezení
    const sessionResult = await db.query(
      'SELECT * FROM game_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Herní sezení nebylo nalezeno nebo k němu nemáte přístup.' });
    }

    const session = sessionResult.rows[0];
    const gameState = session.game_state;

    // Kontrola, zda je aktivní souboj
    if (!gameState.combat || !gameState.combat.active) {
      return res.status(400).json({ message: 'Není aktivní žádný souboj.' });
    }

    // Kontrola, zda je na tahu hráč
    const currentCombatant = gameState.combat.combatants[gameState.combat.turnIndex];
    if (currentCombatant.id !== 'player') {
      return res.status(400).json({ message: 'Není váš tah.' });
    }

    // Získání postavy
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1',
      [session.character_id]
    );

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nebyla nalezena.' });
    }

    const character = characterResult.rows[0];

    // Nalezení cíle
    const target = gameState.combat.npcs.find(npc => npc.id === targetId);
    if (!target) {
      return res.status(404).json({ message: 'Cíl nebyl nalezen.' });
    }

    if (target.defeated) {
      return res.status(400).json({ message: 'Cíl již byl poražen.' });
    }

    // Seslání kouzla
    const spellResult = processSpellAttack(character, spellId, target);

    if (!spellResult.success) {
      return res.status(400).json({ message: spellResult.message, reason: spellResult.reason });
    }

    // Aktualizace stavu postavy (mana)
    await db.query(
      'UPDATE characters SET current_mana = $1 WHERE id = $2',
      [character.current_mana, character.id]
    );

    // Aktualizace stavu NPC v gameState
    const targetIndex = gameState.combat.npcs.findIndex(npc => npc.id === targetId);
    if (targetIndex !== -1) {
      gameState.combat.npcs[targetIndex] = target;
    }

    // Kontrola, zda byl cíl poražen
    if (spellResult.defeated) {
      gameState.combat.npcs[targetIndex].defeated = true;
    }

    // Kontrola, zda jsou všechna NPC poražena
    const allNpcsDefeated = gameState.combat.npcs.every(npc => npc.defeated);
    if (allNpcsDefeated) {
      gameState.combat.active = false;
      spellResult.combatEnded = true;
      spellResult.message += ' Všichni nepřátelé byli poraženi!';
    } else {
      // Posun na dalšího účastníka v souboji
      gameState.combat.turnIndex++;
      if (gameState.combat.turnIndex >= gameState.combat.combatants.length) {
        gameState.combat.round++;
        gameState.combat.turnIndex = 0;
      }
      const nextCombatant = gameState.combat.combatants[gameState.combat.turnIndex];
      spellResult.nextTurn = {
        combatantId: nextCombatant.id,
        combatantName: nextCombatant.name,
        round: gameState.combat.round
      };
    }

    // Aktualizace herního stavu
    await db.query(
      'UPDATE game_sessions SET game_state = $1 WHERE id = $2',
      [gameState, sessionId]
    );

    res.status(200).json(spellResult);
  } catch (error) {
    console.error('Chyba při sesílání kouzla:', error);
    res.status(500).json({ message: 'Interní chyba serveru při sesílání kouzla.' });
  }
};

/**
 * Aktualizace aktivních efektů kouzel
 */
const updateSpellEffects = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    // Získání herního sezení
    const sessionResult = await db.query(
      'SELECT * FROM game_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Herní sezení nebylo nalezeno nebo k němu nemáte přístup.' });
    }

    const session = sessionResult.rows[0];

    // Získání postavy
    const characterResult = await db.query(
      'SELECT * FROM characters WHERE id = $1',
      [session.character_id]
    );

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nebyla nalezena.' });
    }

    const character = characterResult.rows[0];

    // Aktualizace aktivních efektů
    const updateResult = updateActiveSpellEffects(character);

    // Aktualizace postavy v databázi
    await db.query(
      'UPDATE characters SET active_effects = $1 WHERE id = $2',
      [character.activeEffects || [], character.id]
    );

    res.status(200).json(updateResult);
  } catch (error) {
    console.error('Chyba při aktualizaci efektů kouzel:', error);
    res.status(500).json({ message: 'Interní chyba serveru při aktualizaci efektů kouzel.' });
  }
};

module.exports = {
  getAvailableSpells,
  castSpell,
  updateSpellEffects
};
