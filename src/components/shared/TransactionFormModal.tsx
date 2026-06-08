'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/FormElements';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';

const schema = z.object({
  amount: z.number().min(1, 'Nominal minimal 1'),
  notes: z.string().default(''),
  date: z.string().min(1, 'Tanggal wajib diisi'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  assetId: string;
  type: 'add' | 'subtract';
}

export function TransactionFormModal({ open, onClose, assetId, type }: Props) {
  const { addTransaction, getAssetValue, assets, transactions } = useStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { control, register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, date: new Date().toISOString().split('T')[0], notes: '' },
  });

  const watchedAmount = useWatch({ control, name: 'amount' });
  const watchedNotes = useWatch({ control, name: 'notes' });
  const currentValue = getAssetValue(assetId);
  const assetName = assets.find(a => a.id === assetId)?.name ?? '';
  const previewValue = type === 'add'
    ? currentValue + (watchedAmount || 0)
    : currentValue - (watchedAmount || 0);

  // Recent notes suggestions
  const recentNotes = useMemo(() => {
    const notesSet = new Set<string>();
    const sorted = [...transactions]
      .filter(t => t.notes && t.notes.trim())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    for (const tx of sorted) {
      if (notesSet.size >= 5) break;
      notesSet.add(tx.notes);
    }
    return Array.from(notesSet);
  }, [transactions]);

  const filteredSuggestions = useMemo(() => {
    if (!watchedNotes || watchedNotes.length < 1) return recentNotes.slice(0, 4);
    return recentNotes.filter(n => n.toLowerCase().includes(watchedNotes.toLowerCase())).slice(0, 3);
  }, [recentNotes, watchedNotes]);

  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addTransaction({ assetId, type, amount: data.amount, notes: data.notes, date: data.date });
      toast(type === 'add' ? 'Nilai berhasil ditambahkan' : 'Nilai berhasil dikurangi', type === 'add' ? 'success' : 'info');
      reset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={type === 'add' ? 'Tambah Nilai' : 'Kurangi Nilai'} preventClose={watchedAmount > 0}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Asset name context */}
        {assetName && (
          <div className="flex items-center gap-2 -mt-1 pb-1">
            <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${type === 'add' ? 'bg-success/10' : 'bg-destructive/10'}`}>
              {type === 'add'
                ? <span className="text-[10px]">📈</span>
                : <span className="text-[10px]">📉</span>
              }
            </div>
            <div>
              <span className="text-[12px] font-semibold">{assetName}</span>
              <span className="text-[10px] text-muted-foreground/40 ml-2">Saat ini: {formatCurrency(currentValue)}</span>
            </div>
          </div>
        )}

        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              label="Nominal"
              placeholder="1.000.000"
              value={field.value}
              onChange={field.onChange}
              error={errors.amount?.message}
            />
          )}
        />

        {/* Real-time preview */}
        {watchedAmount > 0 && (
          <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
            type === 'add'
              ? 'bg-success/5 border-success/15'
              : previewValue < 0
                ? 'bg-destructive/5 border-destructive/30'
                : 'bg-destructive/5 border-destructive/15'
          }`}>
            <span className="text-[10px] text-muted-foreground/50 font-medium">Nilai setelah transaksi</span>
            <span className={`text-[13px] font-bold number-display ${
              type === 'add' ? 'text-success' : previewValue < 0 ? 'text-destructive' : 'text-foreground'
            }`}>
              {formatCurrency(Math.max(previewValue, 0))}
            </span>
          </div>
        )}

        {/* Subtract warning — value will go negative */}
        {type === 'subtract' && watchedAmount > 0 && previewValue < 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/8 border border-destructive/20">
            <span className="text-[12px]">⚠️</span>
            <span className="text-[10px] font-medium text-destructive">Nominal melebihi saldo aset. Nilai akan menjadi negatif.</span>
          </div>
        )}

        <Input label="Tanggal" type="date" {...register('date')} error={errors.date?.message} />

        <div className="space-y-1.5">
          <Textarea label="Catatan (opsional)" placeholder="Contoh: Gaji bulan Juni" {...register('notes')} />
          {/* Note suggestions */}
          {filteredSuggestions.length > 0 && !watchedNotes && (
            <div className="flex flex-wrap gap-1.5">
              {filteredSuggestions.map((note) => (
                <button
                  key={note}
                  type="button"
                  onClick={() => setValue('notes', note)}
                  className="px-2.5 py-1 rounded-full bg-surface-secondary border border-border/20 text-[9px] font-medium text-muted-foreground/60 hover:bg-surface-secondary/80 active:scale-95 transition-all truncate max-w-[140px]"
                >
                  {note}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          variant={type === 'add' ? 'gold' : 'destructive'}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (type === 'add' ? '+ Tambah Nilai' : '- Kurangi Nilai')}
        </Button>
      </form>
    </Modal>
  );
}
