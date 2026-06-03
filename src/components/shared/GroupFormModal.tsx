'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/FormElements';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  editId: string | null;
}

export function GroupFormModal({ open, onClose, editId }: Props) {
  const { assets, customGroups, addGroup, updateGroup } = useStore();
  const { toast } = useToast();
  const editing = editId ? customGroups.find((g) => g.id === editId) : null;

  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setSelectedIds(editing.assetIds);
    } else {
      setName('');
      setSelectedIds([]);
    }
  }, [editing, open]);

  const toggleAsset = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!name.trim() || selectedIds.length === 0) return;
    if (editing) {
      await updateGroup(editing.id, name.trim(), selectedIds);
      toast('Grup berhasil diperbarui ✅');
    } else {
      await addGroup(name.trim(), selectedIds);
      toast('Grup berhasil dibuat 📂');
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Grup' : 'Buat Grup'}>
      <div className="space-y-4">
        <Input label="Nama Grup" placeholder="Contoh: Likuiditas" value={name} onChange={(e) => setName(e.target.value)} />

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium">Pilih Aset</label>
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {assets.map((asset) => {
              const isSelected = selectedIds.includes(asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => toggleAsset(asset.id)}
                  className={cn(
                    'w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all duration-150 press-scale',
                    isSelected
                      ? 'border-primary bg-accent-soft'
                      : 'border-border/20 hover:border-primary/25 hover:bg-surface-secondary'
                  )}
                >
                  <span className="text-[12px] font-medium">{asset.name}</span>
                  {isSelected && (
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Button variant="gold" onClick={handleSubmit} className="w-full" size="lg" disabled={!name.trim() || selectedIds.length === 0}>
          {editing ? 'Simpan' : 'Buat Grup'}
        </Button>
      </div>
    </Modal>
  );
}
