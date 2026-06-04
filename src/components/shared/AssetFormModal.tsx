'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/FormElements';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  initialValue: z.number().min(0, 'Nilai tidak boleh negatif'),
  currency: z.string().default('IDR'),
  notes: z.string().default(''),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editId: string | null;
}

export function AssetFormModal({ open, onClose, editId }: Props) {
  const { assets, categories, addAsset, updateAsset } = useStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editing = editId ? assets.find((a) => a.id === editId) : null;

  const { control, register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', categoryId: '', initialValue: 0, currency: 'IDR', notes: '' },
  });

  const selectedCategory = watch('categoryId');

  useEffect(() => {
    if (editing) {
      reset({ name: editing.name, categoryId: editing.categoryId, initialValue: editing.initialValue, currency: editing.currency, notes: editing.notes });
    } else {
      reset({ name: '', categoryId: '', initialValue: 0, currency: 'IDR', notes: '' });
    }
  }, [editing, open, reset]);

  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editing) {
        await updateAsset(editing.id, data);
        toast('Aset berhasil diperbarui');
      } else {
        await addAsset(data);
        toast('Aset berhasil ditambahkan');
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Aset' : 'Tambah Aset'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Nama Aset" placeholder="Contoh: BCA, Bitcoin, Emas" {...register('name')} error={errors.name?.message} />

        {/* Category Chips */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wide">Kategori</label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setValue('categoryId', cat.id, { shouldValidate: true })}
                className={cn(
                  'px-3 py-[5px] rounded-full text-[10px] font-semibold transition-all duration-150 press-scale',
                  selectedCategory === cat.id
                    ? 'btn-gradient text-white shadow-sm shadow-sky-900/15'
                    : 'bg-secondary text-muted-foreground hover:bg-surface-secondary'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
          {errors.categoryId && <p className="text-[10px] text-destructive">{errors.categoryId.message}</p>}
        </div>

        {!editing && (
          <Controller
            name="initialValue"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label="Nilai Awal"
                placeholder="1.000.000"
                value={field.value}
                onChange={field.onChange}
                error={errors.initialValue?.message}
              />
            )}
          />
        )}

        <Textarea label="Catatan (opsional)" placeholder="Deskripsi singkat..." {...register('notes')} />

        <Button type="submit" variant="gold" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editing ? 'Simpan' : 'Tambah Aset')}
        </Button>
      </form>
    </Modal>
  );
}
