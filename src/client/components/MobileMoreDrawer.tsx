import React from 'react';
import { AppModule } from './MobileBottomNav';
import {
  X,
  BookOpen,
  Landmark,
  Sliders,
  FileText,
  Clock,
  MessageSquare,
  Database,
  Shield,
  LogOut,
  ChevronRight,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: AppModule;
  onSelectModule: (module: AppModule) => void;
  currentRole: 'attendant' | 'manager' | 'owner' | 'accountant';
  onRoleChange: (role: 'attendant' | 'manager' | 'owner' | 'accountant') => void;
  currentUser: string;
  onOpenBackup: () => void;
  onSignOut: () => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({
  isOpen,
  onClose,
  activeModule,
  onSelectModule,
  currentRole,
  onRoleChange,
  currentUser,
  onOpenBackup,
  onSignOut,
}) => {
  if (!isOpen) return null;

  const handleModuleClick = (mod: AppModule) => {
    onSelectModule(mod);
    onClose();
  };

  const navItems = [
    {
      category: 'Accounting & Finance',
      items: [
        {
          id: 'accounting' as AppModule,
          label: '6-Voucher Hub & P&L',
          desc: 'Sales, purchase, contra & journal vouchers',
          icon: BookOpen,
          badge: 'Balanced',
        },
        {
          id: 'reconciliation' as AppModule,
          label: 'Bank Reconciliation',
          desc: 'Match statement credits with forecourt deposits',
          icon: Landmark,
          badge: 'SBI Gujarat',
        },
      ],
    },
    {
      category: 'Forecourt Operations & Quality',
      items: [
        {
          id: 'masters' as AppModule,
          label: 'Master Settings & Controls',
          desc: 'Nozzle/tank operational status & meter baselines',
          icon: Sliders,
          badge: 'IOCL',
        },
        {
          id: 'payroll' as AppModule,
          label: 'Staff Attendance & Payroll',
          desc: 'Forecourt shifts, advances & monthly salaries',
          icon: Clock,
          badge: 'Staff',
        },
      ],
    },
    {
      category: 'Intelligence & Compliance',
      items: [
        {
          id: 'reports' as AppModule,
          label: 'Reports Hub (40+ Reports)',
          desc: 'Tax, dip, sales, and audit ledgers with CSV export',
          icon: FileText,
          badge: 'CSV',
        },
        {
          id: 'communications' as AppModule,
          label: 'Transactional Communications',
          desc: 'DLT-registered SMS and WhatsApp dispatch log',
          icon: MessageSquare,
          badge: 'DLT',
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-Up Drawer Content */}
      <div className="relative bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-200">
        {/* Handle bar */}
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Drawer Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">All Modules & Settings</h2>
            <p className="text-xs text-slate-500">
              SK Petroleum • Active as <span className="font-bold text-blue-900 capitalize">{currentRole}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Module List */}
        <div className="overflow-y-auto p-4 space-y-5 pb-6">
          {/* Role Quick Selector */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Active Station Role
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(['attendant', 'manager', 'owner', 'accountant'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => onRoleChange(r)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition capitalize flex items-center justify-between ${
                    currentRole === r
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{r}</span>
                  {currentRole === r && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-blue-700" />
              <span>{currentUser}</span>
            </p>
          </div>

          {/* Module Links */}
          {navItems.map((group) => (
            <div key={group.category} className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                {group.category}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleModuleClick(item.id)}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 border border-blue-200 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-blue-800 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{item.label}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-slate-100 text-slate-600">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick System Tools */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                onClose();
                onOpenBackup();
              }}
              className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4 text-blue-800" />
              <span>Instant Database Snapshot Backup</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Switch User / Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
