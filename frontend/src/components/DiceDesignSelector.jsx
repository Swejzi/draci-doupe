import React from 'react';
import './DiceDesignSelector.css';

/**
 * Komponenta pro výběr designu kostek
 * @param {Object} props - Vlastnosti komponenty
 * @param {string} props.currentDesign - Aktuálně vybraný design
 * @param {function} props.onDesignChange - Callback při změně designu
 */
function DiceDesignSelector({ currentDesign = 'classic', onDesignChange }) {
  // Dostupné designy kostek
  const availableDesigns = [
    { id: 'classic', name: 'Klasický', description: 'Tradiční design kostek' },
    { id: 'metal', name: 'Kovový', description: 'Kovové kostky s lesklým povrchem' },
    { id: 'wooden', name: 'Dřevěný', description: 'Dřevěné kostky s přírodním vzhledem' },
    { id: 'crystal', name: 'Krystalový', description: 'Průhledné krystalové kostky' },
    { id: 'ancient', name: 'Starověký', description: 'Kostky s runovými symboly' },
    { id: 'magical', name: 'Magický', description: 'Kostky se světelnými efekty' }
  ];
  
  return (
    <div className="dice-design-selector">
      <h4>Design kostek</h4>
      <div className="design-options">
        {availableDesigns.map(design => (
          <div 
            key={design.id}
            className={`design-option ${currentDesign === design.id ? 'selected' : ''}`}
            onClick={() => onDesignChange(design.id)}
          >
            <div className={`design-preview ${design.id}`}>
              <div className="preview-dice">
                <span>6</span>
              </div>
            </div>
            <div className="design-info">
              <div className="design-name">{design.name}</div>
              <div className="design-description">{design.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DiceDesignSelector;
