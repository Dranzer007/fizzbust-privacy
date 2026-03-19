import React, { useState } from 'react';
import { GameState, Difficulty, DIFFICULTY_CONFIG, GameMode } from './types';
import { Menu, LevelSelect } from './components/UI/Menu';
import { HUD, GameOver } from './components/UI/HUD';
import { Stats } from './components/UI/Stats';
import { Leaderboard } from './components/UI/Leaderboard';
import { Settings } from './components/UI/Settings';
import { LoadingScreen } from './components/UI/LoadingScreen';
import { GameStage } from './components/Game/GameStage';
import { motion, AnimatePresence } from 'motion/react';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { TutorialOverlay } from './components/UI/TutorialOverlay';
import { RotationOverlay } from './components/UI/RotationOverlay';

import { soundManager } from './services/soundService';
import { hapticService } from './services/hapticService';
import { statsService } from './services/statsService';
import { adService } from './services/adService';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

import { LayoutProvider } from './context/LayoutContext';

export default function App() {
  return (
    <LayoutProvider>
      <AppContent />
    </LayoutProvider>
  );
}

function AppContent() {
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.ENDLESS);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [missedCount, setMissedCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalPops, setTotalPops] = useState(0);
  const [hasRevived, setHasRevived] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [pressureProgress, setPressureProgress] = useState(0);
  const [previousState, setPreviousState] = useState<GameState | null>(null);
  const gameStateRef = React.useRef(gameState);
  const backgroundPausedRef = React.useRef(false);

  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7496/ingest/3c2f7d6e-659b-406a-a71d-7d00a4f21512', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '95cb8d' },
      body: JSON.stringify({
        sessionId: '95cb8d',
        runId: 'pre-fix',
        hypothesisId: 'H3_AppModuleLoads',
        location: 'src/App.tsx:AppContent',
        message: 'AppContent function executed (module compiled)',
        data: { gameState },
        timestamp: Date.now()
      }),
    }).catch(() => {});
  }, []);
  // #endregion

  React.useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const handleStartGame = React.useCallback((d: Difficulty, mode: GameMode = GameMode.ENDLESS) => {
    soundManager.startMusic();
    setDifficulty(d);
    setGameMode(mode);
    setScore(0);
    setTotalPops(0);
    setMaxCombo(0);
    setLives(3);
    setMissedCount(0);
    setCombo(0);
    setHasRevived(false);
    setPressureProgress(0);

    // Check if tutorial has been seen
    const seenTutorial = localStorage.getItem('fizz_bust_tutorial_seen');
    if (!seenTutorial) {
      setShowTutorial(true);
    } else {
      setGameState(GameState.PLAYING);
    }
  }, []);

  const handleTutorialComplete = React.useCallback(() => {
    localStorage.setItem('fizz_bust_tutorial_seen', 'true');
    setShowTutorial(false);
    setGameState(GameState.PLAYING);
  }, []);

  const [isNewHighScore, setIsNewHighScore] = React.useState(false);

  // Use refs for values needed in callbacks to keep them stable
  const missedCountRef = React.useRef(missedCount);
  React.useEffect(() => { missedCountRef.current = missedCount; }, [missedCount]);

  const handleGameOver = React.useCallback(async (finalScore: number) => {
    const isHigh = await statsService.saveGame(finalScore, missedCountRef.current, gameMode, difficulty, maxCombo);
    setIsNewHighScore(isHigh);
    adService.incrementGameCount();
    setScore(finalScore);
    setGameState(GameState.GAME_OVER);
  }, [gameMode, difficulty, maxCombo]);

  const handleMissed = React.useCallback(() => {
    setMissedCount(m => m + 1);
    setCombo(0);
  }, []);

  const handlePop = React.useCallback(() => {
    setCombo(c => {
      const next = c + 1;
      setMaxCombo(m => Math.max(m, next));
      return next;
    });
    setTotalPops(p => p + 1);
  }, []);

  const handleRevive = React.useCallback(async () => {
    const success = await adService.showRewardedAd();
    if (success) {
      setLives(1);
      setHasRevived(true);
      setGameState(GameState.PLAYING);
      soundManager.play('tap');
    }
  }, []);

  const handleReturnToMenu = React.useCallback(async () => {
    soundManager.stopMusic();
    if (adService.shouldShowInterstitial()) {
      await adService.showInterstitial();
    }
    setGameState(GameState.MENU);
  }, []);

  const handlePressureUpdate = React.useCallback((progress: number) => {
    setPressureProgress(progress);
  }, []);

  const handleLoadingComplete = React.useCallback(() => {
    setGameState(GameState.MENU);
    soundManager.startMusic();
  }, []);

  React.useEffect(() => {
    const pauseForBackground = () => {
      soundManager.stopMusic();
      if (gameStateRef.current === GameState.PLAYING) {
        setGameState(GameState.PAUSED);
        backgroundPausedRef.current = true;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        pauseForBackground();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', pauseForBackground);
    window.addEventListener('freeze', pauseForBackground as EventListener);

    const capListeners: { remove: () => void }[] = [];
    const addCapListener = (listenerOrPromise: unknown) => {
      if (listenerOrPromise && typeof (listenerOrPromise as any).then === 'function') {
        (listenerOrPromise as Promise<{ remove: () => void }>).then((listener) => {
          capListeners.push(listener);
        });
      } else if (listenerOrPromise && typeof (listenerOrPromise as any).remove === 'function') {
        capListeners.push(listenerOrPromise as { remove: () => void });
      }
    };

    if (Capacitor.isNativePlatform()) {
      addCapListener(
        CapacitorApp.addListener('appStateChange', (state) => {
          if (!state.isActive) pauseForBackground();
        })
      );
      addCapListener(
        CapacitorApp.addListener('pause', () => {
          pauseForBackground();
        })
      );
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', pauseForBackground);
      window.removeEventListener('freeze', pauseForBackground as EventListener);
      capListeners.forEach((listener) => listener.remove());
    };
  }, []);

  const handlePause = React.useCallback(() => {
    if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
      soundManager.stopMusic();
    }
  }, [gameState]);

  const handleOpenSettings = React.useCallback(() => {
    setPreviousState(gameState);
    setGameState(GameState.SETTINGS);
    soundManager.play('tap');
  }, [gameState]);

  const handleCloseSettings = React.useCallback(() => {
    if (previousState) {
      setGameState(previousState);
      setPreviousState(null);
    } else {
      setGameState(GameState.MENU);
    }
    soundManager.play('tap');
  }, [previousState]);

  const handleResume = React.useCallback(() => {
    if (gameState === GameState.PAUSED) {
      setGameState(GameState.PLAYING);
      soundManager.startMusic();
    }
  }, [gameState]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white font-sans">
      <ErrorBoundary>
        <AnimatePresence mode="wait">
          {gameState === GameState.LOADING && (
            <LoadingScreen key="loading" onComplete={handleLoadingComplete} />
          )}

          {gameState === GameState.MENU && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Menu 
                onPlay={(mode) => {
                  setGameMode(mode);
                  setGameState(GameState.LEVEL_SELECT);
                }} 
                onStateChange={setGameState} 
              />
            </motion.div>
          )}

          {gameState === GameState.STATS && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Stats onBack={() => setGameState(GameState.MENU)} />
            </motion.div>
          )}

          {gameState === GameState.LEADERBOARD && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Leaderboard onBack={() => setGameState(GameState.MENU)} />
            </motion.div>
          )}

          {gameState === GameState.SETTINGS && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Settings onBack={handleCloseSettings} />
            </motion.div>
          )}

          {gameState === GameState.LEVEL_SELECT && (
            <motion.div
              key="level-select"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <LevelSelect 
                onSelect={(d) => handleStartGame(d, gameMode)} 
                onBack={() => setGameState(GameState.MENU)} 
              />
            </motion.div>
          )}

          {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full"
            >
              <GameStage
                difficulty={difficulty}
                mode={gameMode}
                initialScore={score}
                initialLives={lives}
                onScoreUpdate={setScore}
                onGameOver={handleGameOver}
                onLivesUpdate={setLives}
                onMissed={handleMissed}
                onPop={handlePop}
                onPressureUpdate={handlePressureUpdate}
                isPaused={gameState === GameState.PAUSED}
              />
              <HUD 
                score={score} 
                lives={lives}
                difficulty={difficulty} 
                mode={gameMode}
                combo={combo}
                onBack={handleReturnToMenu}
                onPause={handlePause}
                pressureProgress={pressureProgress}
              />
            </motion.div>
          )}

          {gameState === GameState.PAUSED && (
            <motion.div
              key="paused"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-white/80 backdrop-blur-xl flex items-center justify-center p-6 landscape:p-4"
            >
              <div className="relative w-full max-w-sm flex flex-col items-center">
                {/* Decorative Elements */}
                <div className="absolute -top-24 -left-12 w-48 h-48 bg-sunset-teal/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -right-12 w-48 h-48 bg-sunset-orange/10 rounded-full blur-3xl" />
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="w-full flex flex-col items-center gap-6 sm:gap-12 landscape:gap-4 relative z-10"
                >
                  <div className="text-center">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.8em] mb-2 sm:mb-4 landscape:mb-1">Operational Status</p>
                    <h2 className="text-4xl sm:text-6xl font-display italic text-black uppercase tracking-tighter leading-none">
                      Paused
                    </h2>
                    <div className="mt-2 sm:mt-4 flex items-center justify-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-sunset-teal animate-pulse" />
                      <p className="text-[8px] font-mono text-black/40 uppercase tracking-widest">System on Standby</p>
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-2 sm:gap-4">
                    <button
                      onClick={handleResume}
                      className="group relative w-full py-4 sm:py-6 landscape:py-3 bg-black text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-sunset-teal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative z-10">Resume Protocol</span>
                    </button>

                    <button
                      onClick={handleOpenSettings}
                      className="w-full py-4 sm:py-6 landscape:py-3 bg-black/5 text-black/60 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black/10 hover:text-black transition-all"
                    >
                      Settings
                    </button>
                    
                    <button
                      onClick={handleReturnToMenu}
                      className="w-full py-4 sm:py-6 landscape:py-3 bg-black/5 text-black/40 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black/10 hover:text-black transition-all"
                    >
                      Abort Mission
                    </button>
                  </div>

                  <div className="flex items-center gap-8 opacity-20 landscape:hidden">
                    <div className="flex flex-col items-center">
                      <p className="text-[10px] font-display italic text-black">{score.toLocaleString()}</p>
                      <p className="text-[6px] font-mono text-black uppercase tracking-widest">Current Yield</p>
                    </div>
                    <div className="w-px h-4 bg-black/20" />
                    <div className="flex flex-col items-center">
                      <p className="text-[10px] font-display italic text-black">{difficulty}</p>
                      <p className="text-[6px] font-mono text-black uppercase tracking-widest">Intensity</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {gameState === GameState.GAME_OVER && (
            <GameOver 
              score={score} 
              mode={gameMode}
              stats={{
                pops: totalPops,
                maxCombo: maxCombo,
                missed: missedCount
              }}
              canRevive={!hasRevived}
              isNewHighScore={isNewHighScore}
              onRestart={() => setGameState(GameState.LEVEL_SELECT)} 
              onMenu={handleReturnToMenu}
              onRevive={handleRevive}
              difficulty={difficulty}
            />
          )}
        </AnimatePresence>
      </ErrorBoundary>

      <AnimatePresence>
        {showTutorial && (
          <TutorialOverlay onComplete={handleTutorialComplete} />
        )}
      </AnimatePresence>

      <RotationOverlay />
    </div>
  );
}
