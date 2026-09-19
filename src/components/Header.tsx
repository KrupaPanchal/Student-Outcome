import React from 'react';
import {
  GraduationCap,
  Database,
  FileSpreadsheet,
  ShieldCheck,
  Lock,
  LogOut,
  Settings,
} from 'lucide-react';

interface HeaderProps {
  submissionsCount: number;
  dbStatus: {
    database: string;
    isNeon?: boolean;
    isMongo?: boolean;
    neonConfigured?: boolean;
    mongoConfigured?: boolean;
    status?: string;
  };
  isAdmin: boolean;
  adminUsername?: string;
  onOpenAdminModal: () => void;
  onAdminLogout: () => void;
  onOpenMongoModal: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  submissionsCount,
  dbStatus,
  isAdmin,
  adminUsername,
  onOpenAdminModal,
  onAdminLogout,
  onOpenMongoModal,
  onOpenSettings,
}) => {
  const isOnlineDb = Boolean(dbStatus.isNeon || dbStatus.isMongo);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" id="app-header">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-2.5 md:py-0 md:h-16 gap-2.5 md:gap-4">

          {/* Top / Left: Brand & Title */}
          <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-3 min-w-0 w-full md:w-auto">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate leading-tight">
                  <span className="hidden sm:inline">Student Outcome &amp; Achievement Data Collection</span>
                  <span className="inline sm:hidden">Student Outcome Portal</span>
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight truncate hidden xs:block">
                  {isAdmin ? 'Administrator Submissions Portal' : 'Academic Participation & Progression Portal'}
                </p>
              </div>
            </div>

            {/* Mobile-only DB status icon (Admin Only) */}
            {isAdmin && (
              <div className="flex md:hidden items-center shrink-0">
                <div
                  title={dbStatus.isNeon ? 'Neon DB Active' : dbStatus.isMongo ? 'MongoDB Active' : 'Local Storage'}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    isOnlineDb
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  <Database className={`w-3 h-3 shrink-0 ${isOnlineDb ? 'text-emerald-600' : 'text-indigo-600'}`} />
                  <span>{dbStatus.isNeon ? 'Neon' : dbStatus.isMongo ? 'Mongo' : 'Local'}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isOnlineDb ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right / Bottom Controls */}
          <div className="flex items-center justify-between md:justify-end gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">

            {/* Desktop DB Status Badge (Admin Only) */}
            {isAdmin && (
              <div
                id="db-status-badge"
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${
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
            )}

            {/* Admin Badge or Sign-In Button */}
            {isAdmin ? (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap">
                {/* Submissions count badge */}
                <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-2.5 py-1 sm:py-1.5 rounded-full whitespace-nowrap text-xs font-semibold text-indigo-900">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="hidden sm:inline">Submissions:</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-200 text-indigo-800 font-bold text-[10px]">
                    {submissionsCount}
                  </span>
                </div>

                {/* Admin name badge */}
                <div className="flex items-center gap-1 bg-purple-50 border border-purple-200 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full whitespace-nowrap">
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-semibold text-purple-900 truncate max-w-[70px] xs:max-w-[100px] sm:max-w-none">
                    {adminUsername || 'Admin'}
                  </span>
                </div>

                {/* Settings button */}
                <button
                  type="button"
                  onClick={onOpenSettings}
                  title="Admin Settings"
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden xs:inline sm:inline">Settings</span>
                </button>

                {/* Sign out button */}
                <button
                  type="button"
                  onClick={onAdminLogout}
                  title="Sign Out"
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden xs:inline sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAdminModal}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Admin Login</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
