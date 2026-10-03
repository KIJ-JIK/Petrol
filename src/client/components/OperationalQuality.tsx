import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Thermometer,
  Layers,
  Droplet,
  Search,
  CheckCircle,
  AlertTriangle,
  Scale,
  Calendar,
  FileText,
  PlusCircle,
} from 'lucide-react';

interface DensityRecord {
  id: string;
  tank_name: string;
  product_name: string;
  product_code: string;
  sample_timestamp: string;
  temperature_celsius: number;
  observed_density: number;
  density_at_15c: number;
  sampling_method: string;
  sample_result: string;
  reviewer_name: string;
  notes: string;
}

interface StockAdjustment {
  id: string;
  tank_name: string;
  product_name: string;
  adjustment_type: string;
  quantity_litres: number;
  reason: string;
  source_measurement: string;
  approver_name: string;
  created_at: string;
}

export const OperationalQuality: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'density' | 'adjustments' | 'quick_dip'>('density');
  const [densityRecords, setDensityRecords] = useState<DensityRecord[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);

  // Density Modal
  const [showDensityModal, setShowDensityModal] = useState(false);
  const [densTankId, setDensTankId] = useState('tank_ms_1');
  const [densProductId, setDensProductId] = useState('prod_ms');
  const [densTemp, setDensTemp] = useState('29.5');
  const [densObserved, setDensObserved] = useState('735.0');
  const [densNotes, setDensNotes] = useState('');

  // Controlled Adjustment Modal
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjTankId, setAdjTankId] = useState('tank_ms_1');
  const [adjProductId, setAdjProductId] = useState('prod_ms');
  const [adjType, setAdjType] = useState('EVAPORATION');
  const [adjQty, setAdjQty] = useState('-15.0');
  const [adjReason, setAdjReason] = useState('');
  const [adjEvidence, setAdjEvidence] = useState('');

  // Quick Dip Check State
  const [quickTankId, setQuickTankId] = useState('tank_ms_1');
  const [quickDipMm, setQuickDipMm] = useState('1450');
  const [quickResult, setQuickResult] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [densRes, adjRes] = await Promise.all([
        fetch('/api/v1/quality/density'),
        fetch('/api/v1/quality/adjustments'),
      ]);

      if (densRes.ok) {
        const data = await densRes.json();
        setDensityRecords(data.records || []);
      }
      if (adjRes.ok) {
        const data = await adjRes.json();
        setAdjustments(data.adjustments || []);
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

  const handleCreateDensity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!densObserved || !densTemp) return;

    try {
      const res = await fetch('/api/v1/quality/density', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_gadhiya',
          tank_id: densTankId,
          product_id: densProductId,
          temperature_celsius: Number(densTemp),
          observed_density: Number(densObserved),
          notes: densNotes,
        }),
      });

      if (res.ok) {
        setShowDensityModal(false);
        setDensNotes('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjQty || !adjReason) return;

    try {
      const res = await fetch('/api/v1/quality/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_gadhiya',
          tank_id: adjTankId,
          product_id: adjProductId,
          adjustment_type: adjType,
          quantity_litres: Number(adjQty),
          reason: adjReason,
          source_measurement: adjEvidence,
        }),
      });

      if (res.ok) {
        setShowAdjModal(false);
        setAdjReason('');
        setAdjEvidence('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickDip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTankId || !quickDipMm) return;

    try {
      const res = await fetch('/api/v1/quality/quick-dip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tank_id: quickTankId,
          dip_mm: Number(quickDipMm),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuickResult(data);
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
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-900 border border-indigo-200">
              <Thermometer className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Operational Quality, Density & Controlled Evaporation (P1)
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            ASTM 15°C calibrated density register, evidence-backed stock adjustments, and instant mobile Quick Dip lookup.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAdjModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Scale className="w-4 h-4" />
            <span>Controlled Stock Adjustment</span>
          </button>
          <button
            onClick={() => setShowDensityModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Density Reading</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('density')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'density'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Daily Density & Temperature Register
        </button>
        <button
          onClick={() => setActiveTab('adjustments')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'adjustments'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Controlled Stock Adjustments & Evaporation
        </button>
        <button
          onClick={() => setActiveTab('quick_dip')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'quick_dip'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Quick Dip Inspection Tool
        </button>
      </div>

      {/* Tab 1: Density Register */}
      {activeTab === 'density' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">ASTM 15°C Hydrometer Calibrated Density Register</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official OMC daily morning quality check for Motor Spirit & High Speed Diesel.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{densityRecords.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider">
                  <th className="py-3 px-4">Sample Timestamp</th>
                  <th className="py-3 px-4">Tank / Source</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Observed Temp (°C)</th>
                  <th className="py-3 px-4">Observed Density</th>
                  <th className="py-3 px-4">15°C Calibrated (ASTM)</th>
                  <th className="py-3 px-4">Inspection Result</th>
                  <th className="py-3 px-4">Reviewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {densityRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{r.sample_timestamp}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.tank_name}</td>
                    <td className="py-3 px-4 font-semibold">{r.product_name}</td>
                    <td className="py-3 px-4">{r.temperature_celsius}°C</td>
                    <td className="py-3 px-4 font-mono">{r.observed_density} kg/m³</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{r.density_at_15c} kg/m³</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {r.sample_result}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{r.reviewer_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Controlled Stock Adjustments */}
      {activeTab === 'adjustments' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Controlled Evaporation & Stock Adjustments</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Strict evidence-backed stock adjustments. Software never automatically balances unexplained variance.
              </p>
            </div>
            <button
              onClick={() => setShowAdjModal(true)}
              className="px-4 py-2 bg-rose-700 text-white rounded-xl text-xs font-bold hover:bg-rose-800 cursor-pointer"
            >
              + Submit Adjustment
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Tank</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quantity (Litres)</th>
                  <th className="py-3 px-4">Reason / Justification</th>
                  <th className="py-3 px-4">Measurement Evidence</th>
                  <th className="py-3 px-4">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No stock adjustments logged. All book stock changes remain strictly tied to nozzle sales and deliveries.
                    </td>
                  </tr>
                ) : (
                  adjustments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{a.created_at}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{a.tank_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-800 border border-slate-200">
                          {a.adjustment_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-700">{a.quantity_litres} L</td>
                      <td className="py-3 px-4 text-slate-700">{a.reason}</td>
                      <td className="py-3 px-4 text-slate-500">{a.source_measurement || '—'}</td>
                      <td className="py-3 px-4 font-medium">{a.approver_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Quick Dip Check */}
      {activeTab === 'quick_dip' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Mobile Quick Dip Inspection Tool</h3>
            <p className="text-xs text-slate-500">
              Instantly converts dip measurement in millimeters to calibrated volume and highlights variance against current book balance.
            </p>

            <form onSubmit={handleQuickDip} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Tank</label>
                <select
                  value={quickTankId}
                  onChange={(e) => setQuickTankId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="tank_ms_1">Tank 1 - MS Petrol (20 KL)</option>
                  <option value="tank_hsd_1">Tank 2 - HSD Diesel (25 KL)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Measured Dip (mm)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={quickDipMm}
                  onChange={(e) => setQuickDipMm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Perform Calibration Check
              </button>
            </form>
          </div>

          {/* Quick Dip Results Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Inspection Analysis</h3>
              <p className="text-xs text-slate-500 mt-0.5">Calculated using tank-specific piecewise linear calibration chart.</p>
            </div>

            {quickResult ? (
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Tank Name:</span>
                    <span className="font-bold text-slate-900">{quickResult.tank_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Physical Converted Volume:</span>
                    <span className="font-black text-blue-900 text-sm">{quickResult.converted_litres.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Current Book Balance:</span>
                    <span className="font-semibold text-slate-900">{quickResult.current_book_litres.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-bold">Forecourt Variance:</span>
                    <span className={`font-black ${quickResult.variance_litres < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {quickResult.variance_litres > 0 ? `+${quickResult.variance_litres}` : quickResult.variance_litres} Litres
                    </span>
                  </div>
                </div>

                {quickResult.is_breached ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Variance exceeds tolerance threshold (&gt; 200 Litres). Manager review required.</span>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Physical dip observation within normal operating tolerance.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Enter dip depth in mm to compute calibrated physical litres.
              </div>
            )}

            <span className="text-[11px] text-slate-400 block text-right">
              SK Petroleum • Gadhiya Forecourt UST Calibration
            </span>
          </div>
        </div>
      )}

      {/* Density Modal */}
      {showDensityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Log Daily Fuel Density</h3>
            <p className="text-xs text-slate-500 mb-4">Record hydrometer temperature and observed density.</p>

            <form onSubmit={handleCreateDensity} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Underground Tank</label>
                <select
                  value={densTankId}
                  onChange={(e) => {
                    setDensTankId(e.target.value);
                    setDensProductId(e.target.value === 'tank_ms_1' ? 'prod_ms' : 'prod_hsd');
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="tank_ms_1">Tank 1 - MS Petrol</option>
                  <option value="tank_hsd_1">Tank 2 - HSD Diesel</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={densTemp}
                    onChange={(e) => setDensTemp(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Observed Density (kg/m³)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={densObserved}
                    onChange={(e) => setDensObserved(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Sample Observations</label>
                <input
                  type="text"
                  value={densNotes}
                  onChange={(e) => setDensNotes(e.target.value)}
                  placeholder="Morning hydrometer inspection clear"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDensityModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 text-white rounded-xl text-xs font-bold hover:bg-blue-900 cursor-pointer"
                >
                  Record Density
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Controlled Stock Adjustment Modal */}
      {showAdjModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Controlled Stock Adjustment</h3>
            <p className="text-xs text-slate-500 mb-4">Requires specific justification category and manager authorization.</p>

            <form onSubmit={handleCreateAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Underground Tank</label>
                <select
                  value={adjTankId}
                  onChange={(e) => {
                    setAdjTankId(e.target.value);
                    setAdjProductId(e.target.value === 'tank_ms_1' ? 'prod_ms' : 'prod_hsd');
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="tank_ms_1">Tank 1 - MS Petrol</option>
                  <option value="tank_hsd_1">Tank 2 - HSD Diesel</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Type</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  >
                    <option value="EVAPORATION">Operational Evaporation</option>
                    <option value="MEASUREMENT_CORRECTION">Calibration Correction</option>
                    <option value="DAMAGE_CONTAMINATION">Water / Sludge Drain</option>
                    <option value="TRANSFER">Internal Tank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity (Litres)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={adjQty}
                    onChange={(e) => setAdjQty(e.target.value)}
                    placeholder="-15.0"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Justification Reason (Required)</label>
                <input
                  type="text"
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Summer transit evaporation within allowable OMC tolerance"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Source Dip / Measurement Evidence</label>
                <input
                  type="text"
                  value={adjEvidence}
                  onChange={(e) => setAdjEvidence(e.target.value)}
                  placeholder="Physical dip tape mm verification record"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-700 text-white rounded-xl text-xs font-bold hover:bg-rose-800 cursor-pointer"
                >
                  Submit Authorized Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
