import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  IndianRupee,
  PlusCircle,
  TrendingUp,
  FileCheck,
  Building,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Landmark,
  ArrowRightLeft,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface JournalLine {
  id: string;
  account_code: string;
  account_name: string;
  debit_paise: number;
  credit_paise: number;
}

interface Voucher {
  id: string;
  voucher_number: string;
  voucher_date: string;
  reference_type: string;
  narration: string;
  total_debit_paise: number;
  total_credit_paise: number;
  is_reversed: number;
  lines: JournalLine[];
}

interface ProfitLossData {
  revenue: { account_code: string; account_name: string; amount_paise: number }[];
  expenses: { account_code: string; account_name: string; amount_paise: number }[];
  total_revenue_paise: number;
  total_expenses_paise: number;
  net_profit_paise: number;
  margin_percentage: string;
}

interface CashFlowAccount {
  code: string;
  name: string;
  balance_paise: number;
  total_inflow_paise: number;
  total_outflow_paise: number;
}

export const AccountingVouchers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'create' | 'pnl' | 'cashflow'>('vouchers');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [expandedVoucherId, setExpandedVoucherId] = useState<string | null>(null);
  const [pnl, setPnl] = useState<ProfitLossData | null>(null);
  const [cashflow, setCashflow] = useState<{ accounts: CashFlowAccount[]; total_liquidity_paise: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // New Payment Voucher form
  const [pvVendor, setPvVendor] = useState('');
  const [pvCategory, setPvCategory] = useState('Station Maintenance');
  const [pvAmount, setPvAmount] = useState('');
  const [pvPaidFrom, setPvPaidFrom] = useState<'CASH' | 'BANK'>('CASH');
  const [pvNarration, setPvNarration] = useState('');

  // New Banking / Contra Voucher form
  const [cvType, setCvType] = useState<'CASH_DEPOSIT' | 'BANK_WITHDRAWAL' | 'UPI_CLEARING_SETTLEMENT' | 'CARD_SETTLEMENT'>('CASH_DEPOSIT');
  const [cvBank, setCvBank] = useState('SBI IOCL Current Account (Gadhiya)');
  const [cvAmount, setCvAmount] = useState('');
  const [cvRef, setCvRef] = useState('');
  const [cvNarration, setCvNarration] = useState('');

  // New Adjustment Voucher form
  const [adjDebitCode, setAdjDebitCode] = useState('5010');
  const [adjCreditCode, setAdjCreditCode] = useState('1010');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [vouchersRes, pnlRes, cashflowRes] = await Promise.all([
        fetch('/api/v1/vouchers'),
        fetch('/api/v1/vouchers/profit-loss'),
        fetch('/api/v1/vouchers/cash-flow'),
      ]);

      if (vouchersRes.ok) {
        const data = await vouchersRes.json();
        setVouchers(data.vouchers || []);
      }
      if (pnlRes.ok) {
        const data = await pnlRes.json();
        setPnl(data);
      }
      if (cashflowRes.ok) {
        const data = await cashflowRes.json();
        setCashflow(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pvVendor || !pvAmount) return;

    try {
      const res = await fetch('/api/v1/vouchers/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_gadhiya',
          vendor_name: pvVendor,
          expense_category: pvCategory,
          amount_paise: Math.round(Number(pvAmount) * 100),
          paid_from: pvPaidFrom,
          narration: pvNarration,
        }),
      });

      if (res.ok) {
        setPvVendor('');
        setPvAmount('');
        setPvNarration('');
        loadData();
        setActiveTab('vouchers');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateContra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvAmount) return;

    try {
      const res = await fetch('/api/v1/vouchers/contra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_gadhiya',
          transaction_type: cvType,
          bank_name: cvBank,
          amount_paise: Math.round(Number(cvAmount) * 100),
          reference_no: cvRef,
          narration: cvNarration,
        }),
      });

      if (res.ok) {
        setCvAmount('');
        setCvRef('');
        setCvNarration('');
        loadData();
        setActiveTab('vouchers');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjAmount || !adjReason) return;

    try {
      const res = await fetch('/api/v1/vouchers/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_gadhiya',
          debit_account_code: adjDebitCode,
          credit_account_code: adjCreditCode,
          amount_paise: Math.round(Number(adjAmount) * 100),
          reason: adjReason,
        }),
      });

      if (res.ok) {
        setAdjAmount('');
        setAdjReason('');
        loadData();
        setActiveTab('vouchers');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (selectedType === 'ALL') return true;
    return v.reference_type === selectedType;
  });

  const totalVoucherVolume = vouchers.reduce((acc, v) => acc + v.total_debit_paise, 0) / 100;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-800 border border-orange-200">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              6-Voucher Accounting Suite & P&L Engine
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Complete forecourt double-entry vouchers: Shift Sales, Fuel Purchase, Receipts, Payments, Contra Banking, and Adjustments.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('create')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Voucher</span>
        </button>
      </div>

      {/* Quick Accounting KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Vouchers Posted</span>
            <FileCheck className="w-4 h-4 text-blue-700" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{vouchers.length}</div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">100% Balanced</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Turnover (DR)</span>
            <IndianRupee className="w-4 h-4 text-orange-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ₹{totalVoucherVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">Debits = Credits Equality</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Forecourt Liquidity</span>
            <Landmark className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            ₹{(((cashflow?.total_liquidity_paise || 0) / 100)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">Cash + Bank + Digital Clearing</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Operating Margin</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {pnl?.margin_percentage || '0.00'}%
          </div>
          <span className="text-[11px] text-indigo-700 font-semibold mt-1 inline-block">Live Trading Margin</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'vouchers'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All 6 Voucher Types
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'create'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Post New Voucher
        </button>
        <button
          onClick={() => setActiveTab('pnl')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'pnl'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Trading & Profit / Loss
        </button>
        <button
          onClick={() => setActiveTab('cashflow')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'cashflow'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Cash Flow & Bank Balances
        </button>
      </div>

      {/* Tab 1: All 6 Voucher Types */}
      {activeTab === 'vouchers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Filter Voucher Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden"
              >
                <option value="ALL">All 6 Types ({vouchers.length})</option>
                <option value="SHIFT_CLOSE">Shift Sales (JV-SALES)</option>
                <option value="DELIVERY">Purchase (JV-PURCHASE)</option>
                <option value="CREDIT_RECEIPT">Receipts (CR-RECEIPT)</option>
                <option value="EXPENSE">Payments (PV-PAYMENT)</option>
                <option value="CONTRA_BANKING">Contra & Banking (CV-BANKING)</option>
                <option value="ADJUSTMENT">Adjustments (JV-ADJUSTMENT)</option>
              </select>
            </div>

            <span className="text-xs text-slate-500 font-semibold">
              Click any voucher to expand double-entry journal lines
            </span>
          </div>

          <div className="space-y-3">
            {filteredVouchers.map((v) => {
              const isExpanded = expandedVoucherId === v.id;
              const typeBadge =
                v.reference_type === 'SHIFT_CLOSE'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : v.reference_type === 'DELIVERY'
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : v.reference_type === 'CREDIT_RECEIPT'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : v.reference_type === 'EXPENSE'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : v.reference_type === 'CONTRA_BANKING'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-800 border-slate-200';

              return (
                <div
                  key={v.id}
                  className="border border-slate-200 rounded-xl overflow-hidden transition shadow-xs hover:border-slate-300"
                >
                  <div
                    onClick={() => setExpandedVoucherId(isExpanded ? null : v.id)}
                    className="p-4 bg-slate-50/60 hover:bg-slate-100/60 flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">{v.voucher_number}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${typeBadge}`}>
                            {v.reference_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{v.narration}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">
                        ₹{(v.total_debit_paise / 100).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold">{v.voucher_date}</div>
                    </div>
                  </div>

                  {/* Expanded Journal Lines */}
                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-slate-200">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                        Double-Entry Journal Lines (Equal Debits & Credits)
                      </h4>
                      <table className="w-full text-xs text-slate-700">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                            <th className="py-2 px-3 text-left">Code</th>
                            <th className="py-2 px-3 text-left">Account Ledger</th>
                            <th className="py-2 px-3 text-right">Debit (₹)</th>
                            <th className="py-2 px-3 text-right">Credit (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {v.lines.map((l) => (
                            <tr key={l.id}>
                              <td className="py-2 px-3 font-mono font-bold text-slate-600">{l.account_code}</td>
                              <td className="py-2 px-3 font-medium text-slate-900">{l.account_name}</td>
                              <td className="py-2 px-3 text-right font-semibold">
                                {l.debit_paise > 0 ? `₹${(l.debit_paise / 100).toLocaleString('en-IN')}` : '—'}
                              </td>
                              <td className="py-2 px-3 text-right font-semibold">
                                {l.credit_paise > 0 ? `₹${(l.credit_paise / 100).toLocaleString('en-IN')}` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-300 font-black text-slate-900 bg-slate-50">
                            <td colSpan={2} className="py-2 px-3">Total Balance Check</td>
                            <td className="py-2 px-3 text-right">₹{(v.total_debit_paise / 100).toLocaleString('en-IN')}</td>
                            <td className="py-2 px-3 text-right">₹{(v.total_credit_paise / 100).toLocaleString('en-IN')}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Create Voucher */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Payment Voucher Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                Voucher 4
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Payment Voucher (PV)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Forecourt expenses, utility tariffs, vendor payouts.</p>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payee / Vendor Name</label>
                <input
                  type="text"
                  required
                  value={pvVendor}
                  onChange={(e) => setPvVendor(e.target.value)}
                  placeholder="e.g. GETCO Electricity Board"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={pvCategory}
                  onChange={(e) => setPvCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="Electricity">Station Electricity & Power</option>
                  <option value="Station Maintenance">Dispenser & Forecourt Maintenance</option>
                  <option value="Staff Advance">Staff Cash Advance</option>
                  <option value="General Admin">Office & Station Consumables</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={pvAmount}
                    onChange={(e) => setPvAmount(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Paid From</label>
                  <select
                    value={pvPaidFrom}
                    onChange={(e) => setPvPaidFrom(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  >
                    <option value="CASH">Forecourt Cash</option>
                    <option value="BANK">Current Bank Account</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Narration / Bill Details</label>
                <input
                  type="text"
                  value={pvNarration}
                  onChange={(e) => setPvNarration(e.target.value)}
                  placeholder="Monthly bill payment"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer mt-2"
              >
                Post Payment Voucher
              </button>
            </form>
          </div>

          {/* Contra & Banking Voucher Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                Voucher 5
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Contra & Banking (CV)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Cash deposit to bank, UPI settlements, card batch.</p>
            </div>

            <form onSubmit={handleCreateContra} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Type</label>
                <select
                  value={cvType}
                  onChange={(e) => setCvType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="CASH_DEPOSIT">Cash Deposit to Bank</option>
                  <option value="UPI_CLEARING_SETTLEMENT">UPI QR Settlement to Bank</option>
                  <option value="CARD_SETTLEMENT">POS Card Batch Settlement</option>
                  <option value="BANK_WITHDRAWAL">Cash Withdrawal from Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Bank Account</label>
                <input
                  type="text"
                  value={cvBank}
                  onChange={(e) => setCvBank(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={cvAmount}
                    onChange={(e) => setCvAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Slip / UTR #</label>
                  <input
                    type="text"
                    value={cvRef}
                    onChange={(e) => setCvRef(e.target.value)}
                    placeholder="DEP-10293"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Narration</label>
                <input
                  type="text"
                  value={cvNarration}
                  onChange={(e) => setCvNarration(e.target.value)}
                  placeholder="Daily cash collection deposit"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer mt-2"
              >
                Post Contra Voucher
              </button>
            </form>
          </div>

          {/* Adjustment Voucher Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-800 border border-slate-300">
                Voucher 6
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Adjustment Note (JV)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manual ledger debit / credit balancing notes.</p>
            </div>

            <form onSubmit={handleCreateAdjustment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Debit Account Code</label>
                  <input
                    type="text"
                    required
                    value={adjDebitCode}
                    onChange={(e) => setAdjDebitCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credit Account Code</label>
                  <input
                    type="text"
                    required
                    value={adjCreditCode}
                    onChange={(e) => setAdjCreditCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  placeholder="1000"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Reason</label>
                <input
                  type="text"
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Forecourt calibration test fuel adjustment"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer mt-4"
              >
                Post Adjustment Note
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Profit & Loss Statement */}
      {activeTab === 'pnl' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Trading and Profit & Loss Statement</h3>
              <p className="text-xs text-slate-500 mt-0.5">SK Petroleum (Indian Oil), Gadhiya • Current Period</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-500">Net Operating Margin</span>
              <div className="text-2xl font-black text-emerald-700">{pnl?.margin_percentage || '0.00'}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Side */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Revenue (Inflows)</span>
                <span>Code (4000)</span>
              </h4>
              <div className="space-y-2">
                {pnl?.revenue && pnl.revenue.length > 0 ? (
                  pnl.revenue.map((r) => (
                    <div key={r.account_code} className="flex justify-between text-xs py-1.5 border-b border-slate-50">
                      <div>
                        <span className="font-mono text-slate-400 mr-2">{r.account_code}</span>
                        <span className="font-semibold text-slate-800">{r.account_name}</span>
                      </div>
                      <span className="font-bold text-slate-900">₹{(r.amount_paise / 100).toLocaleString('en-IN')}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3">No revenue items posted yet.</p>
                )}
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-xs text-slate-900">
                <span>Total Gross Revenue</span>
                <span>₹{(((pnl?.total_revenue_paise || 0) / 100)).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Expense Side */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-800 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Expenses & Overheads</span>
                <span>Code (5000)</span>
              </h4>
              <div className="space-y-2">
                {pnl?.expenses && pnl.expenses.length > 0 ? (
                  pnl.expenses.map((e) => (
                    <div key={e.account_code} className="flex justify-between text-xs py-1.5 border-b border-slate-50">
                      <div>
                        <span className="font-mono text-slate-400 mr-2">{e.account_code}</span>
                        <span className="font-semibold text-slate-800">{e.account_name}</span>
                      </div>
                      <span className="font-bold text-rose-700">₹{(e.amount_paise / 100).toLocaleString('en-IN')}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3">No expense items recorded.</p>
                )}
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-xs text-slate-900">
                <span>Total Forecourt Expenses</span>
                <span className="text-rose-700">₹{(((pnl?.total_expenses_paise || 0) / 100)).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <span className="text-sm font-black text-emerald-950">Net Forecourt Profit</span>
            <span className="text-xl font-black text-emerald-800">
              ₹{(((pnl?.net_profit_paise || 0) / 100)).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Tab 4: Cash Flow & Liquidity */}
      {activeTab === 'cashflow' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Forecourt Cash Flow & Liquid Assets</h3>
              <p className="text-xs text-slate-500 mt-0.5">Physical cash, bank accounts, and digital gateway clearing</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-500">Total Liquid Funds</span>
              <div className="text-2xl font-black text-emerald-700">
                ₹{(((cashflow?.total_liquidity_paise || 0) / 100)).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cashflow?.accounts.map((acc) => (
              <div key={acc.code} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">Acc #{acc.code}</span>
                  <span className="text-xs font-black text-slate-900">
                    ₹{(acc.balance_paise / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{acc.name}</h4>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Inflows</span>
                    <span className="font-semibold text-emerald-700">₹{(acc.total_inflow_paise / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Outflows</span>
                    <span className="font-semibold text-rose-700">₹{(acc.total_outflow_paise / 100).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
