import { Eye, EyeOff, Shield, ShieldCheck, Lock, Unlock, Copy, Plus, Search, Settings, LogOut, Check, X, RefreshCw, Trash2, Key } from 'lucide-react';

export type CategoryType = 'Login' | 'Note' | 'API Key' | 'Bank';

export type Vault = {
  id: string;
  name: string;
  status: 'Healthy' | 'Risk' | 'Compromised';
};

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

export const VAULTS: Vault[] = [
  { id: 'primary', name: 'Primary Vault', status: 'Healthy' },
  { id: 'development', name: 'Development', status: 'Healthy' },
];

export const CATEGORIES: CategoryType[] = ['Login', 'Note', 'API Key', 'Bank'];

export const INITIAL_ENTRIES: Entry[] = [
  {
    id: '1',
    title: 'GitHub',
    username: 'johndoe_dev',
    password: 'ghp_aB1c2D3e4F5g6H7i8J9k0L1m2N3o4P5q6R7s',
    updatedAt: Date.now(),
    category: 'Login',
    vaultId: 'primary',
  },
  {
    id: '2',
    title: 'Apple ID',
    username: 'john.doe@icloud.com',
    password: 'Password123!',
    updatedAt: Date.now() - 86400000,
    category: 'Login',
    vaultId: 'primary',
  },
  {
    id: '3',
    title: 'Reddit (Personal)',
    username: 'u/vault_wizard',
    password: 'correct-horse-battery-staple',
    updatedAt: Date.now() - 172800000,
    category: 'Login',
    vaultId: 'primary',
  },
  {
    id: '4',
    title: 'AWS Root',
    username: 'admin@corp.com',
    password: 'super-secret-aws-key',
    updatedAt: Date.now() - 500000,
    category: 'API Key',
    vaultId: 'development',
  },
  {
    id: '5',
    title: 'Stripe Secret',
    username: 'sk_live_vlt',
    password: 'sk_live_51M...',
    updatedAt: Date.now() - 1000000,
    category: 'API Key',
    vaultId: 'development',
  },
  {
    id: '6',
    title: 'Swiss Bank',
    username: 'CH89 0000 1111 2222',
    password: '9988',
    notes: 'Vault code: 45-90-12\nManager: Hans Schmidt',
    updatedAt: Date.now() - 3000000,
    category: 'Bank',
    vaultId: 'primary',
  },
  {
    id: '7',
    title: 'Seed Phrase',
    username: 'BIP-39 Wallet',
    password: 'abandon ability able about above absent absorb abstract absurd abuse accent accept',
    notes: 'Hardware wallet stored in fireproof safe #4',
    updatedAt: Date.now() - 4000000,
    category: 'Note',
    vaultId: 'primary',
  },
  {
    id: '8',
    title: 'Vercel Token',
    username: 'vercel_deployer',
    password: 'v_tok_123456789',
    updatedAt: Date.now() - 5000000,
    category: 'API Key',
    vaultId: 'development',
  }
];
