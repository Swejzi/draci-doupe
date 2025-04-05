const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Import DB konfigurace
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // Explicitní načtení .env

// Kontrola načtení JWT_SECRET (tato proběhne jen jednou při startu modulu)
console.log('JWT_SECRET in authController (initial load):', process.env.JWT_SECRET ? 'Loaded' : 'NOT LOADED'); 

const saltRounds = 10; // Počet saltovacích kol pro bcrypt
const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = '1d'; // Platnost tokenu (např. 1 den)

// Funkce pro registraci nového uživatele
const register = async (req, res) => {
  const { username, email, password } = req.body;

  // Základní validace vstupu
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Chybí uživatelské jméno, email nebo heslo.' });
  }

  try {
    // 1. Zkontrolovat, zda uživatel nebo email již neexistuje
    const existingUser = await db.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existingUser.rows.length > 0) {
      const userExists = existingUser.rows[0].username === username;
      const emailExists = existingUser.rows[0].email === email;
      let message = 'Uživatel s tímto ';
      if (userExists && emailExists) message += 'uživatelským jménem a emailem';
      else if (userExists) message += 'uživatelským jménem';
      else message += 'emailem';
      message += ' již existuje.';
      return res.status(409).json({ message }); 
    }

    // 2. Hashovat heslo
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Uložit nového uživatele do databáze
    const newUser = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, passwordHash]
    );

    // 4. Odeslat úspěšnou odpověď
    res.status(201).json({ 
      message: 'Uživatel úspěšně zaregistrován.', 
      user: newUser.rows[0] 
    });

  } catch (error) {
    console.error('Chyba při registraci:', error);
    res.status(500).json({ message: 'Interní chyba serveru při registraci.' });
  }
};

// Funkce pro přihlášení
const login = async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: 'Chybí uživatelské jméno/email nebo heslo.' });
  }

  let user = null; // Definujeme user zde pro širší scope

  try {
    // 1. Najít uživatele
    console.log(`[Login] Hledám uživatele: ${usernameOrEmail}`);
    const userResult = await db.query(
      'SELECT id, username, email, password_hash FROM users WHERE username = $1 OR email = $1',
      [usernameOrEmail]
    );

    if (userResult.rows.length === 0) {
      console.log(`[Login] Uživatel nenalezen: ${usernameOrEmail}`);
      return res.status(401).json({ message: 'Neplatné přihlašovací údaje.' }); 
    }
    user = userResult.rows[0];
    console.log(`[Login] Uživatel nalezen: ${user.username} (ID: ${user.id})`);

    // 2. Porovnat heslo
    console.log(`[Login] Porovnávám heslo pro uživatele ${user.username}...`);
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } catch (compareError) {
      console.error('[Login] Chyba při bcrypt.compare:', compareError);
      // Vracíme 500, protože chyba není v datech od uživatele, ale v procesu porovnání
      return res.status(500).json({ message: 'Interní chyba serveru při ověřování hesla.' });
    }
    
    if (!isMatch) {
      console.log(`[Login] Heslo nesouhlasí pro uživatele ${user.username}`);
      return res.status(401).json({ message: 'Neplatné přihlašovací údaje.' }); 
    }
    console.log(`[Login] Heslo souhlasí pro uživatele ${user.username}`);

    // 3. Vygenerovat JWT token
    const payload = { userId: user.id, username: user.username };
    
    console.log('[Login] Signing JWT with secret:', jwtSecret ? 'Secret Found' : 'SECRET MISSING!'); 
    if (!jwtSecret) {
      console.error('[Login] FATAL: JWT_SECRET is not defined! Cannot sign token.');
      return res.status(500).json({ message: 'Interní chyba serveru - chybí konfigurace pro token.' });
    }

    let token = null;
    try {
      token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
      console.log(`[Login] JWT token vygenerován pro uživatele ${user.username}`);
    } catch (signError) {
      console.error('[Login] Chyba při jwt.sign:', signError);
      return res.status(500).json({ message: 'Interní chyba serveru při generování tokenu.' });
    }

    // 4. Odeslat odpověď
    res.status(200).json({
      message: 'Přihlášení úspěšné.',
      token: token,
      user: { id: user.id, username: user.username, email: user.email }
    });

  } catch (error) {
    // Tento catch blok zachytí hlavně chyby z db.query
    console.error('[Login] Neočekávaná chyba v procesu přihlášení:', error); 
    res.status(500).json({ message: 'Interní chyba serveru při přihlašování.' });
  }
};

// Funkce pro získání stavu přihlášení
const status = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Uživatel není přihlášen.' });
  }
  try {
    const userResult = await db.query('SELECT id, username, email FROM users WHERE id = $1', [req.user.userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Uživatel nenalezen.' });
    }
    res.status(200).json({ 
      message: 'Uživatel je přihlášen.', 
      user: userResult.rows[0] 
    });
  } catch (error) {
    console.error('Chyba při načítání stavu uživatele:', error);
    res.status(500).json({ message: 'Interní chyba serveru.' });
  }
};

// Funkce pro odhlášení
const logout = async (req, res) => {
  res.status(200).json({ message: 'Odhlášení úspěšné.' });
};

module.exports = {
  register,
  login,
  status,
  logout,
};
