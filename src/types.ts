export type CategoryType = 'Login' | 'Note' | 'API Key' | 'Bank';

export type Entry = {
  id: string;
  title: string;
  username: string;
  password: string;
  notes?: string;
  updatedAt: number;
  category: CategoryType;
  vaultId: string;
};

export type VaultState = 'uninitialized' | 'locked' | 'unlocked';

export const CATEGORIES: CategoryType[] = ['Login', 'Note', 'API Key', 'Bank'];
