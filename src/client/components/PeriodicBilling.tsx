import React, { useState, useEffect } from 'react';
import {
  Receipt,
  FileText,
  CreditCard,
  ShoppingCart,
  PlusCircle,
  Calendar,
  CheckCircle,
  Printer,
  ChevronDown,
  ChevronRight,
  Package,
} from 'lucide-react';

interface UnbilledSale {
  id: string;
  party_id: string;
  party_name: string;
  vehicle_no: string;
  product_name: string;
  litres: number;
  rate_paise: number;
  total_amount_paise: number;
  slip_no: string;
  created_at: string;
}

interface InvoiceItem {
  id: string;
  vehicle_no: string;
  product_name: string;
  litres: number;
  rate_paise: number;
  amount_paise: number;
}

interface CustomerInvoice {
  id: string;
  party_name: string;
  party_code: string;
  invoice_number: string;
  billing_cycle: string;
  from_date: string;
  to_date: string;
  total_litres: number;
  grand_total_paise: number;
  status: string;
  created_at: string;
  items: InvoiceItem[];
}

export const PeriodicBilling: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'invoices' | 'counter_pos'>('generate');
  const [unbilledSales, setUnbilledSales] = useState<UnbilledSale[]>([]);
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Periodic Generation Form
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [cycleType, setCycleType] = useState('FORTNIGHTLY');
  const [cycleFrom, setCycleFrom] = useState('2026-10-01');
  const [cycleTo, setCycleTo] = useState(new Date().toISOString().split('T')[0]);

  // Counter POS form
  const [lubeCustomer, setLubeCustomer] = useState('');
  const [lubeCategory, setLubeCategory] = useState('LUBRICANT');
  const [lubeProduct, setLubeProduct] = useState('Servo Pride 15W-40 (5L Can)');
  const [lubeQty, setLubeQty] = useState('1');
  const [lubeUnitPrice, setLubeUnitPrice] = useState('1850');
  const [lubeTender, setLubeTender] = useState('UPI');

  const loadData = async () => {
    setLoading(true);
    try {
      const [unbilledRes, invRes] = await Promise.all([
        fetch('/api/v1/billing/unbilled-sales'),
        fetch('/api/v1/billing/invoices'),
      ]);

      if (unbilledRes.ok) {
        const data = await unbilledRes.json();
        setUnbilledSales(data.unbilledSales || []);
      }
      if (invRes.ok) {
        const data = await invRes.json();
        setInvoices(data.invoices || []);
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

  const handleToggleSale = (saleId: string) => {
    setSelectedSaleIds((prev) =>
      prev.includes(saleId) ? prev.filter((id) => id !== saleId) : [...prev, saleId]
    );
  };

  const handleSelectAllPartySales = (partyId: string) => {
    const partySales = unbilledSales.filter((s) => s.party_id === partyId).map((s) => s.id);
    setSelectedSaleIds((prev) => Array.from(new Set([...prev, ...partySales])));
  };

  const handleGenerateInvoice = async () => {
    if (!selectedPartyId || selectedSaleIds.length === 0) {
      alert('Please select a customer and at least one unbilled sale slip.');
      return;
    }

    try {
      const res = await fetch('/api/v1/billing/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_gadhiya',
          party_id: selectedPartyId,
          billing_cycle: cycleType,
          from_date: cycleFrom,
          to_date: cycleTo,
          sale_ids: selectedSaleIds,
        }),
      });

      if (res.ok) {
        setSelectedSaleIds([]);
        loadData();
        setActiveTab('invoices');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCounterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lubeProduct || !lubeQty || !lubeUnitPrice) return;

    try {
      const res = await fetch('/api/v1/billing/counter-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_gadhiya',
          customer_name: lubeCustomer || 'Forecourt Walk-in Customer',
          product_category: lubeCategory,
          product_name: lubeProduct,
          quantity: Number(lubeQty),
          unit_price_paise: Math.round(Number(lubeUnitPrice) * 100),
          tender_mode: lubeTender,
        }),
      });

      if (res.ok) {
        alert('Spot POS Counter Bill generated and balanced sales voucher posted!');
        setLubeCustomer('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group unbilled sales by party
  const partyMap: Record<string, { party_name: string; sales: UnbilledSale[] }> = {};
  for (const s of unbilledSales) {
    if (!partyMap[s.party_id]) {
      partyMap[s.party_id] = { party_name: s.party_name, sales: [] };
    }
    partyMap[s.party_id].sales.push(s);
  }

  const selectedTotalPaise = unbilledSales
    .filter((s) => selectedSaleIds.includes(s.id))
    .reduce((acc, s) => acc + s.total_amount_paise, 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-800 border border-orange-200">
              <Receipt className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Periodic Credit Billing & Counter POS (P0/P1)
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Batch unbilled credit slips into formal weekly/monthly customer invoices and generate spot counter sales for lubricants.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('counter_pos')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer self-start md:self-auto"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Spot Counter Sale (Lubes/DEF)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'generate'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Unbilled Slips & Batch Invoice ({unbilledSales.length})
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'invoices'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Issued Customer Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('counter_pos')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'counter_pos'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Packaged Lubes & DEF Counter POS
        </button>
      </div>

      {/* Tab 1: Unbilled Slips & Batch Invoice */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Unbilled Slips by Customer */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Eligible Unbilled Forecourt Slips</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select slips to batch into a consolidated periodic statement invoice.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {selectedSaleIds.length} of {unbilledSales.length} selected
              </span>
            </div>

            {Object.keys(partyMap).length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                All credit sales have been invoiced! Record new credit slips in the forecourt shift to generate billing items.
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(partyMap).map(([pId, partyGroup]) => (
                  <div key={pId} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-slate-50/80 p-3 flex items-center justify-between border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{partyGroup.party_name}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">({partyGroup.sales.length} unbilled slips)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPartyId(pId);
                            handleSelectAllPartySales(pId);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
                        >
                          Select All Slips
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {partyGroup.sales.map((sale) => {
                        const isSelected = selectedSaleIds.includes(sale.id);
                        return (
                          <div
                            key={sale.id}
                            onClick={() => {
                              setSelectedPartyId(sale.party_id);
                              handleToggleSale(sale.id);
                            }}
                            className={`p-3 flex items-center justify-between text-xs cursor-pointer transition ${
                              isSelected ? 'bg-blue-50/50 text-blue-950' : 'hover:bg-slate-50/60 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-blue-800 focus:ring-0 cursor-pointer"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-900">{sale.slip_no}</span>
                                  <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                    {sale.vehicle_no || 'Unspecified'}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500">{sale.product_name} • {sale.litres} L @ ₹{(sale.rate_paise / 100).toFixed(2)}</span>
                              </div>
                            </div>

                            <span className="font-black text-slate-900">
                              ₹{(sale.total_amount_paise / 100).toLocaleString('en-IN')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Batch Invoice Preview & Generator */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Invoice Generation Batch</h3>
                <p className="text-xs text-slate-500 mt-0.5">Formalized statement for selected customer</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Billing Cycle</label>
                <select
                  value={cycleType}
                  onChange={(e) => setCycleType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="WEEKLY">Weekly Cycle</option>
                  <option value="FORTNIGHTLY">Fortnightly Cycle (1st-15th / 16th-End)</option>
                  <option value="MONTHLY">Monthly Cycle</option>
                  <option value="AD_HOC">Ad-Hoc / Custom Range</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={cycleFrom}
                    onChange={(e) => setCycleFrom(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={cycleTo}
                    onChange={(e) => setCycleTo(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected Slips:</span>
                  <span className="font-bold text-slate-900">{selectedSaleIds.length}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Total Invoice Amount:</span>
                  <span className="font-black text-blue-900">
                    ₹{(selectedTotalPaise / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateInvoice}
              disabled={selectedSaleIds.length === 0}
              className="w-full py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              Generate Periodic Invoice Memo
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Issued Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Issued Periodic Customer Invoices</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official billing memos with vehicle breakdown and itemized slip references.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{invoices.length} invoices issued</span>
          </div>

          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No periodic invoices generated yet. Batch unbilled credit slips to issue your first invoice memo.
              </div>
            ) : (
              invoices.map((inv) => {
                const isExpanded = expandedInvoiceId === inv.id;
                return (
                  <div key={inv.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div
                      onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
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
                            <span className="font-mono text-xs font-black text-slate-900">{inv.invoice_number}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
                              {inv.billing_cycle}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Customer: <strong className="text-slate-900">{inv.party_name}</strong> • Period: {inv.from_date} to {inv.to_date}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900">
                          ₹{(inv.grand_total_paise / 100).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[11px] text-slate-500 font-semibold">{inv.total_litres.toFixed(2)} Litres</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-700">Itemized Fuel Slips Breakdown</h4>
                          <button
                            onClick={() => window.print()}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 rounded-lg border border-slate-200 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print Memo</span>
                          </button>
                        </div>

                        <table className="w-full text-left text-xs text-slate-700">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                              <th className="py-2 px-3">Vehicle #</th>
                              <th className="py-2 px-3">Product</th>
                              <th className="py-2 px-3 text-right">Litres</th>
                              <th className="py-2 px-3 text-right">Rate (₹/L)</th>
                              <th className="py-2 px-3 text-right">Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {inv.items.map((item) => (
                              <tr key={item.id}>
                                <td className="py-2 px-3 font-mono font-bold">{item.vehicle_no}</td>
                                <td className="py-2 px-3">{item.product_name}</td>
                                <td className="py-2 px-3 text-right font-semibold">{item.litres.toFixed(2)}</td>
                                <td className="py-2 px-3 text-right font-mono">₹{(item.rate_paise / 100).toFixed(2)}</td>
                                <td className="py-2 px-3 text-right font-bold text-slate-900">
                                  ₹{(item.amount_paise / 100).toLocaleString('en-IN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Counter POS for Lubes & Packaged Products */}
      {activeTab === 'counter_pos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                Spot POS
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Counter Sales POS</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant billing for packaged lubricants, engine oils, DEF/AdBlue, and accessories.
              </p>
            </div>

            <form onSubmit={handleCounterSale} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name (Optional)</label>
                <input
                  type="text"
                  value={lubeCustomer}
                  onChange={(e) => setLubeCustomer(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Category</label>
                <select
                  value={lubeCategory}
                  onChange={(e) => setLubeCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="LUBRICANT">Servo Lubricants / Engine Oil</option>
                  <option value="DEF_ADBLUE">Diesel Exhaust Fluid (DEF / AdBlue)</option>
                  <option value="GREASE">Automotive Grease & Coolants</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product / Pack Size</label>
                <select
                  value={lubeProduct}
                  onChange={(e) => {
                    setLubeProduct(e.target.value);
                    if (e.target.value.includes('Pride')) setLubeUnitPrice('1850');
                    else if (e.target.value.includes('Super')) setLubeUnitPrice('420');
                    else if (e.target.value.includes('AdBlue')) setLubeUnitPrice('650');
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="Servo Pride 15W-40 (5L Can)">Servo Pride 15W-40 (5L Can) - ₹1,850</option>
                  <option value="Servo 4T Super 20W-40 (1L)">Servo 4T Super 20W-40 (1L Bottle) - ₹420</option>
                  <option value="Indian Oil ClearBlue DEF (20L Bucket)">ClearBlue DEF / AdBlue (20L) - ₹650</option>
                  <option value="Servo Grease MP (1 Kg Tub)">Servo Grease MP (1 Kg Tub) - ₹290</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={lubeQty}
                    onChange={(e) => setLubeQty(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={lubeUnitPrice}
                    onChange={(e) => setLubeUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Tender</label>
                <select
                  value={lubeTender}
                  onChange={(e) => setLubeTender(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="UPI">UPI QR / Netbanking</option>
                  <option value="CASH">Forecourt Cash</option>
                  <option value="CARD">POS Debit/Credit Card</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer mt-2"
              >
                Complete Sale & Print POS Slip
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Packaged Goods Inventory Overview</h3>
              <div className="space-y-3">
                <div className="p-3 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Servo Pride 15W-40 (5L)</span>
                    <span className="text-slate-500">Stock: 24 Cans in storeroom</span>
                  </div>
                  <span className="font-black text-slate-900">₹1,850</span>
                </div>
                <div className="p-3 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">ClearBlue DEF (20L Bucket)</span>
                    <span className="text-slate-500">Stock: 35 Buckets</span>
                  </div>
                  <span className="font-black text-slate-900">₹650</span>
                </div>
                <div className="p-3 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Servo 4T Super 20W-40 (1L)</span>
                    <span className="text-slate-500">Stock: 48 Bottles</span>
                  </div>
                  <span className="font-black text-slate-900">₹420</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-4">
              Packaged lubricant inventory and sales are strictly isolated from bulk fuel tanks and automatically credited to Account 4020.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
