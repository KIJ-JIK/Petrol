import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  CheckCircle,
  Clock,
  IndianRupee,
  PlusCircle,
  FileCheck,
  Shield,
  CreditCard,
} from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  phone: string;
  role: string;
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  staff_name: string;
  staff_role: string;
  date: string;
  shift_number: number;
  status: string;
  notes: string;
}

interface AdvanceRecord {
  id: string;
  user_id: string;
  staff_name: string;
  staff_role: string;
  amount_paise: number;
  date: string;
  reason: string;
  status: string;
  recovered_amount_paise: number;
}

interface MonthlyPayrollItem {
  user_id: string;
  name: string;
  role: string;
  base_salary_paise: number;
  present_days: number;
  half_days: number;
  absent_days: number;
  pending_advance_paise: number;
  advance_deducted_paise: number;
  net_payable_paise: number;
  status: string;
}

export const StaffPayroll: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'advances' | 'payroll'>('attendance');
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [advances, setAdvances] = useState<AdvanceRecord[]>([]);
  const [payroll, setPayroll] = useState<MonthlyPayrollItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Mark attendance modal
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [attUser, setAttUser] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStatus, setAttStatus] = useState('PRESENT');
  const [attNotes, setAttNotes] = useState('');

  // Disburse advance modal
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advUser, setAdvUser] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [advReason, setAdvReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffRes, attRes, advRes, payRes] = await Promise.all([
        fetch('/api/v1/payroll/staff'),
        fetch('/api/v1/payroll/attendance'),
        fetch('/api/v1/payroll/advances'),
        fetch('/api/v1/payroll/monthly'),
      ]);

      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaff(data.staff || []);
      }
      if (attRes.ok) {
        const data = await attRes.json();
        setAttendance(data.attendance || []);
      }
      if (advRes.ok) {
        const data = await advRes.json();
        setAdvances(data.advances || []);
      }
      if (payRes.ok) {
        const data = await payRes.json();
        setPayroll(data.payroll || []);
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

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attUser || !attDate) return;

    try {
      const res = await fetch('/api/v1/payroll/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: attUser,
          date: attDate,
          shift_number: 1,
          status: attStatus,
          notes: attNotes,
        }),
      });

      if (res.ok) {
        setShowMarkModal(false);
        setAttNotes('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisburseAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advUser || !advAmount || !advReason) return;

    try {
      const res = await fetch('/api/v1/payroll/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: advUser,
          amount_paise: Math.round(Number(advAmount) * 100),
          reason: advReason,
          paid_from: 'CASH',
        }),
      });

      if (res.ok) {
        setShowAdvanceModal(false);
        setAdvAmount('');
        setAdvReason('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalAdvancesINR = advances.reduce((acc, a) => acc + (a.amount_paise - a.recovered_amount_paise), 0) / 100;
  const totalPayrollPayableINR = payroll.reduce((acc, p) => acc + p.net_payable_paise, 0) / 100;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-200">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Staff Attendance & Payroll Engine
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Forecourt shift muster roll, cash advance disbursement with double-entry vouchers, and monthly salary reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAdvanceModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Disburse Cash Advance</span>
          </button>
          <button
            onClick={() => setShowMarkModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Forecourt Staff</span>
            <Users className="w-4 h-4 text-blue-700" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{staff.length}</div>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">Registered Outlet Personnel</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unrecovered Advances</span>
            <CreditCard className="w-4 h-4 text-orange-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-orange-700">
            ₹{totalAdvancesINR.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">Deducted at monthly payroll</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Monthly Salary Pool</span>
            <IndianRupee className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-800">
            ₹{totalPayrollPayableINR.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">Ready for Bank Transfer</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Daily Attendance Register ({attendance.length})
        </button>
        <button
          onClick={() => setActiveTab('advances')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'advances'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Staff Advances & Deductions ({advances.length})
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'payroll'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Monthly Payroll Sheet
        </button>
      </div>

      {/* Tab 1: Daily Attendance Register */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Forecourt Shift Attendance Register</h3>
            <span className="text-xs text-slate-500 font-semibold">{attendance.length} records logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Forecourt Role</th>
                  <th className="py-3 px-4">Shift #</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{a.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{a.staff_name}</td>
                    <td className="py-3 px-4 uppercase text-[11px] text-slate-500 font-semibold">{a.staff_role}</td>
                    <td className="py-3 px-4 font-semibold">Shift {a.shift_number}</td>
                    <td className="py-3 px-4">
                      {a.status === 'PRESENT' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          PRESENT
                        </span>
                      ) : a.status === 'HALF_DAY' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                          HALF DAY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                          {a.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{a.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Staff Advances */}
      {activeTab === 'advances' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Cash Advances Disbursed & Recovery Status</h3>
            <span className="text-xs text-slate-500 font-semibold">
              All disbursements automatically generate balanced PV-PAYMENT vouchers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Advance Amount</th>
                  <th className="py-3 px-4">Recovered</th>
                  <th className="py-3 px-4">Balance Pending</th>
                  <th className="py-3 px-4">Reason / Purpose</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advances.map((adv) => {
                  const pending = (adv.amount_paise - adv.recovered_amount_paise) / 100;
                  return (
                    <tr key={adv.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{adv.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{adv.staff_name}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{(adv.amount_paise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-emerald-700 font-semibold">
                        ₹{(adv.recovered_amount_paise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-bold text-orange-700">₹{pending.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-slate-600">{adv.reason}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                          {adv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Monthly Payroll Sheet */}
      {activeTab === 'payroll' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Forecourt Salary Sheet</h3>
              <p className="text-xs text-slate-500 mt-0.5">Automated advance recovery capped at 40% of base salary</p>
            </div>
            <button
              onClick={() => alert('Monthly payroll processed and bank transfer sheet approved!')}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              Approve Payroll Batch
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Base Salary</th>
                  <th className="py-3 px-4">Present Days</th>
                  <th className="py-3 px-4">Advance Deducted</th>
                  <th className="py-3 px-4">Net Salary Payable</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payroll.map((p) => (
                  <tr key={p.user_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 uppercase text-[11px] text-slate-500 font-semibold">{p.role}</td>
                    <td className="py-3 px-4 font-semibold">₹{(p.base_salary_paise / 100).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{p.present_days} Days</td>
                    <td className="py-3 px-4 font-bold text-rose-700">
                      -₹{(p.advance_deducted_paise / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 text-sm">
                      ₹{(p.net_payable_paise / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Mark Shift Attendance</h3>
            <p className="text-xs text-slate-500 mb-4">Record forecourt staff shift attendance.</p>

            <form onSubmit={handleMarkAttendance} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff Member</label>
                <select
                  value={attUser}
                  onChange={(e) => setAttUser(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="">Select staff member...</option>
                  {staff.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={attStatus}
                    onChange={(e) => setAttStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LEAVE">Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Shift Remarks</label>
                <input
                  type="text"
                  value={attNotes}
                  onChange={(e) => setAttNotes(e.target.value)}
                  placeholder="e.g. Dispenser 1 Morning Shift"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMarkModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 text-white rounded-xl text-xs font-bold hover:bg-blue-900 cursor-pointer"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Disburse Cash Advance</h3>
            <p className="text-xs text-slate-500 mb-4">
              Disburse cash to staff and automatically post a balanced PV-PAYMENT voucher.
            </p>

            <form onSubmit={handleDisburseAdvance} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff Member</label>
                <select
                  value={advUser}
                  onChange={(e) => setAdvUser(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                >
                  <option value="">Select staff member...</option>
                  {staff.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Advance Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={advAmount}
                  onChange={(e) => setAdvAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Purpose</label>
                <input
                  type="text"
                  required
                  value={advReason}
                  onChange={(e) => setAdvReason(e.target.value)}
                  placeholder="e.g. Festival advance / Medical requirement"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 cursor-pointer"
                >
                  Disburse & Post Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
