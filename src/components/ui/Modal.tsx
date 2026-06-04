'use client';

import { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle iOS keyboard: scroll focused input into view
  useEffect(() => {
    if (!open) return;

    function handleFocusIn(e: FocusEvent) {
      const target = e.target as HTMLElement;
      if (!target || !contentRef.current) return;

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        // Give iOS time to show keyboard and resize viewport
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }

    const container = contentRef.current;
    if (container) {
      container.addEventListener('focusin', handleFocusIn);
      return () => container.removeEventListener('focusin', handleFocusIn);
    }
  }, [open]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{ height: 'var(--app-height, 100dvh)' }}
          onClick={handleBackdrop}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className={cn(
              'relative z-10 w-full max-w-lg overflow-hidden',
              'bg-surface rounded-t-[24px] sm:rounded-[24px]',
              'shadow-float border border-border/20'
            )}
            style={{
              maxHeight: 'calc(var(--app-height, 100dvh) - 40px)',
            }}
          >
            {/* Handle bar — drag indicator */}
            <div className="flex justify-center pt-3 sm:hidden cursor-grab active:cursor-grabbing">
              <div className="h-[5px] w-10 rounded-full bg-foreground/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-surface-secondary flex items-center justify-center transition-all hover:bg-surface-tertiary active:scale-90 border border-border/20"
              >
                <X className="h-4 w-4 text-muted-foreground/60" />
              </button>
            </div>

            {/* Content — scrollable area that respects keyboard */}
            <div
              ref={contentRef}
              className="px-5 pb-8 overflow-y-auto"
              style={{
                maxHeight: 'calc(var(--app-height, 100dvh) - 40px - 70px)',
                paddingBottom: 'calc(2rem + var(--safe-bottom))',
              }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
