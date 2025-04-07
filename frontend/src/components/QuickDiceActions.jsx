import React from 'react';
import { rollDice, getAttributeBonus } from '../utils/gameMechanics';
import './QuickDiceActions.css';

/**
 * Komponenta pro rychlé hody kostkou spojené s herními akcemi
 * @param {Object} props - Vlastnosti komponenty
 * @param {Object} props.character - Postava hráče
 * @param {function} props.onRoll - Callback po hodu kostkou
 * @param {function} props.onActionSelect - Callback po výběru akce
 */
function QuickDiceActions({ character, onRoll, onActionSelect }) {
  // Používáme importovanou funkci getAttributeBonus z utils/gameMechanics.js

  // Funkce pro provedení hodu na útok
  const handleAttackRoll = (attackType) => {
    let bonus = getAttributeBonus(character.strength);
    let diceString = '1d20';
    let modifierString = bonus >= 0 ? `+${bonus}` : bonus;
    let fullDiceString = `${diceString}${modifierString}`;

    // Různé typy útoků mají různé modifikátory
    let actionDescription = '';
    switch(attackType) {
      case 'quick':
        actionDescription = 'Rychlý útok';
        break;
      case 'power':
        actionDescription = 'Silný útok';
        break;
      case 'defensive':
        actionDescription = 'Obranný útok';
        break;
      default:
        actionDescription = 'Útok';
    }

    // Provedení hodu
    const result = rollDice(fullDiceString, {
      type: `útok (${actionDescription})`,
      addToHistory: true,
      playSound: true
    });

    // Určení úspěchu/neúspěchu (zjednodušeně)
    const success = result >= 10;

    // Vytvoření objektu s výsledkem hodu
    const rollResult = {
      dice: fullDiceString,
      result,
      type: `útok (${actionDescription})`,
      success,
      critical: result === 20,
      criticalFail: result === 1
    };

    // Volání callbacku
    onRoll(rollResult);

    // Pokud byl vybrán typ útoku, volat callback pro výběr akce
    if (attackType && onActionSelect) {
      onActionSelect(`${actionDescription.toLowerCase()}`);
    }
  };

  // Funkce pro provedení hodu na dovednost
  const handleSkillRoll = (skillType) => {
    let attributeValue, bonus, attributeName;

    // Určení atributu podle typu dovednosti
    switch(skillType) {
      case 'strength':
        attributeValue = character.strength;
        attributeName = 'síla';
        break;
      case 'dexterity':
        attributeValue = character.dexterity;
        attributeName = 'obratnost';
        break;
      case 'constitution':
        attributeValue = character.constitution;
        attributeName = 'odolnost';
        break;
      case 'intelligence':
        attributeValue = character.intelligence;
        attributeName = 'inteligence';
        break;
      case 'wisdom':
        attributeValue = character.wisdom;
        attributeName = 'moudrost';
        break;
      case 'charisma':
        attributeValue = character.charisma;
        attributeName = 'charisma';
        break;
      default:
        attributeValue = 10;
        attributeName = 'dovednost';
    }

    bonus = getAttributeBonus(attributeValue);
    let diceString = '1d20';
    let modifierString = bonus >= 0 ? `+${bonus}` : bonus;
    let fullDiceString = `${diceString}${modifierString}`;

    // Provedení hodu
    const result = rollDice(fullDiceString, {
      type: `dovednost (${attributeName})`,
      addToHistory: true,
      playSound: true
    });

    // Určení úspěchu/neúspěchu (zjednodušeně)
    const success = result >= 10;

    // Vytvoření objektu s výsledkem hodu
    const rollResult = {
      dice: fullDiceString,
      result,
      type: `dovednost (${attributeName})`,
      success,
      critical: result === 20,
      criticalFail: result === 1
    };

    // Volání callbacku
    onRoll(rollResult);

    // Pokud byl vybrán typ dovednosti, volat callback pro výběr akce
    if (skillType && onActionSelect) {
      onActionSelect(`test ${attributeName}`);
    }
  };

  return (
    <div className="quick-dice-actions">
      <div className="action-section">
        <h4>Útoky</h4>
        <div className="action-buttons">
          <button onClick={() => handleAttackRoll('normal')}>
            Útok
          </button>
          <button onClick={() => handleAttackRoll('quick')}>
            Rychlý útok
          </button>
          <button onClick={() => handleAttackRoll('power')}>
            Silný útok
          </button>
          <button onClick={() => handleAttackRoll('defensive')}>
            Obranný útok
          </button>
        </div>
      </div>

      <div className="action-section">
        <h4>Testy atributů</h4>
        <div className="action-buttons">
          <button onClick={() => handleSkillRoll('strength')}>
            Síla ({character.strength})
          </button>
          <button onClick={() => handleSkillRoll('dexterity')}>
            Obratnost ({character.dexterity})
          </button>
          <button onClick={() => handleSkillRoll('constitution')}>
            Odolnost ({character.constitution})
          </button>
          <button onClick={() => handleSkillRoll('intelligence')}>
            Inteligence ({character.intelligence})
          </button>
          <button onClick={() => handleSkillRoll('wisdom')}>
            Moudrost ({character.wisdom})
          </button>
          <button onClick={() => handleSkillRoll('charisma')}>
            Charisma ({character.charisma})
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuickDiceActions;
