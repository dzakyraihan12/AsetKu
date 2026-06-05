'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, X, TrendingUp, TrendingDown, Wallet, Banknote, Landmark, Lock, Bitcoin, Home, Car, Sparkles, ClipboardList, Package, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { formatCurrency, formatCompact } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { AssetFormModal } from '@/components/shared/AssetFormModal';
import { AssetDetailModal } from '@/components/shared/AssetDetailModal';
import { TransactionFormModal } from '@/components/shared/TransactionFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SwipeableAssetItem } from '@/components/shared/SwipeableAssetItem';
import { PageLayout } from '@/components/layout/PageLayout';
import { useToast } from '@/components/ui/Toast';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Cash': Banknote, 'Rekening Bank': Landmark, 'Deposito': Lock, 'Saham': TrendingUp,
  'Crypto': Bitcoin, 'Properti': Home, 'Kendaraan': Car, 'Emas': Sparkles,
  'Piutang': ClipboardList, 'Lainnya': Package,
};

const fadeUp = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function AssetsPage() {
  const { assets, categories, transactions, getAssetValue, getTotalValue, deleteAsset, isLoading } = useStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [detailAsset, setDetailAsset] = useState<string | null>(null);
  const [showTxForm, setShowTxForm] = useState(false);
  const [txAssetId, setTxAssetId] = useState<string>('');
  const [txType, setTxType] = useState<'add' | 'subtract'>('add');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const handleSwipeDelete = async () => {
    if (!confirmDeleteId) return;
    await deleteAsset(confirmDeleteId);
    setConfirmDeleteId(null);
    toast('Aset berhasil dihapus', 'info');
  };

  const headerContent = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-white/80" />
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
      {/* Search with clear button */}
      <div className="mt-3.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none z-10" />
          <input
            placeholder="Cari aset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-2xl bg-white/[0.08] pl-10 pr-10 text-[12px] text-white placeholder:text-white/30 border border-white/[0.08] focus:outline-none focus:border-white/20 focus:bg-white/[0.12] transition-all backdrop-blur-md"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center z-10 press-scale"
            >
              <X className="h-3 w-3 text-white/80" />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <PageLayout pageKey="assets" headerContent={headerContent}>

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
              {(() => { const Icon = CATEGORY_ICONS[cat.name] || Package; return <Icon className="h-3 w-3" />; })()}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Swipe hint */}
      {filteredAssets.length > 0 && (
        <div className="px-3 pb-1">
          <p className="text-[9px] text-muted-foreground/30 text-center">← Geser item ke kiri untuk aksi cepat</p>
        </div>
      )}

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
          const IconComp = CATEGORY_ICONS[catName] || Package;
          const pct = totalValue > 0 ? Math.round((value / totalValue) * 100) : 0;

          return (
            <motion.div key={asset.id} variants={fadeUp}>
              <SwipeableAssetItem
                onEdit={() => { setEditingAsset(asset.id); setShowForm(true); }}
                onDelete={() => setConfirmDeleteId(asset.id)}
                onAddTransaction={() => { setTxAssetId(asset.id); setTxType('add'); setShowTxForm(true); }}
                onSubtractTransaction={() => { setTxAssetId(asset.id); setTxType('subtract'); setShowTxForm(true); }}
              >
                <button
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border/15 text-left transition-all shadow-subtle overflow-hidden relative"
                  onClick={() => setDetailAsset(asset.id)}
                >
                  <div
                    className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full"
                    style={{ backgroundColor: ['#2563EB', '#0EA5E9', '#10B981', '#EAB308', '#EC4899', '#8B5CF6', '#F97316'][categories.findIndex(c => c.id === asset.categoryId) % 7] }}
                  />
                  <div className="h-9 w-9 rounded-xl bg-surface-secondary flex items-center justify-center shrink-0 ml-1">
                    <IconComp className="h-4 w-4 text-muted-foreground/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-caption font-semibold truncate">{asset.name}</p>
                      <span className="text-micro px-1.5 py-[1px] rounded bg-surface-secondary text-muted-foreground/40 font-bold">{pct}%</span>
                    </div>
                    <p className="text-micro text-muted-foreground/35 mt-0.5">{catName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-caption font-bold number-display">{formatCurrency(value)}</p>
                    {monthChange !== 0 && (
                      <div className={`flex items-center gap-0.5 justify-end mt-0.5 ${monthChange > 0 ? 'text-success' : 'text-destructive'}`}>
                        {monthChange > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                        <span className="text-micro font-semibold number-display">
                          {monthChange > 0 ? '+' : ''}{formatCurrency(monthChange)}
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/15 shrink-0" />
                </button>
              </SwipeableAssetItem>
            </motion.div>
          );
        })}

        {/* Empty state with loading guard and proper icons (#6, #9) */}
        {filteredAssets.length === 0 && !isLoading && (
          <div className="text-center py-16 space-y-4 px-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto">
              <Wallet className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-[13px] font-bold">Belum ada aset</p>
              <p className="text-[11px] text-muted-foreground/50 mt-1.5 leading-relaxed">
                Mulai lacak seluruh kekayaan kamu dalam satu tempat.
              </p>
            </div>
            <div className="text-left max-w-[240px] mx-auto space-y-2 py-2">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <Landmark className="h-3 w-3 text-primary" />
                </div>
                <span className="text-[11px] text-muted-foreground/60">Rekening bank, deposito, cash</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-3 w-3 text-primary" />
                </div>
                <span className="text-[11px] text-muted-foreground/60">Saham, crypto, reksadana</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <Home className="h-3 w-3 text-primary" />
                </div>
                <span className="text-[11px] text-muted-foreground/60">Properti, kendaraan, emas & lainnya</span>
              </div>
            </div>
            <Button variant="gold" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" /> Tambah aset pertama
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
      {txAssetId && (
        <TransactionFormModal
          open={showTxForm}
          onClose={() => { setShowTxForm(false); setTxAssetId(''); }}
          assetId={txAssetId}
          type={txType}
        />
      )}
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Hapus Aset?"
        message="Aset beserta semua riwayat transaksinya akan dihapus permanen."
        onConfirm={handleSwipeDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </PageLayout>
  );
}
