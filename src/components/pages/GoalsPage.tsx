'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Target, MoreHorizontal, Edit2, Trash2, Trophy, Calendar, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { formatCompact, calculateProgress, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { CircularProgress } from '@/components/ui/Progress';
import { GoalFormModal } from '@/components/shared/GoalFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Confetti } from '@/components/shared/Confetti';
import { PageLayout } from '@/components/layout/PageLayout';
import { useToast } from '@/components/ui/Toast';
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
  const menuRef = useRef<HTMLDivElement>(null);

  const totalValue = getTotalValue();

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
          <p className="text-[11px] text-white/45 mt-1 ml-[34px]">{goals.length} target aktif</p>
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
                                {daysLeft > 0 ? `${daysLeft} hari lagi` : 'Overdue'}
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
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <GoalFormModal open={showForm} onClose={() => setShowForm(false)} editId={editId} />
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
    </PageLayout>
  );
}
