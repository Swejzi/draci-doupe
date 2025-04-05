import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Pro získání zprávy po registraci

  // Získání zprávy z přesměrování (pokud existuje)
  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!usernameOrEmail || !password) {
      setError('Všechna pole jsou povinná.');
      setLoading(false);
      return;
    }

    try {
      await login(usernameOrEmail, password);
      // Po úspěšném přihlášení přesměrovat na nástěnku
      navigate('/dashboard'); 
    } catch (err) {
      console.error('Chyba přihlášení:', err);
      setError(err.message || 'Nepodařilo se přihlásit. Zkontrolujte údaje.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Přihlášení</h2>
      {successMessage && <p style={styles.success}>{successMessage}</p>}
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="usernameOrEmail">Uživatelské jméno nebo Email:</label>
          <input
            type="text"
            id="usernameOrEmail"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="password">Heslo:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Přihlašuji...' : 'Přihlásit'}
        </button>
      </form>
      <p style={styles.linkText}>
        Nemáte účet? <Link to="/register">Zaregistrujte se</Link>
      </p>
    </div>
  );
}

// Styly (podobné jako RegisterPage)
const styles = {
  container: {
    maxWidth: '400px',
    margin: '2rem auto',
    padding: '2rem',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '0.8rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  button: {
    padding: '0.8rem 1.2rem',
    backgroundColor: '#282c34',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  success: {
    color: 'green',
    marginBottom: '1rem',
    textAlign: 'center',
    border: '1px solid green',
    padding: '0.5rem',
    borderRadius: '4px',
    backgroundColor: '#e6ffed',
  },
  error: {
    color: 'red',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  linkText: {
    marginTop: '1rem',
    textAlign: 'center',
  }
};

export default LoginPage;
