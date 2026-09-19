import React from 'react';
import {
  Award,
  Trophy,
  Rocket,
  Lightbulb,
  DollarSign,
  BookOpen,
  Wrench,
  Sparkles,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  AchievementCategory,
  CompetitionAchievement,
  PatentDetail,
  StartupDetail,
  FundedProjectDetail,
  SSIPProjectDetail,
  ResearchPublicationDetail,
} from '../types';
import { FileUploadField } from './FileUploadField';

interface AchievementTypesSectionProps {
  selectedCategories?: AchievementCategory[];
  toggleCategory?: (cat: AchievementCategory) => void;
  onToggleCategory?: (cat: AchievementCategory) => void;

  // Standard Events CRUD
  competitionAchievements?: Record<string, CompetitionAchievement[] | CompetitionAchievement>;
  addCompetitionEntry?: (cat: string) => void;
  updateCompetitionEntry?: (cat: string, index: number, updates: Partial<CompetitionAchievement>) => void;
  removeCompetitionEntry?: (cat: string, index: number) => void;

  // Patent CRUD
  patentDetails?: PatentDetail[];
  addPatent?: () => void;
  updatePatent?: (index: number, updates: Partial<PatentDetail>) => void;
  removePatent?: (index: number) => void;

  // Startup CRUD
  startupDetails?: StartupDetail[];
  addStartup?: () => void;
  updateStartup?: (index: number, updates: Partial<StartupDetail>) => void;
  removeStartup?: (index: number) => void;

  // Funded Project CRUD
  fundedProjectDetails?: FundedProjectDetail[];
  addFundedProject?: () => void;
  updateFundedProject?: (index: number, updates: Partial<FundedProjectDetail>) => void;
  removeFundedProject?: (index: number) => void;

  // SSIP Project CRUD
  ssipProjectDetails?: SSIPProjectDetail[];
  addSSIPProject?: () => void;
  updateSSIPProject?: (index: number, updates: Partial<SSIPProjectDetail>) => void;
  removeSSIPProject?: (index: number) => void;

  // Research Publication CRUD
  researchPublicationDetails?: ResearchPublicationDetail[];
  addResearchPublication?: () => void;
  updateResearchPublication?: (index: number, updates: Partial<ResearchPublicationDetail>) => void;
  removeResearchPublication?: (index: number) => void;

  enrollmentNumber?: string;
}

export const ALL_ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; label: string; icon: any }[] = [
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

export const STANDARD_EVENT_CATEGORIES = [
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
  competitionAchievements = {},
  addCompetitionEntry = (_cat: string) => {},
  updateCompetitionEntry = (_cat: string, _index: number, _updates: Partial<CompetitionAchievement>) => {},
  removeCompetitionEntry = (_cat: string, _index: number) => {},
  patentDetails = [],
  addPatent = () => {},
  updatePatent = (_index: number, _updates: Partial<PatentDetail>) => {},
  removePatent = (_index: number) => {},
  startupDetails = [],
  addStartup = () => {},
  updateStartup = (_index: number, _updates: Partial<StartupDetail>) => {},
  removeStartup = (_index: number) => {},
  fundedProjectDetails = [],
  addFundedProject = () => {},
  updateFundedProject = (_index: number, _updates: Partial<FundedProjectDetail>) => {},
  removeFundedProject = (_index: number) => {},
  ssipProjectDetails = [],
  addSSIPProject = () => {},
  updateSSIPProject = (_index: number, _updates: Partial<SSIPProjectDetail>) => {},
  removeSSIPProject = (_index: number) => {},
  researchPublicationDetails = [],
  addResearchPublication = () => {},
  updateResearchPublication = (_index: number, _updates: Partial<ResearchPublicationDetail>) => {},
  removeResearchPublication = (_index: number) => {},
  enrollmentNumber = '',
}) => {
  const handleToggle = (cat: AchievementCategory) => {
    if (onToggleCategory) {
      onToggleCategory(cat);
    } else if (toggleCategory) {
      toggleCategory(cat);
    }
  };

  const safePatentDetails = patentDetails && patentDetails.length > 0
    ? patentDetails
    : [{ patentTitle: '', patentAppNumber: '', patentStatus: 'Filed' as const, filingDate: '' }];

  const safeStartupDetails = startupDetails && startupDetails.length > 0
    ? startupDetails
    : [{ startupName: '', studentRole: '', startupStatus: 'Idea Stage' as const, registrationDetails: '' }];

  const safeFundedProjectDetails = fundedProjectDetails && fundedProjectDetails.length > 0
    ? fundedProjectDetails
    : [{ projectTitle: '', fundingAgency: '', fundingAmount: '', projectStatus: 'Approved' as const }];

  const safeSSIPProjectDetails = ssipProjectDetails && ssipProjectDetails.length > 0
    ? ssipProjectDetails
    : [{ projectTitle: '', ssipStatus: 'Approved' as const, fundingAmount: '' }];

  const safeResearchPublicationDetails = researchPublicationDetails && researchPublicationDetails.length > 0
    ? researchPublicationDetails
    : [{ paperTitle: '', journalConferenceName: '', publicationType: 'Journal' as const, publicationStatus: 'Published' as const, doiOrLink: '' }];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5 sm:space-y-6" id="achievement-types-section">
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
          3
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Type of Achievement</h2>
          <p className="text-xs text-slate-500">
            Select one or more achievement categories in checkboxes and provide supporting details &amp; proofs. You can add multiple entries for each category.
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
              <div
                key={id}
                role="checkbox"
                aria-checked={isChecked}
                tabIndex={0}
                onClick={() => handleToggle(id)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleToggle(id);
                  }
                }}
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                  isChecked
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/30 text-indigo-950 font-semibold shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <input
                  type="checkbox"
                  id={`cat-checkbox-${id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  checked={isChecked}
                  onChange={() => {}}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                />
                <Icon className={`w-4 h-4 shrink-0 ${isChecked ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-xs sm:text-sm select-none">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Sub-forms based on checked categories */}
      <div className="space-y-6 pt-2">
        {/* Standard Event / Competition Forms (Hackathon, Sports, Coding, etc.) */}
        {selectedCategories
          .filter((cat) => STANDARD_EVENT_CATEGORIES.includes(cat))
          .map((cat) => {
            const raw = competitionAchievements?.[cat];
            const entries: CompetitionAchievement[] = Array.isArray(raw) && raw.length > 0
              ? raw
              : raw && typeof raw === 'object' && ('eventName' in (raw as any) || 'organizedBy' in (raw as any))
                ? [raw as CompetitionAchievement]
                : [
                    {
                      category: cat,
                      eventName: '',
                      organizedBy: '',
                      level: 'State Level' as const,
                      participationStatus: 'Participated' as const,
                      dateOfAchievement: '',
                      description: '',
                    },
                  ];

            return (
              <div
                key={cat}
                id={`form-section-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                className="p-3.5 sm:p-5 bg-slate-50/90 border border-slate-200 rounded-xl space-y-4"
              >
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{cat} Entries ({entries.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => addCompetitionEntry(cat)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Add Another {cat}</span>
                  </button>
                </div>

                {/* List of Entries for this category */}
                <div className="space-y-4">
                  {entries.map((data, index) => (
                    <div
                      key={index}
                      className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3.5 relative"
                    >
                      {/* Entry Header with Delete */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          {cat} Entry #{index + 1}
                        </span>

                        {entries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCompetitionEntry(cat, index)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
                            title={`Remove this ${cat} entry`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Entry</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Name of Competition / Event / Achievement */}
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            Name of Event / Hackathon / Achievement <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={data.eventName}
                            onChange={(e) => updateCompetitionEntry(cat, index, { eventName: e.target.value })}
                            placeholder="e.g. Smart Gujarat Hackathon / SIH 2024"
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
                            value={data.organizedBy}
                            onChange={(e) => updateCompetitionEntry(cat, index, { organizedBy: e.target.value })}
                            placeholder="e.g. Government of Gujarat / GTU / AICTE"
                            required
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Level */}
                        <div className="space-y-1 sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700">
                            Level <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
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
                                  name={`level-${cat}-${index}`}
                                  value={lvl}
                                  checked={data.level === lvl}
                                  onChange={() => updateCompetitionEntry(cat, index, { level: lvl })}
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
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2">
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
                                  name={`status-${cat}-${index}`}
                                  value={st}
                                  checked={data.participationStatus === st}
                                  onChange={() => updateCompetitionEntry(cat, index, { participationStatus: st })}
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
                            value={data.dateOfAchievement}
                            onChange={(e) => updateCompetitionEntry(cat, index, { dateOfAchievement: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>

                        {/* Brief Description */}
                        <div className="space-y-1 sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700">
                            Brief Description of Achievement
                          </label>
                          <textarea
                            rows={2}
                            value={data.description}
                            onChange={(e) => updateCompetitionEntry(cat, index, { description: e.target.value })}
                            placeholder="Briefly describe your project/performance, team name, or category..."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>

                        {/* Upload Certificate */}
                        <div className="sm:col-span-2">
                          <FileUploadField
                            id={`certificate-${cat}-${index}`}
                            label="Upload Certificate"
                            documentName={`${cat.replace(/[^a-zA-Z0-9]+/g, '_')}_Certificate${entries.length > 1 ? `_${index + 1}` : ''}`}
                            enrollmentNumber={enrollmentNumber}
                            description="Upload 1 supported file. Max 2 MB (PDF only)."
                            value={data.certificateFile}
                            onChange={(file) => updateCompetitionEntry(cat, index, { certificateFile: file })}
                            maxSizeMB={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Add button */}
                <div className="pt-1 flex justify-start">
                  <button
                    type="button"
                    onClick={() => addCompetitionEntry(cat)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>+ Add Another {cat} Entry</span>
                  </button>
                </div>
              </div>
            );
          })}

        {/* Patent Sub-form */}
        {selectedCategories.includes('Patent') && (
          <div id="form-section-patent" className="p-3.5 sm:p-5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-200 pb-2.5 gap-2">
              <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Patent Details ({safePatentDetails.length})</span>
              </h3>
              <button
                type="button"
                onClick={addPatent}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white hover:bg-amber-50 border border-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Add Another Patent</span>
              </button>
            </div>

            <div className="space-y-4">
              {safePatentDetails.map((patent, index) => (
                <div key={index} className="p-3.5 sm:p-4 bg-white border border-amber-200/80 rounded-lg shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Patent #{index + 1}
                    </span>
                    {safePatentDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePatent(index)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Patent</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Patent Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={patent.patentTitle}
                        onChange={(e) => updatePatent(index, { patentTitle: e.target.value })}
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
                        value={patent.patentAppNumber}
                        onChange={(e) => updatePatent(index, { patentAppNumber: e.target.value })}
                        placeholder="e.g. 202421012345"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Patent Status</label>
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        {(['Filed', 'Published', 'Granted'] as const).map((st) => (
                          <label
                            key={st}
                            className={`flex items-center justify-center p-2 rounded-lg border text-xs cursor-pointer text-center font-medium ${
                              patent.patentStatus === st
                                ? 'border-amber-600 bg-amber-100/70 text-amber-950 font-bold'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`patentStatus-${index}`}
                              value={st}
                              checked={patent.patentStatus === st}
                              onChange={() => updatePatent(index, { patentStatus: st })}
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
                        value={patent.filingDate}
                        onChange={(e) => updatePatent(index, { filingDate: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <FileUploadField
                        id={`upload-patent-proof-${index}`}
                        label="Upload Patent Proof"
                        documentName={`Patent_Proof${safePatentDetails.length > 1 ? `_${index + 1}` : ''}`}
                        enrollmentNumber={enrollmentNumber}
                        description="Upload 1 supported file. Max 2 MB (PDF only - Filing receipt, journal, or grant certificate)."
                        value={patent.proofFile}
                        onChange={(file) => updatePatent(index, { proofFile: file })}
                        maxSizeMB={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Startup Sub-form */}
        {selectedCategories.includes('Startup') && (
          <div id="form-section-startup" className="p-3.5 sm:p-5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-200 pb-2.5 gap-2">
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Startup Ventures ({safeStartupDetails.length})</span>
              </h3>
              <button
                type="button"
                onClick={addStartup}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Add Another Startup</span>
              </button>
            </div>

            <div className="space-y-4">
              {safeStartupDetails.map((startup, index) => (
                <div key={index} className="p-3.5 sm:p-4 bg-white border border-emerald-200/80 rounded-lg shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Startup #{index + 1}
                    </span>
                    {safeStartupDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStartup(index)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Startup</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Startup Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={startup.startupName}
                        onChange={(e) => updateStartup(index, { startupName: e.target.value })}
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
                        value={startup.studentRole}
                        onChange={(e) => updateStartup(index, { studentRole: e.target.value })}
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
                              startup.startupStatus === st
                                ? 'border-emerald-600 bg-emerald-100/70 text-emerald-950 font-bold'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`startupStatus-${index}`}
                              value={st}
                              checked={startup.startupStatus === st}
                              onChange={() => updateStartup(index, { startupStatus: st })}
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
                        value={startup.registrationDetails}
                        onChange={(e) => updateStartup(index, { registrationDetails: e.target.value })}
                        placeholder="e.g. DPIIT Recognized / MCA CIN / Udhyam No."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <FileUploadField
                        id={`upload-startup-proof-${index}`}
                        label="Upload Startup Proof"
                        documentName={`Startup_Proof${safeStartupDetails.length > 1 ? `_${index + 1}` : ''}`}
                        enrollmentNumber={enrollmentNumber}
                        description="Upload 1 supported file. Max 2 MB (PDF only - Incorporation certificate, DPIIT letter, or incubation proof)."
                        value={startup.proofFile}
                        onChange={(file) => updateStartup(index, { proofFile: file })}
                        maxSizeMB={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Funded Project Sub-form */}
        {selectedCategories.includes('Funded Project') && (
          <div id="form-section-funded-project" className="p-3.5 sm:p-5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-blue-200 pb-2.5 gap-2">
              <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Funded Projects ({safeFundedProjectDetails.length})</span>
              </h3>
              <button
                type="button"
                onClick={addFundedProject}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Add Another Funded Project</span>
              </button>
            </div>

            <div className="space-y-4">
              {safeFundedProjectDetails.map((project, index) => (
                <div key={index} className="p-3.5 sm:p-4 bg-white border border-blue-200/80 rounded-lg shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      Funded Project #{index + 1}
                    </span>
                    {safeFundedProjectDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFundedProject(index)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Project</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Project Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={project.projectTitle}
                        onChange={(e) => updateFundedProject(index, { projectTitle: e.target.value })}
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
                        value={project.fundingAgency}
                        onChange={(e) => updateFundedProject(index, { fundingAgency: e.target.value })}
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
                        value={project.fundingAmount}
                        onChange={(e) => updateFundedProject(index, { fundingAmount: e.target.value })}
                        placeholder="e.g. ₹ 2,50,000"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Project Status</label>
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        {(['Approved', 'Ongoing', 'Completed'] as const).map((st) => (
                          <label
                            key={st}
                            className={`flex items-center justify-center p-2 rounded-lg border text-xs cursor-pointer font-medium ${
                              project.projectStatus === st
                                ? 'border-blue-600 bg-blue-100/70 text-blue-950 font-bold'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`fundedStatus-${index}`}
                              value={st}
                              checked={project.projectStatus === st}
                              onChange={() => updateFundedProject(index, { projectStatus: st })}
                              className="hidden"
                            />
                            {st}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <FileUploadField
                        id={`upload-funding-proof-${index}`}
                        label="Upload Funding / Approval Proof"
                        documentName={`Funded_Project_Proof${safeFundedProjectDetails.length > 1 ? `_${index + 1}` : ''}`}
                        enrollmentNumber={enrollmentNumber}
                        description="Upload 1 supported file. Max 2 MB (PDF only - Sanction letter or disbursement proof)."
                        value={project.proofFile}
                        onChange={(file) => updateFundedProject(index, { proofFile: file })}
                        maxSizeMB={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SSIP Project Sub-form */}
        {selectedCategories.includes('SSIP Project') && (
          <div id="form-section-ssip" className="p-3.5 sm:p-5 bg-purple-50/50 border border-purple-200 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-purple-200 pb-2.5 gap-2">
              <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600 shrink-0" />
                <span>SSIP Project Details ({safeSSIPProjectDetails.length})</span>
              </h3>
              <button
                type="button"
                onClick={addSSIPProject}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-900 bg-white hover:bg-purple-50 border border-purple-300 rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Add Another SSIP Project</span>
              </button>
            </div>

            <div className="space-y-4">
              {safeSSIPProjectDetails.map((ssip, index) => (
                <div key={index} className="p-3.5 sm:p-4 bg-white border border-purple-200/80 rounded-lg shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                      SSIP Project #{index + 1}
                    </span>
                    {safeSSIPProjectDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSSIPProject(index)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove SSIP Project</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Project Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={ssip.projectTitle}
                        onChange={(e) => updateSSIPProject(index, { projectTitle: e.target.value })}
                        placeholder="e.g. Eco-Friendly Solar Powered Irrigation Controller"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">SSIP Project Status</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2">
                        {(['Selected', 'Approved', 'Funded', 'Ongoing', 'Completed'] as const).map((st) => (
                          <label
                            key={st}
                            className={`flex items-center justify-center p-2 rounded-lg border text-xs cursor-pointer font-medium ${
                              ssip.ssipStatus === st
                                ? 'border-purple-600 bg-purple-100/70 text-purple-950 font-bold'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`ssipStatus-${index}`}
                              value={st}
                              checked={ssip.ssipStatus === st}
                              onChange={() => updateSSIPProject(index, { ssipStatus: st })}
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
                        value={ssip.fundingAmount}
                        onChange={(e) => updateSSIPProject(index, { fundingAmount: e.target.value })}
                        placeholder="e.g. ₹ 75,000 (PoC / Prototype grant)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <FileUploadField
                        id={`upload-ssip-proof-${index}`}
                        label="Upload SSIP Proof (File Upload – Required)"
                        documentName={`SSIP_Project_Proof${safeSSIPProjectDetails.length > 1 ? `_${index + 1}` : ''}`}
                        enrollmentNumber={enrollmentNumber}
                        description="Upload 1 supported file. Max 2 MB (PDF only - SSIP Committee sanction order or grant letter)."
                        required={true}
                        value={ssip.proofFile}
                        onChange={(file) => updateSSIPProject(index, { proofFile: file })}
                        maxSizeMB={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Research Publication Sub-form */}
        {selectedCategories.includes('Research Publication') && (
          <div id="form-section-publication" className="p-3.5 sm:p-5 bg-teal-50/50 border border-teal-200 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-teal-200 pb-2.5 gap-2">
              <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Research Publications ({safeResearchPublicationDetails.length})</span>
              </h3>
              <button
                type="button"
                onClick={addResearchPublication}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-900 bg-white hover:bg-teal-50 border border-teal-300 rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Add Another Publication</span>
              </button>
            </div>

            <div className="space-y-4">
              {safeResearchPublicationDetails.map((pub, index) => (
                <div key={index} className="p-3.5 sm:p-4 bg-white border border-teal-200/80 rounded-lg shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      Publication #{index + 1}
                    </span>
                    {safeResearchPublicationDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeResearchPublication(index)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Publication</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Research Paper Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={pub.paperTitle}
                        onChange={(e) => updateResearchPublication(index, { paperTitle: e.target.value })}
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
                        value={pub.journalConferenceName}
                        onChange={(e) => updateResearchPublication(index, { journalConferenceName: e.target.value })}
                        placeholder="e.g. IEEE Transactions / Springer LNCS"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">DOI / Publication Link</label>
                      <input
                        type="text"
                        value={pub.doiOrLink}
                        onChange={(e) => updateResearchPublication(index, { doiOrLink: e.target.value })}
                        placeholder="e.g. https://doi.org/10.1109/..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">Publication Type</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2">
                        {(['Journal', 'Conference', 'Book', 'Chapter', 'Other'] as const).map((t) => (
                          <label
                            key={t}
                            className={`flex items-center justify-center p-2 rounded-lg border text-xs cursor-pointer font-medium ${
                              pub.publicationType === t
                                ? 'border-teal-600 bg-teal-100/70 text-teal-950 font-bold'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`publicationType-${index}`}
                              value={t}
                              checked={pub.publicationType === t}
                              onChange={() => updateResearchPublication(index, { publicationType: t })}
                              className="hidden"
                            />
                            {t}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">Publication Status</label>
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        {(['Published', 'Accepted', 'Presented'] as const).map((st) => (
                          <label
                            key={st}
                            className={`flex items-center justify-center p-2 rounded-lg border text-xs cursor-pointer font-medium ${
                              pub.publicationStatus === st
                                ? 'border-teal-600 bg-teal-100/70 text-teal-950 font-bold'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`publicationStatus-${index}`}
                              value={st}
                              checked={pub.publicationStatus === st}
                              onChange={() => updateResearchPublication(index, { publicationStatus: st })}
                              className="hidden"
                            />
                            {st}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <FileUploadField
                        id={`upload-publication-proof-${index}`}
                        label="Upload Publication Proof"
                        documentName={`Research_Publication_Proof${safeResearchPublicationDetails.length > 1 ? `_${index + 1}` : ''}`}
                        enrollmentNumber={enrollmentNumber}
                        description="Upload 1 supported file. Max 2 MB (PDF only - Paper first page, acceptance letter, or proceedings copy)."
                        value={pub.proofFile}
                        onChange={(file) => updateResearchPublication(index, { proofFile: file })}
                        maxSizeMB={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
