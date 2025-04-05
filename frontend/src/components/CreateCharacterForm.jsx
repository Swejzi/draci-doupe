import React, { useState } from 'react';
import characterService from '../services/characterService';

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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // TODO: Načíst dostupné rasy a třídy (např. z vybraného příběhu nebo globální konfigurace)
  const availableRaces = ['Člověk', 'Elf', 'Trpaslík', 'Půlčík', 'Kroll']; // Příklad
  const availableClasses = ['Bojovník', 'Hraničář', 'Kouzelník', 'Alchymista', 'Zloděj']; // Příklad

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !race || !characterClass) {
      setError('Jméno, rasa a třída jsou povinné.');
      setLoading(false);
      return;
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
      setStrength(10); // Reset atributů
      setDexterity(10);
      setConstitution(10);
      setIntelligence(10);
      setWisdom(10);
      setCharisma(10);
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
          <div style={styles.attributesGrid}>
            <div style={styles.inputGroup}>
              <label htmlFor="charStr" style={styles.label}>Síla:</label>
              <input type="number" id="charStr" value={strength} onChange={(e) => setStrength(e.target.value)} style={styles.input} min="3" max="18" />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="charDex" style={styles.label}>Obratnost:</label>
              <input type="number" id="charDex" value={dexterity} onChange={(e) => setDexterity(e.target.value)} style={styles.input} min="3" max="18" />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="charCon" style={styles.label}>Odolnost:</label>
              <input type="number" id="charCon" value={constitution} onChange={(e) => setConstitution(e.target.value)} style={styles.input} min="3" max="18" />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="charInt" style={styles.label}>Inteligence:</label>
              <input type="number" id="charInt" value={intelligence} onChange={(e) => setIntelligence(e.target.value)} style={styles.input} min="3" max="18" />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="charWis" style={styles.label}>Moudrost:</label>
              <input type="number" id="charWis" value={wisdom} onChange={(e) => setWisdom(e.target.value)} style={styles.input} min="3" max="18" />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="charCha" style={styles.label}>Charisma:</label>
              <input type="number" id="charCha" value={charisma} onChange={(e) => setCharisma(e.target.value)} style={styles.input} min="3" max="18" />
            </div>
          </div>
        </div>
        {/* TODO: Přidat logiku pro rozdělování bodů nebo hody kostkou dle pravidel */}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Vytvářím...' : 'Vytvořit postavu'}
        </button>
      </form>
    </div>
  );
}

// Styly
const styles = {
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
