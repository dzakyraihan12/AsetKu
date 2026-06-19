import { create } from 'zustand';
import { db } from '@/db';
import type { Asset, Category, Transaction, CustomGroup, Goal, Debt, DebtPayment } from '@/types';
import { generateId } from '@/lib/utils';

interface AppState {
  assets: Asset[];
  categories: Category[];
  transactions: Transaction[];
  customGroups: CustomGroup[];
  goals: Goal[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  isLoading: boolean;
  unlockedBadge: { id: string; emoji: string; label: string } | null;

  loadAll: () => Promise<void>;
  setUnlockedBadge: (badge: { id: string; emoji: string; label: string } | null) => void;
  checkNewBadges: () => void;

  // Assets
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAsset: (id: string, data: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;

  // Categories
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Debts
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDebt: (id: string, data: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;

  // Debt Payments
  addDebtPayment: (payment: Omit<DebtPayment, 'id' | 'createdAt'>) => Promise<void>;
  deleteDebtPayment: (id: string) => Promise<void>;

  // Custom Groups
  addGroup: (name: string, assetIds: string[]) => Promise<void>;
  updateGroup: (id: string, name: string, assetIds: string[]) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Computed - Assets
  getAssetValue: (assetId: string) => number;
  getTotalAssetValue: () => number;
  
  // Computed - Debts
  getDebtRemainingBalance: (debtId: string) => number;
  getDebtPaidAmount: (debtId: string) => number;
  getTotalDebtBalance: () => number;
  getTotalDebtOriginal: () => number;
  
  // Computed - Net Worth
  getNetWorth: () => number;
  
  // Legacy (for compatibility)
  getTotalValue: () => number;
  getAssetsTotalValue: () => number;
  getLiabilitiesTotalValue: () => number;
  getGroupTotal: (groupId: string) => number;
  getCategoryTotal: (categoryId: string) => number;
}

const getStreak = (txs: Transaction[]) => {
  if (txs.length === 0) return 0;
  const uniqueDays = new Set(txs.map((t) => t.date));
  const today = new Date();
  let count = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (uniqueDays.has(key)) {
      count++;
    } else {
      if (i === 0) continue;
      break;
    }
  }
  return count;
};

export const useStore = create<AppState>((set, get) => ({
  assets: [],
  categories: [],
  transactions: [],
  customGroups: [],
  goals: [],
  debts: [],
  debtPayments: [],
  isLoading: true,
  unlockedBadge: null,

  setUnlockedBadge: (badge) => set({ unlockedBadge: badge }),

  loadAll: async () => {
    const [assets, categories, transactions, customGroups, goals, debts, debtPayments] = await Promise.all([
      db.assets.toArray(),
      db.categories.toArray(),
      db.transactions.toArray(),
      db.customGroups.toArray(),
      db.goals.toArray(),
      db.debts.toArray(),
      db.debtPayments.toArray(),
    ]);
    set({ assets, categories, transactions, customGroups, goals, debts, debtPayments, isLoading: false });

    // Seed celebrated badges silently on initial load so they don't pop up
    if (typeof window !== 'undefined') {
      const celebratedStr = localStorage.getItem('asetku_celebrated_badges');
      if (!celebratedStr) {
        const streak = getStreak(transactions);
        const getCatTotal = (catId: string) => assets
          .filter((a) => a.categoryId === catId)
          .reduce((sum, a) => {
            const val = transactions
              .filter((t) => t.assetId === a.id)
              .reduce((s, t) => s + (t.type === 'add' ? t.amount : -t.amount), 0);
            return sum + val;
          }, 0);
        const categoryAllocation = categories
          .map((cat) => ({ id: cat.id, value: getCatTotal(cat.id) }))
          .filter((c) => c.value > 0);

        const badges = [
          { id: 'first-asset', earned: assets.length >= 1 },
          { id: '5-assets', earned: assets.length >= 5 },
          { id: '10-tx', earned: transactions.length >= 10 },
          { id: '50-tx', earned: transactions.length >= 50 },
          { id: 'first-goal', earned: goals.length >= 1 },
          { id: 'first-debt', earned: debts.length >= 1 },
          { id: '7-streak', earned: streak >= 7 },
          { id: '30-streak', earned: streak >= 30 },
          { id: 'diversified', earned: categoryAllocation.length >= 3 },
        ];
        const earnedIds = badges.filter((b) => b.earned).map((b) => b.id);
        localStorage.setItem('asetku_celebrated_badges', JSON.stringify(earnedIds));
      }
    }
  },

  checkNewBadges: () => {
    const { assets, transactions, goals, debts, debtPayments, getCategoryTotal, categories, getDebtRemainingBalance } = get();
    if (assets.length === 0 && transactions.length === 0 && debts.length === 0) return;

    const streak = getStreak(transactions);
    const categoryAllocation = categories
      .map((cat) => ({ id: cat.id, value: getCategoryTotal(cat.id) }))
      .filter((c) => c.value > 0);
    const hasDebtPaidOff = debts.some((d) => {
      const remaining = getDebtRemainingBalance(d.id);
      return remaining === 0 && debtPayments.some((p) => p.debtId === d.id);
    });

    const badges = [
      { id: 'first-asset', emoji: '🏦', label: 'Aset Pertama', earned: assets.length >= 1 },
      { id: '5-assets', emoji: '💼', label: '5 Aset Tercatat', earned: assets.length >= 5 },
      { id: '10-tx', emoji: '📝', label: '10 Transaksi', earned: transactions.length >= 10 },
      { id: '50-tx', emoji: '🔥', label: '50 Transaksi', earned: transactions.length >= 50 },
      { id: 'first-goal', emoji: '🎯', label: 'Target Pertama', earned: goals.length >= 1 },
      { id: 'first-debt', emoji: '📋', label: 'Hutang Pertama', earned: debts.length >= 1 },
      { id: 'debt-paid-off', emoji: '🎉', label: 'Hutang Lunas!', earned: hasDebtPaidOff },
      { id: '7-streak', emoji: '⚡', label: '7 Hari Streak', earned: streak >= 7 },
      { id: '30-streak', emoji: '👑', label: '30 Hari Streak', earned: streak >= 30 },
      { id: 'diversified', emoji: '🌈', label: 'Diversifikasi 3+', earned: categoryAllocation.length >= 3 },
    ];

    if (typeof window === 'undefined') return;

    const celebratedStr = localStorage.getItem('asetku_celebrated_badges') || '[]';
    let celebrated: string[] = [];
    try {
      celebrated = JSON.parse(celebratedStr);
    } catch {
      celebrated = [];
    }

    const newlyEarned = badges.find((b) => b.earned && !celebrated.includes(b.id));
    if (newlyEarned) {
      set({ unlockedBadge: newlyEarned });
      celebrated.push(newlyEarned.id);
      localStorage.setItem('asetku_celebrated_badges', JSON.stringify(celebrated));
    }
  },

  addAsset: async (data) => {
    const now = new Date().toISOString();
    const asset: Asset = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await db.assets.add(asset);
    
    if (data.initialValue > 0) {
      const tx: Transaction = {
        id: generateId(),
        assetId: asset.id,
        type: 'add',
        amount: data.initialValue,
        notes: 'Nilai awal',
        date: now.split('T')[0],
        createdAt: now,
      };
      await db.transactions.add(tx);
      set((s) => ({ assets: [...s.assets, asset], transactions: [...s.transactions, tx] }));
    } else {
      set((s) => ({ assets: [...s.assets, asset] }));
    }
    get().checkNewBadges();
  },

  updateAsset: async (id, data) => {
    await db.assets.update(id, { ...data, updatedAt: new Date().toISOString() });
    set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...data } : a)) }));
  },

  deleteAsset: async (id) => {
    await db.assets.delete(id);
    await db.transactions.where('assetId').equals(id).delete();
    set((s) => ({
      assets: s.assets.filter((a) => a.id !== id),
      transactions: s.transactions.filter((t) => t.assetId !== id),
      customGroups: s.customGroups.map((g) => ({ ...g, assetIds: g.assetIds.filter((aid) => aid !== id) })),
    }));
    get().checkNewBadges();
  },

  addCategory: async (name) => {
    const cat: Category = { id: generateId(), name, createdAt: new Date().toISOString() };
    await db.categories.add(cat);
    set((s) => ({ categories: [...s.categories, cat] }));
  },

  updateCategory: async (id, name) => {
    await db.categories.update(id, { name });
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, name } : c)) }));
  },

  deleteCategory: async (id) => {
    await db.categories.delete(id);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },

  addTransaction: async (data) => {
    const now = new Date().toISOString();
    const tx: Transaction = { ...data, id: generateId(), createdAt: now };
    await db.transactions.add(tx);
    set((s) => ({ transactions: [...s.transactions, tx] }));
    get().checkNewBadges();
  },

  deleteTransaction: async (id) => {
    await db.transactions.delete(id);
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
    get().checkNewBadges();
  },

  // Debt Methods
  addDebt: async (data) => {
    const now = new Date().toISOString();
    const debt: Debt = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await db.debts.add(debt);
    set((s) => ({ debts: [...s.debts, debt] }));
    get().checkNewBadges();
  },

  updateDebt: async (id, data) => {
    await db.debts.update(id, { ...data, updatedAt: new Date().toISOString() });
    set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, ...data } : d)) }));
  },

  deleteDebt: async (id) => {
    await db.debts.delete(id);
    await db.debtPayments.where('debtId').equals(id).delete();
    set((s) => ({
      debts: s.debts.filter((d) => d.id !== id),
      debtPayments: s.debtPayments.filter((p) => p.debtId !== id),
    }));
  },

  addDebtPayment: async (data) => {
    const now = new Date().toISOString();
    const payment: DebtPayment = { ...data, id: generateId(), createdAt: now };
    await db.debtPayments.add(payment);
    
    // Auto-update remaining months for installment payments
    const debt = get().debts.find((d) => d.id === data.debtId);
    if (debt && data.type === 'installment' && debt.remainingMonths > 0) {
      const newMonths = debt.remainingMonths - 1;
      await db.debts.update(debt.id, { remainingMonths: newMonths, updatedAt: now });
      set((s) => ({
        debtPayments: [...s.debtPayments, payment],
        debts: s.debts.map((d) => d.id === debt.id ? { ...d, remainingMonths: newMonths, updatedAt: now } : d)
      }));
    } else {
      set((s) => ({ debtPayments: [...s.debtPayments, payment] }));
    }
    get().checkNewBadges();
  },

  deleteDebtPayment: async (id) => {
    await db.debtPayments.delete(id);
    set((s) => ({ debtPayments: s.debtPayments.filter((p) => p.id !== id) }));
  },

  addGroup: async (name, assetIds) => {
    const group: CustomGroup = { id: generateId(), name, assetIds, createdAt: new Date().toISOString() };
    await db.customGroups.add(group);
    set((s) => ({ customGroups: [...s.customGroups, group] }));
  },

  updateGroup: async (id, name, assetIds) => {
    await db.customGroups.update(id, { name, assetIds });
    set((s) => ({ customGroups: s.customGroups.map((g) => (g.id === id ? { ...g, name, assetIds } : g)) }));
  },

  deleteGroup: async (id) => {
    await db.customGroups.delete(id);
    set((s) => ({ customGroups: s.customGroups.filter((g) => g.id !== id) }));
  },

  addGoal: async (data) => {
    const goal: Goal = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    await db.goals.add(goal);
    set((s) => ({ goals: [...s.goals, goal] }));
    get().checkNewBadges();
  },

  updateGoal: async (id, data) => {
    await db.goals.update(id, data);
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...data } : g)) }));
  },

  deleteGoal: async (id) => {
    await db.goals.delete(id);
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
    get().checkNewBadges();
  },

  // Computed - Assets
  getAssetValue: (assetId) => {
    const txs = get().transactions.filter((t) => t.assetId === assetId);
    return txs.reduce((sum, t) => sum + (t.type === 'add' ? t.amount : -t.amount), 0);
  },

  getTotalAssetValue: () => {
    const { assets } = get();
    return assets.reduce((sum, a) => sum + get().getAssetValue(a.id), 0);
  },

  // Computed - Debts
  getDebtRemainingBalance: (debtId) => {
    const debt = get().debts.find((d) => d.id === debtId);
    if (!debt) return 0;
    
    const payments = get().debtPayments.filter((p) => p.debtId === debtId);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    return Math.max(0, debt.totalAmount - totalPaid);
  },

  getDebtPaidAmount: (debtId) => {
    const payments = get().debtPayments.filter((p) => p.debtId === debtId);
    return payments.reduce((sum, p) => sum + p.amount, 0);
  },

  getTotalDebtBalance: () => {
    const { debts } = get();
    return debts.reduce((sum, d) => sum + get().getDebtRemainingBalance(d.id), 0);
  },

  getTotalDebtOriginal: () => {
    const { debts } = get();
    return debts.reduce((sum, d) => sum + d.totalAmount, 0);
  },

  // Computed - Net Worth
  getNetWorth: () => {
    return get().getTotalAssetValue() - get().getTotalDebtBalance();
  },

  // Legacy methods for backward compatibility
  getTotalValue: () => get().getTotalAssetValue(), // Assets only now
  getAssetsTotalValue: () => get().getTotalAssetValue(),
  getLiabilitiesTotalValue: () => get().getTotalDebtBalance(),

  getGroupTotal: (groupId) => {
    const group = get().customGroups.find((g) => g.id === groupId);
    if (!group) return 0;
    return group.assetIds.reduce((sum, aid) => sum + get().getAssetValue(aid), 0);
  },

  getCategoryTotal: (categoryId) => {
    const { assets } = get();
    return assets
      .filter((a) => a.categoryId === categoryId)
      .reduce((sum, a) => sum + get().getAssetValue(a.id), 0);
  },
}));
