import Dexie, { type Table } from 'dexie';
import type { Asset, Category, Transaction, CustomGroup, Goal, Snapshot, Debt, DebtPayment } from '@/types';

export class AsetKuDB extends Dexie {
  assets!: Table<Asset>;
  categories!: Table<Category>;
  transactions!: Table<Transaction>;
  customGroups!: Table<CustomGroup>;
  goals!: Table<Goal>;
  snapshots!: Table<Snapshot>;
  debts!: Table<Debt>;
  debtPayments!: Table<DebtPayment>;

  constructor() {
    super('AsetKuDB');
    this.version(2).stores({
      assets: 'id, categoryId, name, createdAt',
      categories: 'id, name',
      transactions: 'id, assetId, date, type',
      customGroups: 'id, name',
      goals: 'id, name, targetDate',
      snapshots: 'id, date',
      debts: 'id, name, createdAt',
      debtPayments: 'id, debtId, date, type',
    });
  }
}

export const db = new AsetKuDB();

export async function seedDefaultCategories() {
  const count = await db.categories.count();
  if (count > 0) return;

  const defaults: Category[] = [
    { id: 'cat-cash', name: 'Cash', createdAt: new Date().toISOString() },
    { id: 'cat-bank', name: 'Rekening Bank', createdAt: new Date().toISOString() },
    { id: 'cat-deposito', name: 'Deposito', createdAt: new Date().toISOString() },
    { id: 'cat-saham', name: 'Saham', createdAt: new Date().toISOString() },
    { id: 'cat-crypto', name: 'Crypto', createdAt: new Date().toISOString() },
    { id: 'cat-properti', name: 'Properti', createdAt: new Date().toISOString() },
    { id: 'cat-kendaraan', name: 'Kendaraan', createdAt: new Date().toISOString() },
    { id: 'cat-emas', name: 'Emas', createdAt: new Date().toISOString() },
    { id: 'cat-piutang', name: 'Piutang', createdAt: new Date().toISOString() },
    { id: 'cat-lainnya', name: 'Lainnya', createdAt: new Date().toISOString() },
  ];

  await db.categories.bulkAdd(defaults);
}

export async function seedDemoData() {
  // No demo data — user starts fresh
  return;
}
