import React from 'react';
import {
  GraduationCap,
  Database,
  FileSpreadsheet,
  PlusCircle,
  ShieldCheck,
  Lock,
  LogOut,
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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Left: Brand & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate leading-tight">
                Student Outcome &amp; Achievement Data Collection
              </h1>
              <p className="text-[11px] text-slate-500 font-medium leading-tight truncate">
                Academic Participation, Progression &amp; Achievement Verification System
              </p>
            </div>
          </div>

          {/* Right: All Controls in one row */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Neon DB Status Badge */}
            <div
              id="db-status-badge"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${
                isOnlineDb
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              <Database className={`w-3.5 h-3.5 shrink-0 ${isOnlineDb ? 'text-emerald-600' : 'text-indigo-600'}`} />
              <span>
                {dbStatus.isNeon ? 'Neon DB Active' : dbStatus.isMongo ? 'MongoDB Active' : 'Local Storage'}
              </span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isOnlineDb ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
            </div>

            {/* Admin Badge or Sign-In Button */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-2.5 py-1.5 rounded-full text-purple-900 text-xs font-semibold whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Admin</span>
                <button
                  type="button"
                  onClick={onAdminLogout}
                  title="Sign out"
                  className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 hover:text-rose-900 transition-colors cursor-pointer text-[11px] font-semibold"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAdminModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Admin Sign In</span>
              </button>
            )}

            {/* Divider */}
            <div className="w-px h-5 bg-slate-200 shrink-0" />

            {/* Navigation Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 whitespace-nowrap">
              <button
                type="button"
                id="nav-tab-form"
                onClick={() => handleTabChange('form')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'form'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                Data Form
              </button>
              <button
                type="button"
                id="nav-tab-records"
                onClick={() => handleTabChange('records')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'records'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span>View Submissions</span>
                {!isAdmin && <Lock className="w-3 h-3 text-slate-400" />}
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
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
