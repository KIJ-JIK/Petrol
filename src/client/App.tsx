import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { AttendantSurface } from './components/AttendantSurface';
import { ManagerSurface } from './components/ManagerSurface';
import { OwnerSurface } from './components/OwnerSurface';
import { AccountantSurface } from './components/AccountantSurface';
import { CustomerPanel } from './components/CustomerPanel';
import { AccountingVouchers } from './components/AccountingVouchers';
import { ReportHub } from './components/ReportHub';
import { StaffPayroll } from './components/StaffPayroll';
import { DataBackupModal } from './components/DataBackupModal';
import { PeriodicBilling } from './components/PeriodicBilling';
import { BankReconciliation } from './components/BankReconciliation';
import { OperationalQuality } from './components/OperationalQuality';
import { MasterSettings } from './components/MasterSettings';
import { CommunicationCenter } from './components/CommunicationCenter';
import {
  Fuel,
  Users,
  BookOpen,
  FileText,
  Clock,
  Database,
  Shield,
  Receipt,
  Landmark,
  FlaskConical,
  Sliders,
  MessageSquare,
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'portal'>('landing');
  const [currentRole, setCurrentRole] = useState<'attendant' | 'manager' | 'owner' | 'accountant'>('attendant');
  const [currentUser, setCurrentUser] = useState<string>('Raju Yadav (Forecourt Attendant 1)');
  const [activeModule, setActiveModule] = useState<
    'forecourt' | 'customer' | 'accounting' | 'reports' | 'payroll' | 'billing' | 'reconciliation' | 'quality' | 'masters' | 'communications'
  >('forecourt');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Quick role names map
  const roleDefaultUsers: { [key: string]: string } = {
    attendant: 'Raju Yadav (Forecourt Attendant 1)',
    manager: 'Ramesh Sharma (Outlet Manager)',
    owner: 'Vikram Patel (Owner / Partner)',
    accountant: 'Suresh Gupta CA (Station Accountant)',
  };

  const handleEnterPortal = (role?: 'attendant' | 'manager' | 'owner' | 'accountant') => {
    if (role) {
      setCurrentRole(role);
      setCurrentUser(roleDefaultUsers[role] || 'Staff Member');
    }
    setCurrentView('portal');
  };

  const handleRoleChange = (role: 'attendant' | 'manager' | 'owner' | 'accountant') => {
    setCurrentRole(role);
    setCurrentUser(roleDefaultUsers[role] || 'Staff Member');
  };

  const handleAuthSuccess = (user: { name: string; role: 'attendant' | 'manager' | 'owner' | 'accountant'; id: string }) => {
    setCurrentUser(user.name);
    setCurrentRole(user.role);
    setIsAuthenticated(true);
    setCurrentView('portal');
  };

  const handleSignOut = () => {
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {currentView === 'landing' ? (
        <LandingPage
          onEnterPortal={handleEnterPortal}
          onOpenAuth={() => setIsAuthOpen(true)}
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
        />
      ) : (
        <>
          <Header
            currentRole={currentRole}
            onRoleChange={handleRoleChange}
            currentUser={currentUser}
            onGoToLanding={() => setCurrentView('landing')}
            onSignOut={handleSignOut}
          />

          {/* Module Navigation Bar in Light Theme */}
          <div className="bg-white border-b border-slate-200 px-4 py-2 sticky top-[65px] z-30 shadow-2xs">
            <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setActiveModule('forecourt')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    activeModule === 'forecourt'
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Fuel className="w-4 h-4" />
                  <span>Forecourt Shift & Pumps</span>
                </button>

                <button
                  onClick={() => setActiveModule('customer')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    activeModule === 'customer'
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Customer Panel (Khata)</span>
                </button>

                <button
                  onClick={() => setActiveModule('accounting')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    activeModule === 'accounting'
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>6-Voucher Hub & P&L</span>
                </button>

                <button
                  onClick={() => setActiveModule('reports')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    activeModule === 'reports'
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Reports Hub (40+)</span>
                </button>

                <button
                  onClick={() => setActiveModule('payroll')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    activeModule === 'payroll'
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Staff & Payroll</span>
                </button>

                <button
                  onClick={() => setActiveModule('billing')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    activeModule === 'billing'
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Periodic Billing & POS</span>
                </button>

                <button
                  onClick={() => setActiveModule('reconciliation')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    activeModule === 'reconciliation'
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  <span>Bank Reconciliation</span>
                </button>

                <button
                  onClick={() => setActiveModule('quality')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    activeModule === 'quality'
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>Quality & Density</span>
                </button>

                <button
                  onClick={() => setActiveModule('masters')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    activeModule === 'masters'
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Master Settings</span>
                </button>

                <button
                  onClick={() => setActiveModule('communications')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    activeModule === 'communications'
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Communications</span>
                </button>
              </div>

              {/* Instant Backup Button */}
              <button
                onClick={() => setIsBackupOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                <Database className="w-3.5 h-3.5 text-blue-700" />
                <span>Instant Backup</span>
              </button>
            </div>
          </div>

          <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
            {activeModule === 'forecourt' && (
              <>
                {currentRole === 'attendant' && <AttendantSurface />}
                {currentRole === 'manager' && <ManagerSurface />}
                {currentRole === 'owner' && <OwnerSurface />}
                {currentRole === 'accountant' && <AccountantSurface />}
              </>
            )}

            {activeModule === 'customer' && <CustomerPanel />}
            {activeModule === 'accounting' && <AccountingVouchers />}
            {activeModule === 'reports' && <ReportHub />}
            {activeModule === 'payroll' && <StaffPayroll />}
            {activeModule === 'billing' && <PeriodicBilling />}
            {activeModule === 'reconciliation' && <BankReconciliation />}
            {activeModule === 'quality' && <OperationalQuality />}
            {activeModule === 'masters' && <MasterSettings />}
            {activeModule === 'communications' && <CommunicationCenter />}
          </main>

          <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500 mt-auto shadow-xs">
            <p className="font-semibold text-slate-700">
              SK Petroleum — Indian Oil Corporation Ltd (IOCL) Retail Outlet
            </p>
            <p className="mt-0.5">
              Gadhiya, Gujarat • RO Code: IOC-GADHIYA-RO-01 • Invariants: Double-entry balanced, paise-safe integer money, offline-tolerant PWA.
            </p>
          </footer>
        </>
      )}

      {/* Staff Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Instant Database Backup Modal */}
      <DataBackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />
    </div>
  );
};

export default App;
