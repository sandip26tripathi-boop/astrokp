'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TriangleLogo from '@/components/TriangleLogo';
import {
  Users,
  Mail,
  Phone,
  Calendar,
  Clock,
  Download,
  RefreshCw,
  Search,
  Trash2,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';

interface ClientLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  loginTime: string;
  adminRecipient: string;
  clientIp?: string;
  userAgent?: string;
  birthDetails?: {
    dateOfBirth?: string;
    timeOfBirth?: string;
    placeName?: string;
    gender?: string;
  };
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<ClientLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('sandip26tripathi@gmail.com');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/client-login');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        if (data.admin) setAdminEmail(data.admin);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('क्या आप इस क्लाइंट डेटा को हटाना चाहते हैं?')) return;
    try {
      const res = await fetch(`/api/auth/client-login?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;

    const headers = [
      'Lead ID',
      'Client Name',
      'Gmail Address',
      'Phone / WhatsApp',
      'Login Date Time (IST)',
      'Birth Date',
      'Birth Time',
      'Birth Place',
      'Client IP',
    ];

    const rows = leads.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      l.email,
      l.phone || '',
      `"${new Date(l.loginTime).toLocaleString('en-IN')}"`,
      l.birthDetails?.dateOfBirth || '',
      l.birthDetails?.timeOfBirth || '',
      `"${(l.birthDetails?.placeName || '').replace(/"/g, '""')}"`,
      l.clientIp || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `astro-gemini-client-leads-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      (l.phone && l.phone.includes(q)) ||
      (l.birthDetails?.placeName && l.birthDetails.placeName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TriangleLogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-serif font-black gold-gradient-text tracking-tight">
                  Astro Gemini Admin
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Client Database
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                लॉगिन हुए क्लाइंट्स का सुरक्षित रिकॉर्ड (Admin: {adminEmail})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeads}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh Leads"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">रिफ्रेश</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={leads.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel / CSV डाउनलोड</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>मुख्य वेबसाइट</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* KPI Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                कुल पंजीकृत क्लाइंट (Total Clients)
              </p>
              <h3 className="text-2xl font-bold font-serif text-slate-900 dark:text-white mt-1">
                {leads.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                एडमिन ईमेल खाता (Admin Recipient)
              </p>
              <h3 className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 truncate max-w-[200px]">
                {adminEmail}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                डेटा स्टोरेज स्थान (Server File Path)
              </p>
              <h3 className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 mt-1 truncate max-w-[220px]">
                data/client-leads.json
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="क्लाइंट का नाम, Gmail या फोन खोजें..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            प्रदर्शित: <strong>{filteredLeads.length}</strong> / {leads.length} क्लाइंट्स
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                क्लाइंट डेटा लोड किया जा रहा है...
              </p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                अभी तक कोई क्लाइंट लॉगिन रिकॉर्ड नहीं मिला
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                जैसे ही कोई क्लाइंट मुख्य पेज पर &quot;Google Sign-In&quot; के माध्यम से अपना Gmail दर्ज करेगा, उसकी पूरी जानकारी यहाँ लाइव दिखेगी।
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">क्लाइंट (Client)</th>
                    <th className="py-3.5 px-4">Gmail पता (Email)</th>
                    <th className="py-3.5 px-4">फोन / WhatsApp</th>
                    <th className="py-3.5 px-4">लॉगिन समय (IST)</th>
                    <th className="py-3.5 px-4">कुंडली विवरण (Kundli)</th>
                    <th className="py-3.5 px-4 text-right">कार्य (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {lead.name}
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Google Verified
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Gmail */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                          >
                            {lead.email}
                          </a>
                          <button
                            onClick={() => handleCopyEmail(lead.email)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                            title="Copy email"
                          >
                            {copiedEmail === lead.email ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Mail className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Phone / WhatsApp */}
                      <td className="py-3.5 px-4">
                        {lead.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-800 dark:text-slate-200">
                              {lead.phone}
                            </span>
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold transition flex items-center gap-1"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" />
                              WhatsApp
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">दर्ज नहीं</span>
                        )}
                      </td>

                      {/* Login Timestamp */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(lead.loginTime).toLocaleString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Kundli Summary */}
                      <td className="py-3.5 px-4">
                        {lead.birthDetails?.dateOfBirth ? (
                          <div className="space-y-0.5 text-[11px]">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {lead.birthDetails.placeName || 'N/A'}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400">
                              {lead.birthDetails.dateOfBirth} • {lead.birthDetails.timeOfBirth || ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">कुंडली इनपुट नहीं</span>
                        )}
                      </td>

                      {/* Delete Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
