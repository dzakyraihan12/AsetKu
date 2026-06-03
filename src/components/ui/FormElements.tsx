import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-2xl bg-surface-secondary px-4 text-[13px] font-medium',
          'transition-all border border-border/30',
          'placeholder:text-muted-foreground/30',
          'focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:shadow-sm',
          error && 'border-destructive/40 focus:border-destructive/40 focus:ring-destructive/10',
          className
        )}
        {...props}
      />
      {error && <p className="text-[10px] text-destructive font-medium">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-2xl bg-surface-secondary px-4 text-[13px] font-medium appearance-none',
          'transition-all border border-border/30',
          'focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:shadow-sm',
          className
        )}
        {...props}
      >
        <option value="">Pilih...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-[10px] text-destructive font-medium">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[80px] w-full rounded-2xl bg-surface-secondary px-4 py-3 text-[13px] font-medium resize-none',
          'transition-all border border-border/30',
          'placeholder:text-muted-foreground/30',
          'focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:shadow-sm',
          error && 'border-destructive/40',
          className
        )}
        {...props}
      />
      {error && <p className="text-[10px] text-destructive font-medium">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';
