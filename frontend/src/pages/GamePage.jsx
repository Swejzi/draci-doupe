import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gameService from '../services/gameService';
import characterService from '../services/characterService';
import storyService from '../services/storyService';
import { useAuth } from '../context/AuthContext';
import CombatControls from '../components/CombatControls';

function GamePage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [session, setSession] = useState(null);
  const [character, setCharacter] = useState(null);
  const [storyData, setStoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerInput, setPlayerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTargetButtons, setShowTargetButtons] = useState(false); // Stav pro zobrazení tlačítek cílů
  const [selectedTarget, setSelectedTarget] = useState(null); // Stav pro vybraný cíl

  // Stav pro souboj
  const [combatActive, setCombatActive] = useState(false);
  const [combatState, setCombatState] = useState({
    round: 1,
    currentTurn: '',
    combatants: [],
    npcs: []
  });

  const gameLogRef = useRef(null);
  const formRef = useRef(null);

  // Načtení stavu hry a dat příběhu
  useEffect(() => {
    const loadGameData = async () => {
      setLoading(true);
      setError('');
      try {
        const sessionData = await gameService.getGameSession(sessionId);
        setSession(sessionData);

        if (sessionData?.character_id) {
          const charData = await characterService.getCharacterDetails(sessionData.character_id);
          setCharacter(charData);
        } else {
          throw new Error('V datech sezení chybí ID postavy.');
        }

        if (sessionData?.game_state?.storyId) {
          const story = await storyService.getStoryDetails(sessionData.game_state.storyId);
          setStoryData(story);
        } else {
          throw new Error('V datech sezení chybí ID příběhu.');
        }

      } catch (err) {
        console.error('Chyba načítání herních dat:', err);
        setError(err.message || 'Nepodařilo se načíst herní data.');
      } finally {
        setLoading(false);
      }
    };
    loadGameData();
  }, [sessionId]);

  // Scroll dolů v logu
  useEffect(() => {
    if (gameLogRef.current) {
      gameLogRef.current.scrollTop = gameLogRef.current.scrollHeight;
    }
  }, [session]);

  // Odeslání akce
  const submitAction = async (actionText, targetName = null) => { // Přidán parametr targetName
    if (!actionText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    setPlayerInput('');
    setSelectedTarget(null); // Resetovat cíl
    setShowTargetButtons(false); // Skrýt tlačítka

    try {
      // Poslat akci i cíl na backend
      const result = await gameService.handlePlayerAction(sessionId, actionText, targetName);
      setSession(result.session);
      if (result.session?.character_id) {
        try {
          const updatedCharData = await characterService.getCharacterDetails(result.session.character_id);
          setCharacter(updatedCharData);
        } catch (charErr) {
          console.error('Chyba při znovunačítání postavy po akci:', charErr);
          setError('Chyba při aktualizaci stavu postavy.');
        }
      }
    } catch (err) {
      console.error('Chyba při odesílání akce:', err);
      setError(err.message || 'Nepodařilo se odeslat akci.');
      setPlayerInput(actionText); // Vrátit text, pokud byla chyba
    } finally {
      setIsSubmitting(false);
    }
  };

  // Změna textu v inputu - kontrola, zda zobrazit cíle
  const handleInputChange = (e) => {
    const text = e.target.value;
    setPlayerInput(text);
    // Jednoduchá detekce klíčových slov pro útok
    if (/\b(útok|zaútoč|udeř|střel|bojuj)\b/i.test(text)) {
      setShowTargetButtons(true);
    } else {
      setShowTargetButtons(false);
      setSelectedTarget(null); // Resetovat cíl, pokud zmizí klíčové slovo
    }
  };

  // Odeslání formuláře
  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Pokud jsou zobrazeny cíle a žádný není vybrán, neodesílat (nebo odeslat bez cíle?)
    if (showTargetButtons && !selectedTarget) {
      setError('Vyberte cíl útoku.');
      return;
    }
    setError('');
    submitAction(playerInput, selectedTarget);
  };

  // Kliknutí na tlačítko možnosti
  const handleOptionClick = (optionText) => {
    // Pokud možnost obsahuje útočné slovo, zobrazit cíle
    if (/\b(útok|zaútoč|udeř|střel|bojuj)\b/i.test(optionText)) {
      setPlayerInput(optionText); // Vyplnit input
      setShowTargetButtons(true); // Zobrazit cíle
      setSelectedTarget(null); // Resetovat výběr cíle
    } else {
      // Jinak rovnou odeslat
      submitAction(optionText);
    }
  };

  // Kliknutí na tlačítko cíle
  const handleTargetClick = (npcName) => {
    setSelectedTarget(npcName);
    // Můžeme rovnou odeslat, nebo počkat na submit formuláře
    // Pro jednoduchost rovnou odešleme
    submitAction(playerInput, npcName);
  };

  // Funkce pro zpracování soubojových akcí
  const handleCombatAttack = (attackType, targetName) => {
    // Vytvoříme text akce na základě typu útoku a cíle
    const actionText = `${attackType} útok na ${targetName}`;
    submitAction(actionText, targetName);
  };

  // Funkce pro ukončení tahu v souboji
  const handleEndTurn = () => {
    submitAction('Ukončit tah');
  };

  // Aktualizace stavu souboje na základě odpovědi ze serveru
  useEffect(() => {
    if (!session || !session.game_state) return;

    // Kontrola, zda je aktivní souboj
    const gameState = session.game_state;
    if (gameState.combat && gameState.combat.active) {
      setCombatActive(true);
      setCombatState({
        round: gameState.combat.round || 1,
        currentTurn: gameState.combat.combatants?.[gameState.combat.turnIndex]?.id || '',
        combatants: gameState.combat.combatants || [],
        npcs: gameState.combat.npcs || []
      });
    } else {
      setCombatActive(false);
    }
  }, [session]);


  // Render
  if (loading) return <div>Načítám hru...</div>;
  if (error && !error.includes('aktualizaci stavu postavy')) return <div style={{ color: 'red' }}>Chyba: {error}</div>; // Nezobrazovat chybu aktualizace postavy jako fatální
  if (!session || !character || !storyData) return <div>Herní sezení, postava nebo data příběhu nenalezena.</div>;

  const lastResponse = session.game_state?.lastAIResponse || {};
  const { description, npcs: aiNpcs = [], actions = [], mechanics, options = [] } = lastResponse;
  const lastDiceRoll = session.game_state?.lastDiceRoll;
  const activeQuests = session.game_state?.activeQuests || [];
  const lastPlayerAction = session.game_state?.lastPlayerAction;

  // Získání detailů NPC v aktuální lokaci
  const currentLocationData = storyData.locations.find(loc => loc.id === session.game_state.currentLocationId);
  const npcsInLocation = currentLocationData?.npcs
    ?.map(npcId => {
      const npcData = storyData.npcs.find(n => n.id === npcId);
      if (!npcData) return null;
      const npcState = session.game_state.npcStates?.[npcId];
      const currentHealth = npcState?.current_health ?? npcData.stats?.health;
      return currentHealth > 0 ? { ...npcData, current_health: currentHealth } : null;
    })
    .filter(n => n);

  return (
    <div style={styles.pageContainer}>
      {/* Postranní panel */}
      <div style={styles.sidebar}>
        <h3>{character.name}</h3>
        <div style={styles.characterSheet}>
          <div style={styles.characterInfoMain}>
                Třída: {character.class} | Úr: {character.level} | XP: {character.experience}
          </div>
          <div style={styles.characterInfoMain}>
                 HP: {character.current_health}/{character.max_health}
            {character.max_mana > 0 && (<> | Mana: {character.current_mana}/{character.max_mana}</>)}
                 | Zlato: {character.gold}
          </div>
          <div style={styles.attributes}>
            <strong>Atr:</strong> SÍ:{character.strength} OBR:{character.dexterity} ODL:{character.constitution} INT:{character.intelligence} MDR:{character.wisdom} CHR:{character.charisma}
          </div>
        </div>
        {character.inventory && character.inventory.length > 0 && (
          <div style={styles.inventory}>
            <strong>Inventář:</strong>
            {character.inventory.map((item, index) => (
              <span key={index} style={styles.inventoryItem}>
                {item.name} ({item.quantity})
              </span>
            ))}
          </div>
        )}
        {activeQuests.length > 0 && (
          <div style={styles.quests}>
            <strong>Úkoly:</strong>
            <ul style={styles.questList}>
              {activeQuests.map((quest, index) => (
                <li key={index}>{quest.title}</li>
              ))}
            </ul>
          </div>
        )}
        {npcsInLocation && npcsInLocation.length > 0 && (
          <div style={styles.presentNpcs}>
            <strong>Přítomné postavy:</strong>
            <ul style={styles.npcList}>
              {npcsInLocation.map((npc) => (
                <li key={npc.id}>
                  {npc.name} (HP: {npc.current_health ?? npc.stats?.health ?? '?'})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Hlavní herní oblast */}
      <div style={styles.mainContent}>
        <h2>{session.game_state?.storyTitle || 'Dobrodružství'}</h2>

        {/* Herní log */}
        <div ref={gameLogRef} style={styles.gameLog}>
          {lastPlayerAction && (<p style={styles.playerAction}><strong>&gt; {lastPlayerAction}</strong></p>)}
          <div style={styles.aiResponse}>
            {description && <p style={styles.description}>{description}</p>}
            {aiNpcs.map((npc, index) => (
              <p key={`npc-${index}`} style={styles.npcDialogue}>
                <strong>{npc.name}:</strong> "{npc.dialogue}"
              </p>
            ))}
            {actions.length > 0 && (
              <div style={styles.actions}>
                <strong>Akce:</strong>
                <ul>{actions.map((act, index) => <li key={`action-${index}`}>{act}</li>)}</ul>
              </div>
            )}
            {mechanics && (<p style={styles.mechanics}><strong>Mechaniky:</strong> {mechanics}</p>)}
            {lastDiceRoll && (
              <p style={styles.diceRoll}>
                <strong>Poslední hod:</strong> {lastDiceRoll.dice} = {lastDiceRoll.result}
                {lastDiceRoll.success !== undefined && (
                  <span style={lastDiceRoll.success ? styles.successText : styles.failureText}>
                    {lastDiceRoll.success ? ' (Úspěch!)' : ' (Neúspěch)'}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Možnosti pro hráče */}
        {options.length > 0 && !isSubmitting && (
          <div style={styles.options}>
            <strong>Možnosti:</strong>
            <div style={styles.optionsButtons}>
              {options.map((opt, index) => (
                <button
                  key={`opt-${index}`}
                  onClick={() => handleOptionClick(opt)}
                  style={styles.optionButton}
                  disabled={isSubmitting}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Soubojové ovládací prvky */}
        {combatActive && (
          <CombatControls
            isPlayerTurn={combatState.currentTurn === 'player'}
            combatState={combatState}
            npcs={combatState.npcs}
            onAttack={handleCombatAttack}
            onEndTurn={handleEndTurn}
          />
        )}

        {/* Formulář pro zadání akce */}
        <form onSubmit={handleFormSubmit} style={styles.inputForm}>
          <input
            type="text"
            value={playerInput}
            onChange={handleInputChange} // Použít nový handler
            placeholder="Napiš vlastní akci..."
            disabled={isSubmitting || (combatActive && combatState.currentTurn !== 'player')}
            style={styles.input}
          />
          <button
            type="submit"
            disabled={isSubmitting || !playerInput.trim() || (showTargetButtons && !selectedTarget) || (combatActive && combatState.currentTurn !== 'player')}
            style={styles.button}
          >
            {isSubmitting ? 'Odesílám...' : 'Odeslat akci'}
          </button>
        </form>

        {/* Tlačítka pro výběr cíle */}
        {!combatActive && showTargetButtons && npcsInLocation && npcsInLocation.length > 0 && (
          <div style={styles.targetSelection}>
            <strong>Vyber cíl:</strong>
            <div style={styles.optionsButtons}>
              {npcsInLocation.map((npc) => (
                <button
                  key={npc.id}
                  onClick={() => handleTargetClick(npc.name)}
                  style={selectedTarget === npc.name ? styles.targetSelectedButton : styles.targetButton}
                  disabled={isSubmitting}
                >
                  {npc.name} (HP: {npc.current_health ?? '?'})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Zobrazení chyby, pokud je potřeba vybrat cíl */}
        {error && error.includes('Vyberte cíl') && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}

      </div>
    </div>
  );
}

// Styly
const styles = {
  pageContainer: {
    display: 'flex',
    gap: '1.5rem',
    maxWidth: '1400px',
    margin: '1rem auto',
    padding: '0 1rem',
  },
  sidebar: {
    flex: '0 0 280px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    height: 'fit-content',
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
  },
  mainContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  gameLog: {
    flexGrow: 1,
    overflowY: 'auto',
    border: '1px solid #eee',
    padding: '1rem',
    marginBottom: '1rem',
    backgroundColor: '#fdfdfd',
    borderRadius: '4px',
    minHeight: '300px',
  },
  playerAction: {
    marginBottom: '1rem',
    color: '#333',
    backgroundColor: '#e9ecef',
    padding: '0.5rem',
    borderRadius: '4px',
  },
  aiResponse: {
    marginBottom: '1rem',
  },
  description: { marginBottom: '1rem', fontStyle: 'italic', color: '#444' },
  npcDialogue: { marginBottom: '0.5rem', color: '#0056b3' },
  actions: { marginTop: '1rem', padding: '0.5rem', borderLeft: '3px solid #ffc107', backgroundColor: '#fffbeb', fontSize: '0.9em' },
  mechanics: { marginTop: '1rem', fontStyle: 'italic', color: '#6c757d', fontSize: '0.9em' },
  diceRoll: { marginTop: '0.5rem', fontWeight: 'bold', color: '#6c757d', fontSize: '0.9em' },
  successText: { color: '#28a745', fontWeight: 'bold'},
  failureText: { color: '#dc3545', fontWeight: 'bold'},
  options: { marginBottom: '1rem', padding: '0.5rem', border: '1px dashed #ccc', fontSize: '0.9em' },
  inputForm: { display: 'flex', gap: '0.5rem', marginTop: 'auto' },
  input: { flexGrow: 1, padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' },
  button: { padding: '0.8rem 1.2rem', backgroundColor: '#282c34', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  optionsButtons: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' },
  optionButton: { padding: '0.5rem 0.8rem', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', textAlign: 'left' },
  header: {
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
  },
  characterSheet: {
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px dashed #ccc',
  },
  characterInfoMain: { fontSize: '0.9em', color: '#555', marginBottom: '0.3rem' },
  attributes: { fontSize: '0.8em', color: '#6c757d', wordSpacing: '0.3em' },
  subHeader: { display: 'flex', flexWrap: 'wrap', gap: '1rem' },
  inventory: { fontSize: '0.85em', color: '#666', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #eee' },
  inventoryItem: { marginRight: '0.5rem', marginBottom: '0.3rem', display: 'inline-block', padding: '0.2rem 0.4rem', backgroundColor: '#f0f0f0', borderRadius: '3px', whiteSpace: 'nowrap' },
  quests: { fontSize: '0.85em', color: '#17a2b8', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #eee' },
  questList: { paddingLeft: '1.2em', margin: '0.3em 0', listStyle: 'none' },
  presentNpcs: {
    fontSize: '0.85em',
    color: '#495057',
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: '1px dashed #eee'
  },
  npcList: {
    paddingLeft: '0', // Odebrat odsazení seznamu
    margin: '0.3em 0',
    listStyle: 'none',
  },
  targetSelection: { // Styl pro výběr cíle
    marginTop: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
  },
  targetButton: { // Styl pro tlačítko cíle
    padding: '0.4rem 0.7rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: '1px solid #5a6268',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  targetSelectedButton: { // Styl pro vybrané tlačítko cíle
    padding: '0.4rem 0.7rem',
    backgroundColor: '#dc3545', // Červená pro vybraný cíl
    color: 'white',
    border: '1px solid #c82333',
    borderRadius: '4px',
    cursor: 'pointer',
  }
};

export default GamePage;
