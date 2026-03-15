import React from 'react';
import { motion } from 'motion/react';
import { useLayout } from '../../context/LayoutContext';

interface DraggableProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Draggable: React.FC<DraggableProps> = ({ id, children, className = "", style = {} }) => {
  const { isDesignMode, transforms, updateTransform } = useLayout();
  const transform = transforms[id] || { x: 0, y: 0, scale: 1, rotate: 0 };

  return (
    <motion.div
      drag={isDesignMode}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        updateTransform(id, { x: transform.x + info.offset.x, y: transform.y + info.offset.y });
      }}
      animate={{ 
        x: transform.x, 
        y: transform.y,
        scale: transform.scale,
        rotate: transform.rotate
      }}
      className={`${className} pointer-events-auto ${isDesignMode ? 'ring-1 ring-[#3DD6B5]/30 hover:ring-[#3DD6B5] relative group/draggable transition-shadow' : ''}`}
      style={{ 
        ...style, 
        zIndex: isDesignMode ? 999 : undefined,
        touchAction: isDesignMode ? 'none' : 'auto' 
      }}
    >
      {isDesignMode && (
        <>
          {/* Label */}
          <div className="absolute -top-5 left-0 bg-[#3DD6B5] text-black text-[7px] font-black px-1.5 py-0.5 rounded-t-md uppercase tracking-widest whitespace-nowrap z-50 opacity-0 group-hover/draggable:opacity-100 transition-opacity">
            {id}
          </div>

          {/* Scale Handle (Bottom Right) */}
          <div 
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-[#3DD6B5] rounded-full cursor-nwse-resize z-50 shadow-sm opacity-0 group-hover/draggable:opacity-100 transition-opacity"
            onMouseDown={(e) => {
              e.stopPropagation();
              const startX = e.clientX;
              const startScale = transform.scale;
              
              const onMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const newScale = Math.max(0.1, startScale + deltaX / 200);
                updateTransform(id, { scale: newScale });
              };
              
              const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
              };
              
              window.addEventListener('mousemove', onMouseMove);
              window.addEventListener('mouseup', onMouseUp);
            }}
          />

          {/* Rotate Handle (Top Center) */}
          <div 
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border border-[#FF0066] rounded-full cursor-alias z-50 shadow-sm flex items-center justify-center opacity-0 group-hover/draggable:opacity-100 transition-opacity"
            onMouseDown={(e) => {
              e.stopPropagation();
              const startX = e.clientX;
              const startRotate = transform.rotate;
              
              const onMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                updateTransform(id, { rotate: startRotate + deltaX });
              };
              
              const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
              };
              
              window.addEventListener('mousemove', onMouseMove);
              window.addEventListener('mouseup', onMouseUp);
            }}
          >
            <div className="w-px h-3 bg-[#FF0066] absolute -bottom-3" />
          </div>
        </>
      )}
      {children}
    </motion.div>
  );
};
