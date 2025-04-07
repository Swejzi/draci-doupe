import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import characterService from '../services/characterService';
import storyService from '../services/storyService';
import gameService from '../services/gameService'; // Import gameService
import { Link, useNavigate } from 'react-router-dom';
// Formulář pro vytvoření postavy je nyní v samostatné stránce

function DashboardPage() {
  const { currentUser } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [stories, setStories] = useState([]);
  const [loadingChars, setLoadingChars] = useState(false); // Nastaveno na false, protože postavy načítáme pouze pro zobrazení v kontextu příběhu
  const [loadingStories, setLoadingStories] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Načtení příběhů při načtení komponenty
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingStories(true);
        setError('');
        const availableStories = await storyService.getAvailableStories();
        setStories(availableStories);
      } catch (err) {
        console.error('Chyba načítání dat pro dashboard:', err);
        setError(err.message || 'Nepodařilo se načíst data.');
      } finally {
        setLoadingStories(false);
      }
    };
    fetchData();
  }, []);

  // Funkce pro zahájení hry byla odstraněna, protože hra se nyní zahájí až po výběru postavy
  // v kontextu konkrétního příběhu

  // Funkce pro přidání nově vytvořené postavy do seznamu byla odstraněna,
  // protože vytváření postav je nyní v samostatné stránce

  return (
    <div>
      <h2>Vítej na nástěnce, {currentUser?.username}!</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Sekce s postavami byla odstraněna, protože postavy jsou nyní vytvářeny až po výběru příběhu */}

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
                <div style={styles.storyButtons}>
                  <button
                    onClick={() => navigate(`/story/${story.id}/characters`)}
                    style={styles.buttonPlay}
                  >
                    Hrát tento příběh
                  </button>
                </div>
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

  buttonCreate: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
  },

  storyButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'flex-start'
  },

  characterSelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%'
  },

  characterSelect: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '100%'
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
