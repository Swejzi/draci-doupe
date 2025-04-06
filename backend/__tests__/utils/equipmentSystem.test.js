const {
  EQUIPMENT_SLOTS,
  EQUIPMENT_TYPES,
  WEAPON_CATEGORIES,
  ARMOR_CATEGORIES,
  canUseItem,
  canEquipToSlot,
  equipItem,
  unequipItem,
  addItemToInventory,
  calculateTotalAC,
  getEquippedItems,
  getCurrentWeapon,
  calculateEquipmentBonuses,
  getEffectiveAttributes
} = require('../../utils/equipmentSystem');

describe('Equipment System', () => {
  describe('canUseItem', () => {
    test('should return true when all requirements are met', () => {
      // Arrange
      const character = {
        class: 'Bojovník',
        level: 5,
        strength: 16,
        dexterity: 14,
        constitution: 15,
        intelligence: 10,
        wisdom: 12,
        charisma: 8
      };
      
      const item = {
        id: 'longsword',
        name: 'Dlouhý meč',
        type: EQUIPMENT_TYPES.WEAPON,
        category: WEAPON_CATEGORIES.SWORD,
        requirements: {
          level: 3,
          class: ['Bojovník', 'Hraničář'],
          strength: 12
        }
      };
      
      // Act
      const result = canUseItem(character, item);
      
      // Assert
      expect(result.canUse).toBe(true);
    });
    
    test('should return false when level requirement is not met', () => {
      // Arrange
      const character = {
        class: 'Bojovník',
        level: 2,
        strength: 16
      };
      
      const item = {
        id: 'longsword',
        name: 'Dlouhý meč',
        requirements: {
          level: 3
        }
      };
      
      // Act
      const result = canUseItem(character, item);
      
      // Assert
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('Vyžaduje úroveň 3');
    });
    
    test('should return false when class requirement is not met', () => {
      // Arrange
      const character = {
        class: 'Kouzelník',
        level: 5,
        intelligence: 18
      };
      
      const item = {
        id: 'platemail',
        name: 'Plátová zbroj',
        type: EQUIPMENT_TYPES.ARMOR,
        category: ARMOR_CATEGORIES.HEAVY,
        requirements: {
          class: ['Bojovník']
        }
      };
      
      // Act
      const result = canUseItem(character, item);
      
      // Assert
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('Pouze pro povolání');
    });
    
    test('should return false when attribute requirement is not met', () => {
      // Arrange
      const character = {
        class: 'Bojovník',
        level: 5,
        strength: 10
      };
      
      const item = {
        id: 'greatsword',
        name: 'Obouruční meč',
        requirements: {
          strength: 14
        }
      };
      
      // Act
      const result = canUseItem(character, item);
      
      // Assert
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('Vyžaduje strength 14');
    });
    
    test('should return false when armor category is not allowed for class', () => {
      // Arrange
      const character = {
        class: 'Kouzelník',
        level: 5
      };
      
      const item = {
        id: 'leather_armor',
        name: 'Kožená zbroj',
        type: EQUIPMENT_TYPES.ARMOR,
        category: ARMOR_CATEGORIES.LIGHT
      };
      
      // Act
      const result = canUseItem(character, item);
      
      // Assert
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('nemůže používat zbroj typu');
    });
    
    test('should return false when weapon category is not allowed for class', () => {
      // Arrange
      const character = {
        class: 'Kouzelník',
        level: 5
      };
      
      const item = {
        id: 'battleaxe',
        name: 'Bojová sekera',
        type: EQUIPMENT_TYPES.WEAPON,
        category: WEAPON_CATEGORIES.AXE
      };
      
      // Act
      const result = canUseItem(character, item);
      
      // Assert
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('nemůže používat zbraň typu');
    });
  });
  
  describe('canEquipToSlot', () => {
    test('should return true when item can be equipped to slot', () => {
      // Arrange
      const item = {
        id: 'longsword',
        name: 'Dlouhý meč',
        type: EQUIPMENT_TYPES.WEAPON
      };
      
      // Act
      const result = canEquipToSlot(item, EQUIPMENT_SLOTS.WEAPON);
      
      // Assert
      expect(result).toBe(true);
    });
    
    test('should return true when item has specific slot', () => {
      // Arrange
      const item = {
        id: 'amulet',
        name: 'Amulet ochrany',
        type: EQUIPMENT_TYPES.ACCESSORY,
        slot: EQUIPMENT_SLOTS.NECK
      };
      
      // Act
      const result = canEquipToSlot(item, EQUIPMENT_SLOTS.NECK);
      
      // Assert
      expect(result).toBe(true);
    });
    
    test('should return false when item cannot be equipped to slot', () => {
      // Arrange
      const item = {
        id: 'longsword',
        name: 'Dlouhý meč',
        type: EQUIPMENT_TYPES.WEAPON
      };
      
      // Act
      const result = canEquipToSlot(item, EQUIPMENT_SLOTS.HEAD);
      
      // Assert
      expect(result).toBe(false);
    });
    
    test('should return false when item has specific slot that does not match', () => {
      // Arrange
      const item = {
        id: 'amulet',
        name: 'Amulet ochrany',
        type: EQUIPMENT_TYPES.ACCESSORY,
        slot: EQUIPMENT_SLOTS.NECK
      };
      
      // Act
      const result = canEquipToSlot(item, EQUIPMENT_SLOTS.RING_1);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('equipItem', () => {
    test('should equip item to empty slot', () => {
      // Arrange
      const character = {
        class: 'Bojovník',
        level: 5,
        strength: 16,
        inventory: [
          {
            id: 'longsword',
            name: 'Dlouhý meč',
            type: EQUIPMENT_TYPES.WEAPON,
            category: WEAPON_CATEGORIES.SWORD,
            effects: {
              damageBonus: 2
            }
          }
        ]
      };
      
      // Act
      const result = equipItem(character, 'longsword', EQUIPMENT_SLOTS.WEAPON);
      
      // Assert
      expect(result.success).toBe(true);
      expect(character.equipment[EQUIPMENT_SLOTS.WEAPON]).toBeDefined();
      expect(character.equipment[EQUIPMENT_SLOTS.WEAPON].id).toBe('longsword');
      expect(character.inventory.length).toBe(0);
      expect(character.damageBonus).toBe(2);
    });
    
    test('should replace item in occupied slot', () => {
      // Arrange
      const character = {
        class: 'Bojovník',
        level: 5,
        strength: 16,
        inventory: [
          {
            id: 'longsword',
            name: 'Dlouhý meč',
            type: EQUIPMENT_TYPES.WEAPON,
            category: WEAPON_CATEGORIES.SWORD,
            effects: {
              damageBonus: 2
            }
          }
        ],
        equipment: {
          [EQUIPMENT_SLOTS.WEAPON]: {
            id: 'shortsword',
            name: 'Krátký meč',
            type: EQUIPMENT_TYPES.WEAPON,
            category: WEAPON_CATEGORIES.SWORD,
            effects: {
              damageBonus: 1
            }
          }
        },
        damageBonus: 1
      };
      
      // Act
      const result = equipItem(character, 'longsword', EQUIPMENT_SLOTS.WEAPON);
      
      // Assert
      expect(result.success).toBe(true);
      expect(character.equipment[EQUIPMENT_SLOTS.WEAPON].id).toBe('longsword');
      expect(character.inventory.length).toBe(1);
      expect(character.inventory[0].id).toBe('shortsword');
      expect(character.damageBonus).toBe(2);
    });
    
    test('should return error when item is not in inventory', () => {
      // Arrange
      const character = {
        class: 'Bojovník',
        level: 5,
        inventory: []
      };
      
      // Act
      const result = equipItem(character, 'nonexistent', EQUIPMENT_SLOTS.WEAPON);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('nebyl nalezen v inventáři');
    });
    
    test('should return error when item cannot be equipped to slot', () => {
      // Arrange
      const character = {
        class: 'Bojovník',
        level: 5,
        inventory: [
          {
            id: 'helmet',
            name: 'Helma',
            type: EQUIPMENT_TYPES.ARMOR,
            category: ARMOR_CATEGORIES.LIGHT
          }
        ]
      };
      
      // Act
      const result = equipItem(character, 'helmet', EQUIPMENT_SLOTS.WEAPON);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('nelze vybavit do slotu');
    });
  });
  
  describe('unequipItem', () => {
    test('should unequip item from slot', () => {
      // Arrange
      const character = {
        equipment: {
          [EQUIPMENT_SLOTS.WEAPON]: {
            id: 'longsword',
            name: 'Dlouhý meč',
            type: EQUIPMENT_TYPES.WEAPON,
            effects: {
              damageBonus: 2
            }
          }
        },
        damageBonus: 2,
        inventory: []
      };
      
      // Act
      const result = unequipItem(character, EQUIPMENT_SLOTS.WEAPON);
      
      // Assert
      expect(result.success).toBe(true);
      expect(character.equipment[EQUIPMENT_SLOTS.WEAPON]).toBeUndefined();
      expect(character.inventory.length).toBe(1);
      expect(character.inventory[0].id).toBe('longsword');
      expect(character.damageBonus).toBeUndefined();
    });
    
    test('should return error when slot is empty', () => {
      // Arrange
      const character = {
        equipment: {}
      };
      
      // Act
      const result = unequipItem(character, EQUIPMENT_SLOTS.WEAPON);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Žádný předmět není vybaven');
    });
  });
  
  describe('calculateTotalAC', () => {
    test('should calculate AC with no equipment', () => {
      // Arrange
      const character = {
        dexterity: 14 // +2 bonus
      };
      
      // Act
      const result = calculateTotalAC(character);
      
      // Assert
      expect(result).toBe(12); // 10 + 2
    });
    
    test('should calculate AC with armor', () => {
      // Arrange
      const character = {
        dexterity: 14, // +2 bonus
        equipment: {
          [EQUIPMENT_SLOTS.CHEST]: {
            id: 'chainmail',
            name: 'Kroužková zbroj',
            type: EQUIPMENT_TYPES.ARMOR,
            category: ARMOR_CATEGORIES.MEDIUM,
            effects: {
              ac: 5
            }
          }
        }
      };
      
      // Act
      const result = calculateTotalAC(character);
      
      // Assert
      expect(result).toBe(17); // 10 + 2 + 5
    });
    
    test('should limit dexterity bonus with heavy armor', () => {
      // Arrange
      const character = {
        dexterity: 18, // +4 bonus
        equipment: {
          [EQUIPMENT_SLOTS.CHEST]: {
            id: 'platemail',
            name: 'Plátová zbroj',
            type: EQUIPMENT_TYPES.ARMOR,
            category: ARMOR_CATEGORIES.HEAVY,
            effects: {
              ac: 8
            }
          }
        }
      };
      
      // Act
      const result = calculateTotalAC(character);
      
      // Assert
      expect(result).toBe(18); // 10 + 0 + 8 (dex bonus omezen na 0)
    });
    
    test('should include shield bonus', () => {
      // Arrange
      const character = {
        dexterity: 14, // +2 bonus
        equipment: {
          [EQUIPMENT_SLOTS.CHEST]: {
            id: 'leather_armor',
            name: 'Kožená zbroj',
            type: EQUIPMENT_TYPES.ARMOR,
            category: ARMOR_CATEGORIES.LIGHT,
            effects: {
              ac: 2
            }
          },
          [EQUIPMENT_SLOTS.OFF_HAND]: {
            id: 'shield',
            name: 'Štít',
            type: EQUIPMENT_TYPES.SHIELD,
            effects: {
              ac: 2
            }
          }
        }
      };
      
      // Act
      const result = calculateTotalAC(character);
      
      // Assert
      expect(result).toBe(16); // 10 + 2 + 2 + 2
    });
    
    test('should include other AC bonuses', () => {
      // Arrange
      const character = {
        dexterity: 14, // +2 bonus
        acBonus: 1,
        equipment: {
          [EQUIPMENT_SLOTS.CHEST]: {
            id: 'leather_armor',
            name: 'Kožená zbroj',
            type: EQUIPMENT_TYPES.ARMOR,
            category: ARMOR_CATEGORIES.LIGHT,
            effects: {
              ac: 2
            }
          }
        }
      };
      
      // Act
      const result = calculateTotalAC(character);
      
      // Assert
      expect(result).toBe(15); // 10 + 2 + 2 + 1
    });
  });
  
  describe('calculateEquipmentBonuses', () => {
    test('should calculate all bonuses from equipment', () => {
      // Arrange
      const character = {
        equipment: {
          [EQUIPMENT_SLOTS.WEAPON]: {
            id: 'longsword',
            name: 'Dlouhý meč',
            type: EQUIPMENT_TYPES.WEAPON,
            effects: {
              attackBonus: 1,
              damageBonus: 2
            }
          },
          [EQUIPMENT_SLOTS.CHEST]: {
            id: 'chainmail',
            name: 'Kroužková zbroj',
            type: EQUIPMENT_TYPES.ARMOR,
            effects: {
              ac: 5
            }
          },
          [EQUIPMENT_SLOTS.NECK]: {
            id: 'amulet',
            name: 'Amulet síly',
            type: EQUIPMENT_TYPES.ACCESSORY,
            effects: {
              attributes: {
                strength: 2
              }
            }
          },
          [EQUIPMENT_SLOTS.RING_1]: {
            id: 'ring',
            name: 'Prsten ohnivé odolnosti',
            type: EQUIPMENT_TYPES.ACCESSORY,
            effects: {
              resistances: {
                fire: 50
              }
            }
          }
        }
      };
      
      // Act
      const result = calculateEquipmentBonuses(character);
      
      // Assert
      expect(result.attributes.strength).toBe(2);
      expect(result.ac).toBe(5);
      expect(result.attackBonus).toBe(1);
      expect(result.damageBonus).toBe(2);
      expect(result.resistances.fire).toBe(50);
    });
    
    test('should return empty bonuses for character without equipment', () => {
      // Arrange
      const character = {};
      
      // Act
      const result = calculateEquipmentBonuses(character);
      
      // Assert
      expect(result.attributes).toEqual({});
      expect(result.ac).toBe(0);
      expect(result.attackBonus).toBe(0);
      expect(result.damageBonus).toBe(0);
      expect(result.resistances).toEqual({});
    });
  });
  
  describe('getEffectiveAttributes', () => {
    test('should return base attributes when no bonuses', () => {
      // Arrange
      const character = {
        strength: 16,
        dexterity: 14,
        constitution: 15,
        intelligence: 10,
        wisdom: 12,
        charisma: 8
      };
      
      // Act
      const result = getEffectiveAttributes(character);
      
      // Assert
      expect(result.strength).toBe(16);
      expect(result.dexterity).toBe(14);
      expect(result.constitution).toBe(15);
      expect(result.intelligence).toBe(10);
      expect(result.wisdom).toBe(12);
      expect(result.charisma).toBe(8);
    });
    
    test('should include attribute bonuses', () => {
      // Arrange
      const character = {
        strength: 16,
        dexterity: 14,
        constitution: 15,
        intelligence: 10,
        wisdom: 12,
        charisma: 8,
        attributeBonuses: {
          strength: 2,
          dexterity: 1,
          intelligence: -1
        }
      };
      
      // Act
      const result = getEffectiveAttributes(character);
      
      // Assert
      expect(result.strength).toBe(18);
      expect(result.dexterity).toBe(15);
      expect(result.constitution).toBe(15);
      expect(result.intelligence).toBe(9);
      expect(result.wisdom).toBe(12);
      expect(result.charisma).toBe(8);
    });
  });
});
