'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/FormElements';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
  amount: z.coerce.number().min(1, 'Nominal minimal 1'),
  notes: z.string().default(''),
  date: z.string().min(1, 'Tanggal wajib diisi'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  assetId: string;
  type: 'add' | 'subtract';
}

export function TransactionFormModal({ open, onClose, assetId, type }: Props) {
  const { addTransaction } = useStore();
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (data: FormData) => {
    await addTransaction({ assetId, type, amount: data.amount, notes: data.notes, date: data.date });
    toast(type === 'add' ? 'Nilai berhasil ditambahkan 💰' : 'Nilai berhasil dikurangi', type === 'add' ? 'success' : 'info');
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={type === 'add' ? 'Tambah Nilai' : 'Kurangi Nilai'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Nominal (Rp)" type="number" placeholder="10000000" {...register('amount')} error={errors.amount?.message} />
        <Input label="Tanggal" type="date" {...register('date')} error={errors.date?.message} />
        <Textarea label="Catatan (opsional)" placeholder="Contoh: Gaji bulan Juni" {...register('notes')} />
        <Button
          type="submit"
          className="w-full"
          size="lg"
          variant={type === 'add' ? 'gold' : 'destructive'}
        >
          {type === 'add' ? '+ Tambah Nilai' : '- Kurangi Nilai'}
        </Button>
      </form>
    </Modal>
  );
}
