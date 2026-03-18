import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../../services/soundService';
import { GameMode } from '../../types';
import { SummerDecor } from './SummerTheme';

import { Draggable } from './Draggable';

interface HUDProps {
  score: number;
  lives: number;
  difficulty: string;
  mode: GameMode;
  combo: number;
  onBack: () => void;
  onPause?: () => void;
  targetColor?: string;
  bottleCount?: number;
  bottleLimit?: number;
}

export const HUD: React.FC<HUDProps> = ({ 
  score, 
  lives, 
  difficulty, 
  mode, 
  combo, 
  onBack, 
  onPause,
  targetColor,
  bottleCount = 0,
  bottleLimit = 0,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 select-none">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-2 sm:p-8 landscape:p-4 flex justify-between items-start">
        <Draggable id="hud-score" className="pointer-events-auto">
          <div className="flex flex-col gap-0.5 sm:gap-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-sunset-teal animate-pulse" />
              <p className="text-[7px] sm:text-xs font-mono font-bold text-black/40 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Protocol: {difficulty}</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <p className="text-2xl sm:text-6xl font-display italic tracking-tighter text-black drop-shadow-sm">{score.toLocaleString()}</p>
              {combo > 1 && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key={combo}
                  className="bg-sunset-orange px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-lg shadow-lg"
                >
                  <span className="text-[10px] sm:text-xl font-display italic text-white">x{combo}</span>
                </motion.div>
              )}
            </div>
          </div>
        </Draggable>

        <div className="flex items-center gap-2 sm:gap-4 pointer-events-auto">
          <Draggable id="hud-lives" className="pointer-events-auto">
            <div className="flex flex-col items-end gap-1 sm:gap-2">
              <div className="flex gap-1 sm:gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={`life-indicator-${i}`} className="relative w-4 h-4 sm:w-10 sm:h-10 landscape:w-6 landscape:h-6">
                    <img 
                      src="/assets/life_heart.svg"
                      alt="Life"
                      className={`w-full h-full object-contain transition-all duration-500 ${i < lives ? 'opacity-100 scale-100 drop-shadow-md' : 'opacity-20 scale-75 grayscale'}`}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[5px] sm:text-[10px] font-black text-black/20 uppercase tracking-widest">Stability Matrix</p>
            </div>
          </Draggable>

          <Draggable id="hud-pause" className="pointer-events-auto">
            <button
              onClick={() => {
                soundManager.play('tap');
                onPause?.();
              }}
              className="w-7 h-7 sm:w-16 sm:h-16 landscape:w-10 landscape:h-10 bg-black/5 rounded-lg sm:rounded-2xl flex items-center justify-center hover:bg-black/10 transition-colors group border border-black/5"
            >
              <div className="flex gap-0.5 sm:gap-1">
                <div className="w-0.5 h-2.5 sm:w-1.5 sm:h-6 landscape:h-4 bg-black rounded-full group-hover:scale-y-110 transition-transform" />
                <div className="w-0.5 h-2.5 sm:w-1.5 sm:h-6 landscape:h-4 bg-black rounded-full group-hover:scale-y-110 transition-transform" />
              </div>
            </button>
          </Draggable>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full p-2 sm:p-8 landscape:p-4 flex flex-col items-center gap-1 sm:gap-2">
        <div className="w-full max-w-[150px] sm:max-w-md h-0.5 sm:h-1 bg-black/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-sunset-teal"
            initial={{ width: 0 }}
            animate={{ width: `${(bottleCount / bottleLimit) * 100}%` }}
          />
        </div>
        <p className="text-[5px] sm:text-[10px] font-black text-black/10 uppercase tracking-[0.3em] sm:tracking-[0.5em]">Pressure Threshold</p>
      </div>
    </div>
  );
};

export const GameOver: React.FC<{ 
  score: number, 
  mode: GameMode, 
  stats?: { pops: number, maxCombo: number, missed: number },
  canRevive: boolean,
  isNewHighScore?: boolean,
  onRestart: () => void, 
  onMenu: () => void,
  onRevive: () => void,
  difficulty: string
}> = ({ score, mode, stats, canRevive, isNewHighScore, onRestart, onMenu, onRevive, difficulty }) => {
  React.useEffect(() => {
    soundManager.play('win');
  }, []);

  const accuracy = stats ? Math.round((stats.pops / (stats.pops + stats.missed)) * 100) || 0 : 0;
  const sessionId = React.useMemo(() => Math.random().toString(36).substr(2, 6).toUpperCase(), []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-start sm:justify-center p-4 sm:p-12 landscape:p-4 overflow-y-auto select-none"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] text-[20vw] landscape:text-[15vw] font-black leading-none select-none">
          {score}
        </div>
        <div className="absolute bottom-[-5%] right-[-5%] text-[20vw] landscape:text-[15vw] font-black leading-none select-none rotate-180">
          {score}
        </div>
      </div>

      <div className="w-full max-w-4xl relative z-10 flex flex-col items-center landscape:pt-2">
        {/* Header Section */}
        <div className="text-center mb-4 sm:mb-20 landscape:mb-1">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[8px] sm:text-xs font-black text-black/30 uppercase tracking-[0.6em] mb-1 sm:mb-4 landscape:mb-0"
          >
            Session Terminated
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-9xl landscape:text-4xl font-display italic font-black tracking-tighter text-black leading-none mb-1 sm:mb-4 landscape:mb-1"
          >
            {isNewHighScore ? 'NEW RECORD' : 'GAME OVER'}
          </motion.h2>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="h-0.5 sm:h-1 bg-black mx-auto"
          />
        </div>

        {/* Main Score Section */}
        <div className="grid grid-cols-1 landscape:grid-cols-2 w-full gap-6 sm:gap-24 items-center mb-6 sm:mb-24 landscape:mb-2">
          <div className="flex flex-col items-center landscape:items-start">
            <p className="text-[8px] sm:text-xs font-black text-black/20 uppercase tracking-[0.4em] mb-0.5 sm:mb-2 landscape:mb-0">Final Yield</p>
            <div className="relative flex flex-col items-center landscape:items-start">
              {isNewHighScore && (
                <motion.div
                  initial={{ scale: 0, rotate: -6 }}
                  animate={{ scale: 1, rotate: -2 }}
                  className="mb-2 sm:mb-4 bg-sunset-teal px-1.5 py-0.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl shadow-xl"
                >
                  <span className="text-[7px] sm:text-xs font-black text-white uppercase tracking-widest">Personal Best</span>
                </motion.div>
              )}
              <span className="text-6xl sm:text-[12rem] landscape:text-[4rem] font-display italic font-black tracking-tighter text-black leading-none">
                {score.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-12 w-full landscape:gap-4">
            <div className="border-l-2 border-black/5 pl-3 sm:pl-6 landscape:pl-4">
              <p className="text-[7px] sm:text-[10px] font-black text-black/30 uppercase tracking-widest mb-0.5 sm:mb-1 landscape:mb-0">Popped</p>
              <p className="text-2xl sm:text-5xl landscape:text-xl font-display italic font-black text-black">{stats?.pops || 0}</p>
            </div>
            <div className="border-l-2 border-black/5 pl-3 sm:pl-6 landscape:pl-4">
              <p className="text-[7px] sm:text-[10px] font-black text-black/30 uppercase tracking-widest mb-0.5 sm:mb-1 landscape:mb-0">Max Combo</p>
              <p className="text-2xl sm:text-5xl landscape:text-xl font-display italic font-black text-sunset-teal">{stats?.maxCombo || 0}</p>
            </div>
            <div className="border-l-2 border-black/5 pl-3 sm:pl-6 landscape:pl-4">
              <p className="text-[7px] sm:text-[10px] font-black text-black/30 uppercase tracking-widest mb-0.5 sm:mb-1 landscape:mb-0">Accuracy</p>
              <p className="text-2xl sm:text-5xl landscape:text-xl font-display italic font-black text-sunset-orange">{accuracy}%</p>
            </div>
            <div className="border-l-2 border-black/5 pl-3 sm:pl-6 landscape:pl-4">
              <p className="text-[7px] sm:text-[10px] font-black text-black/30 uppercase tracking-widest mb-0.5 sm:mb-1 landscape:mb-0">Difficulty</p>
              <p className="text-2xl sm:text-5xl landscape:text-xl font-display italic font-black text-black/40 uppercase">{difficulty}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 w-full max-w-2xl landscape:max-w-3xl landscape:gap-4">
          {canRevive && (
            <button
              onClick={() => {
                soundManager.play('tap');
                onRevive();
              }}
              className="flex-1 bg-sunset-teal text-white font-black uppercase tracking-[0.2em] py-4 sm:py-6 landscape:py-3 rounded-xl sm:rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-[10px] sm:text-sm"
            >
              Continue Protocol
            </button>
          )}
          <button
            onClick={() => {
              soundManager.play('tap');
              onRestart();
            }}
            className="flex-1 bg-black text-white font-black uppercase tracking-[0.2em] py-4 sm:py-6 landscape:py-3 rounded-xl sm:rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-[10px] sm:text-sm"
          >
            Restart Session
          </button>
          <button
            onClick={() => {
              soundManager.play('tap');
              onMenu();
            }}
            className="flex-1 bg-black/5 text-black/40 font-black uppercase tracking-[0.2em] py-4 sm:py-6 landscape:py-3 rounded-xl sm:rounded-2xl hover:bg-black/10 hover:text-black transition-all text-[10px] sm:text-sm"
          >
            Return to Base
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-6 sm:mt-24 landscape:mt-2 w-full flex justify-between items-center border-t border-black/5 pt-2 sm:pt-8 opacity-30">
          <p className="text-[7px] sm:text-[10px] font-mono font-black uppercase tracking-widest">Status: Offline</p>
          <p className="text-[7px] sm:text-[10px] font-mono font-black uppercase tracking-widest">ID: {sessionId}</p>
          <p className="text-[7px] sm:text-[10px] font-mono font-black uppercase tracking-widest">Ver: 1.0.7</p>
        </div>
      </div>
    </motion.div>
  );
};
