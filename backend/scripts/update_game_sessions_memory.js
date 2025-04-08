/**
 * Migrační skript pro aktualizaci existujících herních sezení
 * Přidává pole memory_summary a last_summarized_history_length do game_state
 */
const db = require('../config/db');

async function updateGameSessions() {
  console.log('Zahajuji aktualizaci herních sezení pro podporu paměti...');

  try {
    // Získání všech aktivních herních sezení
    const sessionsResult = await db.query('SELECT id, game_state FROM game_sessions WHERE game_state->\'gameOver\' IS NULL OR game_state->\'gameOver\' = \'false\'');

    console.log(`Nalezeno ${sessionsResult.rows.length} aktivních herních sezení.`);

    let updatedCount = 0;

    // Aktualizace každého sezení
    for (const session of sessionsResult.rows) {
      try {
        const gameState = session.game_state;

        // Přidání polí pro paměť, pokud neexistují
        if (!gameState.memory_summary) {
          gameState.memory_summary = null;
        }

        if (!gameState.last_summarized_history_length) {
          gameState.last_summarized_history_length = 0;
        }

        // Uložení aktualizovaného herního stavu
        await db.query(
          'UPDATE game_sessions SET game_state = $1 WHERE id = $2',
          [JSON.stringify(gameState), session.id]
        );

        updatedCount++;
      } catch (sessionError) {
        console.error(`Chyba při aktualizaci sezení ${session.id}:`, sessionError);
      }
    }

    console.log(`Úspěšně aktualizováno ${updatedCount} z ${sessionsResult.rows.length} herních sezení.`);

  } catch (error) {
    console.error('Chyba při aktualizaci herních sezení:', error);
  }
}

// Spuštění migrace
updateGameSessions()
  .then(() => {
    console.log('Migrace dokončena.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Chyba při migraci:', err);
    process.exit(1);
  });
