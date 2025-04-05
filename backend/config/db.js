const { Pool } = require('pg');
require('dotenv').config(); // Načtení .env ze správného místa

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test připojení (volitelné, ale užitečné pro diagnostiku)
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Chyba při připojování k databázi:', err.stack);
  }
  console.log('Úspěšně připojeno k PostgreSQL databázi.');
  client.query('SELECT NOW()', (err, result) => {
    release(); // Uvolnění klienta zpět do poolu
    if (err) {
      return console.error('Chyba při testovacím dotazu:', err.stack);
    }
    // console.log('Aktuální čas databáze:', result.rows[0].now);
  });
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool, // Exportujeme i pool pro případné transakce atd.
};
