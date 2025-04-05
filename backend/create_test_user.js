const bcrypt = require('bcrypt');
const db = require('./config/db');

async function createTestUser() {
  const username = 'test';
  const email = 'test@example.com';
  const password = 'password';
  const saltRounds = 10;

  try {
    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existingUser.rows.length > 0) {
      console.log('User already exists');
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const newUser = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, passwordHash]
    );

    console.log('User created successfully:', newUser.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
}

createTestUser();
