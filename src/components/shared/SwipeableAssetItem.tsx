'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface SwipeableAssetItemProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  onAddTransaction: () => void;
}

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 180;

export function SwipeableAssetItem({ children, onEdit, onDelete, onAddTransaction }: SwipeableAssetItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const actionsOpacity = useTransform(x, [-ACTION_WIDTH, -40, 0], [1, 0.5, 0]);
  const actionsScale = useTransform(x, [-ACTION_WIDTH, -40, 0], [1, 0.8, 0.6]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      // Open actions
      haptic('light');
      setIsOpen(true);
    } else {
      // Close actions
      setIsOpen(false);
    }
  };

  const handleAction = (action: () => void) => {
    haptic('medium');
    setIsOpen(false);
    // Small delay to let animation finish
    setTimeout(action, 150);
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-2xl">
      {/* Action buttons behind */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-2"
        style={{ opacity: actionsOpacity, scale: actionsScale }}
      >
        <button
          onClick={() => handleAction(onAddTransaction)}
          className="flex flex-col items-center justify-center h-12 w-14 rounded-xl text-white shadow-md shadow-sky-900/20 btn-gradient"
        >
          <Plus className="h-4 w-4" />
          <span className="text-[8px] font-bold mt-0.5">Tambah</span>
        </button>
        <button
          onClick={() => handleAction(onEdit)}
          className="flex flex-col items-center justify-center h-12 w-14 rounded-xl text-white shadow-md shadow-amber-500/25"
          style={{ background: 'linear-gradient(135deg, #FDCC09 0%, #D4A406 100%)' }}
        >
          <Edit2 className="h-4 w-4 text-[#3d2e00]" />
          <span className="text-[8px] font-bold mt-0.5 text-[#3d2e00]">Edit</span>
        </button>
        <button
          onClick={() => handleAction(onDelete)}
          className="flex flex-col items-center justify-center h-12 w-14 rounded-xl text-white shadow-md shadow-red-500/25"
          style={{ background: 'linear-gradient(135deg, #EF4444 0%, #E11D48 100%)' }}
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-[8px] font-bold mt-0.5">Hapus</span>
        </button>
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
        dragElastic={{ left: 0.1, right: 0.5 }}
        onDragEnd={handleDragEnd}
        animate={{ x: isOpen ? -ACTION_WIDTH : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{ x }}
        className="relative z-10 touch-pan-y"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
