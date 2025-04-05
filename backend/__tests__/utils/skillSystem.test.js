const {
  SKILL_CATEGORIES,
  DIFFICULTY_LEVELS,
  BASE_SKILLS,
  CLASS_DEFAULT_SKILLS,
  getAllSkills,
  getSkillById,
  getSkillsByCategory,
  getDefaultSkillsForClass,
  initializeCharacterSkills,
  calculateSkillBonus,
  performSkillCheck,
  improveSkill,
  getDifficultyByName,
  getDifficultyByDC
} = require('../../utils/skillSystem');

// Mock pro rollDice
jest.mock('../../utils/gameMechanics', () => ({
  rollDice: jest.fn().mockReturnValue(10),
  getAttributeBonus: jest.fn().mockImplementation((value) => Math.floor((value - 10) / 2))
}));

describe('Skill System', () => {
  describe('getAllSkills', () => {
    test('should return all skills', () => {
      const skills = getAllSkills();
      
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills[0]).toHaveProperty('id');
      expect(skills[0]).toHaveProperty('name');
      expect(skills[0]).toHaveProperty('description');
      expect(skills[0]).toHaveProperty('category');
      expect(skills[0]).toHaveProperty('attribute');
    });
  });
  
  describe('getSkillById', () => {
    test('should return skill by ID', () => {
      const skill = getSkillById('persuasion');
      
      expect(skill).toBeDefined();
      expect(skill.id).toBe('persuasion');
      expect(skill.name).toBe('Přesvědčování');
      expect(skill.category).toBe(SKILL_CATEGORIES.SOCIAL);
      expect(skill.attribute).toBe('charisma');
    });
    
    test('should return null for non-existent skill', () => {
      const skill = getSkillById('non_existent_skill');
      
      expect(skill).toBeNull();
    });
  });
  
  describe('getSkillsByCategory', () => {
    test('should return skills by category', () => {
      const skills = getSkillsByCategory(SKILL_CATEGORIES.SOCIAL);
      
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills.every(skill => skill.category === SKILL_CATEGORIES.SOCIAL)).toBe(true);
    });
    
    test('should return empty array for non-existent category', () => {
      const skills = getSkillsByCategory('non_existent_category');
      
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBe(0);
    });
  });
  
  describe('getDefaultSkillsForClass', () => {
    test('should return default skills for class', () => {
      const skills = getDefaultSkillsForClass('zloděj');
      
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills.some(skill => skill.id === 'stealth')).toBe(true);
      expect(skills.some(skill => skill.id === 'sleight_of_hand')).toBe(true);
    });
    
    test('should return empty array for non-existent class', () => {
      const skills = getDefaultSkillsForClass('non_existent_class');
      
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBe(0);
    });
  });
  
  describe('initializeCharacterSkills', () => {
    test('should initialize skills for new character', () => {
      const character = {
        class: 'zloděj',
        strength: 10,
        dexterity: 16,
        constitution: 12,
        intelligence: 14,
        wisdom: 10,
        charisma: 8
      };
      
      const updatedCharacter = initializeCharacterSkills(character);
      
      expect(updatedCharacter.skills).toBeDefined();
      expect(Object.keys(updatedCharacter.skills).length).toBeGreaterThan(0);
      
      // Kontrola, že výchozí dovednosti pro zloděje mají hodnotu 2
      expect(updatedCharacter.skills.stealth.value).toBe(2);
      expect(updatedCharacter.skills.sleight_of_hand.value).toBe(2);
      
      // Kontrola, že defaultně trénované dovednosti mají hodnotu 1
      expect(updatedCharacter.skills.perception.value).toBe(1);
      
      // Kontrola, že ostatní dovednosti mají hodnotu 0
      expect(updatedCharacter.skills.arcana.value).toBe(0);
    });
  });
  
  describe('calculateSkillBonus', () => {
    test('should calculate correct skill bonus', () => {
      const character = {
        strength: 14, // +2 bonus
        dexterity: 16, // +3 bonus
        intelligence: 10, // +0 bonus
        wisdom: 12, // +1 bonus
        charisma: 8, // -1 bonus
        skills: {
          athletics: { value: 2, attribute: 'strength' },
          stealth: { value: 3, attribute: 'dexterity' },
          arcana: { value: 0, attribute: 'intelligence' },
          perception: { value: 1, attribute: 'wisdom' },
          persuasion: { value: 2, attribute: 'charisma' }
        }
      };
      
      // Bonus = atribut bonus + hodnota dovednosti
      expect(calculateSkillBonus(character, 'athletics')).toBe(4); // 2 + 2
      expect(calculateSkillBonus(character, 'stealth')).toBe(6); // 3 + 3
      expect(calculateSkillBonus(character, 'arcana')).toBe(0); // 0 + 0
      expect(calculateSkillBonus(character, 'perception')).toBe(2); // 1 + 1
      expect(calculateSkillBonus(character, 'persuasion')).toBe(1); // -1 + 2
    });
    
    test('should return 0 for non-existent skill', () => {
      const character = {
        strength: 10,
        skills: {
          athletics: { value: 2, attribute: 'strength' }
        }
      };
      
      expect(calculateSkillBonus(character, 'non_existent_skill')).toBe(0);
    });
  });
  
  describe('performSkillCheck', () => {
    test('should perform successful skill check', () => {
      const character = {
        name: 'Test Character',
        strength: 14, // +2 bonus
        skills: {
          athletics: { value: 2, attribute: 'strength' }
        }
      };
      
      // Mock rollDice to return 10
      const result = performSkillCheck(character, 'athletics', 10);
      
      expect(result.success).toBe(true);
      expect(result.roll).toBe(10);
      expect(result.bonus).toBe(4); // 2 (strength) + 2 (skill)
      expect(result.total).toBe(14);
      expect(result.dc).toBe(10);
      expect(result.margin).toBe(4);
    });
    
    test('should perform failed skill check', () => {
      const character = {
        name: 'Test Character',
        strength: 10, // +0 bonus
        skills: {
          athletics: { value: 1, attribute: 'strength' }
        }
      };
      
      // Mock rollDice to return 5
      require('../../utils/gameMechanics').rollDice.mockReturnValueOnce(5);
      
      const result = performSkillCheck(character, 'athletics', 10);
      
      expect(result.success).toBe(false);
      expect(result.roll).toBe(5);
      expect(result.bonus).toBe(1);
      expect(result.total).toBe(6);
      expect(result.dc).toBe(10);
      expect(result.margin).toBe(-4);
    });
    
    test('should handle critical success', () => {
      const character = {
        name: 'Test Character',
        strength: 10,
        skills: {
          athletics: { value: 0, attribute: 'strength' }
        }
      };
      
      // Mock rollDice to return 20 (critical success)
      require('../../utils/gameMechanics').rollDice.mockReturnValueOnce(20);
      
      const result = performSkillCheck(character, 'athletics', 25);
      
      expect(result.success).toBe(true);
      expect(result.criticalSuccess).toBe(true);
      expect(result.roll).toBe(20);
    });
    
    test('should handle critical failure', () => {
      const character = {
        name: 'Test Character',
        strength: 18, // +4 bonus
        skills: {
          athletics: { value: 5, attribute: 'strength' }
        }
      };
      
      // Mock rollDice to return 1 (critical failure)
      require('../../utils/gameMechanics').rollDice.mockReturnValueOnce(1);
      
      const result = performSkillCheck(character, 'athletics', 5);
      
      expect(result.success).toBe(false);
      expect(result.criticalFailure).toBe(true);
      expect(result.roll).toBe(1);
    });
  });
  
  describe('improveSkill', () => {
    test('should improve skill', () => {
      const character = {
        skills: {
          athletics: { value: 2, attribute: 'strength' }
        }
      };
      
      const result = improveSkill(character, 'athletics');
      
      expect(result.success).toBe(true);
      expect(character.skills.athletics.value).toBe(3);
      expect(result.skill.oldValue).toBe(2);
      expect(result.skill.newValue).toBe(3);
    });
    
    test('should improve skill by specified amount', () => {
      const character = {
        skills: {
          athletics: { value: 2, attribute: 'strength' }
        }
      };
      
      const result = improveSkill(character, 'athletics', 3);
      
      expect(result.success).toBe(true);
      expect(character.skills.athletics.value).toBe(5);
      expect(result.skill.oldValue).toBe(2);
      expect(result.skill.newValue).toBe(5);
    });
    
    test('should not exceed maximum skill value', () => {
      const character = {
        skills: {
          athletics: { value: 9, attribute: 'strength' }
        }
      };
      
      const result = improveSkill(character, 'athletics', 3);
      
      expect(result.success).toBe(true);
      expect(character.skills.athletics.value).toBe(10); // Maximum is 10
      expect(result.skill.oldValue).toBe(9);
      expect(result.skill.newValue).toBe(10);
    });
    
    test('should fail when already at maximum', () => {
      const character = {
        skills: {
          athletics: { value: 10, attribute: 'strength' }
        }
      };
      
      const result = improveSkill(character, 'athletics');
      
      expect(result.success).toBe(false);
      expect(character.skills.athletics.value).toBe(10);
    });
    
    test('should initialize skill if not present', () => {
      const character = {
        skills: {}
      };
      
      const result = improveSkill(character, 'athletics');
      
      expect(result.success).toBe(true);
      expect(character.skills.athletics).toBeDefined();
      expect(character.skills.athletics.value).toBe(1);
    });
  });
  
  describe('getDifficultyByName', () => {
    test('should return difficulty by name', () => {
      expect(getDifficultyByName('easy').dc).toBe(10);
      expect(getDifficultyByName('medium').dc).toBe(15);
      expect(getDifficultyByName('hard').dc).toBe(20);
    });
    
    test('should return medium difficulty for unknown name', () => {
      expect(getDifficultyByName('unknown').dc).toBe(15);
    });
  });
  
  describe('getDifficultyByDC', () => {
    test('should return difficulty by DC', () => {
      expect(getDifficultyByDC(5).name).toBe('very_easy');
      expect(getDifficultyByDC(10).name).toBe('easy');
      expect(getDifficultyByDC(15).name).toBe('medium');
      expect(getDifficultyByDC(20).name).toBe('hard');
      expect(getDifficultyByDC(25).name).toBe('very_hard');
      expect(getDifficultyByDC(30).name).toBe('nearly_impossible');
    });
    
    test('should return highest matching difficulty for in-between values', () => {
      expect(getDifficultyByDC(12).name).toBe('easy');
      expect(getDifficultyByDC(18).name).toBe('medium');
      expect(getDifficultyByDC(23).name).toBe('hard');
    });
    
    test('should return highest difficulty for values above maximum', () => {
      expect(getDifficultyByDC(35).name).toBe('nearly_impossible');
    });
  });
});
