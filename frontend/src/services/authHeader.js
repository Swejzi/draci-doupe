// Funkce pro generování hlavičky Authorization s Bearer tokenem

export default function authHeader() {
  const token = localStorage.getItem('userToken');

  if (token) {
    // Pro backend API, které očekává Bearer token
    return { Authorization: 'Bearer ' + token };
  } else {
    return {}; // Vrátit prázdný objekt, pokud token není k dispozici
  }
}
