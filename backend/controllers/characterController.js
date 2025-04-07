const db = require('../config/db');
const { getAttributeBonus } = require('../utils/gameMechanics'); // Import funkce

// Získání všech postav přihlášeného uživatele
const getCharacters = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Získání základních informací o postavách
    const charactersResult = await db.query(
      'SELECT id, name, race, class, level FROM characters WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    // Získání informací o herních sezeních
    const sessionsResult = await db.query(
      'SELECT character_id, story_id FROM game_sessions WHERE user_id = $1',
      [userId]
    );

    // Vytvoření mapy character_id -> story_id
    const characterSessions = {};
    sessionsResult.rows.forEach(session => {
      characterSessions[session.character_id] = session.story_id;
    });

    // Přidání informace o herním sezení ke každé postavě
    const characters = charactersResult.rows.map(character => ({
      ...character,
      hasSession: !!characterSessions[character.id],
      storyId: characterSessions[character.id] || null
    }));

    res.status(200).json(characters);
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

// Funkce pro náhodné generování atributů
const generateRandomAttributes = () => {
  // Metoda 4d6, odebrat nejnižší hodnotu
  const rollAttribute = () => {
    const rolls = [];
    for (let i = 0; i < 4; i++) {
      rolls.push(Math.floor(Math.random() * 6) + 1); // Hod 1d6
    }
    // Seřadit a odebrat nejnižší hodnotu
    rolls.sort((a, b) => a - b);
    rolls.shift(); // Odstranit nejnižší hodnotu
    // Součet zbývajících tří hodnot
    return rolls.reduce((sum, roll) => sum + roll, 0);
  };

  // Generování šesti atributů
  return {
    strength: rollAttribute(),
    dexterity: rollAttribute(),
    constitution: rollAttribute(),
    intelligence: rollAttribute(),
    wisdom: rollAttribute(),
    charisma: rollAttribute()
  };
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
    charisma,
    generationMethod, // 'manual' nebo 'random'
    storyId // ID příběhu, pro který je postava vytvářena
  } = req.body;

  // Základní validace
  if (!name || !race || !characterClass) {
    return res.status(400).json({ message: 'Chybí jméno, rasa nebo třída postavy.' });
  }

  // TODO: Přidat validaci ras a tříd dle příběhu/pravidel

  try {
    let attributes;

    // Zpracování atributů podle zvolené metody
    if (generationMethod === 'random') {
      // Náhodné generování atributů
      attributes = generateRandomAttributes();
    } else {
      // Ruční zadání atributů
      const parseStat = (value, defaultValue = 10) => {
        const num = parseInt(value, 10);
        return isNaN(num) ? defaultValue : Math.max(3, Math.min(18, num));
      };
      attributes = {
        strength: parseStat(strength),
        dexterity: parseStat(dexterity),
        constitution: parseStat(constitution),
        intelligence: parseStat(intelligence),
        wisdom: parseStat(wisdom),
        charisma: parseStat(charisma)
      };
    }

    const strValue = attributes.strength;
    const dexValue = attributes.dexterity;
    const conValue = attributes.constitution;
    const intValue = attributes.intelligence;
    const wisValue = attributes.wisdom;
    const chaValue = attributes.charisma;

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

    // Výchozí hodnota zlata pro novou postavu
    const defaultGold = 50; // Základní hodnota zlata, pokud není specifikována v příběhu

    // Validace story_id
    if (!storyId) {
      return res.status(400).json({ message: 'Chybí ID příběhu pro vytvoření postavy.' });
    }

    const result = await db.query(
      `INSERT INTO characters
        (user_id, name, race, class, strength, dexterity, constitution, intelligence, wisdom, charisma, max_health, current_health, max_mana, current_mana, gold, story_id)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        userId, name, race, characterClass,
        strValue, dexValue, conValue, intValue, wisValue, chaValue,
        maxHealthValue, maxHealthValue, // current = max na startu
        maxManaValue, maxManaValue,     // current = max na startu
        defaultGold,                    // výchozí zlato
        storyId                         // ID příběhu
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

// Aktualizace existující postavy
const updateCharacter = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.id;
  const {
    name,
    race,
    class: characterClass,
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

  try {
    // Nejprve ověříme, že postava patří přihlášenému uživateli
    const characterCheck = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nenalezena nebo nepatří tomuto uživateli.' });
    }

    // Získáme aktuální data postavy
    const currentCharacter = characterCheck.rows[0];

    // Zpracování atributů
    const parseStat = (value, currentValue) => {
      const num = parseInt(value, 10);
      return isNaN(num) ? currentValue : Math.max(3, Math.min(18, num));
    };

    const strValue = parseStat(strength, currentCharacter.strength);
    const dexValue = parseStat(dexterity, currentCharacter.dexterity);
    const conValue = parseStat(constitution, currentCharacter.constitution);
    const intValue = parseStat(intelligence, currentCharacter.intelligence);
    const wisValue = parseStat(wisdom, currentCharacter.wisdom);
    const chaValue = parseStat(charisma, currentCharacter.charisma);

    // Výpočet nových hodnot zdraví a many podle třídy a atributů
    const conBonus = getAttributeBonus(conValue);
    const intBonus = getAttributeBonus(intValue);

    // Výpočet nových maximálních hodnot zdraví a many
    let maxHealthValue = 0;
    let maxManaValue = 0;

    switch (characterClass) {
    case 'Bojovník':
      maxHealthValue = 10 + conBonus;
      break;
    case 'Kouzelník':
      maxHealthValue = 4 + conBonus;
      maxManaValue = 10 + intBonus * 2;
      break;
    case 'Hraničář':
      maxHealthValue = 8 + conBonus;
      break;
    case 'Zloděj':
      maxHealthValue = 6 + conBonus;
      break;
    case 'Alchymista':
      maxHealthValue = 5 + conBonus;
      maxManaValue = 8 + intBonus * 2;
      break;
    default:
      maxHealthValue = 6 + conBonus;
    }

    // Zajistit minimálně 1 život
    maxHealthValue = Math.max(1, maxHealthValue);

    // Pokud je postava na vyšší úrovni, přidáme bonus za každou úroveň
    if (currentCharacter.level > 1) {
      // Přidáme bonus za každou úroveň nad 1
      const levelBonus = (currentCharacter.level - 1) * (characterClass === 'Bojovník' ? 5 : 3);
      maxHealthValue += levelBonus;

      // Pro postavy s manou přidáme bonus za každou úroveň
      if (maxManaValue > 0) {
        const manaLevelBonus = (currentCharacter.level - 1) * 2;
        maxManaValue += manaLevelBonus;
      }
    }

    // Aktualizace postavy v databázi
    const result = await db.query(
      `UPDATE characters
       SET name = $1, race = $2, class = $3,
           strength = $4, dexterity = $5, constitution = $6,
           intelligence = $7, wisdom = $8, charisma = $9,
           max_health = $10, max_mana = $11,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 AND user_id = $13
       RETURNING *`,
      [
        name, race, characterClass,
        strValue, dexValue, conValue,
        intValue, wisValue, chaValue,
        maxHealthValue, maxManaValue,
        characterId, userId
      ]
    );

    // Aktualizace aktuálního zdraví a many, pokud nové maximum je menší než aktuální hodnota
    if (result.rows[0].current_health > result.rows[0].max_health) {
      await db.query(
        'UPDATE characters SET current_health = max_health WHERE id = $1',
        [characterId]
      );
    }

    if (result.rows[0].current_mana > result.rows[0].max_mana) {
      await db.query(
        'UPDATE characters SET current_mana = max_mana WHERE id = $1',
        [characterId]
      );
    }

    // Získání aktualizované postavy
    const updatedCharacter = await db.query(
      'SELECT * FROM characters WHERE id = $1',
      [characterId]
    );

    res.status(200).json({
      message: 'Postava úspěšně aktualizována.',
      character: updatedCharacter.rows[0],
    });

  } catch (error) {
    console.error('Chyba při aktualizaci postavy:', error);
    res.status(500).json({ message: 'Interní chyba serveru při aktualizaci postavy.' });
  }
};

// Smazání postavy
const deleteCharacter = async (req, res) => {
  const userId = req.user.userId;
  const characterId = req.params.id;

  try {
    // Nejprve ověříme, že postava patří přihlášenému uživateli
    const characterCheck = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Postava nenalezena nebo nepatří tomuto uživateli.' });
    }

    // Kontrola, zda postava není v aktivním herním sezení
    const sessionCheck = await db.query(
      'SELECT * FROM game_sessions WHERE character_id = $1',
      [characterId]
    );

    if (sessionCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'Nelze smazat postavu, která je v aktivním herním sezení. Nejprve ukončete sezení.'
      });
    }

    // Smazání postavy
    await db.query(
      'DELETE FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    res.status(200).json({ message: 'Postava úspěšně smazána.' });

  } catch (error) {
    console.error('Chyba při mazání postavy:', error);
    res.status(500).json({ message: 'Interní chyba serveru při mazání postavy.' });
  }
};

module.exports = {
  getCharacters,
  getCharacterById,
  createCharacter,
  updateCharacter,
  deleteCharacter
};
