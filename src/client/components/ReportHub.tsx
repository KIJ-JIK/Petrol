import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Search,
  CheckCircle,
  Filter,
  Fuel,
  Users,
  BookOpen,
  IndianRupee,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface ReportMeta {
  id: string;
  category: string;
  name: string;
  description: string;
}

interface ReportData {
  report_id: string;
  title: string;
  columns: { key: string; label: string }[];
  rows: any[];
  generated_at: string;
  outlet: string;
}

export const ReportHub: React.FC = () => {
  const [catalogue, setCatalogue] = useState<ReportMeta[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string>('petro_tank_stock');
  const [activeReportData, setActiveReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/v1/reports-hub/catalogue')
      .then((r) => r.json())
      .then((data) => {
        setCatalogue(data.reports || []);
      })
      .catch((e) => console.error(e));
  }, []);

  const loadReportData = async (reportId: string) => {
    setSelectedReportId(reportId);
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/reports-hub/data?report_id=${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveReportData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReportId) {
      loadReportData(selectedReportId);
    }
  }, [selectedReportId]);

  const categories = [
    { id: 'ALL', name: 'All Reports (40+)', icon: Layers },
    { id: 'Petroleum Reports', name: 'Petroleum & Tanks', icon: Fuel },
    { id: 'Customer & Khata', name: 'Customer & Khata', icon: Users },
    { id: 'Accounting & Vouchers', name: 'Accounting Vouchers', icon: BookOpen },
    { id: 'Staff & Payroll', name: 'Staff & Payroll', icon: Users },
    { id: 'GST & Compliance', name: 'GST & Compliance', icon: IndianRupee },
  ];

  const filteredReports = catalogue.filter((r) => {
    const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleExportCSV = () => {
    window.location.href = `/api/v1/reports-hub/export-csv?report_id=${selectedReportId}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-900 border border-indigo-200">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Reports & Audit Engine (40+ Reports Suite)
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Complete forecourt registers matching statutory OMC compliance, khata ledgers, vouchers, and GST returns.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Category Filter Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((c) => {
          const Icon = c.icon;
          const isActive = selectedCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Layout: Left Catalogue, Right Live Report Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Report List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredReports.map((r) => {
              const isSelected = selectedReportId === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => loadReportData(r.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 text-blue-900'
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      {r.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-0.5">{r.name}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{r.description}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-800' : 'text-slate-300'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Live Report Viewer */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">
                SK Petroleum (Indian Oil) • Gadhiya
              </span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                {activeReportData?.title || 'Forecourt Report'}
              </h3>
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Rows: {activeReportData?.rows.length || 0}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Generating report data...</div>
          ) : !activeReportData || activeReportData.rows.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No entries found for this report. Enter forecourt operational data to view records.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider">
                    {activeReportData.columns.map((col) => (
                      <th key={col.key} className="py-3 px-4">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeReportData.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      {activeReportData.columns.map((col) => (
                        <td key={col.key} className="py-3 px-4 font-medium">
                          {String(row[col.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
