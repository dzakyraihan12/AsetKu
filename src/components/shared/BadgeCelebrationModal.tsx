'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store';

const CONFETTI_COLORS = ['#FDCC09', '#24AAE1', '#10B981', '#EC4899', '#8B5CF6', '#F97316', '#EF4444', '#fff'];
const PARTICLE_COUNT = 60;

function FullScreenConfetti() {
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.8,
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
      isRect: Math.random() > 0.5,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: `${p.y}vh`, x: `${p.x}vw`, opacity: 1, scale: 0.5, rotate: 0 }}
          animate={{ y: '110vh', opacity: [1, 1, 0], scale: 1, rotate: p.rotate + 360 * (2 + Math.random() * 2) }}
          transition={{ duration: 2.5 + Math.random() * 1.5, delay: p.delay, ease: 'easeIn' }}
          className="absolute"
          style={{
            width: p.size,
            height: p.isRect ? p.size * 0.5 : p.size,
            backgroundColor: p.color,
            borderRadius: p.isRect ? 2 : '50%',
          }}
        />
      ))}
    </div>
  );
}

const MESSAGES: Record<string, string> = {
  'first-asset': 'Langkah pertama dalam perjalanan finansialmu dimulai! 🚀',
  '5-assets': 'Portofolio kamu mulai beragam! Terus kembangkan asetmu.',
  '10-tx': 'Kamu rajin mencatat! Konsistensi adalah kunci sukses finansial.',
  '50-tx': 'Wow, 50 transaksi! Kamu sudah sangat disiplin. Luar biasa! 🔥',
  'first-goal': 'Target finansial pertama telah dibuat! Semangat mencapainya!',
  '7-streak': '7 hari berturut-turut mencatat! Kebiasaan baik sedang terbentuk. ⚡',
  '30-streak': '30 hari tanpa henti! Kamu adalah master disiplin finansial. 👑',
  'diversified': 'Portofolio terdiversifikasi! Strategi investasi yang cerdas. 🌈',
};

export function BadgeCelebrationModal() {
  const { unlockedBadge, setUnlockedBadge } = useStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (unlockedBadge) setVisible(true);
  }, [unlockedBadge]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setUnlockedBadge(null), 400);
  };

  return (
    <AnimatePresence>
      {visible && unlockedBadge && (
        <motion.div
          key="badge-celebration"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9990] flex flex-col items-center justify-center"
          style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(19,85,129,0.97) 0%, rgba(7,29,46,0.99) 100%)' }}
          onClick={handleClose}
        >
          <FullScreenConfetti />

          {/* Content */}
          <motion.div
            className="relative z-20 flex flex-col items-center gap-6 px-8 text-center"
            initial={{ scale: 0.5, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Badge emoji with 3D spin */}
            <motion.div
              className="relative"
              animate={{
                rotateY: [0, 360],
                scale: [1, 1.15, 1],
              }}
              transition={{
                rotateY: { duration: 1.2, ease: 'easeInOut', delay: 0.2 },
                scale: { duration: 0.6, delay: 0.2, ease: 'easeOut' },
              }}
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute -inset-8 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(253,204,9,0.3) 0%, transparent 70%)' }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div
                className="h-32 w-32 rounded-[36px] flex items-center justify-center shadow-2xl border border-white/20"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)', backdropFilter: 'blur(20px)' }}
              >
                <span className="text-[64px] drop-shadow-lg select-none">{unlockedBadge.emoji}</span>
              </div>
            </motion.div>

            {/* Badge unlocked label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <p className="text-[11px] text-amber-300/70 font-bold uppercase tracking-[0.15em]">
                🏅 Pencapaian Baru Terbuka!
              </p>
              <h2 className="text-[26px] font-extrabold text-white tracking-tight leading-tight">
                {unlockedBadge.label}
              </h2>
              <p className="text-[13px] text-white/60 leading-relaxed max-w-[260px]">
                {MESSAGES[unlockedBadge.id] ?? 'Selamat atas pencapaian luar biasa ini!'}
              </p>
            </motion.div>

            {/* Stars row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-2"
            >
              {['⭐', '⭐', '⭐'].map((s, i) => (
                <motion.span
                  key={i}
                  className="text-[20px]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.12, type: 'spring', stiffness: 400 }}
                >
                  {s}
                </motion.span>
              ))}
            </motion.div>

            {/* Tap to continue */}
            <motion.button
              onClick={handleClose}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="mt-2 px-8 py-3 rounded-full text-[13px] font-bold text-[#3d2e00] active:scale-95 transition-transform shadow-lg shadow-amber-500/30"
              style={{ background: 'linear-gradient(135deg, #FDCC09 0%, #D4A406 100%)' }}
            >
              Keren! Lanjutkan 🚀
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="text-[10px] text-white/20 -mt-2"
            >
              Ketuk di mana saja untuk menutup
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
