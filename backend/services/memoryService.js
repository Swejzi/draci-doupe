/**
 * Služba pro správu paměti NPC postav a optimalizaci historie konverzací
 */
const gemini = require('../config/gemini');
const db = require('../config/db');

/**
 * Generuje shrnutí paměti z historie konverzací
 * @param {Array} aiHistory - Historie konverzací mezi hráčem a AI
 * @param {Object} gameState - Aktuální stav hry
 * @param {Object} character - Informace o postavě hráče
 * @param {Object} storyData - Data příběhu
 * @returns {Promise<Object>} - Objekt obsahující shrnutí paměti pro různé kategorie
 */
async function generateMemorySummary(aiHistory, gameState, character, storyData) {
  try {
    // Pokud nemáme dostatek historie, není třeba generovat shrnutí
    if (!aiHistory || aiHistory.length < 10) {
      console.log('Nedostatek historie pro generování shrnutí paměti');
      return null;
    }

    // Připravíme kontext pro AI
    const historyText = aiHistory
      .map(h => `${h.role === 'user' ? 'Hráč' : 'PJ'}: ${h.parts[0].text}`)
      .join('\n');

    // Vytvoříme prompt pro AI
    const prompt = `
Analyzuj následující historii konverzace mezi hráčem a Pánem jeskyně (PJ) v RPG hře Dračí doupě.
Extrahuj a shrň nejdůležitější informace do kategorií. Buď stručný, ale zachovej klíčové detaily.

HISTORIE KONVERZACE:
${historyText}

Vytvoř shrnutí v následujícím formátu JSON:
{
  "npc_interactions": [
    {"npc": "jméno_npc", "relationship": "vztah_k_hráči", "key_events": "klíčové_události_a_informace"}
  ],
  "character_decisions": "důležitá_rozhodnutí_hráče_a_jejich_důsledky",
  "promises_made": "sliby_které_hráč_dal_nebo_které_byly_dány_hráči",
  "important_locations": "důležitá_místa_a_co_se_tam_stalo",
  "secrets_revealed": "odhalená_tajemství_nebo_důležité_informace"
}

Zaměř se pouze na důležité informace, které by si NPC postavy měly pamatovat při budoucích interakcích.
`;

    // Odešleme prompt do Gemini AI
    if (!gemini.model) throw new Error('Gemini model není inicializován.');
    
    const aiResult = await gemini.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    
    const aiResponseText = aiResult.response.text();
    
    // Extrahujeme JSON z odpovědi
    let memorySummary;
    try {
      // Pokusíme se najít JSON v odpovědi (může být obklopen textem)
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        memorySummary = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON nenalezen v odpovědi AI');
      }
    } catch (parseError) {
      console.error('Chyba při parsování JSON z odpovědi AI:', parseError);
      console.log('Odpověď AI:', aiResponseText);
      
      // Pokud se nepodařilo parsovat JSON, vytvoříme základní strukturu
      memorySummary = {
        npc_interactions: [],
        character_decisions: "Nebylo možné extrahovat rozhodnutí postavy.",
        promises_made: "Nebylo možné extrahovat sliby.",
        important_locations: "Nebylo možné extrahovat důležitá místa.",
        secrets_revealed: "Nebylo možné extrahovat odhalená tajemství."
      };
    }
    
    // Přidáme časové razítko
    memorySummary.generated_at = new Date().toISOString();
    
    return memorySummary;
  } catch (error) {
    console.error('Chyba při generování shrnutí paměti:', error);
    return null;
  }
}

/**
 * Aktualizuje shrnutí paměti v herním stavu
 * @param {number} sessionId - ID herního sezení
 * @param {boolean} force - Vynutit aktualizaci i když není potřeba
 * @returns {Promise<Object>} - Aktualizovaný herní stav
 */
async function updateMemorySummary(sessionId, force = false) {
  try {
    // Načteme aktuální sezení
    const sessionResult = await db.query('SELECT * FROM game_sessions WHERE id = $1', [sessionId]);
    if (sessionResult.rows.length === 0) {
      throw new Error(`Herní sezení s ID ${sessionId} nenalezeno`);
    }
    
    const session = sessionResult.rows[0];
    const gameState = session.game_state;
    const aiHistory = session.ai_history;
    
    // Kontrola, zda je potřeba aktualizovat shrnutí
    const lastSummaryTime = gameState.memory_summary?.generated_at 
      ? new Date(gameState.memory_summary.generated_at) 
      : null;
    
    const currentTime = new Date();
    const timeSinceLastSummary = lastSummaryTime 
      ? (currentTime - lastSummaryTime) / 1000 / 60 // v minutách
      : Infinity;
    
    // Aktualizujeme shrnutí pouze pokud:
    // 1. Je vynuceno (force = true), nebo
    // 2. Nemáme žádné shrnutí, nebo
    // 3. Poslední shrnutí je starší než 10 minut a máme alespoň 5 nových interakcí
    const needsUpdate = force || 
      !gameState.memory_summary || 
      (timeSinceLastSummary > 10 && aiHistory.length - (gameState.last_summarized_history_length || 0) >= 5);
    
    if (!needsUpdate) {
      console.log(`Shrnutí paměti pro sezení ${sessionId} není potřeba aktualizovat`);
      return gameState;
    }
    
    // Načteme potřebná data pro generování shrnutí
    const characterResult = await db.query('SELECT * FROM characters WHERE id = $1', [session.character_id]);
    if (characterResult.rows.length === 0) {
      throw new Error(`Postava s ID ${session.character_id} nenalezena`);
    }
    
    const character = characterResult.rows[0];
    
    // Načteme data příběhu
    const storyService = require('./storyService');
    const storyData = await storyService.loadStoryById(session.story_id);
    
    // Generujeme nové shrnutí
    const memorySummary = await generateMemorySummary(aiHistory, gameState, character, storyData);
    
    if (memorySummary) {
      // Aktualizujeme herní stav
      gameState.memory_summary = memorySummary;
      gameState.last_summarized_history_length = aiHistory.length;
      
      // Uložíme aktualizovaný herní stav do databáze
      await db.query(
        'UPDATE game_sessions SET game_state = $1 WHERE id = $2',
        [JSON.stringify(gameState), sessionId]
      );
      
      console.log(`Shrnutí paměti pro sezení ${sessionId} úspěšně aktualizováno`);
    }
    
    return gameState;
  } catch (error) {
    console.error(`Chyba při aktualizaci shrnutí paměti pro sezení ${sessionId}:`, error);
    return null;
  }
}

/**
 * Rozhodne, zda je vhodný čas pro aktualizaci shrnutí paměti
 * @param {Object} gameState - Aktuální stav hry
 * @param {Array} aiHistory - Historie konverzací
 * @returns {boolean} - True, pokud je vhodný čas pro aktualizaci
 */
function shouldUpdateMemory(gameState, aiHistory) {
  // Pokud nemáme žádné shrnutí, měli bychom ho vytvořit
  if (!gameState.memory_summary) {
    return aiHistory.length >= 10; // Ale pouze pokud máme dostatek historie
  }
  
  // Pokud máme shrnutí, aktualizujeme ho pouze pokud:
  // 1. Máme alespoň 5 nových interakcí od posledního shrnutí
  // 2. Poslední shrnutí je starší než 15 minut
  const lastSummaryTime = new Date(gameState.memory_summary.generated_at);
  const currentTime = new Date();
  const timeSinceLastSummary = (currentTime - lastSummaryTime) / 1000 / 60; // v minutách
  
  const newInteractionsCount = aiHistory.length - (gameState.last_summarized_history_length || 0);
  
  return newInteractionsCount >= 5 || timeSinceLastSummary > 15;
}

module.exports = {
  generateMemorySummary,
  updateMemorySummary,
  shouldUpdateMemory
};
