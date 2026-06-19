'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CreditCard, Calendar, FileText, Percent, Home, Car, GraduationCap, Smartphone, ShoppingBag, Package } from 'lucide-react';
import { useStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import type { Debt } from '@/types';

const DEBT_CATEGORIES = [
  { id: 'kpr', label: 'KPR', icon: Home },
  { id: 'kendaraan', label: 'Kendaraan', icon: Car },
  { id: 'pendidikan', label: 'Pendidikan', icon: GraduationCap },
  { id: 'elektronik', label: 'Elektronik', icon: Smartphone },
  { id: 'konsumtif', label: 'Konsumtif', icon: ShoppingBag },
  { id: 'lainnya', label: 'Lainnya', icon: Package },
];

interface DebtFormModalProps {
  open: boolean;
  onClose: () => void;
  editDebt?: Debt | null;
}

export function DebtFormModal({ open, onClose, editDebt = null }: DebtFormModalProps) {
  const { addDebt, updateDebt } = useStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    totalAmount: 0,
    monthlyInstallment: 0,
    remainingMonths: 0,
    interestRate: 0,
    notes: '',
  });

  const isEdit = !!editDebt;

  useEffect(() => {
    if (editDebt) {
      setFormData({
        name: editDebt.name,
        totalAmount: editDebt.totalAmount,
        monthlyInstallment: editDebt.monthlyInstallment,
        remainingMonths: editDebt.remainingMonths,
        interestRate: editDebt.interestRate || 0,
        notes: editDebt.notes,
      });
    } else {
      setFormData({ name: '', totalAmount: 0, monthlyInstallment: 0, remainingMonths: 0, interestRate: 0, notes: '' });
    }
  }, [editDebt, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.totalAmount <= 0 || formData.monthlyInstallment <= 0) {
      toast('Isi semua field yang wajib', 'error');
      return;
    }
    if (formData.remainingMonths <= 0) {
      toast('Sisa tenor harus lebih dari 0', 'error');
      return;
    }

    setLoading(true);
    haptic('medium');
    try {
      if (isEdit && editDebt) {
        await updateDebt(editDebt.id, formData);
        toast('Hutang berhasil diperbarui');
      } else {
        await addDebt(formData);
        toast('Hutang berhasil ditambahkan');
      }
      haptic('heavy');
      onClose();
    } catch (error) {
      toast('Gagal menyimpan hutang', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill from category
  const handleCategoryPick = (label: string) => {
    haptic('light');
    setSelectedCategory(label);
    if (!formData.name) {
      setFormData(prev => ({ ...prev, name: label }));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Hutang' : 'Tambah Hutang Baru'} preventClose={formData.name.length > 0 || formData.totalAmount > 0}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Debt Category Chips */}
        {!isEdit && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide">Kategori Hutang</label>
            <div className="flex flex-wrap gap-1.5">
              {DEBT_CATEGORIES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleCategoryPick(label)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-[5px] rounded-full text-[10px] font-semibold transition-all duration-150 press-scale',
                    selectedCategory === label
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:bg-surface-secondary'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Debt Name */}
        <div>
          <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide block mb-1.5">
            Nama Hutang
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="KPR Rumah, Kredit Mobil, dll"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border/30 bg-surface-secondary/30 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              disabled={loading}
            />
          </div>
        </div>

        {/* Total Amount */}
        <CurrencyInput
          label="Total Hutang Awal"
          value={formData.totalAmount}
          onChange={(value) => setFormData(prev => ({ ...prev, totalAmount: value }))}
          placeholder="100.000.000"
        />

        {/* Monthly Installment */}
        <CurrencyInput
          label="Cicilan per Bulan"
          value={formData.monthlyInstallment}
          onChange={(value) => setFormData(prev => ({ ...prev, monthlyInstallment: value }))}
          placeholder="5.000.000"
        />

        {/* Remaining Months */}
        <div>
          <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide block mb-1.5">
            Sisa Tenor (Bulan)
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
            <input
              type="number"
              value={formData.remainingMonths || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, remainingMonths: parseInt(e.target.value) || 0 }))}
              placeholder="24"
              min="0"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border/30 bg-surface-secondary/30 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              disabled={loading}
            />
          </div>
        </div>

        {/* Interest Rate (Optional) */}
        <div>
          <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide block mb-1.5">
            Bunga per Tahun <span className="text-muted-foreground/30">(opsional)</span>
          </label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
            <input
              type="number"
              step="0.1"
              value={formData.interestRate || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, interestRate: parseFloat(e.target.value) || 0 }))}
              placeholder="5.5"
              min="0"
              max="100"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border/30 bg-surface-secondary/30 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              disabled={loading}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide block mb-1.5">
            Catatan <span className="text-muted-foreground/30">(opsional)</span>
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Bank BCA, bunga tetap, jatuh tempo 2026..."
            className="w-full px-3 py-3 rounded-2xl border border-border/30 bg-surface-secondary/30 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none h-16"
            disabled={loading}
          />
        </div>

        {/* Summary Preview */}
        {formData.totalAmount > 0 && formData.monthlyInstallment > 0 && formData.remainingMonths > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-2xl bg-red-500/5 border border-red-500/15 p-3"
          >
            <p className="text-[9px] font-bold text-red-500/60 uppercase tracking-wide mb-2">Ringkasan Hutang</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-muted-foreground/40">Estimasi total bayar</span>
                <p className="font-bold number-display">
                  Rp {(formData.monthlyInstallment * formData.remainingMonths).toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground/40">Estimasi lunas</span>
                <p className="font-bold number-display">
                  {(() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + formData.remainingMonths);
                    return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                  })()}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <Button
          type="submit"
          variant="gold"
          className="w-full"
          size="lg"
          disabled={loading || !formData.name.trim() || formData.totalAmount <= 0 || formData.monthlyInstallment <= 0}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? 'Simpan Perubahan' : 'Tambah Hutang'}
        </Button>
      </form>
    </Modal>
  );
}
