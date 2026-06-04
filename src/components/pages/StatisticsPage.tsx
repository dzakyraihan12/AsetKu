'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Award, Flame, ArrowUpRight, BarChart3 } from 'lucide-react';
import { useStore } from '@/store';
import { formatCompact } from '@/lib/utils';
import { GrowthChart } from '@/components/shared/GrowthChart';
import { PageLayout } from '@/components/layout/PageLayout';

const COLORS = ['#135581', '#24AAE1', '#22C55E', '#EAB308', '#EC4899', '#8B5CF6', '#F97316'];

const fadeUp = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function StatisticsPage() {
  const { assets, categories, transactions, getCategoryTotal, getTotalValue } = useStore();
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('month');

  const totalValue = getTotalValue();

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

  const headerContent = (
    <>
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-white/80" />
          <h1 className="text-[16px] font-extrabold text-white tracking-tight">Insight</h1>
        </div>
        <p className="text-[11px] text-white/45 mt-1 ml-[34px]">Pantau pertumbuhan wealth kamu</p>
      </div>
      {/* Key Stats inside hero */}
      <div className="grid grid-cols-2 gap-2.5 mt-4">
        <div className="bg-white/[0.07] backdrop-blur-md rounded-2xl p-3 border border-white/[0.06]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="h-5 w-5 rounded-lg bg-emerald-400/15 flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-emerald-300" />
            </div>
            <p className="text-[9px] text-white/35 uppercase font-bold">Avg/bulan</p>
          </div>
          <p className={`text-[16px] font-extrabold number-display ${avgMonthly >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            {avgMonthly >= 0 ? '+' : ''}{formatCompact(avgMonthly)}
          </p>
        </div>
        <div className="bg-white/[0.07] backdrop-blur-md rounded-2xl p-3 border border-white/[0.06]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="h-5 w-5 rounded-lg bg-amber-400/15 flex items-center justify-center">
              <Award className="h-3 w-3 text-amber-300" />
            </div>
            <p className="text-[9px] text-white/35 uppercase font-bold">Terbaik</p>
          </div>
          <p className="text-[16px] font-extrabold number-display text-emerald-300">+{formatCompact(bestMonth?.growth ?? 0)}</p>
          <p className="text-[9px] text-white/25 mt-0.5 font-medium">{bestMonth?.month}</p>
        </div>
      </div>
    </>
  );

  return (
    <PageLayout pageKey="analytics" headerContent={headerContent}>
    <motion.div
      className="pb-4"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.03 } } }}
    >
      {/* Chart */}
      <motion.section variants={fadeUp} className="px-3 pt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-foreground/80">Pertumbuhan</span>
          <div className="flex bg-surface-secondary rounded-full p-[3px] border border-border/30">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all ${
                  chartPeriod === p ? 'btn-gradient text-white shadow-sm shadow-sky-900/15' : 'text-muted-foreground/40'
                }`}
              >
                {p === 'week' ? '1M' : p === 'month' ? '6M' : '1Y'}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-border/20 rounded-2xl p-3 pb-1 shadow-card">
          <GrowthChart period={chartPeriod} />
        </div>
      </motion.section>
      {/* Distribution */}
      {distribution.length > 0 && (
        <motion.section variants={fadeUp} className="px-3 pt-3">
          <span className="text-[11px] font-bold text-foreground/80">Distribusi</span>
          <div className="mt-1.5 bg-surface border border-border/20 rounded-2xl p-3 shadow-card">
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
                    <span className="text-caption flex-1 truncate">{d.name}</span>
                    <span className="text-micro text-muted-foreground/35 font-bold number-display">{pct}%</span>
                    <span className="text-caption font-bold number-display w-16 text-right">{formatCompact(d.value)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* Monthly Bars */}
      <motion.section variants={fadeUp} className="px-3 pt-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Flame className="h-3 w-3 text-gold/50" />
          <span className="text-caption font-bold text-foreground/70">Per Bulan</span>
        </div>
        <div className="bg-surface border border-border/20 rounded-2xl p-3 shadow-card space-y-1">
          {monthlyGrowth.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-micro text-muted-foreground/45 w-6 shrink-0 font-bold">{m.month}</span>
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
              <span className={`text-micro font-bold number-display w-14 text-right ${m.growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                {m.growth >= 0 ? '+' : ''}{formatCompact(m.growth)}
              </span>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
    </PageLayout>
  );
}
