import React, { useState, useEffect, useRef } from 'react';
import './DiceVisual.css';

/**
 * Komponenta pro vizuální reprezentaci kostky s vylepšenou 3D animací
 * @param {Object} props - Vlastnosti komponenty
 * @param {string} props.diceType - Typ kostky (d4, d6, d8, d10, d12, d20, d100)
 * @param {number} props.result - Výsledek hodu
 * @param {boolean} props.animated - Zda má být kostka animovaná
 * @param {function} props.onAnimationComplete - Callback po dokončení animace
 */
function DiceVisual({ diceType, result, animated = false, onAnimationComplete = () => {} }) {
  // Reference na element kostky pro animace
  const diceRef = useRef(null);

  // Stav pro sledování fáze animace
  const [animationPhase, setAnimationPhase] = useState('initial');

  // Stav pro náhodné rotace
  const [rotations, setRotations] = useState({ x: 0, y: 0, z: 0 });

  // Extrahování čísla z typu kostky (např. "d20" -> 20)
  const sides = parseInt(diceType.replace('d', ''), 10);

  // Určení barvy kostky podle typu
  let diceColor = '#ffffff';
  switch(diceType) {
    case 'd4': diceColor = '#f8d568'; break;
    case 'd6': diceColor = '#f86868'; break;
    case 'd8': diceColor = '#68a0f8'; break;
    case 'd10': diceColor = '#68f868'; break;
    case 'd12': diceColor = '#c868f8'; break;
    case 'd20': diceColor = '#f868c8'; break;
    case 'd100': diceColor = '#68f8f8'; break;
    default: diceColor = '#ffffff';
  }

  // Určení tvaru kostky podle typu
  let diceShape = 'cube';
  switch(diceType) {
    case 'd4': diceShape = 'tetrahedron'; break;
    case 'd6': diceShape = 'cube'; break;
    case 'd8': diceShape = 'octahedron'; break;
    case 'd10': diceShape = 'decahedron'; break;
    case 'd12': diceShape = 'dodecahedron'; break;
    case 'd20': diceShape = 'icosahedron'; break;
    case 'd100': diceShape = 'sphere'; break;
    default: diceShape = 'cube';
  }

  // Efekt pro animaci hodu kostkou
  useEffect(() => {
    if (!animated) {
      setAnimationPhase('initial');
      return;
    }

    // Generování náhodných rotací pro realističtější animaci
    const generateRandomRotations = () => {
      return {
        x: Math.floor(Math.random() * 360),
        y: Math.floor(Math.random() * 360),
        z: Math.floor(Math.random() * 360)
      };
    };

    // Fáze 1: Počáteční rychlé točení
    setAnimationPhase('rolling');
    setRotations(generateRandomRotations());

    // Fáze 2: Zpomalování
    const slowdownTimer = setTimeout(() => {
      setAnimationPhase('slowing');
      setRotations(generateRandomRotations());
    }, 400);

    // Fáze 3: Dokončení animace
    const finalTimer = setTimeout(() => {
      setAnimationPhase('final');

      // Nastavení finální rotace tak, aby byla vidět správná strana kostky
      // Pro jednoduchost použijeme pevné rotace
      setRotations({ x: 0, y: 0, z: 0 });

      // Volání callbacku po dokončení animace
      onAnimationComplete();
    }, 1000);

    // Vyčištění timerů při unmount
    return () => {
      clearTimeout(slowdownTimer);
      clearTimeout(finalTimer);
    };
  }, [animated, onAnimationComplete]);

  // Generování CSS transform stylu podle fáze animace
  const getTransformStyle = () => {
    if (animationPhase === 'initial') {
      return 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
    }

    if (animationPhase === 'rolling') {
      return `rotateX(${rotations.x}deg) rotateY(${rotations.y}deg) rotateZ(${rotations.z}deg)`;
    }

    if (animationPhase === 'slowing') {
      return `rotateX(${rotations.x}deg) rotateY(${rotations.y}deg) rotateZ(${rotations.z}deg)`;
    }

    if (animationPhase === 'final') {
      return 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
    }

    return '';
  };

  // Generování CSS transition stylu podle fáze animace
  const getTransitionStyle = () => {
    if (animationPhase === 'initial') {
      return 'none';
    }

    if (animationPhase === 'rolling') {
      return 'transform 0.4s cubic-bezier(0.5, 0, 0.75, 0)';
    }

    if (animationPhase === 'slowing') {
      return 'transform 0.6s cubic-bezier(0, 0.5, 0.5, 1)';
    }

    if (animationPhase === 'final') {
      return 'transform 0.2s ease-out';
    }

    return '';
  };

  // Generování CSS animation stylu pro odskakování
  const getAnimationStyle = () => {
    if (!animated) return '';

    if (animationPhase === 'rolling') {
      return 'dice-bounce 0.4s ease-out';
    }

    if (animationPhase === 'slowing') {
      return 'dice-small-bounce 0.6s ease-in-out';
    }

    return '';
  };

  return (
    <div
      ref={diceRef}
      className={`dice-visual ${diceShape}`}
      style={{
        backgroundColor: diceColor,
        transform: getTransformStyle(),
        transition: getTransitionStyle(),
        animation: getAnimationStyle()
      }}
    >
      <div className="dice-3d-container">
        <div className="dice-face dice-face-front">{result}</div>
        <div className="dice-face dice-face-back">{sides - result + 1}</div>
        <div className="dice-face dice-face-right">{Math.ceil(sides / 3)}</div>
        <div className="dice-face dice-face-left">{Math.ceil(sides / 2)}</div>
        <div className="dice-face dice-face-top">{Math.ceil(sides / 4)}</div>
        <div className="dice-face dice-face-bottom">{Math.ceil(sides / 5)}</div>
      </div>
      <div className="dice-label">{diceType}</div>
    </div>
  );
}

export default DiceVisual;
