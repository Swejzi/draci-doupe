const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // Načtení .env ze správného místa

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Chyba: GEMINI_API_KEY není nastaven v .env souboru.');
  // V produkčním prostředí bychom zde mohli ukončit proces nebo použít fallback
  // process.exit(1);
}

let genAI;
let model;

try {
  genAI = new GoogleGenerativeAI(apiKey);

  // Specifikace modelu - 'gemini-1.5-pro' je nejnovější model pro textové úlohy
  model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    // Zde můžeme přidat další konfigurační parametry pro generování, pokud je potřeba
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    }
  });
  console.log('Google Gemini AI klient úspěšně inicializován.');

} catch (error) {
  console.error('Chyba při inicializaci Google Gemini AI klienta:', error);
  // Zde bychom mohli implementovat fallback logiku nebo logování chyby
  genAI = null;
  model = null;
}

module.exports = {
  genAI,
  model,
  // Funkce pro vytvoření nové chatovací session s historií (dle zadání)
  startChatSession: (history = [], generationConfig = {}) => {
    if (!model) {
      console.error('Nelze spustit chat: Gemini model není inicializován.');
      return null;
    }
    // Výchozí konfigurace, pokud není specifikována
    const defaultConfig = {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
      ...generationConfig // Případné přepsání výchozích hodnot
    };
    try {
      return model.startChat({
        history: history,
        generationConfig: defaultConfig,
      });
    } catch (error) {
      console.error('Chyba při startu Gemini chat session:', error);
      return null;
    }
  }
};
