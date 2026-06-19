'use client';

import { useState } from 'react';
import { Moon, Sun, Monitor, Download, Upload, Plus, Edit2, Trash2, Shield, Settings, AlertTriangle, RotateCcw, User, Palette, FolderOpen, Database, Trophy, ChevronDown, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useStore } from '@/store';
import { db } from '@/db';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GroupFormModal } from '@/components/shared/GroupFormModal';
import { AvatarPicker, getAvatarEmoji } from '@/components/shared/AvatarPicker';
import { PageLayout } from '@/components/layout/PageLayout';
import { useNavigate } from '@/hooks/useNavigation';
import { StatisticsModal } from '@/components/shared/StatisticsModal';

const fadeUp = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const ACCENT_COLORS: Record<string, { primary: string; primaryLight: string; gradient: string }> = {
  blue: { primary: '201 75% 33%', primaryLight: '197 78% 51%', gradient: 'linear-gradient(98deg, #135581 2%, #24AAE1 100%)' },
  purple: { primary: '263 70% 50%', primaryLight: '258 90% 66%', gradient: 'linear-gradient(98deg, #6D28D9 2%, #8B5CF6 100%)' },
  green: { primary: '162 83% 24%', primaryLight: '160 64% 48%', gradient: 'linear-gradient(98deg, #047857 2%, #10B981 100%)' },
  orange: { primary: '21 90% 40%', primaryLight: '25 95% 53%', gradient: 'linear-gradient(98deg, #C2410C 2%, #F97316 100%)' },
  pink: { primary: '330 81% 42%', primaryLight: '330 81% 60%', gradient: 'linear-gradient(98deg, #BE185D 2%, #EC4899 100%)' },
};

function applyAccentColor(id: string) {
  const accent = ACCENT_COLORS[id];
  if (!accent) return;
  const root = document.documentElement;
  root.style.setProperty('--primary', accent.primary);
  root.style.setProperty('--primary-light', accent.primaryLight);
  const style = document.getElementById('accent-style') || (() => {
    const el = document.createElement('style');
    el.id = 'accent-style';
    document.head.appendChild(el);
    return el;
  })();
  style.textContent = `.btn-gradient { background: ${accent.gradient} !important; } .hero-gradient { background: linear-gradient(145deg, ${accent.gradient.includes('#6D28D9') ? '#3b1578, #6D28D9, #8B5CF6, #A78BFA' : accent.gradient.includes('#047857') ? '#022c22, #047857, #059669, #10B981' : accent.gradient.includes('#C2410C') ? '#431407, #C2410C, #EA580C, #F97316' : accent.gradient.includes('#BE185D') ? '#500724, #BE185D, #DB2777, #EC4899' : '#0d3553, #135581, #1a7bb5, #24AAE1'}) !important; } :is(.dark .hero-gradient) { background: linear-gradient(145deg, ${accent.gradient.includes('#6D28D9') ? '#1e0a3e, #4c1d95, #6D28D9, #7C3AED' : accent.gradient.includes('#047857') ? '#022c22, #064e3b, #047857, #059669' : accent.gradient.includes('#C2410C') ? '#431407, #7c2d12, #C2410C, #EA580C' : accent.gradient.includes('#BE185D') ? '#500724, #831843, #BE185D, #DB2777' : '#071d2e, #0e3a58, #125a82, #1882b5'}) !important; }`;
}

// --- Collapsible Section Component ---
function SettingsSection({ icon: Icon, title, children, defaultOpen = true, variant = 'default' }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'danger';
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="px-3 pb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-2.5 py-2.5 px-1 rounded-xl transition-colors press-scale',
          variant === 'danger' ? 'hover:bg-destructive/5' : 'hover:bg-surface-secondary/50'
        )}
      >
        <div className={cn(
          'h-7 w-7 rounded-lg flex items-center justify-center shrink-0',
          variant === 'danger' ? 'bg-destructive/10' : 'bg-primary/8'
        )}>
          <Icon className={cn('h-3.5 w-3.5', variant === 'danger' ? 'text-destructive' : 'text-primary')} />
        </div>
        <span className={cn(
          'text-[12px] font-bold flex-1 text-left',
          variant === 'danger' ? 'text-destructive' : 'text-foreground/80'
        )}>
          {title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={cn('h-4 w-4', variant === 'danger' ? 'text-destructive/40' : 'text-muted-foreground/30')} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-1 pb-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { categories, customGroups, assets, transactions, goals, addCategory, updateCategory, deleteCategory, deleteGroup, loadAll } = useStore();
  const [catName, setCatName] = useState('');
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetFinal, setShowResetFinal] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);

  const userName = typeof window !== 'undefined' ? localStorage.getItem('asetku_user_name') || '' : '';
  const userAvatar = typeof window !== 'undefined' ? localStorage.getItem('asetku_user_avatar') || '' : '';

  const handleAddCategory = async () => {
    if (!catName.trim()) return;
    await addCategory(catName.trim());
    setCatName('');
  };

  const handleUpdateCategory = async () => {
    if (!editCatId || !editCatName.trim()) return;
    await updateCategory(editCatId, editCatName.trim());
    setEditCatId(null);
  };

  const handleProfileSave = (avatar: string, name: string) => {
    localStorage.setItem('asetku_user_avatar', avatar);
    localStorage.setItem('asetku_user_name', name);
    window.dispatchEvent(new CustomEvent('profile-update', { detail: { avatar, name } }));
    toast('Profil berhasil diperbarui');
  };

  const handleExport = async () => {
    const data = {
      assets: await db.assets.toArray(),
      categories: await db.categories.toArray(),
      transactions: await db.transactions.toArray(),
      customGroups: await db.customGroups.toArray(),
      goals: await db.goals.toArray(),
      debts: await db.debts.toArray(),
      debtPayments: await db.debtPayments.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asetku-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Data berhasil di-export');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await db.assets.clear();
        await db.categories.clear();
        await db.transactions.clear();
        await db.customGroups.clear();
        await db.goals.clear();
        await db.debts.clear();
        await db.debtPayments.clear();
        if (data.assets) await db.assets.bulkAdd(data.assets);
        if (data.categories) await db.categories.bulkAdd(data.categories);
        if (data.transactions) await db.transactions.bulkAdd(data.transactions);
        if (data.customGroups) await db.customGroups.bulkAdd(data.customGroups);
        if (data.goals) await db.goals.bulkAdd(data.goals);
        if (data.debts) await db.debts.bulkAdd(data.debts);
        if (data.debtPayments) await db.debtPayments.bulkAdd(data.debtPayments);
        await loadAll();
        toast('Data berhasil dipulihkan');
      } catch {
        toast('Gagal mengimpor data', 'error');
      }
    };
    input.click();
  };

  const handleReset = async () => {
    await db.assets.clear();
    await db.categories.clear();
    await db.transactions.clear();
    await db.customGroups.clear();
    await db.goals.clear();
    await db.debts.clear();
    await db.debtPayments.clear();
    localStorage.removeItem('asetku_user_name');
    localStorage.removeItem('asetku_user_avatar');
    localStorage.removeItem('asetku_primary_goal');
    localStorage.removeItem('asetku_hide_balance');
    await loadAll();
    setShowResetFinal(false);
    toast('Semua data berhasil dihapus', 'info');
    setTimeout(() => window.location.reload(), 800);
  };

  const headerContent = (
    <div>
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-white/80" />
        <h1 className="text-[16px] font-extrabold text-white tracking-tight">Pengaturan</h1>
      </div>
      <p className="text-[11px] text-white/45 mt-1 ml-[34px]">Personalisasi pengalaman kamu</p>
    </div>
  );

  return (
    <PageLayout pageKey="settings" headerContent={headerContent}>
    <motion.div
      className="pb-4 pt-3"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.03 } } }}
    >

      {/* ═══ PROFIL ═══ */}
      <motion.div variants={fadeUp}>
        <SettingsSection icon={User} title="Profil">
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border/20 shadow-card press-scale"
          >
            <div className="h-11 w-11 rounded-full bg-primary/8 flex items-center justify-center border border-primary/15">
              <span className="text-[24px]">{getAvatarEmoji(userAvatar || null)}</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-bold">{userName || 'User'}</p>
              <p className="text-[10px] text-muted-foreground/40">Tap untuk edit profil</p>
            </div>
            <Edit2 className="h-4 w-4 text-muted-foreground/30" />
          </button>
        </SettingsSection>
      </motion.div>

      {/* ═══ TAMPILAN ═══ */}
      <motion.div variants={fadeUp}>
        <SettingsSection icon={Palette} title="Tampilan">
          {/* Theme */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Tema</span>
              <div className="mt-1.5 flex p-1 bg-surface-secondary rounded-full border border-border/30">
                {[
                  { id: 'light', icon: Sun, label: 'Terang' },
                  { id: 'dark', icon: Moon, label: 'Gelap' },
                  { id: 'system', icon: Monitor, label: 'Auto' },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => {
                      document.documentElement.classList.add('transitioning');
                      setTheme(id);
                      setTimeout(() => document.documentElement.classList.remove('transitioning'), 500);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] font-bold transition-all ${
                      theme === id ? 'btn-gradient text-white shadow-sm shadow-sky-900/15' : 'text-muted-foreground/40'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Warna Aksen</span>
              <div className="mt-1.5 flex gap-2">
                {[
                  { id: 'blue', color: '#135581', light: '#24AAE1', label: 'Blue' },
                  { id: 'purple', color: '#6D28D9', light: '#8B5CF6', label: 'Purple' },
                  { id: 'green', color: '#047857', light: '#10B981', label: 'Green' },
                  { id: 'orange', color: '#C2410C', light: '#F97316', label: 'Orange' },
                  { id: 'pink', color: '#BE185D', light: '#EC4899', label: 'Pink' },
                ].map((accent) => {
                  const current = typeof window !== 'undefined' ? localStorage.getItem('asetku_accent') || 'blue' : 'blue';
                  return (
                    <button
                      key={accent.id}
                      onClick={() => {
                        localStorage.setItem('asetku_accent', accent.id);
                        applyAccentColor(accent.id);
                        toast(`Warna aksen: ${accent.label}`);
                      }}
                      className={`flex-1 h-10 rounded-xl border-2 transition-all press-scale ${
                        current === accent.id ? 'border-foreground/30 scale-110 shadow-md' : 'border-border/20'
                      }`}
                      style={{ background: `linear-gradient(135deg, ${accent.color}, ${accent.light})` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </SettingsSection>
      </motion.div>

      {/* ═══ KATEGORI & GRUP ═══ */}
      <motion.div variants={fadeUp}>
        <SettingsSection icon={FolderOpen} title="Kategori & Grup">
          <div className="space-y-3">
            {/* Categories */}
            <div className="bg-surface border border-border/20 rounded-2xl p-3 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Kategori</span>
                <span className="text-[9px] text-muted-foreground/30">{categories.length} item</span>
              </div>
              <div className="flex gap-1.5 mb-2">
                <input
                  placeholder="Tambah kategori..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  className="flex-1 h-8 rounded-lg bg-surface-secondary px-3 text-[11px] border border-border/10 focus:outline-none focus:border-primary/30 transition-all"
                />
                <Button size="xs" variant="primary" onClick={handleAddCategory} disabled={!catName.trim()}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {categories.length > 6 && (
                <input
                  placeholder="Cari kategori..."
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  className="w-full h-7 mb-2 rounded-lg bg-surface-secondary/50 px-3 text-[10px] border border-border/10 focus:outline-none focus:border-primary/30 transition-all placeholder:text-muted-foreground/30"
                />
              )}
              <div className="space-y-0 max-h-36 overflow-y-auto no-scrollbar">
                {categories
                  .filter(cat => !catSearch || cat.name.toLowerCase().includes(catSearch.toLowerCase()))
                  .map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between py-2 px-1.5 rounded-lg hover:bg-surface-secondary/50 transition-colors">
                    {editCatId === cat.id ? (
                      <input
                        autoFocus
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        onBlur={handleUpdateCategory}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                        className="h-6 rounded-md bg-surface-secondary px-2.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/30 flex-1 mr-2 border border-border/20"
                      />
                    ) : (
                      <span className="text-[11px]">{cat.name}</span>
                    )}
                    <div className="flex gap-1 opacity-60">
                      <button onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name); }} className="p-1.5 rounded-md hover:bg-surface-secondary active:scale-95 transition-all">
                        <Edit2 className="h-3 w-3 text-muted-foreground/50" />
                      </button>
                      <button onClick={() => setDeleteCatId(cat.id)} className="p-1.5 rounded-md hover:bg-destructive-soft active:scale-95 transition-all">
                        <Trash2 className="h-3 w-3 text-destructive/50" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Groups */}
            <div className="bg-surface border border-border/20 rounded-2xl p-3 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Custom Grup</span>
                <Button size="xs" variant="primary" onClick={() => { setEditGroupId(null); setShowGroupForm(true); }}>
                  <Plus className="h-3 w-3" /> Baru
                </Button>
              </div>
              {customGroups.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/25 text-center py-4">Belum ada grup</p>
              ) : (
                <div className="space-y-0">
                  {customGroups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between py-2 px-1.5 rounded-lg hover:bg-surface-secondary/50 transition-colors">
                      <div>
                        <p className="text-[11px] font-medium">{group.name}</p>
                        <p className="text-[9px] text-muted-foreground/30">{group.assetIds.length} aset</p>
                      </div>
                      <div className="flex gap-1 opacity-60">
                        <button onClick={() => { setEditGroupId(group.id); setShowGroupForm(true); }} className="p-1.5 rounded-md hover:bg-surface-secondary active:scale-95 transition-all">
                          <Edit2 className="h-3 w-3 text-muted-foreground/50" />
                        </button>
                        <button onClick={() => deleteGroup(group.id)} className="p-1.5 rounded-md hover:bg-destructive-soft active:scale-95 transition-all">
                          <Trash2 className="h-3 w-3 text-destructive/50" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SettingsSection>
      </motion.div>

      {/* ═══ BACKUP & DATA ═══ */}
      <motion.div variants={fadeUp}>
        <SettingsSection icon={Database} title="Backup & Data">
          <div className="space-y-2">
            <button 
              onClick={() => setShowStatistics(true)} 
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10 press-scale text-left"
            >
              <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <BarChart3 className="h-4 w-4 text-violet-500" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold">Lihat Statistik</p>
                <p className="text-[9px] text-muted-foreground/40">Analisis pertumbuhan & distribusi</p>
              </div>
            </button>
            <button onClick={handleExport} className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 press-scale text-left">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Download className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold">Export Data</p>
                <p className="text-[9px] text-muted-foreground/40">Simpan backup ke file JSON</p>
              </div>
            </button>
            <button onClick={handleImport} className="w-full flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/10 press-scale text-left">
              <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                <Upload className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold">Import Data</p>
                <p className="text-[9px] text-muted-foreground/40">Pulihkan dari file backup</p>
              </div>
            </button>
          </div>
        </SettingsSection>
      </motion.div>

      {/* ═══ PENCAPAIAN ═══ */}
      <motion.div variants={fadeUp}>
        <SettingsSection icon={Trophy} title="Pencapaian">
          <div className="bg-surface border border-border/20 rounded-2xl p-3 shadow-card">
            <div className="grid grid-cols-4 gap-2">
              {[
                { emoji: '🏦', label: 'Aset pertama', earned: assets.length >= 1 },
                { emoji: '💼', label: '5 aset', earned: assets.length >= 5 },
                { emoji: '📝', label: '10 transaksi', earned: transactions.length >= 10 },
                { emoji: '🔥', label: '50 transaksi', earned: transactions.length >= 50 },
                { emoji: '🎯', label: 'Target pertama', earned: goals.length >= 1 },
                { emoji: '⚡', label: '7 hari streak', earned: (() => { const uniqueDays = new Set(transactions.map(t => t.date)); const today = new Date(); let count = 0; for (let i = 0; i < 365; i++) { const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i); const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; if (uniqueDays.has(key)) count++; else { if (i===0) continue; break; } } return count >= 7; })() },
                { emoji: '👑', label: '30 hari streak', earned: (() => { const uniqueDays = new Set(transactions.map(t => t.date)); const today = new Date(); let count = 0; for (let i = 0; i < 365; i++) { const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i); const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; if (uniqueDays.has(key)) count++; else { if (i===0) continue; break; } } return count >= 30; })() },
                { emoji: '🌈', label: 'Diversifikasi', earned: categories.filter(c => assets.some(a => a.categoryId === c.id)).length >= 3 },
              ].map((badge) => (
                <div key={badge.label} className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center ${badge.earned ? 'bg-amber-500/5 border-amber-500/15' : 'bg-surface-secondary/30 border-border/10 opacity-40'}`}>
                  <span className="text-[18px]">{badge.emoji}</span>
                  <span className="text-[8px] font-bold text-muted-foreground/60 leading-tight">{badge.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground/30 text-center mt-2">
              {[assets.length >= 1, assets.length >= 5, transactions.length >= 10, transactions.length >= 50, goals.length >= 1].filter(Boolean).length +
               (categories.filter(c => assets.some(a => a.categoryId === c.id)).length >= 3 ? 1 : 0)}/8 tercapai
            </p>
          </div>
        </SettingsSection>
      </motion.div>

      {/* ═══ ZONA BAHAYA ═══ (collapsed by default) */}
      <motion.div variants={fadeUp}>
        <SettingsSection icon={AlertTriangle} title="Zona Bahaya" defaultOpen={false} variant="danger">
          <div className="space-y-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-destructive/5 border border-destructive/10 press-scale text-left"
            >
              <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <RotateCcw className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-destructive">Reset Aplikasi</p>
                <p className="text-[9px] text-muted-foreground/40">Hapus semua data dan mulai dari awal</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-destructive/40" />
            </button>
            <p className="text-[9px] text-muted-foreground/30 text-center px-4">
              Aksi ini tidak bisa dibatalkan. Semua aset, transaksi, target, dan pengaturan akan hilang permanen.
            </p>
          </div>
        </SettingsSection>
      </motion.div>

      {/* Privacy badge */}
      <motion.div variants={fadeUp} className="px-3 pb-3 pt-1">
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-success-soft border border-success/10">
          <Shield className="h-4 w-4 text-success shrink-0" />
          <div>
            <p className="text-[11px] font-semibold">Data 100% Lokal</p>
            <p className="text-[9px] text-muted-foreground/40">Tidak ada server. Privasi terjaga.</p>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center pb-4 pt-2">
        <p className="text-[16px] font-extrabold gradient-text">AsetKu</p>
        <p className="text-[10px] text-muted-foreground/25 flex items-center justify-center gap-1 mt-1">
          Bismillah Jaki Jadi Milyarder dan Jadi Sultan
        </p>
        <p className="text-[9px] text-muted-foreground/15 mt-0.5">v1.0 · 2024</p>
      </div>

      {/* Modals */}
      <GroupFormModal open={showGroupForm} onClose={() => setShowGroupForm(false)} editId={editGroupId} />
      <AvatarPicker
        open={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        currentAvatar={userAvatar || null}
        currentName={userName}
        onSave={handleProfileSave}
      />
      <ConfirmDialog
        open={showResetConfirm}
        title="Reset Aplikasi?"
        message="Kamu yakin? Semua aset, transaksi, target, dan pengaturan akan dihapus permanen. Aksi ini tidak bisa dibatalkan."
        onConfirm={() => { setShowResetConfirm(false); setShowResetFinal(true); }}
        onCancel={() => setShowResetConfirm(false)}
      />
      <ConfirmDialog
        open={showResetFinal}
        title="⚠️ Konfirmasi Final"
        message="BENAR-BENAR yakin? Ketuk 'Hapus' untuk menghapus SEMUA data secara permanen."
        onConfirm={handleReset}
        onCancel={() => setShowResetFinal(false)}
      />
      <ConfirmDialog
        open={!!deleteCatId}
        title="Hapus Kategori?"
        message={`${assets.filter(a => a.categoryId === deleteCatId).length} aset menggunakan kategori ini. Aset tidak akan terhapus, tapi kategorinya akan hilang.`}
        onConfirm={async () => { if (deleteCatId) { await deleteCategory(deleteCatId); setDeleteCatId(null); toast('Kategori dihapus', 'info'); } }}
        onCancel={() => setDeleteCatId(null)}
      />
      
      {/* Statistics Modal */}
      <StatisticsModal open={showStatistics} onClose={() => setShowStatistics(false)} />
    </motion.div>
    </PageLayout>
  );
}
