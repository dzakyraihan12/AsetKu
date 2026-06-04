'use client';

import { motion } from 'framer-motion';

export function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        height: 'var(--app-height, 100dvh)',
        background: 'linear-gradient(160deg, #061a2b 0%, #0a2d4a 25%, #135581 55%, #1d8fbf 80%, #24AAE1 100%)',
      }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Animated background orbs */}
      <motion.div
        className="absolute top-[10%] right-[-5%] w-[280px] h-[280px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(36,170,225,0.12) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[5%] left-[-8%] w-[220px] h-[220px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(19,85,129,0.15) 0%, transparent 70%)' }}
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      <motion.div
        className="absolute top-[40%] left-[15%] w-[150px] h-[150px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 60%)' }}
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          className="relative"
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute -inset-4 rounded-[32px]"
            style={{ background: 'radial-gradient(circle, rgba(36,170,225,0.2) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Logo container */}
          <div className="relative h-28 w-28 rounded-[30px] overflow-hidden shadow-2xl shadow-black/40 border border-white/[0.12]">
            <img src="/icon-192.png" alt="AsetKu" className="h-full w-full object-cover" />
          </div>
        </motion.div>

        {/* App name */}
        <motion.div
          className="text-center mt-7"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-[28px] font-extrabold text-white tracking-tight">AsetKu</h1>
          <motion.p
            className="text-[12px] text-white/30 font-medium mt-1.5 tracking-[0.05em]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            Personal Wealth Tracker
          </motion.p>
        </motion.div>
      </div>

      {/* Bottom section */}
      <motion.div
        className="absolute bottom-16 flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {/* Shimmer loading bar */}
        <div className="relative h-[3px] w-16 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', width: '50%' }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <p className="text-[10px] text-white/20 font-medium">Memuat data...</p>
      </motion.div>
    </motion.div>
  );
}
