const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Připojení k databázi
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Funkce pro spuštění migrace
async function runMigration(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`Spouštím migraci: ${path.basename(filePath)}`);
  
  try {
    await pool.query(sql);
    console.log(`Migrace ${path.basename(filePath)} úspěšně dokončena.`);
    return true;
  } catch (error) {
    console.error(`Chyba při spouštění migrace ${path.basename(filePath)}:`, error);
    return false;
  }
}

// Hlavní funkce
async function main() {
  try {
    // Spustíme konkrétní migraci
    const migrationPath = path.join(__dirname, 'db', 'migrations', '009_add_story_id_to_characters.sql');
    const success = await runMigration(migrationPath);
    
    if (success) {
      console.log('Migrace byla úspěšně dokončena.');
    } else {
      console.error('Migrace selhala.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Neočekávaná chyba:', error);
    process.exit(1);
  } finally {
    // Ukončení spojení s databází
    await pool.end();
  }
}

// Spuštění hlavní funkce
main();
