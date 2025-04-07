import React, { useState } from 'react';
import './ShareDiceResult.css';

/**
 * Komponenta pro sdílení výsledků hodů v chatu
 * @param {Object} props - Vlastnosti komponenty
 * @param {Object} props.roll - Informace o hodu
 * @param {function} props.onShare - Callback po sdílení hodu
 * @param {function} props.onClose - Callback po zavření
 */
function ShareDiceResult({ roll, onShare, onClose }) {
  const [message, setMessage] = useState('');
  
  if (!roll) return null;
  
  // Formátování výsledku hodu
  const formatRollResult = () => {
    let result = `Hod kostkou: ${roll.dice} = ${roll.result}`;
    
    if (roll.type) {
      result += ` (${roll.type})`;
    }
    
    if (roll.success !== undefined) {
      result += roll.success ? ' - Úspěch!' : ' - Neúspěch';
    }
    
    if (roll.critical) {
      result += ' - KRITICKÝ ÚSPĚCH!';
    } else if (roll.criticalFail) {
      result += ' - KRITICKÝ NEÚSPĚCH!';
    }
    
    return result;
  };
  
  // Sdílení výsledku hodu
  const handleShare = () => {
    const shareText = message.trim() 
      ? `${message}\n${formatRollResult()}`
      : formatRollResult();
    
    if (onShare) {
      onShare(shareText);
    }
    
    if (onClose) {
      onClose();
    }
  };
  
  return (
    <div className="share-dice-result">
      <div className="share-header">
        <h4>Sdílet výsledek hodu</h4>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="roll-preview">
        <div className="roll-info">
          <div className="roll-formula">{roll.dice}</div>
          <div className="roll-result">{roll.result}</div>
          {roll.type && <div className="roll-type">{roll.type}</div>}
        </div>
        
        <div className="roll-status">
          {roll.critical && <div className="critical-success-badge">Kritický úspěch!</div>}
          {roll.criticalFail && <div className="critical-fail-badge">Kritický neúspěch!</div>}
          {roll.success !== undefined && !roll.critical && !roll.criticalFail && (
            <div className={roll.success ? 'success-badge' : 'fail-badge'}>
              {roll.success ? 'Úspěch' : 'Neúspěch'}
            </div>
          )}
        </div>
      </div>
      
      <div className="share-message">
        <textarea
          placeholder="Přidat zprávu (volitelné)..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
      </div>
      
      <div className="share-actions">
        <button className="cancel-button" onClick={onClose}>Zrušit</button>
        <button className="share-button" onClick={handleShare}>Sdílet v chatu</button>
      </div>
    </div>
  );
}

export default ShareDiceResult;
