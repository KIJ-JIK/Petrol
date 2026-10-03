import React, { useState } from 'react';
import { Lock, ShieldCheck, UserCheck, X, CheckCircle2, AlertCircle, Keypad } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { name: string; role: 'attendant' | 'manager' | 'owner' | 'accountant'; id: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedUser, setSelectedUser] = useState<string>('usr_attendant_1');
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const staffList = [
    { id: 'usr_attendant_1', name: 'Raju Yadav', role: 'attendant', title: 'Forecourt Attendant 1', pin: '1234' },
    { id: 'usr_attendant_2', name: 'Mohan Lal', role: 'attendant', title: 'Forecourt Attendant 2', pin: '1234' },
    { id: 'usr_manager', name: 'Ramesh Sharma', role: 'manager', title: 'Outlet Manager', pin: '4321' },
    { id: 'usr_owner', name: 'Vikram Patel', role: 'owner', title: 'Owner / Partner', pin: '9999' },
    { id: 'usr_accountant', name: 'Suresh Gupta CA', role: 'accountant', title: 'Station Accountant / CA', pin: '5678' },
  ];

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    setErrorMsg('');
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    setEnteredPin(enteredPin.slice(0, -1));
  };

  const verifyPin = (pinToTest: string) => {
    const userObj = staffList.find((s) => s.id === selectedUser);
    if (!userObj) return;

    if (userObj.pin === pinToTest) {
      onSuccess({
        id: userObj.id,
        name: `${userObj.name} (${userObj.title})`,
        role: userObj.role as any,
      });
      onClose();
    } else {
      setErrorMsg(`Incorrect PIN for ${userObj.name}. (Default test PIN is ${userObj.pin})`);
      setEnteredPin('');
    }
  };

  const currentUserObj = staffList.find((s) => s.id === selectedUser);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Forecourt Staff Sign In</h3>
              <p className="text-[11px] text-slate-500">SK Petroleum (Indian Oil), Gadhiya</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Staff selector */}
        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-slate-700 block">Select Staff Member</label>
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setEnteredPin('');
              setErrorMsg('');
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.title}
              </option>
            ))}
          </select>
        </div>

        {/* PIN display dots */}
        <div className="text-center space-y-2 py-1">
          <span className="text-[11px] text-slate-500 block">
            Enter 4-digit Forecourt Security PIN for <strong>{currentUserObj?.name}</strong>:
          </span>
          <div className="flex items-center justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  enteredPin.length > i
                    ? 'bg-blue-800 border-blue-800 scale-110'
                    : 'bg-slate-100 border-slate-300'
                }`}
              />
            ))}
          </div>
          {errorMsg && (
            <p className="text-xs text-red-600 font-medium pt-1 flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </p>
          )}
        </div>

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (key === 'DEL') handleBackspace();
                else if (key === 'CLR') setEnteredPin('');
                else handleKeyPress(key);
              }}
              className={`h-12 rounded-xl font-mono text-lg font-bold transition active:scale-95 flex items-center justify-center shadow-xs ${
                key === 'DEL' || key === 'CLR'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="pt-1 text-center">
          <span className="text-[11px] text-slate-400">
            Default PINs: Raju/Mohan (1234), Ramesh (4321), Vikram (9999), Suresh (5678)
          </span>
        </div>
      </div>
    </div>
  );
};
