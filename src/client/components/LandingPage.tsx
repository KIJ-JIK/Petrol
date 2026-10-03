import React from 'react';
import {
  Fuel,
  ShieldCheck,
  Calculator,
  ArrowRight,
  TrendingUp,
  Truck,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  MapPin,
  Lock,
  Layers,
  FileCheck2,
} from 'lucide-react';

interface LandingPageProps {
  onEnterPortal: (role?: 'attendant' | 'manager' | 'owner' | 'accountant') => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
  currentUser: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterPortal,
  onOpenAuth,
  isAuthenticated,
  currentUser,
}) => {
  const fuelRates = [
    { code: 'MS', name: 'Motor Spirit (Petrol)', price: 96.50, unit: 'Litre', tag: 'Regular' },
    { code: 'HSD', name: 'High Speed Diesel', price: 92.20, unit: 'Litre', tag: 'Commercial / Fleets' },
    { code: 'XP95', name: 'Indian Oil XP95', price: 104.50, unit: 'Litre', tag: 'Premium Performance' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-800 to-orange-500 flex items-center justify-center shadow-sm">
              <Fuel className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  SK Petroleum
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-orange-100 text-orange-700 border border-orange-200">
                  Indian Oil (IOCL)
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                Gadhiya, Gujarat • RO Code: IOC-GADHIYA-RO-01
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <button
                onClick={() => onEnterPortal()}
                className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <span>Enter Portal ({currentUser})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Staff Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-10 pb-16 px-4 lg:px-8 bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200">
        {/* Subtle geometric background curves inspired by Haikei */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg className="w-full h-full" viewBox="0 0 1440 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0,192L60,181.3C120,171,240,149,360,160C480,171,600,213,720,213.3C840,213,960,171,1080,149.3C1200,128,1320,128,1380,128L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
              fill="#e2e8f0"
            />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Forecourt Operating System • Live at Gadhiya</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
            Close Every Shift With <span className="text-blue-800">Litres</span> &{' '}
            <span className="text-orange-600">Money</span> Accounted For.
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The dedicated forecourt operations, tank inventory, and financial ledger platform for{' '}
            <strong>SK Petroleum (Indian Oil), Gadhiya</strong>. Mobile-first attendant entry, offline-tolerant sync,
            and balanced double-entry accounting.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onEnterPortal('attendant')}
              className="px-5 py-3 bg-blue-800 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-blue-900/10 flex items-center gap-2"
            >
              <Fuel className="w-4 h-4" />
              <span>Launch Attendant Forecourt</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAuth}
              className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-sm border border-slate-300 transition shadow-xs flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              <span>Manager / Owner Console</span>
            </button>
          </div>

          {/* LIVE FUEL RATE BOARD */}
          <div className="pt-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  Today's Official Fuel Prices (Gadhiya, Gujarat)
                </span>
                <span className="text-slate-400">Effective from 06:00 AM IST</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                {fuelRates.map((f) => (
                  <div
                    key={f.code}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-left hover:border-blue-300 transition"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold text-xs text-blue-900">{f.code}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-white border border-slate-200 text-slate-600">
                        {f.tag}
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
                      ₹{f.price.toFixed(2)}
                      <span className="text-xs font-normal text-slate-500"> /L</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block truncate mt-0.5">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENTO GRID OF CORE PILLARS (Inspired by ReactBits & Neuform) */}
      <section className="py-14 px-4 lg:px-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Forecourt Rigor & Financial Integrity
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Engineered to replace paper registers with immutable, auditable numbers for every nozzle and tank.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Shift Close Math */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 md:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              Nozzle Totalizer Math & Transparent Rollover
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Carries forward approved opening readings automatically. Correctly handles mechanical rollovers
              and pump calibration test litres returned to storage tanks. Every rupee is calculated in exact paise.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700">
              <span className="text-slate-400 block mb-0.5">Formula Applied:</span>
              <code>Net Litres = (Closing Totalizer - Opening Totalizer) - Testing Litres</code>
            </div>
          </div>

          {/* Card 2: Offline Tolerant */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <WifiOff className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              Offline-Tolerant Forecourt PWA
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Attendants can record closing meter readings and cash counts even during network dropouts. Transactions
              are queued with UUID idempotency keys and replay automatically upon reconnection.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Zero data loss on disconnection
            </span>
          </div>

          {/* Card 3: Tank Stock & Dip */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              Tank Dip Calibration (20KL & 25KL)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Maintains Tank 1 (Petrol MS, 20 KL) and Tank 2 (Diesel HSD, 25 KL). Interpolates physical dip rod readings
              (mm) to exact litres, reporting physical dip vs book stock variances with audit trail.
            </p>
          </div>

          {/* Card 4: Cash Reconciliation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              Denomination Cash Count & Drops
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Forecourt attendants enter notes (₹500, ₹200, ₹100, etc.) and mid-shift safe drops. Instantly reconciles
              cash against UPI QR, POS cards, and customer credit, flagging any variance beyond ₹200.
            </p>
          </div>

          {/* Card 5: Balanced Double Entry */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              Balanced Double-Entry Trial Balance
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Approved shifts automatically post balanced journal vouchers. Debits strictly equal credits across Cash,
              UPI Clearing, Customer Khata, and Fuel Sales. Corrections require an explicit audit reversal.
            </p>
          </div>
        </div>
      </section>

      {/* QUICK ROLE LAUNCH CARDS */}
      <section className="py-10 px-4 lg:px-8 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Select Your Operational Role
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">Direct Forecourt & Office Access</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {[
              {
                role: 'attendant',
                title: 'Attendant Forecourt',
                user: 'Raju Yadav',
                desc: 'Enter nozzle closing readings, count cash notes, record shift drop',
                color: 'border-blue-200 hover:border-blue-500 bg-blue-50/50',
                btnText: 'Open Forecourt',
              },
              {
                role: 'manager',
                title: 'Manager Console',
                user: 'Ramesh Sharma',
                desc: 'Approve shift closures, log tank dip mm, receive tanker deliveries',
                color: 'border-orange-200 hover:border-orange-500 bg-orange-50/50',
                btnText: 'Open Manager',
              },
              {
                role: 'owner',
                title: 'Owner Dashboard',
                user: 'Vikram Patel',
                desc: 'Track daily litres, sales revenue, cash over/short, tank stock cover',
                color: 'border-slate-200 hover:border-slate-400 bg-slate-50',
                btnText: 'Open Owner',
              },
              {
                role: 'accountant',
                title: 'Accountant Workspace',
                user: 'Suresh Gupta CA',
                desc: 'Inspect double-entry vouchers, balanced trial balance, Khata ageing',
                color: 'border-emerald-200 hover:border-emerald-500 bg-emerald-50/50',
                btnText: 'Open Accountant',
              },
            ].map((card) => (
              <div
                key={card.role}
                onClick={() => onEnterPortal(card.role as any)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${card.color}`}
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm text-slate-900">{card.title}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 block">{card.user}</span>
                  <p className="text-xs text-slate-500 leading-relaxed pt-1">{card.desc}</p>
                </div>

                <button className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-xs border border-slate-300 shadow-xs flex items-center justify-center gap-1.5 transition">
                  <span>{card.btnText}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-100 border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 mt-auto">
        <p className="font-semibold text-slate-700">
          SK Petroleum — Indian Oil Corporation Ltd (IOCL) Retail Outlet
        </p>
        <p className="mt-1">
          Gadhiya, Gujarat • RO Code: IOC-GADHIYA-RO-01 • GSTIN: 24AABCS1429B1Z1
        </p>
        <p className="mt-2 text-[11px] text-slate-400">
          Invariants: Strictly balanced double-entry accounting (paise-safe), append-only stock ledger, offline-tolerant PWA.
        </p>
      </footer>
    </div>
  );
};
