import React, { useState, useEffect, useRef } from 'react';
import { rollDice, getAttributeBonus } from '../utils/gameMechanics';
import { simulateDiceRoll } from '../utils/dicePhysics';
import AnimatedDiceRoll from './AnimatedDiceRoll';
import DiceDesignSelector from './DiceDesignSelector';
import DiceAnimationSettings from './DiceAnimationSettings';
import DiceParticleEffects from './DiceParticleEffects';
import './PlayerDiceRoller.css';

/**
 * Komponenta pro hody kostkou iniciované hráčem
 * @param {Object} props - Vlastnosti komponenty
 * @param {function} props.onRoll - Callback po hodu kostkou
 * @param {Object} props.character - Postava hráče
 */
function PlayerDiceRoller({ onRoll = () => {}, character = null }) {
  const [diceType, setDiceType] = useState('d20');
  const [numDice, setNumDice] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [autoModifier, setAutoModifier] = useState(0); // Automatický modifikátor
  const [showResult, setShowResult] = useState(false);
  const [rollResult, setRollResult] = useState(null);
  const [diceString, setDiceString] = useState('1d20');
  const [rollType, setRollType] = useState('generic'); // Typ hodu (síla, obratnost, atd.)

  // Nové stavy pro rozšířené funkce
  const [diceDesign, setDiceDesign] = useState('classic'); // Design kostek
  const [showSettings, setShowSettings] = useState(false); // Zobrazení nastavení
  const [showDesignSelector, setShowDesignSelector] = useState(false); // Zobrazení výběru designu
  const [animationSettings, setAnimationSettings] = useState({ // Nastavení animací
    animationSpeed: 1.0,
    animationStyle: 'bounce',
    showTrajectory: false,
    usePhysics: true,
    soundVolume: 1.0,
    vibrationEnabled: true,
    particleEffects: true
  });
  const [particleEffectsActive, setParticleEffectsActive] = useState(false); // Aktivace částicových efektů
  const [particleEffectType, setParticleEffectType] = useState('normal'); // Typ částicových efektů

  // Reference na kontejner pro částicové efekty
  const containerRef = useRef(null);

  // Automatické nastavení modifikátoru podle typu hodu a atributů postavy
  useEffect(() => {
    if (!character) {
      setAutoModifier(0);
      return;
    }

    let calculatedModifier = 0;

    // Výpočet modifikátoru podle typu hodu
    switch (rollType) {
      case 'strength':
        calculatedModifier = getAttributeBonus(character.strength);
        break;
      case 'dexterity':
        calculatedModifier = getAttributeBonus(character.dexterity);
        break;
      case 'constitution':
        calculatedModifier = getAttributeBonus(character.constitution);
        break;
      case 'intelligence':
        calculatedModifier = getAttributeBonus(character.intelligence);
        break;
      case 'wisdom':
        calculatedModifier = getAttributeBonus(character.wisdom);
        break;
      case 'charisma':
        calculatedModifier = getAttributeBonus(character.charisma);
        break;
      case 'attack':
        // Pro útok používáme sílu nebo obratnost podle typu zbraně
        // Pro jednoduchost použijeme sílu
        calculatedModifier = getAttributeBonus(character.strength);
        // Přidat bonus z úrovně
        calculatedModifier += Math.floor(character.level / 2);
        break;
      case 'damage':
        // Pro poškození používáme sílu
        calculatedModifier = getAttributeBonus(character.strength);
        break;
      case 'initiative':
        // Pro iniciativu používáme obratnost
        calculatedModifier = getAttributeBonus(character.dexterity);
        break;
      default:
        calculatedModifier = 0;
    }

    setAutoModifier(calculatedModifier);
  }, [character, rollType]);

  const handleRoll = () => {
    // Kombinace ručního a automatického modifikátoru
    const totalModifier = modifier + autoModifier;

    // Sestavení řetězce kostky
    const diceString = `${numDice}${diceType}${totalModifier > 0 ? '+' + totalModifier : totalModifier < 0 ? totalModifier : ''}`;
    setDiceString(diceString);

    // Nastavení hlasitosti zvuku podle nastavení
    const soundOptions = {
      volume: animationSettings.soundVolume
    };

    // Použití fyzikální simulace, pokud je povolena
    let result;
    if (animationSettings.usePhysics) {
      // Simulace hodu kostkou s fyzikálním enginem
      const simulationResults = [];

      // Simulace pro každou kostku
      for (let i = 0; i < numDice; i++) {
        const simulation = simulateDiceRoll({
          diceType,
          initialVelocity: 5 + Math.random() * 5,
          initialAngle: 30 + Math.random() * 60,
          initialSpin: 360 + Math.random() * 720
        });

        simulationResults.push(simulation);
      }

      // Výpočet celkového výsledku
      const diceSum = simulationResults.reduce((sum, sim) => sum + sim.result, 0);
      result = diceSum + totalModifier;
    } else {
      // Standardní hod kostkou bez fyzikální simulace
      result = rollDice(diceString, {
        addToHistory: true,
        type: rollType,
        playSound: true,
        soundOptions
      });
    }

    setRollResult(result);
    setShowResult(true);

    // Určení, zda jde o kritický úspěch nebo neúspěch
    const isCriticalSuccess = diceType === 'd20' && (result - totalModifier) === 20;
    const isCriticalFailure = diceType === 'd20' && (result - totalModifier) === 1;

    // Aktivace částicových efektů, pokud jsou povoleny
    if (animationSettings.particleEffects) {
      if (isCriticalSuccess) {
        setParticleEffectType('critical');
        setParticleEffectsActive(true);

        // Vibrace na mobilních zařízeních
        if (animationSettings.vibrationEnabled && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      } else if (isCriticalFailure) {
        setParticleEffectType('fail');
        setParticleEffectsActive(true);

        // Vibrace na mobilních zařízeních
        if (animationSettings.vibrationEnabled && navigator.vibrate) {
          navigator.vibrate(200);
        }
      } else {
        // Běžný hod
        setParticleEffectType('normal');
        setParticleEffectsActive(true);
      }

      // Deaktivace částicových efektů po 2 sekundách
      setTimeout(() => {
        setParticleEffectsActive(false);
      }, 2000);
    }

    // Volání callbacku
    onRoll({
      dice: diceString,
      result,
      type: rollType,
      critical: isCriticalSuccess,
      criticalFail: isCriticalFailure,
      diceDesign,
      animationSettings
    });
  };

  const handleAnimationComplete = () => {
    // Zde můžeme přidat další akce po dokončení animace
  };

  return (
    <div className="player-dice-roller" ref={containerRef}>
      <div className="dice-controls">
        <div className="control-group">
          <label>Počet kostek:</label>
          <input
            type="number"
            min="1"
            max="10"
            value={numDice}
            onChange={(e) => setNumDice(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
          />
        </div>

        <div className="control-group">
          <label>Typ kostky:</label>
          <select value={diceType} onChange={(e) => setDiceType(e.target.value)}>
            <option value="d4">k4</option>
            <option value="d6">k6</option>
            <option value="d8">k8</option>
            <option value="d10">k10</option>
            <option value="d12">k12</option>
            <option value="d20">k20</option>
            <option value="d100">k100</option>
          </select>
        </div>

        <div className="control-group">
          <label>Typ hodu:</label>
          <select value={rollType} onChange={(e) => setRollType(e.target.value)}>
            <option value="generic">Obecný</option>
            <option value="strength">Síla</option>
            <option value="dexterity">Obratnost</option>
            <option value="constitution">Odolnost</option>
            <option value="intelligence">Inteligence</option>
            <option value="wisdom">Moudrost</option>
            <option value="charisma">Charisma</option>
            <option value="attack">Útok</option>
            <option value="damage">Poškození</option>
            <option value="initiative">Iniciativa</option>
          </select>
        </div>

        <div className="control-group">
          <label>Modifikátor:</label>
          <div className="modifier-container">
            <input
              type="number"
              value={modifier}
              onChange={(e) => setModifier(parseInt(e.target.value, 10) || 0)}
            />
            {autoModifier !== 0 && (
              <div className="auto-modifier">
                Auto: {autoModifier > 0 ? '+' : ''}{autoModifier}
              </div>
            )}
          </div>
        </div>

        <div className="dice-actions">
          <button className="roll-button" onClick={handleRoll}>
            Hodit kostkou
          </button>

          <div className="dice-options">
            <button
              className={`option-button ${showSettings ? 'active' : ''}`}
              onClick={() => {
                setShowSettings(!showSettings);
                setShowDesignSelector(false);
              }}
              title="Nastavení animací"
            >
              <i className="settings-icon">⚙️</i>
            </button>

            <button
              className={`option-button ${showDesignSelector ? 'active' : ''}`}
              onClick={() => {
                setShowDesignSelector(!showDesignSelector);
                setShowSettings(false);
              }}
              title="Design kostek"
            >
              <i className="design-icon">🎨</i>
            </button>
          </div>
        </div>
      </div>

      {/* Nastavení animací */}
      {showSettings && (
        <DiceAnimationSettings
          settings={animationSettings}
          onSettingsChange={setAnimationSettings}
        />
      )}

      {/* Výběr designu kostek */}
      {showDesignSelector && (
        <DiceDesignSelector
          currentDesign={diceDesign}
          onDesignChange={setDiceDesign}
        />
      )}

      {/* Výsledek hodu */}
      {showResult && rollResult !== null && (
        <div className="dice-result-container">
          <AnimatedDiceRoll
            diceString={diceString}
            finalResult={rollResult}
            onAnimationComplete={handleAnimationComplete}
            playSound={true}
          />
          <button
            className="close-result-button"
            onClick={() => setShowResult(false)}
          >
            Zavřít
          </button>
        </div>
      )}

      {/* Částicové efekty */}
      <DiceParticleEffects
        active={particleEffectsActive}
        effectType={particleEffectType}
        diceType={diceType}
        position={{ x: 0, y: 0 }}
      />
    </div>
  );
}

export default PlayerDiceRoller;
