const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const characterRoutes = require('./character'); // Načtení routeru pro postavy
const storyRoutes = require('./story'); // Načtení routeru pro příběhy
const gameRoutes = require('./game'); // Načtení routeru pro hru
const questRoutes = require('./quests'); // Načtení routeru pro úkoly
const spellRoutes = require('./spellRoutes'); // Načtení routeru pro kouzla
const skillRoutes = require('./skillRoutes'); // Načtení routeru pro dovednosti
const reputationRoutes = require('./reputationRoutes'); // Načtení routeru pro reputaci
const abilityRoutes = require('./abilityRoutes'); // Načtení routeru pro schopnosti
const equipmentRoutes = require('./equipmentRoutes'); // Načtení routeru pro vybavení
const inventoryRoutes = require('./inventoryRoutes'); // Načtení routeru pro inventář

// Základní API endpoint (přesunuto sem z index.js)
router.get('/', (req, res) => {
  res.json({ message: 'Backend API pro AI Dračí doupě v provozu!' });
});

// Připojení specifických routerů
router.use('/auth', authRoutes);
router.use('/characters', characterRoutes); // Připojení routeru pro postavy pod /api/characters
router.use('/stories', storyRoutes); // Připojení routeru pro příběhy pod /api/stories
router.use('/game', gameRoutes); // Připojení routeru pro hru pod /api/game
router.use('/quests', questRoutes); // Připojení routeru pro úkoly pod /api/quests
router.use('/spells', spellRoutes); // Připojení routeru pro kouzla pod /api/spells
router.use('/skills', skillRoutes); // Připojení routeru pro dovednosti pod /api/skills
router.use('/reputation', reputationRoutes); // Připojení routeru pro reputaci pod /api/reputation
router.use('/abilities', abilityRoutes); // Připojení routeru pro schopnosti pod /api/abilities
router.use('/equipment', equipmentRoutes); // Připojení routeru pro vybavení pod /api/equipment
router.use('/inventory', inventoryRoutes); // Připojení routeru pro inventář pod /api/inventory

module.exports = router;
