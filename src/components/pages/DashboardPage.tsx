'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, ChevronRight, Target, Eye, EyeOff, Wallet, PieChart, FolderOpen, Activity, Sun, CloudSun, Sunset, Moon, Crosshair, PlusCircle, Receipt, Banknote, Landmark, Lock, Bitcoin, Home, Car, Sparkles, ClipboardList, Package, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { formatCurrency, formatCompact, calculateProgress } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';
import { useNavigate } from '@/hooks/useNavigation';
import { ProgressBar } from '@/components/ui/Progress';
import { GrowthChart } from '@/components/shared/GrowthChart';
import { PageLayout } from '@/components/layout/PageLayout';

import type { LucideIcon } from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Cash': Banknote, 'Rekening Bank': Landmark, 'Deposito': Lock, 'Saham': TrendingUp,
  'Crypto': Bitcoin, 'Properti': Home, 'Kendaraan': Car, 'Emas': Sparkles,
  'Piutang': ClipboardList, 'Lainnya': Package,
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export function DashboardPage({ userName }: { userName: string | null }) {
  const { assets, transactions, customGroups, goals, categories, getAssetValue, getTotalValue, getGroupTotal, getCategoryTotal } = useStore();
  const navigate = useNavigate();
  const [hideBalance, setHideBalance] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('asetku_hide_balance') === 'true';
    }
    return false;
  });

  const toggleHideBalance = () => {
    const next = !hideBalance;
    setHideBalance(next);
    localStorage.setItem('asetku_hide_balance', String(next));
  };

  const totalValue = useMemo(() => getTotalValue(), [assets, transactions]);
  const animatedTotal = useCountUp(totalValue, 900);
  const primaryGoal = goals[0];

  const monthChange = useMemo(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return transactions
      .filter((t) => t.date.startsWith(key))
      .reduce((sum, t) => sum + (t.type === 'add' ? t.amount : -t.amount), 0);
  }, [transactions]);

  const prevTotal = totalValue - monthChange;
  const monthPct = prevTotal > 0 ? ((monthChange / prevTotal) * 100).toFixed(1) : '0';
  const progress = primaryGoal ? calculateProgress(totalValue, primaryGoal.targetAmount) : 0;

  const categoryAllocation = useMemo(() => {
    return categories
      .map((cat) => ({ id: cat.id, name: cat.name, value: getCategoryTotal(cat.id) }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, assets, transactions]);

  const topAssets = useMemo(() => {
    return [...assets]
      .map((a) => ({ ...a, value: getAssetValue(a.id) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [assets, transactions]);

  const recentTxs = useMemo(() => {
    return [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [transactions]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Pagi', icon: Sun };
    if (h < 17) return { text: 'Siang', icon: CloudSun };
    if (h < 20) return { text: 'Sore', icon: Sunset };
    return { text: 'Malam', icon: Moon };
  };

  const greeting = getGreeting();

  const headerContent = (
    <>
      {/* Top Row: Greeting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md shadow-lg shadow-black/10">
            <span className="text-[12px] font-bold text-white">{userName ? userName.slice(0, 2).toUpperCase() : 'U'}</span>
          </div>
          <div>
            <p className="text-[11px] text-white/50 font-medium flex items-center gap-1"><greeting.icon className="h-3 w-3 text-white/60" /> Selamat {greeting.text}</p>
            <p className="text-[15px] font-extrabold text-white tracking-tight -mt-0.5">{userName || 'User'}</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md ${
            monthChange >= 0
              ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/25'
              : 'bg-red-400/20 text-red-200 border border-red-400/25'
          }`}
        >
          {monthChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {monthChange >= 0 ? '+' : ''}{monthPct}%
        </div>
      </div>

      {/* Wealth Display */}
      <div className="mt-5">
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-white/35 uppercase tracking-[0.1em] font-bold">Total Kekayaan</p>
          <button onClick={toggleHideBalance} className="p-1 rounded-full hover:bg-white/10 transition-colors">
            {hideBalance
              ? <EyeOff className="h-3.5 w-3.5 text-white/40" />
              : <Eye className="h-3.5 w-3.5 text-white/40" />
            }
          </button>
        </div>
        <p className="text-[30px] font-extrabold text-white tracking-[-0.04em] number-display mt-1 leading-none">
          {hideBalance ? '••••••••' : formatCurrency(animatedTotal)}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-[11px] font-semibold number-display ${monthChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            {hideBalance ? '•••' : `${monthChange >= 0 ? '↑' : '↓'} ${formatCompact(Math.abs(monthChange))}`}
          </span>
          <span className="text-[10px] text-white/25">bulan ini</span>
        </div>
      </div>

      {/* Quick Stats Pills */}
      <div className="mt-4 flex gap-2">
        <div className="flex-1 bg-white/[0.08] backdrop-blur-md rounded-2xl px-3 py-2.5 border border-white/[0.08]">
          <p className="text-[9px] text-white/30 font-bold uppercase">Aset</p>
          <p className="text-[16px] font-extrabold text-white number-display">{assets.length}</p>
        </div>
        <div className="flex-1 bg-white/[0.08] backdrop-blur-md rounded-2xl px-3 py-2.5 border border-white/[0.08]">
          <p className="text-[9px] text-white/30 font-bold uppercase">Kategori</p>
          <p className="text-[16px] font-extrabold text-white number-display">{categoryAllocation.length}</p>
        </div>
        <div className="flex-1 bg-white/[0.08] backdrop-blur-md rounded-2xl px-3 py-2.5 border border-white/[0.08]">
          <p className="text-[9px] text-white/30 font-bold uppercase">Growth</p>
          <p className={`text-[16px] font-extrabold number-display ${monthChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            {monthChange >= 0 ? '+' : ''}{formatCompact(monthChange)}
          </p>
        </div>
      </div>

      {/* Goal Progress */}
      {primaryGoal && (
        <div className="mt-4 bg-white/[0.06] backdrop-blur-md rounded-2xl p-3 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-white/60" />
              <span className="text-[11px] text-white/60 font-semibold">{primaryGoal.name}</span>
            </div>
            <span className="text-[12px] text-white font-extrabold number-display">{progress}%</span>
          </div>
          <ProgressBar value={progress} size="sm" variant="white" />
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-white/25 number-display font-medium">{formatCompact(totalValue)}</span>
            <span className="text-[9px] text-amber-300/70 number-display font-bold">{formatCompact(primaryGoal.targetAmount)}</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <PageLayout pageKey="overview" headerContent={headerContent}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="pb-2">

      {/* Quick Actions */}
      <motion.section variants={fadeUp} className="px-4 mt-3">
        <div className="flex gap-2">
          {[
            { icon: PlusCircle, label: 'Tambah Aset', tab: 'assets' as const },
            { icon: Receipt, label: 'Transaksi', tab: 'assets' as const },
            { icon: Crosshair, label: 'Buat Target', tab: 'goals' as const },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.tab)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl btn-gradient text-white press-scale shadow-sm shadow-sky-900/15 hover:brightness-110 transition-all"
            >
              <action.icon className="h-3.5 w-3.5 text-white/90" />
              <span className="text-[10px] font-bold text-white/90">{action.label}</span>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Growth Chart */}
      <motion.section variants={fadeUp} className="px-3 mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary/60" />
            <span className="text-[12px] font-bold text-foreground">Pertumbuhan</span>
          </div>
          <span className="chip-accent">
            <TrendingUp className="h-2.5 w-2.5" /> 6 bulan
          </span>
        </div>
        <div className="card-elevated p-3 pb-1">
          <GrowthChart />
        </div>
      </motion.section>

      {/* Allocation */}
      {categoryAllocation.length > 0 && (
        <motion.section variants={fadeUp} className="mt-4">
          <div className="px-3 mb-2 flex items-center gap-2">
            <PieChart className="h-3.5 w-3.5 text-primary/60" />
            <span className="text-[12px] font-bold text-foreground">Alokasi Aset</span>
          </div>
          {/* Allocation Bar */}
          <div className="px-3 mb-2.5">
            <div className="h-2.5 rounded-full overflow-hidden flex gap-[1.5px] bg-surface-secondary/80">
              {categoryAllocation.map((cat, i) => {
                const pct = (cat.value / totalValue) * 100;
                const colors = ['#2563EB', '#0EA5E9', '#10B981', '#EAB308', '#EC4899', '#8B5CF6', '#F97316'];
                return (
                  <motion.div
                    key={cat.id}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{ backgroundColor: colors[i % colors.length] }}
                    initial={{ flex: 0 }}
                    animate={{ flex: pct }}
                    transition={{ duration: 0.7, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  />
                );
              })}
            </div>
          </div>
          {/* Category Chips - horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-3">
            {categoryAllocation.map((cat, i) => {
              const pct = Math.round((cat.value / totalValue) * 100);
              const colors = ['#2563EB', '#0EA5E9', '#10B981', '#EAB308', '#EC4899', '#8B5CF6', '#F97316'];
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  className="shrink-0 min-w-[100px] p-3 rounded-2xl bg-surface border border-border/20 shadow-card"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: colors[i % colors.length] }} />
                    <p className="text-[10px] text-muted-foreground/60 truncate font-semibold">{cat.name}</p>
                  </div>
                  <p className="text-[13px] font-extrabold number-display">{formatCompact(cat.value)}</p>
                  <p className="text-[10px] text-muted-foreground/30 number-display font-bold mt-0.5">{pct}%</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Top Assets */}
      {topAssets.length > 0 && (
        <motion.section variants={fadeUp} className="px-3 mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 text-amber-500/70" />
              <span className="text-[12px] font-bold text-foreground">Top Aset</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/20" />
          </div>
          <div className="card-elevated overflow-hidden divide-y divide-border/8">
            {topAssets.map((asset, idx) => {
              const catName = categories.find(c => c.id === asset.categoryId)?.name ?? '';
              const IconComp = CATEGORY_ICONS[catName] || Package;
              const pct = totalValue > 0 ? Math.round((asset.value / totalValue) * 100) : 0;
              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.04 }}
                  className="flex items-center justify-between py-3 px-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-surface-secondary flex items-center justify-center border border-border/15">
                      <IconComp className="h-4 w-4 text-muted-foreground/60" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold">{asset.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-muted-foreground/35 font-medium">{catName}</span>
                        <span className="chip-accent !px-1.5 !py-0 !text-[8px]">{pct}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] font-bold number-display">{formatCompact(asset.value)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Groups */}
      {customGroups.length > 0 && (
        <motion.section variants={fadeUp} className="px-3 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-3.5 w-3.5 text-primary/60" />
            <span className="text-[12px] font-bold text-foreground">Grup Kustom</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {customGroups.map((group) => {
              const val = getGroupTotal(group.id);
              const pct = totalValue > 0 ? Math.round((val / totalValue) * 100) : 0;
              return (
                <div key={group.id} className="card-elevated p-3">
                  <p className="text-[10px] text-muted-foreground/45 truncate font-semibold">{group.name}</p>
                  <p className="text-[14px] font-extrabold number-display mt-1">{formatCompact(val)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 rounded-full bg-surface-secondary overflow-hidden">
                      <motion.div
                        className="h-full rounded-full gradient-bg"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground/30 font-bold number-display">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Recent Activity */}
      {recentTxs.length > 0 && (
        <motion.section variants={fadeUp} className="px-3 mt-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-[12px] font-bold text-foreground">Aktivitas Terbaru</span>
            </div>
            <button onClick={() => navigate('assets')} className="text-[10px] font-bold text-primary press-scale">
              Lihat semua
            </button>
          </div>
          <div className="card-elevated overflow-hidden divide-y divide-border/6">
            {recentTxs.map((tx) => {
              const asset = assets.find((a) => a.id === tx.assetId);
              const isAdd = tx.type === 'add';
              return (
                <div key={tx.id} className="flex items-center justify-between py-2.5 px-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                      isAdd ? 'bg-emerald-500/8' : 'bg-red-500/8'
                    }`}>
                      {isAdd ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold">{asset?.name ?? '—'}</p>
                      <p className="text-[9px] text-muted-foreground/30 mt-0.5">{tx.notes || tx.date}</p>
                    </div>
                  </div>
                  <span className={`text-[12px] font-bold number-display ${isAdd ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isAdd ? '+' : '−'}{formatCompact(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Empty State — First-time user onboarding */}
      {assets.length === 0 && (
        <motion.section variants={fadeUp} className="px-4 mt-4 pb-3">
          <div className="card-elevated p-5 text-center space-y-3">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-[36px]"
            >
              🚀
            </motion.div>
            <div>
              <p className="text-[14px] font-bold">Selamat datang di AsetKu!</p>
              <p className="text-[11px] text-muted-foreground/50 mt-1 leading-relaxed">
                Mulai lacak kekayaanmu dengan menambah aset pertama. Bisa rekening bank, saham, crypto, properti, atau apapun.
              </p>
            </div>
            <button
              onClick={() => navigate('assets')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full btn-gold text-[#3d2e00] text-[11px] font-bold shadow-md shadow-amber-500/20 press-scale"
            >
              <Wallet className="h-3.5 w-3.5" /> Tambah Aset Pertama
            </button>
          </div>
        </motion.section>
      )}
    </motion.div>
    </PageLayout>
  );
}
