import React, { useState, useEffect } from 'react';
import {
  Landmark,
  CheckCircle,
  Clock,
  ArrowRightLeft,
  FileCheck,
  Search,
  Upload,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';

interface BankLine {
  id: string;
  bank_name: string;
  transaction_date: string;
  description: string;
  reference_no: string;
  credit_paise: number;
  debit_paise: number;
  match_status: string;
  matched_entity_type: string;
  notes: string;
}

export const BankReconciliation: React.FC = () => {
  const [lines, setLines] = useState<BankLine[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Match Modal
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState<BankLine | null>(null);
  const [matchType, setMatchType] = useState('CASH_DEPOSIT');
  const [matchNotes, setMatchNotes] = useState('');

  // Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importDesc, setImportDesc] = useState('');
  const [importAmount, setImportAmount] = useState('');
  const [importRef, setImportRef] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/reconciliation/statement');
      if (res.ok) {
        const data = await res.json();
        setLines(data.lines || []);
        setStats(data.stats || null);
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

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLine) return;

    try {
      const res = await fetch('/api/v1/reconciliation/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement_line_id: selectedLine.id,
          matched_entity_type: matchType,
          notes: matchNotes,
        }),
      });

      if (res.ok) {
        setShowMatchModal(false);
        setSelectedLine(null);
        setMatchNotes('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importDesc || !importAmount) return;

    try {
      const res = await fetch('/api/v1/reconciliation/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_name: 'SBI IOCL Current Account (Gadhiya)',
          transactions: [
            {
              description: importDesc,
              reference_no: importRef,
              credit_paise: Math.round(Number(importAmount) * 100),
            },
          ],
        }),
      });

      if (res.ok) {
        setShowImportModal(false);
        setImportDesc('');
        setImportAmount('');
        setImportRef('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-200">
              <Landmark className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Bank Statement Reconciliation Engine (P1)
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Match bank credit lines with forecourt cash deposits, UPI settlements, and POS card batches without modifying shift records.
          </p>
        </div>

        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer self-start md:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Import Statement Entry</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Reconciled / Matched</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{stats?.matched_count || 0}</div>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">Direct Forecourt Ledger Link</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{stats?.unmatched_count || 0}</div>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">Awaiting clearance matching</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Bank Inflows</span>
            <IndianRupee className="w-4 h-4 text-blue-800" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ₹{(((stats?.total_credits_paise || 0) / 100)).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">SBI IOCL Current Account</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">SBI Current Account Statement Entries</h3>
          <span className="text-xs text-slate-500 font-semibold">{lines.length} statement records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Bank Account</th>
                <th className="py-3 px-4">Description / Narration</th>
                <th className="py-3 px-4">UTR / Cheque Ref</th>
                <th className="py-3 px-4 text-right">Credit Amount (₹)</th>
                <th className="py-3 px-4">Match Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{l.transaction_date}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{l.bank_name}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{l.description}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{l.reference_no || '—'}</td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    ₹{(l.credit_paise / 100).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4">
                    {l.match_status === 'MATCHED' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        MATCHED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                        UNMATCHED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {l.match_status !== 'MATCHED' && (
                      <button
                        onClick={() => {
                          setSelectedLine(l);
                          setShowMatchModal(true);
                        }}
                        className="px-2.5 py-1 bg-blue-800 text-white text-[11px] font-bold rounded-lg hover:bg-blue-900 transition cursor-pointer"
                      >
                        Reconcile
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Modal */}
      {showMatchModal && selectedLine && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Reconcile Bank Credit Entry</h3>
            <p className="text-xs text-slate-500 mb-4">
              Match ₹{(selectedLine.credit_paise / 100).toLocaleString('en-IN')} with forecourt settlement.
            </p>

            <form onSubmit={handleMatch} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Forecourt Source Type</label>
                <select
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="CASH_DEPOSIT">Forecourt Cash Deposit to Bank</option>
                  <option value="UPI_SETTLEMENT">UPI QR Settlement Batch</option>
                  <option value="CARD_SETTLEMENT">POS Card Batch Clearance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Notes / Matching Reason</label>
                <input
                  type="text"
                  required
                  value={matchNotes}
                  onChange={(e) => setMatchNotes(e.target.value)}
                  placeholder="e.g. Matched with daily morning counter cash drop"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMatchModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 cursor-pointer"
                >
                  Confirm Clearance Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Import Statement Entry</h3>
            <p className="text-xs text-slate-500 mb-4">Record new bank credit line for reconciliation.</p>

            <form onSubmit={handleImportLine} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Description</label>
                <input
                  type="text"
                  required
                  value={importDesc}
                  onChange={(e) => setImportDesc(e.target.value)}
                  placeholder="e.g. BY ICICI POS BATCH CREDIT"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={importAmount}
                    onChange={(e) => setImportAmount(e.target.value)}
                    placeholder="15000"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reference #</label>
                  <input
                    type="text"
                    value={importRef}
                    onChange={(e) => setImportRef(e.target.value)}
                    placeholder="UTR-99120"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 text-white rounded-xl text-xs font-bold hover:bg-blue-900 cursor-pointer"
                >
                  Add Statement Line
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
