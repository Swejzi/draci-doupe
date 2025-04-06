const equipmentController = require('../../controllers/equipmentController');
const db = require('../../config/db');
const equipmentSystem = require('../../utils/equipmentSystem');

// Mock pro db.query
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

// Mock pro equipmentSystem
jest.mock('../../utils/equipmentSystem', () => ({
  getEquippedItems: jest.fn(),
  calculateTotalAC: jest.fn(),
  calculateEquipmentBonuses: jest.fn(),
  equipItem: jest.fn(),
  unequipItem: jest.fn(),
  getEffectiveAttributes: jest.fn(),
  canUseItem: jest.fn()
}));

describe('Equipment Controller', () => {
  let req, res;

  beforeEach(() => {
    // Reset všech mocků před každým testem
    jest.clearAllMocks();

    // Vytvoření mock objektů pro req a res
    req = {
      user: { userId: 1 },
      params: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getEquippedItems', () => {
    test('should return equipped items for character', async () => {
      // Arrange
      req.params.characterId = 1;

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        equipment: {
          weapon: { id: 'longsword', name: 'Dlouhý meč' },
          chest: { id: 'chainmail', name: 'Kroužková zbroj' }
        }
      };

      const mockEquippedItems = {
        weapon: { id: 'longsword', name: 'Dlouhý meč' },
        chest: { id: 'chainmail', name: 'Kroužková zbroj' }
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      equipmentSystem.getEquippedItems.mockReturnValueOnce(mockEquippedItems);
      equipmentSystem.calculateTotalAC.mockReturnValueOnce(15);
      equipmentSystem.calculateEquipmentBonuses.mockReturnValueOnce({
        attributes: { strength: 1 },
        ac: 5,
        attackBonus: 1,
        damageBonus: 2,
        resistances: { fire: 50 }
      });

      // Act
      await equipmentController.getEquippedItems(req, res);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters'),
        [1, 1]
      );
      expect(equipmentSystem.getEquippedItems).toHaveBeenCalledWith(mockCharacter);
      expect(equipmentSystem.calculateTotalAC).toHaveBeenCalledWith(mockCharacter);
      expect(equipmentSystem.calculateEquipmentBonuses).toHaveBeenCalledWith(mockCharacter);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        equippedItems: mockEquippedItems,
        totalAC: 15,
        equipmentBonuses: expect.any(Object)
      });
    });

    test('should return 404 if character not found', async () => {
      // Arrange
      req.params.characterId = 999;
      db.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await equipmentController.getEquippedItems(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Postava nenalezena')
      }));
    });
  });

  describe('equipItem', () => {
    test('should equip item successfully', async () => {
      // Arrange
      req.params.characterId = 1;
      req.body = {
        itemId: 'longsword',
        slot: 'weapon'
      };

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        inventory: [{ id: 'longsword', name: 'Dlouhý meč' }],
        equipment: {}
      };

      const updatedCharacter = {
        ...mockCharacter,
        equipment: {
          weapon: { id: 'longsword', name: 'Dlouhý meč' }
        },
        inventory: []
      };

      const mockResult = {
        success: true,
        message: 'Předmět Dlouhý meč byl úspěšně vybaven do slotu weapon.',
        character: updatedCharacter
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      equipmentSystem.equipItem.mockImplementation(() => {
        // Aktualizace mockCharacter přímo zde
        mockCharacter.equipment = {
          weapon: { id: 'longsword', name: 'Dlouhý meč' }
        };
        mockCharacter.inventory = [];
        return mockResult;
      });
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      equipmentSystem.calculateTotalAC.mockReturnValueOnce(12);

      // Act
      await equipmentController.equipItem(req, res);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters'),
        [1, 1]
      );
      expect(equipmentSystem.equipItem).toHaveBeenCalledWith(mockCharacter, 'longsword', 'weapon');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters'),
        expect.arrayContaining([
          expect.any(String), // equipment JSON
          expect.any(String), // inventory JSON
          expect.any(String), // attributeBonuses JSON
          expect.any(Number), // acBonus
          expect.any(Number), // attackBonus
          expect.any(Number), // damageBonus
          expect.any(String), // resistances JSON
          1 // characterId
        ])
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: mockResult.message,
        equippedItems: { weapon: { id: 'longsword', name: 'Dlouhý meč' } },
        inventory: [],
        totalAC: 12
      });
    });

    test('should return 400 if item cannot be equipped', async () => {
      // Arrange
      req.params.characterId = 1;
      req.body = {
        itemId: 'longsword',
        slot: 'head'
      };

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        inventory: [{ id: 'longsword', name: 'Dlouhý meč' }],
        equipment: {}
      };

      const mockResult = {
        success: false,
        message: 'Předmět Dlouhý meč nelze vybavit do slotu head.'
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      equipmentSystem.equipItem.mockReturnValueOnce(mockResult);

      // Act
      await equipmentController.equipItem(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: mockResult.message
      }));
    });

    test('should return 400 if required parameters are missing', async () => {
      // Arrange
      req.params.characterId = 1;
      req.body = {
        // Missing itemId and slot
      };

      // Act
      await equipmentController.equipItem(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Chybí ID předmětu nebo slot')
      }));
    });
  });

  describe('unequipItem', () => {
    test('should unequip item successfully', async () => {
      // Arrange
      req.params.characterId = 1;
      req.body = {
        slot: 'weapon'
      };

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        inventory: [],
        equipment: {
          weapon: { id: 'longsword', name: 'Dlouhý meč' }
        }
      };

      const updatedCharacter = {
        ...mockCharacter,
        equipment: {},
        inventory: [{ id: 'longsword', name: 'Dlouhý meč' }]
      };

      const mockResult = {
        success: true,
        message: 'Předmět Dlouhý meč byl úspěšně sundán ze slotu weapon.',
        character: updatedCharacter
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      equipmentSystem.unequipItem.mockImplementation(() => {
        // Aktualizace mockCharacter přímo zde
        mockCharacter.equipment = {};
        mockCharacter.inventory = [{ id: 'longsword', name: 'Dlouhý meč' }];
        return mockResult;
      });
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      equipmentSystem.calculateTotalAC.mockReturnValueOnce(10);

      // Act
      await equipmentController.unequipItem(req, res);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters'),
        [1, 1]
      );
      expect(equipmentSystem.unequipItem).toHaveBeenCalledWith(mockCharacter, 'weapon');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters'),
        expect.arrayContaining([
          expect.any(String), // equipment JSON
          expect.any(String), // inventory JSON
          expect.any(String), // attributeBonuses JSON
          expect.any(Number), // acBonus
          expect.any(Number), // attackBonus
          expect.any(Number), // damageBonus
          expect.any(String), // resistances JSON
          1 // characterId
        ])
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: mockResult.message,
        equippedItems: {},
        inventory: [{ id: 'longsword', name: 'Dlouhý meč' }],
        totalAC: 10
      });
    });

    test('should return 400 if item cannot be unequipped', async () => {
      // Arrange
      req.params.characterId = 1;
      req.body = {
        slot: 'weapon'
      };

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        inventory: [],
        equipment: {}
      };

      const mockResult = {
        success: false,
        message: 'Žádný předmět není vybaven ve slotu weapon.'
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      equipmentSystem.unequipItem.mockReturnValueOnce(mockResult);

      // Act
      await equipmentController.unequipItem(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: mockResult.message
      }));
    });

    test('should return 400 if required parameters are missing', async () => {
      // Arrange
      req.params.characterId = 1;
      req.body = {
        // Missing slot
      };

      // Act
      await equipmentController.unequipItem(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Chybí slot')
      }));
    });
  });

  describe('getEffectiveAttributes', () => {
    test('should return effective attributes for character', async () => {
      // Arrange
      req.params.characterId = 1;

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        strength: 16,
        dexterity: 14,
        constitution: 15,
        intelligence: 10,
        wisdom: 12,
        charisma: 8,
        attributeBonuses: {
          strength: 2
        }
      };

      const mockEffectiveAttributes = {
        strength: 18,
        dexterity: 14,
        constitution: 15,
        intelligence: 10,
        wisdom: 12,
        charisma: 8
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      equipmentSystem.getEffectiveAttributes.mockReturnValueOnce(mockEffectiveAttributes);

      // Act
      await equipmentController.getEffectiveAttributes(req, res);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters'),
        [1, 1]
      );
      expect(equipmentSystem.getEffectiveAttributes).toHaveBeenCalledWith(mockCharacter);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockEffectiveAttributes);
    });

    test('should return 404 if character not found', async () => {
      // Arrange
      req.params.characterId = 999;
      db.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await equipmentController.getEffectiveAttributes(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Postava nenalezena')
      }));
    });
  });

  describe('checkItemUsability', () => {
    test('should return usability check result', async () => {
      // Arrange
      req.params.characterId = 1;
      req.params.itemId = 'longsword';

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        class: 'Bojovník',
        level: 5,
        strength: 16,
        inventory: [
          { id: 'longsword', name: 'Dlouhý meč' }
        ]
      };

      const mockResult = {
        canUse: true
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      equipmentSystem.canUseItem.mockReturnValueOnce(mockResult);

      // Act
      await equipmentController.checkItemUsability(req, res);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters'),
        [1, 1]
      );
      expect(equipmentSystem.canUseItem).toHaveBeenCalledWith(
        mockCharacter,
        expect.objectContaining({ id: 'longsword' })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    test('should return 404 if item not found in inventory', async () => {
      // Arrange
      req.params.characterId = 1;
      req.params.itemId = 'nonexistent';

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        inventory: [
          { id: 'longsword', name: 'Dlouhý meč' }
        ]
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });

      // Act
      await equipmentController.checkItemUsability(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('nebyl nalezen v inventáři')
      }));
    });
  });
});
