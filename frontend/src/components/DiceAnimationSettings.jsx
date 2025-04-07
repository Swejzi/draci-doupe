import React, { useState } from 'react';
import './DiceAnimationSettings.css';

/**
 * Komponenta pro nastavení animací hodu kostkou
 * @param {Object} props - Vlastnosti komponenty
 * @param {Object} props.settings - Aktuální nastavení
 * @param {function} props.onSettingsChange - Callback při změně nastavení
 */
function DiceAnimationSettings({ settings, onSettingsChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Výchozí nastavení
  const defaultSettings = {
    animationSpeed: 1.0,
    animationStyle: 'bounce',
    showTrajectory: false,
    usePhysics: true,
    soundVolume: 1.0,
    vibrationEnabled: true,
    particleEffects: true
  };
  
  // Aktuální nastavení (s výchozími hodnotami pro chybějící položky)
  const currentSettings = { ...defaultSettings, ...settings };
  
  // Zpracování změny nastavení
  const handleSettingChange = (key, value) => {
    const newSettings = { ...currentSettings, [key]: value };
    onSettingsChange(newSettings);
  };
  
  // Zpracování změny posuvníku
  const handleSliderChange = (key, event) => {
    handleSettingChange(key, parseFloat(event.target.value));
  };
  
  // Zpracování změny přepínače
  const handleToggleChange = (key) => {
    handleSettingChange(key, !currentSettings[key]);
  };
  
  // Zpracování změny výběru
  const handleSelectChange = (key, event) => {
    handleSettingChange(key, event.target.value);
  };
  
  // Resetování nastavení na výchozí hodnoty
  const handleReset = () => {
    onSettingsChange(defaultSettings);
  };
  
  return (
    <div className="dice-animation-settings">
      <div className="settings-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h4>Nastavení animací</h4>
        <button className={`expand-button ${isExpanded ? 'expanded' : ''}`}>
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="settings-content">
          <div className="settings-group">
            <label>Rychlost animace</label>
            <div className="slider-container">
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={currentSettings.animationSpeed}
                onChange={(e) => handleSliderChange('animationSpeed', e)}
              />
              <span className="slider-value">{currentSettings.animationSpeed}x</span>
            </div>
          </div>
          
          <div className="settings-group">
            <label>Styl animace</label>
            <select
              value={currentSettings.animationStyle}
              onChange={(e) => handleSelectChange('animationStyle', e)}
            >
              <option value="bounce">Odskakování</option>
              <option value="spin">Rotace</option>
              <option value="flip">Překlápění</option>
              <option value="realistic">Realistický</option>
              <option value="dramatic">Dramatický</option>
            </select>
          </div>
          
          <div className="settings-group">
            <label>Hlasitost zvuku</label>
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={currentSettings.soundVolume}
                onChange={(e) => handleSliderChange('soundVolume', e)}
              />
              <span className="slider-value">{Math.round(currentSettings.soundVolume * 100)}%</span>
            </div>
          </div>
          
          <div className="settings-group toggles">
            <div className="toggle-option">
              <label>
                <input
                  type="checkbox"
                  checked={currentSettings.usePhysics}
                  onChange={() => handleToggleChange('usePhysics')}
                />
                Fyzikální simulace
              </label>
            </div>
            
            <div className="toggle-option">
              <label>
                <input
                  type="checkbox"
                  checked={currentSettings.showTrajectory}
                  onChange={() => handleToggleChange('showTrajectory')}
                />
                Zobrazit trajektorii
              </label>
            </div>
            
            <div className="toggle-option">
              <label>
                <input
                  type="checkbox"
                  checked={currentSettings.vibrationEnabled}
                  onChange={() => handleToggleChange('vibrationEnabled')}
                />
                Vibrace (mobilní zařízení)
              </label>
            </div>
            
            <div className="toggle-option">
              <label>
                <input
                  type="checkbox"
                  checked={currentSettings.particleEffects}
                  onChange={() => handleToggleChange('particleEffects')}
                />
                Částicové efekty
              </label>
            </div>
          </div>
          
          <div className="settings-actions">
            <button className="reset-button" onClick={handleReset}>
              Obnovit výchozí
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiceAnimationSettings;
