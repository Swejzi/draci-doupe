const {
  MAGIC_SCHOOLS,
  SPELL_TYPES,
  TARGET_TYPES,
  hasEnoughMana,
  canCastSpell,
  calculateSpellDC,
  getSpellcastingAttribute,
  calculateSpellAttackBonus,
  castSpell,
  getAvailableSpells
} = require('../../utils/spellSystem');

// Mock pro rollDice
jest.mock('../../utils/gameMechanics', () => ({
  rollDice: jest.fn().mockReturnValue(10),
  getAttributeBonus: jest.fn().mockImplementation((value) => Math.floor((value - 10) / 2))
}));

describe('Spell System', () => {
  describe('hasEnoughMana', () => {
    test('should return true when character has enough mana', () => {
      const character = { current_mana: 10 };
      const spell = { manaCost: 5 };
      
      expect(hasEnoughMana(character, spell)).toBe(true);
    });
    
    test('should return false when character does not have enough mana', () => {
      const character = { current_mana: 3 };
      const spell = { manaCost: 5 };
      
      expect(hasEnoughMana(character, spell)).toBe(false);
    });
  });
  
  describe('canCastSpell', () => {
    test('should return true when all conditions are met', () => {
      const character = {
        class: 'kouzelník',
        level: 5,
        current_mana: 10
      };
      
      const spell = {
        allowedClasses: ['kouzelník', 'čaroděj'],
        minLevel: 3,
        manaCost: 5
      };
      
      expect(canCastSpell(character, spell)).toBe(true);
    });
    
    test('should return false when class is not allowed', () => {
      const character = {
        class: 'bojovník',
        level: 5,
        current_mana: 10
      };
      
      const spell = {
        allowedClasses: ['kouzelník', 'čaroděj'],
        minLevel: 3,
        manaCost: 5
      };
      
      expect(canCastSpell(character, spell)).toBe(false);
    });
    
    test('should return false when level is too low', () => {
      const character = {
        class: 'kouzelník',
        level: 2,
        current_mana: 10
      };
      
      const spell = {
        allowedClasses: ['kouzelník', 'čaroděj'],
        minLevel: 3,
        manaCost: 5
      };
      
      expect(canCastSpell(character, spell)).toBe(false);
    });
    
    test('should return false when not enough mana', () => {
      const character = {
        class: 'kouzelník',
        level: 5,
        current_mana: 3
      };
      
      const spell = {
        allowedClasses: ['kouzelník', 'čaroděj'],
        minLevel: 3,
        manaCost: 5
      };
      
      expect(canCastSpell(character, spell)).toBe(false);
    });
  });
  
  describe('getSpellcastingAttribute', () => {
    test('should return intelligence for wizard and sorcerer', () => {
      expect(getSpellcastingAttribute('kouzelník')).toBe('intelligence');
      expect(getSpellcastingAttribute('čaroděj')).toBe('intelligence');
    });
    
    test('should return wisdom for cleric and druid', () => {
      expect(getSpellcastingAttribute('klerik')).toBe('wisdom');
      expect(getSpellcastingAttribute('druid')).toBe('wisdom');
    });
    
    test('should return charisma for bard and paladin', () => {
      expect(getSpellcastingAttribute('bard')).toBe('charisma');
      expect(getSpellcastingAttribute('paladin')).toBe('charisma');
    });
    
    test('should return intelligence for unknown class', () => {
      expect(getSpellcastingAttribute('neznámá třída')).toBe('intelligence');
    });
  });
  
  describe('calculateSpellDC', () => {
    test('should calculate correct DC for wizard', () => {
      const character = {
        class: 'kouzelník',
        level: 5,
        intelligence: 16 // +3 bonus
      };
      
      const spell = {
        level: 3
      };
      
      // 8 + spell level/2 + attribute bonus + level/4
      // 8 + 1 + 3 + 1 = 13
      expect(calculateSpellDC(character, spell)).toBe(13);
    });
    
    test('should calculate correct DC for cleric', () => {
      const character = {
        class: 'klerik',
        level: 8,
        wisdom: 18 // +4 bonus
      };
      
      const spell = {
        level: 4
      };
      
      // 8 + spell level/2 + attribute bonus + level/4
      // 8 + 2 + 4 + 2 = 16
      expect(calculateSpellDC(character, spell)).toBe(16);
    });
  });
  
  describe('calculateSpellAttackBonus', () => {
    test('should calculate correct attack bonus for wizard', () => {
      const character = {
        class: 'kouzelník',
        level: 5,
        intelligence: 16 // +3 bonus
      };
      
      const spell = {
        school: MAGIC_SCHOOLS.EVOCATION
      };
      
      // attribute bonus + level/2
      // 3 + 2 = 5
      expect(calculateSpellAttackBonus(character, spell)).toBe(5);
    });
    
    test('should add bonus for specialization', () => {
      const character = {
        class: 'kouzelník',
        level: 5,
        intelligence: 16, // +3 bonus
        specialization: {
          school: MAGIC_SCHOOLS.EVOCATION
        }
      };
      
      const spell = {
        school: MAGIC_SCHOOLS.EVOCATION
      };
      
      // attribute bonus + level/2 + specialization bonus
      // 3 + 2 + 2 = 7
      expect(calculateSpellAttackBonus(character, spell)).toBe(7);
    });
  });
  
  describe('castSpell', () => {
    test('should return failure when cannot cast spell', () => {
      const character = {
        class: 'kouzelník',
        level: 3,
        current_mana: 2,
        name: 'Gandalf'
      };
      
      const spell = {
        id: 'magic_missile',
        name: 'Magická střela',
        manaCost: 3,
        allowedClasses: ['kouzelník']
      };
      
      const target = {
        name: 'Goblin'
      };
      
      const result = castSpell(character, spell, target);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('not_enough_mana');
    });
    
    test('should deduct mana when casting spell', () => {
      const character = {
        class: 'kouzelník',
        level: 3,
        current_mana: 10,
        name: 'Gandalf'
      };
      
      const spell = {
        id: 'magic_missile',
        name: 'Magická střela',
        type: SPELL_TYPES.ATTACK,
        manaCost: 3,
        allowedClasses: ['kouzelník']
      };
      
      const target = {
        name: 'Goblin'
      };
      
      const result = castSpell(character, spell, target);
      
      expect(result.success).toBe(true);
      expect(character.current_mana).toBe(7);
    });
  });
  
  describe('getAvailableSpells', () => {
    test('should return spells for wizard', () => {
      const spells = getAvailableSpells('kouzelník', 5);
      
      expect(spells.length).toBeGreaterThan(0);
      expect(spells.some(spell => spell.id === 'magic_missile')).toBe(true);
      expect(spells.some(spell => spell.id === 'fireball')).toBe(true);
      expect(spells.some(spell => spell.id === 'cure_wounds')).toBe(false); // Not a wizard spell
    });
    
    test('should return spells for cleric', () => {
      const spells = getAvailableSpells('klerik', 5);
      
      expect(spells.length).toBeGreaterThan(0);
      expect(spells.some(spell => spell.id === 'cure_wounds')).toBe(true);
      expect(spells.some(spell => spell.id === 'bless')).toBe(true);
      expect(spells.some(spell => spell.id === 'magic_missile')).toBe(false); // Not a cleric spell
    });
    
    test('should filter by level', () => {
      const lowLevelSpells = getAvailableSpells('kouzelník', 1);
      const highLevelSpells = getAvailableSpells('kouzelník', 5);
      
      expect(highLevelSpells.length).toBeGreaterThan(lowLevelSpells.length);
      expect(lowLevelSpells.some(spell => spell.id === 'fireball')).toBe(false); // Level 3 spell
      expect(highLevelSpells.some(spell => spell.id === 'fireball')).toBe(true);
    });
  });
});
