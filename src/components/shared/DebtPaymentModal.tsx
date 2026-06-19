'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Receipt, CreditCard, Calendar, FileText } from 'lucide-react';
import { useStore } from '@/store';
import { formatCurrency, formatCompact } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface DebtPaymentModalProps {
  open: boolean;
  onClose: () => void;
}

export function DebtPaymentModal({ open, onClose }: DebtPaymentModalProps) {
  const { debts, addDebtPayment, getDebtRemainingBalance } = useStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState('');
  const [paymentType, setPaymentType] = useState<'installment' | 'extra'>('installment');
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const selectedDebt = useMemo(() => debts.find(d => d.id === selectedDebtId) || null, [debts, selectedDebtId]);
  const remainingBalance = useMemo(() => selectedDebt ? getDebtRemainingBalance(selectedDebt.id) : 0, [selectedDebt, getDebtRemainingBalance]);

  const activeDebts = useMemo(() => debts.filter(d => getDebtRemainingBalance(d.id) > 0), [debts, getDebtRemainingBalance]);

  // Auto-set amount for installment payments
  useEffect(() => {
    if (selectedDebt && paymentType === 'installment') {
      setAmount(selectedDebt.monthlyInstallment);
    } else if (paymentType === 'extra') {
      setAmount(0);
    }
  }, [selectedDebt, paymentType]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedDebtId('');
      setPaymentType('installment');
      setAmount(0);
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtId || amount <= 0) {
      toast('Pilih hutang dan masukkan jumlah pembayaran', 'error');
      return;
    }
    if (amount > remainingBalance) {
      toast('Jumlah melebihi sisa hutang', 'error');
      return;
    }

    setLoading(true);
    haptic('medium');
    try {
      await addDebtPayment({ debtId: selectedDebtId, amount, type: paymentType, notes, date });
      haptic('heavy');
      toast(paymentType === 'installment' ? '✅ Cicilan berhasil dicatat!' : '✅ Pembayaran extra berhasil!');
      onClose();
    } catch (error) {
      toast('Gagal mencatat pembayaran', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Preview after payment
  const afterPayment = remainingBalance - amount;

  return (
    <Modal open={open} onClose={onClose} title="Bayar Cicilan Hutang" preventClose={amount > 0 && !!selectedDebtId}>
      {activeDebts.length === 0 ? (
        <div className="text-center py-10">
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-[40px] mb-3"
          >
            🎉
          </motion.div>
          <p className="text-[14px] font-bold">Tidak Ada Hutang Aktif</p>
          <p className="text-[11px] text-muted-foreground/50 mt-1.5 leading-relaxed max-w-[200px] mx-auto">
            Semua hutang sudah lunas atau belum ada hutang yang dicatat. Mantap!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Debt Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide">Pilih Hutang</label>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar">
              {activeDebts.map((debt) => {
                const balance = getDebtRemainingBalance(debt.id);
                const isSelected = selectedDebtId === debt.id;
                return (
                  <button
                    key={debt.id}
                    type="button"
                    onClick={() => { setSelectedDebtId(debt.id); haptic('light'); }}
                    className={cn(
                      'w-full p-3 rounded-2xl border text-left transition-all press-scale',
                      isSelected
                        ? 'border-primary/40 bg-primary/5 shadow-sm'
                        : 'border-border/30 bg-surface-secondary/30 hover:border-border/50'
                    )}
                    disabled={loading}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[12px] font-semibold truncate">{debt.name}</p>
                      <div className={cn('h-3 w-3 rounded-full border-2 transition-all', isSelected ? 'bg-primary border-primary' : 'border-border/40')} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/50">
                      <span>Sisa: <span className="font-bold text-red-500 dark:text-red-400 number-display">{formatCompact(balance)}</span></span>
                      <span>Cicilan: {formatCompact(debt.monthlyInstallment)}/bln</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDebt && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Payment Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide">Jenis Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'installment' as const, label: 'Cicilan Rutin', desc: formatCompact(selectedDebt.monthlyInstallment), color: 'emerald' },
                    { id: 'extra' as const, label: 'Bayar Lebih', desc: 'Custom amount', color: 'blue' },
                  ]).map(({ id, label, desc, color }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { setPaymentType(id); haptic('light'); }}
                      className={cn(
                        'p-3 rounded-2xl border text-center transition-all press-scale',
                        paymentType === id
                          ? `border-${color}-500/40 bg-${color}-500/5`
                          : 'border-border/30 bg-surface-secondary/30'
                      )}
                      disabled={loading}
                    >
                      <p className={cn('text-[11px] font-bold', paymentType === id ? `text-${color}-600 dark:text-${color}-400` : 'text-muted-foreground/60')}>
                        {label}
                      </p>
                      <p className="text-[9px] text-muted-foreground/40 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <CurrencyInput
                label="Jumlah Pembayaran"
                value={amount}
                onChange={setAmount}
                placeholder="0"
              />
              {paymentType === 'installment' && (
                <p className="text-[9px] text-muted-foreground/40 -mt-2">Jumlah otomatis sesuai cicilan bulanan</p>
              )}

              {/* Preview */}
              {amount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl border',
                    afterPayment <= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-surface-secondary/30 border-border/20'
                  )}
                >
                  <span className="text-[10px] text-muted-foreground/50 font-medium">Sisa setelah bayar</span>
                  <span className={cn('text-[13px] font-bold number-display', afterPayment <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground')}>
                    {afterPayment <= 0 ? '🎉 LUNAS' : formatCurrency(afterPayment)}
                  </span>
                </motion.div>
              )}

              {/* Date */}
              <div>
                <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide block mb-1.5">Tanggal</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border/30 bg-surface-secondary/30 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide block mb-1.5">
                  Catatan <span className="text-muted-foreground/30">(opsional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Transfer via BCA..."
                  className="w-full px-3 py-3 rounded-2xl border border-border/30 bg-surface-secondary/30 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none h-14"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                variant="gold"
                className="w-full"
                size="lg"
                disabled={loading || !selectedDebtId || amount <= 0}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Bayar Cicilan'}
              </Button>
            </motion.div>
          )}
        </form>
      )}
    </Modal>
  );
}
