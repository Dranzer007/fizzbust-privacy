import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const RotationOverlay: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return (
    <AnimatePresence>
      {isPortrait && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-sunset-dark/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
        >
          <motion.div
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8"
          >
            <svg viewBox="0 0 24 24" className="w-20 h-20 fill-sunset-teal">
              <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
            </svg>
          </motion.div>
          
          <h2 className="text-2xl sm:text-3xl font-display italic text-white mb-3 sm:mb-4 tracking-tighter">LANDSCAPE RECOMMENDED</h2>
          <p className="text-white/60 font-mono text-[10px] sm:text-xs uppercase tracking-widest max-w-xs leading-relaxed">
            Please rotate your device for the best soda popping experience.
          </p>
          
          <div className="mt-12 flex gap-2">
            <div className="w-2 h-2 rounded-full bg-sunset-teal animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-sunset-teal animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-sunset-teal animate-bounce [animation-delay:0.4s]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
