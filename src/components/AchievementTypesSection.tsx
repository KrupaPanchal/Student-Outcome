import React from 'react';
import { Award, Trophy, Rocket, Lightbulb, DollarSign, BookOpen, Wrench, Sparkles, CheckSquare, Square } from 'lucide-react';
import {
  AchievementCategory,
  CompetitionAchievement,
  PatentDetail,
  StartupDetail,
  FundedProjectDetail,
  SSIPProjectDetail,
  ResearchPublicationDetail,
  UploadedFile,
} from '../types';
import { FileUploadField } from './FileUploadField';

interface AchievementTypesSectionProps {
  selectedCategories: AchievementCategory[];
  toggleCategory?: (cat: AchievementCategory) => void;
  onToggleCategory?: (cat: AchievementCategory) => void;
  competitionAchievements: Record<string, CompetitionAchievement>;
  updateCompetitionAchievement: (cat: string, updates: Partial<CompetitionAchievement>) => void;
  patentDetail: PatentDetail;
  setPatentDetail: React.Dispatch<React.SetStateAction<PatentDetail>>;
  startupDetail: StartupDetail;
  setStartupDetail: React.Dispatch<React.SetStateAction<StartupDetail>>;
  fundedProjectDetail: FundedProjectDetail;
  setFundedProjectDetail: React.Dispatch<React.SetStateAction<FundedProjectDetail>>;
  ssipProjectDetail: SSIPProjectDetail;
  setSSIPProjectDetail: React.Dispatch<React.SetStateAction<SSIPProjectDetail>>;
  researchPublicationDetail: ResearchPublicationDetail;
  setResearchPublicationDetail: React.Dispatch<React.SetStateAction<ResearchPublicationDetail>>;
}

const ALL_ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; label: string; icon: any }[] = [
  { id: 'Sports Competition', label: 'Sports Competition', icon: Trophy },
  { id: 'Hackathon', label: 'Hackathon', icon: Sparkles },
  { id: 'Coding Competition', label: 'Coding Competition', icon: Award },
  { id: 'Cultural Competition', label: 'Cultural Competition', icon: Award },
  { id: 'Patent', label: 'Patent', icon: Lightbulb },
  { id: 'Startup', label: 'Startup', icon: Rocket },
  { id: 'Funded Project', label: 'Funded Project', icon: DollarSign },
  { id: 'SSIP Project', label: 'SSIP Project', icon: Award },
  { id: 'Research Publication', label: 'Research Publication', icon: BookOpen },
  { id: 'Workshop / Technical Event', label: 'Workshop / Technical Event', icon: Wrench },
  { id: 'Other Achievement', label: 'Other Achievement', icon: Award },
];

const STANDARD_EVENT_CATEGORIES = [
  'Sports Competition',
  'Hackathon',
  'Coding Competition',
  'Cultural Competition',
  'Workshop / Technical Event',
  'Other Achievement',
];

export const AchievementTypesSection: React.FC<AchievementTypesSectionProps> = ({
  selectedCategories = [],
  toggleCategory,
  onToggleCategory,
  competitionAchievements,
  updateCompetitionAchievement,
  patentDetail,
  setPatentDetail,
  startupDetail,
  setStartupDetail,
  fundedProjectDetail,
  setFundedProjectDetail,
  ssipProjectDetail,
  setSSIPProjectDetail,
  researchPublicationDetail,
  setResearchPublicationDetail,
}) => {
  const handleToggle = (cat: AchievementCategory) => {
    if (onToggleCategory) {
      onToggleCategory(cat);
    } else if (toggleCategory) {
      toggleCategory(cat);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5 sm:space-y-6" id="achievement-types-section">
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
          3
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Type of Achievement</h2>
          <p className="text-xs text-slate-500">
            Select one or more achievement categories in checkboxes and provide supporting details &amp; proofs.
          </p>
        </div>
      </div>

      {/* Category Checkboxes */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-800">
          Select Achievement Categories (Check all that apply)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {ALL_ACHIEVEMENT_CATEGORIES.map(({ id, label, icon: Icon }) => {
            const isChecked = selectedCategories.includes(id);
            return (
              <label
                key={id}
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  isChecked
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/30 text-indigo-950 font-semibold shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(id)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <Icon className={`w-4 h-4 shrink-0 ${isChecked ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-xs sm:text-sm select-none">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Detailed Sub-forms based on checked categories */}
      <div className="space-y-6 pt-2">
        {/* Standard Event / Competition Forms */}
        {selectedCategories
          .filter((cat) => STANDARD_EVENT_CATEGORIES.includes(cat))
          .map((cat) => {
            const data = competitionAchievements[cat] || {
              category: cat,
              eventName: '',
              organizedBy: '',
              level: '',
              participationStatus: '',
              dateOfAchievement: '',
              description: '',
            };

            return (
              <div
                key={cat}
                id={`form-section-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    {cat} Details
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                    Event Info
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name of Competition / Event / Achievement */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Name of Competition / Event / Achievement <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`event-name-${cat}`}
                      value={data.eventName}
                      onChange={(e) => updateCompetitionAchievement(cat, { eventName: e.target.value })}
                      placeholder="e.g. National Smart Gujarat Hackathon"
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Organized By */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Organized By <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`organized-by-${cat}`}
                      value={data.organizedBy}
                      onChange={(e) => updateCompetitionAchievement(cat, { organizedBy: e.target.value })}
                      placeholder="e.g. Government of Gujarat / GTU"
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Level: State Level / National Level / International Level */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Level <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['State Level', 'National Level', 'International Level'] as const).map((lvl) => (
                        <label
                          key={lvl}
                          className={`flex items-center justify-center p-2 rounded-lg border text-xs cursor-pointer text-center font-medium ${
                            data.level === lvl
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`level-${cat}`}
                            value={lvl}
                            checked={data.level === lvl}
                            onChange={() => updateCompetitionAchievement(cat, { level: lvl })}
                            className="hidden"
                          />
                          {lvl}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Participation Status */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Participation Status <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {(['Participated', 'Winner', 'Runner Up', 'Presented', 'Published'] as const).map((st) => (
                        <label
                          key={st}
                          className={`flex items-center justify-center p-2 rounded-lg border text-xs cursor-pointer text-center font-medium ${
                            data.participationStatus === st
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`status-${cat}`}
                            value={st}
                            checked={data.participationStatus === st}
                            onChange={() => updateCompetitionAchievement(cat, { participationStatus: st })}
                            className="hidden"
                          />
                          {st}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date of Achievement */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Date of Achievement <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      id={`achievement-date-${cat}`}
                      value={data.dateOfAchievement}
                      onChange={(e) => updateCompetitionAchievement(cat, { dateOfAchievement: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Brief Description */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Brief Description of Achievement
                    </label>
                    <textarea
                      rows={2}
                      id={`description-${cat}`}
                      value={data.description}
                      onChange={(e) => updateCompetitionAchievement(cat, { description: e.target.value })}
                      placeholder="Briefly describe your project/performance, team name, or category..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Upload Certificate */}
                  <div className="sm:col-span-2">
                    <FileUploadField
                      id={`certificate-${cat}`}
                      label="Upload Certificate"
                      description="Upload 1 supported file. Max 2 MB (PDF or image proof)."
                      value={data.certificateFile}
                      onChange={(file) => updateCompetitionAchievement(cat, { certificateFile: file })}
                      maxSizeMB={2}
                    />
                  </div>
                </div>
              </div>
            );
          })}

        {/* Patent Sub-form */}
        {selectedCategories.includes('Patent') && (
          <div id="form-section-patent" className="p-5 bg-amber-50/40 border border-amber-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                Patent Details
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Intellectual Property
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Patent Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="patent-title"
                  value={patentDetail.patentTitle}
                  onChange={(e) => setPatentDetail((prev) => ({ ...prev, patentTitle: e.target.value }))}
                  placeholder="e.g. Smart IoT-Based Water Quality Monitoring Device"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Patent Application Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="patent-app-number"
                  value={patentDetail.patentAppNumber}
                  onChange={(e) => setPatentDetail((prev) => ({ ...prev, patentAppNumber: e.target.value }))}
                  placeholder="e.g. 202421012345"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Patent Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Filed', 'Published', 'Granted'] as const).map((st) => (
                    <label
                      key={st}
                      className={`flex items-center justify-center p-2 rounded-lg border text-xs cursor-pointer text-center font-medium ${
                        patentDetail.patentStatus === st
                          ? 'border-amber-600 bg-amber-100/70 text-amber-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="patentStatus"
                        value={st}
                        checked={patentDetail.patentStatus === st}
                        onChange={() => setPatentDetail((prev) => ({ ...prev, patentStatus: st }))}
                        className="hidden"
                      />
                      {st}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Filing/Publication Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  id="patent-date"
                  value={patentDetail.filingDate}
                  onChange={(e) => setPatentDetail((prev) => ({ ...prev, filingDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <FileUploadField
                  id="upload-patent-proof"
                  label="Upload Patent Proof"
                  description="Upload 1 supported file. Max 2 MB (Filing receipt, publication journal, or grant certificate)."
                  value={patentDetail.proofFile}
                  onChange={(file) => setPatentDetail((prev) => ({ ...prev, proofFile: file }))}
                  maxSizeMB={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* Startup Sub-form */}
        {selectedCategories.includes('Startup') && (
          <div id="form-section-startup" className="p-5 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-emerald-600" />
                Startup Information
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Venture Details
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Startup Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="startup-name"
                  value={startupDetail.startupName}
                  onChange={(e) => setStartupDetail((prev) => ({ ...prev, startupName: e.target.value }))}
                  placeholder="e.g. EduTech Innovations LLP"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Student's Role <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="startup-role"
                  value={startupDetail.studentRole}
                  onChange={(e) => setStartupDetail((prev) => ({ ...prev, studentRole: e.target.value }))}
                  placeholder="e.g. Founder / Co-Founder / Lead Developer"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">Startup Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Idea Stage', 'Registered', 'Operational', 'Other'] as const).map((st) => (
                    <label
                      key={st}
                      className={`flex items-center justify-center p-2 rounded-lg border text-xs cursor-pointer font-medium ${
                        startupDetail.startupStatus === st
                          ? 'border-emerald-600 bg-emerald-100/70 text-emerald-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="startupStatus"
                        value={st}
                        checked={startupDetail.startupStatus === st}
                        onChange={() => setStartupDetail((prev) => ({ ...prev, startupStatus: st }))}
                        className="hidden"
                      />
                      {st}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Registration / Recognition Details
                </label>
                <input
                  type="text"
                  id="startup-reg-details"
                  value={startupDetail.registrationDetails}
                  onChange={(e) => setStartupDetail((prev) => ({ ...prev, registrationDetails: e.target.value }))}
                  placeholder="e.g. DPIIT Recognized / MCA CIN / Udhyam No."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <FileUploadField
                  id="upload-startup-proof"
                  label="Upload Startup Proof"
                  description="Upload 1 supported file. Max 2 MB (Incorporation certificate, DPIIT letter, or incubation proof)."
                  value={startupDetail.proofFile}
                  onChange={(file) => setStartupDetail((prev) => ({ ...prev, proofFile: file }))}
                  maxSizeMB={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* Funded Project Sub-form */}
        {selectedCategories.includes('Funded Project') && (
          <div id="form-section-funded-project" className="p-5 bg-blue-50/40 border border-blue-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-blue-200 pb-2">
              <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Funded Project Details
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Grant / Research Funding
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="funded-project-title"
                  value={fundedProjectDetail.projectTitle}
                  onChange={(e) => setFundedProjectDetail((prev) => ({ ...prev, projectTitle: e.target.value }))}
                  placeholder="e.g. AI-Driven Agricultural Pest Detection"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Funding Agency <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="funding-agency"
                  value={fundedProjectDetail.fundingAgency}
                  onChange={(e) => setFundedProjectDetail((prev) => ({ ...prev, fundingAgency: e.target.value }))}
                  placeholder="e.g. DST / AICTE / GUJCOST / Industry Partner"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Funding Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="funding-amount"
                  value={fundedProjectDetail.fundingAmount}
                  onChange={(e) => setFundedProjectDetail((prev) => ({ ...prev, fundingAmount: e.target.value }))}
                  placeholder="e.g. ₹ 2,50,000"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Project Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Approved', 'Ongoing', 'Completed'] as const).map((st) => (
                    <label
                      key={st}
                      className={`flex items-center justify-center p-2 rounded-lg border text-xs cursor-pointer font-medium ${
                        fundedProjectDetail.projectStatus === st
                          ? 'border-blue-600 bg-blue-100/70 text-blue-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="fundedProjectStatus"
                        value={st}
                        checked={fundedProjectDetail.projectStatus === st}
                        onChange={() => setFundedProjectDetail((prev) => ({ ...prev, projectStatus: st }))}
                        className="hidden"
                      />
                      {st}
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <FileUploadField
                  id="upload-funding-proof"
                  label="Upload Funding / Approval Proof"
                  description="Upload 1 supported file. Max 2 MB (Sanction letter or disbursement proof)."
                  value={fundedProjectDetail.proofFile}
                  onChange={(file) => setFundedProjectDetail((prev) => ({ ...prev, proofFile: file }))}
                  maxSizeMB={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* SSIP Project Sub-form */}
        {selectedCategories.includes('SSIP Project') && (
          <div id="form-section-ssip" className="p-5 bg-purple-50/40 border border-purple-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-200 pb-2">
              <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                SSIP Project Details (Student Startup & Innovation Policy)
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                SSIP 2.0
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="ssip-project-title"
                  value={ssipProjectDetail.projectTitle}
                  onChange={(e) => setSSIPProjectDetail((prev) => ({ ...prev, projectTitle: e.target.value }))}
                  placeholder="e.g. Eco-Friendly Solar Powered Irrigation Controller"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">SSIP Project Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['Selected', 'Approved', 'Funded', 'Ongoing', 'Completed'] as const).map((st) => (
                    <label
                      key={st}
                      className={`flex items-center justify-center p-2 rounded-lg border text-xs cursor-pointer font-medium ${
                        ssipProjectDetail.ssipStatus === st
                          ? 'border-purple-600 bg-purple-100/70 text-purple-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="ssipStatus"
                        value={st}
                        checked={ssipProjectDetail.ssipStatus === st}
                        onChange={() => setSSIPProjectDetail((prev) => ({ ...prev, ssipStatus: st }))}
                        className="hidden"
                      />
                      {st}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Funding Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="ssip-funding-amount"
                  value={ssipProjectDetail.fundingAmount}
                  onChange={(e) => setSSIPProjectDetail((prev) => ({ ...prev, fundingAmount: e.target.value }))}
                  placeholder="e.g. ₹ 75,000 (PoC / Prototype grant)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <FileUploadField
                  id="upload-ssip-proof"
                  label="Upload SSIP Proof (File Upload – Required)"
                  description="Upload 1 supported file. Max 2 MB (SSIP Committee sanction order or grant letter)."
                  required={true}
                  value={ssipProjectDetail.proofFile}
                  onChange={(file) => setSSIPProjectDetail((prev) => ({ ...prev, proofFile: file }))}
                  maxSizeMB={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* Research Publication Sub-form */}
        {selectedCategories.includes('Research Publication') && (
          <div id="form-section-publication" className="p-5 bg-teal-50/40 border border-teal-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-teal-200 pb-2">
              <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                Research Publication Details
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                Academic Research
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Research Paper Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="publication-paper-title"
                  value={researchPublicationDetail.paperTitle}
                  onChange={(e) => setResearchPublicationDetail((prev) => ({ ...prev, paperTitle: e.target.value }))}
                  placeholder="e.g. Comparative Analysis of CNN Architectures in Medical Imaging"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Journal / Conference Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="journal-conference-name"
                  value={researchPublicationDetail.journalConferenceName}
                  onChange={(e) => setResearchPublicationDetail((prev) => ({ ...prev, journalConferenceName: e.target.value }))}
                  placeholder="e.g. IEEE Transactions / Springer LNCS"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">DOI / Publication Link</label>
                <input
                  type="text"
                  id="publication-doi-link"
                  value={researchPublicationDetail.doiOrLink}
                  onChange={(e) => setResearchPublicationDetail((prev) => ({ ...prev, doiOrLink: e.target.value }))}
                  placeholder="e.g. https://doi.org/10.1109/..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">Publication Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['Journal', 'Conference', 'Book', 'Chapter', 'Other'] as const).map((t) => (
                    <label
                      key={t}
                      className={`flex items-center justify-center p-2 rounded-lg border text-xs cursor-pointer font-medium ${
                        researchPublicationDetail.publicationType === t
                          ? 'border-teal-600 bg-teal-100/70 text-teal-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="publicationType"
                        value={t}
                        checked={researchPublicationDetail.publicationType === t}
                        onChange={() => setResearchPublicationDetail((prev) => ({ ...prev, publicationType: t }))}
                        className="hidden"
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">Publication Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Published', 'Accepted', 'Presented'] as const).map((st) => (
                    <label
                      key={st}
                      className={`flex items-center justify-center p-2 rounded-lg border text-xs cursor-pointer font-medium ${
                        researchPublicationDetail.publicationStatus === st
                          ? 'border-teal-600 bg-teal-100/70 text-teal-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="publicationStatus"
                        value={st}
                        checked={researchPublicationDetail.publicationStatus === st}
                        onChange={() => setResearchPublicationDetail((prev) => ({ ...prev, publicationStatus: st }))}
                        className="hidden"
                      />
                      {st}
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <FileUploadField
                  id="upload-publication-proof"
                  label="Upload Publication Proof"
                  description="Upload 1 supported file. Max 2 MB (Paper first page, acceptance letter, or proceedings copy)."
                  value={researchPublicationDetail.proofFile}
                  onChange={(file) => setResearchPublicationDetail((prev) => ({ ...prev, proofFile: file }))}
                  maxSizeMB={2}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
