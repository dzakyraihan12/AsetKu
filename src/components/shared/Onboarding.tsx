'use client';

import { useState } from 'react';
import { Rocket, Wallet, Target, BarChart3, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AVATARS = [
  { id: 'av-1', emoji: '😎' },
  { id: 'av-2', emoji: '🧑‍💼' },
  { id: 'av-3', emoji: '👨‍💻' },
  { id: 'av-4', emoji: '👩‍💻' },
  { id: 'av-5', emoji: '🦊' },
  { id: 'av-6', emoji: '🐱' },
  { id: 'av-7', emoji: '🦁' },
  { id: 'av-8', emoji: '🐼' },
  { id: 'av-9', emoji: '🧔' },
  { id: 'av-10', emoji: '👩' },
  { id: 'av-11', emoji: '🧑‍🚀' },
  { id: 'av-12', emoji: '👸' },
];

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
  const [avatar, setAvatar] = useState('av-1');

  const isNameStep = step === slides.length;
  const isAvatarStep = step === slides.length + 1;

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setStep(slides.length + 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('asetku_user_avatar', avatar);
    onComplete(name.trim());
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
          {!isNameStep && !isAvatarStep ? (
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

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleNext}
                  className="w-full h-12 rounded-full bg-white/10 border border-white/20 text-white font-bold text-[13px] backdrop-blur-md active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
                >
                  Lanjut <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setStep(slides.length)}
                  className="w-full py-2 text-[11px] text-white/40 font-medium active:text-white/60 transition-colors"
                >
                  Lewati →
                </button>
              </div>
            </motion.div>
          ) : isNameStep ? (
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
              <form onSubmit={handleNameSubmit} className="space-y-4">
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
                  className="w-full h-12 rounded-full bg-white/10 border border-white/20 text-white font-bold text-[13px] backdrop-blur-md active:scale-[0.97] transition-transform flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
                >
                  Lanjut <ChevronRight className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="avatar-step"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-5"
            >
              <div>
                <h1 className="text-[20px] font-extrabold tracking-tight text-white">Pilih avatar kamu</h1>
                <p className="text-[12px] text-white/50 mt-2">
                  Biar makin personal, {name.trim()}!
                </p>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => setAvatar(av.id)}
                    className={`flex items-center justify-center p-3 rounded-2xl border-2 transition-all active:scale-90 ${
                      avatar === av.id
                        ? 'border-white bg-white/15 shadow-lg shadow-white/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <span className="text-[28px]">{av.emoji}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleComplete}
                className="w-full h-12 rounded-full btn-gold text-[#3d2e00] font-bold text-[13px] shadow-md shadow-amber-500/25 active:scale-[0.97] transition-transform"
              >
                Mulai Sekarang <Rocket className="inline h-3.5 w-3.5 ml-1" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
