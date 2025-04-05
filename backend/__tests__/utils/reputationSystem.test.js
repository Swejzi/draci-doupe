const {
  REPUTATION_LEVELS,
  initializeCharacterReputation,
  getReputationLevel,
  changeReputation,
  getReputationWithFaction,
  getPriceModifier,
  hasRequiredReputation,
  getFactionsFromStory,
  getFactionById,
  getNpcFaction,
  getFactionRelationship,
  getReputationModifierFromRelationship,
  changeReputationWithFactionRelationships
} = require('../../utils/reputationSystem');

describe('Reputation System', () => {
  // Mock data
  const mockFactions = [
    {
      id: 'faction1',
      name: 'Faction 1',
      description: 'Test faction 1',
      baseAttitude: 'friendly',
      allies: ['faction2'],
      enemies: ['faction3'],
      leaders: ['leader1'],
      territory: ['territory1'],
      specialization: 'test'
    },
    {
      id: 'faction2',
      name: 'Faction 2',
      description: 'Test faction 2',
      baseAttitude: 'neutral',
      allies: ['faction1'],
      enemies: ['faction3'],
      leaders: [],
      territory: ['territory2'],
      specialization: 'test'
    },
    {
      id: 'faction3',
      name: 'Faction 3',
      description: 'Test faction 3',
      baseAttitude: 'hostile',
      allies: [],
      enemies: ['faction1', 'faction2'],
      leaders: [],
      territory: ['territory3'],
      specialization: 'test'
    }
  ];

  const mockStoryData = {
    factions: mockFactions,
    npcs: [
      {
        id: 'npc1',
        name: 'NPC 1',
        faction: 'faction1'
      },
      {
        id: 'npc2',
        name: 'NPC 2',
        faction: 'faction2'
      },
      {
        id: 'npc3',
        name: 'NPC 3'
        // No faction
      }
    ]
  };

  describe('getReputationLevel', () => {
    test('should return correct reputation level for positive values', () => {
      expect(getReputationLevel(0).name).toBe('neutral');
      expect(getReputationLevel(50).name).toBe('liked');
      expect(getReputationLevel(100).name).toBe('respected');
      expect(getReputationLevel(150).name).toBe('honored');
      expect(getReputationLevel(200).name).toBe('exalted');
      expect(getReputationLevel(250).name).toBe('exalted'); // Above max
    });

    test('should return correct reputation level for negative values', () => {
      expect(getReputationLevel(-1).name).toBe('disliked');
      expect(getReputationLevel(-50).name).toBe('disliked');
      expect(getReputationLevel(-100).name).toBe('hated');
      expect(getReputationLevel(-150).name).toBe('hated'); // Below min
    });
  });

  describe('initializeCharacterReputation', () => {
    test('should initialize reputation for new character', () => {
      const character = {
        name: 'Test Character'
      };

      const result = initializeCharacterReputation(character, mockFactions);

      expect(result.reputation).toBeDefined();
      expect(Object.keys(result.reputation).length).toBe(3);
      expect(result.reputation.faction1.value).toBe(50); // friendly
      expect(result.reputation.faction2.value).toBe(0); // neutral
      expect(result.reputation.faction3.value).toBe(-50); // hostile
    });

    test('should not overwrite existing reputation', () => {
      const character = {
        name: 'Test Character',
        reputation: {
          faction1: {
            value: 100,
            level: REPUTATION_LEVELS.RESPECTED
          }
        }
      };

      const result = initializeCharacterReputation(character, mockFactions);

      expect(result.reputation.faction1.value).toBe(100);
      expect(result.reputation.faction2).toBeDefined();
      expect(result.reputation.faction3).toBeDefined();
    });
  });

  describe('changeReputation', () => {
    test('should increase reputation', () => {
      const character = {
        name: 'Test Character',
        reputation: {
          faction1: {
            value: 0,
            level: REPUTATION_LEVELS.NEUTRAL
          }
        }
      };

      const result = changeReputation(character, 'faction1', 50);

      expect(result.success).toBe(true);
      expect(character.reputation.faction1.value).toBe(50);
      expect(character.reputation.faction1.level.name).toBe('liked');
      expect(result.levelChanged).toBe(true);
    });

    test('should decrease reputation', () => {
      const character = {
        name: 'Test Character',
        reputation: {
          faction1: {
            value: 50,
            level: REPUTATION_LEVELS.LIKED
          }
        }
      };

      const result = changeReputation(character, 'faction1', -100);

      expect(result.success).toBe(true);
      expect(character.reputation.faction1.value).toBe(-50);
      expect(character.reputation.faction1.level.name).toBe('disliked');
      expect(result.levelChanged).toBe(true);
    });

    test('should not exceed maximum reputation', () => {
      const character = {
        name: 'Test Character',
        reputation: {
          faction1: {
            value: 150,
            level: REPUTATION_LEVELS.HONORED
          }
        }
      };

      const result = changeReputation(character, 'faction1', 100);

      expect(result.success).toBe(true);
      expect(character.reputation.faction1.value).toBe(200); // Max is 200
      expect(character.reputation.faction1.level.name).toBe('exalted');
    });

    test('should not go below minimum reputation', () => {
      const character = {
        name: 'Test Character',
        reputation: {
          faction1: {
            value: -50,
            level: REPUTATION_LEVELS.DISLIKED
          }
        }
      };

      const result = changeReputation(character, 'faction1', -200);

      expect(result.success).toBe(true);
      expect(character.reputation.faction1.value).toBe(-200); // Min is -200
      expect(character.reputation.faction1.level.name).toBe('hated');
    });

    test('should initialize reputation if not present', () => {
      const character = {
        name: 'Test Character',
        reputation: {}
      };

      const result = changeReputation(character, 'faction1', 50);

      expect(result.success).toBe(true);
      expect(character.reputation.faction1).toBeDefined();
      expect(character.reputation.faction1.value).toBe(50);
    });
  });

  describe('getReputationWithFaction', () => {
    test('should return reputation with faction', () => {
      const character = {
        name: 'Test Character',
        reputation: {
          faction1: {
            value: 50,
            level: REPUTATION_LEVELS.LIKED
          }
        }
      };

      const result = getReputationWithFaction(character, 'faction1');

      expect(result.value).toBe(50);
      expect(result.level.name).toBe('liked');
    });

    test('should return neutral reputation if not present', () => {
      const character = {
        name: 'Test Character',
        reputation: {}
      };

      const result = getReputationWithFaction(character, 'faction1');

      expect(result.value).toBe(0);
      expect(result.level.name).toBe('neutral');
    });

    test('should return neutral reputation if character has no reputation', () => {
      const character = {
        name: 'Test Character'
      };

      const result = getReputationWithFaction(character, 'faction1');

      expect(result.value).toBe(0);
      expect(result.level.name).toBe('neutral');
    });
  });

  describe('getPriceModifier', () => {
    test('should return correct price modifier based on reputation', () => {
      const character = {
        name: 'Test Character',
        reputation: {
          faction1: {
            value: -100,
            level: REPUTATION_LEVELS.HATED
          },
          faction2: {
            value: 0,
            level: REPUTATION_LEVELS.NEUTRAL
          },
          faction3: {
            value: 100,
            level: REPUTATION_LEVELS.RESPECTED
          }
        }
      };

      expect(getPriceModifier(character, 'faction1')).toBe(2.0); // Hated
      expect(getPriceModifier(character, 'faction2')).toBe(1.0); // Neutral
      expect(getPriceModifier(character, 'faction3')).toBe(0.8); // Respected
    });

    test('should return neutral price modifier if faction not found', () => {
      const character = {
        name: 'Test Character',
        reputation: {}
      };

      expect(getPriceModifier(character, 'faction1')).toBe(1.0); // Neutral
    });
  });

  describe('hasRequiredReputation', () => {
    test('should return true if character has required reputation', () => {
      const character = {
        name: 'Test Character',
        reputation: {
          faction1: {
            value: 100,
            level: REPUTATION_LEVELS.RESPECTED
          }
        }
      };

      expect(hasRequiredReputation(character, 'faction1', 50)).toBe(true);
      expect(hasRequiredReputation(character, 'faction1', 100)).toBe(true);
    });

    test('should return false if character does not have required reputation', () => {
      const character = {
        name: 'Test Character',
        reputation: {
          faction1: {
            value: 50,
            level: REPUTATION_LEVELS.LIKED
          }
        }
      };

      expect(hasRequiredReputation(character, 'faction1', 100)).toBe(false);
    });

    test('should return false if faction not found', () => {
      const character = {
        name: 'Test Character',
        reputation: {}
      };

      expect(hasRequiredReputation(character, 'faction1', 50)).toBe(false);
    });
  });

  describe('getFactionsFromStory', () => {
    test('should return factions from story data', () => {
      const result = getFactionsFromStory(mockStoryData);

      expect(result).toEqual(mockFactions);
    });

    test('should return empty array if no factions in story data', () => {
      const result = getFactionsFromStory({});

      expect(result).toEqual([]);
    });
  });

  describe('getFactionById', () => {
    test('should return faction by ID', () => {
      const result = getFactionById(mockStoryData, 'faction1');

      expect(result).toEqual(mockFactions[0]);
    });

    test('should return null if faction not found', () => {
      const result = getFactionById(mockStoryData, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getNpcFaction', () => {
    test('should return faction of NPC', () => {
      const result = getNpcFaction(mockStoryData, 'npc1');

      expect(result).toEqual(mockFactions[0]);
    });

    test('should return null if NPC has no faction', () => {
      const result = getNpcFaction(mockStoryData, 'npc3');

      expect(result).toBeNull();
    });

    test('should return null if NPC not found', () => {
      const result = getNpcFaction(mockStoryData, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getFactionRelationship', () => {
    test('should return ally relationship', () => {
      const result = getFactionRelationship(mockStoryData, 'faction1', 'faction2');

      expect(result).toBe('ally');
    });

    test('should return enemy relationship', () => {
      const result = getFactionRelationship(mockStoryData, 'faction1', 'faction3');

      expect(result).toBe('enemy');
    });

    test('should return neutral relationship if not ally or enemy', () => {
      const result = getFactionRelationship(mockStoryData, 'faction1', 'nonexistent');

      expect(result).toBe('neutral');
    });

    test('should return neutral relationship if faction not found', () => {
      const result = getFactionRelationship(mockStoryData, 'nonexistent', 'faction1');

      expect(result).toBe('neutral');
    });
  });

  describe('getReputationModifierFromRelationship', () => {
    test('should return positive modifier for ally', () => {
      const result = getReputationModifierFromRelationship(mockStoryData, 'faction1', 'faction2', 100);

      expect(result).toBe(50); // 50% of 100
    });

    test('should return negative modifier for enemy', () => {
      const result = getReputationModifierFromRelationship(mockStoryData, 'faction1', 'faction3', 100);

      expect(result).toBe(-50); // -50% of 100
    });

    test('should return zero for neutral', () => {
      const result = getReputationModifierFromRelationship(mockStoryData, 'faction1', 'nonexistent', 100);

      expect(result).toBe(0);
    });
  });

  describe('changeReputationWithFactionRelationships', () => {
    test('should change reputation with faction and related factions', () => {
      const character = {
        name: 'Test Character',
        reputation: {
          faction1: {
            value: 0,
            level: REPUTATION_LEVELS.NEUTRAL
          },
          faction2: {
            value: 0,
            level: REPUTATION_LEVELS.NEUTRAL
          },
          faction3: {
            value: 0,
            level: REPUTATION_LEVELS.NEUTRAL
          }
        }
      };

      const result = changeReputationWithFactionRelationships(character, mockStoryData, 'faction1', 100);

      expect(result.success).toBe(true);
      expect(result.mainResult.faction).toBe('faction1');
      expect(character.reputation.faction1.value).toBe(100); // Main faction
      expect(character.reputation.faction2.value).toBe(50); // Ally
      expect(character.reputation.faction3.value).toBe(-50); // Enemy
    });
  });
});
