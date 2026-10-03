import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { AttendantSurface } from './components/AttendantSurface';
import { ManagerSurface } from './components/ManagerSurface';
import { OwnerSurface } from './components/OwnerSurface';
import { AccountantSurface } from './components/AccountantSurface';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'portal'>('landing');
  const [currentRole, setCurrentRole] = useState<'attendant' | 'manager' | 'owner' | 'accountant'>('attendant');
  const [currentUser, setCurrentUser] = useState<string>('Raju Yadav (Forecourt Attendant 1)');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
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

          <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
            {currentRole === 'attendant' && <AttendantSurface />}
            {currentRole === 'manager' && <ManagerSurface />}
            {currentRole === 'owner' && <OwnerSurface />}
            {currentRole === 'accountant' && <AccountantSurface />}
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
    </div>
  );
};

export default App;
