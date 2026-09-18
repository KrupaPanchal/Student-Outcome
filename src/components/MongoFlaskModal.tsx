import React, { useState } from 'react';
import {
  Database,
  Server,
  CheckCircle2,
  AlertTriangle,
  Copy,
  X,
  RefreshCw,
  HardDrive,
  Info,
  ExternalLink,
} from 'lucide-react';

interface MongoFlaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: {
    database: string;
    isNeon?: boolean;
    isMongo?: boolean;
    neonConfigured?: boolean;
    mongoConfigured?: boolean;
    neonError?: string;
    mongoError?: string;
    mongoErrorDetail?: string;
    totalSubmissions: number;
  };
  onRefreshHealth: () => void;
}

export const MongoFlaskModal: React.FC<MongoFlaskModalProps> = ({
  isOpen,
  onClose,
  dbStatus,
  onRefreshHealth,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [inputUri, setInputUri] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTestConnection = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/reconnect-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: inputUri.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Connected to database successfully! Found ${data.totalSubmissions || 0} active submissions.`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to connect to database.',
        });
      }
      onRefreshHealth();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Network request failed.',
      });
    } finally {
      setTesting(false);
    }
  };

  const isOnlineDb = Boolean(dbStatus.isNeon || dbStatus.isMongo);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 mt-4 sm:mt-0">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Database &amp; Cloud Storage Status</h2>
              <p className="text-[11px] sm:text-xs text-indigo-200">Neon PostgreSQL Cloud Integration</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[75vh] sm:max-h-[80vh] overflow-y-auto">
          {/* Live Status Card */}
          <div
            className={`p-4 rounded-xl border flex items-start justify-between ${
              isOnlineDb
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start space-x-3">
              {isOnlineDb ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {dbStatus.isNeon ? 'Neon PostgreSQL Connected (Cloud)' : dbStatus.database}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      isOnlineDb ? 'bg-emerald-200/60 text-emerald-800' : 'bg-amber-200/60 text-amber-800'
                    }`}
                  >
                    {isOnlineDb ? 'Online & Persistent' : 'Local Fallback'}
                  </span>
                </div>
                <p className="text-xs mt-1 text-slate-600">
                  {isOnlineDb
                    ? `Total records stored in database: ${dbStatus.totalSubmissions} submissions.`
                    : 'Currently saving records to local persistent storage.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRefreshHealth}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 shadow-xs hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer text-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {/* Test / Reconnect Form */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Update / Test Database Connection String
            </h3>
            <form onSubmit={handleTestConnection} className="space-y-3">
              <input
                type="text"
                placeholder="postgresql://neondb_owner:password@ep-xxxx.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require"
                value={inputUri}
                onChange={(e) => setInputUri(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={testing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  Test &amp; Connect
                </button>
              </div>
            </form>

            {testResult && (
              <div
                className={`mt-3 p-3 rounded-lg text-xs border ${
                  testResult.success ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-rose-100 border-rose-300 text-rose-900'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
