import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import ShareDiceResult from './components/ShareDiceResult';
import './index.css';

function TestApp() {
  const [shareRoll, setShareRoll] = useState(null);
  
  // Testovací data pro hod kostkou
  const testRoll = {
    dice: '2d6+3',
    result: 12,
    type: 'Útok',
    success: true,
    critical: false,
    criticalFail: false
  };
  
  // Funkce pro zobrazení dialogu
  const handleShowDialog = () => {
    setShareRoll(testRoll);
  };
  
  // Funkce pro sdílení výsledku
  const handleShareRoll = (shareText) => {
    console.log('Sdílený text:', shareText);
    setShareRoll(null);
    alert('Výsledek byl sdílen: ' + shareText);
  };
  
  // Funkce pro zavření dialogu
  const handleCloseDialog = () => {
    setShareRoll(null);
  };
  
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Test ShareDiceResult komponenty</h1>
      <button 
        onClick={handleShowDialog}
        style={{ padding: '0.8rem 1.2rem', backgroundColor: '#282c34', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Zobrazit dialog sdílení
      </button>
      
      {/* Dialog pro sdílení výsledku hodu */}
      {shareRoll && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 1000 
        }}>
          <ShareDiceResult
            roll={shareRoll}
            onShare={handleShareRoll}
            onClose={handleCloseDialog}
          />
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);
