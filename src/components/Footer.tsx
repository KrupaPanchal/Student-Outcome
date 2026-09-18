import React from 'react';
import { GraduationCap } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/90 backdrop-blur-xs text-slate-600" id="app-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          {/* Brand & Portal Info */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-2xs shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                Student Outcome & Achievement Portal
              </p>
              <p className="text-[11px] text-slate-400">
                Departmental Data Collection & Accreditation Records
              </p>
            </div>
          </div>

          {/* Developer Attribution */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span className="text-xs text-slate-500 font-medium">Developed by</span>
              <span className="text-xs font-bold text-slate-900 tracking-tight">Krupa Panchal</span>
            </div>
          </div>
        </div>

        {/* Bottom subtle copyright */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 text-center sm:text-left">
          <p>© {currentYear} Student Outcome & Achievement Portal. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for Institutional Accreditation & Outcome Monitoring
          </p>
        </div>
      </div>
    </footer>
  );
};
