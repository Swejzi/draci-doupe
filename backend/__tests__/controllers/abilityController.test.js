const abilityController = require('../../controllers/abilityController');
const db = require('../../config/db');
const abilitySystem = require('../../utils/abilitySystem');

// Mock pro db.query
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

// Mock pro abilitySystem
jest.mock('../../utils/abilitySystem', () => ({
  getAvailableAbilities: jest.fn(),
  initializeCharacterAbilities: jest.fn(),
  useAbility: jest.fn(),
  refreshAbilitiesAfterRest: jest.fn(),
  getAbilityDetails: jest.fn()
}));

describe('Ability Controller', () => {
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

  describe('getCharacterAbilities', () => {
    test('should return abilities for character', async () => {
      // Arrange
      req.params.characterId = 1;

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        class: 'Bojovník',
        level: 2,
        abilities: [
          { id: 'second_wind', currentUses: 1, active: false }
        ]
      };

      const mockAbilities = [
        {
          id: 'second_wind',
          name: 'Druhý dech',
          level: 1,
          usesPerDay: 1
        },
        {
          id: 'action_surge',
          name: 'Bojový zápal',
          level: 2,
          usesPerDay: 1
        }
      ];

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      abilitySystem.getAvailableAbilities.mockReturnValueOnce(mockAbilities);

      // Act
      await abilityController.getCharacterAbilities(req, res);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters'),
        [1, 1]
      );
      expect(abilitySystem.getAvailableAbilities).toHaveBeenCalledWith('Bojovník', 2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: 'second_wind' }),
        expect.objectContaining({ id: 'action_surge' })
      ]));
    });

    test('should return 404 if character not found', async () => {
      // Arrange
      req.params.characterId = 999;
      db.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await abilityController.getCharacterAbilities(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Postava nenalezena')
      }));
    });
  });

  describe('initializeCharacterAbilities', () => {
    test('should initialize abilities for character', async () => {
      // Arrange
      req.params.characterId = 1;

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        class: 'Bojovník',
        level: 1
      };

      const mockUpdatedCharacter = {
        ...mockCharacter,
        abilities: [
          {
            id: 'second_wind',
            name: 'Druhý dech',
            currentUses: 1,
            active: false
          }
        ]
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      abilitySystem.initializeCharacterAbilities.mockReturnValueOnce(mockUpdatedCharacter);
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      // Act
      await abilityController.initializeCharacterAbilities(req, res);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters SET abilities = $1'),
        [JSON.stringify(mockUpdatedCharacter.abilities), 1]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Schopnosti postavy byly úspěšně inicializovány')
      }));
    });

    test('should return 404 if character not found', async () => {
      // Arrange
      req.params.characterId = 999;
      db.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await abilityController.initializeCharacterAbilities(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Postava nenalezena')
      }));
    });
  });

  describe('useAbility', () => {
    test('should use ability successfully', async () => {
      // Arrange
      req.params.characterId = 1;
      req.params.abilityId = 'second_wind';
      req.body.target = null;

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        class: 'Bojovník',
        level: 1,
        current_health: 10,
        max_health: 20,
        current_mana: 0,
        max_mana: 0,
        abilities: [
          {
            id: 'second_wind',
            name: 'Druhý dech',
            currentUses: 1,
            active: false
          }
        ]
      };

      const mockResult = {
        success: true,
        message: 'Schopnost Druhý dech byla úspěšně použita.',
        effects: [
          {
            type: 'healing',
            amount: 5,
            description: 'Obnoveno 5 životů.'
          }
        ]
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      abilitySystem.useAbility.mockReturnValueOnce(mockResult);
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      // Act
      await abilityController.useAbility(req, res);

      // Assert
      expect(abilitySystem.useAbility).toHaveBeenCalledWith(mockCharacter, 'second_wind', null);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters SET abilities = $1'),
        expect.arrayContaining([
          JSON.stringify(mockCharacter.abilities),
          mockCharacter.current_health,
          mockCharacter.current_mana,
          1
        ])
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: mockResult.message,
        effects: mockResult.effects
      }));
    });

    test('should return 400 if ability use fails', async () => {
      // Arrange
      req.params.characterId = 1;
      req.params.abilityId = 'second_wind';

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        class: 'Bojovník',
        level: 1,
        abilities: [
          {
            id: 'second_wind',
            name: 'Druhý dech',
            currentUses: 0, // Již použito
            active: false
          }
        ]
      };

      const mockResult = {
        success: false,
        message: 'Schopnost Druhý dech již nemá žádná použití.'
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      abilitySystem.useAbility.mockReturnValueOnce(mockResult);

      // Act
      await abilityController.useAbility(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: mockResult.message
      }));
    });
  });

  describe('refreshAbilitiesAfterRest', () => {
    test('should refresh abilities after rest', async () => {
      // Arrange
      req.params.characterId = 1;
      req.body.restType = 'long';

      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        class: 'Bojovník',
        level: 1,
        abilities: [
          {
            id: 'second_wind',
            name: 'Druhý dech',
            currentUses: 0,
            active: false
          }
        ]
      };

      const mockUpdatedCharacter = {
        ...mockCharacter,
        abilities: [
          {
            id: 'second_wind',
            name: 'Druhý dech',
            currentUses: 1, // Obnoveno
            active: false
          }
        ]
      };

      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });
      abilitySystem.refreshAbilitiesAfterRest.mockReturnValueOnce(mockUpdatedCharacter);
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      // Act
      await abilityController.refreshAbilitiesAfterRest(req, res);

      // Assert
      expect(abilitySystem.refreshAbilitiesAfterRest).toHaveBeenCalledWith(mockCharacter, 'long');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters SET abilities = $1'),
        [JSON.stringify(mockUpdatedCharacter.abilities), 1]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Schopnosti postavy byly úspěšně obnoveny')
      }));
    });

    test('should return 400 for invalid rest type', async () => {
      // Arrange
      req.params.characterId = 1;
      req.body.restType = 'invalid';

      // Act
      await abilityController.refreshAbilitiesAfterRest(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Neplatný typ odpočinku')
      }));
    });
  });

  describe('getAbilityDetails', () => {
    test('should return ability details', async () => {
      // Arrange
      req.params.abilityId = 'second_wind';

      const mockAbility = {
        id: 'second_wind',
        name: 'Druhý dech',
        description: 'Bojovník může jednou za odpočinek obnovit 1d10 + úroveň životů.',
        level: 1,
        usesPerDay: 1
      };

      abilitySystem.getAbilityDetails.mockReturnValueOnce(mockAbility);

      // Act
      await abilityController.getAbilityDetails(req, res);

      // Assert
      expect(abilitySystem.getAbilityDetails).toHaveBeenCalledWith('second_wind');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAbility);
    });

    test('should return 404 if ability not found', async () => {
      // Arrange
      req.params.abilityId = 'nonexistent_ability';
      abilitySystem.getAbilityDetails.mockReturnValueOnce(null);

      // Act
      await abilityController.getAbilityDetails(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('nebyla nalezena')
      }));
    });
  });
});
