import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'ghost' | 'interactive' | 'hero';
}

export function Card({ className, children, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl transition-all',
        {
          'bg-surface border border-border/20 shadow-card p-3': variant === 'default',
          'bg-surface shadow-elevated border border-border/10 p-3': variant === 'elevated',
          'bg-transparent p-0': variant === 'ghost',
          'bg-surface border border-border/20 shadow-card press-scale cursor-pointer hover:shadow-elevated p-3': variant === 'interactive',
          'hero-gradient text-white p-4 shadow-hero wealth-card': variant === 'hero',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
