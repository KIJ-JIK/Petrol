import React, { useState } from 'react';
import { Header } from './components/Header';
import { AttendantSurface } from './components/AttendantSurface';
import { ManagerSurface } from './components/ManagerSurface';
import { OwnerSurface } from './components/OwnerSurface';
import { AccountantSurface } from './components/AccountantSurface';

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<'attendant' | 'manager' | 'owner' | 'accountant'>('attendant');

  const userMap = {
    attendant: 'Raju Yadav (Attendant)',
    manager: 'Ramesh Sharma (Manager)',
    owner: 'Vikram Patel (Owner/Dealer)',
    accountant: 'Suresh Gupta CA (Accountant)',
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentUser={userMap[currentRole]}
      />

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {currentRole === 'attendant' && <AttendantSurface />}
        {currentRole === 'manager' && <ManagerSurface />}
        {currentRole === 'owner' && <OwnerSurface />}
        {currentRole === 'accountant' && <AccountantSurface />}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-3 px-4 text-center text-xs text-slate-500">
        <p>
          Petrol Pump Operating & Finance Platform • SK Petroleum (Indian Oil), Gadhiya • Invariants: Double-entry balanced, paise-safe integer money, offline-tolerant sync.
        </p>
      </footer>
    </div>
  );
};

export default App;
