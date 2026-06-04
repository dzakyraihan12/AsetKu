'use client';

import { useState } from 'react';
import { Moon, Sun, Monitor, Download, Upload, Plus, Edit2, Trash2, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useStore } from '@/store';
import { db } from '@/db';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { GroupFormModal } from '@/components/shared/GroupFormModal';

const fadeUp = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { categories, customGroups, addCategory, updateCategory, deleteCategory, deleteGroup, loadAll } = useStore();
  const [catName, setCatName] = useState('');
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);

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

  const handleExport = async () => {
    const data = {
      assets: await db.assets.toArray(),
      categories: await db.categories.toArray(),
      transactions: await db.transactions.toArray(),
      customGroups: await db.customGroups.toArray(),
      goals: await db.goals.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asetku-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Data berhasil di-export 📦');
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
        if (data.assets) await db.assets.bulkAdd(data.assets);
        if (data.categories) await db.categories.bulkAdd(data.categories);
        if (data.transactions) await db.transactions.bulkAdd(data.transactions);
        if (data.customGroups) await db.customGroups.bulkAdd(data.customGroups);
        if (data.goals) await db.goals.bulkAdd(data.goals);
        await loadAll();
        toast('Data berhasil dipulihkan ✅');
      } catch {
        toast('Gagal mengimpor data', 'error');
      }
    };
    input.click();
  };

  return (
    <motion.div
      className="max-w-lg mx-auto pb-4"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.03 } } }}
    >
      {/* Header with gradient */}
      <div className="hero-gradient rounded-b-[24px] px-4 pb-5 wealth-card">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[18px]">⚙️</span>
            <h1 className="text-[16px] font-extrabold text-white tracking-tight">Pengaturan</h1>
          </div>
          <p className="text-[11px] text-white/45 mt-1 ml-[34px]">Personalisasi pengalaman kamu</p>
        </div>
      </div>

      {/* Theme */}
      <motion.section variants={fadeUp} className="px-3 pt-3 pb-3">
        <span className="text-micro font-bold text-foreground/60 uppercase tracking-wider">Tampilan</span>
        <div className="mt-1.5 flex p-1 bg-surface-secondary rounded-full border border-border/30">
          {[
            { id: 'light', icon: Sun, label: 'Terang' },
            { id: 'dark', icon: Moon, label: 'Gelap' },
            { id: 'system', icon: Monitor, label: 'Auto' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] font-bold transition-all ${
                theme === id ? 'btn-gradient text-white shadow-sm shadow-sky-900/15' : 'text-muted-foreground/40'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Categories */}
      <motion.section variants={fadeUp} className="px-3 pb-3">
        <span className="text-micro font-bold text-foreground/60 uppercase tracking-wider">Kategori</span>
        <div className="mt-1.5 bg-surface border border-border/20 rounded-2xl p-3 shadow-card">
          <div className="flex gap-1.5 mb-2">
            <input
              placeholder="Tambah kategori..."
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              className="flex-1 h-8 rounded-lg bg-surface-secondary px-3 text-caption border border-border/10 focus:outline-none focus:border-primary/30 transition-all"
            />
            <Button size="xs" variant="primary" onClick={handleAddCategory} disabled={!catName.trim()}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-0 max-h-36 overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between py-1.5 px-1 rounded-lg hover:bg-surface-secondary/50 transition-colors group">
                {editCatId === cat.id ? (
                  <input
                    autoFocus
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    onBlur={handleUpdateCategory}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                    className="h-5 rounded bg-surface-secondary px-2 text-caption focus:outline-none flex-1 mr-2"
                  />
                ) : (
                  <span className="text-caption">{cat.name}</span>
                )}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name); }} className="p-1 rounded hover:bg-surface-secondary">
                    <Edit2 className="h-2.5 w-2.5 text-muted-foreground/50" />
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className="p-1 rounded hover:bg-destructive-soft">
                    <Trash2 className="h-2.5 w-2.5 text-destructive/60" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Groups */}
      <motion.section variants={fadeUp} className="px-3 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-micro font-bold text-foreground/60 uppercase tracking-wider">Custom Grup</span>
          <Button size="xs" variant="primary" onClick={() => { setEditGroupId(null); setShowGroupForm(true); }}>
            <Plus className="h-3 w-3" /> Baru
          </Button>
        </div>
        <div className="mt-1.5 bg-surface border border-border/20 rounded-2xl p-3 shadow-card">
          {customGroups.length === 0 ? (
            <p className="text-caption text-muted-foreground/25 text-center py-4">Belum ada grup</p>
          ) : (
            <div className="space-y-0">
              {customGroups.map((group) => (
                <div key={group.id} className="flex items-center justify-between py-1.5 px-1 rounded-lg hover:bg-surface-secondary/50 transition-colors group">
                  <div>
                    <p className="text-caption font-medium">{group.name}</p>
                    <p className="text-micro text-muted-foreground/30">{group.assetIds.length} aset</p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditGroupId(group.id); setShowGroupForm(true); }} className="p-1 rounded hover:bg-surface-secondary">
                      <Edit2 className="h-2.5 w-2.5 text-muted-foreground/50" />
                    </button>
                    <button onClick={() => deleteGroup(group.id)} className="p-1 rounded hover:bg-destructive-soft">
                      <Trash2 className="h-2.5 w-2.5 text-destructive/60" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* Backup */}
      <motion.section variants={fadeUp} className="px-3 pb-3">
        <span className="text-micro font-bold text-foreground/60 uppercase tracking-wider">Backup</span>
        <div className="flex gap-1.5 mt-1.5">
          <Button variant="secondary" className="flex-1 !h-9" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button variant="secondary" className="flex-1 !h-9" onClick={handleImport}>
            <Upload className="h-3.5 w-3.5" /> Import
          </Button>
        </div>
      </motion.section>

      {/* Privacy badge */}
      <motion.section variants={fadeUp} className="px-3 pb-4">
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-success-soft border border-success/10">
          <Shield className="h-4 w-4 text-success shrink-0" />
          <div>
            <p className="text-caption font-semibold">Data 100% Lokal</p>
            <p className="text-micro text-muted-foreground/40">Tidak ada server. Privasi terjaga.</p>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <div className="text-center pb-4">
        <p className="text-[16px] font-extrabold gradient-text">AsetKu</p>
        <p className="text-[10px] text-muted-foreground/25 flex items-center justify-center gap-1 mt-1">
          Bismillah Jaki Jadi Milyarder dan Jadi Sultan
        </p>
        <p className="text-[9px] text-muted-foreground/15 mt-0.5">v1.0 · 2024</p>
      </div>

      <GroupFormModal open={showGroupForm} onClose={() => setShowGroupForm(false)} editId={editGroupId} />
    </motion.div>
  );
}
