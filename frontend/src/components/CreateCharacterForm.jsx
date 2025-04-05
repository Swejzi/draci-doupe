import React, { useState } from 'react';
import characterService from '../services/characterService';
import { generateRandomAttribute, getAttributeCost } from '../utils/gameMechanics';

// Komponenta pro formulář na vytvoření postavy
// Přijímá funkci `onCharacterCreated` jako prop pro aktualizaci seznamu postav v DashboardPage
function CreateCharacterForm({ onCharacterCreated }) {
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [characterClass, setCharacterClass] = useState('');
  // Stavy pro atributy s výchozí hodnotou 10
  const [strength, setStrength] = useState(10);
  const [dexterity, setDexterity] = useState(10);
  const [constitution, setConstitution] = useState(10);
  const [intelligence, setIntelligence] = useState(10);
  const [wisdom, setWisdom] = useState(10);
  const [charisma, setCharisma] = useState(10);

  // Stav pro způsob zadávání atributů (ruční/náhodné)
  const [attributeMode, setAttributeMode] = useState('manual'); // 'manual' nebo 'random'
  const [pointsRemaining, setPointsRemaining] = useState(27); // Pro point-buy systém
  const DEFAULT_ATTRIBUTE_VALUE = 8; // Výchozí hodnota atributů pro point-buy
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // TODO: Načíst dostupné rasy a třídy (např. z vybraného příběhu nebo globální konfigurace)
  const availableRaces = ['Člověk', 'Elf', 'Trpaslík', 'Půlčík', 'Kroll']; // Příklad
  const availableClasses = ['Bojovník', 'Hraničář', 'Kouzelník', 'Alchymista', 'Zloděj']; // Příklad

  // Funkce pro generování náhodných atributů
  const generateRandomAttributes = () => {
    // Generování všech atributů pomocí funkce z utils/gameMechanics.js
    setStrength(generateRandomAttribute());
    setDexterity(generateRandomAttribute());
    setConstitution(generateRandomAttribute());
    setIntelligence(generateRandomAttribute());
    setWisdom(generateRandomAttribute());
    setCharisma(generateRandomAttribute());
  };

  // Funkce pro resetování atributů na výchozí hodnoty
  const resetAttributes = () => {
    setStrength(DEFAULT_ATTRIBUTE_VALUE);
    setDexterity(DEFAULT_ATTRIBUTE_VALUE);
    setConstitution(DEFAULT_ATTRIBUTE_VALUE);
    setIntelligence(DEFAULT_ATTRIBUTE_VALUE);
    setWisdom(DEFAULT_ATTRIBUTE_VALUE);
    setCharisma(DEFAULT_ATTRIBUTE_VALUE);
    setPointsRemaining(27); // Obnovení výchozího počtu bodů
  };

  // Funkce pro správu ručního zadávání atributů (point-buy systém)
  const handleAttributeChange = (attribute, value) => {
    const newValue = parseInt(value, 10) || DEFAULT_ATTRIBUTE_VALUE;
    const clampedValue = Math.max(3, Math.min(18, newValue));

    // Získat aktuální hodnotu atributu
    let currentValue;
    switch (attribute) {
      case 'strength': currentValue = strength; break;
      case 'dexterity': currentValue = dexterity; break;
      case 'constitution': currentValue = constitution; break;
      case 'intelligence': currentValue = intelligence; break;
      case 'wisdom': currentValue = wisdom; break;
      case 'charisma': currentValue = charisma; break;
      default: return;
    }

    // Použijeme funkci getAttributeCost z utils/gameMechanics.js

    // Vypočítat rozdíl v bodech
    const currentCost = getAttributeCost(currentValue);
    const newCost = getAttributeCost(clampedValue);
    const pointDifference = newCost - currentCost;

    // Zkontrolovat, zda máme dostatek bodů
    if (pointsRemaining - pointDifference < 0) {
      // Nemáme dostatek bodů, nastavit maximální možnou hodnotu
      return;
    }

    // Aktualizovat hodnotu atributu a zbývající body
    setPointsRemaining(pointsRemaining - pointDifference);

    switch (attribute) {
      case 'strength': setStrength(clampedValue); break;
      case 'dexterity': setDexterity(clampedValue); break;
      case 'constitution': setConstitution(clampedValue); break;
      case 'intelligence': setIntelligence(clampedValue); break;
      case 'wisdom': setWisdom(clampedValue); break;
      case 'charisma': setCharisma(clampedValue); break;
      default: break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !race || !characterClass) {
      setError('Jméno, rasa a třída jsou povinné.');
      setLoading(false);
      return;
    }

    // Kontrola, zda jsou atributy v povoleném rozsahu
    const attributes = [strength, dexterity, constitution, intelligence, wisdom, charisma];
    for (const attr of attributes) {
      if (attr < 3 || attr > 18) {
        setError('Všechny atributy musí být v rozsahu 3-18.');
        setLoading(false);
        return;
      }
    }

    const characterData = {
      name,
      race,
      characterClass, // Přejmenuje se na 'class' v service
      strength: parseInt(strength, 10) || 10, // Zajistit, že posíláme čísla
      dexterity: parseInt(dexterity, 10) || 10,
      constitution: parseInt(constitution, 10) || 10,
      intelligence: parseInt(intelligence, 10) || 10,
      wisdom: parseInt(wisdom, 10) || 10,
      charisma: parseInt(charisma, 10) || 10,
    };

    try {
      const result = await characterService.createCharacter(characterData);
      console.log('Postava vytvořena:', result.character);
      onCharacterCreated(result.character); // Zavolání callback funkce pro aktualizaci seznamu
      // Vyčistit formulář
      setName('');
      setRace('');
      setCharacterClass('');
      // Reset atributů
      resetAttributes();
      setError('');
    } catch (err) {
      console.error('Chyba při vytváření postavy:', err);
      setError(err.message || 'Nepodařilo se vytvořit postavu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h4>Vytvořit novou postavu</h4>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="charName" style={styles.label}>Jméno:</label>
          <input
            type="text"
            id="charName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="charRace" style={styles.label}>Rasa:</label>
          <select
            id="charRace"
            value={race}
            onChange={(e) => setRace(e.target.value)}
            required
            style={styles.input}
          >
            <option value="">-- Vyberte rasu --</option>
            {availableRaces.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="charClass" style={styles.label}>Třída:</label>
          <select
            id="charClass"
            value={characterClass}
            onChange={(e) => setCharacterClass(e.target.value)}
            required
            style={styles.input}
          >
            <option value="">-- Vyberte třídu --</option>
            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Sekce atributů */}
        <div style={styles.attributesSection}>
          <div style={styles.attributeModeSelector}>
            <label style={styles.label}>Způsob zadání atributů:</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="attributeMode"
                  value="manual"
                  checked={attributeMode === 'manual'}
                  onChange={() => setAttributeMode('manual')}
                />
                Ruční zadání
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="attributeMode"
                  value="random"
                  checked={attributeMode === 'random'}
                  onChange={() => setAttributeMode('random')}
                />
                Náhodné generování
              </label>
            </div>

            {attributeMode === 'random' && (
              <div style={styles.randomAttributesContainer}>
                <button
                  type="button"
                  onClick={generateRandomAttributes}
                  style={styles.generateButton}
                >
                  Generovat náhodné atributy
                </button>
                <div style={styles.attributeExplanation}>
                  <p>Metoda generování: <strong>4d6, odebrat nejnižší hodnotu</strong></p>
                  <p>Hodí se čtyři šestistěnné kostky, nejnižší hodnota se odebere a zbývající tři se sečtou.</p>
                </div>
              </div>
            )}

            {attributeMode === 'manual' && (
              <div style={styles.manualAttributesContainer}>
                <div style={styles.pointBuy}>
                  <span>Zbývající body: <strong>{pointsRemaining}</strong></span>
                  <button
                    type="button"
                    onClick={resetAttributes}
                    style={styles.resetButton}
                  >
                    Resetovat atributy
                  </button>
                </div>
                <div style={styles.attributeExplanation}>
                  <p>Systém přidělování bodů: <strong>Point Buy</strong></p>
                  <p>Začínáte s 27 body. Cena atributů: 8-13 (1:1), 14-15 (1:2), 16-18 (1:3).</p>
                </div>
              </div>
            )}
          </div>

          <div style={styles.attributesGrid}>
            <div style={styles.inputGroup}>
              <label htmlFor="charStr" style={styles.label}>Síla:</label>
              <input
                type="number"
                id="charStr"
                value={strength}
                onChange={(e) => handleAttributeChange('strength', e.target.value)}
                style={styles.input}
                min="3"
                max="18"
                disabled={attributeMode === 'random'}
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="charDex" style={styles.label}>Obratnost:</label>
              <input
                type="number"
                id="charDex"
                value={dexterity}
                onChange={(e) => handleAttributeChange('dexterity', e.target.value)}
                style={styles.input}
                min="3"
                max="18"
                disabled={attributeMode === 'random'}
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="charCon" style={styles.label}>Odolnost:</label>
              <input
                type="number"
                id="charCon"
                value={constitution}
                onChange={(e) => handleAttributeChange('constitution', e.target.value)}
                style={styles.input}
                min="3"
                max="18"
                disabled={attributeMode === 'random'}
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="charInt" style={styles.label}>Inteligence:</label>
              <input
                type="number"
                id="charInt"
                value={intelligence}
                onChange={(e) => handleAttributeChange('intelligence', e.target.value)}
                style={styles.input}
                min="3"
                max="18"
                disabled={attributeMode === 'random'}
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="charWis" style={styles.label}>Moudrost:</label>
              <input
                type="number"
                id="charWis"
                value={wisdom}
                onChange={(e) => handleAttributeChange('wisdom', e.target.value)}
                style={styles.input}
                min="3"
                max="18"
                disabled={attributeMode === 'random'}
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="charCha" style={styles.label}>Charisma:</label>
              <input
                type="number"
                id="charCha"
                value={charisma}
                onChange={(e) => handleAttributeChange('charisma', e.target.value)}
                style={styles.input}
                min="3"
                max="18"
                disabled={attributeMode === 'random'}
              />
            </div>
          </div>
        </div>
        {/* Logika pro rozdělování bodů nebo hody kostkou implementována */}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Vytvářím...' : 'Vytvořit postavu'}
        </button>
      </form>
    </div>
  );
}

// Styly
const styles = {
  attributeModeSelector: {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },
  radioGroup: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '0.5rem',
    marginBottom: '1rem',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  },
  generateButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginTop: '0.5rem',
  },
  randomAttributesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  manualAttributesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  pointBuy: {
    marginTop: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#e8f4f8',
    borderRadius: '4px',
    fontSize: '0.9rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attributeExplanation: {
    fontSize: '0.8rem',
    color: '#666',
    backgroundColor: '#f9f9f9',
    padding: '0.5rem',
    borderRadius: '4px',
    marginTop: '0.5rem',
    borderLeft: '3px solid #ddd',
  },
  resetButton: {
    padding: '0.3rem 0.7rem',
    backgroundColor: '#f0ad4e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    marginLeft: '1rem',
  },
  container: {
    marginTop: '2rem',
    padding: '1.5rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  label: { // Přidán styl pro popisky
    fontWeight: 'bold',
    fontSize: '0.9rem',
    color: '#333',
  },
  input: {
    padding: '0.7rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1rem', // Sjednotit velikost písma
  },
  attributesSection: { // Nový styl pro sekci atributů
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
  },
  attributesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', // Mírně širší sloupce
    gap: '1rem',
  },
  button: {
    padding: '0.8rem 1.2rem',
    backgroundColor: '#5cb85c', // Zelená pro vytvoření
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '1rem', // Větší mezera nad tlačítkem
  },
  error: {
    color: 'red',
    marginBottom: '1rem',
  },
};

export default CreateCharacterForm;
