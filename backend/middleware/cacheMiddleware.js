/**
 * Middleware pro nastavení cache hlaviček
 * 
 * Tento middleware umožňuje nastavit různé cache strategie pro různé endpointy.
 * Podporuje nastavení Cache-Control, ETag a dalších hlaviček pro řízení cache.
 */

/**
 * Vytvoří middleware pro nastavení cache hlaviček
 * @param {Object} options - Konfigurace cache hlaviček
 * @param {string} options.cacheControl - Hodnota Cache-Control hlavičky
 * @param {boolean} options.etag - Zda povolit ETag
 * @param {number} options.maxAge - Max-Age v sekundách
 * @returns {Function} - Express middleware
 */
const setCacheHeaders = (options = {}) => {
  return (req, res, next) => {
    // Výchozí hodnoty
    const defaultOptions = {
      cacheControl: 'no-store, no-cache, must-revalidate',
      etag: false,
      maxAge: 0
    };
    
    const config = { ...defaultOptions, ...options };
    
    if (config.maxAge > 0) {
      res.set('Cache-Control', `public, max-age=${config.maxAge}`);
    } else {
      res.set('Cache-Control', config.cacheControl);
    }
    
    // Nastavení dalších cache hlaviček
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    if (!config.etag) {
      // Vypnout automatické generování ETag
      res.set('ETag', false);
    }
    
    next();
  };
};

// Předpřipravené konfigurace pro různé typy dat
const staticCache = setCacheHeaders({ 
  maxAge: 3600, // 1 hodina
  etag: true 
});

const shortCache = setCacheHeaders({ 
  maxAge: 60, // 1 minuta
  etag: true 
});

const noCache = setCacheHeaders();

module.exports = {
  setCacheHeaders,
  staticCache,
  shortCache,
  noCache
};
