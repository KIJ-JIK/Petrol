import React, { useState, useEffect } from 'react';
import { offlineStore, SyncState } from '../offline/offline-store';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Fuel,
  Shield,
  User,
  IndianRupee,
  Home,
  LogOut,
  MapPin,
} from 'lucide-react';

interface HeaderProps {
  currentRole: 'attendant' | 'manager' | 'owner' | 'accountant';
  onRoleChange: (role: 'attendant' | 'manager' | 'owner' | 'accountant') => void;
  currentUser: string;
  onGoToLanding: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  currentUser,
  onGoToLanding,
  onSignOut,
}) => {
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
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Outlet details */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onGoToLanding}
              title="Return to Public Landing Page"
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-800 to-orange-500 flex items-center justify-center shadow-xs hover:opacity-90 transition cursor-pointer"
            >
              <Fuel className="w-5 h-5 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onGoToLanding}
                  className="font-extrabold text-base tracking-tight text-slate-900 hover:text-blue-800 transition text-left"
                >
                  SK Petroleum
                </button>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-orange-100 text-orange-700 border border-orange-200">
                  Indian Oil (IOCL) • Gadhiya
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                Gadhiya, Gujarat • GST: 24AABCS1429B1Z1
              </p>
            </div>
          </div>

          {/* Quick Landing Page Link for mobile */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onGoToLanding}
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
          {/* Landing button */}
          <button
            onClick={onGoToLanding}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            <Home className="w-3.5 h-3.5 text-slate-500" />
            <span>Landing Page</span>
          </button>

          {/* Offline / Online Simulator Badge */}
          <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <button
              onClick={toggleOfflineSimulation}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                isOfflineSim
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
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
                className="flex items-center gap-1.5 px-2 py-1 bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold hover:bg-amber-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{syncState.pendingCount} Queued</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                All Synced
              </span>
            )}
          </div>

          {/* Role Switcher Tabs in Light Theme */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
            <button
              onClick={() => onRoleChange('attendant')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentRole === 'attendant'
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Attendant</span>
            </button>

            <button
              onClick={() => onRoleChange('manager')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentRole === 'manager'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Manager</span>
            </button>

            <button
              onClick={() => onRoleChange('owner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentRole === 'owner'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Owner</span>
            </button>

            <button
              onClick={() => onRoleChange('accountant')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentRole === 'accountant'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Accountant</span>
            </button>
          </div>

          {/* User Sign Out / Switch */}
          <button
            onClick={onSignOut}
            title="Sign out or switch active staff"
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-600 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
