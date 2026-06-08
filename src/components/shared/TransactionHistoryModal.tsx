'use client';

import { useState, useMemo } from 'react';
import { Search, X, ArrowUpRight, ArrowDownRight, Filter, Calendar, Trash2, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as SelectPrimitive from '@radix-ui/react-select';
import { useStore } from '@/store';
import { formatCompact, formatRelativeDate, cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-filter by asset ID (e.g. from asset detail) */
  assetId?: string;
}

type FilterType = 'all' | 'add' | 'subtract';
type SortOrder = 'newest' | 'oldest' | 'highest' | 'lowest';

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'highest', label: 'Terbesar' },
  { value: 'lowest', label: 'Terkecil' },
];

export function TransactionHistoryModal({ open, onClose, assetId }: Props) {
  const { transactions, assets, categories, deleteTransaction } = useStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterCatId, setFilterCatId] = useState('');
  const [filterAssetId, setFilterAssetId] = useState(assetId || '');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const effectiveAssetId = assetId || filterAssetId;

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (effectiveAssetId) {
      result = result.filter(t => t.assetId === effectiveAssetId);
    }
    if (filterCatId) {
      const catAssetIds = assets.filter(a => a.categoryId === filterCatId).map(a => a.id);
      result = result.filter(t => catAssetIds.includes(t.assetId));
    }
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => {
        const asset = assets.find(a => a.id === t.assetId);
        return (
          asset?.name.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q) ||
          t.date.includes(q)
        );
      });
    }
    switch (sortOrder) {
      case 'newest': result.sort((a, b) => b.date.localeCompare(a.date)); break;
      case 'oldest': result.sort((a, b) => a.date.localeCompare(b.date)); break;
      case 'highest': result.sort((a, b) => b.amount - a.amount); break;
      case 'lowest': result.sort((a, b) => a.amount - b.amount); break;
    }
    return result;
  }, [transactions, assets, effectiveAssetId, filterCatId, filterType, search, sortOrder]);

  const totalIn = filtered.filter(t => t.type === 'add').reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter(t => t.type === 'subtract').reduce((s, t) => s + t.amount, 0);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach(tx => {
      const key = tx.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const usedCategories = useMemo(() => {
    const catIds = new Set(assets.map(a => a.categoryId));
    return categories.filter(c => catIds.has(c.id));
  }, [assets, categories]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="tx-history-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose();
            }}
            className="relative w-full max-w-lg bg-surface rounded-t-[24px] border-t border-border/20 shadow-float flex flex-col"
            style={{ maxHeight: '92dvh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0">
              <div className="h-[5px] w-10 rounded-full bg-foreground/15" />
            </div>

            {/* Header — fixed */}
            <div className="px-4 pt-2 pb-3 shrink-0 overflow-hidden">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold tracking-tight">Riwayat Transaksi</h2>
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-full bg-surface-secondary flex items-center justify-center border border-border/20 press-scale"
                >
                  <X className="h-4 w-4 text-muted-foreground/60" />
                </button>
              </div>

              {/* Summary chips */}
              <div className="flex gap-2 mt-3">
                <div className="flex-1 min-w-0 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-2.5 py-2">
                  <p className="text-[8px] text-emerald-600/50 dark:text-emerald-400/50 uppercase font-bold">Masuk</p>
                  <p className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 number-display mt-0.5 truncate">+{formatCompact(totalIn)}</p>
                </div>
                <div className="flex-1 min-w-0 bg-red-500/5 border border-red-500/15 rounded-xl px-2.5 py-2">
                  <p className="text-[8px] text-red-600/50 dark:text-red-400/50 uppercase font-bold">Keluar</p>
                  <p className="text-[12px] font-bold text-red-600 dark:text-red-400 number-display mt-0.5 truncate">−{formatCompact(totalOut)}</p>
                </div>
                <div className="flex-1 min-w-0 bg-surface-secondary border border-border/15 rounded-xl px-2.5 py-2">
                  <p className="text-[8px] text-muted-foreground/40 uppercase font-bold">Total</p>
                  <p className="text-[12px] font-bold number-display mt-0.5">{filtered.length}</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari aset, catatan, tanggal..."
                  className="w-full h-9 pl-9 pr-10 rounded-xl bg-surface-secondary border border-border/20 text-[11px] placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </button>
                )}
              </div>

              {/* Filter row */}
              <div className="flex items-center gap-2 mt-2.5 overflow-x-auto no-scrollbar">
                {(['all', 'add', 'subtract'] as FilterType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={cn(
                      'shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border',
                      filterType === t
                        ? 'btn-gradient text-white border-transparent'
                        : 'bg-surface-secondary border-border/20 text-muted-foreground/60'
                    )}
                  >
                    {t === 'all' ? 'Semua' : t === 'add' ? '↑ Masuk' : '↓ Keluar'}
                  </button>
                ))}

                <div className="w-px h-4 bg-border/20 shrink-0" />

                {/* More filters button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all',
                    showFilters || filterCatId || filterAssetId
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-surface-secondary border-border/20 text-muted-foreground/60'
                  )}
                >
                  <Filter className="h-3 w-3" /> Filter
                  {(filterCatId || (filterAssetId && !assetId)) && (
                    <span className="h-4 w-4 rounded-full bg-primary text-white text-[8px] flex items-center justify-center">
                      {(filterCatId ? 1 : 0) + (filterAssetId && !assetId ? 1 : 0)}
                    </span>
                  )}
                </button>

                {/* Sort — Radix Select */}
                <SelectPrimitive.Root value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                  <SelectPrimitive.Trigger
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold bg-surface-secondary border border-border/20 text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 press-scale"
                  >
                    <SelectPrimitive.Value />
                    <SelectPrimitive.Icon>
                      <ChevronDown className="h-3 w-3 text-muted-foreground/40" />
                    </SelectPrimitive.Icon>
                  </SelectPrimitive.Trigger>
                  <SelectPrimitive.Portal>
                    <SelectPrimitive.Content
                      className="z-[200] overflow-hidden rounded-2xl bg-surface border border-border/30 shadow-elevated animate-in fade-in-0 zoom-in-95"
                      position="popper"
                      sideOffset={4}
                      align="end"
                    >
                      <SelectPrimitive.Viewport className="p-1.5">
                        {SORT_OPTIONS.map(opt => (
                          <SelectPrimitive.Item
                            key={opt.value}
                            value={opt.value}
                            className={cn(
                              'relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-medium cursor-pointer',
                              'outline-none select-none',
                              'data-[highlighted]:bg-primary/8 data-[highlighted]:text-primary',
                              'data-[state=checked]:font-bold'
                            )}
                          >
                            <SelectPrimitive.ItemIndicator>
                              <Check className="h-3 w-3 text-primary" />
                            </SelectPrimitive.ItemIndicator>
                            <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                          </SelectPrimitive.Item>
                        ))}
                      </SelectPrimitive.Viewport>
                    </SelectPrimitive.Content>
                  </SelectPrimitive.Portal>
                </SelectPrimitive.Root>
              </div>

              {/* Expanded filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2.5 space-y-2">
                      <div>
                        <label className="text-[9px] text-muted-foreground/40 uppercase font-bold">Kategori</label>
                        <div className="flex gap-1.5 mt-1 overflow-x-auto no-scrollbar">
                          <button
                            onClick={() => setFilterCatId('')}
                            className={cn(
                              'shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all',
                              !filterCatId ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-secondary border-border/20 text-muted-foreground/50'
                            )}
                          >
                            Semua
                          </button>
                          {usedCategories.map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => setFilterCatId(filterCatId === cat.id ? '' : cat.id)}
                              className={cn(
                                'shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all',
                                filterCatId === cat.id ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-secondary border-border/20 text-muted-foreground/50'
                              )}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      {!assetId && (
                        <div>
                          <label className="text-[9px] text-muted-foreground/40 uppercase font-bold">Aset</label>
                          <div className="flex gap-1.5 mt-1 overflow-x-auto no-scrollbar">
                            <button
                              onClick={() => setFilterAssetId('')}
                              className={cn(
                                'shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all',
                                !filterAssetId ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-secondary border-border/20 text-muted-foreground/50'
                              )}
                            >
                              Semua
                            </button>
                            {assets.map(a => (
                              <button
                                key={a.id}
                                onClick={() => setFilterAssetId(filterAssetId === a.id ? '' : a.id)}
                                className={cn(
                                  'shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all',
                                  filterAssetId === a.id ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-secondary border-border/20 text-muted-foreground/50'
                                )}
                              >
                                {a.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {(filterCatId || filterAssetId) && (
                        <button
                          onClick={() => { setFilterCatId(''); setFilterAssetId(''); }}
                          className="text-[10px] text-destructive font-bold press-scale"
                        >
                          Reset filter
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Transaction list — scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}>
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[24px] mb-2">📭</p>
                  <p className="text-[12px] font-bold text-muted-foreground/50">Tidak ada transaksi</p>
                  <p className="text-[10px] text-muted-foreground/30 mt-1">Coba ubah filter atau kata kunci pencarian</p>
                </div>
              ) : (
                <div className="space-y-3 pb-6">
                  {grouped.map(([date, txs]) => (
                    <div key={date}>
                      <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm py-1.5">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground/25" />
                          <span className="text-[10px] font-bold text-muted-foreground/40">{formatRelativeDate(date)}</span>
                          <div className="flex-1 h-px bg-border/10" />
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        {txs.map(tx => {
                          const asset = assets.find(a => a.id === tx.assetId);
                          const isAdd = tx.type === 'add';
                          return (
                            <div key={tx.id} className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-surface-secondary/50 transition-colors group">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={cn(
                                  'h-8 w-8 rounded-xl flex items-center justify-center shrink-0',
                                  isAdd ? 'bg-emerald-500/8' : 'bg-red-500/8'
                                )}>
                                  {isAdd ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-semibold truncate">{asset?.name ?? '—'}</p>
                                  {tx.notes && (
                                    <p className="text-[9px] text-muted-foreground/40 mt-0.5 truncate">{tx.notes}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className={cn(
                                  'text-[12px] font-bold number-display',
                                  isAdd ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                )}>
                                  {isAdd ? '+' : '−'}{formatCompact(tx.amount)}
                                </span>
                                <button
                                  onClick={() => setDeleteId(tx.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 transition-all"
                                >
                                  <Trash2 className="h-3 w-3 text-destructive/60" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ConfirmDialog
              open={!!deleteId}
              title="Hapus Transaksi?"
              message="Transaksi ini akan dihapus permanen dan nilai aset akan berubah."
              onConfirm={async () => {
                if (deleteId) {
                  await deleteTransaction(deleteId);
                  setDeleteId(null);
                  toast('Transaksi dihapus', 'info');
                }
              }}
              onCancel={() => setDeleteId(null)}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
