'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

/**
 * Animates number changes with ease-out cubic transition.
 * Use `format` prop to apply formatCompact/formatCurrency.
 */
export function AnimatedNumber({ value, format, duration = 600, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = value - start;
    if (diff === 0) { setDisplay(value); return; }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplay(Math.round(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(value);
        prevRef.current = value;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  // Update prevRef when animation completes
  useEffect(() => { prevRef.current = value; }, [value]);

  return <span className={className}>{format ? format(display) : display.toLocaleString('id-ID')}</span>;
}
