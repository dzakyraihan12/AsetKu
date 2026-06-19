'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, TrendingDown, Receipt, Percent, Clock } from 'lucide-react';
import { useStore } from '@/store';
import { formatCurrency, formatCompact, formatRelativeDate } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import type { Debt } from '@/types';

interface Props {
  debt: Debt | null;
  onClose: () => void;
}

export function DebtDetailModal({ debt, onClose }: Props) {
  const { debtPayments, getDebtRemainingBalance, getDebtPaidAmount } = useStore();

  const payments = useMemo(() => {
    if (!debt) return [];
    return debtPayments
      .filter(p => p.debtId === debt.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [debt, debtPayments]);

  if (!debt) return null;

  const remaining = getDebtRemainingBalance(debt.id);
  const paid = getDebtPaidAmount(debt.id);
  const progress = debt.totalAmount > 0 ? (paid / debt.totalAmount) * 100 : 0;
  const isCompleted = remaining === 0;

  return (
    <Modal open={!!debt} onClose={onClose} title={debt.name}>
      <div className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground/50 font-medium">Progress pelunasan</span>
            <span className={`text-[12px] font-extrabold number-display ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-surface-secondary overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-secondary/30 rounded-2xl p-3 border border-border/10">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3 w-3 text-red-500/60" />
              <span className="text-[9px] text-muted-foreground/40 uppercase font-bold">Sisa Hutang</span>
            </div>
            <p className={`text-[14px] font-extrabold number-display ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {isCompleted ? 'LUNAS' : formatCompact(remaining)}
            </p>
          </div>
          <div className="bg-surface-secondary/30 rounded-2xl p-3 border border-border/10">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="h-3 w-3 text-emerald-500/60" />
              <span className="text-[9px] text-muted-foreground/40 uppercase font-bold">Terbayar</span>
            </div>
            <p className="text-[14px] font-extrabold number-display text-emerald-600 dark:text-emerald-400">
              {formatCompact(paid)}
            </p>
          </div>
          <div className="bg-surface-secondary/30 rounded-2xl p-3 border border-border/10">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3 w-3 text-primary/60" />
              <span className="text-[9px] text-muted-foreground/40 uppercase font-bold">Cicilan/Bulan</span>
            </div>
            <p className="text-[14px] font-extrabold number-display">
              {formatCompact(debt.monthlyInstallment)}
            </p>
          </div>
          <div className="bg-surface-secondary/30 rounded-2xl p-3 border border-border/10">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3 w-3 text-amber-500/60" />
              <span className="text-[9px] text-muted-foreground/40 uppercase font-bold">Sisa Tenor</span>
            </div>
            <p className="text-[14px] font-extrabold number-display">
              {debt.remainingMonths} <span className="text-[10px] text-muted-foreground/40">bulan</span>
            </p>
          </div>
        </div>

        {/* Extra Info */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
          <span>Total awal: <span className="font-bold text-foreground/70">{formatCompact(debt.totalAmount)}</span></span>
          {debt.interestRate ? (
            <span className="flex items-center gap-1">
              <Percent className="h-2.5 w-2.5" /> Bunga: {debt.interestRate}%/thn
            </span>
          ) : null}
        </div>

        {debt.notes && (
          <div className="bg-surface-secondary/20 rounded-xl px-3 py-2 border border-border/10">
            <p className="text-[10px] text-muted-foreground/50">{debt.notes}</p>
          </div>
        )}

        {/* Payment History */}
        <div>
          <h3 className="text-[12px] font-bold mb-2">Riwayat Pembayaran ({payments.length})</h3>
          {payments.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/40 text-center py-4">Belum ada pembayaran</p>
          ) : (
            <div className="space-y-1 max-h-[200px] overflow-y-auto no-scrollbar">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-surface-secondary/30">
                  <div className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${p.type === 'installment' ? 'bg-emerald-500/8' : 'bg-blue-500/8'}`}>
                      <Receipt className={`h-3 w-3 ${p.type === 'installment' ? 'text-emerald-500' : 'text-blue-500'}`} />
                    </div>
                    <div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${p.type === 'installment' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                        {p.type === 'installment' ? 'Cicilan' : 'Extra'}
                      </span>
                      <p className="text-[9px] text-muted-foreground/30 mt-0.5">{formatRelativeDate(p.date)}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 number-display">
                    −{formatCompact(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
