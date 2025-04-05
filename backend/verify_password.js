const bcrypt = require('bcrypt');

async function verifyPassword() {
  const storedHash = '$2b$10$V1P5tsRzI9aI1iD3SWn58eappDsYMFBu27.8.qiUgBrQdGUkcDIru';
  const password = 'password';
  
  try {
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log(`Heslo "${password}" ${isMatch ? 'odpovídá' : 'neodpovídá'} uloženému hashi.`);
    
    // Vygenerujme nový hash pro heslo "password"
    const newHash = await bcrypt.hash(password, 10);
    console.log(`Nový hash pro heslo "${password}": ${newHash}`);
    
    // Zkontrolujme, zda nový hash odpovídá heslu
    const newIsMatch = await bcrypt.compare(password, newHash);
    console.log(`Heslo "${password}" ${newIsMatch ? 'odpovídá' : 'neodpovídá'} novému hashi.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Chyba při ověřování hesla:', error);
    process.exit(1);
  }
}

verifyPassword();
