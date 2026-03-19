import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Group, Rect, Path, Text, Circle, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { BottleData, BottleType, MovementType } from '../../types';
import { soundManager } from '../../services/soundService';
import { hapticService } from '../../services/hapticService';

interface BottleProps {
  data: BottleData;
  onPop: (id: string, isPerfect?: boolean, isChain?: boolean, origin?: { x: number; y: number }) => void;
  speed: number;
  combo: number;
}

const BOTTLE_IMAGES: Record<string, string> = {
  [BottleType.LEMON]: '/assets/final-4/bottle_lemon.png',
  [BottleType.ORANGE]: '/assets/final-4/bottle_orange.png',
  [BottleType.CHERRY]: '/assets/final-4/bottle_cherry.png',
  [BottleType.GRAPE]: '/assets/final-4/bottle_grape.png',
  [BottleType.LIME]: '/assets/final-4/bottle_lime.png',
  [BottleType.BLUE_RASPBERRY]: '/assets/final-4/bottle_blue_raspberry.png',
  [BottleType.STRAWBERRY]: '/assets/final-4/bottle_strawberry.png',
  [BottleType.COLA]: '/assets/final-4/bottle_cola.png',
  [BottleType.GOLDEN]: '/assets/final-4/bottle_golden.png',
  [BottleType.PUZZLE]: '/assets/final-4/bottle_golden.png',
  [BottleType.TROPICAL]: '/assets/final-4/bottle_tropical.png',
  [BottleType.FROSTY]: '/assets/final-4/bottle_frosty.png',
  [BottleType.THUNDER]: '/assets/final-4/bottle_thunder.png',
};

const processedImageCache = new Map<string, HTMLImageElement>();

const RENDER_WIDTH = 60;
const RENDER_HEIGHT = 140;
const RENDER_OFFSET_X = RENDER_WIDTH / 2;
const RENDER_OFFSET_Y = RENDER_HEIGHT / 2;
const TARGET_BOTTLE_WIDTH = RENDER_WIDTH * 4;
const TARGET_BOTTLE_HEIGHT = RENDER_HEIGHT * 4;

const createTransparentImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = imageData;
        const w = canvas.width;
        const h = canvas.height;
        const visited = new Uint8Array(w * h);
        const stack: number[] = [];

        const isNearBlack = (idx: number) => {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          return r < 12 && g < 12 && b < 12;
        };

        const pushIfBg = (x: number, y: number) => {
          const i = y * w + x;
          if (visited[i]) return;
          const idx = i * 4;
          if (isNearBlack(idx)) {
            visited[i] = 1;
            stack.push(i);
          }
        };

        for (let x = 0; x < w; x++) {
          pushIfBg(x, 0);
          pushIfBg(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          pushIfBg(0, y);
          pushIfBg(w - 1, y);
        }

        while (stack.length) {
          const i = stack.pop() as number;
          const x = i % w;
          const y = Math.floor(i / w);
          const idx = i * 4;
          data[idx + 3] = 0;

          if (x > 0) pushIfBg(x - 1, y);
          if (x < w - 1) pushIfBg(x + 1, y);
          if (y > 0) pushIfBg(x, y - 1);
          if (y < h - 1) pushIfBg(x, y + 1);
        }

        ctx.putImageData(imageData, 0, 0);

        let minX = w;
        let minY = h;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            if (data[i + 3] > 10) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX < minX || maxY < minY) {
          resolve(img);
          return;
        }

        const pad = 4;
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(w - 1, maxX + pad);
        maxY = Math.min(h - 1, maxY + pad);

        const trimW = maxX - minX + 1;
        const trimH = maxY - minY + 1;
        const targetCanvas = document.createElement('canvas');
        targetCanvas.width = TARGET_BOTTLE_WIDTH;
        targetCanvas.height = TARGET_BOTTLE_HEIGHT;
        const tctx = targetCanvas.getContext('2d');
        if (!tctx) {
          resolve(img);
          return;
        }

        const scale = Math.min(TARGET_BOTTLE_WIDTH / trimW, TARGET_BOTTLE_HEIGHT / trimH) * 0.96;
        const drawW = trimW * scale;
        const drawH = trimH * scale;
        const dx = (TARGET_BOTTLE_WIDTH - drawW) / 2;
        const dy = (TARGET_BOTTLE_HEIGHT - drawH) / 2;
        tctx.clearRect(0, 0, TARGET_BOTTLE_WIDTH, TARGET_BOTTLE_HEIGHT);
        tctx.drawImage(canvas, minX, minY, trimW, trimH, dx, dy, drawW, drawH);

        const featherPx = 2.0;
        if (featherPx > 0) {
          const mask = document.createElement('canvas');
          mask.width = TARGET_BOTTLE_WIDTH;
          mask.height = TARGET_BOTTLE_HEIGHT;
          const mctx = mask.getContext('2d');
          if (mctx) {
            mctx.filter = `blur(${featherPx}px)`;
            mctx.drawImage(targetCanvas, 0, 0);
            mctx.filter = 'none';
            tctx.globalCompositeOperation = 'destination-in';
            tctx.drawImage(mask, 0, 0);
            tctx.globalCompositeOperation = 'source-over';
          }
        }

        // Frosty bottle uses original art; no trimming/masking here.

        const out = new window.Image();
        out.onload = () => resolve(out);
        out.onerror = () => resolve(img);
        out.src = targetCanvas.toDataURL('image/png');
      } catch {
        resolve(img);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
};

const useTransparentImage = (src: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(() => {
    return processedImageCache.get(src) || null;
  });

  useEffect(() => {
    let cancelled = false;
    const cached = processedImageCache.get(src);
    if (cached) {
      setImage(cached);
      return;
    }

    createTransparentImage(src)
      .then((img) => {
        if (cancelled) return;
        processedImageCache.set(src, img);
        setImage(img);
      })
      .catch(() => {
        if (!cancelled) setImage(null);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return image;
};

const preloadBottleImages = () => {
  if (typeof window === 'undefined') return;
  const sources = Array.from(new Set(Object.values(BOTTLE_IMAGES)));
  sources.forEach((src) => {
    if (processedImageCache.has(src)) return;
    createTransparentImage(src)
      .then((img) => {
        processedImageCache.set(src, img);
      })
      .catch(() => {});
  });
};

preloadBottleImages();

const BOTTLE_VARIANTS: Record<string, { cap: string, body: string, liquid: string }> = {
  [BottleType.LEMON]: { cap: '#FFC107', body: '#FFF176', liquid: '#FFF9C4' },
  [BottleType.ORANGE]: { cap: '#F57C00', body: '#FFB74D', liquid: '#FFE0B2' },
  [BottleType.CHERRY]: { cap: '#C62828', body: '#EF9A9A', liquid: '#FFCDD2' },
  [BottleType.GRAPE]: { cap: '#6A1B9A', body: '#CE93D8', liquid: '#E1BEE7' },
  [BottleType.LIME]: { cap: '#2E7D32', body: '#A5D6A7', liquid: '#DCEDC8' },
  [BottleType.BLUE_RASPBERRY]: { cap: '#1565C0', body: '#90CAF9', liquid: '#E3F2FD' },
  [BottleType.STRAWBERRY]: { cap: '#AD1457', body: '#F48FB1', liquid: '#FCE4EC' },
  [BottleType.COLA]: { cap: '#3E2723', body: '#BCAAA4', liquid: '#D7CCC8' },
  [BottleType.GOLDEN]: { cap: '#FFD700', body: '#FFD700', liquid: '#FFF9C4' },
  [BottleType.PUZZLE]: { cap: '#455A64', body: '#CFD8DC', liquid: '#ECEFF1' },
  [BottleType.TROPICAL]: { cap: '#FF4081', body: '#FF80AB', liquid: '#FCE4EC' },
  [BottleType.FROSTY]: { cap: '#00BCD4', body: '#B2EBF2', liquid: '#E0F7FA' },
  [BottleType.THUNDER]: { cap: '#7E57C2', body: '#512DA8', liquid: '#D1C4E9' },
};

const BOTTLE_SHAPES: Record<string, { path: string, clip: (ctx: any) => void }> = {
  DEFAULT: {
    path: `M 19.5 0 L 40.5 0 Q 42 0 42 2 L 42 12 Q 42 14 40.5 14 C 40.5 24 50 34 60 50 L 60 120 Q 60 140 40 140 L 20 140 Q 0 140 0 120 L 0 50 C 10 34 19.5 24 19.5 14 L 19.5 2 Q 19.5 0 19.5 0 Z`,
    clip: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(19.5, 0);
      ctx.lineTo(40.5, 0);
      ctx.quadraticCurveTo(42, 0, 42, 2);
      ctx.lineTo(42, 12);
      ctx.quadraticCurveTo(42, 14, 40.5, 14);
      ctx.bezierCurveTo(40.5, 24, 50, 34, 60, 50);
      ctx.lineTo(60, 120);
      ctx.quadraticCurveTo(60, 140, 40, 140);
      ctx.lineTo(20, 140);
      ctx.quadraticCurveTo(0, 140, 0, 120);
      ctx.lineTo(0, 50);
      ctx.bezierCurveTo(10, 34, 19.5, 24, 19.5, 14);
      ctx.lineTo(19.5, 2);
      ctx.quadraticCurveTo(19.5, 0, 19.5, 0);
      ctx.closePath();
    }
  },
  [BottleType.GOLDEN]: {
    path: `M 22 0 L 38 0 Q 40 0 40 2 L 40 12 Q 40 14 38 14 C 38 30 45 40 55 60 L 60 125 Q 60 140 30 140 L 30 140 Q 0 140 0 125 L 5 60 C 15 40 22 30 22 14 L 22 2 Q 22 0 22 0 Z`,
    clip: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(38, 0);
      ctx.quadraticCurveTo(40, 0, 40, 2);
      ctx.lineTo(40, 12);
      ctx.quadraticCurveTo(40, 14, 38, 14);
      ctx.bezierCurveTo(38, 30, 45, 40, 55, 60);
      ctx.lineTo(60, 125);
      ctx.quadraticCurveTo(60, 140, 30, 140);
      ctx.lineTo(30, 140);
      ctx.quadraticCurveTo(0, 140, 0, 125);
      ctx.lineTo(5, 60);
      ctx.bezierCurveTo(15, 40, 22, 30, 22, 14);
      ctx.lineTo(22, 2);
      ctx.quadraticCurveTo(22, 0, 22, 0);
      ctx.closePath();
    }
  },
  [BottleType.THUNDER]: {
    path: `M 20 0 L 40 0 L 40 14 L 60 50 L 50 70 L 60 90 L 50 110 L 60 140 L 0 140 L 10 110 L 0 90 L 10 70 L 0 50 L 10 30 L 20 14 L 20 0 Z`,
    clip: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(40, 0);
      ctx.lineTo(40, 14);
      ctx.lineTo(60, 50);
      ctx.lineTo(50, 70);
      ctx.lineTo(60, 90);
      ctx.lineTo(50, 110);
      ctx.lineTo(60, 140);
      ctx.lineTo(0, 140);
      ctx.lineTo(10, 110);
      ctx.lineTo(0, 90);
      ctx.lineTo(10, 70);
      ctx.lineTo(0, 50);
      ctx.lineTo(10, 30);
      ctx.lineTo(20, 14);
      ctx.lineTo(20, 0);
      ctx.closePath();
    }
  },
  [BottleType.FROSTY]: {
    path: `M 20 0 L 40 0 L 40 14 C 50 14 60 25 60 40 L 60 130 Q 60 140 50 140 L 10 140 Q 0 140 0 130 L 0 40 C 0 25 10 14 20 14 L 20 0 Z`,
    clip: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(40, 0);
      ctx.lineTo(40, 14);
      ctx.bezierCurveTo(50, 14, 60, 25, 60, 40);
      ctx.lineTo(60, 130);
      ctx.quadraticCurveTo(60, 140, 50, 140);
      ctx.lineTo(10, 140);
      ctx.quadraticCurveTo(0, 140, 0, 130);
      ctx.lineTo(0, 40);
      ctx.bezierCurveTo(10, 14, 20, 14, 20, 14);
      ctx.lineTo(20, 0);
      ctx.closePath();
    }
  },
  [BottleType.TROPICAL]: {
    path: `M 20 0 L 40 0 L 40 14 C 50 30 40 60 55 90 L 55 130 Q 55 140 30 140 L 30 140 Q 5 140 5 130 L 5 90 C 20 60 10 30 20 14 L 20 0 Z`,
    clip: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(40, 0);
      ctx.lineTo(40, 14);
      ctx.bezierCurveTo(50, 30, 40, 60, 55, 90);
      ctx.lineTo(55, 130);
      ctx.quadraticCurveTo(55, 140, 30, 140);
      ctx.lineTo(30, 140);
      ctx.quadraticCurveTo(5, 140, 5, 130);
      ctx.lineTo(5, 90);
      ctx.bezierCurveTo(20, 60, 10, 30, 20, 14);
      ctx.lineTo(20, 0);
      ctx.closePath();
    }
  },
  [BottleType.PUZZLE]: {
    path: `M 20 0 L 40 0 L 40 14 L 55 14 L 55 140 L 5 140 L 5 14 L 20 14 L 20 0 Z`,
    clip: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(40, 0);
      ctx.lineTo(40, 14);
      ctx.lineTo(55, 14);
      ctx.lineTo(55, 140);
      ctx.lineTo(5, 140);
      ctx.lineTo(5, 14);
      ctx.lineTo(20, 14);
      ctx.lineTo(20, 0);
      ctx.closePath();
    }
  }
};

const BurstAnimation: React.FC<{ x: number, y: number, variant: any }> = ({ x, y, variant }) => {
  const groupRef = useRef<Konva.Group>(null);
  const [frame, setFrame] = useState(0);
  
  const [pop1] = useImage('/assets/pop_frame_1.png');
  const [pop2] = useImage('/assets/pop_frame_2.png');
  const [pop3] = useImage('/assets/pop_frame_3.png');
  const [pop4] = useImage('/assets/pop_frame_4.png');
  const [pop5] = useImage('/assets/pop_frame_5.png');
  const popFrames = [pop1, pop2, pop3, pop4, pop5];

  const [splat1] = useImage('/assets/splat_v1.png');
  const [splat2] = useImage('/assets/splat_v2.png');
  const [splat3] = useImage('/assets/splat_v3.png');
  const splats = [splat1, splat2, splat3];

  const [cap1] = useImage('/assets/bottle_cap_v1.png');
  const [cap2] = useImage('/assets/bottle_cap_v2.png');
  const [cap3] = useImage('/assets/bottle_cap_v3.png');
  const caps = [cap1, cap2, cap3];

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f < 4 ? f + 1 : f));
    }, 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (groupRef.current) {
      const children = groupRef.current.getChildren();
      children.forEach((node) => {
        if (node.name() === 'pop-frame') return;
        
        const duration = 0.8;
        new Konva.Tween({
          node: node,
          duration: duration,
          x: (Math.random() - 0.5) * 400,
          y: (Math.random() - 0.5) * 400,
          rotation: Math.random() * 720,
          opacity: 0,
          scaleX: 0,
          scaleY: 0,
          easing: Konva.Easings.EaseOut,
        }).play();
      });
    }
  }, []);

  return (
    <Group x={x} y={y} offset={{ x: 30, y: 70 }} ref={groupRef}>
      {/* Pop Sequence */}
      {popFrames[frame] && (
        <KonvaImage
          name="pop-frame"
          image={popFrames[frame]}
          width={120}
          height={120}
          x={-30}
          y={10}
          opacity={1 - frame * 0.2}
        />
      )}

      {/* Splats */}
      {[...Array(6)].map((_, i) => (
        <KonvaImage
          key={`splat-${i}`}
          image={splats[i % 3]}
          width={40}
          height={40}
          opacity={0.8}
          offset={{ x: 20, y: 20 }}
        />
      ))}

      {/* Caps */}
      {[...Array(3)].map((_, i) => (
        <KonvaImage
          key={`cap-${i}`}
          image={caps[i % 3]}
          width={20}
          height={15}
          opacity={0.9}
          offset={{ x: 10, y: 7 }}
        />
      ))}
    </Group>
  );
};

const LightningSparks: React.FC<{ x: number, y: number, data: BottleData }> = ({ x, y, data }) => {
  const [lightning] = useImage('/assets/fx_lightning.png');
  
  return (
    <Group x={x} y={y}>
      {lightning && (
        <KonvaImage
          image={lightning}
          width={60}
          height={60}
          x={-30}
          y={-30}
          opacity={0.6}
          rotation={Math.random() * 360}
        />
      )}
    </Group>
  );
};

const BubbleTrail: React.FC<{ x: number, y: number, color: string }> = ({ x, y, color }) => {
  const [bubbles, setBubbles] = useState<{ id: number, ox: number, oy: number, size: number, opacity: number }[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const id = nextId.current++;
      setBubbles(prev => [
        ...prev.slice(-10),
        { id, ox: (Math.random() - 0.5) * 20, oy: (Math.random() - 0.5) * 20, size: Math.random() * 6 + 2, opacity: 0.6 }
      ]);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <Group x={x} y={y}>
      {bubbles.map(b => (
        <Circle
          key={b.id}
          x={b.ox}
          y={b.oy}
          radius={b.size}
          fill="white"
          opacity={b.opacity}
          shadowColor={color}
          shadowBlur={5}
        />
      ))}
    </Group>
  );
};

export const Bottle: React.FC<BottleProps> = React.memo(({ data, onPop, speed, combo }) => {
  const [isPopped, setIsPopped] = useState(data.isOpened);
  const groupRef = useRef<Konva.Group>(null);
  const glowRef = useRef<Konva.Rect>(null);
  const contentRef = useRef<Konva.Group>(null);
  const startPos = useRef<{ x: number, y: number } | null>(null);

  const variant = useMemo(() => BOTTLE_VARIANTS[data.type] || BOTTLE_VARIANTS[BottleType.LEMON], [data.type]);
  const shape = useMemo(() => BOTTLE_SHAPES[data.type] || BOTTLE_SHAPES.DEFAULT, [data.type]);
  
  const ENABLE_BOTTLE_GLOW = false;
  const glowConfigMap: Partial<Record<BottleType, { color: string; opacity: number; blur: number }>> = {
    [BottleType.GOLDEN]: { color: '#FFD700', opacity: 0.22, blur: 12 },
    [BottleType.THUNDER]: { color: '#7E57C2', opacity: 0.22, blur: 12 },
    [BottleType.TROPICAL]: { color: '#FF80AB', opacity: 0.2, blur: 12 },
    [BottleType.PUZZLE]: { color: '#80DEEA', opacity: 0.18, blur: 10 },
    [BottleType.FROSTY]: { color: '#B2EBF2', opacity: 0.12, blur: 8 },
  };
  const glowConfig = glowConfigMap[data.type];
  const showGlow = ENABLE_BOTTLE_GLOW && Boolean(glowConfig);

  useEffect(() => {
    if (glowRef.current && !isPopped) {
      const anim = new Konva.Animation((frame) => {
        if (!glowRef.current || !frame) return;
        const scale = 1 + Math.sin(frame.time / 200) * 0.05;
        const opacity = 0.3 + Math.sin(frame.time / 200) * 0.2;
        glowRef.current.scale({ x: scale, y: scale });
        glowRef.current.opacity(opacity);
      }, glowRef.current.getLayer());
      anim.start();
      return () => { anim.stop(); };
    }
  }, [isPopped]);

  const bottleImage = useTransparentImage(BOTTLE_IMAGES[data.type] || BOTTLE_IMAGES[BottleType.LEMON]);
  const [sparkle] = useImage('/assets/fx_sparkle.png');
  const [ice1] = useImage('/assets/fx_ice_shard_1.png');
  const [ice2] = useImage('/assets/fx_ice_shard_2.png');
  const [ice3] = useImage('/assets/fx_ice_shard_3.png');
  const iceShards = [ice1, ice2, ice3];

  useEffect(() => {
    setIsPopped(data.isOpened);
  }, [data.isOpened]);

  const handleInteraction = (isPerfect: boolean = false, origin?: { x: number; y: number }) => {
    if (isPopped || data.isBursting) return;
    onPop(data.id, isPerfect, false, origin);
    setIsPopped(true);
    soundManager.play('pop');
    hapticService.medium();
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isPopped || data.isBursting) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) {
      startPos.current = { ...pos };
    }
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isPopped || data.isBursting || !startPos.current) return;
    const stage = e.target.getStage();
    if (!stage || !groupRef.current) return;

    const pos = stage.getPointerPosition();
    if (pos) {
      const dx = pos.x - startPos.current.x;
      const dy = pos.y - startPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const localPos = groupRef.current.getRelativePointerPosition();
      if (localPos) {
        const isCapTap = localPos.y < 30;
        const isPerfect = isCapTap || (distance > 50);
        handleInteraction(isPerfect, pos);
      }
    }
    startPos.current = null;
  };

  const handleSimpleClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isPopped || data.isBursting) return;
    if (!startPos.current) {
      const localPos = groupRef.current?.getRelativePointerPosition();
      const isPerfect = localPos ? localPos.y < 30 : false;
      const stagePos = e.target.getStage()?.getPointerPosition();
      handleInteraction(isPerfect, stagePos || undefined);
    }
  };

  if (isPopped && !data.isBursting) return null;

  if (data.isBursting) {
    return <BurstAnimation x={data.x} y={data.y} variant={variant} />;
  }

  return (
    <Group>
      {!isPopped && !data.isBursting && (
        <BubbleTrail x={data.x} y={data.y} color={variant.body} />
      )}
      <Group
        x={data.x}
        y={data.y + (data.bobOffset || 0)}
        rotation={data.rotation || 0}
        ref={groupRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onClick={handleSimpleClick}
        onTap={handleSimpleClick}
        offset={{ x: 30, y: 70 }}
        scale={{ x: data.size / 60, y: data.size / 60 }}
      >
        {/* Pulsing Glow for Special Bottles */}
        {showGlow && !isPopped && glowConfig && (
          <Rect
            ref={glowRef}
            x={RENDER_OFFSET_X}
            y={RENDER_OFFSET_Y}
            width={RENDER_WIDTH}
            height={RENDER_HEIGHT}
            offset={{ x: RENDER_OFFSET_X, y: RENDER_OFFSET_Y }}
            fill={glowConfig.color}
            opacity={glowConfig.opacity}
            cornerRadius={18}
            shadowColor={glowConfig.color}
            shadowBlur={glowConfig.blur}
            listening={false}
          />
        )}
        <Rect
          width={RENDER_WIDTH}
          height={RENDER_HEIGHT}
          fill="transparent"
          hitStrokeWidth={20}
        />
      <Group ref={contentRef}>
        {/* Main Bottle Image or Vector Fallback */}
        {bottleImage ? (
          <KonvaImage
            image={bottleImage}
            width={RENDER_WIDTH}
            height={RENDER_HEIGHT}
            listening={false}
          />
        ) : (
          <Group listening={false}>
            {/* Bottle Body */}
            <Path
              data={shape.path}
              fill={variant.body}
              stroke="#000"
              strokeWidth={1}
            />
            {/* Liquid */}
            <Group clipFunc={shape.clip}>
              <Rect
                x={0}
                y={20}
                width={60}
                height={120}
                fill={variant.liquid}
              />
            </Group>
            {/* Cap */}
            <Rect
              x={19.5}
              y={0}
              width={21}
              height={10}
              fill={variant.cap}
              cornerRadius={2}
            />
          </Group>
        )}

        {/* Special Type Indicators */}
        <Group x={30} y={115} listening={false}>
          {data.type === BottleType.GOLDEN && sparkle && (
            <Group>
              <KonvaImage
                image={sparkle}
                width={40}
                height={40}
                x={-20}
                y={-20}
                opacity={0.8}
                rotation={Math.sin(Date.now() / 200) * 20}
              />
            </Group>
          )}
          {data.type === BottleType.THUNDER && (
            <Group>
              <LightningSparks x={0} y={0} data={data} />
            </Group>
          )}
          {data.type === BottleType.FROSTY && (
            <Group>
              {[...Array(3)].map((_, i) => (
                <KonvaImage
                  key={`ice-${i}`}
                  image={iceShards[i]}
                  width={20}
                  height={20}
                  x={Math.cos(i * 2) * 15 - 10}
                  y={Math.sin(i * 2) * 15 - 10}
                  opacity={0.5}
                />
              ))}
              {[...Array(2)].map((_, i) => (
                <KonvaImage
                  key={`ice-shadow-${i}`}
                  image={iceShards[i % 3]}
                  width={24}
                  height={12}
                  x={-12 + i * 12}
                  y={18}
                  opacity={0.5}
                />
              ))}
            </Group>
          )}
        </Group>

        {/* Missed Indicator */}
        {data.missed && (
          <Group>
            <Rect
              width={60}
              height={140}
              fill="red"
              opacity={0.3}
            />
            <Text
              text="MISS"
              x={-20}
              y={60}
              width={100}
              align="center"
              fontSize={24}
              fill="#ff4444"
              fontStyle="bold"
              stroke="white"
              strokeWidth={1}
              shadowBlur={5}
              shadowColor="black"
            />
          </Group>
        )}
      </Group>
    </Group>
  </Group>
  );
});
