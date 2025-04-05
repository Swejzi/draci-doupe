import axios from 'axios';
import { API_URL } from '../../config';
import questService from '../../services/questService';
import { getAuthHeader } from '../../services/authService';

// Mock dependencies
jest.mock('axios');
jest.mock('../../services/authService', () => ({
  getAuthHeader: jest.fn().mockReturnValue({ Authorization: 'Bearer test-token' })
}));

describe('Quest Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveQuests', () => {
    test('should call API with correct parameters when no type is specified', async () => {
      // Arrange
      const sessionId = 1;
      const mockQuests = [
        { id: 'quest1', title: 'Main Quest', type: 'main' },
        { id: 'quest2', title: 'Side Quest', type: 'side' }
      ];

      axios.get.mockResolvedValue({ data: mockQuests });

      // Act
      const result = await questService.getActiveQuests(sessionId);

      // Assert
      expect(result).toEqual(mockQuests);
      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/quests/session/${sessionId}`,
        { headers: expect.any(Object) }
      );
    });

    test('should call API with type parameter when type is specified', async () => {
      // Arrange
      const sessionId = 1;
      const type = 'side';
      const mockQuests = [
        { id: 'quest2', title: 'Side Quest', type: 'side' }
      ];

      axios.get.mockResolvedValue({ data: mockQuests });

      // Act
      const result = await questService.getActiveQuests(sessionId, type);

      // Assert
      expect(result).toEqual(mockQuests);
      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/quests/session/${sessionId}?type=${type}`,
        { headers: expect.any(Object) }
      );
    });

    test('should throw error when API call fails', async () => {
      // Arrange
      const sessionId = 1;
      const errorResponse = {
        response: {
          data: { message: 'Error fetching quests' },
          status: 500
        }
      };

      axios.get.mockRejectedValue(errorResponse);

      // Act & Assert
      await expect(questService.getActiveQuests(sessionId)).rejects.toEqual(
        { message: 'Error fetching quests' }
      );
    });
  });

  describe('getQuestDetails', () => {
    test('should return quest details with type information', async () => {
      // Arrange
      const sessionId = 1;
      const questId = 'quest1';
      const mockQuestDetails = {
        id: 'quest1',
        title: 'Main Quest',
        description: 'A main quest',
        type: 'main',
        objectives: []
      };

      axios.get.mockResolvedValue({ data: mockQuestDetails });

      // Act
      const result = await questService.getQuestDetails(sessionId, questId);

      // Assert
      expect(result).toEqual(mockQuestDetails);
      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/quests/session/${sessionId}/${questId}`,
        { headers: expect.any(Object) }
      );
    });
  });

  describe('addQuest', () => {
    test('should add quest with correct parameters', async () => {
      // Arrange
      const sessionId = 1;
      const questId = 'quest1';
      const mockResponse = {
        success: true,
        message: 'Quest added successfully',
        quest: {
          id: 'quest1',
          title: 'Main Quest',
          type: 'main'
        }
      };

      axios.post.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await questService.addQuest(sessionId, questId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/quests/session/${sessionId}`,
        { questId },
        { headers: expect.any(Object) }
      );
    });
  });
});
