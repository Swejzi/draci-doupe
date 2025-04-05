import React, { useState } from 'react';

function CombatControls({ 
  isPlayerTurn, 
  combatState, 
  npcs, 
  onAttack, 
  onEndTurn 
}) {
  const [selectedAttackType, setSelectedAttackType] = useState('normální');
  const [selectedTarget, setSelectedTarget] = useState('');
  
  // Filtrujeme pouze živé NPC
  const aliveNpcs = npcs.filter(npc => !npc.defeated);
  
  const handleAttack = () => {
    if (!selectedTarget) {
      alert('Musíš vybrat cíl útoku!');
      return;
    }
    
    onAttack(selectedAttackType, selectedTarget);
  };
  
  // Pokud není hráč na tahu nebo nejsou žádní nepřátelé, nezobrazujeme ovládací prvky
  if (!isPlayerTurn || aliveNpcs.length === 0) {
    return (
      <div className="combat-controls" style={styles.container}>
        <div style={styles.combatInfo}>
          <h3>Souboj - Kolo {combatState.round}</h3>
          <p>Na tahu je: {combatState.currentTurn === 'player' ? 'Ty' : combatState.currentTurn}</p>
          {!isPlayerTurn && <p>Čekej na svůj tah...</p>}
          {aliveNpcs.length === 0 && <p>Všichni nepřátelé byli poraženi!</p>}
        </div>
      </div>
    );
  }
  
  return (
    <div className="combat-controls" style={styles.container}>
      <div style={styles.combatInfo}>
        <h3>Souboj - Kolo {combatState.round}</h3>
        <p>Na tahu jsi ty!</p>
      </div>
      
      <div style={styles.attackControls}>
        <div style={styles.attackTypeSelector}>
          <h4>Typ útoku:</h4>
          <div style={styles.attackTypeButtons}>
            <button 
              style={selectedAttackType === 'normální' ? styles.selectedButton : styles.button}
              onClick={() => setSelectedAttackType('normální')}
            >
              Normální útok
              <small style={styles.attackDescription}>Vyvážený útok bez bonusů a postihů</small>
            </button>
            
            <button 
              style={selectedAttackType === 'rychlý' ? styles.selectedButton : styles.button}
              onClick={() => setSelectedAttackType('rychlý')}
            >
              Rychlý útok
              <small style={styles.attackDescription}>+2 k útoku, -1 ke zranění</small>
            </button>
            
            <button 
              style={selectedAttackType === 'silný' ? styles.selectedButton : styles.button}
              onClick={() => setSelectedAttackType('silný')}
            >
              Silný útok
              <small style={styles.attackDescription}>-1 k útoku, +3 ke zranění</small>
            </button>
            
            <button 
              style={selectedAttackType === 'obranný' ? styles.selectedButton : styles.button}
              onClick={() => setSelectedAttackType('obranný')}
            >
              Obranný útok
              <small style={styles.attackDescription}>-1 k útoku, +2 k obraně</small>
            </button>
          </div>
        </div>
        
        <div style={styles.targetSelector}>
          <h4>Cíl útoku:</h4>
          <div style={styles.targetButtons}>
            {aliveNpcs.map(npc => (
              <button 
                key={npc.id}
                style={selectedTarget === npc.name ? styles.selectedButton : styles.button}
                onClick={() => setSelectedTarget(npc.name)}
              >
                {npc.name} (HP: {npc.currentHealth}/{npc.maxHealth})
              </button>
            ))}
          </div>
        </div>
        
        <div style={styles.actionButtons}>
          <button 
            style={styles.attackButton}
            onClick={handleAttack}
            disabled={!selectedTarget}
          >
            Zaútočit
          </button>
          
          <button 
            style={styles.endTurnButton}
            onClick={onEndTurn}
          >
            Ukončit tah
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#f0e6d2',
    border: '1px solid #c0a080',
    borderRadius: '5px',
    padding: '10px',
    marginBottom: '15px',
  },
  combatInfo: {
    marginBottom: '10px',
  },
  attackControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  attackTypeSelector: {
    marginBottom: '10px',
  },
  attackTypeButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
  },
  targetSelector: {
    marginBottom: '10px',
  },
  targetButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
  },
  button: {
    backgroundColor: '#e0d0b0',
    border: '1px solid #c0a080',
    borderRadius: '3px',
    padding: '5px 10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#c0a080',
    border: '1px solid #a08060',
    borderRadius: '3px',
    padding: '5px 10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontWeight: 'bold',
  },
  attackDescription: {
    fontSize: '0.8em',
    marginTop: '3px',
    color: '#666',
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  attackButton: {
    backgroundColor: '#c04040',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    padding: '8px 15px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  endTurnButton: {
    backgroundColor: '#4060c0',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    padding: '8px 15px',
    cursor: 'pointer',
  },
};

export default CombatControls;
