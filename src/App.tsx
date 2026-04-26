/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, EyeOff, Shield, Lock, Unlock, Copy, Plus, 
  Search, Settings, Check, X, RefreshCw, Key, 
  Trash2, ShieldCheck, Github, ExternalLink,
  ChevronRight, ChevronLeft, MoreVertical, Search as SearchIcon,
  PanelLeftClose, PanelLeftOpen, Layout
} from 'lucide-react';
import { Entry, VaultState, INITIAL_ENTRIES } from './types';

export default function App() {
  const [vaultState, setVaultState] = useState<VaultState>('uninitialized');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [toast, setToast] = useState<{ message: string; duration: number } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [selectedVaultId, setSelectedVaultId] = useState('primary');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Focus search on Cmd+F
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInitialize = () => {
    setIsInitializing(true);
    setTimeout(() => {
      setVaultState('unlocked');
      setEntries(INITIAL_ENTRIES);
      setIsInitializing(false);
      showToast('Vault Initialized & Hardware Tuned', 3000);
    }, 2000);
  };

  const handleUnlock = () => {
    setUnlocking(true);
    setTimeout(() => {
      setVaultState('unlocked');
      setEntries(INITIAL_ENTRIES);
      setUnlocking(false);
      setMasterPassword('');
    }, 400); 
  };

  const showToast = (message: string, duration: number = 2000) => {
    setToast({ message, duration });
    setTimeout(() => setToast(null), duration);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied. Clearing in 10s...`, 10000);
      
      // Simulate Rust-side clipboard clear
      setTimeout(async () => {
        try {
          // Only attempt to clear if we still have focus, otherwise it throws
          if (document.hasFocus()) {
            await navigator.clipboard.writeText('');
          }
        } catch (e) {
          // Ignore focus errors during cleanup
        }
      }, 10000);
    } catch (err) {
      showToast('Copy failed: Re-focus window and try again', 3000);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           e.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVault = e.vaultId === selectedVaultId;
      const matchesCategory = selectedCategory ? e.category === selectedCategory : true;
      return matchesSearch && matchesVault && matchesCategory;
    });
  }, [entries, searchQuery, selectedVaultId, selectedCategory]);

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
                type="password"
                placeholder="••••••••••••••••"
                className="w-full bg-vlt-bg border border-vlt-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-vlt-accent/50 transition-all font-mono"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
              />
            </div>
            
            <button 
              disabled={isInitializing || !masterPassword}
              onClick={handleInitialize}
              className="w-full bg-vlt-accent hover:bg-vlt-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs shadow-lg shadow-vlt-accent/10"
            >
              {isInitializing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Tuning m_cost...</span>
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
              autoFocus
              type="password"
              placeholder="••••••••"
              className="w-full bg-vlt-bg border border-vlt-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-vlt-accent/50 text-center font-mono placeholder:opacity-30"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            
            <button 
              onClick={handleUnlock}
              disabled={unlocking || !masterPassword}
              className="w-full bg-vlt-accent hover:bg-vlt-accent-hover text-white font-bold py-3 px-4 rounded-lg transition-all uppercase tracking-widest text-xs shadow-lg shadow-vlt-accent/10"
            >
              {unlocking ? <RefreshCw className="animate-spin mx-auto w-4 h-4" /> : 'Decrypt Session'}
            </button>
          </div>

          <div className="absolute top-0 left-0 w-full h-[2px] bg-vlt-accent opacity-20"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-vlt-bg text-vlt-text select-none overflow-hidden border border-vlt-border shadow-2xl relative">
      {/* Custom Frameless Titlebar */}
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
            onClick={() => setVaultState('locked')}
            className="px-2 py-1 rounded bg-vlt-bg border border-vlt-border-light text-[10px] text-vlt-text hover:bg-vlt-border-light transition-colors flex items-center gap-2"
          >
            LOCK <span className="text-vlt-text-muted">⌘L</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
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
              <button 
                onClick={() => {
                  setSelectedVaultId('development');
                  setSelectedEntry(null);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm border transition-all text-left w-full ${
                  selectedVaultId === 'development' 
                    ? 'bg-vlt-item text-white border-vlt-border-light shadow-lg shadow-black/50' 
                    : 'text-vlt-text-muted border-transparent hover:bg-[#151515] hover:text-[#bbb]'
                } ${isSidebarCollapsed ? 'justify-center !p-0 h-10 w-10 mx-auto' : ''}`}
                title={isSidebarCollapsed ? "Development Vault" : ""}
              >
                <div className={`shrink-0 w-2 h-2 rounded-full ${selectedVaultId === 'development' ? 'bg-vlt-accent shadow-[0_0_8px_#10b981]' : 'bg-vlt-border-light'}`}></div>
                {!isSidebarCollapsed && <span>Development</span>}
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
                {!isSidebarCollapsed && <span className="text-xs font-mono opacity-50">{entries.filter(e => e.vaultId === selectedVaultId).length}</span>}
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
                  {!isSidebarCollapsed && <span className="text-xs font-mono opacity-50">{entries.filter(e => e.vaultId === selectedVaultId && e.category === cat).length}</span>}
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Global Search */}
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
                className="w-full bg-vlt-item border border-vlt-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-vlt-text-dim focus:outline-none focus:border-vlt-accent/50 transition-all shadow-inner"
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

          {/* Split View Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* List Column */}
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
                    className={`p-4 border-b border-vlt-border/50 flex items-center justify-between cursor-pointer transition-all ${
                      selectedEntry?.id === entry.id 
                        ? 'bg-vlt-item border-l-2 border-l-vlt-accent' 
                        : 'hover:bg-[#111] group'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-vlt-bg border border-vlt-border-light flex items-center justify-center text-lg font-bold shadow-lg ${
                        selectedEntry?.id === entry.id ? 'text-white' : 'text-vlt-text-dim group-hover:text-vlt-text-muted'
                      }`}>
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
            </div>

            {/* Detail Column */}
            <div id="vlt-entry-detail" className="flex-1 bg-vlt-sidebar p-6 overflow-y-auto">
              {selectedEntry ? (
                <div className="max-w-2xl mx-auto">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">{selectedEntry.title}</h2>
                      <p className="text-vlt-text-muted text-sm">
                        Created on {new Date(selectedEntry.updatedAt).toLocaleDateString()} • Category: {selectedEntry.category}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingEntry(selectedEntry);
                          setIsAddModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-lg bg-vlt-surface border border-vlt-border-light text-sm font-semibold hover:bg-vlt-border-light transition-all"
                      >
                        Edit
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-vlt-surface border border-vlt-border-light text-sm font-semibold hover:text-red-400 hover:border-red-400/30 transition-all">Delete</button>
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
                      <div className="flex items-center justify-between p-4 rounded-xl bg-vlt-item border border-vlt-border group-hover:border-vlt-border-light transition-colors">
                        <span className={`font-mono text-vlt-accent text-sm tracking-[0.2em] ${showPassword ? '' : 'blur-sm select-none'}`}>
                          {showPassword ? selectedEntry.password : '•••••••••••••••'}
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-2 text-vlt-text-dim hover:text-white transition-colors"
                            title={showPassword ? "Hide Password" : "Show Password"}
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button 
                            onClick={() => copyToClipboard(selectedEntry.password, 'Password')}
                            className="p-2 text-vlt-text-dim hover:text-vlt-accent transition-colors"
                            title="Copy Password"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Strength Meter */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-1 bg-vlt-border rounded-full flex gap-1">
                          <div className="flex-1 h-full bg-vlt-accent rounded-full shadow-[0_0_4px_#10b981]"></div>
                          <div className="flex-1 h-full bg-vlt-accent rounded-full shadow-[0_0_4px_#10b981]"></div>
                          <div className="flex-1 h-full bg-vlt-accent rounded-full shadow-[0_0_4px_#10b981]"></div>
                          <div className="flex-1 h-full bg-vlt-accent rounded-full opacity-30"></div>
                        </div>
                        <span className="text-[10px] font-mono text-vlt-accent uppercase tracking-wider">128 Bits - Very Strong</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Notes</label>
                      <pre className="p-4 rounded-xl bg-vlt-item border border-vlt-border text-xs text-vlt-text-muted min-h-[100px] leading-relaxed font-mono whitespace-pre-wrap">
                        {selectedEntry.notes || 'Encrypted metadata block. No plaintext notes attached to this record.'}
                      </pre>
                    </div>
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

      {/* Bottom Shortcut Bar */}
      <footer className="h-9 shrink-0 bg-vlt-surface border-t border-vlt-border px-4 flex items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-[10px] text-vlt-text-dim font-bold uppercase">
            <span className="bg-vlt-bg px-1.5 py-0.5 rounded text-vlt-text-muted border border-vlt-border-light">⌘N</span> Add New
          </div>
          <div className="flex items-center gap-2 text-[10px] text-vlt-text-dim font-bold uppercase">
            <span className="bg-vlt-bg px-1.5 py-0.5 rounded text-vlt-text-muted border border-vlt-border-light">⌘F</span> Search
          </div>
          <div className="flex items-center gap-2 text-[10px] text-vlt-text-dim font-bold uppercase">
            <span className="bg-vlt-bg px-1.5 py-0.5 rounded text-vlt-text-muted border border-vlt-border-light">⌘L</span> Lock
          </div>
          <div className="flex items-center gap-2 text-[10px] text-vlt-text-dim font-bold uppercase">
            <span className="bg-vlt-bg px-1.5 py-0.5 rounded text-vlt-text-muted border border-vlt-border-light">⌘B</span> Toggle Nav
          </div>
          <div className="flex items-center gap-2 text-[10px] text-vlt-text-dim font-bold uppercase">
            <span className="bg-vlt-bg px-1.5 py-0.5 rounded text-vlt-text-muted border border-vlt-border-light">⌘J</span> Toggle List
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-vlt-text-dim font-mono">
          VERSION 1.0.4-BETA • SYNCED TO LOCAL COLD STORAGE
        </div>
      </footer>

      {/* Floating Toast Notification */}
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
              <div className="text-[10px] text-vlt-text-muted uppercase font-bold tracking-tight mt-1">Clearing clipboard in 10s</div>
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

      {/* Add/Edit Entry Modal */}
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
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight">{editingEntry ? 'Edit Vault Entry' : 'New Vault Entry'}</h2>
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
                  <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Service Identity</label>
                  <input 
                    type="text" 
                    defaultValue={editingEntry?.title || ''}
                    placeholder="e.g. GitHub Production"
                    className="w-full bg-vlt-item border border-vlt-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vlt-accent/50 transition-all font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Vault Location</label>
                    <select 
                      defaultValue={editingEntry?.vaultId || 'primary'}
                      className="w-full bg-vlt-item border border-vlt-border rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-vlt-accent/50 transition-all font-mono text-sm appearance-none"
                    >
                      <option value="primary">Primary Vault</option>
                      <option value="development">Development</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Category</label>
                    <div className="relative">
                      <select 
                        defaultValue={editingEntry?.category || 'Login'}
                        className="w-full bg-vlt-item border border-vlt-border rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-vlt-accent/50 transition-all font-mono text-sm appearance-none"
                      >
                        <option value="Login">Login</option>
                        <option value="Note">Secure Note</option>
                        <option value="API Key">API Key</option>
                        <option value="Bank">Bank Account</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Assign Username</label>
                    <input 
                      type="text" 
                      defaultValue={editingEntry?.username || ''}
                      className="w-full bg-vlt-item border border-vlt-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vlt-accent/50 transition-all font-mono text-sm"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2 flex justify-between">
                      Encryption Key
                      <span className="text-vlt-accent opacity-50 font-mono">AUTO-GEN</span>
                    </label>
                    <div className="relative group">
                      <input 
                        type="password" 
                        defaultValue={editingEntry?.password || '••••••••••••••••'}
                        className="w-full bg-vlt-item border border-vlt-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vlt-accent/50 transition-all font-mono text-sm pr-10"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-vlt-text-dim hover:text-vlt-accent transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-vlt-text-dim uppercase tracking-widest block mb-2">Secure Metadata</label>
                  <textarea 
                    defaultValue={editingEntry?.notes || ''}
                    className="w-full bg-vlt-item border border-vlt-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vlt-accent/50 transition-all h-32 resize-none text-xs leading-relaxed font-mono"
                    placeholder="Encrypted notes or recovery codes..."
                  ></textarea>
                </div>
              </div>

              <div className="p-6 bg-vlt-bg border-t border-vlt-border flex gap-3">
                <button 
                  onClick={() => {
                    if (editingEntry) {
                      setEntries(prev => prev.map(e => e.id === editingEntry.id ? { ...e, updatedAt: Date.now() } : e));
                      showToast('Entry updated successfully', 3000);
                    } else {
                      const newEntry: Entry = {
                        id: Math.random().toString(36).substr(2, 9),
                        title: 'New Service',
                        username: 'user@example.com',
                        password: 'password123',
                        category: 'Login',
                        vaultId: selectedVaultId,
                        updatedAt: Date.now()
                      };
                      setEntries(prev => [newEntry, ...prev]);
                      showToast('Safe synchronization complete', 3000);
                    }
                    setIsAddModalOpen(false);
                    setEditingEntry(null);
                  }}
                  className="flex-1 bg-vlt-accent hover:bg-vlt-accent-hover text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-vlt-accent/20 uppercase tracking-widest text-xs"
                >
                  {editingEntry ? 'Commit Changes' : 'Seal & Synchronize Entry'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
