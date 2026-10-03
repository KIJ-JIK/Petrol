import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Fuel,
  IndianRupee,
  Coins,
  Truck,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  BarChart3,
  Calendar,
} from 'lucide-react';

export const OwnerSurface: React.FC = () => {
  const [dsr, setDsr] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDsr = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/reports/dsr');
      const data = await res.json();
      setDsr(data);

      const shiftRes = await fetch('/api/v1/shifts/history');
      const shiftData = await shiftRes.json();
      setShifts(shiftData.shifts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDsr();
  }, []);

  if (loading || !dsr) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mr-3"></div>
        Loading owner business intelligence...
      </div>
    );
  }

  const grossSalesRupees = dsr.total_revenue_paise / 100;
  const cashVarianceRupees = (dsr.tenders?.total_variance_paise || 0) / 100;
  const khataOutstandingRupees = (dsr.khata_outstanding_paise || 0) / 100;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-16">
      {/* Top Banner in Light Theme */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Executive Owner Dashboard</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
              Partner & Dealer View
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Outlet: <strong>SK Petroleum (Indian Oil), Gadhiya</strong> • Real-time operational close & financial health
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold">
          <Calendar className="w-4 h-4 text-orange-600" />
          <span>Business Date: <strong>{dsr.business_date}</strong></span>
        </div>
      </div>

      {/* KPI METRIC CARDS IN CLEAN LIGHT THEME */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Litres Sold */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider">Fuel Volume Sold</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{dsr.total_litres.toLocaleString()}</span>
            <span className="text-xs font-bold text-blue-900">Litres</span>
          </div>
          <p className="text-[11px] text-slate-500">Total volume across MS, HSD & XP95</p>
        </div>

        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider">Gross Sales Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              ₹{grossSalesRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Shift sales posted to revenue ledger</p>
        </div>

        {/* Cash Variance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider">Cash Over / Short</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                cashVarianceRupees >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-black font-mono ${
                cashVarianceRupees >= 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {cashVarianceRupees >= 0 ? `+₹${cashVarianceRupees.toFixed(2)}` : `-₹${Math.abs(cashVarianceRupees).toFixed(2)}`}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {cashVarianceRupees >= 0 ? 'Cash matched perfectly' : 'Minor coins change variance'}
          </p>
        </div>

        {/* Khata Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider">Khata Credit Due</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-orange-700 font-mono">
              ₹{khataOutstandingRupees.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Total customer receivables outstanding</p>
        </div>
      </div>

      {/* MIDDLE SECTION: Product Sales & Tender Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product Sales Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Fuel className="w-4 h-4 text-blue-800" />
            Product Sales & Volume Breakdown
          </h3>

          <div className="space-y-3">
            {dsr.sales_by_product?.map((prod: any) => {
              const amountRupees = prod.total_amount_paise / 100;
              const rateRupees = prod.current_price_paise / 100;
              const pct = dsr.total_litres > 0 ? Math.round((prod.total_litres / dsr.total_litres) * 100) : 0;

              return (
                <div key={prod.product_id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{prod.product_name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-700">
                        ₹{rateRupees.toFixed(2)}/L
                      </span>
                    </div>
                    <span className="font-mono font-bold text-blue-900">
                      ₹{amountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{prod.total_litres.toLocaleString()} Litres sold</span>
                    <span className="font-semibold">{pct}% of day volume</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${prod.product_code === 'MS' ? 'bg-blue-800' : 'bg-orange-600'}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tender Collection Mix */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Coins className="w-4 h-4 text-orange-600" />
            Tender Collection & Settlement Mix
          </h3>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">UPI Collections</span>
              <span className="font-mono font-bold text-blue-900 text-base mt-1 block">
                ₹{((dsr.tenders?.total_upi_paise || 0) / 100).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400">PhonePe / GPay QR</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Physical Cash Counted</span>
              <span className="font-mono font-bold text-slate-900 text-base mt-1 block">
                ₹{((dsr.tenders?.total_cash_paise || 0) / 100).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400">Safe deposits & forecourt</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">POS Card Swipes</span>
              <span className="font-mono font-bold text-orange-700 text-base mt-1 block">
                ₹{((dsr.tenders?.total_card_paise || 0) / 100).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400">Credit / Debit terminals</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Customer Credit Slips</span>
              <span className="font-mono font-bold text-indigo-700 text-base mt-1 block">
                ₹{((dsr.tenders?.total_credit_paise || 0) / 100).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400">Khata receivable</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Station Petty Expenses Paid:</span>
            <span className="font-mono font-bold text-red-600">
              -₹{((dsr.tenders?.total_expense_paise || 0) / 100).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* TANK STOCK & PHYSICAL VARIANCE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
          <Truck className="w-4 h-4 text-blue-800" />
          Tank Stock Cover & Dip Variances
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dsr.tanks?.map((tank: any) => (
            <div key={tank.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">{tank.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    tank.variance?.variance_litres >= 0
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  Variance: {tank.variance?.variance_litres >= 0 ? `+${tank.variance?.variance_litres}` : tank.variance?.variance_litres} L
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Current Dip</span>
                  <span className="font-mono font-bold text-slate-900">{tank.current_dip_mm} mm</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Dip Volume</span>
                  <span className="font-mono font-bold text-slate-900">{tank.current_dip_litres.toLocaleString()} L</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Book Stock</span>
                  <span className="font-mono font-bold text-blue-900">{tank.current_book_litres.toLocaleString()} L</span>
                </div>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-800 h-2 rounded-full"
                  style={{ width: `${Math.round((tank.current_book_litres / tank.capacity_litres) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
