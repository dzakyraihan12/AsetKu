'use client';

import { useEffect, useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** If true, shows confirmation before closing via backdrop/drag */
  preventClose?: boolean;
}

export function Modal({ open, onClose, title, children, preventClose }: ModalProps) {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else { document.body.style.overflow = ''; setShowCloseConfirm(false); }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const attemptClose = useCallback(() => {
    if (preventClose) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [onClose, preventClose]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) attemptClose();
  }, [attemptClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={handleBackdrop}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={attemptClose}
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
                attemptClose();
              }
            }}
            className={cn(
              'relative z-10 w-full max-w-lg max-h-[88dvh] overflow-hidden',
              'bg-surface rounded-t-[24px] sm:rounded-[24px]',
              'shadow-float border border-border/20'
            )}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 sm:hidden cursor-grab active:cursor-grabbing">
              <div className="h-[5px] w-10 rounded-full bg-foreground/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <h2 className="text-[13px] font-bold tracking-tight">{title}</h2>
              <button
                onClick={attemptClose}
                className="h-8 w-8 rounded-full bg-surface-secondary flex items-center justify-center transition-all hover:bg-surface-tertiary active:scale-90 border border-border/20"
              >
                <X className="h-4 w-4 text-muted-foreground/60" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-8 overflow-y-auto max-h-[calc(88dvh-70px)]" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
              {children}
            </div>

            {/* Close confirmation overlay */}
            <AnimatePresence>
              {showCloseConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-surface/95 backdrop-blur-sm rounded-t-[24px] sm:rounded-[24px]"
                >
                  <div className="text-center space-y-3 px-8">
                    <p className="text-[13px] font-bold">Tutup form?</p>
                    <p className="text-[11px] text-muted-foreground/50">Data yang belum disimpan akan hilang.</p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setShowCloseConfirm(false)}
                        className="flex-1 h-10 rounded-xl bg-surface-secondary border border-border/20 text-[12px] font-bold text-muted-foreground press-scale"
                      >
                        Lanjut isi
                      </button>
                      <button
                        onClick={() => { setShowCloseConfirm(false); onClose(); }}
                        className="flex-1 h-10 rounded-xl bg-destructive/10 border border-destructive/20 text-[12px] font-bold text-destructive press-scale"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
