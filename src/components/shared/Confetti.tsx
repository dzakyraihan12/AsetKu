'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiProps {
  active: boolean;
}

const COLORS = ['#FDCC09', '#24AAE1', '#10B981', '#EC4899', '#8B5CF6', '#F97316'];

export function Confetti({ active }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number; size: number }>>([]);

  useEffect(() => {
    if (active) {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.3,
        size: 4 + Math.random() * 4,
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => setParticles([]), 2000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: -10, x: `${p.x}%`, opacity: 1, scale: 0 }}
              animate={{ y: '100%', opacity: 0, scale: 1, rotate: Math.random() * 360 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 + Math.random(), delay: p.delay, ease: 'easeOut' }}
              className="absolute rounded-sm"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
