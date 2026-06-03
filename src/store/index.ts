import { create } from 'zustand';
import { db } from '@/db';
import type { Asset, Category, Transaction, CustomGroup, Goal } from '@/types';
import { generateId } from '@/lib/utils';

interface AppState {
  assets: Asset[];
  categories: Category[];
  transactions: Transaction[];
  customGroups: CustomGroup[];
  goals: Goal[];
  isLoading: boolean;

  loadAll: () => Promise<void>;

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

  // Custom Groups
  addGroup: (name: string, assetIds: string[]) => Promise<void>;
  updateGroup: (id: string, name: string, assetIds: string[]) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Computed
  getAssetValue: (assetId: string) => number;
  getTotalValue: () => number;
  getGroupTotal: (groupId: string) => number;
  getCategoryTotal: (categoryId: string) => number;
}

export const useStore = create<AppState>((set, get) => ({
  assets: [],
  categories: [],
  transactions: [],
  customGroups: [],
  goals: [],
  isLoading: true,

  loadAll: async () => {
    const [assets, categories, transactions, customGroups, goals] = await Promise.all([
      db.assets.toArray(),
      db.categories.toArray(),
      db.transactions.toArray(),
      db.customGroups.toArray(),
      db.goals.toArray(),
    ]);
    set({ assets, categories, transactions, customGroups, goals, isLoading: false });
  },

  addAsset: async (data) => {
    const now = new Date().toISOString();
    const asset: Asset = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await db.assets.add(asset);
    // Add initial transaction
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
    const tx: Transaction = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    await db.transactions.add(tx);
    set((s) => ({ transactions: [...s.transactions, tx] }));
  },

  deleteTransaction: async (id) => {
    await db.transactions.delete(id);
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
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
  },

  updateGoal: async (id, data) => {
    await db.goals.update(id, data);
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...data } : g)) }));
  },

  deleteGoal: async (id) => {
    await db.goals.delete(id);
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  },

  getAssetValue: (assetId) => {
    const txs = get().transactions.filter((t) => t.assetId === assetId);
    return txs.reduce((sum, t) => sum + (t.type === 'add' ? t.amount : -t.amount), 0);
  },

  getTotalValue: () => {
    const { assets, transactions } = get();
    return assets.reduce((total, asset) => {
      const val = transactions
        .filter((t) => t.assetId === asset.id)
        .reduce((sum, t) => sum + (t.type === 'add' ? t.amount : -t.amount), 0);
      return total + val;
    }, 0);
  },

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
