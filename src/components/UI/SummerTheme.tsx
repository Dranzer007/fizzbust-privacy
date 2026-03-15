import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const SummerDecor: React.FC<{ 
  hideShelf?: boolean, 
  onPop?: boolean,
  isFrosty?: boolean,
  isThunder?: boolean,
  isSwapping?: boolean,
  isBusted?: boolean,
  combo?: number
}> = ({ 
  hideShelf = false, 
  onPop = false, 
  isFrosty = false, 
  isThunder = false, 
  isSwapping = false, 
  isBusted = false,
  combo = 0
}) => {
  // Increase bubble count based on combo
  const bubbleCount = Math.min(25 + Math.floor(combo * 1.5), 100);
  
  const bubbles = React.useMemo(() => [...Array(bubbleCount)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * (15 + Math.min(combo * 0.5, 20)) + 5,
    duration: Math.max(Math.random() * 3 + 2 - (combo * 0.05), 0.5),
    delay: Math.random() * 5,
  })), [bubbleCount, combo]);

  const shinePatches = React.useMemo(() => [...Array(20)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    width: Math.random() * 60 + 20,
    height: Math.random() * 30 + 10,
    rotation: Math.random() * 360,
  })), []);

  const topDrips = React.useMemo(() => {
    const count = 10;
    const drips = [];
    let currentX = 0;
    for (let i = 0; i < count; i++) {
      const width = 10 + Math.random() * 10;
      const height = 80 + Math.random() * 40;
      drips.push({ x: currentX, width, height });
      currentX += width + (Math.random() * 5);
    }
    return drips;
  }, []);

  const bottomDrips = React.useMemo(() => {
    const count = 12;
    const drips = [];
    let currentX = 0;
    for (let i = 0; i < count; i++) {
      const width = 8 + Math.random() * 8;
      const height = 40 + Math.random() * 20;
      drips.push({ x: currentX, width, height });
      currentX += width + (Math.random() * 4);
    }
    return drips;
  }, []);

  // Color intensity based on combo
  const comboIntensity = Math.min(combo / 50, 1);
  const bgColorTop = isBusted ? '#4A4A4A' : isFrosty ? '#B2EBF2' : `rgb(${245 + (comboIntensity * 10)}, ${166 - (comboIntensity * 60)}, ${35 - (comboIntensity * 35)})`; 
  const bgColorBottom = isBusted ? '#1A1A1A' : isFrosty ? '#E0F7FA' : `rgb(${198 + (comboIntensity * 57)}, ${224 - (comboIntensity * 100)}, ${58 - (comboIntensity * 58)})`;

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 transition-all duration-700 ${isFrosty ? 'saturate-[0.5] brightness-125' : ''} ${isBusted ? 'saturate-[0.8] hue-rotate-[-15deg]' : ''}`}>
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 transition-colors duration-1000" 
        style={{ background: `linear-gradient(to bottom, ${bgColorTop}, ${bgColorBottom})` }}
      />
      
      {/* Shine Patches */}
      {shinePatches.map(p => (
        <div 
          key={`shine-${p.id}`}
          className="absolute bg-white/15 rounded-[50%]"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.width}px`,
            height: `${p.height}px`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}

      {/* Bubble Particles */}
      {bubbles.map(b => (
        <motion.div 
          key={`bubble-${b.id}`}
          className="absolute bg-white/30 rounded-full"
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: b.duration,
            repeat: Infinity,
            delay: b.delay,
          }}
          style={{
            left: b.left,
            top: b.top,
            width: `${b.size}px`,
            height: `${b.size}px`,
          }}
        />
      ))}

      {/* Top Drips */}
      <div className="absolute top-0 left-0 w-full h-[clamp(40px,8vw,120px)] landscape:h-[30px] z-10">
        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 200 120">
          <path 
            fill="#E8891A"
            d={`M0,0 L200,0 L200,20 ${topDrips.map(d => 
              `L${d.x + d.width},20 Q${d.x + d.width/2},${d.height * 0.6} ${d.x},20`
            ).join(' ')} L0,20 Z`}
          />
        </svg>
      </div>

      {/* Bottom Drips & Floor */}
      <div className="absolute bottom-0 left-0 w-full z-10">
        {/* Upward Drips */}
        <div className="absolute bottom-[40px] landscape:bottom-[20px] left-0 w-full h-[40px] landscape:h-[20px]">
          <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 200 60">
            <path 
              fill="#4FC3F7"
              d={`M0,60 L200,60 L200,40 ${bottomDrips.map(d => 
                `L${d.x + d.width},40 Q${d.x + d.width/2},${60 - (d.height * 0.6)} ${d.x},40`
              ).join(' ')} L0,40 Z`}
            />
          </svg>
        </div>
        {/* Floor Bar */}
        <div className="w-full h-[40px] landscape:h-[20px] bg-[#3E1C00]" />
      </div>

      {/* Special Overlays (Frost/Thunder) */}
      <AnimatePresence>
        {isThunder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-20 bg-white/30"
          />
        )}
        {isFrosty && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 pointer-events-none"
            style={{ 
              background: 'radial-gradient(circle at center, transparent 30%, rgba(178, 235, 242, 0.4) 100%)',
              backdropFilter: 'blur(2px)'
            }}
          >
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/frozen-wall.png")' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const RealisticSoda: React.FC<{ 
  className?: string, 
  color?: string, 
  label?: string, 
  liquidHeight?: string,
  cracked?: boolean,
  steaming?: boolean,
  style?: React.CSSProperties,
  type?: string
}> = ({ 
  className = "", 
  color = "#FF4E00", 
  label = "FIZZ",
  liquidHeight = "85%",
  cracked = false,
  steaming = false,
  style = {},
  type = 'LEMON'
}) => {
  const bottleImageMap: Record<string, string> = {
    LEMON: '/assets/final-4/bottle_lemon.png',
    ORANGE: '/assets/final-4/bottle_orange.png',
    CHERRY: '/assets/final-4/bottle_cherry.png',
    GRAPE: '/assets/final-4/bottle_grape.png',
    LIME: '/assets/final-4/bottle_lime.png',
    BLUE_RASPBERRY: '/assets/final-4/bottle_blue_raspberry.png',
    STRAWBERRY: '/assets/final-4/bottle_strawberry.png',
    COLA: '/assets/final-4/bottle_cola.png',
    GOLDEN: '/assets/final-4/bottle_golden.png',
    TROPICAL: '/assets/final-4/bottle_tropical.png',
    FROSTY: '/assets/final-4/bottle_frosty.png',
    THUNDER: '/assets/final-4/bottle_thunder.png',
  };
  const bottleImage = bottleImageMap[type] || bottleImageMap.LEMON;
  
  return (
    <div className={`relative ${className} group flex flex-col items-center`} style={{ ...style }}>
      {/* Steam Particles */}
      {steaming && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-16 h-20 pointer-events-none z-20">
          {[...Array(8)].map((_, i) => (
            <div 
              key={`steam-particle-${i}`}
              className="absolute bg-white/40 rounded-full animate-rise-fizz"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`,
                animationDuration: `${Math.random() * 1 + 0.5}s`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Bottle Image */}
      <div className="relative flex flex-col items-center h-full w-full">
        <img 
          src={bottleImage} 
          alt="Soda Bottle" 
          className="h-full w-auto object-contain drop-shadow-2xl"
          referrerPolicy="no-referrer"
        />
        
        {/* Cracks Overlay */}
        {cracked && (
          <div className="absolute inset-0 pointer-events-none z-20 opacity-40">
            <svg viewBox="0 0 100 200" className="w-full h-full stroke-white/40 fill-none stroke-[0.5]">
              <path d="M20 40 L40 60 L30 80 M70 120 L50 140 L60 160" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
