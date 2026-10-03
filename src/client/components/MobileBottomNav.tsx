import React from 'react';
import { Fuel, Users, Receipt, FlaskConical, MoreHorizontal } from 'lucide-react';

export type AppModule =
  | 'forecourt'
  | 'customer'
  | 'accounting'
  | 'reports'
  | 'payroll'
  | 'billing'
  | 'reconciliation'
  | 'quality'
  | 'masters'
  | 'communications';

interface MobileBottomNavProps {
  activeModule: AppModule;
  onSelectModule: (module: AppModule) => void;
  onOpenMore: () => void;
  isMoreOpen: boolean;
  syncState?: 'ONLINE_SYNCED' | 'OFFLINE_QUEUED' | 'SYNCING' | 'CONFLICT';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeModule,
  onSelectModule,
  onOpenMore,
  isMoreOpen,
  syncState,
}) => {
  const isSecondaryActive = [
    'accounting',
    'reports',
    'payroll',
    'reconciliation',
    'masters',
    'communications',
  ].includes(activeModule);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 shadow-lg pb-[calc(env(safe-area-inset-bottom,0px)+4px)]">
      <div className="grid grid-cols-5 items-center gap-1">
        {/* 1. Forecourt Shift */}
        <button
          onClick={() => onSelectModule('forecourt')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition cursor-pointer relative ${
            activeModule === 'forecourt' && !isMoreOpen
              ? 'text-blue-900 font-extrabold bg-blue-50/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Fuel className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Shift</span>
        </button>

        {/* 2. Customer Khata */}
        <button
          onClick={() => onSelectModule('customer')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition cursor-pointer ${
            activeModule === 'customer' && !isMoreOpen
              ? 'text-blue-900 font-extrabold bg-blue-50/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Khata</span>
        </button>

        {/* 3. Periodic Billing & Counter POS */}
        <button
          onClick={() => onSelectModule('billing')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition cursor-pointer ${
            activeModule === 'billing' && !isMoreOpen
              ? 'text-blue-900 font-extrabold bg-blue-50/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Billing</span>
        </button>

        {/* 4. Quality & Density */}
        <button
          onClick={() => onSelectModule('quality')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition cursor-pointer ${
            activeModule === 'quality' && !isMoreOpen
              ? 'text-blue-900 font-extrabold bg-blue-50/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FlaskConical className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Quality</span>
        </button>

        {/* 5. More Menu Drawer */}
        <button
          onClick={onOpenMore}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition cursor-pointer relative ${
            isMoreOpen || (isSecondaryActive && !['forecourt', 'customer', 'billing', 'quality'].includes(activeModule))
              ? 'text-orange-600 font-extrabold bg-orange-50/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <MoreHorizontal className="w-5 h-5" />
            {syncState === 'OFFLINE_QUEUED' && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-1 ring-white" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
};
