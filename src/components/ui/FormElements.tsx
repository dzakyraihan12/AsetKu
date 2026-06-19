'use client';

import { cn } from '@/lib/utils';
import { forwardRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import * as SelectPrimitive from '@radix-ui/react-select';

// ─── Input ────────────────────────────────────────────────────────────────────

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
          'flex h-9 w-full rounded-2xl bg-surface-secondary px-3.5 text-[11px] font-medium',
          'transition-all border border-border/30',
          'placeholder:text-muted-foreground/25 placeholder:text-[11px]',
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

// ─── Select (shadcn/Radix based) ─────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, value, onChange, name, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState((value as string) || '');

    const handleChange = (newValue: string) => {
      const actual = newValue === '__none__' ? '' : newValue;
      setInternalValue(actual);
      if (onChange) {
        const event = { target: { value: actual, name } } as React.ChangeEvent<HTMLSelectElement>;
        onChange(event);
      }
    };

    const currentValue = (value as string) ?? internalValue;
    const radixValue = currentValue || undefined;

    return (
      <div className="space-y-1.5">
        {label && <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide">{label}</label>}
        <SelectPrimitive.Root value={radixValue} onValueChange={handleChange}>
          <SelectPrimitive.Trigger
            className={cn(
              'flex h-11 w-full items-center justify-between rounded-xl bg-surface-secondary px-4 text-[13px] font-medium',
              'transition-all border border-border/40 shadow-sm',
              'focus:outline-none focus:bg-surface focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus:shadow-md',
              'data-[placeholder]:text-muted-foreground/40',
              className
            )}
          >
            <SelectPrimitive.Value placeholder="Pilih..." />
            <SelectPrimitive.Icon>
              <ChevronDown className="h-4 w-4 text-muted-foreground/40" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className="z-[200] overflow-hidden rounded-2xl bg-surface border border-border/30 shadow-elevated animate-in fade-in-0 zoom-in-95"
              position="popper"
              sideOffset={4}
              align="start"
            >
              <SelectPrimitive.Viewport className="p-1.5 max-h-[240px]">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value || '__none__'}
                    value={option.value || '__none__'}
                    className={cn(
                      'relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-medium cursor-pointer',
                      'outline-none select-none',
                      'data-[highlighted]:bg-primary/8 data-[highlighted]:text-primary',
                      'data-[state=checked]:font-bold'
                    )}
                  >
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </SelectPrimitive.ItemIndicator>
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
        {/* Hidden native select for form registration */}
        <select ref={ref} name={name} value={currentValue} onChange={() => {}} className="hidden" {...props}>
          <option value="">Pilih...</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {error && <p className="text-[10px] text-destructive font-medium mt-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ─── Textarea ─────────────────────────────────────────────────────────────────

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
          'flex min-h-[64px] w-full rounded-xl bg-surface-secondary px-3.5 py-2.5 text-[11px] font-medium resize-none',
          'transition-all border border-border/40 shadow-sm',
          'placeholder:text-muted-foreground/30',
          'focus:outline-none focus:bg-surface focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus:shadow-md',
          error && 'border-destructive/40',
          className
        )}
        {...props}
      />
      {error && <p className="text-[10px] text-destructive font-medium mt-1">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';
