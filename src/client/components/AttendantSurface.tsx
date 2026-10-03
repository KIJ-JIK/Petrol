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
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  Sparkles,
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
  const [showMobileKeypad, setShowMobileKeypad] = useState(false);

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
    type: 'reading' | 'denom' | 'tender';
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

  // Validation function
  const validateShift = (): string | null => {
    // 1. Meter rollovers
    for (const n of nozzles) {
      const closing = Number(n.closing_reading) || 0;
      if (closing < n.opening_reading && !n.is_rollover) {
        return `Nozzle #${n.nozzle_number} (${n.product_name}): Closing reading (${closing}) is less than opening (${n.opening_reading.toFixed(2)}). Please check 'Meter Rolled Over' if meter wrapped around.`;
      }
      const calc = calculateNozzle(n);
      const test = Number(n.testing_litres) || 0;
      if (test > calc.gross) {
        return `Nozzle #${n.nozzle_number} (${n.product_name}): Testing litres (${test} L) cannot exceed gross dispensed litres (${calc.gross} L).`;
      }
    }

    // 2. Variance explanation requirement
    if (Math.abs(cashVarianceRupees) > 50 && !varianceReason.trim()) {
      return `Cash variance is ₹${cashVarianceRupees.toFixed(2)} (exceeds ±₹50.00 threshold). Please enter an explanatory note before submitting.`;
    }

    return null;
  };

  const handleSubmitClose = async () => {
    const validationError = validateShift();
    if (validationError) {
      setErrorMsg(validationError);
      setActiveTab(validationError.includes('Nozzle') ? 'readings' : 'review');
      return;
    }

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
      <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Shift Close Submitted!</h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Your closing readings and tender reconciliation have been recorded and sent to Manager{' '}
          <strong>Ramesh Sharma</strong> for approval.
        </p>

        <div className="bg-slate-50 p-4 rounded-2xl text-left space-y-2 text-xs border border-slate-200">
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
          <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200 text-[11px]">
            <span>Storage Status:</span>
            <span className="font-bold text-blue-800">
              {offlineStore.getSimulatedOffline() || !navigator.onLine ? 'Queued in Offline PWA Store' : 'Synced to Server Database'}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setSubmitSuccess(false);
            fetchActiveShift();
          }}
          className="w-full py-3 bg-blue-800 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-xs cursor-pointer"
        >
          Return to Forecourt
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-3.5 pb-20">
      {/* Shift Banner in Clean Light Theme */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Shift #{shiftData?.shift_number || 1} — Forecourt
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                {shiftData?.status}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Attendant: <strong>Raju Yadav</strong> • SK Petroleum, Gadhiya • {shiftData?.business_date}
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="text-left sm:text-right">
              <span className="text-[10px] sm:text-xs text-slate-500 block">Total Litres</span>
              <span className="text-lg sm:text-xl font-extrabold text-orange-600 font-mono">{totalLitresSold} L</span>
            </div>
            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-3">
              <span className="text-[10px] sm:text-xs text-slate-500 block">Calculated Sales</span>
              <span className="text-lg sm:text-xl font-extrabold text-blue-900 font-mono">
                ₹{(totalSalesPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation Tabs with Progress Indicators */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-200 text-center">
        <button
          onClick={() => setActiveTab('readings')}
          className={`py-2 px-1 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
            activeTab === 'readings'
              ? 'bg-white text-blue-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Fuel className="w-3.5 h-3.5 text-blue-800 shrink-0" />
          <span className="truncate">1. Readings</span>
        </button>

        <button
          onClick={() => setActiveTab('tenders')}
          className={`py-2 px-1 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
            activeTab === 'tenders'
              ? 'bg-white text-orange-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coins className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span className="truncate">2. Tenders</span>
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`py-2 px-1 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
            activeTab === 'review'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="truncate">3. Reconcile</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-start gap-2 shadow-2xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Validation Warning:</span> {errorMsg}
          </div>
        </div>
      )}

      {/* TAB 1: NOZZLE READINGS */}
      {activeTab === 'readings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {nozzles.map((n) => {
              const calc = calculateNozzle(n);
              const closingNum = Number(n.closing_reading) || 0;
              const isLowerWithoutRollover = closingNum < n.opening_reading && !n.is_rollover;
              const isTestingExcess = Number(n.testing_litres) > calc.gross;
              const isSelected = focusedField?.id === n.nozzle_id;

              return (
                <div
                  key={n.nozzle_id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isLowerWithoutRollover
                      ? 'bg-white border-red-300 ring-2 ring-red-400/20 shadow-xs'
                      : isSelected
                      ? 'bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center text-xs font-extrabold">
                        #{n.nozzle_number}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            MPD {n.dispenser_number} — {n.product_name}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                              n.product_code === 'MS'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-orange-50 text-orange-800 border border-orange-200'
                            }`}
                          >
                            {n.product_code}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          ₹{(n.current_price_paise / 100).toFixed(2)}/L
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Nozzle Amount</span>
                      <span className="text-sm sm:text-base font-extrabold text-blue-900 font-mono">
                        ₹{(calc.amountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Input Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-100 text-xs">
                    {/* Opening Totalizer (Read-Only baseline) */}
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Opening Reading</span>
                      <span className="font-mono text-slate-800 font-bold text-sm sm:text-base mt-0.5 block">
                        {n.opening_reading.toFixed(2)}
                      </span>
                    </div>

                    {/* Closing Reading: Mobile-First Direct Touch Input with Native Decimal Keypad */}
                    <div>
                      <span className="text-blue-900 block text-[10px] uppercase font-bold mb-1">
                        Closing Reading *
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.]?[0-9]*"
                        value={n.closing_reading}
                        onFocus={() => setFocusedField({ type: 'reading', id: n.nozzle_id })}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                            setNozzles((prev) =>
                              prev.map((item) =>
                                item.nozzle_id === n.nozzle_id ? { ...item, closing_reading: val } : item
                              )
                            );
                          }
                        }}
                        placeholder="0.00"
                        className={`w-full bg-white border rounded-xl px-3 py-2 font-mono text-slate-900 font-extrabold text-base focus:outline-none transition ${
                          isLowerWithoutRollover
                            ? 'border-red-400 bg-red-50/50 text-red-900 focus:ring-2 focus:ring-red-400/20'
                            : 'border-blue-400 focus:ring-2 focus:ring-blue-500/20'
                        }`}
                      />
                    </div>

                    {/* Calculated Net Litres */}
                    <div className="bg-orange-50/60 p-2 rounded-xl border border-orange-200">
                      <span className="text-orange-800 block text-[10px] uppercase font-bold">Net Volume</span>
                      <span className="font-mono text-orange-700 font-extrabold text-sm sm:text-base mt-0.5 block">
                        {calc.net} Litres
                      </span>
                    </div>
                  </div>

                  {/* Inline Rollover Warning Alert */}
                  {isLowerWithoutRollover && (
                    <div className="mt-2.5 p-2 bg-red-50 border border-red-200 rounded-xl text-red-800 text-[11px] flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        Closing reading ({closingNum}) is less than opening ({n.opening_reading.toFixed(2)}).
                      </span>
                      <button
                        onClick={() => {
                          setNozzles((prev) =>
                            prev.map((item) =>
                              item.nozzle_id === n.nozzle_id ? { ...item, is_rollover: true } : item
                            )
                          );
                        }}
                        className="px-2 py-0.5 bg-red-600 text-white rounded font-bold text-[10px] shrink-0 ml-2"
                      >
                        Set Rollover
                      </button>
                    </div>
                  )}

                  {/* Nozzle Footer: Rollover toggle & Testing Qty */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 text-[11px] text-slate-500">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={n.is_rollover}
                        onChange={(e) => {
                          setNozzles((prev) =>
                            prev.map((item) =>
                              item.nozzle_id === n.nozzle_id ? { ...item, is_rollover: e.target.checked } : item
                            )
                          );
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-blue-800 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-700">Meter Rolled Over (0-loop)</span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-600">Calibration Testing:</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={n.testing_litres}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                            setNozzles((prev) =>
                              prev.map((item) =>
                                item.nozzle_id === n.nozzle_id ? { ...item, testing_litres: val } : item
                              )
                            );
                          }
                        }}
                        className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-right font-mono text-xs font-bold text-slate-900"
                      />
                      <span>L</span>
                    </div>
                  </div>

                  {isTestingExcess && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">
                      ⚠️ Testing volume exceeds gross sales volume ({calc.gross} L).
                    </p>
                  )}
                </div>
              );
            })}

            {/* Mobile Keypad Toggle */}
            <div className="lg:hidden flex items-center justify-between bg-slate-100 p-2.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-600 font-medium">
                Prefer touch on-screen keypad?
              </span>
              <button
                onClick={() => setShowMobileKeypad(!showMobileKeypad)}
                className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-2xs flex items-center gap-1"
              >
                <Calculator className="w-3.5 h-3.5 text-blue-800" />
                <span>{showMobileKeypad ? 'Hide Keypad' : 'Open Keypad'}</span>
              </button>
            </div>

            {/* Collapsible Mobile Keypad */}
            {showMobileKeypad && (
              <div className="lg:hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                  <span className="font-bold text-slate-700">Touch Numeric Keypad</span>
                  <span className="text-[11px] text-blue-800 font-bold">
                    {focusedField ? `Target: #${focusedField.id.slice(-4)}` : 'Select a field above'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleKeypadPress(key)}
                      className={`h-11 rounded-xl font-mono text-base font-bold transition active:scale-95 flex items-center justify-center ${
                        key === 'DEL'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 shadow-xs'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Desktop Proceed Button */}
            <div className="pt-2 hidden md:block">
              <button
                onClick={() => setActiveTab('tenders')}
                className="w-full py-3 bg-blue-800 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Proceed to Cash & Tenders</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DESKTOP SIDEBAR KEYPAD (hidden on mobile, visible on lg:) */}
          <div className="hidden lg:block bg-white p-4 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-3 sticky top-[130px]">
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
                  className={`h-12 rounded-xl font-mono text-lg font-bold transition active:scale-95 flex items-center justify-center cursor-pointer ${
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
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
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
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Coins className="w-4 h-4 text-orange-600" />
                Forecourt Cash Denominations
              </h3>
              <span className="text-sm font-mono font-bold text-blue-900">
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
                  <div
                    key={item.key}
                    className="flex items-center justify-between bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-100"
                  >
                    <span className="font-semibold text-slate-700 w-24 sm:w-28 text-xs">{item.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-xs">×</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={count}
                        onFocus={() => setFocusedField({ type: 'denom', id: item.key })}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[0-9]*$/.test(val)) {
                            setDenominations((prev) => ({
                              ...prev,
                              [item.key]: Number(val) || 0,
                            }));
                          }
                        }}
                        className="w-16 sm:w-20 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-right font-mono text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-900 w-20 sm:w-24 text-right text-xs sm:text-sm">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Digital & Non-Cash Tenders */}
          <div className="space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <CreditCard className="w-4 h-4 text-blue-800" />
                Digital & Khata Tenders (₹)
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <QrCode className="w-3.5 h-3.5 text-blue-800" /> UPI (PhonePe / GPay)
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={upiAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[0-9]*\.?[0-9]*$/.test(val)) setUpiAmount(val);
                    }}
                    className="w-28 sm:w-32 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-right font-mono text-slate-900 font-bold text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-orange-600" /> POS Card Swipe
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cardAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[0-9]*\.?[0-9]*$/.test(val)) setCardAmount(val);
                    }}
                    className="w-28 sm:w-32 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-right font-mono text-slate-900 font-bold text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Truck className="w-3.5 h-3.5 text-indigo-700" /> Customer Khata Slips
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={creditAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[0-9]*\.?[0-9]*$/.test(val)) setCreditAmount(val);
                    }}
                    className="w-28 sm:w-32 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-right font-mono text-slate-900 font-bold text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">IOCL XTRAPOWER Fleet</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fleetAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[0-9]*\.?[0-9]*$/.test(val)) setFleetAmount(val);
                    }}
                    className="w-28 sm:w-32 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-right font-mono text-slate-900 font-bold text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Mid-shift drops & expenses */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
                Cash Drops & Expenses from Cash (₹)
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Cash Drops to Safe</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cashDropAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[0-9]*\.?[0-9]*$/.test(val)) setCashDropAmount(val);
                    }}
                    className="w-28 sm:w-32 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-right font-mono text-slate-900 font-bold text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Forecourt Petty Expenses</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={expenseAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[0-9]*\.?[0-9]*$/.test(val)) setExpenseAmount(val);
                    }}
                    className="w-28 sm:w-32 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-right font-mono text-slate-900 font-bold text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Desktop Proceed Button */}
            <div className="hidden md:block">
              <button
                onClick={() => setActiveTab('review')}
                className="w-full py-3 bg-blue-800 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Review Reconciliation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REVIEW & CLOSE */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-800" />
              Shift Balance & Variance Reconciliation
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Sales</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono mt-1 block">
                  ₹{(totalSalesPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Digital / Khata</span>
                <span className="text-sm sm:text-base font-extrabold text-blue-900 font-mono mt-1 block">
                  ₹{(nonCashTendersPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Expected Cash</span>
                <span className="text-sm sm:text-base font-extrabold text-orange-600 font-mono mt-1 block">
                  ₹{(expectedCashPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Counted Cash</span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono mt-1 block">
                  ₹{(actualCashPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* VARIANCE HIGHLIGHT BOX */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between ${
                Math.abs(cashVarianceRupees) <= 50
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider block">
                  Net Cash Variance
                </span>
                <p className="text-[11px] opacity-80 mt-0.5">
                  IOCL Forecourt tolerance: ±₹50.00
                </p>
              </div>

              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black font-mono">
                  {cashVarianceRupees >= 0
                    ? `+₹${cashVarianceRupees.toFixed(2)}`
                    : `-₹${Math.abs(cashVarianceRupees).toFixed(2)}`}
                </span>
                <span className="block text-[10px] font-bold">
                  {cashVarianceRupees === 0 ? 'Exact Match' : cashVarianceRupees > 0 ? 'Cash Excess' : 'Cash Shortage'}
                </span>
              </div>
            </div>

            {/* Explanation Input */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>Attendant Shift Explanation</span>
                {Math.abs(cashVarianceRupees) > 50 && (
                  <span className="text-amber-700 text-[10px] font-extrabold">Required (Variance &gt; ±₹50)</span>
                )}
              </label>
              <textarea
                value={varianceReason}
                onChange={(e) => setVarianceReason(e.target.value)}
                placeholder="Explain any meter calibration, coins shortage, or customer credit voucher specifics..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={2}
              />
            </div>

            {/* Desktop Submission Action */}
            <div className="hidden md:block">
              <button
                onClick={handleSubmitClose}
                disabled={submitting}
                className="w-full py-3.5 bg-blue-800 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting Shift...' : 'Submit Shift Close for Manager Approval'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY MOBILE BOTTOM ACTION BAR */}
      <div className="md:hidden fixed bottom-[52px] left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-lg flex items-center justify-between gap-3">
        <div className="text-left">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Shift Sales</span>
          <span className="text-sm font-extrabold text-blue-900 font-mono">
            ₹{(totalSalesPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeTab !== 'readings' && (
            <button
              onClick={() => setActiveTab(activeTab === 'review' ? 'tenders' : 'readings')}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {activeTab === 'readings' && (
            <button
              onClick={() => setActiveTab('tenders')}
              className="px-4 py-2.5 bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <span>Next: Tenders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {activeTab === 'tenders' && (
            <button
              onClick={() => setActiveTab('review')}
              className="px-4 py-2.5 bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <span>Next: Reconcile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {activeTab === 'review' && (
            <button
              onClick={handleSubmitClose}
              disabled={submitting}
              className="px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Close'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
