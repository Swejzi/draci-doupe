import axios from 'axios';
import { API_URL } from '../config';

// Základní URL pro autentizaci
const AUTH_URL = `${API_URL}/auth`;

// Funkce pro registraci
const register = async (username, email, password) => {
  try {
    const response = await axios.post(`${AUTH_URL}/register`, {
      username,
      email,
      password,
    });
    // Backend vrací data uživatele při úspěšné registraci (bez hesla)
    return response.data;
  } catch (error) {
    // Zpracování chyb z backendu (např. uživatel již existuje)
    console.error('Chyba při registraci:', error.response?.data || error.message);
    throw error.response?.data || new Error('Chyba serveru při registraci.');
  }
};

// Funkce pro přihlášení
const login = async (usernameOrEmail, password) => {
  try {
    console.log(`[Frontend] Pokus o přihlášení uživatele: ${usernameOrEmail}`);
    console.log(`[Frontend] URL pro přihlášení: ${AUTH_URL}/login`);

    const response = await axios.post(`${AUTH_URL}/login`, {
      usernameOrEmail,
      password,
    });

    console.log('[Frontend] Odpověď serveru:', response.status, response.statusText);
    console.log('[Frontend] Data odpovědi:', response.data);

    // Backend vrací token a data uživatele
    if (response.data.token) {
      console.log('[Frontend] Token získán, ukládám do localStorage');
      // Uložíme token do localStorage pro perzistenci mezi sessiony
      localStorage.setItem('userToken', response.data.token);
      // Můžeme uložit i data uživatele, pokud je potřebujeme často
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    console.error('[Frontend] Chyba při přihlášení:', error);
    console.error('[Frontend] Detail chyby:', error.response?.data || error.message);
    console.error('[Frontend] Status chyby:', error.response?.status);
    throw error.response?.data || new Error('Chyba serveru při přihlášení.');
  }
};

// Funkce pro odhlášení
const logout = () => {
  // Odstraníme token a info o uživateli z localStorage
  localStorage.removeItem('userToken');
  localStorage.removeItem('userInfo');
  // Backend endpoint /logout můžeme zavolat, pokud implementuje např. blacklist tokenů,
  // ale pro jednoduché JWT odhlášení stačí akce na klientovi.
  // axios.post(`${API_URL}/logout`); // Volitelné
};

// Funkce pro získání aktuálně přihlášeného uživatele (z localStorage)
const getCurrentUser = () => {
  const token = localStorage.getItem('userToken');
  const userInfo = localStorage.getItem('userInfo');
  if (token && userInfo) {
    try {
      return { token, user: JSON.parse(userInfo) };
    } catch (e) {
      console.error('Chyba parsování userInfo z localStorage', e);
      logout(); // Pokud jsou data nekonzistentní, odhlásíme
      return null;
    }
  }
  return null;
};

// Funkce pro získání stavu přihlášení z backendu (ověření tokenu)
const getStatus = async (token) => {
  if (!token) return null;
  try {
    const response = await axios.get(`${AUTH_URL}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data; // Vrací { message, user }
  } catch (error) {
    console.error('Chyba při ověřování stavu přihlášení:', error.response?.data || error.message);
    // Pokud token vypršel nebo je neplatný, server vrátí 401/403
    if (error.response?.status === 401 || error.response?.status === 403) {
      logout(); // Odhlásit uživatele na klientovi
    }
    return null; // Nebo throw error? Záleží na použití.
  }
};

// Funkce pro získání autentizační hlavičky pro API požadavky
export const getAuthHeader = () => {
  const token = localStorage.getItem('userToken');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
  getStatus,
  getAuthHeader
};
