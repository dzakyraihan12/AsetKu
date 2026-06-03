'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  className?: string;
  variant?: 'default' | 'success' | 'gradient' | 'white';
  size?: 'xs' | 'sm' | 'md';
}

export function ProgressBar({ value, className, variant = 'default', size = 'sm' }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div className={cn(
      'w-full rounded-full overflow-hidden',
      size === 'xs' ? 'h-[3px]' : size === 'sm' ? 'h-1.5' : 'h-2',
      variant === 'white' ? 'bg-white/12' : 'bg-surface-secondary',
      className
    )}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'h-full rounded-full',
          variant === 'success' && 'bg-success',
          variant === 'default' && 'bg-primary',
          variant === 'gradient' && 'gradient-bg',
          variant === 'white' && 'bg-white/80',
        )}
      />
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  color?: string;
}

export function CircularProgress({ value, size = 40, strokeWidth = 3, className, showLabel = true, color }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;
  const isNearComplete = clamped >= 80 && clamped < 100;

  return (
    <div className={cn('relative inline-flex items-center justify-center shrink-0', isNearComplete && 'animate-[pulse-soft_2s_ease-in-out_infinite]', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color || (isNearComplete ? '#FDCC09' : "hsl(var(--primary))")}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
        />
      </svg>
      {showLabel && (
        <span className={cn('absolute text-micro font-bold number-display', isNearComplete && 'text-amber-600 dark:text-amber-400')}>{Math.round(clamped)}%</span>
      )}
    </div>
  );
}
