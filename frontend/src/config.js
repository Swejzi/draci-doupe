// Základní URL backendového API
// V produkci by mělo být konfigurovatelné (např. přes .env)
export const API_URL = 'http://localhost:3001/api';

// Další konfigurační konstanty
export const APP_NAME = 'AI Dračí doupě';
export const APP_VERSION = '0.1.0';

// Konfigurace pro herní mechaniky
export const GAME_CONFIG = {
  // Základní hodnoty pro nové postavy
  defaultCharacterStats: {
    health: 10,
    mana: 5,
    gold: 50
  },
  
  // Konfigurace soubojového systému
  combat: {
    defaultInitiativeBonus: 0,
    criticalHitThreshold: 20,
    criticalMissThreshold: 1
  },
  
  // Konfigurace systému zkušeností
  experience: {
    levelUpThresholds: [
      0,      // Level 1
      1000,   // Level 2
      3000,   // Level 3
      6000,   // Level 4
      10000,  // Level 5
      15000,  // Level 6
      21000,  // Level 7
      28000,  // Level 8
      36000,  // Level 9
      45000   // Level 10
    ]
  }
};
