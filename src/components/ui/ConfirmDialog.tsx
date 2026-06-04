'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  destructive?: boolean;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Hapus', destructive = true }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="relative z-10 w-full max-w-[300px] bg-surface rounded-[20px] p-5 shadow-float border border-border/20"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${destructive ? 'bg-destructive-soft' : 'bg-accent-soft'}`}>
                <AlertTriangle className={`h-5 w-5 ${destructive ? 'text-destructive' : 'text-primary'}`} />
              </div>
              <div>
                <h3 className="text-[14px] font-bold">{title}</h3>
                <p className="text-[11px] text-muted-foreground/60 mt-1">{message}</p>
              </div>
              <div className="flex gap-2 w-full mt-1">
                <button
                  onClick={onCancel}
                  className="flex-1 h-9 rounded-full bg-surface-secondary text-foreground text-[11px] font-semibold border border-border/40 hover:bg-surface-tertiary transition-all active:scale-[0.96]"
                >
                  Batal
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 h-9 rounded-full text-[11px] font-bold text-white shadow-md transition-all active:scale-[0.96] ${
                    destructive
                      ? 'bg-gradient-to-r from-red-500 to-rose-500 shadow-red-500/25'
                      : 'btn-gradient shadow-sky-900/20'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
