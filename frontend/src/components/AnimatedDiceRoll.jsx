import React, { useState, useEffect, useRef } from 'react';
import DiceVisual from './DiceVisual';
import './AnimatedDiceRoll.css';

/**
 * Komponenta pro animovaný hod kostkou
 * @param {Object} props - Vlastnosti komponenty
 * @param {string} props.diceString - Řetězec popisující hod kostkou (např. "1d6", "2d8+2")
 * @param {number} props.finalResult - Konečný výsledek hodu
 * @param {function} props.onAnimationComplete - Callback po dokončení animace
 * @param {boolean} props.playSound - Zda přehrát zvuk při hodu
 */
function AnimatedDiceRoll({
  diceString,
  finalResult,
  onAnimationComplete = () => {},
  playSound = true
}) {
  const [currentResult, setCurrentResult] = useState(null);
  const [animating, setAnimating] = useState(true);
  const [diceInfo, setDiceInfo] = useState({ numDice: 1, diceType: 'd6', modifier: 0 });
  const [animationComplete, setAnimationComplete] = useState(false);

  // Reference na kontejner kostek pro efekty
  const diceContainerRef = useRef(null);

  // Parsování řetězce kostky
  useEffect(() => {
    const match = diceString.match(/(\d+)?d(\d+)(?:([+-])(\d+))?/i);
    if (match) {
      const numDice = match[1] ? parseInt(match[1], 10) : 1;
      const diceValue = parseInt(match[2], 10);
      const modifierSign = match[3];
      const modifierValue = match[4] ? parseInt(match[4], 10) : 0;

      const modifier = modifierSign === '-' ? -modifierValue : modifierValue;

      setDiceInfo({
        numDice,
        diceType: `d${diceValue}`,
        modifier
      });
    }
  }, [diceString]);

  // Animace hodu kostkou
  useEffect(() => {
    if (!animating || !diceInfo.diceType) return;

    // Přehrání zvuku
    if (playSound) {
      const audio = new Audio('/sounds/dice-roll.mp3');
      audio.play().catch(e => console.log('Zvuk nemohl být přehrán:', e));
    }

    // Přidání efektu třesení pro kontejner kostek
    if (diceContainerRef.current) {
      diceContainerRef.current.classList.add('shaking');

      // Odstranění efektu třesení po 400ms
      setTimeout(() => {
        if (diceContainerRef.current) {
          diceContainerRef.current.classList.remove('shaking');
        }
      }, 400);
    }

    // Generování náhodných mezivýsledků pro animaci
    const maxValue = parseInt(diceInfo.diceType.replace('d', ''), 10);
    const randomResults = Array(diceInfo.numDice).fill(0).map(() =>
      Math.floor(Math.random() * maxValue) + 1
    );

    setCurrentResult({
      individualResults: randomResults,
      total: randomResults.reduce((sum, val) => sum + val, 0) + diceInfo.modifier
    });

    // Nastavení finálního výsledku po určité době
    const finalTimer = setTimeout(() => {
      // Výpočet individuálních výsledků z celkového výsledku
      // Toto je zjednodušení, protože nemáme skutečné individuální výsledky
      const avgDiceValue = Math.floor((finalResult - diceInfo.modifier) / diceInfo.numDice);
      const remainder = (finalResult - diceInfo.modifier) % diceInfo.numDice;

      const calculatedResults = Array(diceInfo.numDice).fill(avgDiceValue);
      for (let i = 0; i < remainder; i++) {
        calculatedResults[i]++;
      }

      setCurrentResult({
        individualResults: calculatedResults,
        total: finalResult
      });

      // Označení, že animace je dokončena
      setAnimating(false);
      setAnimationComplete(true);

      // Volání callbacku po dokončení animace
      setTimeout(() => onAnimationComplete(), 500);
    }, 1000);

    return () => clearTimeout(finalTimer);
  }, [animating, diceInfo, finalResult, onAnimationComplete, playSound]);

  if (!currentResult) return null;

  // Určení, zda jde o kritický úspěch nebo neúspěch (pouze pro k20)
  const isCriticalSuccess = diceInfo.diceType === 'd20' &&
    currentResult.individualResults.some(result => result === 20);

  const isCriticalFailure = diceInfo.diceType === 'd20' &&
    currentResult.individualResults.some(result => result === 1);

  return (
    <div className="animated-dice-roll">
      <div
        ref={diceContainerRef}
        className={`dice-container ${isCriticalSuccess ? 'critical-success' : ''} ${isCriticalFailure ? 'critical-failure' : ''}`}
      >
        {currentResult.individualResults.map((result, index) => (
          <DiceVisual
            key={index}
            diceType={diceInfo.diceType}
            result={result}
            animated={animating}
            onAnimationComplete={() => {}}
          />
        ))}
      </div>

      <div className="dice-result-display">
        <span className="dice-formula">{diceString} = </span>
        <span className={`dice-total ${isCriticalSuccess ? 'critical-success-text' : ''} ${isCriticalFailure ? 'critical-failure-text' : ''}`}>
          {currentResult.total}
        </span>

        {diceInfo.modifier !== 0 && (
          <span className="dice-calculation">
            ({currentResult.individualResults.join(' + ')}
            {diceInfo.modifier > 0 ? ` + ${diceInfo.modifier}` : ` - ${Math.abs(diceInfo.modifier)}`})
          </span>
        )}

        {animationComplete && isCriticalSuccess && (
          <div className="critical-message success">Kritický úspěch!</div>
        )}

        {animationComplete && isCriticalFailure && (
          <div className="critical-message failure">Kritický neúspěch!</div>
        )}
      </div>
    </div>
  );
}

export default AnimatedDiceRoll;
