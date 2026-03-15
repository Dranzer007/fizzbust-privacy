import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { statsService } from '../../services/statsService';
import { Difficulty, GameMode } from '../../types';
import { SummerDecor } from './SummerTheme';
import { soundManager } from '../../services/soundService';

interface StatsProps {
  onBack: () => void;
}

export const Stats: React.FC<StatsProps> = ({ onBack }) => {
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const stats = statsService.getStats();
  const accuracy = stats.totalPops + stats.totalMissed > 0 
    ? Math.round((stats.totalPops / (stats.totalPops + stats.totalMissed)) * 100) 
    : 0;

  const handleReset = () => {
    soundManager.play('tap');
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    soundManager.play('tap');
    statsService.resetStats();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center p-4 sm:p-8 overflow-y-auto select-none">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl relative z-10 pt-4 sm:pt-12 pb-8 sm:pb-24"
      >
        <div className="flex flex-col landscape:flex-row items-center landscape:items-end justify-between mb-6 sm:mb-16 gap-4 sm:gap-0">
          <button 
            onClick={() => {
              soundManager.play('tap');
              onBack();
            }}
            className="bg-black/5 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-black/40 hover:text-black transition-colors group self-start landscape:self-auto border border-black/5"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 fill-current group-hover:-translate-x-1 transition-transform">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          
          <div className="text-center landscape:text-right">
            <p className="text-[8px] landscape:text-[7px] sm:text-[10px] font-black text-black/20 uppercase tracking-[0.4em] sm:tracking-[0.8em] mb-1 sm:mb-2">System Archive</p>
            <h2 className="text-2xl landscape:text-2xl sm:text-5xl font-display italic tracking-tighter text-black uppercase">
              Performance <span className="text-sunset-orange">Metrics</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 landscape:grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-8 mb-8 sm:mb-16">
          <div className="bg-black/5 p-4 landscape:p-4 sm:p-10 rounded-2xl sm:rounded-[2rem] flex flex-col gap-1 sm:gap-2 border border-black/5">
            <p className="text-[8px] landscape:text-[7px] sm:text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">Total Yield</p>
            <p className="text-3xl landscape:text-3xl sm:text-6xl font-display italic tracking-tighter text-black">{stats.totalPops}</p>
            <p className="text-[6px] landscape:text-[6px] sm:text-[8px] font-mono text-black/40 uppercase mt-1 sm:mt-auto">Successful releases</p>
          </div>
          
          <div className="bg-black/5 p-4 landscape:p-4 sm:p-10 rounded-2xl sm:rounded-[2rem] flex flex-col gap-1 sm:gap-2 border border-black/5">
            <p className="text-[8px] landscape:text-[7px] sm:text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">Precision Rate</p>
            <p className="text-3xl landscape:text-3xl sm:text-6xl font-display italic tracking-tighter text-sunset-teal">{accuracy}%</p>
            <p className="text-[6px] landscape:text-[6px] sm:text-[8px] font-mono text-black/40 uppercase mt-1 sm:mt-auto">Target alignment</p>
          </div>

          <div className="bg-black/5 p-4 landscape:p-4 sm:p-10 rounded-2xl sm:rounded-[2rem] flex flex-col gap-1 sm:gap-2 border border-black/5">
            <p className="text-[8px] landscape:text-[7px] sm:text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">Sessions</p>
            <p className="text-3xl landscape:text-3xl sm:text-6xl font-display italic tracking-tighter text-black">{stats.gamesPlayed}</p>
            <p className="text-[6px] landscape:text-[6px] sm:text-[8px] font-mono text-black/40 uppercase mt-1 sm:mt-auto">System initializations</p>
          </div>
        </div>

        <div className="space-y-6 landscape:space-y-8 sm:space-y-24">
          {Object.values(GameMode).map((mode) => (
            <div key={mode}>
              <div className="flex items-center gap-2 sm:gap-8 mb-3 landscape:mb-4 sm:mb-12">
                <h3 className="text-base landscape:text-base sm:text-2xl font-display italic tracking-tighter text-black/80 uppercase">
                  {mode === GameMode.ENDLESS ? 'Endless Protocol' : 'Time Attack Protocol'}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 landscape:grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-8">
                {stats.highScores[mode] ? Object.entries(stats.highScores[mode]).map(([diff, score]) => (
                  <div key={diff} className="bg-black/5 p-4 landscape:p-3 sm:p-8 rounded-xl sm:rounded-2xl flex justify-between items-center group hover:bg-black/10 transition-colors border border-black/5">
                    <div className="flex flex-col">
                      <span className="text-[8px] landscape:text-[7px] sm:text-[10px] font-black text-black/20 uppercase tracking-widest mb-0.5 group-hover:text-black/40">{diff}</span>
                      <span className="text-[9px] landscape:text-[9px] font-mono text-black/60">Peak</span>
                    </div>
                    <span className="text-xl landscape:text-xl sm:text-4xl font-display italic tracking-tighter text-black">{score}</span>
                  </div>
                )) : (
                  <div className="col-span-1 landscape:col-span-3 sm:col-span-3 bg-black/5 p-6 sm:p-12 rounded-xl text-center text-black/20 font-mono text-[8px] landscape:text-[8px] sm:text-[10px] uppercase tracking-widest border border-black/5">No data recorded</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 sm:mt-32 pt-8 sm:pt-12 flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-0">
          <p className="text-[8px] sm:text-[10px] font-mono text-black/10 uppercase tracking-widest">End of Archive</p>
          <button
            onClick={handleReset}
            className="text-[8px] sm:text-[10px] font-black text-black/10 hover:text-sunset-pink transition-colors uppercase tracking-[0.5em]"
          >
            PURGE SYSTEM DATA
          </button>
        </div>
      </motion.div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-12 rounded-[2rem] max-w-sm w-full flex flex-col items-center text-center gap-8 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-sunset-pink/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-sunset-pink">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-display italic text-black uppercase mb-2">Purge Archive?</h3>
                <p className="text-xs font-mono text-black/40 uppercase tracking-widest leading-relaxed">This will permanently delete all recorded performance metrics.</p>
              </div>
              <div className="flex flex-col w-full gap-4">
                <button
                  onClick={confirmReset}
                  className="w-full py-4 bg-sunset-pink rounded-full text-white font-black uppercase tracking-widest text-[10px]"
                >
                  Confirm Purge
                </button>
                <button
                  onClick={() => {
                    soundManager.play('tap');
                    setShowResetConfirm(false);
                  }}
                  className="w-full py-4 bg-black/5 rounded-full text-black/40 font-black uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
