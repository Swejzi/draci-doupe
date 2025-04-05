import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !email || !password) {
      setError('Všechna pole jsou povinná.');
      setLoading(false);
      return;
    }

    // TODO: Přidat validaci emailu a síly hesla na klientovi

    try {
      await register(username, email, password);
      // Po úspěšné registraci přesměrovat na přihlášení
      // Nebo můžeme rovnou přihlásit v AuthContext a přesměrovat na dashboard
      navigate('/login', { state: { message: 'Registrace úspěšná! Nyní se můžete přihlásit.' } }); 
    } catch (err) {
      console.error('Chyba registrace:', err);
      setError(err.message || 'Nepodařilo se zaregistrovat. Zkuste to prosím znovu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Registrace</h2>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="username">Uživatelské jméno:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          {loading ? 'Registruji...' : 'Zaregistrovat'}
        </button>
      </form>
      <p style={styles.linkText}>
        Máte již účet? <Link to="/login">Přihlaste se</Link>
      </p>
    </div>
  );
}

// Styly pro komponentu
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

export default RegisterPage;
