'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Calendar, DollarSign, Receipt, Edit3, Trash2, TrendingDown, BarChart3, AlertCircle, Filter } from 'lucide-react';
import { useStore } from '@/store';
import { formatCurrency, formatCompact, formatRelativeDate } from '@/lib/utils';
import { PageLayout } from '@/components/layout/PageLayout';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DebtFormModal } from '@/components/shared/DebtFormModal';
import { DebtPaymentModal } from '@/components/shared/DebtPaymentModal';
import { DebtDetailModal } from '@/components/shared/DebtDetailModal';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import type { Debt } from '@/types';

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { show: { transition: { staggerChildren: 0.04 } } };

export function DebtsPage() {
  const {
    debts, debtPayments,
    getTotalDebtBalance, getTotalDebtOriginal,
    getDebtRemainingBalance, getDebtPaidAmount,
    deleteDebt, isLoading,
  } = useStore();
  const { toast } = useToast();

  const [showDebtForm, setShowDebtForm] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [deleteDebtId, setDeleteDebtId] = useState<string | null>(null);
  const [detailDebt, setDetailDebt] = useState<Debt | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const totalDebtBalance = getTotalDebtBalance();
  const totalDebtOriginal = getTotalDebtOriginal();
  const totalPaidAmount = totalDebtOriginal - totalDebtBalance;
  const paymentProgress = totalDebtOriginal > 0 ? (totalPaidAmount / totalDebtOriginal) * 100 : 0;

  // Filtered debts
  const filteredDebts = useMemo(() => {
    if (filter === 'active') return debts.filter(d => getDebtRemainingBalance(d.id) > 0);
    if (filter === 'completed') return debts.filter(d => getDebtRemainingBalance(d.id) === 0);
    return debts;
  }, [debts, filter, getDebtRemainingBalance]);

  // Recent payments
  const recentPayments = useMemo(() => {
    return [...debtPayments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  }, [debtPayments]);

  // Debt stats
  const debtStats = useMemo(() => {
    const activeDebts = debts.filter(d => getDebtRemainingBalance(d.id) > 0);
    const completedDebts = debts.filter(d => getDebtRemainingBalance(d.id) === 0);
    const monthlyInstallments = activeDebts.reduce((sum, d) => sum + d.monthlyInstallment, 0);
    return { active: activeDebts.length, completed: completedDebts.length, monthlyInstallments };
  }, [debts, getDebtRemainingBalance]);

  // Payment calendar - count payments per month (last 6 months)
  const paymentCalendar = useMemo(() => {
    const now = new Date();
    const months: { label: string; count: number; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'short' });
      const monthPayments = debtPayments.filter(p => p.date.startsWith(key));
      months.push({ label, count: monthPayments.length, amount: monthPayments.reduce((s, p) => s + p.amount, 0) });
    }
    return months;
  }, [debtPayments]);

  // Next payment reminder
  const nextPaymentReminder = useMemo(() => {
    const activeDebts = debts.filter(d => getDebtRemainingBalance(d.id) > 0);
    if (activeDebts.length === 0) return null;
    const now = new Date();
    const dayOfMonth = now.getDate();
    // Remind if within first 5 days of month
    if (dayOfMonth <= 5) {
      const unpaid = activeDebts.filter(d => {
        const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const paid = debtPayments.some(p => p.debtId === d.id && p.date.startsWith(key));
        return !paid;
      });
      return unpaid.length > 0 ? unpaid : null;
    }
    return null;
  }, [debts, debtPayments, getDebtRemainingBalance]);

  const handleDelete = async () => {
    if (!deleteDebtId) return;
    await deleteDebt(deleteDebtId);
    setDeleteDebtId(null);
    haptic('medium');
    toast('Hutang berhasil dihapus', 'info');
  };

  const headerContent = (
    <>
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-white/80" />
        <h1 className="text-[16px] font-extrabold text-white tracking-tight">Hutang</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="bg-white/[0.08] backdrop-blur-md rounded-2xl p-3 border border-white/[0.08]">
          <p className="text-[8px] text-white/30 uppercase font-bold mb-1">Sisa Hutang</p>
          <p className="text-[16px] font-extrabold text-red-300 number-display">
            <AnimatedNumber value={totalDebtBalance} format={formatCompact} />
          </p>
          {totalDebtOriginal > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-emerald-400/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${paymentProgress}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="text-[8px] text-emerald-300/60 font-bold">{Math.round(paymentProgress)}%</span>
            </div>
          )}
        </div>
        <div className="bg-white/[0.08] backdrop-blur-md rounded-2xl p-3 border border-white/[0.08]">
          <p className="text-[8px] text-white/30 uppercase font-bold mb-1">Cicilan/Bulan</p>
          <p className="text-[16px] font-extrabold text-white number-display">
            <AnimatedNumber value={debtStats.monthlyInstallments} format={formatCompact} />
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-[9px] text-white/35">
              {debtStats.active} aktif · {debtStats.completed} lunas
            </span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <PageLayout pageKey="debts" headerContent={headerContent}>
      <motion.div className="pb-4" initial="hidden" animate="show" variants={stagger}>

        {/* Quick Actions */}
        <motion.section variants={fadeUp} className="px-4 mt-3">
          <div className="flex gap-2">
            <button
              onClick={() => { setEditDebt(null); setShowDebtForm(true); haptic('light'); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white press-scale shadow-sm shadow-red-500/20 hover:brightness-110 transition-all"
            >
              <Plus className="h-3.5 w-3.5 text-white/90" />
              <span className="text-[10px] font-bold text-white/90">Tambah Hutang</span>
            </button>
            <button
              onClick={() => { setShowPaymentForm(true); haptic('light'); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white press-scale shadow-sm shadow-emerald-500/20 hover:brightness-110 transition-all"
            >
              <Receipt className="h-3.5 w-3.5 text-white/90" />
              <span className="text-[10px] font-bold text-white/90">Bayar Cicilan</span>
            </button>
          </div>
        </motion.section>

        {/* Payment Reminder */}
        {nextPaymentReminder && nextPaymentReminder.length > 0 && (
          <motion.section variants={fadeUp} className="px-4 mt-3">
            <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 px-3 py-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Pengingat Cicilan</p>
              </div>
              <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70">
                {nextPaymentReminder.length} hutang belum dibayar bulan ini: {nextPaymentReminder.map(d => d.name).join(', ')}
              </p>
            </div>
          </motion.section>
        )}

        {/* Progress Overview */}
        {totalDebtOriginal > 0 && (
          <motion.section variants={fadeUp} className="px-4 mt-3">
            <div className="card-elevated p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[12px] font-bold">Progress Pelunasan</h3>
                <span className="text-[12px] font-extrabold text-emerald-600 dark:text-emerald-400 number-display">
                  {Math.round(paymentProgress)}%
                </span>
              </div>
              <div className="mb-3">
                <div className="h-2.5 rounded-full bg-surface-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${paymentProgress}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[8px] text-muted-foreground/40 font-medium uppercase">Terbayar</p>
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 number-display">
                    {formatCompact(totalPaidAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] text-muted-foreground/40 font-medium uppercase">Sisa</p>
                  <p className="text-[11px] font-bold text-red-600 dark:text-red-400 number-display">
                    {formatCompact(totalDebtBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] text-muted-foreground/40 font-medium uppercase">Total Awal</p>
                  <p className="text-[11px] font-bold number-display">
                    {formatCompact(totalDebtOriginal)}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Payment Calendar (last 6 months) */}
        {debtPayments.length > 0 && (
          <motion.section variants={fadeUp} className="px-4 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-[12px] font-bold">Riwayat Cicilan</span>
            </div>
            <div className="card-elevated p-3">
              <div className="flex gap-1.5">
                {paymentCalendar.map((m, i) => {
                  const maxAmount = Math.max(...paymentCalendar.map(x => x.amount), 1);
                  const height = m.amount > 0 ? Math.max((m.amount / maxAmount) * 40, 6) : 2;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="h-10 flex items-end justify-center w-full">
                        <motion.div
                          className={`w-full rounded-t-md ${m.amount > 0 ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' : 'bg-surface-secondary'}`}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}px` }}
                          transition={{ duration: 0.4, delay: i * 0.05 }}
                        />
                      </div>
                      <span className="text-[8px] text-muted-foreground/40 font-bold">{m.label}</span>
                      {m.amount > 0 && (
                        <span className="text-[7px] text-emerald-600 dark:text-emerald-400 font-bold number-display">{formatCompact(m.amount)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>
        )}

        {/* Debt Comparison */}
        {debts.length > 1 && (
          <motion.section variants={fadeUp} className="px-4 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-[12px] font-bold">Perbandingan Hutang</span>
            </div>
            <div className="card-elevated p-3 space-y-2">
              {debts.map((debt) => {
                const remaining = getDebtRemainingBalance(debt.id);
                const pct = debt.totalAmount > 0 ? ((debt.totalAmount - remaining) / debt.totalAmount) * 100 : 0;
                return (
                  <div key={debt.id} className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground/50 w-20 truncate font-medium">{debt.name}</span>
                    <div className="flex-1 h-4 rounded-md bg-surface-secondary overflow-hidden">
                      <motion.div
                        className={`h-full rounded-md ${remaining === 0 ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                    <span className="text-[8px] font-bold number-display w-10 text-right text-muted-foreground/50">
                      {remaining === 0 ? '✓' : `${Math.round(pct)}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Filter */}
        {debts.length > 0 && (
          <motion.section variants={fadeUp} className="px-4 mt-3">
            <div className="flex gap-1.5">
              {(['all', 'active', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); haptic('light'); }}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                    filter === f ? 'btn-gradient text-white shadow-sm shadow-sky-900/15' : 'bg-surface border border-border/40 text-muted-foreground/60'
                  }`}
                >
                  {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Lunas'}
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {/* Debt List */}
        {filteredDebts.length > 0 ? (
          <motion.section variants={fadeUp} className="px-4 mt-3">
            <h3 className="text-[12px] font-bold mb-2">Daftar Hutang</h3>
            <div className="space-y-2">
              {filteredDebts.map((debt) => {
                const remainingBalance = getDebtRemainingBalance(debt.id);
                const paidAmount = getDebtPaidAmount(debt.id);
                const progress = debt.totalAmount > 0 ? (paidAmount / debt.totalAmount) * 100 : 0;
                const isCompleted = remainingBalance === 0;

                return (
                  <motion.div
                    key={debt.id}
                    variants={fadeUp}
                    layout
                    className="card-elevated p-3 press-scale cursor-pointer"
                    onClick={() => { setDetailDebt(debt); haptic('light'); }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[12px] font-semibold truncate">{debt.name}</h4>
                          {isCompleted && <span className="chip-success !px-1.5 !py-0 !text-[7px]">Lunas</span>}
                        </div>
                        {debt.notes && <p className="text-[9px] text-muted-foreground/40 mt-0.5 truncate">{debt.notes}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditDebt(debt); setShowDebtForm(true); haptic('light'); }}
                          className="p-1.5 rounded-lg hover:bg-surface-secondary/50 transition-colors"
                        >
                          <Edit3 className="h-3 w-3 text-muted-foreground/40" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteDebtId(debt.id); haptic('light'); }}
                          className="p-1.5 rounded-lg hover:bg-destructive/5 transition-colors"
                        >
                          <Trash2 className="h-3 w-3 text-destructive/40" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-2.5">
                      <div>
                        <p className="text-[8px] text-muted-foreground/30 font-medium">Sisa Hutang</p>
                        <p className={`text-[11px] font-bold number-display ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isCompleted ? 'Lunas!' : formatCompact(remainingBalance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground/30 font-medium">Cicilan</p>
                        <p className="text-[11px] font-bold number-display">{formatCompact(debt.monthlyInstallment)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground/30 font-medium">Sisa Tenor</p>
                        <p className="text-[11px] font-bold number-display">{debt.remainingMonths} bln</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] text-muted-foreground/30 font-medium">Progress</span>
                        <span className="text-[8px] font-bold number-display">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        ) : (
          <motion.section variants={fadeUp} className="px-4 mt-8">
            <div className="card-elevated p-6 text-center space-y-3">
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="text-[36px]">💳</motion.div>
              <div>
                <p className="text-[14px] font-bold">Belum Ada Hutang</p>
                <p className="text-[11px] text-muted-foreground/50 mt-1 leading-relaxed">
                  Mulai lacak hutang dan cicilan untuk mengelola keuangan dengan lebih baik.
                </p>
              </div>
              <button
                onClick={() => { setShowDebtForm(true); haptic('light'); }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-[11px] font-bold shadow-md shadow-red-500/20 press-scale"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Tambah Hutang Pertama
              </button>
            </div>
          </motion.section>
        )}

        {/* Recent Payments */}
        {recentPayments.length > 0 && (
          <motion.section variants={fadeUp} className="px-4 mt-3 pb-4">
            <h3 className="text-[12px] font-bold mb-2">Pembayaran Terakhir</h3>
            <div className="card-elevated overflow-hidden divide-y divide-border/6">
              {recentPayments.map((payment) => {
                const debt = debts.find(d => d.id === payment.debtId);
                const isInstallment = payment.type === 'installment';
                return (
                  <div key={payment.id} className="flex items-center justify-between py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isInstallment ? 'bg-emerald-500/8' : 'bg-blue-500/8'}`}>
                        <Receipt className={`h-3.5 w-3.5 ${isInstallment ? 'text-emerald-500' : 'text-blue-500'}`} />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold">{debt?.name ?? '—'}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-muted-foreground/30">{formatRelativeDate(payment.date)}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${isInstallment ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                            {isInstallment ? 'Cicilan' : 'Extra'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 number-display">
                      −{formatCompact(payment.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}
      </motion.div>

      {/* Modals */}
      <DebtFormModal open={showDebtForm} onClose={() => { setShowDebtForm(false); setEditDebt(null); }} editDebt={editDebt} />
      <DebtPaymentModal open={showPaymentForm} onClose={() => setShowPaymentForm(false)} />
      <DebtDetailModal debt={detailDebt} onClose={() => setDetailDebt(null)} />
      <ConfirmDialog
        open={!!deleteDebtId}
        title="Hapus Hutang?"
        message="Semua data pembayaran hutang ini akan ikut terhapus. Aksi ini tidak bisa dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDebtId(null)}
      />
    </PageLayout>
  );
}
