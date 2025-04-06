const inventoryService = require('../../services/inventoryService');
const db = require('../../config/db');
const itemsData = require('../../data/items');
const equipmentSystem = require('../../utils/equipmentSystem');
const { rollDice } = require('../../utils/gameMechanics');

// Mock pro db.query
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

// Mock pro itemsData
jest.mock('../../data/items', () => ({
  getItemById: jest.fn(),
  generateRandomItem: jest.fn()
}));

// Mock pro equipmentSystem
jest.mock('../../utils/equipmentSystem', () => ({
  addItemToInventory: jest.fn()
}));

// Mock pro rollDice
jest.mock('../../utils/gameMechanics', () => ({
  rollDice: jest.fn()
}));

describe('Inventory Service', () => {
  beforeEach(() => {
    // Reset všech mocků před každým testem
    jest.clearAllMocks();
  });

  describe('getCharacterInventory', () => {
    test('should return character inventory', async () => {
      // Arrange
      const characterId = 1;
      const mockInventory = [
        { id: 'dagger', name: 'Dýka', quantity: 1 },
        { id: 'potion_healing', name: 'Lektvar léčení', quantity: 3 }
      ];

      db.query.mockResolvedValueOnce({
        rows: [{ inventory: mockInventory }]
      });

      // Act
      const result = await inventoryService.getCharacterInventory(characterId);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT inventory FROM characters'),
        [characterId]
      );
      expect(result).toEqual(mockInventory);
    });

    test('should throw error if character not found', async () => {
      // Arrange
      const characterId = 999;
      db.query.mockResolvedValueOnce({ rows: [] });

      // Act & Assert
      await expect(inventoryService.getCharacterInventory(characterId))
        .rejects
        .toThrow(`Postava s ID ${characterId} nebyla nalezena.`);
    });
  });

  describe('addItemToInventory', () => {
    test('should add item to inventory', async () => {
      // Arrange
      const characterId = 1;
      const itemId = 'dagger';
      const quantity = 1;

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        inventory: []
      };

      const mockItem = {
        id: 'dagger',
        name: 'Dýka',
        type: 'weapon'
      };

      const mockUpdatedCharacter = {
        ...mockCharacter,
        inventory: [{ ...mockItem, quantity }]
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      itemsData.getItemById.mockReturnValueOnce(mockItem);
      equipmentSystem.addItemToInventory.mockReturnValueOnce(mockUpdatedCharacter);
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      // Act
      const result = await inventoryService.addItemToInventory(characterId, itemId, quantity);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters'),
        [characterId]
      );
      expect(itemsData.getItemById).toHaveBeenCalledWith(itemId);
      expect(equipmentSystem.addItemToInventory).toHaveBeenCalledWith(
        mockCharacter,
        { ...mockItem, quantity }
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters SET inventory'),
        [expect.any(String), characterId]
      );
      expect(result).toEqual(mockUpdatedCharacter.inventory);
    });

    test('should throw error if character not found', async () => {
      // Arrange
      const characterId = 999;
      const itemId = 'dagger';
      db.query.mockResolvedValueOnce({ rows: [] });

      // Act & Assert
      await expect(inventoryService.addItemToInventory(characterId, itemId))
        .rejects
        .toThrow(`Postava s ID ${characterId} nebyla nalezena.`);
    });

    test('should throw error if item not found', async () => {
      // Arrange
      const characterId = 1;
      const itemId = 'nonexistent';

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        inventory: []
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      itemsData.getItemById.mockReturnValueOnce(null);

      // Act & Assert
      await expect(inventoryService.addItemToInventory(characterId, itemId))
        .rejects
        .toThrow(`Předmět s ID ${itemId} nebyl nalezen.`);
    });
  });

  describe('removeItemFromInventory', () => {
    test('should remove item from inventory', async () => {
      // Arrange
      const characterId = 1;
      const itemId = 'dagger';
      const quantity = 1;

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        inventory: [
          { id: 'dagger', name: 'Dýka', quantity: 1 }
        ]
      };

      const mockUpdatedInventory = [];

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      // Act
      const result = await inventoryService.removeItemFromInventory(characterId, itemId, quantity);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters'),
        [characterId]
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters SET inventory'),
        [expect.any(String), characterId]
      );
      expect(result).toEqual(mockUpdatedInventory);
    });

    test('should decrease quantity for stackable items', async () => {
      // Arrange
      const characterId = 1;
      const itemId = 'potion_healing';
      const quantity = 1;

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        inventory: [
          { id: 'potion_healing', name: 'Lektvar léčení', quantity: 3, stackable: true }
        ]
      };

      const mockUpdatedInventory = [
        { id: 'potion_healing', name: 'Lektvar léčení', quantity: 2, stackable: true }
      ];

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      // Act
      const result = await inventoryService.removeItemFromInventory(characterId, itemId, quantity);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters'),
        [characterId]
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters SET inventory'),
        [expect.any(String), characterId]
      );
      expect(result[0].quantity).toBe(2);
    });

    test('should throw error if character not found', async () => {
      // Arrange
      const characterId = 999;
      const itemId = 'dagger';
      db.query.mockResolvedValueOnce({ rows: [] });

      // Act & Assert
      await expect(inventoryService.removeItemFromInventory(characterId, itemId))
        .rejects
        .toThrow(`Postava s ID ${characterId} nebyla nalezena.`);
    });

    test('should throw error if item not found in inventory', async () => {
      // Arrange
      const characterId = 1;
      const itemId = 'nonexistent';

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        inventory: [
          { id: 'dagger', name: 'Dýka', quantity: 1 }
        ]
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });

      // Act & Assert
      await expect(inventoryService.removeItemFromInventory(characterId, itemId))
        .rejects
        .toThrow(`Předmět s ID ${itemId} nebyl nalezen v inventáři.`);
    });
  });

  describe('useConsumableItem', () => {
    test('should use healing potion', async () => {
      // Arrange
      const characterId = 1;
      const itemId = 'potion_healing';

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        current_health: 10,
        max_health: 20,
        current_mana: 5,
        max_mana: 10,
        inventory: [
          { id: 'potion_healing', name: 'Lektvar léčení', quantity: 1, type: 'consumable', effects: { healing: '2d4+2' } }
        ]
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      rollDice.mockReturnValueOnce(6); // 2d4+2 = 6
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      // Act
      const result = await inventoryService.useConsumableItem(characterId, itemId);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters'),
        [characterId]
      );
      expect(rollDice).toHaveBeenCalledWith('2d4+2');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters SET inventory'),
        [expect.any(String), 16, 5, characterId]
      );
      expect(result.effects[0].type).toBe('healing');
      expect(result.effects[0].amount).toBe(6);
      expect(result.character.current_health).toBe(16);
      expect(result.character.inventory.length).toBe(0);
    });

    test('should use mana potion', async () => {
      // Arrange
      const characterId = 1;
      const itemId = 'potion_mana';

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        current_health: 10,
        max_health: 20,
        current_mana: 5,
        max_mana: 10,
        inventory: [
          { id: 'potion_mana', name: 'Lektvar many', quantity: 1, type: 'consumable', effects: { mana: '2d4+2' } }
        ]
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      rollDice.mockReturnValueOnce(4); // 2d4+2 = 4
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      // Act
      const result = await inventoryService.useConsumableItem(characterId, itemId);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters'),
        [characterId]
      );
      expect(rollDice).toHaveBeenCalledWith('2d4+2');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters SET inventory'),
        [expect.any(String), 10, 9, characterId]
      );
      expect(result.effects[0].type).toBe('mana');
      expect(result.effects[0].amount).toBe(4);
      expect(result.character.current_mana).toBe(9);
      expect(result.character.inventory.length).toBe(0);
    });

    test('should decrease quantity for stackable items', async () => {
      // Arrange
      const characterId = 1;
      const itemId = 'potion_healing';

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        current_health: 10,
        max_health: 20,
        current_mana: 5,
        max_mana: 10,
        inventory: [
          { id: 'potion_healing', name: 'Lektvar léčení', quantity: 3, stackable: true, type: 'consumable', effects: { healing: '2d4+2' } }
        ]
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      rollDice.mockReturnValueOnce(6); // 2d4+2 = 6
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      // Act
      const result = await inventoryService.useConsumableItem(characterId, itemId);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters'),
        [characterId]
      );
      expect(rollDice).toHaveBeenCalledWith('2d4+2');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters SET inventory'),
        [expect.any(String), 16, 5, characterId]
      );
      expect(result.character.inventory[0].quantity).toBe(2);
    });

    test('should throw error if item is not consumable', async () => {
      // Arrange
      const characterId = 1;
      const itemId = 'dagger';

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        inventory: [
          { id: 'dagger', name: 'Dýka', quantity: 1, type: 'weapon' }
        ]
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });

      // Act & Assert
      await expect(inventoryService.useConsumableItem(characterId, itemId))
        .rejects
        .toThrow(`Předmět Dýka není spotřební.`);
    });
  });

  describe('generateTreasure', () => {
    test('should generate treasure with default options', () => {
      // Arrange
      const options = {};
      const mockItem = { id: 'dagger', name: 'Dýka' };

      // Mock Math.random to return predictable values
      const originalRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5) // For gold multiplier
        .mockReturnValueOnce(0.2) // For item type (consumable)
        .mockReturnValueOnce(0.5); // For item selection

      itemsData.generateRandomItem.mockReturnValueOnce(mockItem);

      // Act
      const result = inventoryService.generateTreasure(options);

      // Assert
      expect(result).toHaveProperty('gold');
      expect(result).toHaveProperty('items');
      expect(result.items.length).toBe(1);
      expect(result.items[0]).toEqual(mockItem);

      // Restore original Math.random
      Math.random = originalRandom;
    });

    test('should generate treasure with custom options', () => {
      // Arrange
      const options = {
        level: 5,
        rarity: 'rare',
        itemCount: 3
      };

      const mockItems = [
        { id: 'longsword', name: 'Dlouhý meč' },
        { id: 'potion_healing', name: 'Lektvar léčení', type: 'consumable' },
        { id: 'ring_protection', name: 'Prsten ochrany' }
      ];

      // Mock Math.random to return predictable values
      const originalRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5) // For gold multiplier
        .mockReturnValueOnce(0.2) // For first item type
        .mockReturnValueOnce(0.5) // For first item selection
        .mockReturnValueOnce(0.5) // For second item type
        .mockReturnValueOnce(0.5) // For second item selection
        .mockReturnValueOnce(0.8) // For third item type
        .mockReturnValueOnce(0.5) // For third item selection
        .mockReturnValueOnce(0.5); // For consumable quantity

      itemsData.generateRandomItem
        .mockReturnValueOnce(mockItems[0])
        .mockReturnValueOnce(mockItems[1])
        .mockReturnValueOnce(mockItems[2]);

      // Act
      const result = inventoryService.generateTreasure(options);

      // Assert
      expect(result).toHaveProperty('gold');
      expect(result.gold).toBeGreaterThan(0);
      expect(result).toHaveProperty('items');
      expect(result.items.length).toBe(3);
      expect(result.items[0]).toEqual(mockItems[0]);
      expect(result.items[1]).toEqual(expect.objectContaining({
        id: 'potion_healing',
        quantity: expect.any(Number)
      }));
      expect(result.items[2]).toEqual(mockItems[2]);

      // Restore original Math.random
      Math.random = originalRandom;
    });
  });

  describe('addTreasureToInventory', () => {
    test('should add treasure to inventory', async () => {
      // Arrange
      const characterId = 1;
      const treasure = {
        gold: 50,
        items: [
          { id: 'dagger', name: 'Dýka' },
          { id: 'potion_healing', name: 'Lektvar léčení', quantity: 2 }
        ]
      };

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        gold: 100,
        inventory: []
      };

      const mockUpdatedCharacter = {
        ...mockCharacter,
        gold: 150,
        inventory: treasure.items
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      equipmentSystem.addItemToInventory
        .mockReturnValueOnce({ ...mockCharacter, gold: 150, inventory: [treasure.items[0]] })
        .mockReturnValueOnce(mockUpdatedCharacter);
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      // Act
      const result = await inventoryService.addTreasureToInventory(characterId, treasure);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters'),
        [characterId]
      );
      expect(equipmentSystem.addItemToInventory).toHaveBeenCalledTimes(2);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters SET inventory'),
        [expect.any(String), 150, characterId]
      );
      expect(result.gold).toBe(50);
      expect(result.items).toEqual(treasure.items);
      expect(result.character.gold).toBe(150);
      expect(result.character.inventory).toEqual(treasure.items);
    });

    test('should throw error if character not found', async () => {
      // Arrange
      const characterId = 999;
      const treasure = {
        gold: 50,
        items: [{ id: 'dagger', name: 'Dýka' }]
      };

      db.query.mockResolvedValueOnce({ rows: [] });

      // Act & Assert
      await expect(inventoryService.addTreasureToInventory(characterId, treasure))
        .rejects
        .toThrow(`Postava s ID ${characterId} nebyla nalezena.`);
    });
  });
});
