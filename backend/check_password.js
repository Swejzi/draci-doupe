const db = require('./config/db');

async function checkPassword() {
  try {
    const result = await db.query(
      'SELECT username, password_hash FROM users WHERE username = $1',
      ['demo']
    );
    
    if (result.rows.length === 0) {
      console.log('Uživatel demo nebyl nalezen.');
      process.exit(1);
    }
    
    const user = result.rows[0];
    console.log(`Uživatel: ${user.username}`);
    console.log(`Hash hesla: ${user.password_hash}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Chyba při kontrole hesla:', error);
    process.exit(1);
  }
}

checkPassword();
