'use client';

import { useState } from 'react';
import { Rocket, Wallet, Target, BarChart3, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingProps {
  onComplete: (name: string) => void;
}

const slides = [
  {
    emoji: '💰',
    title: 'Lacak Semua Kekayaan',
    description: 'Catat rekening, saham, crypto, properti, dan aset apapun dalam satu tempat.',
    icon: Wallet,
  },
  {
    emoji: '🎯',
    title: 'Set Target Finansial',
    description: 'Tentukan tujuan keuangan dan pantau progress-nya secara real-time.',
    icon: Target,
  },
  {
    emoji: '📊',
    title: 'Insight Otomatis',
    description: 'Lihat pertumbuhan, distribusi, dan tren kekayaan kamu setiap saat.',
    icon: BarChart3,
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');

  const isNameStep = step === slides.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onComplete(trimmed);
    }
  };

  const handleNext = () => {
    setStep((s) => s + 1);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center hero-gradient px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {!isNameStep ? (
            <motion.div
              key={`slide-${step}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-[56px]"
              >
                {slides[step].emoji}
              </motion.div>
              <div>
                <h1 className="text-[20px] font-extrabold tracking-tight text-white">{slides[step].title}</h1>
                <p className="text-[12px] text-white/50 mt-2 leading-relaxed px-4">
                  {slides[step].description}
                </p>
              </div>

              {/* Dots */}
              <div className="flex items-center justify-center gap-2">
                {slides.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? 'w-6 bg-white' : 'w-1.5 bg-white/25'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="w-full h-12 rounded-full bg-white/10 border border-white/20 text-white font-bold text-[13px] backdrop-blur-md active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
              >
                Lanjut <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setStep(slides.length)}
                className="text-[11px] text-white/30 font-medium"
              >
                Lewati
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="name-step"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-[48px]"
              >
                👋
              </motion.div>
              <div>
                <h1 className="text-[20px] font-extrabold tracking-tight text-white">Siapa nama kamu?</h1>
                <p className="text-[12px] text-white/50 mt-2">
                  Biar kita bisa menyapa kamu setiap hari.
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
                  Mulai Sekarang <Rocket className="inline h-3.5 w-3.5 ml-1" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
