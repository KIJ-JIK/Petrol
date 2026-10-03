import React, { useState, useEffect } from 'react';
import { offlineStore } from '../offline/offline-store';
import {
  Fuel,
  Calculator,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  Coins,
  CreditCard,
  QrCode,
  Truck,
  ArrowRight,
} from 'lucide-react';

interface NozzleState {
  nozzle_id: string;
  nozzle_number: number;
  product_name: string;
  product_code: string;
  current_price_paise: number;
  dispenser_number: number;
  opening_reading: number;
  closing_reading: string;
  testing_litres: string;
  is_rollover: boolean;
  meter_max: number;
}

export const AttendantSurface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'readings' | 'tenders' | 'review'>('readings');
  const [shiftData, setShiftData] = useState<any>(null);
  const [nozzles, setNozzles] = useState<NozzleState[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tender Inputs
  const [denominations, setDenominations] = useState({
    count_500: 30,
    count_200: 20,
    count_100: 40,
    count_50: 10,
    count_20: 10,
    count_10: 10,
    coins: 40,
  });

  const [upiAmount, setUpiAmount] = useState('35000');
  const [cardAmount, setCardAmount] = useState('15000');
  const [creditAmount, setCreditAmount] = useState('12000');
  const [fleetAmount, setFleetAmount] = useState('0');
  const [expenseAmount, setExpenseAmount] = useState('200');
  const [cashDropAmount, setCashDropAmount] = useState('0');
  const [varianceReason, setVarianceReason] = useState('Forecourt round-off and change shortage');

  // Active Keypad Target
  const [focusedField, setFocusedField] = useState<{
    type: 'reading' | 'denom';
    id: string;
  } | null>(null);

  const fetchActiveShift = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/shifts/active');
      const data = await res.json();
      if (data.shift && data.nozzles) {
        setShiftData(data.shift);
        const initialNozzles: NozzleState[] = data.nozzles.map((n: any) => ({
          nozzle_id: n.id,
          nozzle_number: n.nozzle_number,
          product_name: n.product_name,
          product_code: n.product_code,
          current_price_paise: n.current_price_paise,
          dispenser_number: n.dispenser_number,
          opening_reading: n.last_reading,
          closing_reading: (n.last_reading + (n.product_code === 'MS' ? 245.5 : 380.2)).toFixed(2),
          testing_litres: '0',
          is_rollover: false,
          meter_max: n.meter_max || 9999999.99,
        }));
        setNozzles(initialNozzles);
      }
    } catch (err: any) {
      setErrorMsg('Failed to load shift data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveShift();
  }, []);

  const calculateNozzle = (n: NozzleState) => {
    const opening = Number(n.opening_reading) || 0;
    const closing = Number(n.closing_reading) || 0;
    const test = Number(n.testing_litres) || 0;
    let gross = 0;

    if (n.is_rollover) {
      gross = n.meter_max - opening + closing;
    } else {
      gross = Math.max(0, closing - opening);
    }
    gross = Math.round(gross * 100) / 100;
    const net = Math.round(Math.max(0, gross - test) * 100) / 100;
    const amountPaise = Math.round(net * n.current_price_paise);
    return { gross, net, amountPaise };
  };

  const totalSalesPaise = nozzles.reduce((acc, n) => acc + calculateNozzle(n).amountPaise, 0);
  const totalLitresSold = nozzles.reduce((acc, n) => acc + calculateNozzle(n).net, 0);

  const countedCashPaise =
    ((denominations.count_500 || 0) * 500 +
      (denominations.count_200 || 0) * 200 +
      (denominations.count_100 || 0) * 100 +
      (denominations.count_50 || 0) * 50 +
      (denominations.count_20 || 0) * 20 +
      (denominations.count_10 || 0) * 10 +
      (denominations.coins || 0)) *
    100;

  const actualCashPaise = countedCashPaise + Number(cashDropAmount || 0) * 100;

  const nonCashTendersPaise =
    Number(upiAmount || 0) * 100 +
    Number(cardAmount || 0) * 100 +
    Number(creditAmount || 0) * 100 +
    Number(fleetAmount || 0) * 100;

  const expectedCashPaise = totalSalesPaise - nonCashTendersPaise - Number(expenseAmount || 0) * 100;
  const cashVariancePaise = actualCashPaise - expectedCashPaise;
  const cashVarianceRupees = cashVariancePaise / 100;

  const handleKeypadPress = (val: string) => {
    if (!focusedField) return;

    if (focusedField.type === 'reading') {
      setNozzles((prev) =>
        prev.map((n) => {
          if (n.nozzle_id === focusedField.id) {
            let cur = n.closing_reading;
            if (val === 'DEL') cur = cur.slice(0, -1);
            else if (val === 'CLR') cur = '';
            else if (val === '.' && cur.includes('.')) return n;
            else cur = cur + val;
            return { ...n, closing_reading: cur };
          }
          return n;
        })
      );
    } else if (focusedField.type === 'denom') {
      const field = focusedField.id as keyof typeof denominations;
      let cur = String(denominations[field] || '');
      if (val === 'DEL') cur = cur.slice(0, -1);
      else if (val === 'CLR') cur = '0';
      else if (val !== '.') cur = cur === '0' ? val : cur + val;
      setDenominations((prev) => ({ ...prev, [field]: Number(cur) || 0 }));
    }
  };

  const handleSubmitClose = async () => {
    setSubmitting(true);
    setErrorMsg('');

    const payload = {
      user_id: 'usr_attendant_1',
      nozzles_data: nozzles.map((n) => ({
        nozzle_id: n.nozzle_id,
        opening_reading: n.opening_reading,
        closing_reading: Number(n.closing_reading),
        testing_litres: Number(n.testing_litres || 0),
        is_rollover: n.is_rollover,
        meter_max: n.meter_max,
        price_paise: n.current_price_paise,
      })),
      tender_data: {
        upi_amount_paise: Number(upiAmount || 0) * 100,
        card_amount_paise: Number(cardAmount || 0) * 100,
        credit_sales_amount_paise: Number(creditAmount || 0) * 100,
        fleet_amount_paise: Number(fleetAmount || 0) * 100,
        expense_from_cash_paise: Number(expenseAmount || 0) * 100,
        cash_drop_paise: Number(cashDropAmount || 0) * 100,
        denominations,
      },
      variance_reason: varianceReason,
      notes: 'Submitted via Attendant Forecourt PWA for SK Petroleum, Gadhiya',
    };

    if (offlineStore.getSimulatedOffline() || !navigator.onLine) {
      offlineStore.enqueue('SHIFT_SUBMIT_CLOSE', payload);
      setSubmitting(false);
      setSubmitSuccess(true);
      return;
    }

    try {
      const res = await fetch(`/api/v1/shifts/${shiftData.id}/submit-close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit shift close');

      setSubmitSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="w-6 h-6 border-2 border-blue-800 border-t-transparent rounded-full animate-spin mr-3"></div>
        Loading forecourt shift readings...
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Shift Close Submitted!</h2>
        <p className="text-sm text-slate-600">
          Your closing readings and tender reconciliation have been submitted to Manager{' '}
          <strong>Ramesh Sharma</strong> for approval.
        </p>
        <div className="bg-slate-50 p-4 rounded-2xl text-left space-y-1.5 text-xs border border-slate-200">
          <div className="flex justify-between text-slate-600">
            <span>Total Litres Sold:</span>
            <span className="font-bold text-slate-900">{totalLitresSold} L</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Total Sales Value:</span>
            <span className="font-bold text-blue-900 font-mono">₹{(totalSalesPaise / 100).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Counted Cash:</span>
            <span className="font-bold text-slate-900 font-mono">₹{(actualCashPaise / 100).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Net Variance:</span>
            <span className={`font-bold font-mono ${cashVarianceRupees >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
              ₹{cashVarianceRupees.toFixed(2)}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setSubmitSuccess(false);
            fetchActiveShift();
          }}
          className="w-full py-2.5 bg-blue-800 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition"
        >
          Return to Shift Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-16">
      {/* Shift Banner in Clean Light Theme */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-lg font-bold text-slate-900">
              Shift #{shiftData?.shift_number || 1} — Active Forecourt
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              {shiftData?.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Attendant: <strong>Raju Yadav</strong> • SK Petroleum (Indian Oil), Gadhiya • Date:{' '}
            {shiftData?.business_date}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Calculated Shift Sales</span>
            <span className="text-xl font-extrabold text-blue-900 font-mono">
              ₹{(totalSalesPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-right border-l border-slate-200 pl-4">
            <span className="text-xs text-slate-500 block">Total Volume</span>
            <span className="text-xl font-extrabold text-orange-600 font-mono">{totalLitresSold} L</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('readings')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'readings'
              ? 'bg-white text-blue-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Fuel className="w-4 h-4 text-blue-800" />
          <span>1. Nozzle Readings</span>
        </button>

        <button
          onClick={() => setActiveTab('tenders')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'tenders'
              ? 'bg-white text-orange-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coins className="w-4 h-4 text-orange-600" />
          <span>2. Cash & Tenders</span>
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'review'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4 text-emerald-700" />
          <span>3. Reconcile & Close</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: NOZZLE READINGS */}
      {activeTab === 'readings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {nozzles.map((n) => {
              const calc = calculateNozzle(n);
              const isSelected = focusedField?.id === n.nozzle_id;
              return (
                <div
                  key={n.nozzle_id}
                  onClick={() => setFocusedField({ type: 'reading', id: n.nozzle_id })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center text-xs font-extrabold">
                        #{n.nozzle_number}
                      </span>
                      <div>
                        <span className="text-sm font-bold text-slate-900">
                          MPD {n.dispenser_number} — {n.product_name}
                        </span>
                        <span
                          className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                            n.product_code === 'MS'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-orange-50 text-orange-800 border border-orange-200'
                          }`}
                        >
                          {n.product_code} @ ₹{(n.current_price_paise / 100).toFixed(2)}/L
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Sale Amount</span>
                      <span className="text-base font-extrabold text-blue-900 font-mono">
                        ₹{(calc.amountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Opening Totalizer</span>
                      <span className="font-mono text-slate-800 font-bold text-sm">
                        {n.opening_reading.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-blue-900 block text-[11px] font-bold">Closing Reading *</span>
                      <input
                        type="text"
                        readOnly
                        value={n.closing_reading}
                        className="w-full bg-slate-50 border border-blue-400 rounded-lg px-2 py-1 font-mono text-slate-900 font-extrabold text-sm focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Net Volume</span>
                      <span className="font-mono text-orange-600 font-extrabold text-sm">{calc.net} Litres</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 text-[11px] text-slate-500">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={n.is_rollover}
                        onChange={(e) => {
                          e.stopPropagation();
                          setNozzles((prev) =>
                            prev.map((item) =>
                              item.nozzle_id === n.nozzle_id ? { ...item, is_rollover: e.target.checked } : item
                            )
                          );
                        }}
                        className="rounded border-slate-300 text-blue-800 focus:ring-blue-500"
                      />
                      <span>Meter Rolled Over (0-loop)</span>
                    </label>

                    <div className="flex items-center gap-1">
                      <span>Testing Qty:</span>
                      <input
                        type="number"
                        value={n.testing_litres}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setNozzles((prev) =>
                            prev.map((item) =>
                              item.nozzle_id === n.nozzle_id ? { ...item, testing_litres: e.target.value } : item
                            )
                          )
                        }
                        className="w-12 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono text-xs text-slate-900"
                      />
                      <span>L</span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-2">
              <button
                onClick={() => setActiveTab('tenders')}
                className="w-full py-3 bg-blue-800 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Proceed to Cash & Tenders</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TOUCH NUMERIC KEYPAD IN LIGHT THEME */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-800" />
                Touch Numeric Keypad
              </span>
              <span className="text-[11px] text-slate-500">
                {focusedField ? `Editing #${focusedField.id.slice(-4)}` : 'Select a field'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeypadPress(key)}
                  className={`h-12 rounded-xl font-mono text-lg font-bold transition active:scale-95 flex items-center justify-center ${
                    key === 'DEL'
                      ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                      : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 shadow-xs'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleKeypadPress('CLR')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Clear Input
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: CASH & TENDERS */}
      {activeTab === 'tenders' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Denomination Counter */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Coins className="w-4 h-4 text-orange-600" />
                Physical Cash Denomination Count
              </h3>
              <span className="text-xs font-mono font-bold text-blue-900">
                ₹{(countedCashPaise / 100).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { label: '₹500 Notes', key: 'count_500', mult: 500 },
                { label: '₹200 Notes', key: 'count_200', mult: 200 },
                { label: '₹100 Notes', key: 'count_100', mult: 100 },
                { label: '₹50 Notes', key: 'count_50', mult: 50 },
                { label: '₹20 Notes', key: 'count_20', mult: 20 },
                { label: '₹10 Notes', key: 'count_10', mult: 10 },
                { label: 'Coins (Total ₹)', key: 'coins', mult: 1 },
              ].map((item) => {
                const count = denominations[item.key as keyof typeof denominations] || 0;
                const total = count * item.mult;
                return (
                  <div key={item.key} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-700 w-28">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs">×</span>
                      <input
                        type="number"
                        min="0"
                        value={count}
                        onChange={(e) =>
                          setDenominations((prev) => ({ ...prev, [item.key]: Number(e.target.value) || 0 }))
                        }
                        className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-right font-mono text-xs text-slate-900 font-bold"
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-900 w-24 text-right">
                      = ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Digital & Non-Cash Tenders */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <CreditCard className="w-4 h-4 text-blue-800" />
                Digital & Khata Tenders (₹)
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <QrCode className="w-3.5 h-3.5 text-blue-800" /> UPI (PhonePe / GPay / Paytm)
                  </span>
                  <input
                    type="number"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(e.target.value)}
                    className="w-28 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-right font-mono text-slate-900 font-bold text-xs"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-orange-600" /> POS Card Swipe
                  </span>
                  <input
                    type="number"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    className="w-28 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-right font-mono text-slate-900 font-bold text-xs"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Truck className="w-3.5 h-3.5 text-indigo-700" /> Customer Credit / Khata Slips
                  </span>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-28 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-right font-mono text-slate-900 font-bold text-xs"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Indian Oil XTRAPOWER Fleet Card</span>
                  <input
                    type="number"
                    value={fleetAmount}
                    onChange={(e) => setFleetAmount(e.target.value)}
                    className="w-28 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-right font-mono text-slate-900 font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Mid-shift drops & expenses */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
                Cash Drops & Expenses from Cash (₹)
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Cash Drops to Manager Safe</span>
                  <input
                    type="number"
                    value={cashDropAmount}
                    onChange={(e) => setCashDropAmount(e.target.value)}
                    className="w-28 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-right font-mono text-slate-900 font-bold text-xs"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Forecourt Operating Expenses</span>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-28 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-right font-mono text-slate-900 font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('review')}
              className="w-full py-3 bg-blue-800 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Review Reconciliation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: REVIEW & CLOSE */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-800" />
              Shift Balance & Variance Reconciliation
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Total Meter Sales</span>
                <span className="text-base font-extrabold text-slate-900 font-mono mt-1 block">
                  ₹{(totalSalesPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Digital & Credit</span>
                <span className="text-base font-extrabold text-blue-900 font-mono mt-1 block">
                  ₹{(nonCashTendersPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Expected Cash</span>
                <span className="text-base font-extrabold text-orange-600 font-mono mt-1 block">
                  ₹{(expectedCashPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Counted Cash + Drops</span>
                <span className="text-base font-extrabold text-emerald-700 font-mono mt-1 block">
                  ₹{(actualCashPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* VARIANCE HIGHLIGHT BOX IN LIGHT THEME */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                Math.abs(cashVarianceRupees) <= 200
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider block">
                  Net Cash Variance (Actual - Expected)
                </span>
                <p className="text-xs opacity-80 mt-0.5">
                  Tolerance threshold: ±₹200.00 • Shortage/excess requires manager review.
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black font-mono">
                  {cashVarianceRupees >= 0 ? `+₹${cashVarianceRupees.toFixed(2)}` : `-₹${Math.abs(cashVarianceRupees).toFixed(2)}`}
                </span>
                <span className="block text-[11px] font-bold">
                  {cashVarianceRupees === 0 ? 'Exact Match' : cashVarianceRupees > 0 ? 'Cash Excess' : 'Cash Shortage'}
                </span>
              </div>
            </div>

            {/* Explanation Input */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 block">Attendant Shift Note & Explanation</label>
              <textarea
                value={varianceReason}
                onChange={(e) => setVarianceReason(e.target.value)}
                placeholder="Explain any meter reset, coins shortage, or customer credit voucher specifics..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={2}
              />
            </div>

            {/* Submission Action */}
            <button
              onClick={handleSubmitClose}
              disabled={submitting}
              className="w-full py-3.5 bg-blue-800 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting Shift...' : 'Submit Shift Close for Manager Approval'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
