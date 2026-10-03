import React, { useState, useEffect } from 'react';
import {
  Settings,
  Fuel,
  Sliders,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  History,
  TrendingUp,
  FileText,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface Tank {
  id: string;
  name: string;
  product_name: string;
  product_code: string;
  capacity_litres: number;
  current_book_litres: number;
}

interface Nozzle {
  id: string;
  dispenser_number: number;
  nozzle_number: number;
  product_name: string;
  tank_name: string;
  last_reading: number;
  active: number;
}

interface AssetLog {
  id: string;
  asset_type: string;
  asset_id: string;
  previous_status: string;
  new_status: string;
  reason: string;
  changed_by_name: string;
  created_at: string;
}

interface PriceVersion {
  id: string;
  product_name: string;
  product_code: string;
  price_paise: number;
  effective_from: string;
  source: string;
  reason: string;
}

export const MasterSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'meter_replace' | 'rates'>('status');
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [nozzles, setNozzles] = useState<Nozzle[]>([]);
  const [recentLogs, setRecentLogs] = useState<AssetLog[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // Meter Replacement Modal
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedNozzleId, setSelectedNozzleId] = useState('');
  const [newMeterId, setNewMeterId] = useState('');
  const [newBaseline, setNewBaseline] = useState('0.00');
  const [replaceReason, setReplaceReason] = useState('');
  const [replaceEvidence, setReplaceEvidence] = useState('');

  // Status Change Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAssetType, setStatusAssetType] = useState<'NOZZLE' | 'TANK'>('NOZZLE');
  const [statusAssetId, setStatusAssetId] = useState('');
  const [newStatus, setNewStatus] = useState('MAINTENANCE');
  const [statusReason, setStatusReason] = useState('');

  // New Rate Modal
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateProductId, setRateProductId] = useState('prod_ms');
  const [rateINR, setRateINR] = useState('96.50');
  const [rateSource, setRateSource] = useState('Indian Oil Daily Rate Notification');
  const [rateReason, setRateReason] = useState('Daily 06:00 AM state revision');

  const loadData = async () => {
    setLoading(true);
    try {
      const [assetsRes, pricesRes] = await Promise.all([
        fetch('/api/v1/masters/assets'),
        fetch('/api/v1/masters/prices/history'),
      ]);

      if (assetsRes.ok) {
        const data = await assetsRes.json();
        setTanks(data.tanks || []);
        setNozzles(data.nozzles || []);
        setRecentLogs(data.recentLogs || []);
      }
      if (pricesRes.ok) {
        const data = await pricesRes.json();
        setPriceHistory(data.history || []);
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

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusAssetId || !statusReason) return;

    try {
      const res = await fetch('/api/v1/masters/assets/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_gadhiya',
          asset_type: statusAssetType,
          asset_id: statusAssetId,
          new_status: newStatus,
          reason: statusReason,
        }),
      });

      if (res.ok) {
        setShowStatusModal(false);
        setStatusReason('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMeterReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNozzleId || !replaceReason) return;

    try {
      const res = await fetch('/api/v1/masters/meters/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_gadhiya',
          nozzle_id: selectedNozzleId,
          new_meter_id: newMeterId,
          new_baseline_reading: Number(newBaseline),
          reason: replaceReason,
          evidence_notes: replaceEvidence,
        }),
      });

      if (res.ok) {
        setShowReplaceModal(false);
        setNewMeterId('');
        setNewBaseline('0.00');
        setReplaceReason('');
        setReplaceEvidence('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateProductId || !rateINR) return;

    try {
      const res = await fetch('/api/v1/masters/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_gadhiya',
          product_id: rateProductId,
          price_paise: Math.round(Number(rateINR) * 100),
          source: rateSource,
          reason: rateReason,
        }),
      });

      if (res.ok) {
        setShowRateModal(false);
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
            <span className="p-2 rounded-xl bg-blue-100 text-blue-900 border border-blue-200">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Pump Master Settings & Operational Controls (P0)
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Administrative Open/Stop nozzle and tank status, meter baseline replacement exception registry, and daily fuel rate history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowRateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Update Daily Rate</span>
          </button>
          <button
            onClick={() => setShowReplaceModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Meter Replacement Baseline</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'status'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Nozzle & Tank Operational Status
        </button>
        <button
          onClick={() => setActiveTab('meter_replace')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'meter_replace'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Meter Replacement Exceptions
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'rates'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Daily Rate & Price History
        </button>
      </div>

      {/* Tab 1: Nozzle & Tank Operational Status */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nozzles Grid */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Dispenser Nozzles (Forecourt MPD)</h3>
                <span className="text-xs text-slate-500 font-semibold">{nozzles.length} configured</span>
              </div>

              <div className="space-y-3">
                {nozzles.map((n) => (
                  <div key={n.id} className="border border-slate-200 rounded-xl p-3.5 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          Dispenser {n.dispenser_number} • Nozzle {n.nozzle_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${n.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {n.active ? 'ACTIVE' : 'STOPPED'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Product: {n.product_name} • Tank: {n.tank_name} • Current Totalizer: {n.last_reading.toFixed(2)} L
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setStatusAssetType('NOZZLE');
                        setStatusAssetId(n.id);
                        setNewStatus(n.active ? 'INACTIVE' : 'ACTIVE');
                        setShowStatusModal(true);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
                    >
                      Change Status
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tanks Grid */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Underground Storage Tanks (UST)</h3>
                <span className="text-xs text-slate-500 font-semibold">{tanks.length} calibrated</span>
              </div>

              <div className="space-y-3">
                {tanks.map((t) => (
                  <div key={t.id} className="border border-slate-200 rounded-xl p-3.5 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{t.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                          CALIBRATED
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Fuel: {t.product_name} • Capacity: {t.capacity_litres.toLocaleString()} L • Book: {t.current_book_litres.toLocaleString()} L
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setStatusAssetType('TANK');
                        setStatusAssetId(t.id);
                        setNewStatus('MAINTENANCE');
                        setShowStatusModal(true);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
                    >
                      Status / Maint
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-slate-900">Administrative Status Change Audit Trail</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Asset Type</th>
                    <th className="py-2.5 px-4">Previous State</th>
                    <th className="py-2.5 px-4">New State</th>
                    <th className="py-2.5 px-4">Reason / Notes</th>
                    <th className="py-2.5 px-4">Changed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2.5 px-4 font-mono text-slate-500">{log.created_at}</td>
                      <td className="py-2.5 px-4 font-bold">{log.asset_type}</td>
                      <td className="py-2.5 px-4 text-slate-500">{log.previous_status}</td>
                      <td className="py-2.5 px-4 font-bold text-blue-900">{log.new_status}</td>
                      <td className="py-2.5 px-4 text-slate-700">{log.reason}</td>
                      <td className="py-2.5 px-4 font-medium">{log.changed_by_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Meter Replacement Exceptions */}
      {activeTab === 'meter_replace' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Meter Baseline Replacement Exceptions</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Registering a replacement meter establishes a new reading baseline without rewriting historical totalizer records.
              </p>
            </div>
            <button
              onClick={() => setShowReplaceModal(true)}
              className="px-4 py-2 bg-blue-800 text-white rounded-xl text-xs font-bold hover:bg-blue-900 cursor-pointer"
            >
              + Register Replacement
            </button>
          </div>

          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
            <p className="font-bold">Legal Metrology & OMC Operating Standard:</p>
            <p>
              When a mechanical or electronic MPD meter unit is repaired, calibrated, or replaced by Gilbarco / Midco / Tokheim service technicians, the final closing reading of the old unit is frozen, and the new unit baseline is registered with evidence notes and manager sign-off.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Daily Rate & Price History */}
      {activeTab === 'rates' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Daily Fuel Rate Revision History</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Effective-dated price versions with Indian Oil notification source and approval timestamp.
              </p>
            </div>
            <button
              onClick={() => setShowRateModal(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 cursor-pointer"
            >
              + Submit Rate Revision
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider">
                  <th className="py-3 px-4">Effective Timestamp</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Retail Rate (₹/Litre)</th>
                  <th className="py-3 px-4">Source Notification</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {priceHistory.map((pv) => (
                  <tr key={pv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{pv.effective_from}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{pv.product_name} ({pv.product_code})</td>
                    <td className="py-3 px-4 font-black text-slate-900 text-sm">
                      ₹{(pv.price_paise / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{pv.source}</td>
                    <td className="py-3 px-4 text-slate-500">{pv.reason}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Administrative Asset Status</h3>
            <p className="text-xs text-slate-500 mb-4">Update software operational status (does not actuate physical hardware).</p>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Operational State</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="ACTIVE">Active (Online for Sales)</option>
                  <option value="INACTIVE">Inactive / Stopped</option>
                  <option value="MAINTENANCE">Under Maintenance / Filter Replacement</option>
                  <option value="UNAVAILABLE">Unavailable / Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Maintenance Notes</label>
                <input
                  type="text"
                  required
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Dispenser nozzle boot seal servicing"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 text-white rounded-xl text-xs font-bold hover:bg-blue-900 cursor-pointer"
                >
                  Confirm Status Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meter Replacement Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Register Meter Replacement</h3>
            <p className="text-xs text-slate-500 mb-4">Establish a new meter totalizer baseline with audit log.</p>

            <form onSubmit={handleMeterReplace} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Nozzle</label>
                <select
                  value={selectedNozzleId}
                  onChange={(e) => setSelectedNozzleId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="">Select nozzle...</option>
                  {nozzles.map((n) => (
                    <option key={n.id} value={n.id}>
                      Dispenser {n.dispenser_number} • Nozzle {n.nozzle_number} ({n.product_name}) - Current: {n.last_reading.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Meter Serial #</label>
                  <input
                    type="text"
                    value={newMeterId}
                    onChange={(e) => setNewMeterId(e.target.value)}
                    placeholder="MTR-2026-99"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Baseline Reading (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newBaseline}
                    onChange={(e) => setNewBaseline(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Replacement / Reset</label>
                <input
                  type="text"
                  required
                  value={replaceReason}
                  onChange={(e) => setReplaceReason(e.target.value)}
                  placeholder="e.g. Defective electronic pulser replaced by Midco engineer"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Evidence / Service Report Notes</label>
                <input
                  type="text"
                  value={replaceEvidence}
                  onChange={(e) => setReplaceEvidence(e.target.value)}
                  placeholder="Service ticket # MID-98421"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReplaceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 text-white rounded-xl text-xs font-bold hover:bg-blue-900 cursor-pointer"
                >
                  Submit Replacement Baseline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rate Revision Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Submit Daily Rate Revision</h3>
            <p className="text-xs text-slate-500 mb-4">Official Indian Oil retail selling price adjustment.</p>

            <form onSubmit={handleUpdateRate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fuel Product</label>
                <select
                  value={rateProductId}
                  onChange={(e) => setRateProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="prod_ms">Petrol (Motor Spirit)</option>
                  <option value="prod_hsd">Diesel (High Speed Diesel)</option>
                  <option value="prod_xp95">Indian Oil XP95 (Premium Petrol)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Rate (₹ per Litre)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={rateINR}
                  onChange={(e) => setRateINR(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Source / IOCL Notification Ref</label>
                <input
                  type="text"
                  value={rateSource}
                  onChange={(e) => setRateSource(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Revision Reason</label>
                <input
                  type="text"
                  value={rateReason}
                  onChange={(e) => setRateReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 cursor-pointer"
                >
                  Post Price Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
