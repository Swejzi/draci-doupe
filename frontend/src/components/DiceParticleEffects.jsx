import React, { useEffect, useRef } from 'react';
import './DiceParticleEffects.css';

/**
 * Komponenta pro částicové efekty při hodu kostkou
 * @param {Object} props - Vlastnosti komponenty
 * @param {boolean} props.active - Zda jsou efekty aktivní
 * @param {string} props.effectType - Typ efektu (normal, critical, fail)
 * @param {string} props.diceType - Typ kostky (d4, d6, d8, d10, d12, d20, d100)
 * @param {Object} props.position - Pozice efektu { x, y }
 */
function DiceParticleEffects({ 
  active = false, 
  effectType = 'normal', 
  diceType = 'd20',
  position = { x: 0, y: 0 }
}) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);
  
  // Konfigurace částic podle typu efektu
  const getParticleConfig = () => {
    switch (effectType) {
      case 'critical':
        return {
          count: 50,
          colors: ['#28a745', '#5cb85c', '#98d998', '#c3e6cb'],
          size: { min: 3, max: 8 },
          speed: { min: 2, max: 5 },
          lifetime: { min: 1000, max: 2000 },
          gravity: 0.05,
          spread: 180,
          shapes: ['circle', 'star']
        };
      case 'fail':
        return {
          count: 30,
          colors: ['#dc3545', '#e25563', '#e57983', '#f8d7da'],
          size: { min: 2, max: 6 },
          speed: { min: 1, max: 3 },
          lifetime: { min: 800, max: 1500 },
          gravity: 0.1,
          spread: 120,
          shapes: ['circle', 'square']
        };
      default:
        return {
          count: 20,
          colors: ['#4a6da7', '#6c8cbb', '#8eaad0', '#b0c8e4'],
          size: { min: 2, max: 5 },
          speed: { min: 1, max: 4 },
          lifetime: { min: 500, max: 1200 },
          gravity: 0.08,
          spread: 90,
          shapes: ['circle']
        };
    }
  };
  
  // Vytvoření částic
  const createParticles = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const config = getParticleConfig();
    
    // Nastavení velikosti plátna
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Výpočet středu plátna
    const centerX = canvas.width / 2 + position.x;
    const centerY = canvas.height / 2 + position.y;
    
    // Vytvoření částic
    particlesRef.current = [];
    
    for (let i = 0; i < config.count; i++) {
      // Náhodný úhel ve stupních
      const angle = Math.random() * config.spread - (config.spread / 2);
      // Převod na radiány
      const angleRad = (angle * Math.PI) / 180;
      
      // Náhodná rychlost
      const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
      
      // Rozložení rychlosti do složek x a y
      const vx = Math.cos(angleRad) * speed;
      const vy = Math.sin(angleRad) * speed;
      
      // Náhodná velikost
      const size = config.size.min + Math.random() * (config.size.max - config.size.min);
      
      // Náhodná barva z palety
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];
      
      // Náhodná životnost
      const lifetime = config.lifetime.min + Math.random() * (config.lifetime.max - config.lifetime.min);
      
      // Náhodný tvar
      const shape = config.shapes[Math.floor(Math.random() * config.shapes.length)];
      
      // Vytvoření částice
      particlesRef.current.push({
        x: centerX,
        y: centerY,
        vx,
        vy,
        size,
        color,
        lifetime,
        age: 0,
        shape
      });
    }
  };
  
  // Aktualizace a vykreslení částic
  const updateParticles = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const config = getParticleConfig();
    
    // Vyčištění plátna
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Aktualizace a vykreslení částic
    for (let i = 0; i < particlesRef.current.length; i++) {
      const p = particlesRef.current[i];
      
      // Aktualizace věku
      p.age += 16; // Přibližně 16ms mezi snímky při 60fps
      
      // Výpočet průhlednosti na základě věku
      const alpha = 1 - (p.age / p.lifetime);
      
      // Pokud částice překročila svou životnost, přeskočit ji
      if (p.age >= p.lifetime) continue;
      
      // Aktualizace rychlosti (gravitace)
      p.vy += config.gravity;
      
      // Aktualizace pozice
      p.x += p.vx;
      p.y += p.vy;
      
      // Nastavení stylu vykreslování
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      
      // Vykreslení částice podle tvaru
      ctx.beginPath();
      
      if (p.shape === 'circle') {
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'square') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'star') {
        drawStar(ctx, p.x, p.y, 5, p.size, p.size / 2);
        ctx.fill();
      }
    }
    
    // Kontrola, zda jsou všechny částice mrtvé
    const allDead = particlesRef.current.every(p => p.age >= p.lifetime);
    
    if (allDead) {
      // Zastavení animace, pokud jsou všechny částice mrtvé
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    } else {
      // Pokračování animace
      animationRef.current = requestAnimationFrame(updateParticles);
    }
  };
  
  // Funkce pro vykreslení hvězdy
  const drawStar = (ctx, cx, cy, spikes, outerRadius, innerRadius) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  };
  
  // Efekt pro spuštění částicových efektů
  useEffect(() => {
    if (active) {
      // Vytvoření částic
      createParticles();
      
      // Spuštění animace
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(updateParticles);
      
      // Přehrání zvuku podle typu efektu
      if (effectType === 'critical') {
        const audio = new Audio('/sounds/critical-success.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Zvuk nemohl být přehrán:', e));
      } else if (effectType === 'fail') {
        const audio = new Audio('/sounds/critical-fail.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Zvuk nemohl být přehrán:', e));
      }
      
      // Vibrace na mobilních zařízeních
      if (navigator.vibrate && (effectType === 'critical' || effectType === 'fail')) {
        navigator.vibrate(effectType === 'critical' ? [100, 50, 100] : [200]);
      }
    }
    
    // Vyčištění při unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [active, effectType, diceType, position]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="dice-particle-effects"
      style={{
        opacity: active ? 1 : 0,
        pointerEvents: 'none'
      }}
    />
  );
}

export default DiceParticleEffects;
