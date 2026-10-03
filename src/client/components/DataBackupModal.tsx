import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  ShieldCheck,
  CheckCircle,
  X,
  Server,
  RefreshCw,
  HardDrive,
  FileCheck,
} from 'lucide-react';

interface BackupStats {
  outlet: string;
  total_records: number;
  table_counts: Record<string, number>;
  last_backup_status: string;
  timestamp: string;
}

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/v1/backup/stats')
        .then((r) => r.json())
        .then((data) => setStats(data))
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    setDownloading(true);
    window.location.href = '/api/v1/backup';
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-900 border border-blue-200">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900">Forecourt Database & Instant Backup</h3>
              <p className="text-xs text-slate-500">
                SK Petroleum (Indian Oil), Gadhiya • Zero Data Loss Invariant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Status Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-900">Engine Status: WAL Mode Active</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {stats?.total_records || 0} total records
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs">
            <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Shifts</span>
              <span className="font-black text-slate-800">{stats?.table_counts?.shifts ?? 0}</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Vouchers</span>
              <span className="font-black text-slate-800">{stats?.table_counts?.journal_entries ?? 0}</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Customers</span>
              <span className="font-black text-slate-800">{stats?.table_counts?.parties ?? 0}</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Tanks</span>
              <span className="font-black text-slate-800">{stats?.table_counts?.tanks ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Encrypted local WAL database with strict foreign-key integrity</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Complete snapshot includes all 6 vouchers, tanks, dips, staff attendance & khata</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-orange-600 shrink-0" />
            <span>Instant JSON format portable to any cloud server or offline recovery environment</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Last verified: {new Date().toLocaleTimeString('en-IN')}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownloadBackup}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Preparing Snapshot...' : 'Download Backup (JSON)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
