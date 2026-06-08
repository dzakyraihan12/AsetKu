'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Target, MoreHorizontal, Edit2, Trash2, Trophy, Calendar, Zap, Star, Calculator, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store';
import { formatCompact, calculateProgress, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { CircularProgress } from '@/components/ui/Progress';
import { GoalFormModal } from '@/components/shared/GoalFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Confetti } from '@/components/shared/Confetti';
import { PageLayout } from '@/components/layout/PageLayout';
import { useToast } from '@/components/ui/Toast';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { differenceInMonths, addMonths, format, differenceInDays } from 'date-fns';

const fadeUp = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export function GoalsPage() {
  const { goals, transactions, getTotalValue, getGroupTotal, deleteGoal } = useStore();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simAmount, setSimAmount] = useState(0);
  const [simGoalId, setSimGoalId] = useState<string>('');
  const [showArchive, setShowArchive] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const totalValue = getTotalValue();

  const getGoalCurrent = (goal: typeof goals[0]) => {
    if (goal.customGroupId) return getGroupTotal(goal.customGroupId);
    return totalValue;
  };

  // Split goals into active and completed
  const activeGoals = goals.filter(goal => {
    const current = getGoalCurrent(goal);
    return calculateProgress(current, goal.targetAmount) < 100;
  });

  const completedGoals = goals.filter(goal => {
    const current = getGoalCurrent(goal);
    return calculateProgress(current, goal.targetAmount) >= 100;
  });

  // Close dropdown on tap outside (#8)
  useEffect(() => {
    if (!menuOpen) return;
    const handleTap = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleTap);
    document.addEventListener('touchstart', handleTap);
    return () => {
      document.removeEventListener('mousedown', handleTap);
      document.removeEventListener('touchstart', handleTap);
    };
  }, [menuOpen]);

  // Get primary goal for header progress ring
  const primaryGoal = (() => {
    if (goals.length === 0) return null;
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('asetku_primary_goal');
      if (storedId) {
        const found = goals.find(g => g.id === storedId);
        if (found) return found;
      }
    }
    return goals[0];
  })();

  const primaryProgress = primaryGoal ? calculateProgress(totalValue, primaryGoal.targetAmount) : 0;

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
    if (remaining <= 0) return null;
    const monthsNeeded = Math.ceil(remaining / avgMonthly);
    if (!isFinite(monthsNeeded) || monthsNeeded > 1200) return null;
    return format(addMonths(new Date(), monthsNeeded), 'MMM yyyy');
  };

  const headerContent = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-white/80" />
            <h1 className="text-[16px] font-extrabold text-white tracking-tight">Target</h1>
          </div>
          <p className="text-[11px] text-white/45 mt-1 ml-[34px]">{activeGoals.length} target aktif{completedGoals.length > 0 ? ` · ${completedGoals.length} tercapai` : ''}</p>
        </div>
        <Button variant="gold" size="sm" onClick={() => { setEditId(null); setShowForm(true); }}>
          <Plus className="h-3.5 w-3.5" /> Buat
        </Button>
      </div>

      {/* Summary with progress ring (#11) */}
      {goals.length > 0 && (
        <div className="mt-4 flex gap-3 items-center">
          {/* Progress Ring — white label for header */}
          <div className="shrink-0 [&_span]:!text-white">
            <CircularProgress value={primaryProgress} size={56} strokeWidth={5} color="#FDCC09" />
          </div>
          <div className="flex-1 flex gap-2">
            <div className="flex-1 bg-white/[0.07] backdrop-blur-md rounded-2xl p-3 border border-white/[0.06]">
              <p className="text-[9px] text-white/30 uppercase font-bold tracking-wider">Sekarang</p>
              <p className="text-[15px] font-extrabold text-white number-display mt-1">{formatCompact(totalValue)}</p>
            </div>
            <div className="flex-1 bg-white/[0.07] backdrop-blur-md rounded-2xl p-3 border border-white/[0.06]">
              <p className="text-[9px] text-amber-300/50 uppercase font-bold tracking-wider">Target</p>
              <p className="text-[15px] font-extrabold text-amber-300 number-display mt-1">
                {primaryGoal ? formatCompact(primaryGoal.targetAmount) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <PageLayout pageKey="goals" headerContent={headerContent}>
      {goals.length === 0 ? (
        <div className="text-center py-16 space-y-4 px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center mx-auto border border-border/20"
          >
            <span className="text-[26px]">🚀</span>
          </motion.div>
          <div>
            <p className="text-[13px] font-bold">Belum ada target</p>
            <p className="text-[11px] text-muted-foreground/50 mt-1.5 leading-relaxed">
              Set financial goals dan pantau progress kamu secara real-time.
            </p>
          </div>
          <div className="text-left max-w-[260px] mx-auto space-y-2 py-2">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                <Target className="h-3 w-3 text-primary" />
              </div>
              <span className="text-[11px] text-muted-foreground/60">Tentukan nominal target kekayaan</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                <Calendar className="h-3 w-3 text-primary" />
              </div>
              <span className="text-[11px] text-muted-foreground/60">Set deadline kapan harus tercapai</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                <Zap className="h-3 w-3 text-primary" />
              </div>
              <span className="text-[11px] text-muted-foreground/60">Dapatkan estimasi otomatis pencapaian</span>
            </div>
          </div>
          <Button variant="gold" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Buat target pertama
          </Button>
        </div>
      ) : (
        <>
        {activeGoals.length > 0 ? (
        <motion.div
          className="px-3 pt-4 pb-4 space-y-2.5"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {activeGoals.map((goal) => {
            const current = getGoalCurrent(goal);
            const progress = calculateProgress(current, goal.targetAmount);
            const remaining = Math.max(goal.targetAmount - current, 0);
            const estimation = estimateTarget(current, goal.targetAmount);
            const isComplete = progress >= 100;
            const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());

            return (
              <motion.div key={goal.id} variants={fadeUp}>
                <div className={`rounded-[20px] border overflow-hidden shadow-card relative ${
                  isComplete
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/30 dark:border-emerald-800/30'
                    : daysLeft <= 0
                      ? 'bg-red-50 dark:bg-red-950/10 border-red-300/30 dark:border-red-800/30 ring-1 ring-red-400/20'
                      : daysLeft <= 7
                        ? 'bg-amber-50 dark:bg-amber-950/10 border-amber-300/30 dark:border-amber-800/30 ring-1 ring-amber-400/20'
                        : 'bg-surface border-border/15'
                }`}>
                  {isComplete && <Confetti active={(() => {
                    // Only celebrate once per goal
                    const key = `asetku_celebrated_${goal.id}`;
                    if (typeof window !== 'undefined') {
                      if (localStorage.getItem(key)) return false;
                      localStorage.setItem(key, 'true');
                      return true;
                    }
                    return false;
                  })()} />}
                  {isComplete && (
                    <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />
                  )}

                  <div className="p-3.5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {goal.emoji && (
                            <span className="absolute -top-1 -left-1 text-[10px]">{goal.emoji}</span>
                          )}
                          <CircularProgress
                            value={progress}
                            size={44}
                            strokeWidth={4}
                            color={isComplete ? '#10B981' : undefined}
                          />
                        </div>
                        <div>
                          <h3 className="text-[13px] font-bold">{goal.name}</h3>
                          <p className="text-[10px] text-muted-foreground/40 mt-0.5 flex items-center gap-1">
                            {isComplete ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <Trophy className="h-3 w-3" /> Achieved! 🎉
                              </span>
                            ) : daysLeft <= 0 ? (
                              <span className="text-red-500 font-bold flex items-center gap-1 animate-pulse">
                                <Calendar className="h-3 w-3" /> Overdue!
                              </span>
                            ) : daysLeft <= 7 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {daysLeft} hari lagi ⚡
                              </span>
                            ) : (
                              <>
                                <Calendar className="h-3 w-3" />
                                {`${daysLeft} hari lagi`}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="relative" ref={menuOpen === goal.id ? menuRef : undefined}>
                        <button
                          onClick={() => setMenuOpen(menuOpen === goal.id ? null : goal.id)}
                          className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground/25" />
                        </button>
                        {menuOpen === goal.id && (
                          <div className="absolute right-0 top-8 bg-surface border border-border/20 rounded-2xl shadow-elevated py-1.5 z-10 min-w-[130px] animate-scale-in">
                            <button
                              onClick={() => {
                                setMenuOpen(null);
                                localStorage.setItem('asetku_primary_goal', goal.id);
                                toast('Target utama berhasil diubah');
                              }}
                              className="flex items-center gap-2 w-full px-3.5 py-2 text-[11px] hover:bg-surface-secondary text-amber-600 dark:text-amber-400"
                            >
                              <Star className="h-3 w-3" /> Set Utama
                            </button>
                            <button
                              onClick={() => { setMenuOpen(null); setEditId(goal.id); setShowForm(true); }}
                              className="flex items-center gap-2 w-full px-3.5 py-2 text-[11px] hover:bg-surface-secondary"
                            >
                              <Edit2 className="h-3 w-3" /> Edit
                            </button>
                            <button
                              onClick={() => { setMenuOpen(null); setConfirmDeleteId(goal.id); }}
                              className="flex items-center gap-2 w-full px-3.5 py-2 text-[11px] text-destructive hover:bg-destructive-soft"
                            >
                              <Trash2 className="h-3 w-3" /> Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground/40 font-medium">{formatCompact(current)}</span>
                        <span className="text-[10px] font-bold text-primary/70 number-display">{progress}%</span>
                        <span className="text-[10px] text-muted-foreground/40 font-medium">{formatCompact(goal.targetAmount)}</span>
                      </div>
                      <div className="relative">
                        <div className={cn(
                          'w-full h-3 rounded-full overflow-hidden',
                          isComplete ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-surface-secondary'
                        )}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progress, 100)}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className={cn(
                              'h-full rounded-full relative',
                              isComplete
                                ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400'
                                : progress >= 75
                                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500'
                                  : progress >= 50
                                    ? 'bg-gradient-to-r from-sky-400 to-blue-500'
                                    : 'bg-gradient-to-r from-sky-300 to-sky-500'
                            )}
                          >
                            {progress > 8 && !isComplete && (
                              <motion.div
                                className="absolute inset-0 rounded-full opacity-50"
                                style={{
                                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                                  backgroundSize: '200% 100%',
                                }}
                                animate={{ backgroundPosition: ['100% 0%', '-100% 0%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              />
                            )}
                          </motion.div>
                        </div>
                        {!isComplete && (
                          <div className="absolute inset-0 flex items-center pointer-events-none">
                            {[25, 50, 75].map((milestone) => (
                              <div
                                key={milestone}
                                className={cn(
                                  'absolute top-1/2 -translate-y-1/2 w-[2px] h-2 rounded-full transition-colors',
                                  progress >= milestone ? 'bg-white/40' : 'bg-border/30'
                                )}
                                style={{ left: `${milestone}%` }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2.5">
                      <div className="bg-surface-secondary/60 rounded-xl p-2 border border-border/8 text-center">
                        <p className="text-[8px] text-muted-foreground/35 uppercase font-bold">Tercapai</p>
                        <p className="text-[12px] font-bold number-display mt-0.5">{formatCompact(current)}</p>
                      </div>
                      <div className="bg-surface-secondary/60 rounded-xl p-2 border border-border/8 text-center">
                        <p className="text-[8px] text-amber-600/50 dark:text-amber-400/50 uppercase font-bold">Kurang</p>
                        <p className="text-[12px] font-bold number-display mt-0.5 text-amber-600 dark:text-amber-400">{formatCompact(remaining)}</p>
                      </div>
                      <div className="bg-surface-secondary/60 rounded-xl p-2 border border-border/8 text-center">
                        <p className="text-[8px] text-primary/50 uppercase font-bold">Target</p>
                        <p className="text-[12px] font-bold number-display mt-0.5 text-primary">{formatCompact(goal.targetAmount)}</p>
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

                    {/* Monthly required amount */}
                    {!isComplete && daysLeft > 0 && remaining > 0 && (
                      <div className={`mt-2 flex items-center gap-2 ${!estimation ? 'pt-2.5 border-t border-border/8' : ''}`}>
                        <div className="chip-accent">
                          <Target className="h-2.5 w-2.5" /> Perlu
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">
                          <span className="font-bold text-foreground">{formatCompact(Math.ceil(remaining / Math.max(Math.ceil(daysLeft / 30), 1)))}</span>/bulan
                        </span>
                      </div>
                    )}

                    {/* Next milestone */}
                    {!isComplete && (() => {
                      const milestones = [25, 50, 75];
                      const nextMilestone = milestones.find(m => progress < m);
                      if (!nextMilestone) return null;
                      const milestoneValue = Math.round(goal.targetAmount * nextMilestone / 100);
                      const milestoneRemaining = milestoneValue - current;
                      if (milestoneRemaining <= 0) return null;
                      return (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="chip bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            <Trophy className="h-2.5 w-2.5" /> Milestone
                          </div>
                          <span className="text-[10px] text-muted-foreground/60">
                            {formatCompact(milestoneValue)} ({nextMilestone}%) — kurang <span className="font-bold text-foreground">{formatCompact(milestoneRemaining)}</span>
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        ) : (
          <div className="text-center py-8 px-6">
            <p className="text-[20px] mb-2">🏆</p>
            <p className="text-[12px] font-bold text-muted-foreground/60">Semua target tercapai!</p>
            <p className="text-[10px] text-muted-foreground/40 mt-1">Buat target baru untuk terus berkembang.</p>
          </div>
        )}

      <GoalFormModal open={showForm} onClose={() => setShowForm(false)} editId={editId} />

      {/* Completed Goals Archive */}
      {completedGoals.length > 0 && (
        <div className="px-3 pb-3">
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 press-scale"
          >
            <div className="flex items-center gap-2">
              <Archive className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Target Tercapai</span>
              <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-emerald-500/15 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                {completedGoals.length}
              </span>
            </div>
            <motion.span
              animate={{ rotate: showArchive ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-emerald-500/50 text-[12px]"
            >
              ▼
            </motion.span>
          </button>

          <AnimatePresence>
            {showArchive && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-2.5 space-y-2">
                  {completedGoals.map((goal) => {
                    const current = getGoalCurrent(goal);
                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[20px] border overflow-hidden bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/30 dark:border-emerald-800/30"
                      >
                        <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />
                        <div className="p-3.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Trophy className="h-4.5 w-4.5 text-emerald-500" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  {goal.emoji && <span className="text-[12px]">{goal.emoji}</span>}
                                  <h3 className="text-[13px] font-bold">{goal.name}</h3>
                                </div>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                                  <Trophy className="h-3 w-3" /> Tercapai! 🎉
                                </p>
                              </div>
                            </div>
                            <div className="relative" ref={menuOpen === goal.id ? menuRef : undefined}>
                              <button
                                onClick={() => setMenuOpen(menuOpen === goal.id ? null : goal.id)}
                                className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
                              >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground/25" />
                              </button>
                              {menuOpen === goal.id && (
                                <div className="absolute right-0 top-8 bg-surface border border-border/20 rounded-2xl shadow-elevated py-1.5 z-10 min-w-[130px] animate-scale-in">
                                  <button
                                    onClick={() => { setMenuOpen(null); setEditId(goal.id); setShowForm(true); }}
                                    className="flex items-center gap-2 w-full px-3.5 py-2 text-[11px] hover:bg-surface-secondary"
                                  >
                                    <Edit2 className="h-3 w-3" /> Edit
                                  </button>
                                  <button
                                    onClick={() => { setMenuOpen(null); setConfirmDeleteId(goal.id); }}
                                    className="flex items-center gap-2 w-full px-3.5 py-2 text-[11px] text-destructive hover:bg-destructive-soft"
                                  >
                                    <Trash2 className="h-3 w-3" /> Hapus
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="bg-emerald-500/5 rounded-xl p-2 border border-emerald-500/10 text-center">
                              <p className="text-[8px] text-emerald-600/50 uppercase font-bold">Tercapai</p>
                              <p className="text-[12px] font-bold number-display mt-0.5 text-emerald-600 dark:text-emerald-400">{formatCompact(current)}</p>
                            </div>
                            <div className="bg-emerald-500/5 rounded-xl p-2 border border-emerald-500/10 text-center">
                              <p className="text-[8px] text-emerald-600/50 uppercase font-bold">Target</p>
                              <p className="text-[12px] font-bold number-display mt-0.5">{formatCompact(goal.targetAmount)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* What-if Simulator */}
      {goals.length > 0 && !showSimulator && (
        <div className="px-3 pb-4">
          <button
            onClick={() => setShowSimulator(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-surface border border-border/20 shadow-card text-[11px] font-bold text-primary/70 press-scale"
          >
            <Calculator className="h-3.5 w-3.5" /> What-if Simulator
          </button>
        </div>
      )}

      {showSimulator && goals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 pb-4"
        >
          <div className="card-elevated p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[12px] font-bold">What-if Simulator</span>
              </div>
              <button onClick={() => setShowSimulator(false)} className="text-[9px] text-muted-foreground/40 font-medium press-scale">Tutup</button>
            </div>
            <p className="text-[10px] text-muted-foreground/50">Kalau kamu nabung X per bulan, kapan target tercapai?</p>

            {/* Goal selector */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground/50 uppercase">Pilih Target</label>
              <div className="flex gap-1.5 mt-1 overflow-x-auto no-scrollbar">
                {goals.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSimGoalId(g.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                      simGoalId === g.id ? 'btn-gradient text-white' : 'bg-surface-secondary border border-border/30 text-muted-foreground/60'
                    }`}
                  >
                    {g.emoji || '🎯'} {g.name}
                  </button>
                ))}
              </div>
            </div>

            <CurrencyInput
              label="Nabung per bulan"
              placeholder="5.000.000"
              value={simAmount}
              onChange={setSimAmount}
            />
            {simAmount > 0 && simGoalId && (() => {
              const selectedGoal = goals.find(g => g.id === simGoalId);
              if (!selectedGoal) return null;
              const goalCurrent = selectedGoal.customGroupId ? getGroupTotal(selectedGoal.customGroupId) : totalValue;
              const remaining = Math.max(selectedGoal.targetAmount - goalCurrent, 0);
              if (remaining <= 0) return <p className="text-[11px] text-success font-bold">🎉 Target sudah tercapai!</p>;
              const monthsNeeded = Math.ceil(remaining / simAmount);
              if (!isFinite(monthsNeeded) || monthsNeeded > 1200) return <p className="text-[11px] text-muted-foreground/50">Nominal terlalu kecil untuk kalkulasi</p>;
              const targetDate = addMonths(new Date(), monthsNeeded);
              return (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/50">Target: {selectedGoal.emoji || '🎯'} {selectedGoal.name}</span>
                    <span className="text-[10px] font-bold text-primary number-display">{formatCompact(selectedGoal.targetAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/50">Waktu dibutuhkan</span>
                    <span className="text-[11px] font-bold">{monthsNeeded} bulan</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/50">Tercapai sekitar</span>
                    <span className="text-[11px] font-bold text-success">{format(targetDate, 'MMM yyyy')}</span>
                  </div>
                </div>
              );
            })()}
            {simAmount > 0 && !simGoalId && (
              <p className="text-[10px] text-muted-foreground/40 text-center py-2">Pilih target di atas dulu</p>
            )}
          </div>
        </motion.div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Hapus Target?"
        message="Target ini akan dihapus permanen dan tidak bisa dikembalikan."
        onConfirm={async () => {
          if (confirmDeleteId) {
            await deleteGoal(confirmDeleteId);
            setConfirmDeleteId(null);
            toast('Target berhasil dihapus', 'info');
          }
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
      </>
      )}
    </PageLayout>
  );
}
