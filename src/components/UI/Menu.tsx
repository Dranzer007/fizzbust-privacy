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
      // #region agent log
      fetch('http://127.0.0.1:7496/ingest/3c2f7d6e-659b-406a-a71d-7d00a4f21512', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '95cb8d' },
        body: JSON.stringify({
          sessionId: '95cb8d',
          runId: 'pre-fix',
          hypothesisId: 'H1_MenuModuleRuns',
          location: 'src/components/UI/Menu.tsx:loadStats',
          message: 'Menu loadStats() executed',
          data: { hasStats: !!s },
          timestamp: Date.now()
        }),
      }).catch(() => {});
      // #endregion
    };
    loadStats();
  }, []);

  const bestCombo = stats?.maxCombos?.[GameMode.ENDLESS] 
    ? Math.max(...Object.values(stats.maxCombos[GameMode.ENDLESS]) as number[]) 
    : 0;

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
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
                  padding: '0 clamp(8px, 1.5vw, 20px)',
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
        </div>
      </div>
    </div>
  );
};

interface LevelSelectProps {
  onSelect: (difficulty: Difficulty) => void;
  onBack: () => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({ onSelect, onBack }) => {
  const levels: Array<{
    difficulty: Difficulty;
    label: string;
    hint: string;
    color: string;
  }> = [
    { difficulty: Difficulty.EASY, label: 'Easy', hint: 'Chill pace', color: '#3DD6B5' },
    { difficulty: Difficulty.MEDIUM, label: 'Medium', hint: 'Balanced rush', color: '#E8500A' },
    { difficulty: Difficulty.HARD, label: 'Hard', hint: 'Maximum fizz', color: '#FF0066' },
  ];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-md flex flex-col gap-4">
        <button
          onClick={() => {
            soundManager.play('tap');
            onBack();
          }}
          className="w-fit px-3 py-2 text-black/60 hover:text-black transition-colors border border-gray-100 rounded-lg text-xs uppercase tracking-widest font-bold"
        >
          ← Back
        </button>

        <div className="flex flex-col gap-2 text-center">
          <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.8em]">Choose Difficulty</p>
          <h2 className="text-3xl font-display italic text-black uppercase tracking-tighter">LEVEL SELECT</h2>
        </div>

        <div className="flex flex-col gap-3">
          {levels.map((lvl) => (
            <button
              key={lvl.difficulty}
              onClick={() => {
                soundManager.unlockAudio();
                soundManager.play('tap');
                onSelect(lvl.difficulty);
              }}
              className="w-full flex items-center justify-between px-4 py-4 rounded-2xl shadow-sm border border-gray-100"
              style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lvl.color }} />
                <div className="flex flex-col items-start">
                  <span className="font-black uppercase tracking-widest text-black" style={{ fontSize: 14 }}>
                    {lvl.label}
                  </span>
                  <span className="text-black/50 text-xs">{lvl.hint}</span>
                </div>
              </div>
              <span className="text-black/60 group-hover:text-black transition-colors text-xs">→</span>
            </button>
          ))}
        </div>

        <div className="text-center text-black/40 text-xs mt-2">
          Tip: difficulty changes bottle movement + spawn speed.
        </div>
      </div>
    </div>
  );
};

