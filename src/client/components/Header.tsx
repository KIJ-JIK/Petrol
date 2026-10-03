import React, { useState, useEffect } from 'react';
import { offlineStore, SyncState } from '../offline/offline-store';
import { Wifi, WifiOff, RefreshCw, Fuel, Shield, User, Clock, IndianRupee } from 'lucide-react';

interface HeaderProps {
  currentRole: 'attendant' | 'manager' | 'owner' | 'accountant';
  onRoleChange: (role: 'attendant' | 'manager' | 'owner' | 'accountant') => void;
  currentUser: string;
}

export const Header: React.FC<HeaderProps> = ({ currentRole, onRoleChange, currentUser }) => {
  const [syncState, setSyncState] = useState<{ state: SyncState; pendingCount: number }>({
    state: 'ONLINE_SYNCED',
    pendingCount: 0,
  });
  const [isOfflineSim, setIsOfflineSim] = useState(offlineStore.getSimulatedOffline());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    return offlineStore.subscribe((state) => {
      setSyncState(state);
      setIsOfflineSim(offlineStore.getSimulatedOffline());
    });
  }, []);

  const toggleOfflineSimulation = () => {
    const next = !isOfflineSim;
    setIsOfflineSim(next);
    offlineStore.setSimulatedOffline(next);
  };

  const triggerManualSync = async () => {
    setIsSyncing(true);
    await offlineStore.syncNow();
    setIsSyncing(false);
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Outlet details */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Fuel className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  SK Petroleum
                </h1>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Indian Oil (IOCL) • Gadhiya
                </span>
              </div>
              <p className="text-xs text-slate-400">Gadhiya, Gujarat • GST: 24AABCS1429B1Z1</p>
            </div>
          </div>

          {/* Mobile sync indicator */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleOfflineSimulation}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                isOfflineSim
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              {isOfflineSim ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
          {/* Offline / Online Simulator Badge */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
            <button
              onClick={toggleOfflineSimulation}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold transition-all ${
                isOfflineSim
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
              }`}
              title="Click to simulate forecourt network disconnection"
            >
              {isOfflineSim ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Simulated Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Online</span>
                </>
              )}
            </button>

            {/* Sync state badge */}
            {syncState.pendingCount > 0 ? (
              <button
                onClick={triggerManualSync}
                disabled={isOfflineSim || isSyncing}
                className="flex items-center gap-1.5 px-2 py-1 bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded text-xs font-medium hover:bg-amber-600/40 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{syncState.pendingCount} Queued</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                All Synced
              </span>
            )}
          </div>

          {/* Role Switcher Tabs */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => onRoleChange('attendant')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentRole === 'attendant'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Attendant</span>
            </button>

            <button
              onClick={() => onRoleChange('manager')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentRole === 'manager'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Manager</span>
            </button>

            <button
              onClick={() => onRoleChange('owner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentRole === 'owner'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Owner</span>
            </button>

            <button
              onClick={() => onRoleChange('accountant')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentRole === 'accountant'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Accountant</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
