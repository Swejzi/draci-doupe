import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import characterService from '../services/characterService';
import storyService from '../services/storyService';
import gameService from '../services/gameService'; // Import gameService
import { Link, useNavigate } from 'react-router-dom';
import CreateCharacterForm from '../components/CreateCharacterForm'; // Import formuláře

function DashboardPage() {
  const { currentUser } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [stories, setStories] = useState([]);
  const [loadingChars, setLoadingChars] = useState(true);
  const [loadingStories, setLoadingStories] = useState(true);
  const [error, setError] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState(null); // Stav pro vybranou postavu
  const navigate = useNavigate(); 

  // Načtení postav a příběhů při načtení komponenty
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingChars(true);
        setLoadingStories(true);
        setError('');
        const chars = await characterService.getMyCharacters();
        const availableStories = await storyService.getAvailableStories();
        setCharacters(chars);
        setStories(availableStories);
        // Pokud má uživatel postavy a žádná není vybrána, předvybereme první
        if (chars.length > 0 && !selectedCharacterId) {
          setSelectedCharacterId(chars[0].id);
        }
      } catch (err) {
        console.error('Chyba načítání dat pro dashboard:', err);
        setError(err.message || 'Nepodařilo se načíst data.');
      } finally {
        setLoadingChars(false);
        setLoadingStories(false);
      }
    };
    fetchData();
  // Závislost selectedCharacterId odstraněna, aby se nespouštělo znovu při výběru
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); 

  // Funkce pro zahájení hry
  const handleStartGame = async (characterId, storyId) => {
    if (!characterId) {
      setError('Nejprve musíte vybrat postavu.'); 
      return;
    }
    setError(''); // Vyčistit předchozí chyby
    console.log(`Zahajuji hru s postavou ${characterId} a příběhem ${storyId}`);
    try {
      const sessionData = await gameService.startGame(characterId, storyId);
      navigate(`/game/${sessionData.session.id}`); // Přesměrování na herní stránku
    } catch (err) {
      console.error('Chyba při zahajování hry:', err);
      setError(err.message || 'Nepodařilo se zahájit hru.');
    }
  };

  // Callback funkce pro aktualizaci seznamu po vytvoření postavy
  const handleCharacterCreated = (newCharacter) => {
    // Přidáme novou postavu na začátek seznamu
    setCharacters(prevChars => [newCharacter, ...prevChars]);
    // Automaticky vybereme nově vytvořenou postavu
    setSelectedCharacterId(newCharacter.id); 
  };

  return (
    <div>
      <h2>Vítej na nástěnce, {currentUser?.username}!</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <section style={styles.section}>
        <h3>Moje postavy</h3>
        {loadingChars ? (
          <p>Načítám postavy...</p>
        ) : characters.length > 0 ? (
          <ul style={styles.list}>
            {characters.map((char) => (
              // Přidán styl pro zvýraznění celé položky
              <li 
                key={char.id} 
                style={{...styles.listItem, ...(selectedCharacterId === char.id ? styles.selectedListItem : {})}}
                onClick={() => setSelectedCharacterId(char.id)} // Výběr kliknutím na celou položku
              >
                <span style={selectedCharacterId === char.id ? styles.selectedCharacterText : {}}>
                  <strong>{char.name}</strong> ({char.race} {char.class}, Úroveň {char.level})
                </span>
                {/* Tlačítko je nyní spíše indikátor */}
                <span style={selectedCharacterId === char.id ? styles.buttonSelected : styles.buttonSelect}>
                  {selectedCharacterId === char.id ? '✓ Vybráno' : 'Vybrat'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Zatím nemáte žádné postavy.</p>
        )}
        {/* Formulář pro vytvoření postavy */}
        <CreateCharacterForm onCharacterCreated={handleCharacterCreated} />
      </section>

      <section style={styles.section}>
        <h3>Dostupné příběhy</h3>
        {loadingStories ? (
          <p>Načítám příběhy...</p>
        ) : stories.length > 0 ? (
          <ul style={styles.list}>
            {stories.map((story) => (
              <li key={story.id} style={styles.listItemStory}> {/* Jiný styl pro příběhy */}
                <div>
                  <strong>{story.title}</strong> (Autor: {story.author})
                  <p>{story.description}</p>
                </div>
                <button
                  onClick={() => handleStartGame(selectedCharacterId, story.id)} // Použít vybranou postavu
                  disabled={!selectedCharacterId} // Zakázat, pokud není vybrána postava
                  style={selectedCharacterId ? styles.buttonPlay : styles.buttonDisabled}
                  title={selectedCharacterId ? `Hrát s postavou ID: ${selectedCharacterId}` : 'Nejprve vyberte postavu'}
                >
                  Hrát tento příběh {selectedCharacterId ? 's vybranou postavou' : '(vyberte postavu)'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nebyly nalezeny žádné příběhy.</p>
        )}
      </section>
    </div>
  );
}

// Styly
const styles = {
  section: {
    marginBottom: '2rem',
    padding: '1rem',
    border: '1px solid #eee',
    borderRadius: '4px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  listItem: { // Styl pro položku postavy
    marginBottom: '0.5rem', // Menší mezera
    padding: '0.8rem', // Padding pro celou položku
    borderBottom: '1px solid #eee',
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    cursor: 'pointer', // Ukazatel pro kliknutí
    borderRadius: '4px', // Zaoblení
    transition: 'background-color 0.2s ease', // Přechod pro hover
    '&:hover': { // Hover efekt (vyžaduje CSS-in-JS nebo moduly)
      backgroundColor: '#f8f9fa',
    }
  },
  selectedListItem: { // Styl pro vybranou položku postavy
    backgroundColor: '#e9f5e9', // Světle zelené pozadí
    borderLeft: '4px solid #28a745', // Zelený pruh vlevo
    paddingLeft: 'calc(0.8rem - 4px)', // Upravit padding kvůli borderu
  },
  listItemStory: { // Styl pro položku příběhu (podobný, ale bez hoveru a výběru)
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #eee',
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
  },
  buttonPlay: { 
    padding: '0.5rem 1rem',
    backgroundColor: '#282c34',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap', // Zabrání zalomení textu tlačítka
  },
  buttonDisabled: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ccc',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
  },
  buttonSelect: { // Nyní spíše indikátor
    padding: '0.3rem 0.6rem',
    backgroundColor: 'transparent', // Průhledné pozadí
    color: '#6c757d', // Šedá barva
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '0.8rem',
    marginLeft: '1rem', 
    pointerEvents: 'none', // Nereaguje na kliknutí
  },
  buttonSelected: { // Indikátor vybrání
    padding: '0.3rem 0.6rem',
    backgroundColor: '#28a745', // Zelená 
    color: 'white',
    border: '1px solid #28a745',
    borderRadius: '4px',
    fontSize: '0.8rem',
    marginLeft: '1rem', 
    pointerEvents: 'none', 
  },
  selectedCharacterText: { // Styl pro text vybrané postavy
    fontWeight: 'bold',
    // Barvu už neřešíme zde, řeší ji pozadí celé položky
  }
};


export default DashboardPage;
