'use client';

import { useState } from 'react';
import { Plus, Target, MoreHorizontal, Edit2, Trash2, Trophy, Calendar, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { formatCompact, calculateProgress } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { CircularProgress, ProgressBar } from '@/components/ui/Progress';
import { GoalFormModal } from '@/components/shared/GoalFormModal';
import { Confetti } from '@/components/shared/Confetti';
import { differenceInMonths, addMonths, format, differenceInDays } from 'date-fns';

const fadeUp = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export function GoalsPage() {
  const { goals, transactions, getTotalValue, getGroupTotal, deleteGoal } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const totalValue = getTotalValue();

  const getGoalCurrent = (goal: typeof goals[0]) => {
    if (goal.customGroupId) return getGroupTotal(goal.customGroupId);
    return totalValue;
  };

  const estimateTarget = (current: number, target: number) => {
    const txsSorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    if (txsSorted.length < 2) return null;
    const firstDate = new Date(txsSorted[0].date);
    const lastDate = new Date(txsSorted[txsSorted.length - 1].date);
    const months = Math.max(differenceInMonths(lastDate, firstDate), 1);
    const totalGrowth = transactions.reduce((s, t) => s + (t.type === 'add' ? t.amount : -t.amount), 0);
    const avgMonthly = totalGrowth / months;
    if (avgMonthly <= 0) return null;
    const remaining = target - current;
    const monthsNeeded = Math.ceil(remaining / avgMonthly);
    return format(addMonths(new Date(), monthsNeeded), 'MMM yyyy');
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Hero Header */}
      <div className="hero-gradient rounded-b-[24px] px-4 pb-5 wealth-card">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[18px]">🎯</span>
              <h1 className="text-[16px] font-extrabold text-white tracking-tight">Target</h1>
            </div>
            <p className="text-[11px] text-white/45 mt-1 ml-[34px]">{goals.length} target aktif</p>
          </div>
          <Button variant="gold" size="sm" onClick={() => { setEditId(null); setShowForm(true); }}>
            <Plus className="h-3.5 w-3.5" /> Buat
          </Button>
        </div>

        {/* Summary */}
        {goals.length > 0 && (
          <div className="mt-4 flex gap-3 relative z-10">
            <div className="flex-1 bg-white/[0.07] backdrop-blur-md rounded-2xl p-3 border border-white/[0.06]">
              <p className="text-[9px] text-white/30 uppercase font-bold tracking-wider">Sekarang</p>
              <p className="text-[17px] font-extrabold text-white number-display mt-1">{formatCompact(totalValue)}</p>
            </div>
            <div className="flex-1 bg-white/[0.07] backdrop-blur-md rounded-2xl p-3 border border-white/[0.06]">
              <p className="text-[9px] text-amber-300/50 uppercase font-bold tracking-wider">Target 🏅</p>
              <p className="text-[17px] font-extrabold text-amber-300 number-display mt-1">
                {formatCompact(Math.max(...goals.map(g => g.targetAmount)))}
              </p>
            </div>
          </div>
        )}
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-20 space-y-4 px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center mx-auto border border-border/20"
          >
            <span className="text-[28px]">🚀</span>
          </motion.div>
          <div>
            <p className="text-[14px] font-bold">Belum ada target</p>
            <p className="text-[11px] text-muted-foreground/40 mt-1">Set financial goals kamu dan pantau progressnya!</p>
          </div>
          <Button variant="gold" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Buat target pertama
          </Button>
        </div>
      ) : (
        <motion.div
          className="px-3 pt-4 pb-4 space-y-2.5"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {goals.map((goal) => {
            const current = getGoalCurrent(goal);
            const progress = calculateProgress(current, goal.targetAmount);
            const remaining = Math.max(goal.targetAmount - current, 0);
            const estimation = estimateTarget(current, goal.targetAmount);
            const isComplete = progress >= 100;
            const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());

            return (
              <motion.div key={goal.id} variants={fadeUp}>
                <div className={`rounded-[20px] border overflow-hidden shadow-card relative ${
                  isComplete ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/30 dark:border-emerald-800/30' : 'bg-surface border-border/15'
                }`}>
                  {isComplete && <Confetti active={isComplete} />}
                  {isComplete && (
                    <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />
                  )}

                  <div className="p-3.5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <CircularProgress
                          value={progress}
                          size={44}
                          strokeWidth={4}
                          color={isComplete ? '#10B981' : undefined}
                        />
                        <div>
                          <h3 className="text-[13px] font-bold">{goal.name}</h3>
                          <p className="text-[10px] text-muted-foreground/40 mt-0.5 flex items-center gap-1">
                            {isComplete ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <Trophy className="h-3 w-3" /> Achieved! 🎉
                              </span>
                            ) : (
                              <>
                                <Calendar className="h-3 w-3" />
                                {daysLeft > 0 ? `${daysLeft} hari lagi` : '⚠️ Overdue'}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === goal.id ? null : goal.id)}
                          className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground/25" />
                        </button>
                        {menuOpen === goal.id && (
                          <div className="absolute right-0 top-8 bg-surface border border-border/20 rounded-2xl shadow-elevated py-1.5 z-10 min-w-[110px] animate-scale-in">
                            <button
                              onClick={() => { setMenuOpen(null); setEditId(goal.id); setShowForm(true); }}
                              className="flex items-center gap-2 w-full px-3.5 py-2 text-[11px] hover:bg-surface-secondary"
                            >
                              <Edit2 className="h-3 w-3" /> Edit
                            </button>
                            <button
                              onClick={() => { setMenuOpen(null); deleteGoal(goal.id); }}
                              className="flex items-center gap-2 w-full px-3.5 py-2 text-[11px] text-destructive hover:bg-destructive-soft"
                            >
                              <Trash2 className="h-3 w-3" /> Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <ProgressBar value={progress} size="md" variant={isComplete ? 'success' : 'gradient'} />

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="bg-surface-secondary/60 rounded-xl p-2.5 border border-border/8">
                        <p className="text-[8px] text-muted-foreground/35 uppercase font-bold">Sekarang</p>
                        <p className="text-[12px] font-bold number-display mt-0.5">{formatCompact(current)}</p>
                      </div>
                      <div className="bg-surface-secondary/60 rounded-xl p-2.5 border border-border/8">
                        <p className="text-[8px] text-primary/50 uppercase font-bold">Target</p>
                        <p className="text-[12px] font-bold number-display mt-0.5 text-primary">{formatCompact(goal.targetAmount)}</p>
                      </div>
                      <div className="bg-surface-secondary/60 rounded-xl p-2.5 border border-border/8">
                        <p className="text-[8px] text-amber-600/50 dark:text-amber-400/50 uppercase font-bold">Kurang</p>
                        <p className="text-[12px] font-bold number-display mt-0.5 text-amber-600 dark:text-amber-400">{formatCompact(remaining)}</p>
                      </div>
                    </div>

                    {!isComplete && estimation && (
                      <div className="mt-2.5 pt-2.5 border-t border-border/8 flex items-center gap-2">
                        <div className="chip-gold">
                          <Zap className="h-2.5 w-2.5" /> Estimasi
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">
                          tercapai <span className="font-bold text-foreground">{estimation}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <GoalFormModal open={showForm} onClose={() => setShowForm(false)} editId={editId} />
    </div>
  );
}
