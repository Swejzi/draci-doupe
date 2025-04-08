const characterController = require('../../controllers/characterController');
const db = require('../../config/db');
const { getAttributeBonus } = require('../../utils/gameMechanics');

// Mock pro db.query
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

// Mock pro getAttributeBonus
jest.mock('../../utils/gameMechanics', () => ({
  getAttributeBonus: jest.fn()
}));

describe('Character Controller', () => {
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

  describe('getCharacters', () => {
    test('should return characters for user', async () => {
      // Arrange
      const mockCharacters = [
        { id: 1, name: 'Character 1', race: 'Elf', class: 'Kouzelník', level: 1, story_id: 'story1' },
        { id: 2, name: 'Character 2', race: 'Trpaslík', class: 'Bojovník', level: 2, story_id: 'story2' }
      ];

      const mockSessions = [
        { character_id: 1, story_id: 'story1' }
      ];

      db.query
        .mockResolvedValueOnce({ rows: mockCharacters })
        .mockResolvedValueOnce({ rows: mockSessions });

      // Act
      await characterController.getCharacters(req, res);

      // Assert
      expect(db.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        { ...mockCharacters[0], story_id: 'story1', hasSession: true, storyId: 'story1' },
        { ...mockCharacters[1], story_id: 'story2', hasSession: false, storyId: null }
      ]);
    });

    test('should handle errors', async () => {
      // Arrange
      db.query.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await characterController.getCharacters(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Interní chyba serveru')
      }));
    });
  });

  describe('getCharacterById', () => {
    test('should return character by id', async () => {
      // Arrange
      const mockCharacter = {
        id: 1,
        name: 'Test Character',
        race: 'Elf',
        class: 'Kouzelník',
        level: 1
      };

      req.params.id = 1;
      db.query.mockResolvedValueOnce({ rows: [mockCharacter] });

      // Act
      await characterController.getCharacterById(req, res);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM characters WHERE id = $1'),
        [1, 1]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCharacter);
    });

    test('should return 404 if character not found', async () => {
      // Arrange
      req.params.id = 999;
      db.query.mockResolvedValueOnce({ rows: [] });

      // Act
      await characterController.getCharacterById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Postava nenalezena')
      }));
    });
  });

  describe('createCharacter', () => {
    test('should create character with manual attributes', async () => {
      // Arrange
      req.body = {
        name: 'New Character',
        race: 'Člověk',
        class: 'Bojovník',
        strength: 14,
        dexterity: 12,
        constitution: 16,
        intelligence: 10,
        wisdom: 8,
        charisma: 13,
        generationMethod: 'manual',
        storyId: 'test-story-id'
      };

      getAttributeBonus.mockReturnValueOnce(3); // conBonus
      getAttributeBonus.mockReturnValueOnce(0); // intBonus

      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          ...req.body,
          class: 'Bojovník', // Přejmenováno z class na characterClass
          max_health: 13,
          current_health: 13,
          max_mana: 0,
          current_mana: 0,
          gold: 50
        }]
      });

      // Act
      await characterController.createCharacter(req, res);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO characters'),
        expect.arrayContaining([
          1, // userId
          'New Character', // name
          'Člověk', // race
          'Bojovník', // characterClass
          14, // strength
          12, // dexterity
          16, // constitution
          10, // intelligence
          8, // wisdom
          13, // charisma
          13, // maxHealthValue
          13, // currentHealth
          0, // maxManaValue
          0, // currentMana
          50, // defaultGold
          'test-story-id' // storyId
        ])
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Postava úspěšně vytvořena.'
      }));
    });

    test('should create character with random attributes', async () => {
      // Arrange
      req.body = {
        name: 'Random Character',
        race: 'Elf',
        class: 'Kouzelník',
        generationMethod: 'random',
        storyId: 'test-story-id'
      };

      // Mock pro náhodné generování atributů
      // Toto je zjednodušený test, ve skutečnosti by hodnoty byly náhodné
      jest.spyOn(global.Math, 'random')
        .mockReturnValueOnce(0.5) // 1d6 = 4
        .mockReturnValueOnce(0.8) // 1d6 = 5
        .mockReturnValueOnce(0.3) // 1d6 = 3
        .mockReturnValueOnce(0.9); // 1d6 = 6

      getAttributeBonus.mockReturnValueOnce(1); // conBonus
      getAttributeBonus.mockReturnValueOnce(2); // intBonus

      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'Random Character',
          race: 'Elf',
          class: 'Kouzelník',
          max_health: 5,
          current_health: 5,
          max_mana: 14,
          current_mana: 14,
          gold: 50
        }]
      });

      // Act
      await characterController.createCharacter(req, res);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO characters'),
        expect.arrayContaining([
          1, // userId
          'Random Character', // name
          'Elf', // race
          'Kouzelník' // characterClass
        ])
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Postava úspěšně vytvořena.'
      }));

      // Obnovení původní implementace Math.random
      global.Math.random.mockRestore();
    });

    test('should return 400 if race and class are missing', async () => {
      // Arrange
      req.body = {
        name: 'Incomplete Character',
        storyId: 'test-story-id'
      };
      // Chybí race a class

      // Act
      await characterController.createCharacter(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Chybí jméno, rasa nebo třída postavy')
      }));
    });

    test('should return 400 if storyId is missing', async () => {
      // Arrange
      req.body = {
        name: 'Character Without Story',
        race: 'Elf',
        class: 'Kouzelník',
        generationMethod: 'manual'
      };
      // Chybí storyId

      // Act
      await characterController.createCharacter(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Chybí ID příběhu')
      }));
    });
  });

  describe('updateCharacter', () => {
    test('should update character', async () => {
      // Arrange
      req.params.id = 1;
      req.body = {
        name: 'Updated Character',
        race: 'Trpaslík',
        class: 'Bojovník',
        strength: 16,
        dexterity: 10,
        constitution: 18,
        intelligence: 8,
        wisdom: 12,
        charisma: 10
      };

      // Mock pro existující postavu
      const existingCharacter = {
        id: 1,
        name: 'Original Character',
        race: 'Člověk',
        class: 'Bojovník',
        level: 2,
        strength: 14,
        dexterity: 12,
        constitution: 16,
        intelligence: 10,
        wisdom: 8,
        charisma: 13,
        max_health: 13,
        current_health: 10,
        max_mana: 0,
        current_mana: 0
      };

      db.query
        .mockResolvedValueOnce({ rows: [existingCharacter] }) // Kontrola existence postavy
        .mockResolvedValueOnce({ rows: [{ ...existingCharacter, ...req.body }] }) // Aktualizace postavy
        .mockResolvedValueOnce({ rows: [{ ...existingCharacter, ...req.body }] }); // Získání aktualizované postavy

      getAttributeBonus.mockReturnValueOnce(4); // conBonus
      getAttributeBonus.mockReturnValueOnce(-1); // intBonus

      // Act
      await characterController.updateCharacter(req, res);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE characters'),
        expect.arrayContaining([
          'Updated Character', // name
          'Trpaslík', // race
          'Bojovník', // characterClass
          16, // strength
          10, // dexterity
          18, // constitution
          8, // intelligence
          12, // wisdom
          10, // charisma
          1, // characterId
          1 // userId
        ])
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Postava úspěšně aktualizována.'
      }));
    });

    test('should return 404 if character not found', async () => {
      // Arrange
      req.params.id = 999;
      req.body = {
        name: 'Updated Character',
        race: 'Trpaslík',
        class: 'Bojovník'
      };

      db.query.mockResolvedValueOnce({ rows: [] }); // Postava neexistuje

      // Act
      await characterController.updateCharacter(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Postava nenalezena')
      }));
    });
  });

  describe('deleteCharacter', () => {
    test('should delete character', async () => {
      // Arrange
      req.params.id = 1;

      // Mock pro existující postavu
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Kontrola existence postavy
        .mockResolvedValueOnce({ rows: [] }) // Kontrola herního sezení
        .mockResolvedValueOnce({ rowCount: 1 }); // Smazání postavy

      // Act
      await characterController.deleteCharacter(req, res);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM characters'),
        [1, 1]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Postava úspěšně smazána.'
      }));
    });

    test('should return 404 if character not found', async () => {
      // Arrange
      req.params.id = 999;
      db.query.mockResolvedValueOnce({ rows: [] }); // Postava neexistuje

      // Act
      await characterController.deleteCharacter(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Postava nenalezena')
      }));
    });

    test('should return 400 if character is in active session', async () => {
      // Arrange
      req.params.id = 1;

      // Mock pro existující postavu v aktivním sezení
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Kontrola existence postavy
        .mockResolvedValueOnce({ rows: [{ character_id: 1, story_id: 'story1' }] }); // Postava je v aktivním sezení

      // Act
      await characterController.deleteCharacter(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Nelze smazat postavu, která je v aktivním herním sezení')
      }));
    });
  });
});
