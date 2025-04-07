import React from 'react';
import DiceVisual from './DiceVisual';
import './DiceRollHistory.css';

/**
 * Komponenta pro zobrazení historie hodů kostkou
 * @param {Object} props - Vlastnosti komponenty
 * @param {Array} props.history - Historie hodů kostkou
 * @param {function} props.onClear - Callback pro vymazání historie
 * @param {function} props.onShare - Callback pro sdílení výsledku hodu
 */
function DiceRollHistory({ history = [], onClear = () => {}, onShare = () => {} }) {
  if (!history || history.length === 0) {
    return (
      <div className="dice-roll-history empty">
        <h3>Historie hodů kostkou</h3>
        <p className="empty-message">Zatím nebyly provedeny žádné hody kostkou.</p>
      </div>
    );
  }

  // Funkce pro extrakci typu kostky z řetězce
  const extractDiceType = (diceString) => {
    const match = diceString.match(/d(\d+)/i);
    return match ? `d${match[1]}` : 'd6';
  };

  // Funkce pro formátování času
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="dice-roll-history">
      <div className="history-header">
        <h3>Historie hodů kostkou</h3>
        <button className="clear-history-button" onClick={onClear}>
          Vymazat historii
        </button>
      </div>

      <div className="history-list">
        {history.slice().reverse().map((roll, index) => (
          <div key={index} className="history-item">
            <div className="history-item-visual">
              <DiceVisual
                diceType={extractDiceType(roll.dice)}
                result={roll.result}
              />
            </div>

            <div className="history-item-details">
              <div className="history-item-formula">
                {roll.dice}
                {roll.type && <span className="roll-type"> ({roll.type})</span>}
              </div>

              <div className="history-item-result">
                Výsledek: <strong>{roll.result}</strong>
                {roll.success !== undefined && (
                  <span className={roll.success ? 'success-text' : 'failure-text'}>
                    {roll.success ? ' Úspěch' : ' Neúspěch'}
                  </span>
                )}
              </div>

              <div className="history-item-actions">
                {roll.timestamp && (
                  <span className="history-item-time">
                    {formatTime(roll.timestamp)}
                  </span>
                )}

                <button
                  className="share-roll-button"
                  onClick={() => onShare(roll)}
                  title="Sdílet výsledek hodu v chatu"
                >
                  Sdílet
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DiceRollHistory;
