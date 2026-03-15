import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Stage, Layer, Group, Text } from 'react-konva';
import { Bottle } from '../Game/Bottle';
import { BottleType, MovementType } from '../../types';
import { soundManager } from '../../services/soundService';

interface TutorialOverlayProps {
  onComplete: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [hasPopped, setHasPopped] = useState(false);

  const steps = [
    {
      title: "Welcome to Fizz Bust",
      description: "Soda bottles are moving across the conveyor. Your job is to pop them before they leave the screen.",
      icon: "🥤"
    },
    {
      title: "Tap to Pop",
      description: "Tap or click on a bottle to pop it. Popping the cap directly gives you a 'PERFECT' bonus! Try it below:",
      icon: "👆",
      interactive: true
    },
    {
      title: "Special Bottles",
      description: "Look out for Golden, Thunder, and Frosty bottles. They provide powerful boosts!",
      icon: "✨"
    },
    {
      title: "Don't Miss",
      description: "If a bottle leaves the screen unpopped, you lose a life. Lose 3 lives and it's Game Over.",
      icon: "⚠️"
    }
  ];

  const nextStep = () => {
    if (steps[step].interactive && !hasPopped) {
      soundManager.play('tap');
      // Maybe shake the button or show a hint if they try to skip without popping
      return;
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
      setHasPopped(false);
    } else {
      onComplete();
    }
  };

  const handlePop = () => {
    setHasPopped(true);
    soundManager.play('pop');
  };

  const dummyBottle = {
    id: 'tutorial-bottle',
    type: BottleType.LEMON,
    x: 150,
    y: 100,
    lane: 1,
    speed: 0,
    isOpened: false,
    isBursting: false,
    movementType: MovementType.FALLING, // Use a valid type
    rotation: 0,
    color: '#FFC107',
    size: 60
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-8"
    >
      <motion.div
        key={step}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="glass-panel p-5 sm:p-10 rounded-2xl sm:rounded-[2.5rem] max-w-md landscape:max-w-2xl w-full flex flex-col landscape:flex-row items-center text-center landscape:text-left gap-4 sm:gap-8"
      >
        <div className="flex flex-col items-center landscape:items-start flex-1">
          <div className="text-4xl sm:text-6xl mb-2 sm:mb-4 animate-bounce">{steps[step].icon}</div>
          
          <div>
            <h3 className="text-lg sm:text-2xl font-display italic text-white uppercase mb-2 sm:mb-3 tracking-tighter">
              {steps[step].title}
            </h3>
            <p className="text-[9px] sm:text-xs font-mono text-white/60 uppercase tracking-widest leading-relaxed">
              {steps[step].description}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 flex-1 w-full">
          {steps[step].interactive && (
            <div className="w-full h-28 sm:h-40 relative flex items-center justify-center bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden">
              <Stage width={200} height={100}>
                <Layer>
                  {!hasPopped ? (
                    <Bottle 
                      data={{...dummyBottle, x: 100, y: 50, size: 35}} 
                      onPop={handlePop} 
                      speed={0} 
                      combo={1} 
                    />
                  ) : (
                    <Group x={100} y={50} offset={{ x: 0, y: 0 }}>
                      <Text 
                        text="PERFECT!" 
                        fill="#00F5D4" 
                        fontSize={16} 
                        fontFamily="Anton" 
                        align="center" 
                        width={100} 
                        x={-50}
                      />
                    </Group>
                  )}
                </Layer>
              </Stage>
              {!hasPopped && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute pointer-events-none text-sunset-teal text-xl sm:text-3xl"
                >
                  👆
                </motion.div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div 
                key={`step-dot-${i}`} 
                className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-colors ${i === step ? 'bg-sunset-teal' : 'bg-white/10'}`} 
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            disabled={steps[step].interactive && !hasPopped}
            className={`w-full py-3 sm:py-4 rounded-full font-black uppercase tracking-[0.3em] text-[9px] sm:text-[10px] transition-all ${
              steps[step].interactive && !hasPopped 
                ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                : 'bg-sunset-teal text-sunset-dark shadow-[0_0_30px_rgba(0,245,212,0.3)] active:scale-95'
            }`}
          >
            {step === steps.length - 1 ? "Start Popping" : (steps[step].interactive && !hasPopped ? "Pop to Continue" : "Next")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
