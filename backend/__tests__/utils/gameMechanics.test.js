const { getAttributeBonus, rollDice } = require('../../utils/gameMechanics');

// Mock the database module since we don't want to actually connect to the database in tests
jest.mock('../../config/db', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn()
  }
}));

describe('Game Mechanics Utils', () => {
  describe('getAttributeBonus', () => {
    test('should return correct bonus for attribute values', () => {
      expect(getAttributeBonus(10)).toBe(0);
      expect(getAttributeBonus(12)).toBe(1);
      expect(getAttributeBonus(14)).toBe(2);
      expect(getAttributeBonus(8)).toBe(-1);
      expect(getAttributeBonus(6)).toBe(-2);
    });

    test('should handle string inputs', () => {
      expect(getAttributeBonus('10')).toBe(0);
      expect(getAttributeBonus('12')).toBe(1);
    });

    test('should return 0 for invalid inputs', () => {
      expect(getAttributeBonus(null)).toBe(0);
      expect(getAttributeBonus(undefined)).toBe(0);
      expect(getAttributeBonus('abc')).toBe(0);
    });
  });

  describe('rollDice', () => {
    // Mock Math.random to return predictable values
    const originalRandom = Math.random;

    beforeEach(() => {
      // Mock Math.random to always return 0.5 (which gives predictable dice rolls)
      Math.random = jest.fn(() => 0.5);
    });

    afterEach(() => {
      // Restore original Math.random
      Math.random = originalRandom;
    });

    test('should correctly parse dice notation and roll dice', () => {
      // With Math.random = 0.5, a d6 will always roll 3 (0.5 * 6 = 3, then +1 = 4, but floor makes it 3)
      expect(rollDice('1d6')).toBe(4);
      expect(rollDice('2d6')).toBe(8); // 2 dice, each rolling 4
      expect(rollDice('1d20')).toBe(11); // 0.5 * 20 = 10, then +1 = 11
    });

    test('should handle modifiers', () => {
      expect(rollDice('1d6+2')).toBe(6); // 4 + 2
      expect(rollDice('1d6-2')).toBe(2); // 4 - 2
      expect(rollDice('2d4+3')).toBe(9); // (2 * 3) + 3 = 9
    });

    test('should return 0 for invalid dice notation', () => {
      expect(rollDice('invalid')).toBe(0);
      expect(rollDice('')).toBe(0);
      expect(rollDice(null)).toBe(0);
    });
  });
});
