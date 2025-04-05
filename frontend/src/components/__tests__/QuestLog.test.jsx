import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuestLog from '../QuestLog';
import questService from '../../services/questService';

// Mock dependencies
jest.mock('../../services/questService');

describe('QuestLog Component', () => {
  const mockSessionId = 1;
  const mockStoryData = {
    quests: [
      {
        id: 'main_quest',
        title: 'Main Quest',
        description: 'A main quest',
        type: 'main',
        objectives: [
          { id: 'obj1', description: 'Objective 1' },
          { id: 'obj2', description: 'Objective 2' }
        ]
      },
      {
        id: 'side_quest',
        title: 'Side Quest',
        description: 'A side quest',
        type: 'side',
        objectives: [
          { id: 'obj3', description: 'Objective 3' }
        ]
      }
    ]
  };

  const mockActiveQuests = [
    {
      id: 'main_quest',
      title: 'Main Quest',
      type: 'main',
      completedObjectives: {}
    },
    {
      id: 'side_quest',
      title: 'Side Quest',
      type: 'side',
      completedObjectives: {}
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    questService.getActiveQuests.mockResolvedValue(mockActiveQuests);
    questService.getQuestDetails.mockImplementation((sessionId, questId) => {
      const quest = mockStoryData.quests.find(q => q.id === questId);
      return Promise.resolve({
        ...quest,
        status: 'in_progress',
        objectives: quest.objectives.map(obj => ({
          ...obj,
          completed: false
        }))
      });
    });
  });

  test('should render quest list with type indicators', async () => {
    // Arrange & Act
    render(<QuestLog sessionId={mockSessionId} storyData={mockStoryData} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Main Quest')).toBeInTheDocument();
      expect(screen.getByText('Side Quest')).toBeInTheDocument();
      expect(screen.getAllByText('Hlavní')[0]).toBeInTheDocument(); // Main quest badge
      expect(screen.getAllByText('Vedlejší')[0]).toBeInTheDocument(); // Side quest badge
    });
  });

  test('should filter quests by type', async () => {
    // Arrange
    render(<QuestLog sessionId={mockSessionId} storyData={mockStoryData} />);

    // Wait for quests to load
    await waitFor(() => {
      expect(screen.getByText('Main Quest')).toBeInTheDocument();
      expect(screen.getByText('Side Quest')).toBeInTheDocument();
    });

    // Act - filter by main quests
    fireEvent.click(screen.getAllByText('Hlavní')[0]);

    // Assert - only main quest should be visible
    expect(screen.getByText('Main Quest')).toBeInTheDocument();
    expect(screen.queryByText('Side Quest')).not.toBeInTheDocument();

    // Act - filter by side quests
    fireEvent.click(screen.getAllByText('Vedlejší')[0]);

    // Assert - only side quest should be visible
    expect(screen.queryByText('Main Quest')).not.toBeInTheDocument();
    expect(screen.getByText('Side Quest')).toBeInTheDocument();

    // Act - show all quests again
    fireEvent.click(screen.getByText('Všechny'));

    // Assert - both quests should be visible
    expect(screen.getByText('Main Quest')).toBeInTheDocument();
    expect(screen.getByText('Side Quest')).toBeInTheDocument();
  });

  test('should show quest details with type indicator when quest is selected', async () => {
    // Arrange
    render(<QuestLog sessionId={mockSessionId} storyData={mockStoryData} />);

    // Wait for quests to load
    await waitFor(() => {
      expect(screen.getByText('Main Quest')).toBeInTheDocument();
    });

    // Act - select main quest
    fireEvent.click(screen.getByText('Main Quest'));

    // Assert - quest details should be shown with type indicator
    await waitFor(() => {
      expect(screen.getByText('Objective 1')).toBeInTheDocument();
      expect(screen.getByText('Objective 2')).toBeInTheDocument();
      expect(screen.getAllByText('Hlavní')[0]).toBeInTheDocument(); // Main quest badge in details
    });

    // Act - go back to list and select side quest
    fireEvent.click(screen.getByText(/Zpět na seznam/i));
    await waitFor(() => {
      expect(screen.getByText('Side Quest')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Side Quest'));

    // Assert - side quest details should be shown with type indicator
    await waitFor(() => {
      expect(screen.getByText('Objective 3')).toBeInTheDocument();
      expect(screen.getAllByText('Vedlejší')[0]).toBeInTheDocument(); // Side quest badge in details
    });
  });
});
