const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const characterRoutes = require('./character'); // Načtení routeru pro postavy
const storyRoutes = require('./story'); // Načtení routeru pro příběhy
const gameRoutes = require('./game'); // Načtení routeru pro hru
const questRoutes = require('./quests'); // Načtení routeru pro úkoly

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

module.exports = router;
