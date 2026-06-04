'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/FormElements';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
  name: z.string().min(1, 'Nama target wajib diisi'),
  targetAmount: z.coerce.number().min(1, 'Target minimal 1'),
  targetDate: z.string().min(1, 'Tanggal target wajib diisi'),
  customGroupId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editId: string | null;
}

export function GoalFormModal({ open, onClose, editId }: Props) {
  const { goals, customGroups, addGoal, updateGoal } = useStore();
  const { toast } = useToast();
  const editing = editId ? goals.find((g) => g.id === editId) : null;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (editing) {
      reset({ name: editing.name, targetAmount: editing.targetAmount, targetDate: editing.targetDate, customGroupId: editing.customGroupId || '' });
    } else {
      reset({ name: '', targetAmount: 0, targetDate: '', customGroupId: '' });
    }
  }, [editing, open, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = { ...data, customGroupId: data.customGroupId || undefined };
    if (editing) {
      await updateGoal(editing.id, payload);
      toast('Target berhasil diperbarui');
    } else {
      await addGoal(payload);
      toast('Target berhasil dibuat');
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Target' : 'Buat Target'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Nama Target" placeholder="Contoh: Target 2025" {...register('name')} error={errors.name?.message} />
        <Input label="Nominal Target (Rp)" type="number" placeholder="1000000000" {...register('targetAmount')} error={errors.targetAmount?.message} />
        <Input label="Tanggal Target" type="date" {...register('targetDate')} error={errors.targetDate?.message} />
        <Select
          label="Berdasarkan (opsional)"
          options={[{ value: '', label: 'Total Semua Aset' }, ...customGroups.map((g) => ({ value: g.id, label: g.name }))]}
          {...register('customGroupId')}
        />
        <Button type="submit" variant="gold" className="w-full" size="lg">
          {editing ? 'Simpan' : 'Buat Target'}
        </Button>
      </form>
    </Modal>
  );
}
