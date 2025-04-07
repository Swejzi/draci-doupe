/**
 * Jednoduchý fyzikální engine pro simulaci hodu kostkou
 */

// Konstanty pro fyzikální simulaci
const GRAVITY = 9.8; // m/s²
const FRICTION = 0.8; // Koeficient tření
const ELASTICITY = 0.6; // Koeficient pružnosti
const SIMULATION_STEPS = 20; // Počet kroků simulace

/**
 * Simuluje hod kostkou a vrací trajektorii a konečnou pozici
 * @param {Object} options - Možnosti simulace
 * @param {number} options.initialVelocity - Počáteční rychlost hodu
 * @param {number} options.initialAngle - Počáteční úhel hodu (ve stupních)
 * @param {number} options.initialSpin - Počáteční rotace (ve stupních za sekundu)
 * @param {string} options.diceType - Typ kostky (d4, d6, d8, d10, d12, d20, d100)
 * @returns {Object} - Výsledek simulace (trajektorie, konečná pozice, rotace)
 */
export function simulateDiceRoll(options = {}) {
  const {
    initialVelocity = 5 + Math.random() * 5,
    initialAngle = 30 + Math.random() * 60,
    initialSpin = 360 + Math.random() * 720,
    diceType = 'd6'
  } = options;
  
  // Převod úhlu na radiány
  const angleRad = initialAngle * Math.PI / 180;
  
  // Počáteční rychlost v osách x a y
  const vx = initialVelocity * Math.cos(angleRad);
  const vy = initialVelocity * Math.sin(angleRad);
  
  // Počáteční pozice
  let x = 0;
  let y = 0;
  
  // Počáteční rotace
  let rotation = {
    x: Math.random() * 360,
    y: Math.random() * 360,
    z: Math.random() * 360
  };
  
  // Rotační rychlost
  const spinX = initialSpin * (Math.random() - 0.5);
  const spinY = initialSpin * (Math.random() - 0.5);
  const spinZ = initialSpin * (Math.random() - 0.5);
  
  // Časový krok simulace
  const dt = 1 / SIMULATION_STEPS;
  
  // Trajektorie pohybu
  const trajectory = [];
  
  // Simulace pohybu
  let currentVx = vx;
  let currentVy = vy;
  let bounceCount = 0;
  
  for (let step = 0; step < SIMULATION_STEPS; step++) {
    // Aktualizace rychlosti (gravitace)
    currentVy -= GRAVITY * dt;
    
    // Aktualizace pozice
    x += currentVx * dt;
    y += currentVy * dt;
    
    // Aktualizace rotace
    rotation.x += spinX * dt;
    rotation.y += spinY * dt;
    rotation.z += spinZ * dt;
    
    // Normalizace rotace (0-360 stupňů)
    rotation.x = rotation.x % 360;
    rotation.y = rotation.y % 360;
    rotation.z = rotation.z % 360;
    
    // Kontrola kolize se zemí
    if (y < 0) {
      y = 0; // Nastavení pozice na zem
      currentVy = -currentVy * ELASTICITY; // Odraz
      
      // Aplikace tření při odrazu
      currentVx *= FRICTION;
      
      // Zpomalení rotace při odrazu
      const frictionFactor = 0.9;
      rotation.x *= frictionFactor;
      rotation.y *= frictionFactor;
      rotation.z *= frictionFactor;
      
      bounceCount++;
    }
    
    // Přidání aktuální pozice a rotace do trajektorie
    trajectory.push({
      x,
      y,
      rotation: { ...rotation },
      velocity: { x: currentVx, y: currentVy }
    });
    
    // Zastavení simulace, pokud je kostka téměř v klidu
    if (bounceCount > 2 && Math.abs(currentVx) < 0.1 && Math.abs(currentVy) < 0.1) {
      break;
    }
  }
  
  // Určení konečného výsledku hodu
  const finalRotation = trajectory[trajectory.length - 1].rotation;
  
  // Výpočet výsledku hodu na základě konečné rotace
  // Toto je zjednodušení - ve skutečnosti by výsledek závisel na tom, která strana kostky je nahoře
  const sides = parseInt(diceType.replace('d', ''), 10);
  
  // Výpočet výsledku na základě konečné rotace
  // Používáme součet rotací jako seed pro pseudonáhodné číslo
  const rotationSum = (finalRotation.x + finalRotation.y + finalRotation.z) % 360;
  const result = Math.floor(rotationSum / 360 * sides) + 1;
  
  return {
    trajectory,
    finalPosition: {
      x: trajectory[trajectory.length - 1].x,
      y: trajectory[trajectory.length - 1].y
    },
    finalRotation,
    result
  };
}

/**
 * Generuje animační keyframes na základě trajektorie
 * @param {Array} trajectory - Trajektorie pohybu kostky
 * @returns {Object} - CSS keyframes pro animaci
 */
export function generateAnimationKeyframes(trajectory) {
  const keyframes = {};
  
  trajectory.forEach((point, index) => {
    const percent = Math.round((index / (trajectory.length - 1)) * 100);
    
    keyframes[`${percent}%`] = {
      transform: `
        translateX(${point.x * 10}px)
        translateY(${-point.y * 10}px)
        rotateX(${point.rotation.x}deg)
        rotateY(${point.rotation.y}deg)
        rotateZ(${point.rotation.z}deg)
      `
    };
  });
  
  return keyframes;
}

/**
 * Generuje CSS animaci na základě trajektorie
 * @param {Array} trajectory - Trajektorie pohybu kostky
 * @returns {string} - CSS animace
 */
export function generateCSSAnimation(trajectory) {
  const keyframes = generateAnimationKeyframes(trajectory);
  let cssAnimation = '@keyframes dice-physics-animation {\n';
  
  Object.entries(keyframes).forEach(([key, value]) => {
    cssAnimation += `  ${key} { transform: ${value.transform.trim()}; }\n`;
  });
  
  cssAnimation += '}';
  
  return cssAnimation;
}

/**
 * Určí, která strana kostky je nahoře na základě rotace
 * @param {Object} rotation - Rotace kostky (x, y, z ve stupních)
 * @param {string} diceType - Typ kostky
 * @returns {number} - Číslo na horní straně kostky
 */
export function getTopFace(rotation, diceType) {
  // Zjednodušená implementace - ve skutečnosti by to bylo složitější
  // a záviselo by na přesné geometrii kostky
  
  const sides = parseInt(diceType.replace('d', ''), 10);
  
  // Normalizace rotace do rozsahu 0-360
  const normalizedRotation = {
    x: ((rotation.x % 360) + 360) % 360,
    y: ((rotation.y % 360) + 360) % 360,
    z: ((rotation.z % 360) + 360) % 360
  };
  
  // Pro kostku d6 (krychle)
  if (diceType === 'd6') {
    // Rozdělení prostoru rotací na 6 regionů
    const xRegion = Math.floor(normalizedRotation.x / 90);
    const yRegion = Math.floor(normalizedRotation.y / 90);
    
    // Mapování regionů na čísla kostky
    // Toto je zjednodušení - skutečná implementace by byla složitější
    const regionMap = [
      [1, 2, 3, 4],
      [5, 6, 5, 6],
      [3, 4, 1, 2],
      [6, 5, 6, 5]
    ];
    
    return regionMap[xRegion][yRegion];
  }
  
  // Pro ostatní typy kostek použijeme zjednodušený přístup
  // Skutečná implementace by vyžadovala složitější geometrické výpočty
  const rotationSum = (normalizedRotation.x + normalizedRotation.y + normalizedRotation.z);
  return (Math.floor(rotationSum / 30) % sides) + 1;
}
