import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye, EyeOff, Shield, Lock, Unlock, Copy, Plus,
  Search, Settings, Check, X, RefreshCw, Key,
  Trash2, ShieldCheck, Github, ExternalLink,
  ChevronRight, ChevronLeft, MoreVertical, Search as SearchIcon,
  PanelLeftClose, PanelLeftOpen, Layout
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { Entry, VaultState } from './types';

export default function App() {
  const [vaultState, setVaultState] = useState<VaultState>('uninitialized');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [toast, setToast] = useState<{ message: string; duration: number } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [selectedVaultId, setSelectedVaultId] = useState('primary');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [changePasswordCurrent, setChangePasswordCurrent] = useState('');
  const [changePasswordNew, setChangePasswordNew] = useState('');
  const [changePasswordConfirm, setChangePasswordConfirm] = useState('');
  const [genPassword, setGenPassword] = useState({ length: 32, upper: true, lower: true, numbers: true, symbols: true });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [masterPasswordCache, setMasterPasswordCache] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const autoLockTimerRef = useRef<number | null>(null);
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

  // Check vault exists on mount
  useEffect(() => {
    invoke<boolean>('vault_exists')
      .then(exists => {
        if (exists) {
          setVaultState('locked');
        }
      })
      .catch(() => setVaultState('uninitialized'));
  }, []);

  const recordVaultActivity = () => {
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
    }
    autoLockTimerRef.current = window.setTimeout(() => {
      if (vaultState === 'unlocked') {
        handleLock();
        showToast('Auto-locked due to inactivity', 3000);
      }
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    if (vaultState === 'unlocked') {
      recordVaultActivity();
    } else if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
    }
    return () => {
      if (autoLockTimerRef.current) {
        clearTimeout(autoLockTimerRef.current);
      }
    };
  }, [vaultState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setIsAddModalOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsListCollapsed(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchQuery('');
        setIsAddModalOpen(false);
        setEditingEntry(null);
        setIsSettingsOpen(false);
        setIsGeneratorOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (message: string, duration: number = 3000) => {
    setToast({ message, duration });
    setTimeout(() => setToast(null), duration);
  };

  const handleInitialize = async () => {
    const p1 = passwordInputRef.current?.value || '';
    if (p1 !== confirmPassword) {
      showToast('Passwords do not match', 3000);
      return;
    }
    if (p1.length < 8) {
      showToast('Password must be at least 8 characters', 3000);
      return;
    }

    setIsInitializing(true);
    try {
      await invoke('create_vault', { password: p1, confirmPassword: confirmPassword });
      showToast('Vault created successfully', 3000);
      setMasterPasswordCache(p1);
      setVaultState('unlocked');
      setEntries([]);
    } catch (e: any) {
      showToast(`Failed to create vault: ${e}`, 3000);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleUnlock = async () => {
    const password = passwordInputRef.current?.value || '';
    if (!password) {
      showToast('Please enter your password', 2000);
      return;
    }

    setUnlocking(true);
    try {
      const result = await invoke<Entry[]>('unlock_vault', { password });
      setMasterPasswordCache(password);
      setEntries(result);
      setVaultState('unlocked');
      showToast('Vault unlocked', 2000);
    } catch (e: any) {
      showToast(`Failed to unlock: ${e}`, 3000);
    } finally {
      setUnlocking(false);
      if (passwordInputRef.current) {
        passwordInputRef.current.value = '';
      }
    }
  };

  const handleLock = async () => {
    try {
      await invoke('lock_vault');
      setMasterPasswordCache('');
      setEntries([]);
      setSelectedEntry(null);
      setVaultState('locked');
      showToast('Vault locked', 2000);
    } catch (e: any) {
      showToast(`Error: ${e}`, 3000);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      recordVaultActivity();
      await invoke('copy_to_clipboard', { text });
      showToast(`${label} copied. Clearing in 10s...`, 10000);

      setTimeout(async () => {
        try {
          await invoke('clear_clipboard');
        } catch (e) { }
      }, 10000);
    } catch (err) {
      showToast('Copy failed', 3000);
    }
  };

  const handleAddEntry = async (title: string, username: string, password: string, category: string, notes: string) => {
    recordVaultActivity();
    try {
      const entry = await invoke<Entry>('add_entry', {
        title,
        username,
        password,
        category,
        notes: notes || null,
        masterPassword: masterPasswordCache
      });
      setEntries(prev => [entry, ...prev]);
      showToast('Entry added successfully', 3000);
    } catch (e: any) {
      showToast(`Failed to add entry: ${e}`, 3000);
    }
  };

  const generatePassword = async () => {
    recordVaultActivity();
    try {
      const result = await invoke<{ password: string; entropy: number }>('generate_password_cmd', {
        length: genPassword.length,
        upper: genPassword.upper,
        lower: genPassword.lower,
        numbers: genPassword.numbers,
        symbols: genPassword.symbols
      });
      setGeneratedPassword(result.password);
    } catch (e: any) {
      showToast(`Failed to generate: ${e}`, 3000);
    }
  };

  const calculateEntropy = () => {
    let poolSize = 0;
    if (genPassword.upper) poolSize += 26;
    if (genPassword.lower) poolSize += 26;
    if (genPassword.numbers) poolSize += 10;
    if (genPassword.symbols) poolSize += 32;
    return Math.floor(genPassword.length * Math.log2(poolSize || 1));
  };

  const getStrengthLabel = (entropy: number) => {
    if (entropy < 64) return { label: 'Weak', color: 'bg-red-500' };
    if (entropy < 80) return { label: 'Good', color: 'bg-yellow-500' };
    return { label: 'Strong', color: 'bg-vlt-accent' };
  };

  const handleChangePassword = async () => {
    if (changePasswordNew !== changePasswordConfirm) {
      showToast('New passwords do not match', 3000);
      return;
    }
    if (changePasswordNew.length < 8) {
      showToast('New password must be at least 8 characters', 3000);
      return;
    }

    try {
      await invoke('change_password', {
        oldPassword: changePasswordCurrent,
        newPassword: changePasswordNew,
        confirmPassword: changePasswordConfirm
      });
      setMasterPasswordCache(changePasswordNew);
      showToast('Master password changed successfully', 3000);
      setChangePasswordCurrent('');
      setChangePasswordNew('');
      setChangePasswordConfirm('');
      setIsSettingsOpen(false);
    } catch (e: any) {
      showToast(`Failed: ${e}`, 3000);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? e.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [entries, searchQuery, selectedCategory]);

  if (vaultState === 'uninitialized') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-vlt-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-vlt-surface border border-vlt-border rounded-xl p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-vlt-accent/10 rounded-2xl flex items-center justify-center mb-4 border border-vlt-accent/20">
              <Shield className="text-vlt-accent w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase italic">VLT Manager</h1>
            <p className="text-vlt-text-muted mt-2 text-sm text-center">ENCRYPTION ENGINE STANDBY • LOCAL COLD STORAGE</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest mb-2 px-1">Master Passphrase</label>
              <input
                ref={passwordInputRef}
                type="password"
                placeholder="••••••••••••••••"
                className="w-full bg-vlt-bg border border-vlt-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-vlt-accent/50 transition-all font-mono"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest mb-2 px-1">Confirm Passphrase</label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                className="w-full bg-vlt-bg border border-vlt-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-vlt-accent/50 transition-all font-mono"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>

            <button
              disabled={isInitializing}
              onClick={handleInitialize}
              className="w-full bg-vlt-accent hover:bg-vlt-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs shadow-lg shadow-vlt-accent/10"
            >
              {isInitializing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Securing vault...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Initialize Secure Vault</span>
                </>
              )}
            </button>
          </div>

          <p className="mt-8 text-[10px] text-vlt-text-dim text-center leading-relaxed font-mono">
            PROTOCOL: ARGON2ID • AES-256-GCM<br />
            HARDWARE-BACKED ENTROPY GENERATION ACTIVE
          </p>
        </motion.div>
      </div>
    );
  }

  if (vaultState === 'locked') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-vlt-bg">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm bg-vlt-surface border border-vlt-border rounded-xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="flex flex-col items-center mb-8 relative z-10">
            <motion.div
              animate={unlocking ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
              className="w-16 h-16 bg-vlt-accent/10 rounded-full flex items-center justify-center mb-4 border border-vlt-accent/20"
            >
              <Lock className="text-vlt-accent w-6 h-6" />
            </motion.div>
            <h1 className="text-xl font-bold tracking-tight text-white mb-1 uppercase">Vault Locked</h1>
            <p className="text-vlt-text-muted text-[10px] uppercase tracking-widest font-bold font-mono">Input decryption key</p>
          </div>

          <div className="space-y-4 relative z-10">
            <input
              ref={passwordInputRef}
              autoFocus
              type="password"
              placeholder="••••••••"
              className="w-full bg-vlt-bg border border-vlt-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-vlt-accent/50 text-center font-mono placeholder:opacity-30"
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              autoComplete="current-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />

            <button
              onClick={handleUnlock}
              disabled={unlocking}
              className="w-full bg-vlt-accent hover:bg-vlt-accent-hover text-white font-bold py-3 px-4 rounded-lg transition-all uppercase tracking-widest text-xs shadow-lg shadow-vlt-accent/10 flex items-center justify-center gap-2"
            >
              {unlocking ? <RefreshCw className="animate-spin w-4 h-4" /> : 'Decrypt Session'}
            </button>
          </div>

          <div className="absolute top-0 left-0 w-full h-[2px] bg-vlt-accent opacity-20"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-vlt-bg text-vlt-text select-none overflow-hidden border border-vlt-border shadow-2xl relative">
      <header className="h-10 flex items-center justify-between px-4 bg-vlt-surface border-b border-vlt-border shrink-0 custom-titlebar">
        <div className="flex items-center gap-2 no-drag">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#28c940]"></div>
          </div>
          <div className="text-[11px] font-semibold tracking-widest text-vlt-text-muted flex items-center gap-2">
            <Shield className="w-3 h-3" />
            VLT MANAGER • ENCRYPTED SESSION
          </div>
        </div>

        <div className="flex items-center gap-4 no-drag">
          <div className="text-[10px] text-vlt-text-dim font-mono">HWRD-M2-TUNED</div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded bg-vlt-bg border border-vlt-border-light text-[10px] text-vlt-text hover:bg-vlt-accent/20 hover:border-vlt-accent/50 transition-all flex items-center gap-2 group"
            title="Toggle Navigation (⌘B)"
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5 text-vlt-accent" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline font-mono">NAV</span>
          </button>
          <button
            onClick={handleLock}
            className="px-2 py-1 rounded bg-vlt-bg border border-vlt-border-light text-[10px] text-vlt-text hover:bg-vlt-border-light transition-colors flex items-center gap-2"
          >
            LOCK <span className="text-vlt-text-muted">⌘L</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded bg-vlt-bg border border-vlt-border-light text-vlt-text hover:bg-vlt-border-light transition-colors"
            title="Settings"
          >
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside id="vlt-main-sidebar" className={`${isSidebarCollapsed ? 'w-16' : 'w-60'} bg-vlt-sidebar border-r border-vlt-border p-3 flex flex-col gap-6 overflow-y-auto transition-all duration-300 ease-in-out relative group`}>
          <div>
            {!isSidebarCollapsed && <label className="text-[10px] font-bold text-vlt-text-dim tracking-tighter uppercase mb-3 block px-1">Vaults</label>}
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => {
                  setSelectedVaultId('primary');
                  setSelectedEntry(null);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm border transition-all text-left w-full ${
                  selectedVaultId === 'primary'
                    ? 'bg-vlt-item text-white border-vlt-border-light shadow-lg shadow-black/50'
                    : 'text-vlt-text-muted border-transparent hover:bg-[#151515] hover:text-[#bbb]'
                } ${isSidebarCollapsed ? 'justify-center !p-0 h-10 w-10 mx-auto' : ''}`}
                title={isSidebarCollapsed ? "Primary Vault" : ""}
              >
                <div className={`shrink-0 w-2 h-2 rounded-full ${selectedVaultId === 'primary' ? 'bg-vlt-accent shadow-[0_0_8px_#10b981]' : 'bg-vlt-border-light'}`}></div>
                {!isSidebarCollapsed && <span>Primary Vault</span>}
              </button>
            </nav>
          </div>

          <div>
            {!isSidebarCollapsed && <label className="text-[10px] font-bold text-vlt-text-dim tracking-tighter uppercase mb-3 block px-1">Categories</label>}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex justify-between items-center px-3 py-2 text-sm transition-all rounded-md overflow-hidden ${!selectedCategory ? 'text-white bg-vlt-item/50' : 'text-vlt-text-muted hover:text-[#bbb]'} ${isSidebarCollapsed ? 'justify-center h-10 w-10 mx-auto !p-0' : ''}`}
                title="All Items"
              >
                <div className="flex items-center gap-3">
                  <Layout className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>All Items</span>}
                </div>
                {!isSidebarCollapsed && <span className="text-xs font-mono opacity-50">{entries.length}</span>}
              </button>
              {['Login', 'Note', 'API Key', 'Bank'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex justify-between items-center px-3 py-2 text-sm transition-all rounded-md overflow-hidden ${selectedCategory === cat ? 'text-white bg-vlt-item/50' : 'text-vlt-text-muted hover:text-[#bbb]'} ${isSidebarCollapsed ? 'justify-center h-10 w-10 mx-auto !p-0' : ''}`}
                  title={`${cat}s`}
                >
                  <div className="flex items-center gap-3">
                    {cat === 'Login' && <Shield className="w-4 h-4 shrink-0" />}
                    {cat === 'Note' && <ExternalLink className="w-4 h-4 shrink-0" />}
                    {cat === 'API Key' && <Key className="w-4 h-4 shrink-0" />}
                    {cat === 'Bank' && <RefreshCw className="w-4 h-4 shrink-0" />}
                    {!isSidebarCollapsed && <span>{cat}s</span>}
                  </div>
                  {!isSidebarCollapsed && <span className="text-xs font-mono opacity-50">{entries.filter(e => e.category === cat).length}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto border-t border-vlt-border pt-4 flex flex-col gap-2 min-w-0">
            {!isSidebarCollapsed ? (
              <div className="p-3 bg-[#111] rounded-lg border border-vlt-border overflow-hidden whitespace-nowrap">
                <div className="text-[10px] text-vlt-text-dim uppercase font-bold mb-2">Security Status</div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-vlt-text-muted">Auto-lock: 15m</span>
                  <span className="text-[11px] text-vlt-accent">Healthy</span>
                </div>
                <div className="w-full h-1 bg-vlt-border rounded-full mt-2">
                  <div className="w-[85%] h-full bg-vlt-accent rounded-full shadow-[0_0_4px_#10b981]"></div>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-2 h-16 bg-vlt-item rounded-full relative overflow-hidden">
                <div className="absolute top-0 w-full h-[85%] bg-vlt-accent rounded-full"></div>
              </div>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="mt-2 p-2 hover:bg-vlt-item rounded-lg transition-colors flex items-center justify-center text-vlt-text-dim hover:text-vlt-accent"
              title={isSidebarCollapsed ? "Expand Sidebar (⌘B)" : "Collapse Sidebar (⌘B)"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-vlt-border bg-vlt-bg flex items-center gap-4">
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 rounded bg-vlt-item border border-vlt-border hover:border-vlt-accent/30 transition-all text-vlt-text-dim"
              >
                <MoreVertical className="w-4 h-4 rotate-90" />
              </button>
            )}
            <div className="relative flex-1 flex items-center">
              <SearchIcon className="absolute left-4 w-4 h-4 text-vlt-text-dim" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search entries... (⌘F)"
                className="w-full bg-vlt-item border border-vlt-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:vlt-text-dim focus:outline-none focus:border-vlt-accent/50 transition-all shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-4 flex gap-2 items-center">
                <span className="px-2 py-1 bg-vlt-surface border border-vlt-border-light text-[10px] text-vlt-text-muted rounded font-mono">ESC to clear</span>
              </div>
            </div>
            {isListCollapsed && (
              <button
                onClick={() => setIsListCollapsed(false)}
                className="p-2 rounded-lg bg-vlt-accent/10 border border-vlt-accent/30 text-vlt-accent hover:bg-vlt-accent/20 transition-all flex items-center gap-2 text-xs font-bold font-mono"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                SHOW LIST
              </button>
            )}
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div id="vlt-explorer-list" className={`${isListCollapsed ? 'w-0 border-none' : 'w-[350px] border-r'} border-vlt-border overflow-hidden flex flex-col shrink-0 transition-all duration-300 ease-in-out`}>
              <div className="p-2 border-b border-vlt-border bg-vlt-surface flex justify-between items-center min-w-[350px]">
                <span className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest pl-2">Vault Explorer</span>
                <button
                  onClick={() => setIsListCollapsed(true)}
                  className="p-1.5 hover:bg-vlt-item rounded-lg transition-colors text-vlt-text-dim hover:text-white"
                  title="Collapse List (⌘J)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto min-w-[350px]">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => {
                      setSelectedEntry(entry);
                      setShowPassword(false);
                    }}
                    className={`p-4 border-b border-vlt-border/50 flex items-center justify-between cursor-pointer transition-all ${selectedEntry?.id === entry.id
                        ? 'bg-vlt-item border-l-2 border-l-vlt-accent'
                        : 'hover:bg-[#111] group'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-vlt-bg border border-vlt-border-light flex items-center justify-center text-lg font-bold shadow-lg ${selectedEntry?.id === entry.id ? 'text-white' : 'text-vlt-text-dim group-hover:text-vlt-text-muted'}`}>
                        {entry.title[0]}
                      </div>
                      <div className="overflow-hidden">
                        <div className={`text-sm font-semibold truncate ${selectedEntry?.id === entry.id ? 'text-white' : 'text-vlt-text-muted group-hover:text-vlt-text'}`}>
                          {entry.title}
                        </div>
                        <div className="text-xs text-vlt-text-dim truncate">{entry.username}</div>
                      </div>
                    </div>
                    {selectedEntry?.id === entry.id && (
                      <div className="text-[10px] text-vlt-accent font-mono bg-vlt-accent/10 px-2 py-1 rounded border border-vlt-accent/20 shrink-0">SECURE</div>
                    )}
                  </div>
                ))}
                {filteredEntries.length === 0 && (
                  <div className="p-8 text-center text-vlt-text-dim text-sm italic">
                    No entries found
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-vlt-border bg-vlt-surface">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full py-2.5 bg-vlt-accent/10 hover:bg-vlt-accent/20 border border-vlt-accent/30 text-vlt-accent rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Entry
                </button>
              </div>
            </div>

            <div id="vlt-entry-detail" className="flex-1 bg-vlt-sidebar p-6 overflow-y-auto">
              {selectedEntry ? (
                <div className="max-w-2xl mx-auto">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">{selectedEntry.title}</h2>
                      <p className="text-vlt-text-muted text-sm">
                        Category: {selectedEntry.category}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="group">
                      <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Username</label>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-vlt-item border border-vlt-border group-hover:border-vlt-border-light transition-colors">
                        <span className="font-mono text-[#aaa]">{selectedEntry.username}</span>
                        <button
                          onClick={() => copyToClipboard(selectedEntry.username, 'Username')}
                          className="p-2 text-vlt-text-dim hover:text-vlt-accent transition-colors"
                          title="Copy Username"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="group">
                      <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Password</label>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-vlt-item border border-vlt-border group-hover:border-vlt-border-light transition-colors cursor-pointer hover:bg-vlt-item/80" onClick={() => copyToClipboard(selectedEntry.password, 'Password')}>
                        <span className={`font-mono text-vlt-accent text-sm tracking-[0.2em] ${showPassword ? '' : 'blur-sm select-none'}`}>
                          {showPassword ? selectedEntry.password : '••••••••••••••••'}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              recordVaultActivity();
                              setShowPassword(!showPassword);
                            }}
                            className="p-2 text-vlt-text-dim hover:text-white transition-colors"
                            title={showPassword ? "Hide Password" : "Show Password"}
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(selectedEntry.password, 'Password');
                            }}
                            className="p-2 text-vlt-text-dim hover:text-vlt-accent transition-colors"
                            title="Copy Password"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {selectedEntry.notes && (
                      <div>
                        <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Notes</label>
                        <pre className="p-4 rounded-xl bg-vlt-item border border-vlt-border text-xs text-vlt-text-muted min-h-[100px] leading-relaxed font-mono whitespace-pre-wrap">
                          {selectedEntry.notes}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-vlt-text-dim">
                  <ShieldCheck className="w-16 h-16 mb-4 opacity-5" />
                  <p className="text-sm font-medium uppercase tracking-widest opacity-50">Select an entry to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="h-9 shrink-0 bg-vlt-surface border-t border-vlt-border px-4 flex items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-[10px] text-vlt-text-dim font-bold uppercase">
            <span className="bg-vlt-bg px-1.5 py-0.5 rounded text-vlt-text-muted border border-vlt-border-light">⌘N</span> New Entry
          </div>
          <div className="flex items-center gap-2 text-[10px] text-vlt-text-dim font-bold uppercase">
            <span className="bg-vlt-bg px-1.5 py-0.5 rounded text-vlt-text-muted border border-vlt-border-light">⌘F</span> Search
          </div>
          <div className="flex items-center gap-2 text-[10px] text-vlt-text-dim font-bold uppercase">
            <span className="bg-vlt-bg px-1.5 py-0.5 rounded text-vlt-text-muted border border-vlt-border-light">⌘L</span> Lock
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-vlt-text-dim font-mono">
          VERSION 1.0.0 • SYNCED TO LOCAL COLD STORAGE
        </div>
      </footer>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[400px] bg-vlt-surface border border-vlt-border-light rounded-xl shadow-2xl p-4 flex items-center gap-4 z-50 overflow-hidden"
          >
            <div className="w-8 h-8 rounded-full bg-vlt-accent/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-vlt-accent" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-white font-semibold">{toast.message.split('.')[0]}</div>
              <div className="w-full h-1 bg-vlt-border rounded-full mt-2 overflow-hidden">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: toast.duration / 1000, ease: "linear" }}
                  className="h-full bg-vlt-accent"
                />
              </div>
            </div>
            <button onClick={() => setToast(null)} className="text-vlt-text-dim hover:text-vlt-text-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingEntry(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-vlt-surface border border-vlt-border rounded-2xl shadow-3xl overflow-hidden z-[101]"
            >
              <div className="p-6 border-b border-vlt-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-vlt-accent" />
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight">New Vault Entry</h2>
                </div>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingEntry(null);
                  }}
                  className="text-vlt-text-dim hover:text-white underline text-xs font-mono"
                >
                  CANCEL [ESC]
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Service / Title</label>
                  <input
                    id="entry-title"
                    type="text"
                    placeholder="e.g. GitHub Production"
                    className="w-full bg-vlt-item border border-vlt-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vlt-accent/50 transition-all font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Username</label>
                    <input
                      id="entry-username"
                      type="text"
                      className="w-full bg-vlt-item border border-vlt-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vlt-accent/50 transition-all font-mono text-sm"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2 flex justify-between">
                      Password
                      <button
                        type="button"
                        onClick={() => setIsGeneratorOpen(true)}
                        className="text-vlt-accent hover:underline font-mono"
                      >
                        GENERATOR
                      </button>
                    </label>
                    <div className="relative group">
                      <input
                        id="entry-password"
                        type="password"
                        defaultValue={generatedPassword}
                        className="w-full bg-vlt-item border border-vlt-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vlt-accent/50 transition-all font-mono text-sm pr-10"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          generatePassword();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-vlt-text-dim hover:text-vlt-accent transition-colors"
                        title="Generate Password"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Category</label>
                  <select
                    id="entry-category"
                    className="w-full bg-vlt-item border border-vlt-border rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-vlt-accent/50 transition-all font-mono text-sm appearance-none"
                  >
                    <option value="Login">Login</option>
                    <option value="Note">Secure Note</option>
                    <option value="API Key">API Key</option>
                    <option value="Bank">Bank Account</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Notes (Optional)</label>
                  <textarea
                    id="entry-notes"
                    className="w-full bg-vlt-item border border-vlt-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vlt-accent/50 transition-all h-32 resize-none text-xs leading-relaxed font-mono"
                    placeholder="Encrypted notes or recovery codes..."
                  ></textarea>
                </div>
              </div>

              <div className="p-6 bg-vlt-bg border-t border-vlt-border flex gap-3">
                <button
                  onClick={async () => {
                    const title = (document.getElementById('entry-title') as HTMLInputElement).value;
                    const username = (document.getElementById('entry-username') as HTMLInputElement).value;
                    const password = (document.getElementById('entry-password') as HTMLInputElement).value || generatedPassword;
                    const category = (document.getElementById('entry-category') as HTMLSelectElement).value;
                    const notes = (document.getElementById('entry-notes') as HTMLTextAreaElement).value;

                    if (title && password) {
                      await handleAddEntry(title, username, password, category, notes);
                      setIsAddModalOpen(false);
                      setGeneratedPassword('');
                    }
                  }}
                  className="flex-1 bg-vlt-accent hover:bg-vlt-accent-hover text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-vlt-accent/20 uppercase tracking-widest text-xs"
                >
                  Seal & Synchronize Entry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-vlt-surface border border-vlt-border rounded-2xl shadow-3xl z-[101]"
            >
              <div className="p-6 border-b border-vlt-border flex items-center gap-3">
                <Shield className="w-5 h-5 text-vlt-accent" />
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">Security Settings</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Current Master Password</label>
                  <input
                    type="password"
                    className="w-full bg-vlt-item border border-vlt-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vlt-accent/50 transition-all font-mono text-sm"
                    value={changePasswordCurrent}
                    onChange={(e) => setChangePasswordCurrent(e.target.value)}
                    autoComplete="current-password"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">New Master Password</label>
                  <input
                    type="password"
                    className="w-full bg-vlt-item border border-vlt-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vlt-accent/50 transition-all font-mono text-sm"
                    value={changePasswordNew}
                    onChange={(e) => setChangePasswordNew(e.target.value)}
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full bg-vlt-item border border-vlt-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vlt-accent/50 transition-all font-mono text-sm"
                    value={changePasswordConfirm}
                    onChange={(e) => setChangePasswordConfirm(e.target.value)}
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>
              </div>

              <div className="p-6 bg-vlt-bg border-t border-vlt-border flex gap-3">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 bg-vlt-surface border border-vlt-border text-vlt-text font-bold py-3 rounded-xl hover:bg-vlt-border-light transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="flex-1 bg-vlt-accent hover:bg-vlt-accent-hover text-white font-bold py-3 rounded-xl transition-all shadow-xl shadow-vlt-accent/20 uppercase tracking-widest text-xs"
                >
                  Update Password
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGeneratorOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGeneratorOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-vlt-surface border border-vlt-border rounded-2xl shadow-3xl z-[101]"
            >
              <div className="p-6 border-b border-vlt-border flex items-center gap-3">
                <Key className="w-5 h-5 text-vlt-accent" />
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">Password Generator</h2>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Generated Password</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedPassword || 'Click generate to create'}
                      className="flex-1 bg-vlt-item border border-vlt-border rounded-xl px-4 py-3 text-vlt-accent focus:outline-none font-mono text-sm tracking-wide"
                    />
                    <button
                      onClick={() => generatedPassword && copyToClipboard(generatedPassword, 'Generated Password')}
                      disabled={!generatedPassword}
                      className="p-3 rounded-xl bg-vlt-item border border-vlt-border text-vlt-text-dim hover:text-vlt-accent hover:border-vlt-accent/50 disabled:opacity-30 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest">Length: {genPassword.length}</span>
                      <span className={`text-[10px] font-mono uppercase tracking-wider ${getStrengthLabel(calculateEntropy()).color.replace('bg-', 'text-')}`}>
                        {calculateEntropy()} Bits - {getStrengthLabel(calculateEntropy()).label}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="64"
                      value={genPassword.length}
                      onChange={(e) => setGenPassword(p => ({ ...p, length: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-vlt-border rounded-full appearance-none cursor-pointer accent-vlt-accent"
                    />
                  </div>
                  <div className="mt-3 flex-1 h-2 bg-vlt-border rounded-full flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`flex-1 h-full rounded-full transition-all ${
                          calculateEntropy() > 48 + i * 24
                            ? getStrengthLabel(calculateEntropy()).color
                            : 'opacity-30 bg-vlt-border'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {(['upper', 'lower', 'numbers', 'symbols'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setGenPassword(p => ({ ...p, [opt]: !p[opt] }))}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        genPassword[opt]
                          ? 'bg-vlt-accent/10 border-vlt-accent/50 text-white'
                          : 'bg-vlt-item border-vlt-border text-vlt-text-muted opacity-60'
                      }`}
                    >
                      <div className="text-xs font-bold uppercase tracking-tight">
                        {opt === 'upper' && 'Uppercase'}
                        {opt === 'lower' && 'Lowercase'}
                        {opt === 'numbers' && 'Numbers'}
                        {opt === 'symbols' && 'Symbols'}
                      </div>
                      <div className="text-xs font-mono mt-1 opacity-60">
                        {opt === 'upper' && 'A-Z'}
                        {opt === 'lower' && 'a-z'}
                        {opt === 'numbers' && '0-9'}
                        {opt === 'symbols' && '!@#$%'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-vlt-bg border-t border-vlt-border flex gap-3">
                <button
                  onClick={() => setIsGeneratorOpen(false)}
                  className="flex-1 bg-vlt-surface border border-vlt-border text-vlt-text font-bold py-3 rounded-xl hover:bg-vlt-border-light transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={generatePassword}
                  className="flex-1 bg-vlt-accent hover:bg-vlt-accent-hover text-white font-bold py-3 rounded-xl transition-all shadow-xl shadow-vlt-accent/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  Generate
                </button>
                <button
                  onClick={() => {
                    if (generatedPassword) {
                      showToast('Password ready - use in entry form', 2000);
                      setIsGeneratorOpen(false);
                    }
                  }}
                  disabled={!generatedPassword}
                  className="flex-1 bg-vlt-text text-vlt-bg disabled:opacity-30 font-bold py-3 rounded-xl transition-all uppercase tracking-widest text-xs"
                >
                  Use
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
