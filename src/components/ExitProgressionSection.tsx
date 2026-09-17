import React from 'react';
import { LogOut, GraduationCap, Briefcase, TrendingUp, Info } from 'lucide-react';
import { ExitProgression, ExitPathway, UploadedFile } from '../types';
import { FileUploadField } from './FileUploadField';

interface ExitProgressionSectionProps {
  exitProgression: ExitProgression;
  setExitProgression: React.Dispatch<React.SetStateAction<ExitProgression>>;
}

export const ExitProgressionSection: React.FC<ExitProgressionSectionProps> = ({
  exitProgression,
  setExitProgression,
}) => {
  const handleToggle = (checked: boolean) => {
    setExitProgression((prev) => ({
      ...prev,
      isExiting: checked,
      exitYear: checked ? (prev.exitYear || 'Year 3') : '',
      pathway: checked ? (prev.pathway === 'None' ? 'Higher Education' : prev.pathway) : 'None',
    }));
  };

  const handlePathwayChange = (pathway: ExitPathway) => {
    setExitProgression((prev) => ({
      ...prev,
      pathway,
    }));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6" id="exit-progression-section">
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
          4
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Exit / Progression After Year 2 / 3 / 4</h2>
          <p className="text-xs text-slate-500">
            For students exiting the program with NEP-compliant awards or seeking progression tracking.
          </p>
        </div>
      </div>

      {/* Main Checkbox Toggle */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
        <input
          type="checkbox"
          id="exit-progression-toggle"
          checked={exitProgression.isExiting}
          onChange={(e) => handleToggle(e.target.checked)}
          className="w-5 h-5 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
        />
        <div className="space-y-1">
          <label htmlFor="exit-progression-toggle" className="text-sm font-bold text-slate-900 cursor-pointer block">
            Are you exiting or reporting progression after Year 2, Year 3, or Year 4?
          </label>
          <p className="text-xs text-slate-500">
            Check this box if you are completing an exit certificate/diploma or graduating and continuing into Higher Education, Employment, or Entrepreneurship.
          </p>
        </div>
      </div>

      {/* Form details when active */}
      {exitProgression.isExiting && (
        <div className="space-y-6 pt-1 animate-in fade-in duration-300">
          {/* Format Requirements Banner */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <span className="font-bold">Document Format Requirements:</span>
              <p>
                All documents must be scanned copies in PDF format (or clear image). The PDF must be legible with a maximum file size of <strong>2 MB</strong>. Ensure all candidate details and institutional stamps are fully visible.
              </p>
            </div>
          </div>

          {/* Exit Year Radio */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Exit / Progression Stage <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Year 2', 'Year 3', 'Year 4'] as const).map((yr) => (
                <label
                  key={yr}
                  className={`flex items-center justify-center p-3 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${
                    exitProgression.exitYear === yr
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600/30 text-indigo-950 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="exitYear"
                    value={yr}
                    checked={exitProgression.exitYear === yr}
                    onChange={() => setExitProgression((prev) => ({ ...prev, exitYear: yr }))}
                    className="hidden"
                  />
                  <span>After {yr}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pathway Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Progression Pathway <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'Higher Education', icon: GraduationCap, label: '1. Higher Education' },
                { id: 'Placement / Employment', icon: Briefcase, label: '2. Placement / Employment' },
                { id: 'Entrepreneurship', icon: TrendingUp, label: '3. Entrepreneurship' },
              ].map(({ id, icon: Icon, label }) => {
                const isSelected = exitProgression.pathway === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handlePathwayChange(id as ExitPathway)}
                    className={`flex items-center space-x-3 p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 text-indigo-950 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{label}</p>
                      <p className="text-[11px] text-slate-400">
                        {id === 'Higher Education' && 'University Admission'}
                        {id === 'Placement / Employment' && 'Job Offer / Joining'}
                        {id === 'Entrepreneurship' && 'GST / Venture Proof'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pathway 1: Higher Education */}
          {exitProgression.pathway === 'Higher Education' && (
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Higher Education Supporting Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Institution / University Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="exit-institution-name"
                    value={exitProgression.institutionName || ''}
                    onChange={(e) =>
                      setExitProgression((prev) => ({ ...prev, institutionName: e.target.value }))
                    }
                    placeholder="e.g. Sardar Vallabhbhai Global University (SVGU)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Program / Degree Admitted To <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="exit-program-name"
                    value={exitProgression.programName || ''}
                    onChange={(e) => setExitProgression((prev) => ({ ...prev, programName: e.target.value }))}
                    placeholder="e.g. M.Tech in Artificial Intelligence & Data Science"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <FileUploadField
                    id="exit-higher-ed-proof"
                    label="Admission Letter / Admission Confirmation from Institution"
                    description="Upload 1 supported file. Max 2 MB (PDF format preferred). Must clearly indicate student's name, program, and admission details."
                    required={true}
                    value={exitProgression.admissionDocument}
                    onChange={(file) =>
                      setExitProgression((prev) => ({ ...prev, admissionDocument: file }))
                    }
                    maxSizeMB={2}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pathway 2: Placement / Employment */}
          {exitProgression.pathway === 'Placement / Employment' && (
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Placement / Employment Supporting Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Hiring Organization / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="exit-company-name"
                    value={exitProgression.companyName || ''}
                    onChange={(e) => setExitProgression((prev) => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g. Tata Consultancy Services / Infosys"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Designation / Job Role <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="exit-designation"
                    value={exitProgression.designation || ''}
                    onChange={(e) => setExitProgression((prev) => ({ ...prev, designation: e.target.value }))}
                    placeholder="e.g. Associate Software Engineer"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <FileUploadField
                    id="exit-employment-proof"
                    label="Offer Letter / Appointment Letter / Employment Letter"
                    description="Upload 1 supported file. Max 2 MB (PDF format preferred). Must clearly indicate student's name, designation, organization, and joining/employment details."
                    required={true}
                    value={exitProgression.employmentDocument}
                    onChange={(file) =>
                      setExitProgression((prev) => ({ ...prev, employmentDocument: file }))
                    }
                    maxSizeMB={2}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pathway 3: Entrepreneurship */}
          {exitProgression.pathway === 'Entrepreneurship' && (
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Entrepreneurship Supporting Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Venture / Firm Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="exit-venture-name"
                    value={exitProgression.companyOrVentureName || ''}
                    onChange={(e) =>
                      setExitProgression((prev) => ({ ...prev, companyOrVentureName: e.target.value }))
                    }
                    placeholder="e.g. GreenTech Agro Solutions Pvt Ltd"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    GST Registration Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="exit-gst-number"
                    value={exitProgression.gstNumber || ''}
                    onChange={(e) => setExitProgression((prev) => ({ ...prev, gstNumber: e.target.value }))}
                    placeholder="e.g. 24AAAAA0000A1Z5"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <FileUploadField
                    id="exit-entrepreneurship-proof"
                    label="GST Registration Certificate & Supporting Official Letter"
                    description="Upload 1 supported file. Max 2 MB (PDF format preferred). Must confirm entrepreneurial activity with valid registration."
                    required={true}
                    value={exitProgression.gstOrOfficialDocument}
                    onChange={(file) =>
                      setExitProgression((prev) => ({ ...prev, gstOrOfficialDocument: file }))
                    }
                    maxSizeMB={2}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
