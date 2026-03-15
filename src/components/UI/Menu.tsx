import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Difficulty, GameState, GameMode } from '../../types';

import { soundManager } from '../../services/soundService';
import { statsService } from '../../services/statsService';
import { RealisticSoda } from './SummerTheme';

import { Draggable } from './Draggable';

interface MenuProps {
  onPlay: (mode: GameMode) => void;
  onStateChange: (state: GameState) => void;
}

export const Menu: React.FC<MenuProps> = ({ onPlay, onStateChange }) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      const s = await statsService.getStats();
      setStats(s);
    };
    loadStats();
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col landscape:flex-row items-stretch justify-between overflow-y-auto bg-white select-none">
      {/* LEFT PANEL */}
      <div 
        className="relative z-40 flex flex-col items-center landscape:items-start py-4 sm:py-8 landscape:py-6 text-center landscape:text-left justify-between min-h-[45vh] sm:min-h-[50vh] landscape:h-full w-full landscape:w-[42%]"
        style={{ 
          paddingLeft: 'max(16px, 5vw)',
          paddingRight: 'max(16px, 5vw)'
        }}
      >
        <div className="flex flex-col items-center landscape:items-start mt-2 sm:mt-8 w-full">
          {/* Logo */}
          <Draggable id="menu-logo" className="pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative group"
              style={{ 
                width: 'clamp(120px, 28vw, 480px)',
                marginBottom: 'clamp(4px, 1.5vh, 20px)'
              }}
            >
              <img 
                src="/assets/logo_fizz_bust.png" 
                alt="FIZZ BUST" 
                className="w-full h-auto mix-blend-multiply contrast-[1.5] brightness-[1.1]"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </Draggable>
          
          {/* Tagline */}
          <Draggable id="menu-tagline" className="pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <p 
                className="font-mono text-[#666] uppercase tracking-widest leading-[1.5]"
                style={{ 
                  fontSize: 'clamp(7px, 1vw, 14px)',
                  maxWidth: '80vw'
                }}
              >
                THE ULTIMATE SODA POPPING CHALLENGE.
              </p>
            </motion.div>
          </Draggable>
        </div>

        {/* Play Button */}
        <Draggable id="menu-play-btn" className="pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group mb-4 sm:mb-8 landscape:mb-4"
          >
            <button
              onClick={() => {
                soundManager.unlockAudio();
                soundManager.play('tap');
                onPlay(GameMode.ENDLESS);
              }}
              className="bg-[#3DD6B5] shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              style={{ 
                width: 'clamp(100px, 24vw, 320px)',
                height: 'clamp(28px, 6vh, 60px)',
                borderRadius: 'clamp(14px, 3vw, 30px)'
              }}
            >
              <span 
                className="font-bold uppercase tracking-widest text-black"
                style={{ fontSize: 'clamp(9px, 1.5vw, 20px)' }}
              >
                Tap to Play
              </span>
            </button>
          </motion.div>
        </Draggable>
      </div>

      {/* RIGHT PANEL */}
      <div 
        className="relative z-40 flex flex-col justify-center min-h-[45vh] sm:min-h-[50vh] landscape:h-full w-full landscape:w-[52%] pb-4 landscape:pb-0"
        style={{ 
          paddingLeft: 'max(16px, 5vw)',
          paddingRight: 'max(16px, 5vw)',
          gap: 'clamp(3px, 0.8vh, 10px)'
        }}
      >
        <div className="flex flex-col w-full" style={{ gap: 'clamp(3px, 0.8vh, 10px)' }}>
          {/* Card 1 - RANKINGS */}
          <Draggable id="menu-rankings" className="pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="relative group"
            >
              <button
                onClick={() => {
                  soundManager.play('tap');
                  onStateChange(GameState.LEADERBOARD);
                }}
                className="w-full bg-[#E8500A] flex items-center justify-between hover:brightness-110 transition-all shadow-md"
                style={{ 
                  height: 'clamp(32px, 5.5vw, 72px)',
                  borderRadius: 'clamp(6px, 1.2vw, 16px)',
                  padding: '0 clamp(8px, 1.5vw, 20px)'
                }}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <span style={{ fontSize: 'clamp(12px, 2vw, 28px)' }}>🏆</span>
                  <span 
                    className="font-bold text-black uppercase tracking-wider"
                    style={{ fontSize: 'clamp(9px, 1.4vw, 18px)' }}
                  >
                    Rankings
                  </span>
                </div>
                <span className="text-black/60 group-hover:text-black transition-colors text-xs">→</span>
              </button>
            </motion.div>
          </Draggable>

          {/* Card 2 - ARCHIVE */}
          <Draggable id="menu-archive" className="pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: 0.5 }}
              className="relative group"
            >
              <button
                onClick={() => {
                  soundManager.play('tap');
                  onStateChange(GameState.STATS);
                }}
                className="w-full bg-white flex items-center justify-between hover:bg-gray-50 transition-all shadow-sm border border-gray-100"
                style={{ 
                  height: 'clamp(32px, 5.5vw, 72px)',
                  borderRadius: 'clamp(6px, 1.2vw, 16px)',
                  padding: '0 clamp(8px, 1.5vw, 20px)'
                }}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <span style={{ fontSize: 'clamp(12px, 2vw, 28px)' }}>📊</span>
                  <span 
                    className="font-bold text-black uppercase tracking-wider"
                    style={{ fontSize: 'clamp(9px, 1.4vw, 18px)' }}
                  >
                    Archive
                  </span>
                </div>
                <span className="text-black/20 group-hover:text-black transition-colors text-xs">→</span>
              </button>
            </motion.div>
          </Draggable>

          {/* Card 2.5 - SETTINGS */}
          <Draggable id="menu-settings" className="pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: 0.55 }}
              className="relative group"
            >
              <button
                onClick={() => {
                  soundManager.play('tap');
                  onStateChange(GameState.SETTINGS);
                }}
                className="w-full bg-white flex items-center justify-between hover:bg-gray-50 transition-all shadow-sm border border-gray-100"
                style={{ 
                  height: 'clamp(32px, 5.5vw, 72px)',
                  borderRadius: 'clamp(6px, 1.2vw, 16px)',
                  padding: '0 clamp(8px, 1.5vw, 20px)'
                }}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <span style={{ fontSize: 'clamp(12px, 2vw, 28px)' }}>⚙️</span>
                  <span 
                    className="font-bold text-black uppercase tracking-wider"
                    style={{ fontSize: 'clamp(9px, 1.4vw, 18px)' }}
                  >
                    Settings
                  </span>
                </div>
                <span className="text-black/20 group-hover:text-black transition-colors text-xs">→</span>
              </button>
            </motion.div>
          </Draggable>

          {/* Card 3 - CAREER OVERVIEW */}
          {stats && (
            <Draggable id="menu-stats" className="pointer-events-auto">
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="relative group w-full bg-[#F5F5F5] flex flex-col justify-center overflow-hidden"
                style={{ 
                  height: 'clamp(48px, 12vh, 110px)',
                  borderRadius: 'clamp(6px, 1.2vw, 16px)',
                  padding: 'clamp(6px, 1.5vh, 16px) clamp(8px, 1.5vw, 20px)'
                }}
              >
                <p 
                  className="font-bold text-[#999] uppercase tracking-widest mb-1"
                  style={{ fontSize: 'clamp(7px, 1vw, 12px)' }}
                >
                  Career Overview
                </p>
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-end">
                    <span 
                      className="font-mono text-black/40 uppercase"
                      style={{ fontSize: 'clamp(7px, 1vw, 12px)' }}
                    >
                      Total Yield
                    </span>
                    <span 
                      className="font-display italic text-black leading-none"
                      style={{ fontSize: 'clamp(14px, 2.4vw, 28px)' }}
                    >
                      {stats.totalPops.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span 
                      className="font-mono text-black/40 uppercase"
                      style={{ fontSize: 'clamp(7px, 1vw, 12px)' }}
                    >
                      Best Combo
                    </span>
                    <span 
                      className="font-display italic text-[#3DD6B5] leading-none"
                      style={{ fontSize: 'clamp(14px, 2.4vw, 28px)' }}
                    >
                      {stats.maxCombo}
                    </span>
                  </div>
                </div>
              </motion.div>
            </Draggable>
          )}

          {/* SPONSORED banner */}
          <Draggable id="menu-ad" className="pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="relative group w-full bg-black/5 flex items-center justify-between px-4"
              style={{ 
                height: 'clamp(24px, 5vh, 48px)',
                borderRadius: 'clamp(4px, 0.8vw, 8px)'
              }}
            >
              <div className="flex items-center gap-2">
                <div className="bg-black/10 px-1 rounded text-[7px] font-bold">AD</div>
                <span 
                  className="font-bold text-black/40 uppercase tracking-tight"
                  style={{ fontSize: 'clamp(8px, 1vw, 13px)' }}
                >
                  Fizz Blast Pro
                </span>
              </div>
              <span 
                className="font-black text-black/20 uppercase"
                style={{ fontSize: 'clamp(7px, 0.9vw, 11px)' }}
              >
                Sponsored
              </span>
            </motion.div>
          </Draggable>
        </div>
      </div>
    </div>
  );
};

export const LevelSelect: React.FC<{ onSelect: (d: Difficulty) => void, onBack: () => void }> = ({ onSelect, onBack }) => {
  const [stats, setStats] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<Difficulty>(Difficulty.MEDIUM);

  useEffect(() => {
    const loadStats = async () => {
      const s = await statsService.getStats();
      setStats(s);
    };
    loadStats();
  }, []);

  const levels = [
    { 
      type: Difficulty.EASY, 
      id: '01',
      label: 'Casual', 
      title: 'RELAXED_FLOW',
      desc: 'Standard atmospheric pressure. Ideal for baseline calibration and casual engagement.',
      color: '#00F5D4', 
      accent: 'bg-sunset-teal',
      textColor: 'text-sunset-teal',
      borderColor: 'border-sunset-teal/20',
      specs: { speed: '1.8x', rate: '1450ms', target: '10' },
      bg: 'bg-[#E0F7F4]'
    },
    { 
      type: Difficulty.MEDIUM, 
      id: '02',
      label: 'Pro', 
      title: 'STEADY_PRESSURE',
      desc: 'Increased carbonation levels. Requires consistent focus and rapid response patterns.',
      color: '#F27D26', 
      accent: 'bg-sunset-orange',
      textColor: 'text-sunset-orange',
      borderColor: 'border-sunset-orange/20',
      specs: { speed: '3.0x', rate: '1200ms', target: '20' },
      bg: 'bg-[#FFF3E0]'
    },
    { 
      type: Difficulty.HARD, 
      id: '03',
      label: 'Elite', 
      title: 'MAXIMUM_FIZZ',
      desc: 'Critical saturation reached. High-velocity deployment. Only for certified operators.',
      color: '#EC4899', 
      accent: 'bg-sunset-pink',
      textColor: 'text-sunset-pink',
      borderColor: 'border-sunset-pink/20',
      specs: { speed: '4.0x', rate: '900ms', target: '30' },
      bg: 'bg-[#FCE4EC]'
    },
  ];

  const handleSelect = (d: Difficulty) => {
    soundManager.play('tap');
    onSelect(d);
  };

  if (!stats) return null;

  const currentLevel = levels.find(l => l.type === selectedLevel)!;

  return (
    <div className="fixed inset-0 bg-white flex flex-col landscape:flex-row select-none overflow-hidden">
      {/* BACKGROUND LAYER (DYNAMIC) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLevel.type}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 transition-colors duration-700 ${currentLevel.bg} opacity-30`}
        />
      </AnimatePresence>

      {/* LEFT: Technical Details & Selection (Vertical Rail) */}
      <div className="relative z-40 w-full landscape:w-[40%] h-full p-4 sm:p-8 landscape:p-6 flex flex-col justify-between border-r border-black/5 backdrop-blur-sm">
        <div className="flex flex-col h-full justify-between">
          <div>
            <button
              onClick={() => {
                soundManager.play('tap');
                onBack();
              }}
              className="flex items-center gap-2 text-black/40 hover:text-black transition-colors group mb-4 landscape:mb-2"
            >
              <div className="w-6 h-6 rounded-full border border-black/10 flex items-center justify-center group-hover:border-black/30 transition-all">
                <span className="text-[10px]">←</span>
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em]">Return</span>
            </button>

            <div className="mb-4 landscape:mb-2">
              <h2 className="text-3xl landscape:text-4xl sm:text-6xl font-display italic text-black uppercase tracking-tighter leading-none mb-2">
                Select <br /> <span className="text-black/20">Protocol</span>
              </h2>
              <div className="h-px w-12 bg-black/10" />
            </div>
          </div>

          <div className="flex flex-col gap-1 landscape:gap-0.5 flex-grow justify-center">
            {levels.map((l) => (
              <button
                key={l.type}
                onClick={() => {
                  soundManager.play('tap');
                  setSelectedLevel(l.type);
                }}
                className={`group relative flex items-center gap-4 py-2 landscape:py-1.5 transition-all text-left ${selectedLevel === l.type ? 'translate-x-2' : 'opacity-30 hover:opacity-100'}`}
              >
                <span className="font-mono text-[8px] text-black/20 tracking-widest">{l.id}</span>
                <span className={`text-xl landscape:text-3xl sm:text-5xl font-display uppercase italic tracking-tighter transition-colors ${selectedLevel === l.type ? l.textColor : 'text-black'}`}>
                  {l.label}
                </span>
                {selectedLevel === l.type && (
                  <motion.div 
                    layoutId="active-indicator"
                    className={`absolute -left-8 w-6 h-[1.5px] ${l.accent}`}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Level Specs Overlay */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLevel.type}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="grid grid-cols-3 gap-2 landscape:gap-4 pt-4 border-t border-black/5"
            >
              <div>
                <p className="text-[6px] font-black text-black/20 uppercase tracking-widest mb-0.5">Velocity</p>
                <p className="font-mono text-[10px] text-black">{currentLevel.specs.speed}</p>
              </div>
              <div>
                <p className="text-[6px] font-black text-black/20 uppercase tracking-widest mb-0.5">Spawn_Rate</p>
                <p className="font-mono text-[10px] text-black">{currentLevel.specs.rate}</p>
              </div>
              <div>
                <p className="text-[6px] font-black text-black/20 uppercase tracking-widest mb-0.5">Target</p>
                <p className="font-mono text-[10px] text-black">{currentLevel.specs.target}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT: Immersive Preview & Data (Landscape Focus) */}
      <div className="relative flex-1 h-full overflow-hidden hidden landscape:flex items-center justify-center">
        {/* Large Background Number (Watermark) */}
        <AnimatePresence mode="wait">
          <motion.span
            key={currentLevel.id}
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ opacity: 0.08, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 1.2, x: -50 }}
            className="absolute text-[35vw] font-display italic font-black text-black pointer-events-none select-none"
          >
            {currentLevel.id}
          </motion.span>
        </AnimatePresence>

        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        {/* Info Card (Centered & Bold) */}
        <div className="relative z-10 w-full max-w-xl px-8 text-center flex flex-col items-center justify-center h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLevel.type}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              className="flex flex-col items-center w-full"
            >
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                className={`h-[1.5px] mb-4 ${currentLevel.accent}`}
              />
              
              <p className={`text-lg landscape:text-xl font-black uppercase tracking-[0.4em] mb-2 ${currentLevel.textColor} drop-shadow-sm`}>
                {currentLevel.title}
              </p>
              
              <p className="text-[10px] landscape:text-xs font-mono text-black/60 uppercase leading-relaxed tracking-widest mb-6 max-w-xs">
                {currentLevel.desc}
              </p>
              
              <div className="relative group mb-6">
                <p className="text-[8px] font-black text-black/20 uppercase tracking-widest mb-1">Personal Best</p>
                <p className={`text-7xl landscape:text-8xl font-display italic leading-none ${currentLevel.textColor} transition-transform duration-500 group-hover:scale-105`}>
                  {stats.highScores[GameMode.ENDLESS][currentLevel.type] || 0}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(selectedLevel)}
                className={`px-12 py-3 rounded-full text-white font-black uppercase tracking-[0.3em] text-[10px] ${currentLevel.accent} shadow-xl shadow-black/5`}
              >
                Initialize
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Decorative Technical Lines */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-1 opacity-10">
          <div className="w-16 h-[1px] bg-black" />
          <div className="w-8 h-[1px] bg-black" />
          <p className="font-mono text-[6px] uppercase tracking-tighter">System_Optimal</p>
        </div>
      </div>

      {/* Mobile Preview (Portrait Fallback) */}
      <div className="landscape:hidden flex-1 bg-[#F9F9F9] p-8 flex flex-col items-center justify-center gap-12">
         <div className="text-center">
            <p className={`text-xs font-black uppercase tracking-[0.3em] mb-2 ${currentLevel.textColor}`}>
              {currentLevel.title}
            </p>
            <p className="text-[10px] font-mono text-black/40 uppercase leading-relaxed tracking-wider max-w-[200px] mx-auto">
              {currentLevel.desc}
            </p>
         </div>
         <div className="text-center">
            <p className="text-[10px] font-black text-black/20 uppercase tracking-widest mb-1">High Score</p>
            <p className={`text-7xl font-display italic ${currentLevel.textColor}`}>
              {stats.highScores[GameMode.ENDLESS][currentLevel.type] || 0}
            </p>
         </div>
         <button
            onClick={() => handleSelect(selectedLevel)}
            className={`w-full py-5 rounded-full text-white font-black uppercase tracking-widest text-xs ${currentLevel.accent} shadow-lg active:scale-95 transition-transform`}
          >
            Initialize Protocol
          </button>
      </div>
    </div>
  );
};
