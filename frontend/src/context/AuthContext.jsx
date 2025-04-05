import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

// Vytvoření kontextu
const AuthContext = createContext();

// Hook pro snadné použití kontextu
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider komponenta
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Informace o přihlášeném uživateli
  const [token, setToken] = useState(null); // JWT token
  const [loading, setLoading] = useState(true); // Stav načítání (pro ověření tokenu při startu)

  // Efekt pro kontrolu přihlášení při prvním načtení aplikace
  useEffect(() => {
    const checkLoggedIn = async () => {
      setLoading(true);
      const storedData = authService.getCurrentUser(); // Zkusit načíst z localStorage
      if (storedData?.token) {
        // Ověřit token na backendu
        const backendStatus = await authService.getStatus(storedData.token);
        if (backendStatus?.user) {
          // Token je platný, nastavit stav
          setCurrentUser(backendStatus.user);
          setToken(storedData.token);
          console.log('Uživatel ověřen při startu:', backendStatus.user.username);
        } else {
          // Token není platný (nebo chyba), odhlásit
          authService.logout();
        }
      }
      setLoading(false);
    };
    checkLoggedIn();
  }, []);

  // Funkce pro přihlášení
  const login = async (usernameOrEmail, password) => {
    try {
      console.log('[AuthContext] Vyvolávám authService.login');
      const data = await authService.login(usernameOrEmail, password);
      console.log('[AuthContext] Přihlášení úspěšné, data:', data);
      setCurrentUser(data.user);
      setToken(data.token);
      return data; // Vrátit data pro případné další zpracování v komponentě
    } catch (error) {
      console.error('[AuthContext] Chyba přihlášení v AuthContext:', error);
      throw error; // Předat chybu dál pro zobrazení v UI
    }
  };

  // Funkce pro registraci (nepřihlašuje automaticky, ale můžeme změnit)
  const register = async (username, email, password) => {
    try {
      const data = await authService.register(username, email, password);
      // Můžeme zde uživatele rovnou přihlásit, pokud chceme
      // await login(username, password);
      return data;
    } catch (error) {
      console.error('Chyba registrace v AuthContext:', error);
      throw error;
    }
  };

  // Funkce pro odhlášení
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setToken(null);
    console.log('Uživatel odhlášen.');
    // TODO: Přesměrovat na domovskou stránku nebo login? (pomocí useNavigate)
  };

  // Hodnoty poskytované kontextem
  const value = {
    currentUser,
    token,
    loading, // Přidáme loading stav
    login,
    register,
    logout,
  };

  // Poskytnutí hodnoty kontextu všem potomkům
  // Nezobrazujeme children, dokud se neověří stav přihlášení
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
