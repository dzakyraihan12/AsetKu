'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Award, Flame, ArrowUpRight, BarChart3 } from 'lucide-react';
import { useStore } from '@/store';
import { formatCompact } from '@/lib/utils';
import { GrowthChart } from '@/components/shared/GrowthChart';
import { Modal } from '@/components/ui/Modal';

const COLORS = ['#135581', '#24AAE1', '#22C55E', '#EAB308', '#EC4899', '#8B5CF6', '#F97316'];

interface StatisticsModalProps {
  open: boolean;
  onClose: () => void;
}

export function StatisticsModal({ open, onClose }: StatisticsModalProps) {
  const { assets, categories, transactions, getCategoryTotal, getTotalAssetValue } = useStore();
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('month');

  const totalValue = getTotalAssetValue();

  const distribution = useMemo(() => {
    return categories
      .map((cat, i) => ({ name: cat.name, value: getCategoryTotal(cat.id), color: COLORS[i % COLORS.length] }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, assets, transactions]);

  const monthlyGrowth = useMemo(() => {
    const now = new Date();
    const months: { month: string; growth: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'short' });
      const growth = transactions
        .filter((t) => t.date.startsWith(key))
        .reduce((s, t) => s + (t.type === 'add' ? t.amount : -t.amount), 0);
      months.push({ month: label, growth });
    }
    return months;
  }, [transactions]);

  const maxGrowth = Math.max(...monthlyGrowth.map(x => Math.abs(x.growth)), 1);
  const totalGrowth6m = monthlyGrowth.reduce((s, m) => s + m.growth, 0);
  const avgMonthly = Math.round(totalGrowth6m / 6);
  const bestMonth = [...monthlyGrowth].sort((a, b) => b.growth - a.growth)[0];

  const weeklyGrowth = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`;
    return transactions
      .filter((t) => t.date >= weekAgoStr)
      .reduce((s, t) => s + (t.type === 'add' ? t.amount : -t.amount), 0);
  }, [transactions]);

  return (
    <Modal open={open} onClose={onClose} title="Statistik & Insight">
      {transactions.length === 0 ? (
        <div className="text-center py-10">
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-[36px] mb-3"
          >
            📊
          </motion.div>
          <p className="text-[13px] font-bold">Belum ada data</p>
          <p className="text-[11px] text-muted-foreground/50 mt-1.5 leading-relaxed">
            Mulai catat transaksi untuk melihat insight pertumbuhan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-violet-500/5 border border-violet-500/15 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3 w-3 text-violet-500" />
                <p className="text-[9px] text-violet-600/70 dark:text-violet-400/70 uppercase font-bold">1 Minggu</p>
              </div>
              <p className={`text-[14px] font-extrabold number-display ${weeklyGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {weeklyGrowth >= 0 ? '+' : ''}{formatCompact(weeklyGrowth)}
              </p>
            </div>
            <div className="bg-sky-500/5 border border-sky-500/15 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Flame className="h-3 w-3 text-sky-500" />
                <p className="text-[9px] text-sky-600/70 dark:text-sky-400/70 uppercase font-bold">6 Bulan</p>
              </div>
              <p className={`text-[14px] font-extrabold number-display ${totalGrowth6m >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {totalGrowth6m >= 0 ? '+' : ''}{formatCompact(totalGrowth6m)}
              </p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 uppercase font-bold">Rata-rata</p>
              </div>
              <p className={`text-[14px] font-extrabold number-display ${avgMonthly >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {avgMonthly >= 0 ? '+' : ''}{formatCompact(avgMonthly)}/bln
              </p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Award className="h-3 w-3 text-amber-500" />
                <p className="text-[9px] text-amber-600/70 dark:text-amber-400/70 uppercase font-bold">Terbaik</p>
              </div>
              <p className="text-[14px] font-extrabold number-display text-emerald-600 dark:text-emerald-400">
                +{formatCompact(bestMonth?.growth ?? 0)}
              </p>
              <p className="text-[8px] text-amber-600/50 dark:text-amber-400/50 mt-0.5 font-medium">{bestMonth?.month}</p>
            </div>
          </div>

          {/* Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold text-foreground/80">Pertumbuhan</span>
              <div className="flex bg-surface-secondary rounded-full p-[2px] border border-border/30">
                {(['week', 'month', 'year'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={`px-2 py-1 rounded-full text-[9px] font-bold transition-all ${
                      chartPeriod === p ? 'btn-gradient text-white shadow-sm' : 'text-muted-foreground/40'
                    }`}
                  >
                    {p === 'week' ? '1Mgg' : p === 'month' ? '6B' : '1T'}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-surface-secondary/30 border border-border/20 rounded-2xl p-3 pb-1">
              <GrowthChart period={chartPeriod} />
            </div>
          </div>

          {/* Distribution */}
          {distribution.length > 0 && (
            <div>
              <span className="text-[12px] font-bold text-foreground/80 block mb-2">Distribusi</span>
              <div className="bg-surface-secondary/30 border border-border/20 rounded-2xl p-3">
                <div className="h-[6px] rounded-full overflow-hidden flex gap-[1px] bg-surface-secondary mb-3">
                  {distribution.map((d, i) => (
                    <motion.div
                      key={i}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{ backgroundColor: d.color }}
                      initial={{ flex: 0 }}
                      animate={{ flex: d.value / totalValue }}
                      transition={{ duration: 0.5, delay: i * 0.03 }}
                    />
                  ))}
                </div>
                <div className="space-y-1.5">
                  {distribution.map((d, i) => {
                    const pct = Math.round((d.value / totalValue) * 100);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-[10px] flex-1 truncate font-medium">{d.name}</span>
                        <span className="text-[9px] text-muted-foreground/35 font-bold number-display">{pct}%</span>
                        <span className="text-[10px] font-bold number-display w-16 text-right">{formatCompact(d.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Monthly Bars */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Flame className="h-3 w-3 text-amber-500/70" />
              <span className="text-[12px] font-bold text-foreground/80">Per Bulan</span>
            </div>
            <div className="bg-surface-secondary/30 border border-border/20 rounded-2xl p-3 space-y-1">
              {monthlyGrowth.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground/45 w-6 shrink-0 font-bold">{m.month}</span>
                  <div className="flex-1 h-5 flex items-center">
                    <motion.div
                      className={`h-5 rounded-md flex items-center px-1.5 ${m.growth >= 0 ? 'bg-success/6' : 'bg-destructive/6'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max((Math.abs(m.growth) / maxGrowth) * 100, m.growth !== 0 ? 6 : 0)}%` }}
                      transition={{ duration: 0.4, delay: i * 0.04 }}
                    >
                      {m.growth !== 0 && (
                        m.growth >= 0
                          ? <ArrowUpRight className="h-2.5 w-2.5 text-success/40" />
                          : <TrendingDown className="h-2.5 w-2.5 text-destructive/40" />
                      )}
                    </motion.div>
                  </div>
                  <span className={`text-[9px] font-bold number-display w-14 text-right ${m.growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {m.growth >= 0 ? '+' : ''}{formatCompact(m.growth)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
