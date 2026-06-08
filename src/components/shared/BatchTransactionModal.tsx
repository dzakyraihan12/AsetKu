'use client';

import { useState } from 'react';
import { Check, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatCompact } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Banknote, Landmark, Lock, TrendingUp, Bitcoin, Home, Car, Sparkles, ClipboardList, Package } from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Cash': Banknote, 'Rekening Bank': Landmark, 'Deposito': Lock, 'Saham': TrendingUp,
  'Crypto': Bitcoin, 'Properti': Home, 'Kendaraan': Car, 'Emas': Sparkles,
  'Piutang': ClipboardList, 'Lainnya': Package,
};

interface Props {
  open: boolean;
  onClose: () => void;
}

interface BatchEntry {
  assetId: string;
  amount: number;
  type: 'add' | 'subtract';
}

export function BatchTransactionModal({ open, onClose }: Props) {
  const { assets, categories, addTransaction, getAssetValue } = useStore();
  const { toast } = useToast();
  const [step, setStep] = useState<'select' | 'input' | 'done'>('select');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [entries, setEntries] = useState<BatchEntry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [currentType, setCurrentType] = useState<'add' | 'subtract'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleAsset = (id: string) => {
    setSelectedAssets(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const startInput = () => {
    if (selectedAssets.length === 0) return;
    setEntries([]);
    setCurrentIdx(0);
    setCurrentAmount(0);
    setCurrentType('add');
    setStep('input');
  };

  const nextAsset = () => {
    if (currentAmount > 0) {
      const newEntries = [...entries, { assetId: selectedAssets[currentIdx], amount: currentAmount, type: currentType }];
      setEntries(newEntries);

      if (currentIdx < selectedAssets.length - 1) {
        setCurrentIdx(currentIdx + 1);
        setCurrentAmount(0);
        setCurrentType('add');
      } else {
        // All done — submit
        submitAll(newEntries);
      }
    }
  };

  const skipAsset = () => {
    if (currentIdx < selectedAssets.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setCurrentAmount(0);
      setCurrentType('add');
    } else {
      submitAll(entries);
    }
  };

  const submitAll = async (finalEntries: BatchEntry[]) => {
    if (finalEntries.length === 0) {
      onClose();
      return;
    }
    setIsSubmitting(true);
    const today = new Date().toISOString().split('T')[0];
    for (const entry of finalEntries) {
      await addTransaction({ assetId: entry.assetId, type: entry.type, amount: entry.amount, notes: 'Batch update', date: today });
    }
    setIsSubmitting(false);
    setStep('done');
    toast(`${finalEntries.length} transaksi berhasil dicatat`, 'success');
    setTimeout(() => { setStep('select'); setSelectedAssets([]); setEntries([]); onClose(); }, 1200);
  };

  const currentAsset = step === 'input' ? assets.find(a => a.id === selectedAssets[currentIdx]) : null;
  const currentCatName = currentAsset ? categories.find(c => c.id === currentAsset.categoryId)?.name ?? '' : '';
  const IconComp = CATEGORY_ICONS[currentCatName] || Package;

  const handleClose = () => {
    setStep('select');
    setSelectedAssets([]);
    setEntries([]);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Batch Transaksi" preventClose={entries.length > 0 || currentAmount > 0}>
      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-[11px] text-muted-foreground/50 mb-3">Pilih aset yang mau diupdate sekaligus</p>
            {assets.length === 0 ? (
              <p className="text-center text-[12px] text-muted-foreground/40 py-6">Belum ada aset</p>
            ) : (
              <div className="space-y-1 max-h-[45vh] overflow-y-auto no-scrollbar">
                {assets.map((asset) => {
                  const catName = categories.find(c => c.id === asset.categoryId)?.name ?? '';
                  const Icon = CATEGORY_ICONS[catName] || Package;
                  const selected = selectedAssets.includes(asset.id);
                  return (
                    <button
                      key={asset.id}
                      onClick={() => toggleAsset(asset.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left press-scale ${
                        selected ? 'bg-primary/8 border border-primary/20' : 'hover:bg-surface-secondary/70 border border-transparent'
                      }`}
                    >
                      <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        selected ? 'bg-primary border-primary' : 'border-border/40'
                      }`}>
                        {selected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border/15">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate">{asset.name}</p>
                        <p className="text-[9px] text-muted-foreground/40">{catName}</p>
                      </div>
                      <span className="text-[10px] font-bold number-display text-muted-foreground/50">{formatCompact(getAssetValue(asset.id))}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <Button
              variant="gold"
              className="w-full mt-4"
              size="lg"
              onClick={startInput}
              disabled={selectedAssets.length === 0}
            >
              Lanjut ({selectedAssets.length} aset) <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {step === 'input' && currentAsset && (
          <motion.div key={`input-${currentIdx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {/* Progress */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                <div className="h-full rounded-full gradient-bg transition-all" style={{ width: `${((currentIdx + 1) / selectedAssets.length) * 100}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground/40 font-bold">{currentIdx + 1}/{selectedAssets.length}</span>
            </div>

            {/* Current asset info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary/50 border border-border/10 mb-4">
              <div className="h-10 w-10 rounded-xl bg-surface-secondary flex items-center justify-center border border-border/15">
                <IconComp className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <div>
                <p className="text-[13px] font-bold">{currentAsset.name}</p>
                <p className="text-[10px] text-muted-foreground/40">Saldo: {formatCurrency(getAssetValue(currentAsset.id))}</p>
              </div>
            </div>

            {/* Type toggle */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setCurrentType('add')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
                  currentType === 'add' ? 'bg-success/10 border border-success/20 text-success' : 'bg-surface-secondary border border-border/20 text-muted-foreground/40'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" /> Tambah
              </button>
              <button
                onClick={() => setCurrentType('subtract')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
                  currentType === 'subtract' ? 'bg-destructive/10 border border-destructive/20 text-destructive' : 'bg-surface-secondary border border-border/20 text-muted-foreground/40'
                }`}
              >
                <ArrowDownRight className="h-3.5 w-3.5" /> Kurangi
              </button>
            </div>

            <CurrencyInput
              label="Nominal"
              placeholder="1.000.000"
              value={currentAmount}
              onChange={(v) => setCurrentAmount(v)}
            />

            <div className="flex gap-2 mt-4">
              <button onClick={skipAsset} className="flex-1 h-11 rounded-xl bg-surface-secondary border border-border/20 text-[11px] font-bold text-muted-foreground/50 press-scale">
                Skip
              </button>
              <Button
                variant="gold"
                className="flex-1"
                size="lg"
                onClick={nextAsset}
                disabled={currentAmount <= 0}
              >
                {currentIdx < selectedAssets.length - 1 ? 'Next →' : 'Selesai ✓'}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-3">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }} className="text-[40px]">✅</motion.div>
            <p className="text-[14px] font-bold">Batch selesai!</p>
            <p className="text-[11px] text-muted-foreground/50">{entries.length} aset berhasil diupdate</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
