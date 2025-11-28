import { useEffect, useState } from 'react';

interface Orb {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
}

export const ParallaxBackground = () => {
  const [orbs] = useState<Orb[]>(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 150 + 50,
      color: ['280 100% 65%', '190 100% 50%', '320 100% 60%'][Math.floor(Math.random() * 3)],
      speed: Math.random() * 0.5 + 0.1
    }))
  );

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
      
      {/* Floating orbs */}
      {orbs.map((orb, index) => (
        <div
          key={orb.id}
          className="absolute rounded-full blur-3xl opacity-20 animate-float"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            background: `radial-gradient(circle, hsl(${orb.color}) 0%, transparent 70%)`,
            transform: `translateY(${scrollY * orb.speed * (index % 2 === 0 ? -1 : 1)}px)`,
            animationDelay: `${index * 0.2}s`,
            animationDuration: `${3 + index * 0.5}s`
          }}
        />
      ))}
      
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(hsl(280 100% 65% / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(280 100% 65% / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `translateY(${scrollY * 0.3}px)`
        }}
      />
    </div>
  );
};
