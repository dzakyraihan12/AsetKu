'use client';

import { useState, forwardRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { formatRupiahInput, parseRupiahInput } from '@/lib/utils';

interface CurrencyInputProps {
  label?: string;
  error?: string;
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
  className?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, error, value, onChange, placeholder = '0', className }, ref) => {
    const [displayValue, setDisplayValue] = useState(() => {
      if (value && value > 0) return formatRupiahInput(String(value));
      return '';
    });

    useEffect(() => {
      if (value !== undefined && value > 0) {
        setDisplayValue(formatRupiahInput(String(value)));
      } else if (value === 0) {
        setDisplayValue('');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const formatted = formatRupiahInput(raw);
      setDisplayValue(formatted);
      onChange?.(parseRupiahInput(formatted));
    };

    return (
      <div className="space-y-1.5">
        {label && <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide">{label}</label>}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-muted-foreground/50">Rp</span>
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={cn(
              'flex h-11 w-full rounded-2xl bg-surface-secondary pl-10 pr-4 text-[13px] font-medium',
              'transition-all border border-border/30',
              'placeholder:text-muted-foreground/30',
              'focus:outline-none focus:bg-surface focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:shadow-sm',
              error && 'border-destructive/40 focus:border-destructive/40 focus:ring-destructive/10',
              className
            )}
          />
        </div>
        {error && <p className="text-[10px] text-destructive font-medium">{error}</p>}
      </div>
    );
  }
);
CurrencyInput.displayName = 'CurrencyInput';
