const {
  getAllAbilitiesForClass,
  getAvailableAbilities,
  initializeCharacterAbilities,
  updateAbilitiesOnLevelUp,
  useAbility,
  refreshAbilitiesAfterRest,
  getAbilityDetails
} = require('../../utils/abilitySystem');

describe('Ability System', () => {
  describe('getAllAbilitiesForClass', () => {
    test('should return all abilities for a class', () => {
      // Arrange & Act
      const abilities = getAllAbilitiesForClass('Bojovník');
      
      // Assert
      expect(abilities).toBeDefined();
      expect(Array.isArray(abilities)).toBe(true);
      expect(abilities.length).toBeGreaterThan(0);
      expect(abilities[0]).toHaveProperty('id');
      expect(abilities[0]).toHaveProperty('name');
      expect(abilities[0]).toHaveProperty('description');
    });
    
    test('should return empty array for unknown class', () => {
      // Arrange & Act
      const abilities = getAllAbilitiesForClass('UnknownClass');
      
      // Assert
      expect(abilities).toEqual([]);
    });
    
    test('should be case insensitive', () => {
      // Arrange & Act
      const abilities1 = getAllAbilitiesForClass('Bojovník');
      const abilities2 = getAllAbilitiesForClass('bojovník');
      
      // Assert
      expect(abilities1).toEqual(abilities2);
    });
  });
  
  describe('getAvailableAbilities', () => {
    test('should return abilities available at character level', () => {
      // Arrange & Act
      const abilities = getAvailableAbilities('Bojovník', 2);
      
      // Assert
      expect(abilities).toBeDefined();
      expect(Array.isArray(abilities)).toBe(true);
      
      // Bojovník má na úrovni 1 schopnost "Druhý dech" a na úrovni 2 "Bojový zápal"
      expect(abilities.length).toBe(2);
      expect(abilities.some(a => a.id === 'second_wind')).toBe(true);
      expect(abilities.some(a => a.id === 'action_surge')).toBe(true);
      expect(abilities.some(a => a.id === 'improved_critical')).toBe(false); // Tato je až na úrovni 3
    });
    
    test('should return empty array for unknown class', () => {
      // Arrange & Act
      const abilities = getAvailableAbilities('UnknownClass', 5);
      
      // Assert
      expect(abilities).toEqual([]);
    });
  });
  
  describe('initializeCharacterAbilities', () => {
    test('should initialize abilities for new character', () => {
      // Arrange
      const character = {
        name: 'Test Character',
        class: 'Bojovník',
        level: 1
      };
      
      // Act
      const result = initializeCharacterAbilities(character);
      
      // Assert
      expect(result.abilities).toBeDefined();
      expect(Array.isArray(result.abilities)).toBe(true);
      expect(result.abilities.length).toBe(1); // Na úrovni 1 má bojovník jednu schopnost
      expect(result.abilities[0].id).toBe('second_wind');
      expect(result.abilities[0].currentUses).toBe(1); // usesPerDay = 1
      expect(result.abilities[0].active).toBe(false); // type = 'active'
    });
    
    test('should not duplicate existing abilities', () => {
      // Arrange
      const character = {
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
      
      // Act
      const result = initializeCharacterAbilities(character);
      
      // Assert
      expect(result.abilities.length).toBe(1);
      expect(result.abilities[0].currentUses).toBe(0); // Zůstane 0, ne 1
    });
    
    test('should return null for null character', () => {
      // Arrange & Act
      const result = initializeCharacterAbilities(null);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('updateAbilitiesOnLevelUp', () => {
    test('should add new abilities on level up', () => {
      // Arrange
      const character = {
        name: 'Test Character',
        class: 'Bojovník',
        level: 2,
        abilities: [
          {
            id: 'second_wind',
            name: 'Druhý dech',
            currentUses: 1,
            active: false
          }
        ]
      };
      
      // Act
      const result = updateAbilitiesOnLevelUp(character);
      
      // Assert
      expect(result.abilities.length).toBe(2);
      expect(result.abilities[0].id).toBe('second_wind');
      expect(result.abilities[1].id).toBe('action_surge');
    });
    
    test('should not add abilities if already at max level', () => {
      // Arrange
      const character = {
        name: 'Test Character',
        class: 'Bojovník',
        level: 3,
        abilities: [
          { id: 'second_wind', currentUses: 1, active: false },
          { id: 'action_surge', currentUses: 1, active: false },
          { id: 'improved_critical', currentUses: -1, active: true }
        ]
      };
      
      // Act
      const result = updateAbilitiesOnLevelUp(character);
      
      // Assert
      expect(result.abilities.length).toBe(3); // Žádné nové schopnosti
    });
    
    test('should initialize abilities array if not present', () => {
      // Arrange
      const character = {
        name: 'Test Character',
        class: 'Bojovník',
        level: 1
      };
      
      // Act
      const result = updateAbilitiesOnLevelUp(character);
      
      // Assert
      expect(result.abilities).toBeDefined();
      expect(Array.isArray(result.abilities)).toBe(true);
      expect(result.abilities.length).toBe(1);
    });
  });
  
  describe('useAbility', () => {
    test('should use active ability successfully', () => {
      // Arrange
      const character = {
        name: 'Test Character',
        class: 'Bojovník',
        level: 1,
        max_health: 20,
        current_health: 10,
        abilities: [
          {
            id: 'second_wind',
            name: 'Druhý dech',
            description: 'Bojovník může jednou za odpočinek obnovit 1d10 + úroveň životů.',
            level: 1,
            usesPerDay: 1,
            currentUses: 1,
            cooldown: 0,
            type: 'active',
            effects: {
              healing: '1d10+level'
            }
          }
        ]
      };
      
      // Mock pro Math.random, aby byl výsledek hodu předvídatelný
      jest.spyOn(global.Math, 'random').mockReturnValue(0.5); // 1d10 = 6
      
      // Act
      const result = useAbility(character, 'second_wind');
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.effects).toBeDefined();
      expect(result.effects.length).toBe(1);
      expect(result.effects[0].type).toBe('healing');
      expect(character.current_health).toBeGreaterThan(10); // Zdraví by mělo být vyšší
      expect(character.abilities[0].currentUses).toBe(0); // Použití by mělo být sníženo
      
      // Obnovení původní implementace Math.random
      global.Math.random.mockRestore();
    });
    
    test('should fail if ability not found', () => {
      // Arrange
      const character = {
        name: 'Test Character',
        class: 'Bojovník',
        level: 1,
        abilities: []
      };
      
      // Act
      const result = useAbility(character, 'nonexistent_ability');
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('nebyla nalezena');
    });
    
    test('should fail if no uses remaining', () => {
      // Arrange
      const character = {
        name: 'Test Character',
        class: 'Bojovník',
        level: 1,
        abilities: [
          {
            id: 'second_wind',
            name: 'Druhý dech',
            usesPerDay: 1,
            currentUses: 0, // Již použito
            type: 'active',
            effects: {
              healing: '1d10+level'
            }
          }
        ]
      };
      
      // Act
      const result = useAbility(character, 'second_wind');
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('již nemá žádná použití');
    });
    
    test('should fail if on cooldown', () => {
      // Arrange
      const character = {
        name: 'Test Character',
        class: 'Bojovník',
        level: 1,
        abilities: [
          {
            id: 'second_wind',
            name: 'Druhý dech',
            usesPerDay: 1,
            currentUses: 1,
            cooldown: 3,
            cooldownRemaining: 2, // Ještě 2 kola cooldown
            type: 'active',
            effects: {
              healing: '1d10+level'
            }
          }
        ]
      };
      
      // Act
      const result = useAbility(character, 'second_wind');
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('se ještě obnovuje');
    });
  });
  
  describe('refreshAbilitiesAfterRest', () => {
    test('should refresh abilities after long rest', () => {
      // Arrange
      const character = {
        name: 'Test Character',
        class: 'Bojovník',
        level: 2,
        abilities: [
          {
            id: 'second_wind',
            name: 'Druhý dech',
            usesPerDay: 1,
            currentUses: 0, // Použito
            cooldownRemaining: 0,
            type: 'active'
          },
          {
            id: 'action_surge',
            name: 'Bojový zápal',
            usesPerDay: 1,
            currentUses: 0, // Použito
            cooldownRemaining: 2, // Na cooldownu
            type: 'active'
          }
        ]
      };
      
      // Act
      const result = refreshAbilitiesAfterRest(character, 'long');
      
      // Assert
      expect(result.abilities[0].currentUses).toBe(1); // Obnoveno
      expect(result.abilities[1].currentUses).toBe(1); // Obnoveno
      expect(result.abilities[1].cooldownRemaining).toBe(0); // Cooldown resetován
    });
    
    test('should refresh only short rest abilities after short rest', () => {
      // Arrange
      const character = {
        name: 'Test Character',
        class: 'Bojovník',
        level: 2,
        abilities: [
          {
            id: 'second_wind',
            name: 'Druhý dech',
            usesPerDay: 1,
            currentUses: 0,
            refreshOnShortRest: true, // Obnoví se i po krátkém odpočinku
            type: 'active'
          },
          {
            id: 'action_surge',
            name: 'Bojový zápal',
            usesPerDay: 1,
            currentUses: 0,
            refreshOnShortRest: false, // Neobnoví se po krátkém odpočinku
            type: 'active'
          }
        ]
      };
      
      // Act
      const result = refreshAbilitiesAfterRest(character, 'short');
      
      // Assert
      expect(result.abilities[0].currentUses).toBe(1); // Obnoveno
      expect(result.abilities[1].currentUses).toBe(0); // Neobnoveno
    });
    
    test('should handle character without abilities', () => {
      // Arrange
      const character = {
        name: 'Test Character',
        class: 'Bojovník',
        level: 1
      };
      
      // Act
      const result = refreshAbilitiesAfterRest(character, 'long');
      
      // Assert
      expect(result).toEqual(character);
    });
  });
  
  describe('getAbilityDetails', () => {
    test('should return ability details by id', () => {
      // Arrange & Act
      const ability = getAbilityDetails('second_wind');
      
      // Assert
      expect(ability).toBeDefined();
      expect(ability.id).toBe('second_wind');
      expect(ability.name).toBe('Druhý dech');
      expect(ability.level).toBe(1);
    });
    
    test('should return null for unknown ability', () => {
      // Arrange & Act
      const ability = getAbilityDetails('nonexistent_ability');
      
      // Assert
      expect(ability).toBeNull();
    });
  });
});
