import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import characterService from '../services/characterService';
import storyService from '../services/storyService';
import gameService from '../services/gameService';

function StoryCharactersPage() {
  const { storyId } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Načtení příběhu a postav pro tento příběh
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Načtení detailů příběhu
        const storyData = await storyService.getStoryDetails(storyId);
        setStory(storyData);

        // Načtení postav uživatele
        const allCharacters = await characterService.getMyCharacters();

        // Filtrování postav pro tento příběh
        // Konvertujeme storyId na string pro jistotu, protože může být různých typů
        const storyCharacters = allCharacters.filter(char => String(char.story_id) === String(storyId));
        console.log('Všechny postavy:', allCharacters);
        console.log('Postavy pro příběh:', storyCharacters);
        console.log('Porovnávám story_id:', storyId);
        setCharacters(storyCharacters);

        // Automaticky vybrat první postavu, pokud existuje
        if (storyCharacters.length > 0) {
          setSelectedCharacterId(storyCharacters[0].id);
        }
      } catch (err) {
        console.error('Chyba při načítání dat:', err);
        setError(err.message || 'Nepodařilo se načíst data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storyId]);

  // Funkce pro zahájení hry
  const handleStartGame = async () => {
    if (!selectedCharacterId) {
      setError('Nejprve musíte vybrat postavu.');
      return;
    }

    setError(''); // Vyčistit předchozí chyby
    try {
      // Kontrola, zda postava již má herní sezení
      const selectedCharacter = characters.find(c => c.id === selectedCharacterId);
      if (selectedCharacter?.hasSession) {
        // Potvrzení od uživatele před smazáním existujícího sezení
        if (!window.confirm(`Postava již má rozehraný jiný příběh. Pokud budete pokračovat, předchozí postup bude ztracen. Chcete pokračovat?`)) {
          return;
        }
      }

      const sessionData = await gameService.startGame(selectedCharacterId, storyId);
      navigate(`/game/${sessionData.session.id}`); // Přesměrování na herní stránku
    } catch (err) {
      console.error('Chyba při zahajování hry:', err);
      setError(err.message || 'Nepodařilo se zahájit hru.');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Načítání dat...</div>;
  }

  if (!story) {
    return <div style={styles.error}>Příběh nebyl nalezen.</div>;
  }

  return (
    <div style={styles.container}>
      <h2>{story.metadata?.title || story.title}</h2>
      <p>{story.metadata?.description || story.description}</p>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.actionsContainer}>
        <button
          onClick={() => navigate('/dashboard')}
          style={styles.backButton}
        >
          Zpět na nástěnku
        </button>

        <button
          onClick={() => navigate(`/create-character/${storyId}`)}
          style={styles.createButton}
        >
          Vytvořit novou postavu
        </button>
      </div>

      <h3>Moje postavy pro tento příběh</h3>

      {characters.length === 0 ? (
        <p>Zatím nemáte žádné postavy pro tento příběh. Vytvořte si novou postavu.</p>
      ) : (
        <div>
          <div style={styles.characterList}>
            {characters.map(char => (
              <div
                key={char.id}
                style={{
                  ...styles.characterCard,
                  ...(selectedCharacterId === char.id ? styles.selectedCharacter : {})
                }}
                onClick={() => setSelectedCharacterId(char.id)}
              >
                <h4>{char.name}</h4>
                <p>{char.race} {char.class}, Úroveň {char.level}</p>
                <p>Zdraví: {char.current_health}/{char.max_health}</p>
                {char.max_mana > 0 && <p>Mana: {char.current_mana}/{char.max_mana}</p>}
                <p>Zlato: {char.gold}</p>

                {selectedCharacterId === char.id && (
                  <div style={styles.selectedIndicator}>✓</div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleStartGame}
            style={styles.playButton}
            disabled={!selectedCharacterId}
          >
            Hrát s vybranou postavou
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '18px',
  },
  error: {
    color: '#d32f2f',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
  },
  actionsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  backButton: {
    padding: '10px 15px',
    backgroundColor: '#757575',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  createButton: {
    padding: '10px 15px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  characterList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  characterCard: {
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
  },
  selectedCharacter: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  selectedIndicator: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#4CAF50',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  playButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
};

export default StoryCharactersPage;
