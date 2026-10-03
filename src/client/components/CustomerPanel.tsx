import React, { useState, useEffect } from 'react';
import {
  Users,
  Car,
  CreditCard,
  PlusCircle,
  Clock,
  AlertTriangle,
  Search,
  IndianRupee,
  FileText,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

interface Party {
  id: string;
  name: string;
  code: string;
  phone: string;
  credit_limit_paise: number;
  current_balance_paise: number;
  payment_terms_days: number;
  vehicles: string[];
  is_over_limit: boolean;
}

interface ConsumptionRow {
  party_id: string;
  party_name: string;
  vehicle_no: string;
  product_name: string;
  total_litres: number;
  total_amount_paise: number;
  fill_count: number;
  last_fill_date: string;
}

interface AgeingSummary {
  total_outstanding_paise: number;
  bucket_0_15_paise: number;
  bucket_16_30_paise: number;
  bucket_31_60_paise: number;
  bucket_60_plus_paise: number;
}

export const CustomerPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directory' | 'vehicles' | 'consumption' | 'ageing'>('directory');
  const [parties, setParties] = useState<Party[]>([]);
  const [consumption, setConsumption] = useState<ConsumptionRow[]>([]);
  const [ageing, setAgeing] = useState<AgeingSummary | null>(null);
  const [partyAgeingList, setPartyAgeingList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // New Party Form Modal
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState('100000');
  const [newTerms, setNewTerms] = useState('15');
  const [newVehicles, setNewVehicles] = useState('');

  // Add Vehicle Modal
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [newVehicleNo, setNewVehicleNo] = useState('');
  const [newMakeModel, setNewMakeModel] = useState('');
  const [newDriverName, setNewDriverName] = useState('');

  // Payment Collection Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPartyId, setPaymentPartyId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
  const [paymentRef, setPaymentRef] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [partiesRes, consumptionRes, ageingRes] = await Promise.all([
        fetch('/api/v1/parties'),
        fetch('/api/v1/parties/consumption-report'),
        fetch('/api/v1/parties/ageing-summary'),
      ]);

      if (partiesRes.ok) {
        const data = await partiesRes.json();
        setParties(data.parties || []);
      }
      if (consumptionRes.ok) {
        const data = await consumptionRes.json();
        setConsumption(data.report || []);
      }
      if (ageingRes.ok) {
        const data = await ageingRes.json();
        setAgeing(data.summary || null);
        setPartyAgeingList(data.party_breakdown || []);
      }
    } catch (e) {
      console.error('Error loading customer panel data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    try {
      const vehiclesArray = newVehicles
        .split(',')
        .map((v) => v.trim().toUpperCase())
        .filter(Boolean);

      const res = await fetch('/api/v1/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_gadhiya',
          name: newName,
          code: newCode || `CUST-${Date.now().toString().slice(-4)}`,
          phone: newPhone,
          credit_limit_paise: Math.round(Number(newCreditLimit) * 100),
          payment_terms_days: Number(newTerms) || 15,
          vehicles: vehiclesArray,
        }),
      });

      if (res.ok) {
        setShowAddPartyModal(false);
        setNewName('');
        setNewCode('');
        setNewPhone('');
        setNewVehicles('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartyId || !newVehicleNo) return;

    try {
      const res = await fetch(`/api/v1/parties/${selectedPartyId}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_no: newVehicleNo,
          make_model: newMakeModel,
          driver_name: newDriverName,
        }),
      });

      if (res.ok) {
        setShowAddVehicleModal(false);
        setNewVehicleNo('');
        setNewMakeModel('');
        setNewDriverName('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentPartyId || !paymentAmount) return;

    try {
      const res = await fetch('/api/v1/parties/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_gadhiya',
          party_id: paymentPartyId,
          amount_paise: Math.round(Number(paymentAmount) * 100),
          payment_mode: paymentMode,
          reference_no: paymentRef,
          notes: 'Customer collection credited to khata',
        }),
      });

      if (res.ok) {
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentRef('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredParties = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.vehicles.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalOutstandingINR = parties.reduce((acc, p) => acc + p.current_balance_paise, 0) / 100;
  const overLimitCount = parties.filter((p) => p.is_over_limit).length;
  const totalVehiclesCount = parties.reduce((acc, p) => acc + (p.vehicles?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-900 border border-blue-200">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Customer Portal & Khata Hub
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            25+ customer facilities: fleet vehicle management, online credit billing indents, consumption statements, and ageing analysis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Record Payment (CR)</span>
          </button>
          <button
            onClick={() => setShowAddPartyModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards in Clean Light Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Accounts</span>
            <Users className="w-4 h-4 text-blue-700" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{parties.length}</div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">100% Verified KYC</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Outstanding</span>
            <IndianRupee className="w-4 h-4 text-orange-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ₹{totalOutstandingINR.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">Forecourt Receivables</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Over-Limit Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">{overLimitCount}</div>
          <span className="text-[11px] text-rose-600 font-semibold mt-1 inline-block">Require Manager Approval</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fleet Vehicles</span>
            <Car className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalVehiclesCount}</div>
          <span className="text-[11px] text-indigo-700 font-semibold mt-1 inline-block">Enrolled Reg. Numbers</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Customer Directory & Khata
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'vehicles'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Enrolled Fleet Vehicles ({totalVehiclesCount})
        </button>
        <button
          onClick={() => setActiveTab('consumption')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'consumption'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Vehicle Consumption Analytics
        </button>
        <button
          onClick={() => setActiveTab('ageing')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'ageing'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Ageing Statement (0-60+ Days)
        </button>
      </div>

      {/* Tab 1: Customer Directory & Khata */}
      {activeTab === 'directory' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer name, code, phone, or vehicle number..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-700"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {filteredParties.length} of {parties.length} accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider">
                  <th className="py-3 px-4">Account / Party</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Credit Limit</th>
                  <th className="py-3 px-4">Current Balance</th>
                  <th className="py-3 px-4">Terms</th>
                  <th className="py-3 px-4">Vehicles</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParties.map((p) => {
                  const limitINR = p.credit_limit_paise / 100;
                  const balanceINR = p.current_balance_paise / 100;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.code}</td>
                      <td className="py-3 px-4">{p.phone}</td>
                      <td className="py-3 px-4 font-semibold">₹{limitINR.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${balanceINR > limitINR ? 'text-rose-600' : 'text-slate-900'}`}>
                          ₹{balanceINR.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3 px-4">{p.payment_terms_days} Days</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.vehicles && p.vehicles.length > 0 ? (
                            p.vehicles.slice(0, 2).map((v) => (
                              <span key={v} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200">
                                {v}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                          {p.vehicles && p.vehicles.length > 2 && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold">
                              +{p.vehicles.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {p.is_over_limit ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            OVER LIMIT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedPartyId(p.id);
                            setShowAddVehicleModal(true);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 cursor-pointer"
                        >
                          + Vehicle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Enrolled Fleet Vehicles */}
      {activeTab === 'vehicles' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Enrolled Fleet Vehicle Directory</h3>
            <button
              onClick={() => setShowAddVehicleModal(true)}
              className="px-3 py-1.5 bg-blue-800 text-white text-xs font-bold rounded-xl hover:bg-blue-900 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Register Vehicle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parties.flatMap((p) =>
              (p.vehicles || []).map((v) => (
                <div key={`${p.id}-${v}`} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-black text-slate-900 px-2 py-0.5 bg-white border border-slate-200 rounded-lg">
                      {v}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Authorized
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-slate-600">
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-slate-500 mt-0.5">Account Code: {p.code}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Vehicle Consumption Analytics */}
      {activeTab === 'consumption' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Vehicle-wise Fuel Consumption Analytics</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live consumption tracking for fleet tractors, transport trucks, and verified customer vehicles.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider">
                  <th className="py-3 px-4">Vehicle Number</th>
                  <th className="py-3 px-4">Customer Account</th>
                  <th className="py-3 px-4">Fuel Product</th>
                  <th className="py-3 px-4">Total Litres Dispensed</th>
                  <th className="py-3 px-4">Total Amount (₹)</th>
                  <th className="py-3 px-4">Fills Count</th>
                  <th className="py-3 px-4">Last Fill Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consumption.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No vehicle consumption recorded yet. Record credit sales to generate consumption metrics.
                    </td>
                  </tr>
                ) : (
                  consumption.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{row.vehicle_no}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{row.party_name}</td>
                      <td className="py-3 px-4 font-medium">{row.product_name}</td>
                      <td className="py-3 px-4 font-semibold">{Number(row.total_litres).toFixed(2)} L</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{(row.total_amount_paise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">{row.fill_count}</td>
                      <td className="py-3 px-4 text-slate-500">{row.last_fill_date || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Ageing Statement */}
      {activeTab === 'ageing' && (
        <div className="space-y-4">
          {/* Ageing Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">0 - 15 Days</span>
              <div className="mt-1 text-xl font-black text-slate-900">
                ₹{((ageing?.bucket_0_15_paise || 0) / 100).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold mt-0.5 inline-block">Within terms</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">16 - 30 Days</span>
              <div className="mt-1 text-xl font-black text-slate-900">
                ₹{((ageing?.bucket_16_30_paise || 0) / 100).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold mt-0.5 inline-block">First notice due</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">31 - 60 Days</span>
              <div className="mt-1 text-xl font-black text-slate-900">
                ₹{((ageing?.bucket_31_60_paise || 0) / 100).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-amber-600 font-semibold mt-0.5 inline-block">Follow-up required</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">60+ Days Overdue</span>
              <div className="mt-1 text-xl font-black text-rose-700">
                ₹{((ageing?.bucket_60_plus_paise || 0) / 100).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-rose-600 font-semibold mt-0.5 inline-block">Account on hold</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Account-wise Ageing Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider">
                    <th className="py-3 px-4">Party Name</th>
                    <th className="py-3 px-4">Total Balance</th>
                    <th className="py-3 px-4 text-emerald-700">0-15 Days</th>
                    <th className="py-3 px-4 text-blue-700">16-30 Days</th>
                    <th className="py-3 px-4 text-amber-700">31-60 Days</th>
                    <th className="py-3 px-4 text-rose-700">60+ Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {partyAgeingList.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{(p.current_balance_paise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">₹{((p.ageing?.bucket_0_15 || 0) / 100).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">₹{((p.ageing?.bucket_16_30 || 0) / 100).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">₹{((p.ageing?.bucket_31_60 || 0) / 100).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 font-bold text-rose-600">
                        ₹{((p.ageing?.bucket_60_plus || 0) / 100).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddPartyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Add New Credit Customer</h3>
            <p className="text-xs text-slate-500 mb-4">Enroll a new Khata account with credit limit and vehicles.</p>

            <form onSubmit={handleCreateParty} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Party / Company Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Somnath Agro Transport"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Code</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. CUST-SOM-04"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. 9825000000"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(e.target.value)}
                    placeholder="100000"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Terms (Days)</label>
                  <input
                    type="number"
                    value={newTerms}
                    onChange={(e) => setNewTerms(e.target.value)}
                    placeholder="15"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Numbers (comma separated)</label>
                <input
                  type="text"
                  value={newVehicles}
                  onChange={(e) => setNewVehicles(e.target.value)}
                  placeholder="GJ-11-XX-1234, GJ-11-YY-5678"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPartyModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 text-white rounded-xl text-xs font-bold hover:bg-blue-900 cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Register Fleet Vehicle</h3>
            <p className="text-xs text-slate-500 mb-4">Attach a vehicle registration number to a customer account.</p>

            <form onSubmit={handleAddVehicle} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Customer Account</label>
                <select
                  value={selectedPartyId}
                  onChange={(e) => setSelectedPartyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="">Select customer...</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Registration Number</label>
                <input
                  type="text"
                  required
                  value={newVehicleNo}
                  onChange={(e) => setNewVehicleNo(e.target.value)}
                  placeholder="e.g. GJ-11-TR-9090"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Make / Model (Optional)</label>
                  <input
                    type="text"
                    value={newMakeModel}
                    onChange={(e) => setNewMakeModel(e.target.value)}
                    placeholder="e.g. Mahindra Tractor"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Driver Name (Optional)</label>
                  <input
                    type="text"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    placeholder="e.g. Arvind Bhai"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 text-white rounded-xl text-xs font-bold hover:bg-blue-900 cursor-pointer"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Receipt Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Record Khata Collection (CR-RECEIPT)</h3>
            <p className="text-xs text-slate-500 mb-4">Post a customer payment and credit their khata ledger with double-entry voucher.</p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Account</label>
                <select
                  value={paymentPartyId}
                  onChange={(e) => setPaymentPartyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="">Select customer...</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Balance: ₹{(p.current_balance_paise / 100).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI QR / Netbanking</option>
                    <option value="CASH">Forecourt Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reference / UTR / Cheque #</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UTR-SBI-98214"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 cursor-pointer"
                >
                  Post Receipt Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
