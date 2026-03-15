import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Text, Group, Path, Line } from 'react-konva';
import { motion, AnimatePresence } from 'motion/react';
import { Bottle } from './Bottle';
import { BottleData, Difficulty, DIFFICULTY_CONFIG, GameMode, BottleType, MovementType } from '../../types';
import confetti from 'canvas-confetti';
import { soundManager } from '../../services/soundService';
import { hapticService } from '../../services/hapticService';
import { SummerDecor } from '../UI/SummerTheme';

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  isCombo?: boolean;
}

interface GameStageProps {
  difficulty: Difficulty;
  mode: GameMode;
  initialScore?: number;
  initialLives?: number;
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onLivesUpdate: (lives: number) => void;
  onMissed: () => void;
  onPop: () => void;
  onBottleCountUpdate?: (count: number, limit: number) => void;
  isPaused?: boolean;
  targetColor?: string;
}

export const GameStage: React.FC<GameStageProps> = ({
  difficulty,
  mode,
  initialScore = 0,
  initialLives = 3,
  onScoreUpdate,
  onGameOver,
  onLivesUpdate,
  onMissed,
  onPop,
  onBottleCountUpdate,
  isPaused: isPausedProp = false,
}) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const [bottles, setBottles] = useState<BottleData[]>([]);
  const [score, setScore] = useState(initialScore);
  const [lives, setLives] = useState(initialLives);
  const [isShaking, setIsShaking] = useState(false);
  const [goldenPopCount, setGoldenPopCount] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [combo, setCombo] = useState(0);
  const [flashPulse, setFlashPulse] = useState(false);
  const [thunderPulse, setThunderPulse] = useState(false);
  const [isTropical, setIsTropical] = useState(false);
  const [isFrosty, setIsFrosty] = useState(false);
  const [backgroundReaction, setBackgroundReaction] = useState(false);
  const [lightningBolts, setLightningBolts] = useState<{ id: string, x1: number, y1: number, x2: number, y2: number }[]>([]);
  const [debugMode, setDebugMode] = useState(false);
  const [godMode, setGodMode] = useState(false);
  const [isPaused, setIsPaused] = useState(isPausedProp);
  const [countdown, setCountdown] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  
  const [isSwapping, setIsSwapping] = useState(false);
  const [debugStats, setDebugStats] = useState({ spawns: 0, pops: 0, misses: 0, spawnRate: config.spawnRate });
  
  const bottlesRef = useRef<BottleData[]>([]);
  const thunderFreezeIdsRef = useRef<Set<string>>(new Set());
  const livesRef = useRef(initialLives);
  const scoreRef = useRef(initialScore);
  const comboRef = useRef(0);
  const isPausedRef = useRef(isPausedProp);
  const isStartingRef = useRef(false);
  const lastFrameTime = useRef<number>(0);
  
  const requestRef = useRef<number | null>(null);
  const lastSpawnTime = useRef<number>(0);
  const nextId = useRef<number>(0);
  const spawnCountRef = useRef<number>(0);
  const popCountRef = useRef<number>(0);
  const missedCountRef = useRef<number>(0);
  const currentSpawnRateRef = useRef<number>(config.spawnRate);

  // Sync refs with state
  useEffect(() => { 
    // Only update bottle count if it actually changed to avoid unnecessary App re-renders
    if (onBottleCountUpdate && bottles.length !== bottlesRef.current.length) {
      onBottleCountUpdate(bottles.length, config.bottleLimit);
    }
    bottlesRef.current = bottles;
  }, [bottles.length, onBottleCountUpdate, config.bottleLimit]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { comboRef.current = combo; }, [combo]);

  useEffect(() => {
    if (!debugMode) return;
    const interval = setInterval(() => {
      setDebugStats({
        spawns: spawnCountRef.current,
        pops: popCountRef.current,
        misses: missedCountRef.current,
        spawnRate: Math.round(currentSpawnRateRef.current),
      });
    }, 500);
    return () => clearInterval(interval);
  }, [debugMode]);

  useEffect(() => {
    if (isPausedProp !== isPausedRef.current) {
      if (!isPausedProp) {
        // Resuming: Start countdown
        setIsStarting(true);
        isStartingRef.current = true;
        setCountdown(3);
        
        let count = 3;
        const timer = setInterval(() => {
          count -= 1;
          if (count > 0) {
            setCountdown(count);
            soundManager.play('tap');
          } else {
            clearInterval(timer);
            setCountdown(0);
            setIsStarting(false);
            isStartingRef.current = false;
            setIsPaused(false);
            isPausedRef.current = false;
            lastFrameTime.current = performance.now();
          }
        }, 800);
      } else {
        // Pausing
        setIsPaused(true);
        isPausedRef.current = true;
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
      }
    }
  }, [isPausedProp]);

  const sortedBottles = React.useMemo(() => {
    return [...bottles].sort((a, b) => a.y - b.y);
  }, [bottles]);

  const calcBottleSize = (w: number, h: number) => {
    const isLandscape = w > h;
    const baseSize = isLandscape ? h * 0.18 : Math.min(w, h) * 0.15;
    const bottlesPerScreen = 5;
    // Bottle render height is 140, scaled by (size / 60)
    const sizeByHeight = (h / bottlesPerScreen) * (60 / 140);
    return Math.max(36, Math.min(baseSize, 85, sizeByHeight));
  };

  const [stageWidth, setStageWidth] = useState(window.innerWidth || 800);
  const [stageHeight, setStageHeight] = useState(window.innerHeight || 600);
  const [bottleSize, setBottleSize] = useState(() => calcBottleSize(window.innerWidth || 800, window.innerHeight || 600));
  const lastSizeRef = useRef(bottleSize);
  const lastDimsRef = useRef({ w: window.innerWidth || 800, h: window.innerHeight || 600 });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth || 800;
      const h = window.innerHeight || 600;
      setStageWidth(w);
      setStageHeight(h);

      const prevDims = lastDimsRef.current;
      const orientationChanged = (w > h) !== (prevDims.w > prevDims.h);
      const deltaW = Math.abs(w - prevDims.w);
      const deltaH = Math.abs(h - prevDims.h);
      const significantResize = orientationChanged || deltaW > 80 || deltaH > 80;

      if (significantResize) {
        // Responsive bottle size: generous for mobile touch targets
        const nextSize = calcBottleSize(w, h);
        if (Math.abs(lastSizeRef.current - nextSize) >= 1) {
          lastSizeRef.current = nextSize;
          setBottleSize(nextSize);
        }
        lastDimsRef.current = { w, h };
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keep existing bottles consistent if size changes
  useEffect(() => {
    if (!bottlesRef.current.length) return;
    const updated = bottlesRef.current.map(b => ({ ...b, size: bottleSize }));
    bottlesRef.current = updated;
    setBottles(updated);
  }, [bottleSize]);

  useEffect(() => {
    // Update music intensity based on combo (0 to 20 combo maps to 0 to 1 intensity)
    const intensity = Math.min(combo / 20, 1);
    soundManager.setMusicIntensity(intensity);
  }, [combo]);

  const triggerShake = useCallback((bottleId?: string) => {
    setIsShaking(true);
    soundManager.play('miss');
    hapticService.heavy();
    
    // Optimization: Don't update the entire bottles array twice for a shake
    // Instead, just trigger the global stage shake
    setTimeout(() => setIsShaking(false), 150);
  }, []);

  const addFloatingText = useCallback((x: number, y: number, text: string, color: string = 'white', isCombo: boolean = false) => {
    const id = `text-${nextId.current++}`;
    setFloatingTexts(prev => [...prev, { id, x, y, text, color, isCombo }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 800);
  }, []);

  const spawnBottle = useCallback((forcedType?: BottleType) => {
    try {
      // Enforce bottle limit
      if (bottlesRef.current.length >= config.bottleLimit) {
        return;
      }

      const id = `bottle-${nextId.current++}`;
      const size = bottleSize;
      
      // Determine Bottle Type
      let type = forcedType || BottleType.LEMON;
      if (!forcedType) {
        const randType = Math.random();
        let cumulativeProb = 0;
        for (const [t, prob] of Object.entries(config.bottleTypeProbabilities)) {
          cumulativeProb += prob;
          if (randType <= cumulativeProb) {
            type = t as BottleType;
            break;
          }
        }
      }

      // Single Golden Bottle constraint
      if (type === BottleType.GOLDEN) {
        const hasGolden = bottlesRef.current.some(b => b.type === BottleType.GOLDEN && !b.isOpened);
        if (hasGolden) {
          type = BottleType.LEMON; // Downgrade to lemon if one already exists
        }
      }

      const variantColors: Record<string, string> = {
        [BottleType.LEMON]: '#FFF176',
        [BottleType.ORANGE]: '#FFB74D',
        [BottleType.CHERRY]: '#EF9A9A',
        [BottleType.GRAPE]: '#CE93D8',
        [BottleType.LIME]: '#A5D6A7',
        [BottleType.BLUE_RASPBERRY]: '#90CAF9',
        [BottleType.STRAWBERRY]: '#F48FB1',
        [BottleType.COLA]: '#BCAAA4',
        [BottleType.GOLDEN]: '#FFD700',
        [BottleType.TROPICAL]: '#FF80AB',
        [BottleType.FROSTY]: '#B2EBF2',
      };

      const color = variantColors[type] || '#FFF176';

      // Determine Movement Type
      const isPowerBottle = (
        type === BottleType.GOLDEN ||
        type === BottleType.FROSTY ||
        type === BottleType.THUNDER ||
        type === BottleType.TROPICAL
      );
      let movementType: MovementType;
      if (isPowerBottle) {
        const specialMovements = [MovementType.RANDOM_THROW, MovementType.FALLING];
        movementType = specialMovements[Math.floor(Math.random() * specialMovements.length)];
      } else {
        const sideMovements = [MovementType.RIGHT_TO_LEFT, MovementType.LEFT_TO_RIGHT];
        movementType = sideMovements[Math.floor(Math.random() * sideMovements.length)];
      }
      
      let x = 0, y = 0, vx = 0, vy = 0;
      // Speed scaling: Elite ramps, but stays human-friendly
      const speedMultiplier = difficulty === Difficulty.HARD
        ? (1 + (Math.min(scoreRef.current, 600) / 600) * 0.35) // up to 1.35x
        : Math.min(1 + (scoreRef.current / 1000), 2.5);
      let speed = config.speed * speedMultiplier;
      
      // Golden bottles are slower
      if (type === BottleType.GOLDEN) {
        speed *= 0.6;
      }

      const spawnMargin = 0.1; // Keep spawns away from corners (inner 80%)
      const spawnXMin = stageWidth * spawnMargin;
      const spawnXMax = stageWidth * (1 - spawnMargin);
      const spawnXRange = Math.max(spawnXMax - spawnXMin, 1);

      switch (movementType) {
        case MovementType.RIGHT_TO_LEFT:
          x = stageWidth + 200;
          // Use discrete lanes to prevent vertical overlap - spread them out more
          const rtlLanes = Array.from({ length: config.laneCount }, (_, i) => 0.25 + (i * (0.55 / config.laneCount)));
          y = stageHeight * rtlLanes[Math.floor(Math.random() * rtlLanes.length)];
          vx = -speed;
          break;
        case MovementType.LEFT_TO_RIGHT:
          x = -200;
          // Use discrete lanes to prevent vertical overlap - spread them out more
          const ltrLanes = Array.from({ length: config.laneCount }, (_, i) => 0.2 + (i * (0.55 / config.laneCount)));
          y = stageHeight * ltrLanes[Math.floor(Math.random() * ltrLanes.length)];
          vx = speed;
          break;
        case MovementType.RANDOM_THROW:
          x = spawnXMin + Math.random() * spawnXRange;
          y = stageHeight + 100; // Start fully below screen
          vx = (Math.random() * 2 - 1) * speed * 1.3;
          {
            const spawnGravity = 0.22;
            const desiredApexY = stageHeight * 0.7;
            const rise = Math.max(60, y - desiredApexY);
            const maxVy = -Math.sqrt(2 * spawnGravity * rise) * 1.05;
            vy = Math.max(-speed * 2.8, maxVy);
          }
          break;
        case MovementType.FALLING:
          // Use discrete X lanes for falling bottles
          const vLanes = config.verticalLaneCount || 4;
          const xLanes = Array.from({ length: vLanes }, (_, i) => spawnXMin + ((i + 0.5) * (spawnXRange / vLanes)));
          x = xLanes[Math.floor(Math.random() * xLanes.length)];
          y = -200; // Start fully above screen
          vy = speed * 1.2;
          break;
      }

      // Stricter Prevention: Check for overlap with existing bottles at spawn
      // and ensure they aren't too close to bottles already on their path
      let attempts = 0;
      let finalX = x;
      let finalY = y;
      let isSafe = false;

      while (attempts < 10 && !isSafe) {
        const tooClose = bottlesRef.current.some(b => {
          const dx = b.x - finalX;
          const dy = b.y - finalY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Check for immediate overlap - use responsive size
          if (dist < (b.size + size) * 0.8) return true;
          
          // Check if they are in the same lane and too close horizontally/vertically
          if (Math.abs(dy) < size * 0.5) { // Same horizontal lane
             if (movementType === MovementType.RIGHT_TO_LEFT || movementType === MovementType.LEFT_TO_RIGHT) {
               if (Math.abs(dx) < size * 4) return true; // Keep distance in lane
             }
          }
          if (Math.abs(dx) < size * 0.5) { // Same vertical lane
             if (movementType === MovementType.FALLING) {
               if (Math.abs(dy) < size * 5) return true; // Keep distance in lane
             }
          }
          
          return false;
        });

        if (!tooClose) {
          isSafe = true;
        } else {
          // Offset the spawn position further back
          if (movementType === MovementType.RIGHT_TO_LEFT) finalX += 150;
          else if (movementType === MovementType.LEFT_TO_RIGHT) finalX -= 150;
          else if (movementType === MovementType.FALLING) finalY -= 200;
          else {
            finalX += (Math.random() > 0.5 ? 100 : -100);
            finalY += 100;
          }
          attempts++;
        }
      }

      if (!isSafe) return; // Skip spawning if we can't find a safe spot

      const newBottle: BottleData = {
        id,
        x: finalX,
        y: finalY,
        vx,
        vy,
        type,
        movementType,
        color,
        isOpened: false,
        size,
        rotation: movementType === MovementType.RANDOM_THROW ? Math.random() * 360 : 0,
        angularVelocity: movementType === MovementType.RANDOM_THROW ? (Math.random() * 10 - 5) : 0,
      };
      
      bottlesRef.current.push(newBottle);
      setBottles([...bottlesRef.current]);
      spawnCountRef.current += 1;
    } catch (e) {
      console.error('Spawning error:', e);
    }
  }, [difficulty, stageWidth, stageHeight, config]);

  const handlePop = useCallback((id: string, isPerfect: boolean = false, isChain: boolean = false) => {
    if (isPaused) return;
    const bottle = bottlesRef.current.find(b => b.id === id);
    if (!bottle || bottle.isOpened) return;
    thunderFreezeIdsRef.current.delete(id);
    popCountRef.current += 1;

    // Trigger Burst
    const burstNext = bottlesRef.current.map(b => b.id === id ? { ...b, isBursting: true, isOpened: true } : b);
    bottlesRef.current = burstNext;
    setBottles(burstNext);

    if (!isChain) {
      // Screen Flash - Color Matched
      setFlashPulse(true);
      // We can use a temporary style or state to handle the flash color if needed, 
      // but for now let's just use the brightness pulse as it's efficient.
      setTimeout(() => setFlashPulse(false), 100);
    }

    // Remove bottle after animation
    setTimeout(() => {
      const filtered = bottlesRef.current.filter(b => b.id !== id);
      bottlesRef.current = filtered;
      setBottles(filtered);
    }, 400);

    let points = 1;

    if (isTropical) points *= 2;

    if (!isChain && bottle.type === BottleType.TROPICAL) {
      points = 15;
      setIsTropical(true);
      addFloatingText(bottle.x, bottle.y - 50, "TROPICAL FEVER!", "#FF69B4", true);
      setTimeout(() => setIsTropical(false), 5000);
    }

    if (!isChain && bottle.type === BottleType.FROSTY) {
      points = 15;
      setIsFrosty(true);
      addFloatingText(bottle.x, bottle.y - 50, "FROSTY CHILL!", "#00FFFF", true);
      setTimeout(() => setIsFrosty(false), 5000);
    }

    if (!isChain && bottle.type === BottleType.THUNDER) {
      points = 25;
      addFloatingText(bottle.x, bottle.y - 50, "THUNDER BLAST!", "#7E57C2", true);
      hapticService.success();
      
      // Screen Flash - Thunder Style
      setThunderPulse(true);
      setTimeout(() => setThunderPulse(false), 300);

      // Destroy all other bottles
      const otherBottles = bottlesRef.current.filter(b => b.id !== id && !b.isOpened && !b.isBursting);

      otherBottles.forEach(b => thunderFreezeIdsRef.current.add(b.id));
      
      const newBolts = otherBottles.map(b => ({
        id: Math.random().toString(36).substr(2, 9),
        x1: bottle.x,
        y1: bottle.y,
        x2: b.x,
        y2: b.y
      }));
      setLightningBolts(newBolts);
      setTimeout(() => setLightningBolts([]), 300);

      otherBottles.forEach(b => {
        setTimeout(() => {
          thunderFreezeIdsRef.current.delete(b.id);
          handlePop(b.id, false, true);
        }, Math.random() * 400);
      });
      
      soundManager.play('win'); // Using win sound for thunder impact
    }

    if (!isChain && bottle.type === BottleType.GOLDEN) {
      points = 10;
      hapticService.light();
      setGoldenPopCount(prev => {
        const next = prev + 1;
        if (next >= 5) {
          setLives(l => {
            const newLives = Math.min(l + 1, 5);
            livesRef.current = newLives;
            return newLives;
          });
          soundManager.play('win');
          addFloatingText(bottle.x, bottle.y - 80, "1UP!", "#FFD700", true);
          return 0;
        }
        return next;
      });
    }
    
    // Puzzle bottle removed from gameplay.

    if (isPerfect && !isChain) {
      points *= 2;
      addFloatingText(bottle.x, bottle.y - 60, "PERFECT!", "#FFD700", true);
      // Add extra sparkle for perfect pops
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: bottle.x / stageWidth, y: bottle.y / stageHeight },
        colors: ['#FFD700', '#FFFFFF', '#00F5D4', '#FF0055']
      });
    }

    const newCombo = comboRef.current + 1;
    setCombo(newCombo);

    if (newCombo > 1) {
      addFloatingText(bottle.x + 30, bottle.y - 20, `x${newCombo}`, "#00F5D4", true);
    }

    const nextScore = scoreRef.current + points;
    setScore(nextScore);
    scoreRef.current = nextScore;
    onScoreUpdate(nextScore);
    
    onPop();
    
    if (!isChain) {
      // Background Reaction
      setBackgroundReaction(true);
      setTimeout(() => setBackgroundReaction(false), 500);
    }

    if (!isChain) {
      // Screen Shake on Pop
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 50);
    }

    // Floating Score Text
    addFloatingText(bottle.x, bottle.y, `+${points}`, bottle.type === BottleType.GOLDEN ? '#FFD700' : 'white');

    // Combo Juice
    if (newCombo >= 3 && !isChain) {
      const messages = ["NICE!", "HOT!", "FIZZY!", "POP!", "WOW!"];
      const msg = newCombo >= 10 ? "UNSTOPPABLE!" : newCombo >= 5 ? "AMAZING!" : messages[Math.floor(Math.random() * messages.length)];
      addFloatingText(bottle.x, bottle.y - 30, msg, "#F25C05", true);
      
      if (newCombo % 5 === 0) {
        setFlashPulse(true);
        setTimeout(() => setFlashPulse(false), 100);
      }
    }

    // Milestone Sparkle
    if (Math.floor(nextScore / 50) > Math.floor(scoreRef.current / 50)) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#F25C05', '#72E9DC']
      });
      addFloatingText(stageWidth / 2, stageHeight / 2, "MILESTONE!", "#FFD700", true);
    }

    if (!isChain) {
      confetti({
        particleCount: (bottle.type === BottleType.GOLDEN || isPerfect) ? 100 : 30 + (newCombo * 2),
        spread: 60 + (newCombo),
        origin: { y: 0.6 },
        colors: (bottle.type === BottleType.GOLDEN || isPerfect) ? ['#FFD700', '#00F5D4'] : ['#ffffff', '#80DEEA', '#00F5D4']
      });
    }

    const nextBottles = bottlesRef.current.map((b) => (b.id === id ? { ...b, isOpened: true } : b));
    bottlesRef.current = nextBottles;
    setBottles(nextBottles);
  }, [onPop, stageWidth, stageHeight, addFloatingText]);

  const animate = (time: number) => {
    // Wave-based spawning: spawn rate fluctuates over time
    // Every 30 seconds the cycle repeats
    const waveCycle = (time / 30000) * Math.PI * 2;
    const waveIntensity = difficulty === Difficulty.HARD
      ? (Math.sin(waveCycle) * 0.1 + 0.9) // Fluctuates between 0.8 and 1.0
      : (Math.sin(waveCycle) * 0.2 + 0.8); // Fluctuates between 0.6 and 1.0
    
    // Dynamic spawn rate: gets faster as score increases, modulated by wave
    const scoreFactor = difficulty === Difficulty.HARD
      ? Math.max(0.85, 1 - (scoreRef.current / 8000))
      : Math.max(0.75, 1 - (scoreRef.current / 5000));
    const currentSpawnRate = config.spawnRate * scoreFactor * waveIntensity;
    currentSpawnRateRef.current = currentSpawnRate;

    // Spawn logic
    if (time - lastSpawnTime.current > currentSpawnRate) {
      spawnBottle();
      lastSpawnTime.current = time;
    }

    // Puzzle logic removed.

    // Move bottles
    const gravity = 0.22;
    const friction = 0.985;
    const maxVelocity = 15;
    
    let missedCount = 0;
    let missedIds: string[] = [];
    
    // Move bottles and check off-screen
    const speedMod = isFrosty ? 0.4 : 1;
    const nextBottles: BottleData[] = [];
    
    for (const b of bottlesRef.current) {
      if (b.isOpened && !b.isBursting) continue; // Skip already popped and finished bottles

      const isFrozen = thunderFreezeIdsRef.current.has(b.id);
      let vx = (b.vx || 0);
      let vy = (b.vy || 0);
      
      // Clamp velocity
      const currentSpeed = Math.sqrt(vx * vx + vy * vy);
      if (currentSpeed > maxVelocity) {
        const ratio = maxVelocity / currentSpeed;
        vx *= ratio;
        vy *= ratio;
      }

      const nextX = isFrozen ? b.x : (b.x + vx * speedMod);
      const nextY = isFrozen ? b.y : (b.y + vy * speedMod);
      let nextVy = vy;
      const nextRotation = (b.rotation || 0) + (b.angularVelocity || 0) * speedMod;
      const nextAngularVelocity = (b.angularVelocity || 0) * friction;
      
      // Add subtle bobbing for bottles that aren't falling or thrown
      let bobOffset = 0;
      if (b.movementType === MovementType.RIGHT_TO_LEFT || b.movementType === MovementType.LEFT_TO_RIGHT) {
        const bobAmplitude = difficulty === Difficulty.HARD ? 0 : Math.max(2, b.size * 0.04);
        bobOffset = Math.sin(time / 700 + (parseInt(b.id.split('-')[1]) || 0)) * bobAmplitude;
      }
      if (isFrozen) {
        bobOffset = 0;
      }

      if (b.movementType === MovementType.RANDOM_THROW) {
        nextVy += gravity * speedMod;
      }

      const isOffScreen = 
        (b.movementType === MovementType.RIGHT_TO_LEFT && nextX < -200) ||
        (b.movementType === MovementType.LEFT_TO_RIGHT && nextX > stageWidth + 200) ||
        (b.movementType === MovementType.FALLING && nextY > stageHeight + 200) ||
        (b.movementType === MovementType.RANDOM_THROW && nextY > stageHeight + 200);

      const isMissed = !b.isOpened && !b.missed && isOffScreen;
      
      const isPowerBottle = 
        b.type === BottleType.GOLDEN || 
        b.type === BottleType.FROSTY || 
        b.type === BottleType.THUNDER || 
        b.type === BottleType.TROPICAL;
      
      if (isMissed && !isPowerBottle) {
        missedCount++;
        missedIds.push(b.id);
      }

      if (!isOffScreen || (b.isBursting && !isOffScreen)) {
        nextBottles.push({ 
          ...b, 
          x: nextX, 
          y: nextY, 
          vy: nextVy, 
          rotation: nextRotation, 
          angularVelocity: nextAngularVelocity, 
          bobOffset: bobOffset,
          missed: b.missed || isMissed
        });
      }
    }
    
    if (missedCount > 0) {
      missedCountRef.current += missedCount;
      for (let i = 0; i < missedCount; i++) onMissed();
      setCombo(0);
      if (!godMode) {
        const nextLives = Math.max(0, livesRef.current - missedCount);
        setLives(nextLives);
        livesRef.current = nextLives;
        onLivesUpdate(nextLives);
        
        if (nextLives === 0) {
          onGameOver(scoreRef.current);
        }
      }
      missedIds.forEach(id => triggerShake(id));
    }

    bottlesRef.current = nextBottles;
    setBottles(nextBottles);
  };

  const animateRef = useRef<(time: number) => void>(animate);
  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  const loop = (time: number) => {
    if (!isPausedRef.current && !isStartingRef.current && animateRef.current) {
      animateRef.current(time);
    }
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [difficulty, mode]);

  // Debug Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`') {
        setDebugMode(prev => !prev);
      }
      
      if (!debugMode) return;

      switch (e.key.toLowerCase()) {
        case 'g':
          setGodMode(prev => !prev);
          break;
        case 's':
          setScore(prev => prev + 100);
          break;
        case 'k':
          bottlesRef.current.forEach(b => handlePop(b.id));
          break;
        case 'l':
          setLives(3);
          livesRef.current = 3;
          break;
        case '1': spawnBottle(BottleType.GOLDEN); break;
        case '2': spawnBottle(BottleType.THUNDER); break;
        case '3': spawnBottle(BottleType.FROSTY); break;
        case '4': spawnBottle(BottleType.TROPICAL); break;
        // [5] Puzzle removed from gameplay.
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debugMode, spawnBottle, handlePop]);

  return (
    <div className={`w-full h-full relative transition-all duration-75 ${flashPulse ? 'brightness-150' : ''} ${isTropical ? 'sepia-[0.3] saturate-200' : ''}`}>
      {/* Debug Menu Overlay */}
      {debugMode && (
        <div className="absolute top-20 left-4 z-[100] glass-panel p-4 rounded-xl text-xs font-mono space-y-2 border-sunset-orange/50">
          <div className="text-sunset-orange font-bold border-b border-white/10 pb-1 mb-2">DEBUG CHEATS (Active)</div>
          <div className="flex justify-between gap-4"><span>[G] God Mode:</span> <span className={godMode ? 'text-green-400' : 'text-red-400'}>{godMode ? 'ON' : 'OFF'}</span></div>
          <div>[S] Add +100 Score</div>
          <div>[K] Kill All Bottles</div>
          <div>[L] Reset Lives</div>
          <div className="pt-2 border-t border-white/10">
            <div className="text-white/50 mb-1">Spawn:</div>
            <div className="grid grid-cols-2 gap-1">
              <div>[1] Golden</div>
              <div>[2] Thunder</div>
              <div>[3] Frosty</div>
              <div>[4] Tropical</div>
            </div>
          </div>
          <div className="text-[10px] text-white/30 italic mt-2">Press ` to hide</div>
          <div className="pt-2 border-t border-white/10 text-[10px] text-white/60 space-y-1">
            <div>Spawns: {debugStats.spawns}</div>
            <div>Pops: {debugStats.pops}</div>
            <div>Misses: {debugStats.misses}</div>
            <div>Spawn Rate: {debugStats.spawnRate} ms</div>
            <div>Bottles On Screen: {bottles.length}</div>
            <div>Frozen (Thunder): {thunderFreezeIdsRef.current.size}</div>
          </div>
        </div>
      )}
      <SummerDecor 
        hideShelf 
        onPop={backgroundReaction} 
        isFrosty={isFrosty} 
        isThunder={thunderPulse} 
        isSwapping={isSwapping} 
        combo={combo}
      />
      
      <AnimatePresence>
        {isStarting && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <span className="text-9xl font-display italic text-sunset-teal drop-shadow-[0_0_30px_rgba(0,245,212,0.5)]">
              {countdown}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Thunder Flash Overlay */}
      {thunderPulse && (
        <div className="absolute inset-0 bg-blue-400/20 z-50 pointer-events-none animate-pulse" />
      )}
      
      <Stage 
        width={stageWidth} 
        height={stageHeight} 
        className={`relative z-10 transition-transform duration-75 ${isShaking ? 'translate-x-1 translate-y-1' : ''}`}
      >
        <Layer listening={false}>
          {lightningBolts.map(bolt => (
            <Path
              key={bolt.id}
              data={`M ${bolt.x1} ${bolt.y1} L ${bolt.x1 + (bolt.x2 - bolt.x1) * 0.5 + (Math.random() * 40 - 20)} ${bolt.y1 + (bolt.y2 - bolt.y1) * 0.5 + (Math.random() * 40 - 20)} L ${bolt.x2} ${bolt.y2}`}
              stroke="#7E57C2"
              strokeWidth={3}
              shadowBlur={10}
              shadowColor="#7E57C2"
              opacity={0.8}
            />
          ))}
          
          {/* Spawn Lane Visualizers in Debug Mode */}
          {debugMode && (
            <Group opacity={0.3}>
              {Array.from({ length: config.laneCount }, (_, i) => 0.15 + (i * (0.65 / config.laneCount))).map(lane => (
                <Line key={`ltr-${lane}`} points={[0, stageHeight * lane, stageWidth, stageHeight * lane]} stroke="#00BCD4" strokeWidth={1} dash={[10, 5]} />
              ))}
              {Array.from({ length: config.laneCount }, (_, i) => 0.2 + (i * (0.65 / config.laneCount))).map(lane => (
                <Line key={`rtl-${lane}`} points={[0, stageHeight * lane, stageWidth, stageHeight * lane]} stroke="#FF5722" strokeWidth={1} dash={[10, 5]} />
              ))}
              {Array.from({ length: config.verticalLaneCount || 4 }, (_, i) => {
                const spawnMargin = 0.1;
                const spawnXMin = stageWidth * spawnMargin;
                const spawnXMax = stageWidth * (1 - spawnMargin);
                const spawnXRange = Math.max(spawnXMax - spawnXMin, 1);
                return spawnXMin + ((i + 0.5) * (spawnXRange / (config.verticalLaneCount || 4)));
              }).map(laneX => (
                <Line key={`fall-${laneX}`} points={[laneX, 0, laneX, stageHeight]} stroke="#4CAF50" strokeWidth={1} dash={[10, 5]} />
              ))}
            </Group>
          )}
        </Layer>
        <Layer>
          {[...bottles].sort((a, b) => {
            const bucket = 6;
            const aKey = Math.round((a.y + (a.bobOffset || 0) + a.size * 2.5) / bucket);
            const bKey = Math.round((b.y + (b.bobOffset || 0) + b.size * 2.5) / bucket);
            if (aKey !== bKey) return aKey - bKey;
            const aId = parseInt(a.id.split('-')[1] || '0', 10);
            const bId = parseInt(b.id.split('-')[1] || '0', 10);
            return aId - bId;
          }).map((bottle) => (
            <Bottle
              key={bottle.id}
              data={bottle}
              onPop={handlePop}
              speed={config.speed}
              combo={combo}
            />
          ))}
        </Layer>
        <Layer listening={false}>
          {floatingTexts.map((t) => (
            <Group key={t.id} x={t.x} y={t.y}>
              <Text
                text={t.text}
                fontSize={t.text === "PERFECT!" ? 32 : (t.isCombo ? 24 : 18)}
                fontStyle="black"
                fill={t.color}
                align="center"
                width={200}
                offsetX={100}
                shadowBlur={t.text === "PERFECT!" ? 15 : 5}
                shadowColor={t.text === "PERFECT!" ? "white" : "black"}
                opacity={1}
              />
            </Group>
          ))}
        </Layer>
      </Stage>
      
    </div>
  );
};
