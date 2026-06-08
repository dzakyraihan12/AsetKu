export interface Asset {
  id: string;
  name: string;
  categoryId: string;
  initialValue: number;
  currency: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  assetId: string;
  type: 'add' | 'subtract';
  amount: number;
  notes: string;
  date: string;
  createdAt: string;
}

export interface CustomGroup {
  id: string;
  name: string;
  assetIds: string[];
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string;
  categoryId?: string;
  customGroupId?: string;
  emoji?: string;
  createdAt: string;
}

export interface Snapshot {
  id: string;
  date: string;
  totalValue: number;
  breakdown: Record<string, number>;
}
