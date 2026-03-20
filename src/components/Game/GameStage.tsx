import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Text, Group, Path, Line, Circle } from 'react-konva';
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

interface TropicalFlash {
  id: string;
  x: number;
  y: number;
}

interface TropicalRing {
  id: string;
  x: number;
  y: number;
  color: string;
  duration: number;
  delay: number;
  border: number;
  scale: number;
}

interface TropicalParticle {
  id: string;
  x: number;
  y: number;
  emoji: string;
  dx: number;
  dy: number;
  duration: number;
  size: number;
}

interface TropicalScoreText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
}

interface TropicalSplat {
  id: string;
  blastId: string;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  baseRadius: number;
  duration: number;
  startTime: number;
  color: string;
  x: number;
  y: number;
  radius: number;
  fill: string;
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
  onPressureUpdate?: (progress: number) => void;
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
  onPressureUpdate,
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
  const [tropicalFlash, setTropicalFlash] = useState<TropicalFlash | null>(null);
  const [tropicalRings, setTropicalRings] = useState<TropicalRing[]>([]);
  const [tropicalParticles, setTropicalParticles] = useState<TropicalParticle[]>([]);
  const [tropicalTexts, setTropicalTexts] = useState<TropicalScoreText[]>([]);
  const [soakMode, setSoakMode] = useState(false);
  const [pressurePulse, setPressurePulse] = useState(false);
  
  const maxLives = difficulty === Difficulty.HARD ? 5 : 3;
  const bottlesRef = useRef<BottleData[]>([]);
  const thunderFreezeIdsRef = useRef<Set<string>>(new Set());
  const livesRef = useRef(initialLives);
  const scoreRef = useRef(initialScore);
  const comboRef = useRef(0);
  const isPausedRef = useRef(isPausedProp);
  const isStartingRef = useRef(false);
  const lastFrameTime = useRef<number>(0);
  const tropicalSplatsRef = useRef<TropicalSplat[]>([]);
  const vfxIdRef = useRef(0);
  const soakModeRef = useRef(false);
  const pressureLevelRef = useRef(0);
  const pressureArmedRef = useRef(true);
  const pressureSpeedModRef = useRef(1);
  const lastSoakTimeRef = useRef(0);
  const SOAK_TARGET = 10000;
  const soakLogNextRef = useRef(1000);
  
  const requestRef = useRef<number | null>(null);
  const lastSpawnTime = useRef<number>(0);
  const nextId = useRef<number>(0);
  const spawnCountRef = useRef<number>(0);
  const popCountRef = useRef<number>(0);
  const missedCountRef = useRef<number>(0);
  const currentSpawnRateRef = useRef<number>(config.spawnRate);

  // Sync refs with state
  useEffect(() => { 
    if (bottles.length !== bottlesRef.current.length) {
      bottlesRef.current = bottles;
    }
  }, [bottles.length]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { soakModeRef.current = soakMode; }, [soakMode]);
  useEffect(() => {
    if (soakMode) {
      soakLogNextRef.current = 1000;
      if (import.meta.env.DEV) {
        console.log(`[SOAK] Started (${difficulty}) target=${SOAK_TARGET}`);
      }
    } else {
      soakLogNextRef.current = 1000;
    }
  }, [soakMode, difficulty]);

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

  const triggerPressureUp = useCallback(() => {
    if (isPausedRef.current) return;
    if (pressureLevelRef.current >= 3) return;

    const nextLevel = Math.min(3, pressureLevelRef.current + 1);
    pressureLevelRef.current = nextLevel;
    pressureSpeedModRef.current = 1 + nextLevel * 0.1;

    pressureArmedRef.current = false;
    onPressureUpdate?.(0);

    setPressurePulse(true);
    setTimeout(() => setPressurePulse(false), 200);
    addFloatingText(stageWidth / 2, stageHeight / 2 - 60, "PRESSURE UP!", "#F28F16", true);
  }, [addFloatingText, stageWidth, stageHeight, onPressureUpdate]);

  useEffect(() => {
    const limit = Math.max(config.bottleLimit, 1);
    const fill = Math.min(1, Math.max(0, bottles.length / limit));

    if (pressureLevelRef.current >= 3) {
      onPressureUpdate?.(fill);
      return;
    }

    if (pressureArmedRef.current) {
      onPressureUpdate?.(fill);
      if (fill >= 1) {
        triggerPressureUp();
      }
      return;
    }

    if (fill <= 0.6) {
      pressureArmedRef.current = true;
      onPressureUpdate?.(fill);
    }
  }, [bottles.length, config.bottleLimit, onPressureUpdate, triggerPressureUp]);

  const nextVfxId = () => `vfx-${vfxIdRef.current++}`;

  const withAlpha = (hex: string, alpha: number) => {
    const clamped = Math.max(0, Math.min(1, alpha));
    const alphaHex = Math.round(clamped * 255).toString(16).padStart(2, '0');
    return `${hex}${alphaHex}`;
  };

  const spawnTropicalText = useCallback((x: number, y: number, text: string, color: string, size: number, delayMs: number = 0) => {
    const id = nextVfxId();
    const spawn = () => {
      setTropicalTexts(prev => [...prev, { id, x, y, text, color, size }]);
      setTimeout(() => {
        setTropicalTexts(prev => prev.filter(t => t.id !== id));
      }, 750);
    };

    if (delayMs > 0) {
      setTimeout(() => {
        if (!isPausedRef.current) spawn();
      }, delayMs);
    } else {
      spawn();
    }
  }, []);

  const triggerTropicalVfx = useCallback((originX: number, originY: number, targetPositions: { x: number, y: number, delay: number }[]) => {
    if (isPausedRef.current) return;

    const flashId = nextVfxId();
    setTropicalFlash({ id: flashId, x: originX, y: originY });
    setTimeout(() => {
      setTropicalFlash(prev => (prev?.id === flashId ? null : prev));
    }, 700);

    const ringDefs = [
      { color: '#F28F16', end: 260, duration: 420, delay: 0, border: 3 },
      { color: '#F2C12E', end: 195, duration: 360, delay: 70, border: 2 },
      { color: '#F07040', end: 117, duration: 280, delay: 140, border: 2 },
    ];

    ringDefs.forEach((ring) => {
      const id = nextVfxId();
      const scale = ring.end / 16;
      setTropicalRings(prev => [
        ...prev,
        { id, x: originX, y: originY, color: ring.color, duration: ring.duration, delay: ring.delay, border: ring.border, scale }
      ]);
      setTimeout(() => {
        setTropicalRings(prev => prev.filter(r => r.id !== id));
      }, ring.duration + ring.delay + 30);
    });

    const particleEmojis = ['🌴', '🍊', '🌿', '✨', '🍑', '💥', '🌟', '🍹'];
    const particles: TropicalParticle[] = Array.from({ length: 14 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 55 + Math.random() * 90;
      const duration = 500 + Math.random() * 400;
      const size = 10 + Math.random() * 10;
      return {
        id: nextVfxId(),
        x: originX,
        y: originY,
        emoji: particleEmojis[i % particleEmojis.length],
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        duration,
        size,
      };
    });

    setTropicalParticles(prev => [...prev, ...particles]);
    particles.forEach((p) => {
      setTimeout(() => {
        setTropicalParticles(prev => prev.filter(item => item.id !== p.id));
      }, p.duration + 30);
    });

    const blastId = nextVfxId();
    const now = performance.now();
    const splatColors = ['#F28F16', '#F2C12E', '#F07040', '#FBBF80', '#E8540A'];
    const newSplats: TropicalSplat[] = Array.from({ length: 20 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 100;
      const duration = 300 + Math.random() * 400;
      const radius = 3 + Math.random() * 5;
      return {
        id: nextVfxId(),
        blastId,
        startX: originX,
        startY: originY,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        baseRadius: radius,
        duration,
        startTime: now,
        color: splatColors[i % splatColors.length],
        x: originX,
        y: originY,
        radius,
        fill: withAlpha(splatColors[i % splatColors.length], 1),
      };
    });

    tropicalSplatsRef.current = [...tropicalSplatsRef.current, ...newSplats];
    setTimeout(() => {
      tropicalSplatsRef.current = tropicalSplatsRef.current.filter(s => s.blastId !== blastId);
    }, 900);

    spawnTropicalText(originX, originY, '+15 TROPICAL!', '#F2C12E', 16);
    targetPositions.forEach((pos) => {
      spawnTropicalText(pos.x, pos.y, '+1', '#FBBF80', 14, pos.delay);
    });
  }, [spawnTropicalText]);

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

      // Easy mode: no power bottles (even if forced).
      if (difficulty === Difficulty.EASY) {
        const isPowerType =
          type === BottleType.GOLDEN ||
          type === BottleType.FROSTY ||
          type === BottleType.THUNDER ||
          type === BottleType.TROPICAL;
        if (isPowerType) {
          type = BottleType.LEMON;
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

  const handlePop = useCallback((
    id: string,
    isPerfect: boolean = false,
    isChain: boolean = false,
    origin?: { x: number; y: number }
  ) => {
    if (isPausedRef.current) return;
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

    if (!isChain && bottle.type === BottleType.TROPICAL) {
      points = 15;
      setIsTropical(true);
      const originX = origin?.x ?? bottle.x;
      const originY = origin?.y ?? (bottle.y + (bottle.bobOffset || 0));
      const blastScale =
        difficulty === Difficulty.HARD ? 0.75 :
        difficulty === Difficulty.MEDIUM ? 0.85 :
        0.9;
      const blastRadius = Math.max(bottle.size * 3.5, stageWidth * 0.22) * blastScale;

      const targets = bottlesRef.current.filter((b) => {
        if (b.id === id || b.isOpened || b.isBursting) return false;
        const dx = b.x - originX;
        const dy = (b.y + (b.bobOffset || 0)) - originY;
        return Math.hypot(dx, dy) <= blastRadius;
      });

      const chainTargets = targets.map((b) => ({
        bottle: b,
        delay: 100 + Math.random() * 250
      }));

      triggerTropicalVfx(
        originX,
        originY,
        chainTargets.map(({ bottle: tb, delay }) => ({
          x: tb.x,
          y: tb.y + (tb.bobOffset || 0),
          delay
        }))
      );

      chainTargets.forEach(({ bottle: tb, delay }) => {
        setTimeout(() => {
          if (isPausedRef.current) return;
          handlePop(tb.id, false, true);
        }, delay);
      });

      setTimeout(() => setIsTropical(false), 600);
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
            const newLives = Math.min(l + 1, maxLives);
            livesRef.current = newLives;
            if (newLives !== l) {
              onLivesUpdate(newLives);
            }
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

    const basePoints = points;
    const newCombo = comboRef.current + 1;
    comboRef.current = newCombo;
    setCombo(newCombo);

    if (newCombo > 1) {
      addFloatingText(bottle.x + 30, bottle.y - 20, `x${newCombo}`, "#00F5D4", true);
    }

    let comboBonus = 0;
    if (newCombo === 5) comboBonus = 5;
    if (newCombo === 10) comboBonus = 10;
    if (newCombo === 15) comboBonus = 20;

    if (comboBonus > 0) {
      addFloatingText(bottle.x, bottle.y - 45, `COMBO BONUS +${comboBonus}`, "#F2C12E", true);
    }

    const nextScore = scoreRef.current + basePoints + comboBonus;
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

    // Floating Score Text (skip for chain pops to avoid duplicate tropical blast text)
    if (!isChain) {
      addFloatingText(bottle.x, bottle.y, `+${basePoints}`, bottle.type === BottleType.GOLDEN ? '#FFD700' : 'white');
    }

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
  }, [onPop, stageWidth, stageHeight, addFloatingText, triggerTropicalVfx]);

  const updateSplats = (time: number) => {
    if (!tropicalSplatsRef.current.length) return;
    const next: TropicalSplat[] = [];
    tropicalSplatsRef.current.forEach((s) => {
      const t = (time - s.startTime) / s.duration;
      if (t >= 1) return;
      const eased = Math.max(0, Math.min(1, t));
      const x = s.startX + s.dx * eased;
      const y = s.startY + s.dy * eased + 50 * eased * eased;
      const radius = s.baseRadius * (1 - 0.5 * eased);
      const fill = withAlpha(s.color, 1 - eased);
      next.push({ ...s, x, y, radius, fill });
    });
    tropicalSplatsRef.current = next;
  };

  const animate = (time: number) => {
    updateSplats(time);

    if (soakModeRef.current && scoreRef.current >= SOAK_TARGET) {
      soakModeRef.current = false;
      setSoakMode(false);
      if (import.meta.env.DEV) {
        console.log(`[SOAK] Complete (${difficulty}) score=${scoreRef.current}`);
      }
    }

    if (soakModeRef.current && scoreRef.current >= soakLogNextRef.current) {
      if (import.meta.env.DEV) {
        console.log(`[SOAK] ${difficulty} score=${scoreRef.current} bottles=${bottlesRef.current.length} lives=${livesRef.current}`);
      }
      soakLogNextRef.current += 1000;
    }

    if (soakModeRef.current) {
      const elapsed = time - lastSoakTimeRef.current;
      if (elapsed > 40) {
        lastSoakTimeRef.current = time;

        const capacity = Math.max(config.bottleLimit - bottlesRef.current.length, 0);
        const spawnCount = Math.min(3, capacity);
        for (let i = 0; i < spawnCount; i += 1) {
          spawnBottle();
        }

        const candidates = bottlesRef.current.filter(b => !b.isOpened && !b.isBursting);
        const popCount = Math.min(6, candidates.length);
        for (let i = 0; i < popCount; i += 1) {
          handlePop(candidates[i].id, false, false);
        }
      }
    }
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
    const speedMod = (isFrosty ? 0.4 : 1) * pressureSpeedModRef.current;
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
        case 'o':
          setSoakMode(prev => !prev);
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
      <style>{`
        @keyframes tropicalFlash {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes tropicalRing {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(var(--ring-scale)); opacity: 0; }
        }
        @keyframes tropicalParticle {
          0% { transform: translate(-50%, -50%) translate(0, 0) rotate(0deg); opacity: 1; }
          60% { transform: translate(-50%, -50%) translate(calc(var(--dx) * 0.6), calc(var(--dy) * 0.6 + 18px)) rotate(240deg); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) translate(var(--dx), calc(var(--dy) + 50px)) rotate(400deg); opacity: 0; }
        }
        @keyframes tropicalScoreFloat {
          0% { transform: translate(-50%, -50%) translateY(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) translateY(-45px); opacity: 0; }
        }
      `}</style>
      {/* Debug Menu Overlay */}
      {debugMode && (
        <div className="absolute top-20 left-4 z-[100] glass-panel p-4 rounded-xl text-xs font-mono space-y-2 border-sunset-orange/50">
          <div className="text-sunset-orange font-bold border-b border-white/10 pb-1 mb-2">DEBUG CHEATS (Active)</div>
          <div className="flex justify-between gap-4"><span>[G] God Mode:</span> <span className={godMode ? 'text-green-400' : 'text-red-400'}>{godMode ? 'ON' : 'OFF'}</span></div>
          <div className="flex justify-between gap-4"><span>[O] Soak 10k:</span> <span className={soakMode ? 'text-green-400' : 'text-red-400'}>{soakMode ? 'ON' : 'OFF'}</span></div>
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
            <div>Soak: {soakMode ? `${Math.min(scoreRef.current, SOAK_TARGET)} / ${SOAK_TARGET}` : 'OFF'}</div>
          </div>
        </div>
      )}

      {/* Tropical Blast VFX: Overlay Flash (z-8) */}
      {tropicalFlash && (
        <div
          className="absolute inset-0 pointer-events-none z-[8]"
          style={{
            background: `radial-gradient(circle at ${tropicalFlash.x}px ${tropicalFlash.y}px, rgba(242,143,22,0.45) 0%, rgba(232,84,10,0.2) 40%, transparent 70%)`,
            animation: 'tropicalFlash 700ms ease-out forwards',
          }}
        />
      )}

      {/* Tropical Blast VFX: Rings, Particles, Score Text (z-12) */}
      <div className="absolute inset-0 pointer-events-none z-[12]">
        {tropicalRings.map((ring) => (
          <div
            key={ring.id}
            style={{
              position: 'absolute',
              left: `${ring.x}px`,
              top: `${ring.y}px`,
              width: '16px',
              height: '16px',
              borderRadius: '9999px',
              border: `${ring.border}px solid ${ring.color}`,
              animation: `tropicalRing ${ring.duration}ms cubic-bezier(0.2, 0.8, 0.2, 1) ${ring.delay}ms forwards`,
              ['--ring-scale' as any]: ring.scale,
            }}
          />
        ))}

        {tropicalParticles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              fontSize: `${particle.size}px`,
              animation: `tropicalParticle ${particle.duration}ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
              ['--dx' as any]: `${particle.dx}px`,
              ['--dy' as any]: `${particle.dy}px`,
            }}
          >
            {particle.emoji}
          </div>
        ))}

        {tropicalTexts.map((text) => (
          <div
            key={text.id}
            style={{
              position: 'absolute',
              left: `${text.x}px`,
              top: `${text.y}px`,
              color: text.color,
              fontWeight: 700,
              fontSize: `${text.size}px`,
              animation: 'tropicalScoreFloat 750ms ease-out forwards',
              pointerEvents: 'none',
            }}
          >
            {text.text}
          </div>
        ))}
      </div>
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

      {/* Pressure Flash Overlay */}
      {pressurePulse && (
        <div className="absolute inset-0 bg-sunset-orange/20 z-40 pointer-events-none animate-pulse" />
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
          {tropicalSplatsRef.current.map((s) => (
            <Circle
              key={s.id}
              x={s.x}
              y={s.y}
              radius={s.radius}
              fill={s.fill}
              opacity={1}
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
