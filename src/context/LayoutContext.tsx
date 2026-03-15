import React, { createContext, useContext, useState, useEffect } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface Transform {
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

interface LayoutContextType {
  isDesignMode: boolean;
  toggleDesignMode: () => void;
  deviceType: DeviceType;
  transforms: Record<string, Transform>;
  updateTransform: (id: string, transform: Partial<Transform>) => void;
  resetLayout: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const getDeviceType = (width: number): DeviceType => {
  if (width <= 768) return 'mobile';
  if (width <= 1280) return 'tablet';
  return 'desktop';
};

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>(getDeviceType(window.innerWidth));
  const [allTransforms, setAllTransforms] = useState<Record<DeviceType, Record<string, Transform>>>({
    mobile: {},
    tablet: {},
    desktop: {}
  });

  // Handle resize to update device type
  useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType(window.innerWidth));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load transforms from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('fizz_bust_device_transforms');
    if (saved) {
      try {
        setAllTransforms(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load layout', e);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.code === 'KeyD') {
        setIsDesignMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateTransform = (id: string, transform: Partial<Transform>) => {
    setAllTransforms(prev => {
      const currentDeviceTransforms = prev[deviceType] || {};
      const current = currentDeviceTransforms[id] || { x: 0, y: 0, scale: 1, rotate: 0 };
      
      const next = {
        ...prev,
        [deviceType]: {
          ...currentDeviceTransforms,
          [id]: { ...current, ...transform }
        }
      };
      
      localStorage.setItem('fizz_bust_device_transforms', JSON.stringify(next));
      return next;
    });
  };

  const resetLayout = () => {
    setAllTransforms(prev => {
      const next = { ...prev, [deviceType]: {} };
      localStorage.setItem('fizz_bust_device_transforms', JSON.stringify(next));
      return next;
    });
  };

  const toggleDesignMode = () => setIsDesignMode(!isDesignMode);

  return (
    <LayoutContext.Provider value={{ 
      isDesignMode, 
      toggleDesignMode, 
      deviceType,
      transforms: allTransforms[deviceType] || {}, 
      updateTransform, 
      resetLayout 
    }}>
      {children}
      {isDesignMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-black/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl border border-white/10 font-mono text-[10px] flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3DD6B5] animate-pulse" />
            <span className="text-[#3DD6B5] font-black tracking-tighter">TRANSFORM: {deviceType} ({window.innerWidth}px)</span>
          </div>
          
          <div className="w-px h-3 bg-white/20" />
          
          <div className="flex gap-3">
            <button 
              onClick={resetLayout}
              className="hover:text-[#3DD6B5] transition-colors uppercase font-bold"
            >
              Reset
            </button>
            <button 
              onClick={toggleDesignMode}
              className="text-[#FF0066] hover:brightness-125 transition-all uppercase font-bold"
            >
              Exit
            </button>
          </div>
        </div>
      )}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) throw new Error('useLayout must be used within LayoutProvider');
  return context;
};
