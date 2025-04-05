import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // Zobrazit načítací indikátor, dokud se neověří stav přihlášení
    return <div>Načítání...</div>; 
  }

  // Pokud je uživatel přihlášen, zobrazit vnořenou routu (Outlet)
  // Jinak přesměrovat na přihlašovací stránku
  return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
