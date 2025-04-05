const db = require('./config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function simulateLogin() {
  const usernameOrEmail = 'demo';
  const password = 'password';
  
  try {
    console.log(`[Simulace] Hledám uživatele: ${usernameOrEmail}`);
    const userResult = await db.query(
      'SELECT id, username, email, password_hash FROM users WHERE username = $1 OR email = $1',
      [usernameOrEmail]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`[Simulace] Uživatel nenalezen: ${usernameOrEmail}`);
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log(`[Simulace] Uživatel nalezen: ${user.username} (ID: ${user.id})`);
    
    console.log(`[Simulace] Porovnávám heslo pro uživatele ${user.username}...`);
    console.log(`[Simulace] Heslo: "${password}"`);
    console.log(`[Simulace] Hash v DB: "${user.password_hash}"`);
    
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      console.log(`[Simulace] Heslo nesouhlasí pro uživatele ${user.username}`);
      process.exit(1);
    }
    
    console.log(`[Simulace] Heslo souhlasí pro uživatele ${user.username}`);
    
    const jwtSecret = process.env.JWT_SECRET;
    console.log(`[Simulace] JWT_SECRET: ${jwtSecret ? 'Nalezen' : 'CHYBÍ!'}`);
    
    if (!jwtSecret) {
      console.error('[Simulace] FATAL: JWT_SECRET není definován!');
      process.exit(1);
    }
    
    const payload = { userId: user.id, username: user.username };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
    
    console.log(`[Simulace] JWT token vygenerován pro uživatele ${user.username}`);
    console.log(`[Simulace] Token: ${token}`);
    
    console.log('[Simulace] Přihlášení úspěšné.');
    process.exit(0);
  } catch (error) {
    console.error('[Simulace] Chyba při simulaci přihlášení:', error);
    process.exit(1);
  }
}

simulateLogin();
