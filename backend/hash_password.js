const bcrypt = require('bcrypt');
const saltRounds = 10;
const passwordToHash = 'password'; // Heslo pro demo uživatele

bcrypt.hash(passwordToHash, saltRounds, function(err, hash) {
  if (err) {
    console.error('Chyba při hashování hesla:', err);
    process.exit(1);
  }
  console.log('Heslo:', passwordToHash);
  console.log('Hash:', hash);
  // Důležité: Zkopírujte tento hash a vložte ho do SQL skriptu!
});
