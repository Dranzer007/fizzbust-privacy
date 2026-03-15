import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../../services/soundService';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rippleIdRef = useRef(0);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playVenu = () => {
    try {
      const ctx = getAudioContext();
      [523.25, 587.33, 659.25, 698.46, 783.99, 659.25, 523.25].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const fl = ctx.createBiquadFilter();
        fl.type = 'bandpass';
        fl.frequency.value = f;
        fl.Q.value = 2;
        o.type = 'sine';
        o.frequency.value = f;
        const vib = ctx.createOscillator();
        const vg = ctx.createGain();
        vib.frequency.value = 5.8;
        vg.gain.value = 6;
        vib.connect(vg);
        vg.connect(o.frequency);
        o.connect(fl);
        fl.connect(g);
        g.connect(ctx.destination);
        const t = ctx.currentTime + i * 0.2;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.15, t + 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        o.start(t);
        o.stop(t + 0.65);
        vib.start(t + 0.08);
        vib.stop(t + 0.65);
      });
    } catch (e) {
      // Audio might be blocked by browser policy on auto-start
      console.warn('Audio auto-play blocked:', e);
    }
  };

  const playMridangam = () => {
    try {
      const ctx = getAudioContext();
      [0, 0.16, 0.32, 0.48, 0.56, 0.64, 0.80, 0.96].forEach((time, i) => {
        const t = ctx.currentTime + time;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(i % 4 === 0 ? 105 : 75, t);
        o.frequency.exponentialRampToValueAtTime(28, t + 0.2);
        g.gain.setValueAtTime(0.6, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t);
        o.stop(t + 0.25);
        const sn = ctx.createOscillator();
        const sg = ctx.createGain();
        const sf = ctx.createBiquadFilter();
        sn.type = 'square';
        sn.frequency.value = 180 + Math.random() * 80;
        sf.type = 'highpass';
        sf.frequency.value = 900;
        sn.connect(sf);
        sf.connect(sg);
        sg.connect(ctx.destination);
        sg.gain.setValueAtTime(0.1, t);
        sg.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        sn.start(t);
        sn.stop(t + 0.07);
      });
    } catch (e) {}
  };

  const playMorsing = () => {
    try {
      const ctx = getAudioContext();
      [110, 165, 220, 165, 110, 220, 165, 110].forEach((f, i) => {
        const t = ctx.currentTime + i * 0.12;
        const o = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const g = ctx.createGain();
        const fl = ctx.createBiquadFilter();
        fl.type = 'bandpass';
        fl.frequency.value = f * 2.8;
        fl.Q.value = 9;
        o.type = 'sawtooth';
        o.frequency.value = f;
        o2.type = 'square';
        o2.frequency.value = f * 1.012;
        o.connect(fl);
        o2.connect(fl);
        fl.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.start(t);
        o.stop(t + 0.25);
        o2.start(t);
        o2.stop(t + 0.25);
      });
    } catch (e) {}
  };

  useEffect(() => {
    // Start automatically on mount
    setIsPlaying(true);
    
    // Attempt to play audio (might be blocked until first interaction elsewhere)
    playVenu();
    playMridangam();
    playMorsing();

    const duration = 3200; // Slightly longer for a smoother feel
    const interval = 20;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min((currentStep / steps) * 100, 100);
      setProgress(newProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
        onComplete();
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const handleInteraction = (e: React.MouseEvent) => {
    // Still allow ripples on click
    const newRipple = { id: rippleIdRef.current++, x: e.clientX, y: e.clientY };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 750);
    
    // Also try to unlock audio context if not already active
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
      soundManager.unlockAudio();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[200] select-none touch-none overflow-hidden cursor-pointer"
      onClick={handleInteraction}
    >
      <style>{`
        @keyframes glowZoom {
          0%, 100% {
            transform: scale(1);
            text-shadow:
              0 0 20px rgba(255,255,255,0.6),
              0 0 50px rgba(255,255,255,0.3),
              0 0 90px rgba(255,255,255,0.1);
          }
          50% {
            transform: scale(1.13);
            text-shadow:
              0 0 30px #fff,
              0 0 80px rgba(255,255,255,0.9),
              0 0 160px rgba(255,255,255,0.5),
              0 0 260px rgba(255,255,255,0.2);
          }
        }

        @keyframes studioSync {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%       { opacity: 0.7;  transform: scale(1.04); }
        }

        @keyframes rippleOut {
          from { width: 0; height: 0; opacity: 0.8; }
          to   { width: 220px; height: 220px; opacity: 0; }
        }

        .animate-glowZoom { animation: glowZoom 2.6s ease-in-out infinite; }
        .animate-studioSync { animation: studioSync 2.6s ease-in-out infinite; }
        .animate-rippleOut { animation: rippleOut 0.7s ease forwards; }
      `}</style>

      <div className="flex flex-col items-center">
        <div className="font-sans font-black text-[clamp(100px,24vw,220px)] text-white tracking-[-2px] leading-none text-center animate-glowZoom">
          OHIL
        </div>
        <div className="font-sans font-bold text-[clamp(11px,2.2vw,20px)] tracking-[16px] text-white/35 uppercase mt-[10px] animate-studioSync">
          Studio
        </div>

        {/* Loading Bar Container */}
        <div className="mt-16 w-64 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-white shadow-[0_0_10px_#fff]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'tween', ease: 'linear' }}
          />
        </div>
        <div className="mt-4 font-mono text-[8px] text-white/20 uppercase tracking-[0.4em]">
          {isPlaying ? `Initializing... ${Math.round(progress)}%` : 'System Ready'}
        </div>
      </div>

      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-12 text-white/20 font-sans font-black uppercase tracking-[0.5em] text-[10px] animate-pulse"
          >
            Tap anywhere to start
          </motion.div>
        )}
      </AnimatePresence>

      {ripples.map(r => (
        <div 
          key={r.id}
          className="fixed rounded-full border-2 border-white/40 translate-x-[-50%] translate-y-[-50%] pointer-events-none z-[99] animate-rippleOut"
          style={{ left: r.x, top: r.y }}
        />
      ))}
    </div>
  );
};
