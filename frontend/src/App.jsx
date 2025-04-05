import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import stránek
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage'; 
import GamePage from './pages/GamePage'; // Odkomentováno
// import NotFoundPage from './pages/NotFoundPage';

// Komponenta pro obsah aplikace, která používá AuthContext
function AppContent() {
  const { currentUser, logout, loading } = useAuth();

  if (loading) {
    return <div>Načítání aplikace...</div>; // Zobrazit během ověřování tokenu
  }

  return (
    <Router>
      <div>
        <header style={headerStyle}>
          <h1>AI Dračí doupě</h1>
          <nav>
            <Link to="/" style={linkStyle}>Domů</Link>
            {currentUser ? (
              <>
                {' | '}
                <Link to="/dashboard" style={linkStyle}>Nástěnka</Link>
                {' | '}
                {/* Zobrazit jméno uživatele */}
                <span style={{ color: 'white', marginRight: '1rem' }}>
                  Přihlášen: {currentUser.username}
                </span>
                <button onClick={logout} style={buttonStyle}>Odhlásit</button>
              </>
            ) : (
              <>
                {' | '}
                <Link to="/login" style={linkStyle}>Přihlášení</Link>
                {' | '}
                <Link to="/register" style={linkStyle}>Registrace</Link>
              </>
            )}
          </nav>
        </header>

        <main style={mainStyle}>
          <Routes>
            {/* Veřejné routy */}
            <Route path="/" element={<div>Vítejte v AI Dračím doupěti!</div>} />
            
            {/* Routy pro nepřihlášené uživatele */}
            <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />}/>
            <Route path="/register" element={currentUser ? <Navigate to="/dashboard" replace /> : <RegisterPage />}/>

            {/* Chráněné routy */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />}/>
              <Route path="/game/:sessionId" element={<GamePage />}/> {/* Přidána routa pro GamePage */}
              {/* Další chráněné routy */}
            </Route>

            {/* Fallback pro nenalezené stránky */}
            {/* TODO: Vytvořit NotFoundPage */}
            <Route path="*" element={<div>404 - Stránka nenalezena</div>}/> 
          </Routes>
        </main>

        <footer style={footerStyle}>
          <p>&copy; {new Date().getFullYear()} AI Dračí doupě</p>
        </footer>
      </div>
    </Router>
  );
}

// Hlavní App komponenta obalující vše AuthProviderem
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// Jednoduché inline styly pro základní layout
const headerStyle = {
  backgroundColor: '#282c34',
  padding: '1rem',
  color: 'white',
  textAlign: 'center',
};

const buttonStyle = {
  marginLeft: '1rem',
  padding: '0.3rem 0.8rem',
  cursor: 'pointer',
  backgroundColor: '#61dafb',
  border: 'none',
  borderRadius: '4px',
  color: '#282c34',
  fontWeight: 'bold',
};

const linkStyle = {
  color: '#61dafb',
  textDecoration: 'none',
  margin: '0 0.5rem',
};

const mainStyle = {
  padding: '1rem',
  maxWidth: '1200px',
  margin: '1rem auto',
  backgroundColor: '#fff',
  minHeight: '70vh',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
};

const footerStyle = {
  marginTop: '2rem',
  padding: '1rem',
  textAlign: 'center',
  color: '#888',
};


export default App;
