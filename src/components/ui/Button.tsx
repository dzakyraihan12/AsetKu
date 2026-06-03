import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'accent' | 'gold';
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      haptic('light');
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 font-semibold transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
          'disabled:opacity-30 disabled:pointer-events-none',
          'active:scale-[0.96]',
          {
            'btn-gradient text-white rounded-full shadow-md shadow-sky-900/20 hover:brightness-110 font-bold': variant === 'primary' || variant === 'accent',
            'bg-surface-secondary text-foreground rounded-full border border-border/40 hover:bg-surface-tertiary': variant === 'secondary',
            'text-muted-foreground hover:text-foreground hover:bg-surface-secondary rounded-full': variant === 'ghost',
            'bg-destructive text-destructive-foreground rounded-full': variant === 'destructive',
            'btn-gold text-[#3d2e00] rounded-full shadow-md shadow-amber-500/25 hover:brightness-105 font-bold': variant === 'gold',
          },
          {
            'h-7 px-2.5 text-[10px]': size === 'xs',
            'h-8 px-3.5 text-[11px]': size === 'sm',
            'h-10 px-5 text-[12px]': size === 'md',
            'h-11 px-6 text-[13px]': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
