import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import characterService from '../services/characterService';
import storyService from '../services/storyService';

// Komponenta pro formulář na vytvoření postavy pro konkrétní příběh
function StoryCharacterForm() {
  const { storyId } = useParams();
  const navigate = useNavigate();

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
  const [storyLoading, setStoryLoading] = useState(true);
  const [storyData, setStoryData] = useState(null);
  const [availableRaces, setAvailableRaces] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);

  // Načtení dat příběhu při načtení komponenty
  useEffect(() => {
    const fetchStoryData = async () => {
      try {
        setStoryLoading(true);
        const options = await storyService.getStoryCharacterOptions(storyId);
        setAvailableRaces(options.availableRaces);
        setAvailableClasses(options.availableClasses);
        setStoryData(await storyService.getStoryDetails(storyId));
      } catch (err) {
        console.error('Chyba při načítání dat příběhu:', err);
        setError(err.message || 'Nepodařilo se načíst data příběhu.');
      } finally {
        setStoryLoading(false);
      }
    };

    fetchStoryData();
  }, [storyId]);

  // Funkce pro reset atributů
  const resetAttributes = () => {
    if (attributeMode === 'manual') {
      setStrength(10);
      setDexterity(10);
      setConstitution(10);
      setIntelligence(10);
      setWisdom(10);
      setCharisma(10);
      setPointsRemaining(27);
    } else {
      // Náhodné generování atributů
      generateRandomAttributes();
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

    setStrength(rollAttribute());
    setDexterity(rollAttribute());
    setConstitution(rollAttribute());
    setIntelligence(rollAttribute());
    setWisdom(rollAttribute());
    setCharisma(rollAttribute());
  };

  // Změna způsobu zadávání atributů
  const handleAttributeModeChange = (mode) => {
    setAttributeMode(mode);
    if (mode === 'random') {
      generateRandomAttributes();
    } else {
      // Reset na výchozí hodnoty pro ruční zadávání
      setStrength(10);
      setDexterity(10);
      setConstitution(10);
      setIntelligence(10);
      setWisdom(10);
      setCharisma(10);
      setPointsRemaining(27);
    }
  };

  // Funkce pro změnu hodnoty atributu
  const handleAttributeChange = (attribute, value) => {
    const newValue = parseInt(value, 10);
    if (isNaN(newValue) || newValue < 3 || newValue > 18) return;

    // Implementace point-buy systému
    if (attributeMode === 'manual') {
      // Získání aktuální hodnoty atributu
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

      // Výpočet bodů potřebných pro novou hodnotu
      const currentCost = getAttributeCost(currentValue);
      const newCost = getAttributeCost(newValue);
      const pointDifference = newCost - currentCost;

      // Kontrola, zda máme dostatek bodů
      if (pointsRemaining - pointDifference < 0) {
        setError('Nemáte dostatek bodů pro tuto změnu.');
        return;
      }

      // Aktualizace hodnoty atributu a zbývajících bodů
      setPointsRemaining(pointsRemaining - pointDifference);
      switch (attribute) {
        case 'strength': setStrength(newValue); break;
        case 'dexterity': setDexterity(newValue); break;
        case 'constitution': setConstitution(newValue); break;
        case 'intelligence': setIntelligence(newValue); break;
        case 'wisdom': setWisdom(newValue); break;
        case 'charisma': setCharisma(newValue); break;
        default: break;
      }
    }
  };

  // Funkce pro výpočet ceny atributu v bodech
  const getAttributeCost = (value) => {
    if (value <= 8) return 0;
    if (value <= 13) return value - 8;
    if (value <= 15) return (value - 13) * 2 + 5;
    return (value - 15) * 3 + 9;
  };

  // Odeslání formuláře
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
      characterClass,
      strength: parseInt(strength, 10) || 10,
      dexterity: parseInt(dexterity, 10) || 10,
      constitution: parseInt(constitution, 10) || 10,
      intelligence: parseInt(intelligence, 10) || 10,
      wisdom: parseInt(wisdom, 10) || 10,
      charisma: parseInt(charisma, 10) || 10,
      generationMethod: attributeMode,
      storyId: storyId // Přidáno ID příběhu
    };

    try {
      console.log('Odesílám data postavy:', characterData);
      const result = await characterService.createCharacter(characterData);
      console.log('Postava vytvořena:', result.character);

      // Přesměrování na stránku s postavami pro tento příběh
      navigate(`/story/${storyId}/characters`);
    } catch (err) {
      console.error('Chyba při vytváření postavy:', err);
      setError(err.message || 'Nepodařilo se vytvořit postavu.');
    } finally {
      setLoading(false);
    }
  };

  if (storyLoading) {
    return <div style={styles.loading}>Načítání dat příběhu...</div>;
  }

  if (!storyData) {
    return <div style={styles.error}>Příběh nebyl nalezen nebo se nepodařilo načíst data.</div>;
  }

  return (
    <div style={styles.container}>
      <h2>Vytvoření postavy pro příběh: {storyData.metadata?.title || storyData.title}</h2>
      <p>{storyData.metadata?.description || storyData.description}</p>

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

        <div style={styles.attributesSection}>
          <h4>Atributy postavy</h4>
          <div style={styles.attributeModeSelector}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="attributeMode"
                value="manual"
                checked={attributeMode === 'manual'}
                onChange={() => handleAttributeModeChange('manual')}
              />
              Ruční zadání
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="attributeMode"
                value="random"
                checked={attributeMode === 'random'}
                onChange={() => handleAttributeModeChange('random')}
              />
              Náhodné generování
            </label>
          </div>

          {attributeMode === 'manual' && (
            <div style={styles.pointsRemaining}>
              Zbývající body: <strong>{pointsRemaining}</strong>
            </div>
          )}

          {attributeMode === 'random' && (
            <button
              type="button"
              onClick={generateRandomAttributes}
              style={styles.rerollButton}
            >
              Přehodit atributy
            </button>
          )}

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

        <div style={styles.buttonContainer}>
          <button type="button" onClick={() => navigate('/dashboard')} style={styles.cancelButton}>
            Zrušit
          </button>
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Vytvářím...' : 'Vytvořit postavu'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Styly
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '18px'
  },
  error: {
    color: '#d32f2f',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#ffebee',
    borderRadius: '4px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '10px'
  },
  label: {
    marginBottom: '5px',
    fontWeight: 'bold'
  },
  input: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px'
  },
  attributesSection: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f0f0f0',
    borderRadius: '8px'
  },
  attributeModeSelector: {
    display: 'flex',
    gap: '20px',
    marginBottom: '15px'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer'
  },
  pointsRemaining: {
    marginBottom: '15px',
    padding: '8px',
    backgroundColor: '#e8f5e9',
    borderRadius: '4px',
    textAlign: 'center'
  },
  rerollButton: {
    padding: '8px 15px',
    backgroundColor: '#90caf9',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '15px'
  },
  attributesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
  }
};

export default StoryCharacterForm;
