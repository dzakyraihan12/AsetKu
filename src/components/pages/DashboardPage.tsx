'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Target, Eye, EyeOff, Wallet, PieChart, FolderOpen, Activity, Sun, CloudSun, Sunset, Moon, Crosshair, PlusCircle, Receipt, Banknote, Landmark, Lock, Bitcoin, Home, Car, Sparkles, ClipboardList, Package, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store';
import { formatCurrency, formatCompact, calculateProgress, formatRelativeDate } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';
import { useNavigate } from '@/hooks/useNavigation';
import { ProgressBar } from '@/components/ui/Progress';
import { GrowthChart } from '@/components/shared/GrowthChart';
import { PageLayout } from '@/components/layout/PageLayout';
import { getAvatarEmoji } from '@/components/shared/AvatarPicker';
import { AssetFormModal } from '@/components/shared/AssetFormModal';
import { GoalFormModal } from '@/components/shared/GoalFormModal';
import { TransactionFormModal } from '@/components/shared/TransactionFormModal';
import { SectionSkeleton } from '@/components/ui/Skeleton';
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

export function DashboardPage({ userName, userAvatar }: { userName: string | null; userAvatar: string | null }) {
  const { assets, transactions, customGroups, goals, categories, getAssetValue, getTotalValue, getGroupTotal, getCategoryTotal, isLoading } = useStore();
  const navigate = useNavigate();
  const [hideBalance, setHideBalance] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('asetku_hide_balance') === 'true';
    }
    return false;
  });
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showTxPicker, setShowTxPicker] = useState(false);
  const [showTxTypePicker, setShowTxTypePicker] = useState(false);
  const [txAssetId, setTxAssetId] = useState<string>('');
  const [txType, setTxType] = useState<'add' | 'subtract'>('add');
  const [showTxForm, setShowTxForm] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);
  const [changePeriod, setChangePeriod] = useState<'day' | 'week' | 'month'>('month');

  const toggleHideBalance = () => {
    const next = !hideBalance;
    setHideBalance(next);
    localStorage.setItem('asetku_hide_balance', String(next));
  };

  const totalValue = useMemo(() => getTotalValue(), [assets, transactions]);
  const animatedTotal = useCountUp(totalValue, 900);

  // Primary goal from localStorage preference
  const primaryGoal = useMemo(() => {
    if (goals.length === 0) return null;
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('asetku_primary_goal');
      if (storedId) {
        const found = goals.find(g => g.id === storedId);
        if (found) return found;
      }
    }
    return goals[0];
  }, [goals]);

  const periodChange = useMemo(() => {
    const now = new Date();
    let filterFn: (date: string) => boolean;
    if (changePeriod === 'day') {
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      filterFn = (date) => date === today;
    } else if (changePeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`;
      filterFn = (date) => date >= weekAgoStr;
    } else {
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      filterFn = (date) => date.startsWith(key);
    }
    return transactions
      .filter((t) => filterFn(t.date))
      .reduce((sum, t) => sum + (t.type === 'add' ? t.amount : -t.amount), 0);
  }, [transactions, changePeriod]);

  // Keep monthChange for backwards compat in other calculations
  const monthChange = useMemo(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return transactions
      .filter((t) => t.date.startsWith(key))
      .reduce((sum, t) => sum + (t.type === 'add' ? t.amount : -t.amount), 0);
  }, [transactions]);

  const prevTotal = totalValue - periodChange;
  const periodPct = prevTotal > 0 ? ((periodChange / prevTotal) * 100).toFixed(1) : '0';
  const periodLabel = changePeriod === 'day' ? 'hari ini' : changePeriod === 'week' ? 'minggu ini' : 'bulan ini';
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

  const allTxsSorted = useMemo(() => {
    return [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions]);

  // Micro-trend: previous month growth for stats pills (#5)
  const prevMonthChange = useMemo(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const key = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    return transactions
      .filter((t) => t.date.startsWith(key))
      .reduce((sum, t) => sum + (t.type === 'add' ? t.amount : -t.amount), 0);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('settings')} className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md shadow-lg shadow-black/10 press-scale">
            <span className="text-[16px]">{getAvatarEmoji(userAvatar)}</span>
          </button>
          <div>
            <p className="text-[11px] text-white/50 font-medium flex items-center gap-1"><greeting.icon className="h-3 w-3 text-white/60" /> Selamat {greeting.text}</p>
            <p className="text-[15px] font-extrabold text-white tracking-tight -mt-0.5">{userName || 'User'}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md ${periodChange >= 0 ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/25' : 'bg-red-400/20 text-red-200 border border-red-400/25'}`}>
          {periodChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {periodChange >= 0 ? '+' : ''}{periodPct}%
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-white/35 uppercase tracking-[0.1em] font-bold">Total Kekayaan</p>
          <button onClick={toggleHideBalance} className="p-1 rounded-full hover:bg-white/10 transition-colors">
            {hideBalance ? <EyeOff className="h-3.5 w-3.5 text-white/40" /> : <Eye className="h-3.5 w-3.5 text-white/40" />}
          </button>
        </div>
        <p className="text-[30px] font-extrabold text-white tracking-[-0.04em] number-display mt-1 leading-none">
          {hideBalance ? '••••••••' : formatCurrency(animatedTotal)}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-[11px] font-semibold number-display ${periodChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            {hideBalance ? '•••' : `${periodChange >= 0 ? '↑' : '↓'} ${formatCompact(Math.abs(periodChange))}`}
          </span>
          {/* Period selector */}
          <div className="flex items-center gap-0.5 bg-white/[0.08] rounded-full p-[2px]">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setChangePeriod(p)}
                className={`px-2 py-[2px] rounded-full text-[8px] font-bold transition-all ${
                  changePeriod === p ? 'bg-white/20 text-white' : 'text-white/30'
                }`}
              >
                {p === 'day' ? '1H' : p === 'week' ? '1M' : '1B'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-1.5">
        <div className="flex-1 bg-white/[0.08] backdrop-blur-md rounded-xl px-2.5 py-2 border border-white/[0.08]">
          <p className="text-[8px] text-white/30 font-bold uppercase">Aset</p>
          <p className="text-[14px] font-extrabold text-white number-display">{assets.length}</p>
        </div>
        <div className="flex-1 bg-white/[0.08] backdrop-blur-md rounded-xl px-2.5 py-2 border border-white/[0.08]">
          <p className="text-[8px] text-white/30 font-bold uppercase">Kategori</p>
          <p className="text-[14px] font-extrabold text-white number-display">{categoryAllocation.length}</p>
        </div>
        <div className="flex-1 bg-white/[0.08] backdrop-blur-md rounded-xl px-2.5 py-2 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <p className="text-[8px] text-white/30 font-bold uppercase">Growth</p>
            {prevMonthChange !== 0 && (
              <span className={`text-[7px] font-bold ${monthChange > prevMonthChange ? 'text-emerald-300' : 'text-red-300'}`}>
                {monthChange > prevMonthChange ? '↑' : '↓'}vs lalu
              </span>
            )}
          </div>
          <p className={`text-[14px] font-extrabold number-display ${periodChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            {periodChange >= 0 ? '+' : ''}{formatCompact(periodChange)}
          </p>
        </div>
      </div>
    </>
  );

  return (
    <PageLayout pageKey="overview" headerContent={headerContent}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="pb-2">

      {/* Quick Actions */}
      <motion.section variants={fadeUp} className="px-4 mt-3">
        <div className="flex gap-2">
          <button
            onClick={() => setShowAssetForm(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl btn-gradient text-white press-scale shadow-sm shadow-sky-900/15 hover:brightness-110 transition-all"
          >
            <PlusCircle className="h-3.5 w-3.5 text-white/90" />
            <span className="text-[10px] font-bold text-white/90">Tambah Aset</span>
          </button>
          <button
            onClick={() => setShowTxPicker(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl btn-gradient text-white press-scale shadow-sm shadow-sky-900/15 hover:brightness-110 transition-all"
          >
            <Receipt className="h-3.5 w-3.5 text-white/90" />
            <span className="text-[10px] font-bold text-white/90">Transaksi</span>
          </button>
          <button
            onClick={() => setShowGoalForm(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl btn-gradient text-white press-scale shadow-sm shadow-sky-900/15 hover:brightness-110 transition-all"
          >
            <Crosshair className="h-3.5 w-3.5 text-white/90" />
            <span className="text-[10px] font-bold text-white/90">Buat Target</span>
          </button>
        </div>
      </motion.section>

      {/* Goal Progress - primary goal */}
      {primaryGoal && (
        <motion.section variants={fadeUp} className="px-3 mt-3">
          <div className="card-elevated p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[11px] font-semibold">{primaryGoal.name}</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">Utama</span>
              </div>
              <span className="text-[12px] font-extrabold number-display text-primary">{progress}%</span>
            </div>
            <ProgressBar value={progress} size="sm" variant="gradient" />
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] text-muted-foreground/40 number-display font-medium">{formatCompact(totalValue)}</span>
              <span className="text-[9px] text-amber-600 dark:text-amber-400 number-display font-bold">{formatCompact(primaryGoal.targetAmount)}</span>
            </div>
          </div>
        </motion.section>
      )}

      {/* Growth Chart */}
      {isLoading ? (
        <SectionSkeleton type="chart" />
      ) : (
      <motion.section variants={fadeUp} className="px-3 mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary/60" />
            <span className="text-[12px] font-bold text-foreground">Pertumbuhan</span>
          </div>
          <span className="chip-accent"><TrendingUp className="h-2.5 w-2.5" /> 6 bulan</span>
        </div>
        <div className="card-elevated p-3 pb-1">
          <GrowthChart />
        </div>
      </motion.section>
      )}

      {/* Allocation */}
      {categoryAllocation.length > 0 && (
        <motion.section variants={fadeUp} className="mt-4">
          <div className="px-3 mb-2 flex items-center gap-2">
            <PieChart className="h-3.5 w-3.5 text-primary/60" />
            <span className="text-[12px] font-bold text-foreground">Alokasi Aset</span>
          </div>
          <div className="px-3 mb-2.5">
            <div className="h-2.5 rounded-full overflow-hidden flex gap-[1.5px] bg-surface-secondary/80">
              {categoryAllocation.map((cat, i) => {
                const pct = (cat.value / totalValue) * 100;
                const colors = ['#2563EB', '#0EA5E9', '#10B981', '#EAB308', '#EC4899', '#8B5CF6', '#F97316'];
                return (
                  <motion.div key={cat.id} className="h-full first:rounded-l-full last:rounded-r-full" style={{ backgroundColor: colors[i % colors.length] }} initial={{ flex: 0 }} animate={{ flex: pct }} transition={{ duration: 0.7, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }} />
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-3">
            {categoryAllocation.map((cat, i) => {
              const pct = Math.round((cat.value / totalValue) * 100);
              const colors = ['#2563EB', '#0EA5E9', '#10B981', '#EAB308', '#EC4899', '#8B5CF6', '#F97316'];
              return (
                <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.04 }} className="shrink-0 min-w-[100px] p-3 rounded-2xl bg-surface border border-border/20 shadow-card">
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
            <button onClick={() => navigate('assets')} className="text-[10px] font-bold text-primary press-scale">Lihat semua</button>
          </div>
          <div className="card-elevated overflow-hidden divide-y divide-border/8">
            {topAssets.map((asset, idx) => {
              const catName = categories.find(c => c.id === asset.categoryId)?.name ?? '';
              const IconComp = CATEGORY_ICONS[catName] || Package;
              const pct = totalValue > 0 ? Math.round((asset.value / totalValue) * 100) : 0;
              return (
                <motion.div key={asset.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + idx * 0.04 }} className="flex items-center justify-between py-3 px-3.5">
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
                      <motion.div className="h-full rounded-full gradient-bg" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground/30 font-bold number-display">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Recent Activity — shows both date and notes */}
      {recentTxs.length > 0 && (
        <motion.section variants={fadeUp} className="px-3 mt-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-[12px] font-bold text-foreground">Aktivitas Terbaru</span>
            </div>
            <button onClick={() => setShowAllTx(true)} className="text-[10px] font-bold text-primary press-scale">Lihat semua</button>
          </div>
          <div className="card-elevated overflow-hidden divide-y divide-border/6">
            {recentTxs.map((tx) => {
              const asset = assets.find((a) => a.id === tx.assetId);
              const isAdd = tx.type === 'add';
              return (
                <div key={tx.id} className="flex items-center justify-between py-2.5 px-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isAdd ? 'bg-emerald-500/8' : 'bg-red-500/8'}`}>
                      {isAdd ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold">{asset?.name ?? '—'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-muted-foreground/30">{formatRelativeDate(tx.date)}</span>
                        {tx.notes && (
                          <>
                            <span className="text-[9px] text-muted-foreground/15">·</span>
                            <span className="text-[9px] text-muted-foreground/40 truncate max-w-[100px]">{tx.notes}</span>
                          </>
                        )}
                      </div>
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

      {/* Empty State — with loading guard (issue #9) */}
      {assets.length === 0 && !isLoading && (
        <motion.section variants={fadeUp} className="px-4 mt-4 pb-3">
          <div className="card-elevated p-5 text-center space-y-3">
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="text-[36px]">🚀</motion.div>
            <div>
              <p className="text-[14px] font-bold">Selamat datang di AsetKu!</p>
              <p className="text-[11px] text-muted-foreground/50 mt-1 leading-relaxed">Mulai lacak kekayaanmu dengan menambah aset pertama.</p>
            </div>
            <button onClick={() => setShowAssetForm(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full btn-gold text-[#3d2e00] text-[11px] font-bold shadow-md shadow-amber-500/20 press-scale">
              <Wallet className="h-3.5 w-3.5" /> Tambah Aset Pertama
            </button>
          </div>
        </motion.section>
      )}
    </motion.div>

      {/* Modals */}
      <AssetFormModal open={showAssetForm} onClose={() => setShowAssetForm(false)} editId={null} />
      <GoalFormModal open={showGoalForm} onClose={() => setShowGoalForm(false)} editId={null} />

      {/* Transaction Asset Picker — Bottom Sheet */}
      <AnimatePresence>
        {showTxPicker && (
          <motion.div
            key="tx-picker-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-end justify-center"
            onClick={() => setShowTxPicker(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative w-full max-w-lg bg-surface rounded-t-3xl p-4 pb-8 safe-bottom border-t border-border/20 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-border/40 mx-auto mb-4" />
              <h3 className="text-[14px] font-bold mb-3">Pilih Aset untuk Transaksi</h3>
              {assets.length === 0 ? (
                <p className="text-center text-[12px] text-muted-foreground/50 py-8">Belum ada aset. Tambah aset dulu ya.</p>
              ) : (
                <div className="space-y-1 max-h-[50vh] overflow-y-auto no-scrollbar">
                  {assets.map((asset) => {
                    const catName = categories.find(c => c.id === asset.categoryId)?.name ?? '';
                    const IconComp = CATEGORY_ICONS[catName] || Package;
                    const val = getAssetValue(asset.id);
                    return (
                      <button
                        key={asset.id}
                        onClick={() => { setTxAssetId(asset.id); setShowTxPicker(false); setShowTxTypePicker(true); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-secondary/70 active:bg-surface-secondary transition-colors text-left press-scale"
                      >
                        <div className="h-9 w-9 rounded-xl bg-surface-secondary flex items-center justify-center border border-border/15">
                          <IconComp className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold truncate">{asset.name}</p>
                          <p className="text-[10px] text-muted-foreground/40">{catName}</p>
                        </div>
                        <span className="text-[11px] font-bold number-display text-muted-foreground/60">{formatCompact(val)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Type Picker — Bottom Sheet */}
      <AnimatePresence>
        {showTxTypePicker && (
          <motion.div
            key="tx-type-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-end justify-center"
            onClick={() => setShowTxTypePicker(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative w-full max-w-lg bg-surface rounded-t-3xl p-4 pb-8 safe-bottom border-t border-border/20 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-border/40 mx-auto mb-4" />
              <h3 className="text-[14px] font-bold mb-1">Jenis Transaksi</h3>
              <p className="text-[11px] text-muted-foreground/40 mb-1">
                {assets.find(a => a.id === txAssetId)?.name ?? 'Aset'}
              </p>
              <p className="text-[10px] text-muted-foreground/30 mb-4 number-display">
                Saldo saat ini: <span className="font-semibold text-foreground/60">{formatCurrency(getAssetValue(txAssetId))}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setTxType('add'); setShowTxTypePicker(false); setShowTxForm(true); }}
                  className="flex-1 flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-success/5 border border-success/15 press-scale active:bg-success/10 transition-colors"
                >
                  <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center">
                    <ArrowUpRight className="h-6 w-6 text-success" />
                  </div>
                  <div className="text-center">
                    <span className="text-[12px] font-bold text-success block">Tambah Nilai</span>
                    <span className="text-[9px] text-success/50">Pemasukan, investasi</span>
                  </div>
                </button>
                <button
                  onClick={() => { setTxType('subtract'); setShowTxTypePicker(false); setShowTxForm(true); }}
                  className="flex-1 flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-destructive/5 border border-destructive/15 press-scale active:bg-destructive/10 transition-colors"
                >
                  <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                    <ArrowDownRight className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="text-center">
                    <span className="text-[12px] font-bold text-destructive block">Kurangi Nilai</span>
                    <span className="text-[9px] text-destructive/50">Penarikan, penurunan</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {txAssetId && (
        <TransactionFormModal
          open={showTxForm}
          onClose={() => { setShowTxForm(false); setTxAssetId(''); }}
          assetId={txAssetId}
          type={txType}
        />
      )}

      {/* Full Transaction History Bottom Sheet (#3) */}
      <AnimatePresence>
        {showAllTx && (
          <motion.div
            key="all-tx-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-end justify-center"
            onClick={() => setShowAllTx(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative w-full max-w-lg bg-surface rounded-t-3xl p-4 pb-8 safe-bottom border-t border-border/20 shadow-xl"
              style={{ maxHeight: '75vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-border/40 mx-auto mb-4" />
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-bold">Semua Transaksi</h3>
                <span className="text-[10px] text-muted-foreground/40 font-medium">{allTxsSorted.length} transaksi</span>
              </div>
              <div className="space-y-0 overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(75vh - 100px)' }}>
                {allTxsSorted.map((tx) => {
                  const asset = assets.find((a) => a.id === tx.assetId);
                  const isAdd = tx.type === 'add';
                  return (
                    <div key={tx.id} className="flex items-center justify-between py-2.5 px-1 border-b border-border/8 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isAdd ? 'bg-emerald-500/8' : 'bg-red-500/8'}`}>
                          {isAdd ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold">{asset?.name ?? '—'}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] text-muted-foreground/30">{formatRelativeDate(tx.date)}</span>
                            {tx.notes && (
                              <>
                                <span className="text-[9px] text-muted-foreground/15">·</span>
                                <span className="text-[9px] text-muted-foreground/40 truncate max-w-[120px]">{tx.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold number-display ${isAdd ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isAdd ? '+' : '−'}{formatCompact(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
