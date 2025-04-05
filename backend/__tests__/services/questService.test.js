const questService = require('../../services/questService');
const db = require('../../config/db');
const storyService = require('../../services/storyService');
const { applyQuestRewards } = require('../../utils/gameMechanics');

// Mock dependencies
jest.mock('../../config/db');
jest.mock('../../services/storyService');
jest.mock('../../utils/gameMechanics');

describe('Quest Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveQuests', () => {
    test('should return all active quests when no type is specified', async () => {
      // Arrange
      const mockGameState = {
        activeQuests: [
          { id: 'quest1', title: 'Main Quest', type: 'main' },
          { id: 'quest2', title: 'Side Quest', type: 'side' }
        ]
      };

      db.query.mockResolvedValue({
        rows: [{ game_state: mockGameState }]
      });

      // Act
      const result = await questService.getActiveQuests(1);

      // Assert
      expect(result).toEqual(mockGameState.activeQuests);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT game_state FROM game_sessions'),
        [1]
      );
    });

    test('should return only main quests when type is main', async () => {
      // Arrange
      const mockGameState = {
        activeQuests: [
          { id: 'quest1', title: 'Main Quest', type: 'main' },
          { id: 'quest2', title: 'Side Quest', type: 'side' }
        ]
      };

      db.query.mockResolvedValue({
        rows: [{ game_state: mockGameState }]
      });

      // Act
      const result = await questService.getActiveQuests(1, 'main');

      // Assert
      expect(result).toEqual([
        { id: 'quest1', title: 'Main Quest', type: 'main' }
      ]);
    });

    test('should return only side quests when type is side', async () => {
      // Arrange
      const mockGameState = {
        activeQuests: [
          { id: 'quest1', title: 'Main Quest', type: 'main' },
          { id: 'quest2', title: 'Side Quest', type: 'side' }
        ]
      };

      db.query.mockResolvedValue({
        rows: [{ game_state: mockGameState }]
      });

      // Act
      const result = await questService.getActiveQuests(1, 'side');

      // Assert
      expect(result).toEqual([
        { id: 'quest2', title: 'Side Quest', type: 'side' }
      ]);
    });

    test('should return empty array when no active quests', async () => {
      // Arrange
      const mockGameState = {};

      db.query.mockResolvedValue({
        rows: [{ game_state: mockGameState }]
      });

      // Act
      const result = await questService.getActiveQuests(1);

      // Assert
      expect(result).toEqual([]);
    });

    test('should throw error when session not found', async () => {
      // Arrange
      db.query.mockResolvedValue({ rows: [] });

      // Act & Assert
      await expect(questService.getActiveQuests(999)).rejects.toThrow(
        'Herní sezení s ID 999 nebylo nalezeno.'
      );
    });
  });

  describe('addQuest', () => {
    test('should add quest with correct type', async () => {
      // Arrange
      const sessionId = 1;
      const questId = 'side_quest_1';
      
      const mockGameState = { activeQuests: [] };
      const mockStoryData = {
        quests: [
          { 
            id: 'side_quest_1', 
            title: 'Side Quest', 
            description: 'A side quest',
            type: 'side',
            objectives: []
          }
        ]
      };

      db.query
        .mockResolvedValueOnce({ rows: [{ game_state: mockGameState, story_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] }); // For the UPDATE query
      
      storyService.loadStoryById.mockResolvedValue(mockStoryData);

      // Act
      const result = await questService.addQuest(sessionId, questId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.quest.type).toBe('side');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE game_sessions'),
        expect.arrayContaining([
          expect.objectContaining({
            activeQuests: [
              expect.objectContaining({
                id: 'side_quest_1',
                title: 'Side Quest',
                type: 'side'
              })
            ]
          }),
          sessionId
        ])
      );
    });

    test('should default to main type if not specified', async () => {
      // Arrange
      const sessionId = 1;
      const questId = 'main_quest_1';
      
      const mockGameState = { activeQuests: [] };
      const mockStoryData = {
        quests: [
          { 
            id: 'main_quest_1', 
            title: 'Main Quest', 
            description: 'A main quest',
            objectives: []
            // No type specified
          }
        ]
      };

      db.query
        .mockResolvedValueOnce({ rows: [{ game_state: mockGameState, story_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] }); // For the UPDATE query
      
      storyService.loadStoryById.mockResolvedValue(mockStoryData);

      // Act
      const result = await questService.addQuest(sessionId, questId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.quest.type).toBe('main');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE game_sessions'),
        expect.arrayContaining([
          expect.objectContaining({
            activeQuests: [
              expect.objectContaining({
                id: 'main_quest_1',
                title: 'Main Quest',
                type: 'main'
              })
            ]
          }),
          sessionId
        ])
      );
    });
  });
});
