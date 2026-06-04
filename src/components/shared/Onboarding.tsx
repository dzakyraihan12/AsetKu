'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface OnboardingProps {
  onComplete: (name: string) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onComplete(trimmed);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center hero-gradient px-6"
      style={{ height: 'var(--app-height, 100dvh)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-sm text-center space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-[48px]"
        >
          👋
        </motion.div>
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight text-white">Selamat datang di AsetKu!</h1>
          <p className="text-[12px] text-white/50 mt-2">
            Siapa nama kamu? Biar kita bisa menyapa kamu.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama kamu"
            autoFocus
            className="w-full h-12 rounded-2xl bg-white/10 border border-white/20 px-4 text-[14px] font-semibold text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all backdrop-blur-md"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full h-12 rounded-full btn-gold text-[#3d2e00] font-bold text-[13px] shadow-md shadow-amber-500/25 disabled:opacity-30 disabled:pointer-events-none active:scale-[0.97] transition-transform"
          >
            Mulai Sekarang 🚀
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
