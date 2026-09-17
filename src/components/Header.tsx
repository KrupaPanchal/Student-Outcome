import React from 'react';
import {
  GraduationCap,
  Database,
  FileSpreadsheet,
  PlusCircle,
  ShieldCheck,
  Lock,
  LogOut,
  UserCheck,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'form' | 'records';
  setCurrentTab: (tab: 'form' | 'records') => void;
  submissionsCount: number;
  dbStatus: {
    database: string;
    isNeon?: boolean;
    isMongo?: boolean;
    neonConfigured?: boolean;
    mongoConfigured?: boolean;
    status: string;
  };
  isAdmin: boolean;
  onOpenAdminModal: () => void;
  onAdminLogout: () => void;
  onOpenMongoModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  submissionsCount,
  dbStatus,
  isAdmin,
  onOpenAdminModal,
  onAdminLogout,
  onOpenMongoModal,
}) => {
  const isOnlineDb = Boolean(dbStatus.isNeon || dbStatus.isMongo);

  const handleTabChange = (tab: 'form' | 'records') => {
    if (tab === 'records' && !isAdmin) {
      onOpenAdminModal();
      return;
    }
    setCurrentTab(tab);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" id="app-header">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
          {/* Brand & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Student Outcome &amp; Achievement Data Collection
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Academic Participation, Progression &amp; Achievement Verification System
              </p>
            </div>
          </div>

          {/* Controls: DB Status, Role & Navigation */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Database indicator button */}
            <button
              type="button"
              id="db-status-badge"
              onClick={onOpenMongoModal}
              title="Click to view Neon Database status, diagnostic report & setup"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isOnlineDb
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-xs'
                  : dbStatus.neonConfigured || dbStatus.mongoConfigured
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${isOnlineDb ? 'text-emerald-600' : 'text-indigo-600'}`} />
              <span>
                {dbStatus.isNeon
                  ? 'Neon DB Active'
                  : dbStatus.isMongo
                  ? 'MongoDB Active'
                  : 'Persistent Local Storage'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnlineDb
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
            </button>

            {/* Admin Role Status / Action */}
            {isAdmin ? (
              <div className="flex items-center gap-1 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg text-purple-900 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin</span>
                <button
                  type="button"
                  onClick={onAdminLogout}
                  title="Sign out of Admin"
                  className="ml-1 text-slate-500 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAdminModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Admin Sign In</span>
              </button>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                id="nav-tab-form"
                onClick={() => handleTabChange('form')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'form'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Data Form
              </button>
              <button
                type="button"
                id="nav-tab-records"
                onClick={() => handleTabChange('records')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'records'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>View Submissions</span>
                {!isAdmin && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
                {isAdmin && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px]">
                    {submissionsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
