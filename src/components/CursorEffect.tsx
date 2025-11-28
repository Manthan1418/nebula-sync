import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocity: { x: number; y: number };
}

export const CursorEffect = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let particleId = 0;
    let lastTime = Date.now();

    const handleMouseMove = (e: MouseEvent) => {
      const currentTime = Date.now();
      setMousePos({ x: e.clientX, y: e.clientY });

      // Generate particles at intervals
      if (currentTime - lastTime > 50) {
        const newParticle: Particle = {
          id: particleId++,
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 6 + 2,
          opacity: 1,
          velocity: {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2 - 1
          }
        };
        
        setParticles(prev => [...prev.slice(-20), newParticle]);
        lastTime = currentTime;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animate particles
    const animationInterval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.velocity.x,
            y: p.y + p.velocity.y,
            opacity: p.opacity - 0.02,
            velocity: {
              x: p.velocity.x * 0.99,
              y: p.velocity.y * 0.99 + 0.1
            }
          }))
          .filter(p => p.opacity > 0)
      );
    }, 16);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(animationInterval);
    };
  }, []);

  return (
    <>
      {/* Cursor glow */}
      <div
        className="fixed pointer-events-none z-50 mix-blend-screen"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          width: '200px',
          height: '200px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, hsl(280 100% 65% / 0.15) 0%, transparent 70%)',
          transition: 'left 0.1s, top 0.1s'
        }}
      />
      
      {/* Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="fixed pointer-events-none z-50 rounded-full mix-blend-screen"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            background: `hsl(${280 + Math.random() * 40} 100% 65%)`,
            opacity: particle.opacity,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 ${particle.size * 2}px hsl(280 100% 65% / 0.8)`
          }}
        />
      ))}
    </>
  );
};
