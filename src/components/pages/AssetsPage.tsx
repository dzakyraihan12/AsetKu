'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { formatCurrency, formatCompact } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { AssetFormModal } from '@/components/shared/AssetFormModal';
import { AssetDetailModal } from '@/components/shared/AssetDetailModal';

const CATEGORY_ICONS: Record<string, string> = {
  'Cash': '💵', 'Rekening Bank': '🏦', 'Deposito': '🔒', 'Saham': '📈',
  'Crypto': '₿', 'Properti': '🏠', 'Kendaraan': '🚗', 'Emas': '✨',
  'Piutang': '📋', 'Lainnya': '📦',
};

const fadeUp = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function AssetsPage() {
  const { assets, categories, transactions, getAssetValue, getTotalValue } = useStore();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [detailAsset, setDetailAsset] = useState<string | null>(null);

  const totalValue = useMemo(() => getTotalValue(), [assets, transactions]);

  const filteredAssets = useMemo(() => {
    let result = assets;
    if (search) result = result.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
    if (filterCat) result = result.filter((a) => a.categoryId === filterCat);
    return result.sort((a, b) => getAssetValue(b.id) - getAssetValue(a.id));
  }, [assets, search, filterCat, getAssetValue]);

  const filteredTotal = useMemo(() => {
    return filteredAssets.reduce((sum, a) => sum + getAssetValue(a.id), 0);
  }, [filteredAssets, getAssetValue]);

  const activeCategories = useMemo(() => {
    return categories.filter(c => assets.some(a => a.categoryId === c.id));
  }, [categories, assets]);

  const getAssetMonthChange = (assetId: string) => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return transactions
      .filter((t) => t.assetId === assetId && t.date.startsWith(key))
      .reduce((sum, t) => sum + (t.type === 'add' ? t.amount : -t.amount), 0);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header with gradient */}
      <div className="hero-gradient rounded-b-[24px] px-4 pt-5 pb-4 wealth-card safe-top">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[18px]">💰</span>
              <h1 className="text-[16px] font-extrabold text-white tracking-tight">Aset Saya</h1>
            </div>
            <p className="text-[11px] text-white/45 number-display mt-1 ml-[34px]">
              {formatCurrency(filteredTotal)} · {filteredAssets.length} aset
            </p>
          </div>
          <Button variant="gold" size="sm" onClick={() => { setEditingAsset(null); setShowForm(true); }}>
            <Plus className="h-3.5 w-3.5" /> Tambah
          </Button>
        </div>
        {/* Search inside hero */}
        <div className="mt-3.5 relative z-10">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              placeholder="Cari aset..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-2xl bg-white/[0.08] pl-10 pr-4 text-[12px] text-white placeholder:text-white/30 border border-white/[0.08] focus:outline-none focus:border-white/20 focus:bg-white/[0.12] transition-all backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="px-3 pt-3 pb-1.5">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterCat('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
              !filterCat ? 'btn-gradient text-white shadow-sm shadow-sky-900/15' : 'bg-surface border border-border/40 text-muted-foreground/60'
            }`}
          >
            Semua
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCat(cat.id === filterCat ? '' : cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 ${
                filterCat === cat.id ? 'btn-gradient text-white shadow-sm shadow-sky-900/15' : 'bg-surface border border-border/40 text-muted-foreground/60'
              }`}
            >
              <span className="text-[10px]">{CATEGORY_ICONS[cat.name] || '📦'}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <motion.div
        className="px-3 pb-4 space-y-1"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.02 } } }}
      >
        {filteredAssets.map((asset) => {
          const value = getAssetValue(asset.id);
          const monthChange = getAssetMonthChange(asset.id);
          const catName = categories.find(c => c.id === asset.categoryId)?.name ?? '';
          const icon = CATEGORY_ICONS[catName] || '📦';
          const pct = totalValue > 0 ? Math.round((value / totalValue) * 100) : 0;

          return (
            <motion.button
              key={asset.id}
              variants={fadeUp}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border/15 text-left transition-all active:scale-[0.98] shadow-subtle hover:shadow-card overflow-hidden relative"
              onClick={() => setDetailAsset(asset.id)}
            >
              {/* Left category color bar */}
              <div
                className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full"
                style={{ backgroundColor: ['#2563EB', '#0EA5E9', '#10B981', '#EAB308', '#EC4899', '#8B5CF6', '#F97316'][categories.findIndex(c => c.id === asset.categoryId) % 7] }}
              />
              <div className="h-9 w-9 rounded-xl bg-surface-secondary flex items-center justify-center shrink-0 ml-1">
                <span className="text-sm">{icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-caption font-semibold truncate">{asset.name}</p>
                  <span className="text-micro px-1.5 py-[1px] rounded bg-surface-secondary text-muted-foreground/40 font-bold">{pct}%</span>
                </div>
                <p className="text-micro text-muted-foreground/35 mt-0.5">{catName}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-caption font-bold number-display">{formatCompact(value)}</p>
                {monthChange !== 0 && (
                  <div className={`flex items-center gap-0.5 justify-end mt-0.5 ${monthChange > 0 ? 'text-success' : 'text-destructive'}`}>
                    {monthChange > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    <span className="text-micro font-semibold number-display">
                      {monthChange > 0 ? '+' : ''}{formatCompact(monthChange)}
                    </span>
                  </div>
                )}
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/15 shrink-0" />
            </motion.button>
          );
        })}

        {filteredAssets.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto">
              <span className="text-xl">💰</span>
            </div>
            <p className="text-caption font-semibold">Belum ada aset</p>
            <p className="text-micro text-muted-foreground/40">Mulai lacak kekayaan kamu</p>
            <Button variant="gold" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" /> Tambah aset
            </Button>
          </div>
        )}
      </motion.div>

      <AssetFormModal open={showForm} onClose={() => setShowForm(false)} editId={editingAsset} />
      <AssetDetailModal
        assetId={detailAsset}
        onClose={() => setDetailAsset(null)}
        onEdit={(id) => { setDetailAsset(null); setEditingAsset(id); setShowForm(true); }}
      />
    </div>
  );
}
