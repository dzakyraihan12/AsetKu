'use client';

import { motion } from 'framer-motion';

export function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #071d2e 0%, #0d3553 30%, #135581 60%, #1a7bb5 85%, #24AAE1 100%)',
      }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Ambient glow effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full bg-sky-400/[0.07] blur-3xl" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[250px] h-[250px] rounded-full bg-blue-600/[0.08] blur-3xl" />

      {/* Logo + Text */}
      <motion.div
        className="flex flex-col items-center gap-5 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo with glow */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-[26px] bg-white/10 blur-xl scale-125" />
          <div className="relative h-24 w-24 rounded-[26px] overflow-hidden shadow-2xl shadow-black/30 border border-white/10">
            <img src="/icon-192.png" alt="AsetKu" className="h-full w-full object-cover" />
          </div>
        </motion.div>

        {/* App name */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-[26px] font-extrabold text-white tracking-tight">AsetKu</h1>
          <p className="text-[12px] text-white/35 font-medium mt-1 tracking-wide">Personal Wealth Tracker</p>
        </motion.div>
      </motion.div>

      {/* Bottom loading indicator */}
      <motion.div
        className="absolute bottom-20 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-white/50"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
