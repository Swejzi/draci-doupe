const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' }); // Načtení .env pro JWT_SECRET

const jwtSecret = process.env.JWT_SECRET;

// Middleware funkce pro ověření JWT tokenu
const authenticateToken = (req, res, next) => {
  // Získání tokenu z hlavičky Authorization
  const authHeader = req.headers['authorization'];
  // Token je obvykle ve formátu "Bearer TOKEN"
  const token = authHeader && authHeader.split(' ')[1]; 

  if (token == null) {
    // Pokud token chybí
    return res.status(401).json({ message: 'Chybí autentizační token.' }); // Unauthorized
  }

  // Ověření tokenu
  jwt.verify(token, jwtSecret, (err, userPayload) => {
    if (err) {
      // Pokud je token neplatný nebo vypršel
      console.error('Chyba ověření tokenu:', err.message);
      // Můžeme rozlišit mezi vypršeným a neplatným tokenem, pokud je potřeba
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Autentizační token vypršel.' });
      }
      return res.status(403).json({ message: 'Neplatný autentizační token.' }); // Forbidden
    }

    // Token je platný, uložíme payload uživatele do objektu requestu
    // Nyní budou mít všechny následující middleware a handlery přístup k req.user
    req.user = userPayload; 
    
    next(); // Pokračujeme na další middleware nebo route handler
  });
};

module.exports = {
  authenticateToken,
};
