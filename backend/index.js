require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Import cors
const app = express();
const port = process.env.PORT || 3001; // Port pro backend API

// Načtení a inicializace konfigurací
require('./config/db'); // Inicializuje DB pool a testuje připojení
require('./config/gemini'); // Inicializuje Gemini klienta

// Import hlavního routeru
const mainRouter = require('./routes/index');

// Nastavení CORS - povolit požadavky z frontend dev serveru
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], // Adresy vašeho frontendu
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json()); // Middleware pro parsování JSON request body

// Připojení hlavního routeru pod prefixem /api
app.use('/api', mainRouter);

// Error handling middleware (musí být definován jako poslední middleware)
app.use((err, req, res, next) => {
  console.error('Neočekávaná chyba serveru:', err.stack || err); // Logování chyby na serveru

  // Odeslání generické chybové odpovědi klientovi
  res.status(500).json({
    message: 'Došlo k neočekávané chybě na serveru.',
    // V DEV prostředí můžeme poslat i detail chyby, v PROD ne!
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => {
  console.log(`Backend server naslouchá na portu ${port}`);
});
