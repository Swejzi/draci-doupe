import React, { useState, useEffect } from 'react';
import questService from '../services/questService';

const QuestLog = ({ sessionId, storyData, gameState }) => {
  const [activeQuests, setActiveQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [questDetails, setQuestDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'main', 'side'

  // Načtení aktivních úkolů
  useEffect(() => {
    if (!sessionId) return;

    const fetchActiveQuests = async () => {
      try {
        setLoading(true);
        const quests = await questService.getActiveQuests(sessionId);
        console.log('Načteny aktivní úkoly:', quests);
        setActiveQuests(quests);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání úkolů:', error);
        setError(error.message || 'Chyba při načítání úkolů.');
        setLoading(false);
      }
    };

    fetchActiveQuests();
  }, [sessionId, gameState]); // Přidán gameState jako závislost

  // Načtení detailů úkolu při výběru
  useEffect(() => {
    if (!sessionId || !selectedQuest) return;

    const fetchQuestDetails = async () => {
      try {
        setLoading(true);
        const details = await questService.getQuestDetails(sessionId, selectedQuest.id);
        setQuestDetails(details);
        setLoading(false);
      } catch (error) {
        console.error('Chyba při načítání detailů úkolu:', error);
        setError(error.message || 'Chyba při načítání detailů úkolu.');
        setLoading(false);
      }
    };

    fetchQuestDetails();
  }, [sessionId, selectedQuest]);

  // Aktualizace stavu cíle
  const handleObjectiveToggle = async (objectiveId, completed) => {
    if (!sessionId || !selectedQuest) return;

    try {
      setLoading(true);
      const result = await questService.updateObjectiveStatus(
        sessionId,
        selectedQuest.id,
        objectiveId,
        !completed
      );

      // Aktualizace detailů úkolu
      if (result.success) {
        // Pokud byl úkol dokončen, aktualizujeme seznam aktivních úkolů
        if (result.questCompleted) {
          const updatedQuests = activeQuests.filter(q => q.id !== selectedQuest.id);
          setActiveQuests(updatedQuests);
          setSelectedQuest(null);
          setQuestDetails(null);
        } else {
          // Aktualizace stavu cíle v detailech úkolu
          setQuestDetails(prev => ({
            ...prev,
            objectives: prev.objectives.map(obj =>
              obj.id === objectiveId ? { ...obj, completed: !completed } : obj
            )
          }));
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Chyba při aktualizaci stavu cíle:', error);
      setError(error.message || 'Chyba při aktualizaci stavu cíle.');
      setLoading(false);
    }
  };

  // Výběr úkolu
  const handleQuestSelect = (quest) => {
    console.log('Vybrán úkol:', quest);
    setSelectedQuest(quest);
  };

  // Zavření detailů úkolu
  const handleCloseDetails = () => {
    setSelectedQuest(null);
    setQuestDetails(null);
  };

  if (loading) {
    return <div style={styles.loading}>Načítání úkolů...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  if (activeQuests.length === 0) {
    return <div style={styles.noQuests}>Nemáš žádné aktivní úkoly.</div>;
  }

  // Filtrované úkoly podle vybraného filtru
  const filteredQuests = activeQuests.filter(quest => {
    if (filter === 'all') return true;
    return quest.type === filter;
  });

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Úkoly</h3>

      {!selectedQuest ? (
        <>
          <div style={styles.filterContainer}>
            <button
              style={{
                ...styles.filterButton,
                ...(filter === 'all' ? styles.activeFilter : {})
              }}
              onClick={() => setFilter('all')}
            >
              Všechny
            </button>
            <button
              style={{
                ...styles.filterButton,
                ...(filter === 'main' ? styles.activeFilter : {})
              }}
              onClick={() => setFilter('main')}
            >
              Hlavní
            </button>
            <button
              style={{
                ...styles.filterButton,
                ...(filter === 'side' ? styles.activeFilter : {})
              }}
              onClick={() => setFilter('side')}
            >
              Vedlejší
            </button>
          </div>
        <div style={styles.questList}>
          {filteredQuests.length === 0 ? (
            <div style={styles.noQuests}>Nemáš žádné {filter === 'main' ? 'hlavní' : filter === 'side' ? 'vedlejší' : ''} úkoly.</div>
          ) : (
            filteredQuests.map((quest) => {
            const questDef = storyData?.quests?.find(q => q.id === quest.id);
            const totalObjectives = questDef?.objectives?.length || 0;
            const completedCount = quest.completedObjectives ? Object.keys(quest.completedObjectives).length : 0;

            return (
              <div
                key={quest.id || `quest-${quest.title}`}
                style={{
                  ...styles.questItem,
                  ...(quest.type === 'main' ? styles.mainQuestItem : {}),
                  ...(quest.type === 'side' ? styles.sideQuestItem : {})
                }}
                onClick={() => handleQuestSelect(quest)}
              >
                <div style={styles.questTitle}>
                  {quest.type === 'main' && <span style={styles.mainQuestBadge}>Hlavní</span>}
                  {quest.type === 'side' && <span style={styles.sideQuestBadge}>Vedlejší</span>}
                  {quest.title}
                </div>
                <div style={styles.questProgress}>
                  {quest.id ? `${completedCount}/${totalObjectives} cílů splněno` : 'Bez definovaných cílů'}
                </div>
              </div>
            );
          }))
          }
        </div>
        </>
      ) : (
        <div style={styles.questDetails}>
          <button style={styles.backButton} onClick={handleCloseDetails}>
            &larr; Zpět na seznam
          </button>

          <h4 style={styles.detailsTitle}>
            {questDetails?.type === 'main' && <span style={styles.mainQuestBadge}>Hlavní</span>}
            {questDetails?.type === 'side' && <span style={styles.sideQuestBadge}>Vedlejší</span>}
            {questDetails?.title}
          </h4>
          <p style={styles.detailsDescription}>{questDetails?.description}</p>

          <div style={styles.objectivesList}>
            <h5 style={styles.objectivesTitle}>Cíle:</h5>
            {questDetails?.objectives?.map((objective) => (
              <div key={objective.id} style={styles.objectiveItem}>
                <input
                  type="checkbox"
                  checked={objective.completed}
                  onChange={() => handleObjectiveToggle(objective.id, objective.completed)}
                  style={styles.checkbox}
                />
                <span
                  style={{
                    ...styles.objectiveText,
                    ...(objective.completed ? styles.completedObjective : {})
                  }}
                >
                  {objective.description}
                </span>
              </div>
            ))}
          </div>

          {questDetails?.rewards && (
            <div style={styles.rewards}>
              <h5 style={styles.rewardsTitle}>Odměny:</h5>
              <ul style={styles.rewardsList}>
                {questDetails.rewards.experience && (
                  <li style={styles.rewardItem}>
                    <span style={styles.rewardLabel}>Zkušenosti:</span> {questDetails.rewards.experience} XP
                  </li>
                )}
                {questDetails.rewards.gold && (
                  <li style={styles.rewardItem}>
                    <span style={styles.rewardLabel}>Zlato:</span> {questDetails.rewards.gold} zlaťáků
                  </li>
                )}
                {questDetails.rewards.items && questDetails.rewards.items.length > 0 && (
                  <li style={styles.rewardItem}>
                    <span style={styles.rewardLabel}>Předměty:</span>
                    <ul style={styles.itemsList}>
                      {questDetails.rewards.items.map((item, index) => (
                        <li key={index} style={styles.itemName}>
                          {item.name || item}
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  filterContainer: {
    display: 'flex',
    marginBottom: '15px',
    gap: '10px',
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: 'pointer',
    fontSize: '0.9em',
    transition: 'background-color 0.2s',
  },
  activeFilter: {
    backgroundColor: '#4caf50',
    color: 'white',
  },
  mainQuestItem: {
    borderLeft: '4px solid #4caf50',
  },
  sideQuestItem: {
    borderLeft: '4px solid #2196f3',
  },
  mainQuestBadge: {
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.7em',
    marginRight: '8px',
    verticalAlign: 'middle',
  },
  sideQuestBadge: {
    backgroundColor: '#2196f3',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.7em',
    marginRight: '8px',
    verticalAlign: 'middle',
  },
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: '5px',
    padding: '15px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  title: {
    margin: '0 0 15px 0',
    color: '#333',
    borderBottom: '1px solid #ddd',
    paddingBottom: '5px',
  },
  loading: {
    padding: '10px',
    color: '#666',
    fontStyle: 'italic',
  },
  error: {
    padding: '10px',
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
  },
  noQuests: {
    padding: '10px',
    color: '#666',
    fontStyle: 'italic',
  },
  questList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  questItem: {
    backgroundColor: '#fff',
    borderRadius: '4px',
    padding: '10px',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f9f9f9',
    },
  },
  questTitle: {
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  questProgress: {
    fontSize: '0.9em',
    color: '#666',
  },
  questDetails: {
    backgroundColor: '#fff',
    borderRadius: '4px',
    padding: '15px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    marginBottom: '15px',
    cursor: 'pointer',
    fontSize: '0.9em',
  },
  detailsTitle: {
    margin: '0 0 10px 0',
    color: '#333',
  },
  detailsDescription: {
    marginBottom: '15px',
    color: '#555',
  },
  objectivesList: {
    marginBottom: '20px',
  },
  objectivesTitle: {
    margin: '0 0 10px 0',
    color: '#333',
  },
  objectiveItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  checkbox: {
    marginRight: '10px',
  },
  objectiveText: {
    color: '#333',
  },
  completedObjective: {
    textDecoration: 'line-through',
    color: '#888',
  },
  rewards: {
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    padding: '10px',
  },
  rewardsTitle: {
    margin: '0 0 10px 0',
    color: '#333',
  },
  rewardsList: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
  },
  rewardItem: {
    marginBottom: '5px',
  },
  rewardLabel: {
    fontWeight: 'bold',
    marginRight: '5px',
  },
  itemsList: {
    listStyle: 'disc',
    paddingLeft: '20px',
    margin: '5px 0 0 0',
  },
  itemName: {
    marginBottom: '3px',
  },
};

export default QuestLog;
