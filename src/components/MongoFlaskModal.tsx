import React, { useState } from 'react';
import {
  Database,
  Server,
  CheckCircle2,
  AlertTriangle,
  Copy,
  X,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  HardDrive,
  Info,
  ExternalLink,
} from 'lucide-react';

interface MongoFlaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: {
    database: string;
    isMongo: boolean;
    mongoConfigured?: boolean;
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
    detail?: string;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const flaskRunCommand = `pip install -r requirements.txt\npython flask_app.py`;
  const mongoEnvExample = `MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/student_outcomes?retryWrites=true&w=majority"`;

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
          message: `Connected to MongoDB successfully! ${data.syncedCount ? `Synced ${data.syncedCount} local records into MongoDB.` : 'Database is online and active.'}`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to connect to MongoDB cluster.',
          detail: data.detail || 'Please verify the cluster hostname, network IP access, and credentials.',
        });
      }
      onRefreshHealth();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Network request failed while testing connection.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncToMongo = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/sync-to-mongo', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncResult(`Synced ${data.synced} records to MongoDB. Total MongoDB records: ${data.totalSubmissions}.`);
        onRefreshHealth();
      } else {
        setSyncResult(`Sync failed: ${data.error}`);
      }
    } catch (err: any) {
      setSyncResult(`Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-lg ${dbStatus.isMongo ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Database Engine &amp; Connectivity Diagnostic</h3>
              <p className="text-xs text-slate-500">MongoDB Atlas Cloud Database &amp; Local Persistent Storage Dual Architecture</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Active Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Storage Engine</span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${dbStatus.isMongo ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="font-bold text-slate-900 text-base">{dbStatus.database}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {dbStatus.isMongo
                  ? 'All student submissions, proofs, and achievement records are being saved directly into your cloud MongoDB collection.'
                  : 'Currently operating in Automatic Persistent Storage mode. All records are safely saved locally in data/submissions.json and persist across page reloads.'}
              </p>
            </div>
            <div className="text-left sm:text-right bg-white p-3 rounded-lg border border-slate-200 shrink-0">
              <span className="text-2xl font-black text-indigo-600 block">{dbStatus.totalSubmissions}</span>
              <span className="text-[11px] text-slate-500 font-medium">Verified Submissions</span>
            </div>
          </div>

          {/* Diagnostic Notice (If MongoDB URI is configured but connection failed) */}
          {!dbStatus.isMongo && (
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-2.5">
              <div className="flex items-start gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>MongoDB Connection Diagnostics &amp; Status</span>
              </div>

              {dbStatus.mongoError && (
                <div className="p-2.5 bg-white/80 rounded border border-amber-300 font-mono text-[11px] text-rose-800 break-all">
                  <strong>Cluster Report:</strong> {dbStatus.mongoError}
                </div>
              )}

              <p className="leading-relaxed text-slate-700">
                {dbStatus.mongoErrorDetail ||
                  'Your application is completely operational using persistent local storage. If you want to connect your live MongoDB Atlas cluster, verify the three requirements below:'}
              </p>

              <div className="space-y-1.5 pt-1 text-slate-700">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-900">1. Atlas Network Access (IP Whitelist):</span>
                  <span>In MongoDB Atlas &gt; <em>Network Access</em> &gt; click <em>Add IP Address</em> &gt; select <strong>Allow Access from Anywhere (0.0.0.0/0)</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-900">2. Correct Cluster Hostname:</span>
                  <span>Ensure your cluster hostname (e.g. <code>cluster0.xxxx.mongodb.net</code>) is exact and the cluster is in "Active" state in Atlas.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-900">3. Database User Password:</span>
                  <span>Ensure your user credentials are created in Atlas &gt; <em>Database Access</em> and password does not contain unescaped characters.</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Connection Tester / Configurator */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Test or Reconnect MongoDB Connection String</span>
              </div>
              {dbStatus.isMongo && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              )}
            </div>

            <form onSubmit={handleTestConnection} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputUri}
                  onChange={(e) => setInputUri(e.target.value)}
                  placeholder="Paste MongoDB URI (e.g. mongodb+srv://user:pass@cluster0.mongodb.net/...)"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={testing}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  {testing ? 'Testing...' : 'Test & Connect'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Leave empty to retry the currently configured environment URI.
              </p>
            </form>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs border animate-in fade-in duration-200 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.detail && <p className="text-[11px] opacity-90">{testResult.detail}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* If MongoDB is connected: offer button to sync local records */}
            {dbStatus.isMongo && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">Sync all existing local records to MongoDB:</span>
                <button
                  type="button"
                  onClick={handleSyncToMongo}
                  disabled={syncing}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Local to Cloud'}
                </button>
              </div>
            )}

            {syncResult && (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                {syncResult}
              </p>
            )}
          </div>

          {/* Python Flask Backend Files */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Server className="w-4 h-4 text-indigo-600" />
              <span>Python Flask &amp; PyMongo Backend Included</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In addition to the Node.js/Express server powering this web preview, we also provided the standalone Python Flask backend (<code>flask_app.py</code>) and <code>requirements.txt</code> in the repository root:
            </p>
            <div className="relative bg-slate-900 rounded-lg p-3 text-slate-200 font-mono text-xs overflow-x-auto">
              <pre>{flaskRunCommand}</pre>
              <button
                type="button"
                onClick={() => copyToClipboard(flaskRunCommand, 'flask-cmd')}
                className="absolute top-2.5 right-2.5 p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 cursor-pointer"
              >
                {copied === 'flask-cmd' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'flask-cmd' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Storage is fully active &amp; zero-data-loss guaranteed.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
