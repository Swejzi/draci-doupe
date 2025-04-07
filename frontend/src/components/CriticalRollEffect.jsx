import React, { useState, useEffect } from 'react';
import './CriticalRollEffect.css';

/**
 * Komponenta pro vizualizaci kritických úspěchů a neúspěchů
 * @param {Object} props - Vlastnosti komponenty
 * @param {boolean} props.isCritical - Zda jde o kritický úspěch
 * @param {boolean} props.isCriticalFail - Zda jde o kritický neúspěch
 * @param {number} props.duration - Doba trvání efektu v ms
 */
function CriticalRollEffect({ isCritical, isCriticalFail, duration = 1000 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isCritical || isCriticalFail) {
      // Zobrazit efekt
      setVisible(true);

      // Skrýt efekt po uplynutí doby
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isCritical, isCriticalFail, duration]);

  if (!visible) return null;

  return (
    <div className={`critical-effect-overlay ${isCritical ? 'critical-success' : 'critical-fail'}`}>
      <div className="critical-effect-content">
        {isCritical && (
          <>
            <div className="critical-text">KRITICKÝ ÚSPĚCH!</div>
            <div className="critical-stars">
              {Array(10).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="star"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`
                  }}
                />
              ))}
            </div>
          </>
        )}

        {isCriticalFail && (
          <>
            <div className="critical-text">KRITICKÝ NEÚSPĚCH!</div>
            <div className="critical-fail-effect">
              {Array(5).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="crack"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    width: `${50 + Math.random() * 100}px`
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CriticalRollEffect;
