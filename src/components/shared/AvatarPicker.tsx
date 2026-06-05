'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const AVATARS = [
  { id: 'av-1', emoji: '😎' },
  { id: 'av-2', emoji: '🧑‍💼' },
  { id: 'av-3', emoji: '👨‍💻' },
  { id: 'av-4', emoji: '👩‍💻' },
  { id: 'av-5', emoji: '🦊' },
  { id: 'av-6', emoji: '🐱' },
  { id: 'av-7', emoji: '🦁' },
  { id: 'av-8', emoji: '🐼' },
  { id: 'av-9', emoji: '🧔' },
  { id: 'av-10', emoji: '👩' },
  { id: 'av-11', emoji: '🧑‍🚀' },
  { id: 'av-12', emoji: '👸' },
  { id: 'av-13', emoji: '🤴' },
  { id: 'av-14', emoji: '🧑‍🎓' },
  { id: 'av-15', emoji: '💃' },
  { id: 'av-16', emoji: '🕺' },
];

interface AvatarPickerProps {
  open: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  currentName: string;
  onSave: (avatar: string, name: string) => void;
}

export function AvatarPicker({ open, onClose, currentAvatar, currentName, onSave }: AvatarPickerProps) {
  const [selected, setSelected] = useState(currentAvatar || 'av-1');
  const [name, setName] = useState(currentName);

  const handleSave = () => {
    if (name.trim()) {
      onSave(selected, name.trim());
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Profil">
      <div className="space-y-4">
        {/* Name input */}
        <div>
          <label className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">Nama</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            className="w-full h-11 mt-1.5 rounded-xl bg-surface-secondary px-4 text-[13px] font-semibold border border-border/20 focus:outline-none focus:border-primary/30 transition-all"
          />
        </div>

        {/* Avatar grid */}
        <div>
          <label className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">Pilih Avatar</label>
          <div className="grid grid-cols-4 gap-2.5 mt-2">
            {AVATARS.map((avatar) => (
              <motion.button
                key={avatar.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelected(avatar.id)}
                className={`flex items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                  selected === avatar.id
                    ? 'border-primary bg-primary/8 shadow-sm shadow-primary/10'
                    : 'border-border/20 bg-surface-secondary/50 hover:border-border/40'
                }`}
              >
                <span className="text-[28px]">{avatar.emoji}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <Button variant="gold" className="w-full" size="lg" onClick={handleSave} disabled={!name.trim()}>
          Simpan
        </Button>
      </div>
    </Modal>
  );
}

export function getAvatarEmoji(avatarId: string | null): string {
  if (!avatarId) return '👤';
  const found = AVATARS.find(a => a.id === avatarId);
  return found?.emoji || '👤';
}
