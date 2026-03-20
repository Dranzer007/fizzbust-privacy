import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { statsService, LeaderboardEntry } from '../../services/statsService';
import { Difficulty } from '../../types';
import { SummerDecor } from './SummerTheme';
import { soundManager } from '../../services/soundService';

interface LeaderboardProps {
  onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      const data = await statsService.getLeaderboard(selectedDifficulty);
      setLeaderboard(data);
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, [selectedDifficulty]);

  const handleDifficultyChange = (d: Difficulty) => {
    soundManager.play('tap');
    setSelectedDifficulty(d);
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center p-4 sm:p-8 overflow-y-auto select-none">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl relative z-10 pt-4 sm:pt-12 pb-8 sm:pb-24 flex flex-col h-full min-h-min"
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
            <p className="text-[8px] landscape:text-[7px] sm:text-[10px] font-black text-black/20 uppercase tracking-[0.4em] sm:tracking-[0.8em] mb-1 sm:mb-2">Local Archive</p>
            <h2 className="text-2xl landscape:text-2xl sm:text-5xl font-display italic tracking-tighter text-black uppercase">
              Hall of <span className="text-sunset-teal">Fame</span>
            </h2>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6 landscape:gap-6 sm:gap-12 overflow-visible sm:overflow-hidden">
          {/* Difficulty Selector */}
          <div className="flex gap-6 landscape:gap-8 sm:gap-12 pb-4 landscape:pb-4 sm:pb-8 overflow-x-auto no-scrollbar">
            {([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => handleDifficultyChange(d)}
                className={`text-[6px] landscape:text-[7px] sm:text-[10px] font-black uppercase tracking-[0.4em] transition-colors relative pb-1 whitespace-nowrap ${
                  selectedDifficulty === d ? 'text-sunset-teal' : 'text-black/20 hover:text-black'
                }`}
              >
                {d}
                {selectedDifficulty === d && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-sunset-teal" />
                )}
              </button>
            ))}
          </div>

          {/* Leaderboard List */}
          <div className="flex-1 overflow-y-auto pr-1 landscape:pr-2 sm:pr-4 space-y-2 landscape:space-y-3 sm:space-y-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <div className="w-4 h-4 sm:w-8 sm:h-8 border-2 border-sunset-teal border-t-transparent rounded-full animate-spin" />
                <p className="text-[6px] landscape:text-[7px] sm:text-[10px] font-mono text-black/20 uppercase tracking-[0.4em]">Synchronizing Network...</p>
              </div>
            ) : leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => (
                <div
                  key={`${entry.name}-${selectedDifficulty}-${index}`}
                  className={`group flex items-center justify-between p-3 landscape:p-3 sm:p-8 rounded-xl transition-all border ${
                    entry.isPlayer 
                      ? 'bg-sunset-teal/5 border-sunset-teal/40' 
                      : 'border-black/5 hover:border-black/10 hover:bg-black/5'
                  }`}
                >
                  <div className="flex items-center gap-3 landscape:gap-4 sm:gap-8">
                    <span className={`text-xl landscape:text-xl sm:text-3xl font-display italic tracking-tighter ${
                      index === 0 ? 'text-sunset-orange' : 
                      index === 1 ? 'text-black/60' : 
                      index === 2 ? 'text-black/40' : 'text-black/10'
                    }`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    
                    <div className="flex flex-col">
                      <span className={`text-base landscape:text-base sm:text-xl font-display uppercase italic tracking-tighter ${
                        entry.isPlayer ? 'text-sunset-teal' : 'text-black'
                      }`}>
                        {entry.name}
                      </span>
                      {entry.isPlayer && (
                        <span className="text-[6px] landscape:text-[6px] sm:text-[7px] font-black text-sunset-teal uppercase tracking-widest">Profile</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl landscape:text-xl sm:text-3xl font-display italic tracking-tighter text-black">
                      {entry.score.toLocaleString()}
                    </span>
                    <p className="text-[6px] landscape:text-[6px] sm:text-[7px] font-mono text-black/20 uppercase tracking-widest">Yield</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <p className="text-[6px] landscape:text-[7px] sm:text-[10px] font-mono text-black/20 uppercase tracking-[0.4em]">No Records Found</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 sm:mt-12 flex justify-between items-center opacity-20">
          <p className="text-[7px] sm:text-[8px] font-mono text-black uppercase tracking-[0.4em] font-black">
            Stream: Local
          </p>
          <p className="text-[7px] sm:text-[8px] font-mono text-black uppercase tracking-[0.4em] font-black">
            Node: AP-01
          </p>
        </div>
      </motion.div>
    </div>
  );
};
