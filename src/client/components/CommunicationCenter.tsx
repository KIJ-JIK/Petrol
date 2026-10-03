import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  ShieldCheck,
  CheckCircle,
  Clock,
  Smartphone,
  Mail,
  PlusCircle,
  FileText,
} from 'lucide-react';

interface NotificationTemplate {
  id: string;
  name: string;
  category: string;
  dlt_template_id: string;
  channel: string;
  content_template: string;
  active: number;
}

interface NotificationLog {
  id: string;
  recipient_phone: string;
  recipient_name: string;
  message_content: string;
  channel: string;
  delivery_status: string;
  provider_reference: string;
  created_at: string;
  template_name: string;
}

export const CommunicationCenter: React.FC = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Send Modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('9825112233');
  const [recipientName, setRecipientName] = useState('Gadhiya Kisan Seva Mandali');
  const [customText, setCustomText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [tplRes, logsRes] = await Promise.all([
        fetch('/api/v1/communications/templates'),
        fetch('/api/v1/communications/logs'),
      ]);

      if (tplRes.ok) {
        const data = await tplRes.json();
        setTemplates(data.templates || []);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone || !customText) return;

    try {
      const res = await fetch('/api/v1/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: 'out_skp_gadhiya',
          template_id: selectedTemplateId || null,
          recipient_phone: recipientPhone,
          recipient_name: recipientName,
          message_content: customText,
          channel: 'SMS',
        }),
      });

      if (res.ok) {
        setShowSendModal(false);
        setCustomText('');
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
              <MessageSquare className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Customer Communications & DLT Notification Center (P1)
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            TRAI/DLT compliant transactional notifications: fuel credit confirmations, receipts, monthly statement memos, and payment due alerts.
          </p>
        </div>

        <button
          onClick={() => {
            const firstTpl = templates[0];
            if (firstTpl) {
              setSelectedTemplateId(firstTpl.id);
              setCustomText(firstTpl.content_template);
            }
            setShowSendModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer self-start md:self-auto"
        >
          <Send className="w-4 h-4" />
          <span>Dispatch Transactional Alert</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Approved DLT Templates */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Approved DLT Message Templates</h3>
            <p className="text-xs text-slate-500 mt-0.5">Indian Oil Corporation principal entity registration</p>
          </div>

          <div className="space-y-3">
            {templates.map((t) => (
              <div key={t.id} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{t.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
                    {t.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
                  {t.content_template}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>DLT ID: {t.dlt_template_id}</span>
                  <button
                    onClick={() => {
                      setSelectedTemplateId(t.id);
                      setCustomText(t.content_template);
                      setShowSendModal(true);
                    }}
                    className="text-blue-800 font-bold hover:underline cursor-pointer"
                  >
                    Use Template →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Dispatch Log */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Communication Dispatch Log</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time gateway transmission status</p>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{logs.length} logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Content</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Provider Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No messages dispatched yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{log.created_at.slice(0, 16)}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{log.recipient_name}</span>
                        <span className="text-slate-500 font-mono text-[11px]">{log.recipient_phone}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">{log.message_content}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {log.delivery_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{log.provider_reference}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Dispatch Transactional Alert</h3>
            <p className="text-xs text-slate-500 mb-4">Send compliant notification to customer mobile.</p>

            <form onSubmit={handleSend} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (India +91)</label>
                <input
                  type="text"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  required
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-700 focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 text-white rounded-xl text-xs font-bold hover:bg-blue-900 cursor-pointer"
                >
                  Send SMS Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
