import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Fuel,
  Truck,
  FileText,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export const ManagerSurface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'tanks' | 'delivery'>('approvals');
  const [pendingShift, setPendingShift] = useState<any>(null);
  const [tanks, setTanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tank Dip input
  const [selectedTankId, setSelectedTankId] = useState('');
  const [dipMmInput, setDipMmInput] = useState('');
  const [dipVolumeResult, setDipVolumeResult] = useState<any>(null);

  // Delivery Modal
  const [deliveryData, setDeliveryData] = useState({
    tank_id: '',
    invoice_number: 'INV-HPCL-8921',
    tanker_truck_no: 'MH04GP9876',
    supplier_name: 'Hindustan Petroleum Corp Ltd',
    invoice_litres: 12000,
    opening_dip_mm: 1200,
    closing_dip_mm: 2360,
    density_observed: 742.5,
    temperature_celsius: 29.0,
    total_cost_paise: 102000000, // ₹10,20,000 wholesale
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const shiftRes = await fetch('/api/v1/shifts/active');
      const shiftJson = await shiftRes.json();
      setPendingShift(shiftJson.shift?.status === 'CLOSE_REQUESTED' ? shiftJson : null);

      const tanksRes = await fetch('/api/v1/tanks');
      const tanksJson = await tanksRes.json();
      setTanks(tanksJson.tanks || []);
      if (tanksJson.tanks?.length > 0 && !selectedTankId) {
        setSelectedTankId(tanksJson.tanks[0].id);
        setDeliveryData((prev) => ({ ...prev, tank_id: tanksJson.tanks[0].id }));
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveShift = async (shiftId: string) => {
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/v1/shifts/${shiftId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'usr_manager',
          notes: 'Shift approved and posted to immutable stock and finance ledgers by Manager Ramesh Sharma',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve shift');

      setFeedbackMsg({
        type: 'success',
        text: `Shift #${pendingShift.shift.shift_number} Approved! Balanced voucher ${data.voucher_number} posted and stock updated.`,
      });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnShift = async (shiftId: string) => {
    const reason = prompt('Enter return reason for Attendant Raju Yadav:');
    if (!reason) return;

    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/v1/shifts/${shiftId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'usr_manager',
          return_reason: reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to return shift');

      setFeedbackMsg({
        type: 'success',
        text: `Shift returned to attendant for correction: "${reason}"`,
      });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordDip = async () => {
    if (!dipMmInput || !selectedTankId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/tanks/${selectedTankId}/dip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dip_mm: Number(dipMmInput) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record dip');

      setDipVolumeResult(data);
      setFeedbackMsg({
        type: 'success',
        text: `Dip recorded: ${data.dip_mm} mm => ${data.dip_litres} Litres (Variance: ${data.variance.variance_litres} L)`,
      });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/v1/tanks/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deliveryData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record delivery');

      setFeedbackMsg({
        type: 'success',
        text: `Delivery logged! Posted voucher ${data.voucherNumber}. Delivery dip variance: ${data.varianceLitres} Litres.`,
      });
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-16">
      {/* Manager Header */}
      <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Manager Operations Console</h2>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Ramesh Sharma
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Shift approval authority • Stock dip & delivery posting • Financial control
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'approvals' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Shift Approvals {pendingShift ? '(1 Pending)' : ''}
          </button>
          <button
            onClick={() => setActiveTab('tanks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'tanks' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tank Dips & Stock
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'delivery' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Log Tanker Delivery
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/20 border-red-500/40 text-red-300'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="opacity-70 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* TAB 1: SHIFT APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {pendingShift ? (
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-4">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <h3 className="font-bold text-base text-white">
                      Review Shift #{pendingShift.shift.shift_number} Close Submission
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Submitted by: <strong>{pendingShift.shift.opened_by_name}</strong> • Closed at:{' '}
                    {pendingShift.shift.closed_at}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReturnShift(pendingShift.shift.id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Return for Correction</span>
                  </button>

                  <button
                    onClick={() => handleApproveShift(pendingShift.shift.id)}
                    disabled={actionLoading}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Post Ledger</span>
                  </button>
                </div>
              </div>

              {/* Meter readings table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px]">
                      <th className="pb-2">Nozzle / Fuel</th>
                      <th className="pb-2 text-right">Opening</th>
                      <th className="pb-2 text-right">Closing</th>
                      <th className="pb-2 text-right">Testing L</th>
                      <th className="pb-2 text-right">Net Litres</th>
                      <th className="pb-2 text-right">Rate (₹)</th>
                      <th className="pb-2 text-right">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {pendingShift.readings?.map((r: any) => (
                      <tr key={r.id} className="text-slate-200">
                        <td className="py-2.5 font-semibold">Nozzle #{r.nozzle_id.slice(-1)}</td>
                        <td className="py-2.5 text-right font-mono">{r.opening_reading.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-white">
                          {r.closing_reading.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-400">{r.testing_litres.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-blue-400">
                          {r.net_litres_sold.toFixed(2)} L
                        </td>
                        <td className="py-2.5 text-right font-mono">₹{(r.price_paise / 100).toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                          ₹{(r.total_amount_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tender reconciliation card */}
              {pendingShift.tenders && (
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Tender Split Breakdown</span>
                    <span className="text-amber-400">
                      Variance: ₹{(pendingShift.tenders.cash_variance_paise / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-800/80 p-2.5 rounded-lg">
                      <span className="text-slate-400 block text-[11px]">Actual Cash Counted</span>
                      <span className="font-mono font-bold text-white text-sm">
                        ₹{(pendingShift.tenders.cash_actual_paise / 100).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-slate-800/80 p-2.5 rounded-lg">
                      <span className="text-slate-400 block text-[11px]">UPI Collections</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ₹{(pendingShift.tenders.upi_amount_paise / 100).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-slate-800/80 p-2.5 rounded-lg">
                      <span className="text-slate-400 block text-[11px]">Card Swipes</span>
                      <span className="font-mono font-bold text-blue-400 text-sm">
                        ₹{(pendingShift.tenders.card_amount_paise / 100).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-slate-800/80 p-2.5 rounded-lg">
                      <span className="text-slate-400 block text-[11px]">Customer Credit</span>
                      <span className="font-mono font-bold text-purple-400 text-sm">
                        ₹{(pendingShift.tenders.credit_sales_amount_paise / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {pendingShift.tenders.variance_reason && (
                    <div className="p-2.5 bg-slate-800/50 rounded-lg text-xs text-slate-300 border border-slate-700/60">
                      <strong className="text-slate-400">Attendant Explanation:</strong>{' '}
                      {pendingShift.tenders.variance_reason}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-800/40 p-8 rounded-2xl border border-slate-700/60 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-white">No Shifts Awaiting Approval</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All previous shifts have been approved and posted to the ledger. Attendants are currently operating on
                the forecourt.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TANK DIPS & STOCK */}
      {activeTab === 'tanks' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tanks.map((tank) => (
              <div key={tank.id} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-blue-400" />
                    <div>
                      <h4 className="font-bold text-sm text-white">{tank.name}</h4>
                      <span className="text-[10px] text-slate-400">Capacity: {tank.capacity_litres.toLocaleString()} L</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      tank.variance?.is_excess ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {tank.variance?.variance_litres >= 0
                      ? `+${tank.variance?.variance_litres} L`
                      : `${tank.variance?.variance_litres} L`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Physical Dip</span>
                    <span className="font-mono font-bold text-white">{tank.current_dip_mm} mm</span>
                    <span className="text-slate-400 block text-[10px] mt-0.5">
                      {tank.current_dip_litres.toLocaleString()} L
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Book Stock</span>
                    <span className="font-mono font-bold text-blue-400">
                      {tank.current_book_litres.toLocaleString()} L
                    </span>
                    <span className="text-slate-400 block text-[10px] mt-0.5">Ledger Balance</span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Dead Stock</span>
                    <span className="font-mono font-bold text-slate-300">{tank.dead_stock_litres} L</span>
                    <span className="text-slate-400 block text-[10px] mt-0.5">Unusable</span>
                  </div>
                </div>

                {/* Gauge bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>Available Level</span>
                    <span>{Math.round((tank.current_book_litres / tank.capacity_litres) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (tank.current_book_litres / tank.capacity_litres) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Record Physical Dip Form */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">Log Physical Dip Reading:</span>
              <select
                value={selectedTankId}
                onChange={(e) => setSelectedTankId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              >
                {tanks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>Dip Depth:</span>
              <input
                type="number"
                placeholder="e.g. 1480"
                value={dipMmInput}
                onChange={(e) => setDipMmInput(e.target.value)}
                className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-right font-mono text-white"
              />
              <span className="text-slate-400">mm</span>

              <button
                onClick={handleRecordDip}
                disabled={actionLoading || !dipMmInput}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition disabled:opacity-50"
              >
                Calculate Volume & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOG DELIVERY */}
      {activeTab === 'delivery' && (
        <form onSubmit={handleRecordDelivery} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-4">
          <div className="border-b border-slate-700 pb-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              Log OMC Tanker Fuel Delivery Receipt
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Validates opening dip vs closing dip rise against invoiced litres, calculates short delivery, and posts
              inventory and payable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Target Storage Tank</label>
              <select
                value={deliveryData.tank_id}
                onChange={(e) => setDeliveryData({ ...deliveryData, tank_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              >
                {tanks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Invoice Number</label>
              <input
                type="text"
                value={deliveryData.invoice_number}
                onChange={(e) => setDeliveryData({ ...deliveryData, invoice_number: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Tanker Truck Number</label>
              <input
                type="text"
                value={deliveryData.tanker_truck_no}
                onChange={(e) => setDeliveryData({ ...deliveryData, tanker_truck_no: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono uppercase"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Invoiced Litres</label>
              <input
                type="number"
                value={deliveryData.invoice_litres}
                onChange={(e) => setDeliveryData({ ...deliveryData, invoice_litres: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Opening Dip (Before Unloading)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={deliveryData.opening_dip_mm}
                  onChange={(e) => setDeliveryData({ ...deliveryData, opening_dip_mm: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
                <span className="text-slate-400">mm</span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Closing Dip (After Unloading)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={deliveryData.closing_dip_mm}
                  onChange={(e) => setDeliveryData({ ...deliveryData, closing_dip_mm: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-emerald-400"
                />
                <span className="text-slate-400">mm</span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Observed Density @ 15°C (kg/m³)</label>
              <input
                type="number"
                step="0.1"
                value={deliveryData.density_observed}
                onChange={(e) => setDeliveryData({ ...deliveryData, density_observed: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Fuel Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={deliveryData.temperature_celsius}
                onChange={(e) => setDeliveryData({ ...deliveryData, temperature_celsius: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Wholesale Cost (Paise)</label>
              <input
                type="number"
                value={deliveryData.total_cost_paise}
                onChange={(e) => setDeliveryData({ ...deliveryData, total_cost_paise: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Post Fuel Delivery & Verify Dip Variance</span>
          </button>
        </form>
      )}
    </div>
  );
};
