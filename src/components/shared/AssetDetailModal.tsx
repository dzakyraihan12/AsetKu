'use client';

import { useState, useMemo } from 'react';
import { Plus, Minus, Trash2, Edit2, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { formatCurrency, formatCompact, formatDate } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { TransactionFormModal } from '@/components/shared/TransactionFormModal';

interface Props {
  assetId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
}

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 40;
  const w = 100;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const fillPoints = `0,${h} ${points} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.12" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill="url(#sparkFill)" />
      <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AssetDetailModal({ assetId, onClose, onEdit }: Props) {
  const { assets, transactions, categories, getAssetValue, deleteAsset, deleteTransaction } = useStore();
  const { toast } = useToast();
  const [showTxForm, setShowTxForm] = useState(false);
  const [txType, setTxType] = useState<'add' | 'subtract'>('add');
  const [showConfirm, setShowConfirm] = useState(false);

  const asset = assetId ? assets.find((a) => a.id === assetId) : null;

  const assetTxs = useMemo(() => {
    if (!asset) return [];
    return transactions
      .filter((t) => t.assetId === asset.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [asset, transactions]);

  const valueHistory = useMemo(() => {
    if (!asset || assetTxs.length === 0) return [];
    let running = 0;
    return assetTxs.map((tx) => {
      running += tx.type === 'add' ? tx.amount : -tx.amount;
      return running;
    });
  }, [asset, assetTxs]);

  const displayTxs = useMemo(() => [...assetTxs].reverse(), [assetTxs]);

  const monthChange = useMemo(() => {
    if (!asset) return 0;
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return assetTxs.filter((t) => t.date.startsWith(thisMonth))
      .reduce((sum, t) => sum + (t.type === 'add' ? t.amount : -t.amount), 0);
  }, [asset, assetTxs]);

  if (!asset) return null;

  const value = getAssetValue(asset.id);
  const catName = categories.find((c) => c.id === asset.categoryId)?.name ?? '';

  const handleDelete = async () => {
    await deleteAsset(asset.id);
    setShowConfirm(false);
    onClose();
    toast('Aset berhasil dihapus', 'info');
  };

  return (
    <>
      <Modal open={!!assetId} onClose={onClose} title={asset.name}>
        <div className="space-y-4">
          {/* Hero Value */}
          <div className="text-center py-3 space-y-1.5">
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold">{catName}</p>
            <motion.p
              className="text-[24px] font-extrabold font-tabular tracking-tight"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {formatCurrency(value)}
            </motion.p>
            {monthChange !== 0 && (
              <div className="flex items-center justify-center gap-1.5">
                <div className={`flex items-center gap-0.5 px-2 py-[3px] rounded-full text-[10px] font-bold ${
                  monthChange >= 0 ? 'bg-success-soft text-success' : 'bg-destructive-soft text-destructive'
                }`}>
                  {monthChange >= 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                  {monthChange >= 0 ? '+' : ''}{formatCompact(monthChange)}
                </div>
                <span className="text-[10px] text-muted-foreground/40">bulan ini</span>
              </div>
            )}
          </div>

          {/* Mini Sparkline */}
          {valueHistory.length >= 2 && (
            <div className="px-2 py-1 rounded-xl bg-surface-secondary/30 border border-border/10">
              <MiniSparkline data={valueHistory} />
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="accent" className="flex-1" onClick={() => { setTxType('add'); setShowTxForm(true); }}>
              <Plus className="h-3.5 w-3.5" /> Tambah
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => { setTxType('subtract'); setShowTxForm(true); }}>
              <Minus className="h-3.5 w-3.5" /> Kurangi
            </Button>
          </div>

          {/* Notes */}
          {asset.notes && (
            <div className="text-[12px] text-muted-foreground p-3 bg-surface-secondary rounded-xl border border-border/20">
              {asset.notes}
            </div>
          )}

          {/* Transaction History */}
          <div className="space-y-2">
            <h4 className="text-[10px] text-muted-foreground/45 uppercase tracking-wider font-bold">Riwayat Transaksi</h4>
            {displayTxs.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <FileText className="h-6 w-6 text-muted-foreground/30 mx-auto" />
                <p className="text-[11px] text-muted-foreground/40">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="space-y-0 max-h-56 overflow-y-auto rounded-2xl bg-surface-secondary/40 border border-border/15">
                {displayTxs.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 px-3 group border-b border-border/8 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                        tx.type === 'add' ? 'bg-success-soft' : 'bg-destructive-soft'
                      }`}>
                        {tx.type === 'add' ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
                      </div>
                      <div>
                        <p className={`text-[11px] font-bold font-tabular ${tx.type === 'add' ? 'text-success' : 'text-destructive'}`}>
                          {tx.type === 'add' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                        <p className="text-[9px] text-muted-foreground/40">{tx.notes || formatDate(tx.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-muted-foreground/30">{formatDate(tx.date)}</span>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive-soft transition-all"
                      >
                        <Trash2 className="h-3 w-3 text-destructive/60" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-2 border-t border-border/15">
            <Button variant="ghost" size="sm" onClick={() => onEdit(asset.id)} className="text-muted-foreground">
              <Edit2 className="h-3 w-3" /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowConfirm(true)} className="text-destructive hover:!bg-destructive-soft">
              <Trash2 className="h-3 w-3" /> Hapus
            </Button>
          </div>
        </div>
      </Modal>

      <TransactionFormModal open={showTxForm} onClose={() => setShowTxForm(false)} assetId={asset.id} type={txType} />
      <ConfirmDialog
        open={showConfirm}
        title="Hapus Aset?"
        message="Aset beserta semua riwayat transaksinya akan dihapus permanen."
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
