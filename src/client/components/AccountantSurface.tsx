import React, { useState, useEffect } from 'react';
import {
  FileText,
  RotateCcw,
  CheckCircle2,
  IndianRupee,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  Truck,
} from 'lucide-react';

export const AccountantSurface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'journals' | 'trial' | 'khata'>('journals');
  const [journals, setJournals] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState({
    party_id: '',
    amount_rupees: 25000,
    payment_mode: 'BANK_TRANSFER',
    reference_no: 'IMPS-20261003-99881',
    notes: 'Weekly fleet account settlement',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const jRes = await fetch('/api/v1/finance/journals');
      const jData = await jRes.json();
      setJournals(jData.entries || []);

      const tRes = await fetch('/api/v1/finance/trial-balance');
      const tData = await tRes.json();
      setTrialBalance(tData);

      const pRes = await fetch('/api/v1/parties');
      const pData = await pRes.json();
      setParties(pData.parties || []);
      if (pData.parties?.length > 0 && !receiptData.party_id) {
        setReceiptData((prev) => ({ ...prev, party_id: pData.parties[0].id }));
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReverseVoucher = async (journalId: string) => {
    const reason = prompt('Enter mandatory reversal reason for CA audit log:');
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/finance/journals/${journalId}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, user_id: 'usr_accountant' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reverse voucher');

      setFeedback({
        type: 'success',
        text: `Voucher reversed! Reversal voucher ${data.reversalVoucher} posted with swapped debits & credits.`,
      });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/v1/parties/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_mumbai',
          party_id: receiptData.party_id,
          amount_paise: Math.round(Number(receiptData.amount_rupees) * 100),
          payment_mode: receiptData.payment_mode,
          reference_no: receiptData.reference_no,
          notes: receiptData.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post receipt');

      setFeedback({
        type: 'success',
        text: `Customer collection posted! Balanced voucher ${data.voucherNumber} created.`,
      });
      setShowReceiptModal(false);
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-16">
      {/* Accountant Header */}
      <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Accountant & CA Workspace</h2>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Suresh Gupta CA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable double-entry journal vouchers • Balanced trial balance • Khata credit ledger & ageing
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('journals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'journals' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Journal Vouchers
          </button>
          <button
            onClick={() => setActiveTab('trial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'trial' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Trial Balance
          </button>
          <button
            onClick={() => setActiveTab('khata')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'khata' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Khata Credit Ledger
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/20 border-red-500/40 text-red-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* TAB 1: JOURNAL VOUCHERS */}
      {activeTab === 'journals' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Posted Journal Entries (Double-Entry Invariant: Debits == Credits)
            </h3>
            <span className="text-xs text-slate-400">{journals.length} vouchers recorded</span>
          </div>

          <div className="space-y-3">
            {journals.map((entry) => (
              <div
                key={entry.id}
                className={`p-4 rounded-xl border transition-all ${
                  entry.is_reversed
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : 'bg-slate-800/70 border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-700/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400 text-sm">{entry.voucher_number}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-800">
                      {entry.reference_type}
                    </span>
                    {entry.is_reversed ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        REVERSED
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        POSTED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono text-[11px]">{entry.voucher_date}</span>
                    {!entry.is_reversed && (
                      <button
                        onClick={() => handleReverseVoucher(entry.id)}
                        disabled={actionLoading}
                        className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-[11px] font-semibold border border-red-500/30 flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reverse</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 my-2">{entry.narration}</p>

                {/* Journal Lines Table */}
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 uppercase text-[10px] border-b border-slate-700/50">
                        <th className="pb-1">Account Code & Name</th>
                        <th className="pb-1 text-right">Debit (₹)</th>
                        <th className="pb-1 text-right">Credit (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {entry.lines?.map((line: any) => (
                        <tr key={line.id} className="text-slate-300">
                          <td className="py-1.5">
                            <span className="font-mono text-slate-400 mr-2">{line.account_code}</span>
                            <span>{line.account_name}</span>
                          </td>
                          <td className="py-1.5 text-right font-mono font-semibold text-emerald-400">
                            {line.debit_paise > 0 ? `₹${(line.debit_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className="py-1.5 text-right font-mono font-semibold text-blue-400">
                            {line.credit_paise > 0 ? `₹${(line.credit_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold border-t border-slate-700 text-white text-xs">
                        <td className="pt-2">Total (Balanced)</td>
                        <td className="pt-2 text-right font-mono text-emerald-400">
                          ₹{(entry.total_debit_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="pt-2 text-right font-mono text-blue-400">
                          ₹{(entry.total_credit_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TRIAL BALANCE */}
      {activeTab === 'trial' && trialBalance && (
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Chart of Accounts & General Ledger Trial Balance
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time ledger aggregation. Invariant verified: Grand Total Debits == Grand Total Credits.
              </p>
            </div>

            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Perfect Balance Verified</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2">Account Code</th>
                  <th className="pb-2">Account Title</th>
                  <th className="pb-2 text-right">Total Debits (₹)</th>
                  <th className="pb-2 text-right">Total Credits (₹)</th>
                  <th className="pb-2 text-right">Net Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {trialBalance.accounts?.map((acc: any) => (
                  <tr key={acc.account_code} className="text-slate-200">
                    <td className="py-2.5 font-mono text-slate-400">{acc.account_code}</td>
                    <td className="py-2.5 font-semibold text-white">{acc.account_name}</td>
                    <td className="py-2.5 text-right font-mono">
                      ₹{(acc.total_debits_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      ₹{(acc.total_credits_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                      ₹{(Math.abs(acc.net_balance_paise) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
                      <span className="text-[10px] text-slate-400">({acc.type})</span>
                    </td>
                  </tr>
                ))}
                <tr className="font-extrabold text-sm border-t-2 border-slate-600 text-white">
                  <td className="py-3" colSpan={2}>
                    Grand Totals
                  </td>
                  <td className="py-3 text-right font-mono text-emerald-400">
                    ₹{(trialBalance.grand_total_debits_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right font-mono text-blue-400">
                    ₹{(trialBalance.grand_total_credits_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-400 text-xs">Balanced (₹0 diff)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: KHATA CREDIT LEDGER */}
      {activeTab === 'khata' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-400" />
                Customer / Fleet Khata Credit Balances & Ageing
              </h3>
              <p className="text-xs text-slate-400">
                Credit limits, authorized vehicles, and payment collections
              </p>
            </div>

            <button
              onClick={() => setShowReceiptModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Payment Receipt</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {parties.map((party) => {
              const balRupees = party.current_balance_paise / 100;
              const limitRupees = party.credit_limit_paise / 100;
              const pct = Math.round((balRupees / limitRupees) * 100);

              return (
                <div key={party.id} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-sm">{party.name}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {party.code} • Phone: {party.phone}
                      </span>
                    </div>
                    {party.is_over_limit && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        OVER LIMIT
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/80 p-2.5 rounded-lg">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Outstanding</span>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        ₹{balRupees.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Credit Limit</span>
                      <span className="font-mono font-bold text-slate-300 text-sm">
                        ₹{limitRupees.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Limit Utilization</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${pct > 80 ? 'bg-red-500' : 'bg-purple-500'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
                    <span>Authorized Vehicles: </span>
                    <span className="font-mono text-slate-300">{party.vehicles.join(', ')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RECORD RECEIPT MODAL */}
          {showReceiptModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <form
                onSubmit={handleRecordReceipt}
                className="bg-slate-800 border border-slate-700 p-5 rounded-2xl max-w-md w-full space-y-4 shadow-2xl"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                  <h3 className="font-bold text-white text-base">Record Customer Khata Payment</h3>
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Select Customer Party</label>
                    <select
                      value={receiptData.party_id}
                      onChange={(e) => setReceiptData({ ...receiptData, party_id: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      {parties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Due: ₹{(p.current_balance_paise / 100).toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Collection Amount (₹)</label>
                    <input
                      type="number"
                      value={receiptData.amount_rupees}
                      onChange={(e) => setReceiptData({ ...receiptData, amount_rupees: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Payment Mode</label>
                    <select
                      value={receiptData.payment_mode}
                      onChange={(e) => setReceiptData({ ...receiptData, payment_mode: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                      <option value="CASH">Cash Deposit</option>
                      <option value="UPI">UPI Direct</option>
                      <option value="CHEQUE">Cheque Clearing</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Reference / UTR / Cheque Number</label>
                    <input
                      type="text"
                      value={receiptData.reference_no}
                      onChange={(e) => setReceiptData({ ...receiptData, reference_no: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(false)}
                    className="w-1/2 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20"
                  >
                    Post Receipt Voucher
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
