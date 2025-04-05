const db = require('../config/db');
const { getAttributeBonus } = require('../utils/gameMechanics'); // Import funkce

// Získání všech postav přihlášeného uživatele
const getCharacters = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await db.query(
      'SELECT id, name, race, class, level FROM characters WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Chyba při získávání postav:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání postav.' });
  }
};

// Získání detailu jedné postavy podle ID
const getCharacterById = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.id;

  try {
    const result = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nenalezena nebo nepatří tomuto uživateli.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Chyba při získávání detailu postavy:', error);
    res.status(500).json({ message: 'Interní chyba serveru při získávání detailu postavy.' });
  }
};

// Vytvoření nové postavy
const createCharacter = async (req, res) => {
  const userId = req.user.userId;
  const {
    name,
    race,
    class: characterClass, // Používáme class z req.body a přejmenováváme na characterClass
    strength,
    dexterity,
    constitution,
    intelligence,
    wisdom,
    charisma
  } = req.body;

  // Základní validace
  if (!name || !race || !characterClass) {
    return res.status(400).json({ message: 'Chybí jméno, rasa nebo třída postavy.' });
  }

  // TODO: Přidat validaci ras a tříd dle příběhu/pravidel

  try {
    // Zpracování atributů
    const parseStat = (value, defaultValue = 10) => {
      const num = parseInt(value, 10);
      return isNaN(num) ? defaultValue : Math.max(3, Math.min(18, num));
    };
    const strValue = parseStat(strength);
    const dexValue = parseStat(dexterity);
    const conValue = parseStat(constitution);
    const intValue = parseStat(intelligence);
    const wisValue = parseStat(wisdom);
    const chaValue = parseStat(charisma);

    // Výpočet počátečních životů a many podle třídy (zjednodušená pravidla)
    let maxHealthValue = 0;
    let maxManaValue = 0;
    const conBonus = getAttributeBonus(conValue);
    const intBonus = getAttributeBonus(intValue);

    switch (characterClass) {
    case 'Bojovník':
      maxHealthValue = 10 + conBonus;
      break;
    case 'Kouzelník':
      maxHealthValue = 4 + conBonus;
      maxManaValue = 10 + intBonus * 2; // Příklad výpočtu many
      break;
    case 'Hraničář':
      maxHealthValue = 8 + conBonus;
      // Hraničář může mít manu na vyšších úrovních, začíná s 0
      break;
    case 'Zloděj':
      maxHealthValue = 6 + conBonus;
      break;
    case 'Alchymista': // Předpoklad pro manu
      maxHealthValue = 5 + conBonus;
      maxManaValue = 8 + intBonus * 2;
      break;
    default: // Pro ostatní třídy (pokud přidáme)
      maxHealthValue = 6 + conBonus;
    }
    // Zajistit minimálně 1 život
    maxHealthValue = Math.max(1, maxHealthValue);

    const result = await db.query(
      `INSERT INTO characters
        (user_id, name, race, class, strength, dexterity, constitution, intelligence, wisdom, charisma, max_health, current_health, max_mana, current_mana)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        userId, name, race, characterClass,
        strValue, dexValue, conValue, intValue, wisValue, chaValue,
        maxHealthValue, maxHealthValue, // current = max na startu
        maxManaValue, maxManaValue     // current = max na startu
      ]
    );

    res.status(201).json({
      message: 'Postava úspěšně vytvořena.',
      character: result.rows[0],
    });

  } catch (error) {
    console.error('Chyba při vytváření postavy:', error);
    res.status(500).json({ message: 'Interní chyba serveru při vytváření postavy.' });
  }
};

// TODO: Přidat funkce pro update a delete postavy

module.exports = {
  getCharacters,
  getCharacterById,
  createCharacter,
};
