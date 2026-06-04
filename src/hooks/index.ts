import { useMemo } from 'react';
import { useStore } from '@/store';

export function useAssetValue(assetId: string) {
  const { transactions } = useStore();
  return useMemo(() => {
    return transactions
      .filter((t) => t.assetId === assetId)
      .reduce((sum, t) => sum + (t.type === 'add' ? t.amount : -t.amount), 0);
  }, [transactions, assetId]);
}

export function useMonthlyGrowth() {
  const { transactions } = useStore();
  return useMemo(() => {
    const now = new Date();
    const months: { month: string; growth: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthTxs = transactions.filter((t) => t.date.startsWith(key));
      const growth = monthTxs.reduce((s, t) => s + (t.type === 'add' ? t.amount : -t.amount), 0);
      months.push({ month: key, growth });
    }
    return months;
  }, [transactions]);
}

export function useTotalGrowthPercentage() {
  const { transactions } = useStore();
  return useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const totalBefore = transactions
      .filter((t) => !t.date.startsWith(thisMonth))
      .reduce((s, t) => s + (t.type === 'add' ? t.amount : -t.amount), 0);
    const totalNow = transactions
      .reduce((s, t) => s + (t.type === 'add' ? t.amount : -t.amount), 0);
    if (totalBefore <= 0) return 0;
    return ((totalNow - totalBefore) / totalBefore) * 100;
  }, [transactions]);
}
