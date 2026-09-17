import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Award,
  GraduationCap,
  Calendar,
  Layers,
  User,
  Hash,
  Eye,
  RefreshCw,
  Pencil,
  Clock,
} from 'lucide-react';
import { StudentSubmission, AcademicYear, Semester, UploadedFile, CompetitionAchievement } from '../types';

interface RecordsListProps {
  submissions: StudentSubmission[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  onEdit: (sub: StudentSubmission) => void;
  dbType: string;
}

export const RecordsList: React.FC<RecordsListProps> = ({
  submissions,
  loading,
  onRefresh,
  onDelete,
  onEdit,
  dbType,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{ id: string; name: string; enrollment: string } | null>(null);

  const filtered = submissions.filter((item) => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      !s ||
      item.enrollmentNumber?.toLowerCase().includes(s) ||
      item.fullName?.toLowerCase().includes(s);

    const matchYear = selectedYear === 'all' || item.academicYear === selectedYear;
    const matchSem = selectedSemester === 'all' || item.semester === selectedSemester;

    return matchSearch && matchYear && matchSem;
  });

  const exportCSV = () => {
    if (submissions.length === 0) return;
    const headers = [
      'Enrollment Number',
      'Full Name',
      'Academic Year',
      'Semester',
      'Higher Studies Plan',
      'Higher Studies University / Institute',
      'Achievement Categories',
      'Exiting After',
      'Progression Pathway',
      'Submitted At',
    ];

    const rows = filtered.map((sub) => [
      `"${sub.enrollmentNumber || ''}"`,
      `"${sub.fullName || ''}"`,
      `"${sub.academicYear || ''}"`,
      `"${sub.semester || ''}"`,
      `"${sub.higherStudiesPlan || ''}"`,
      `"${sub.higherStudiesUniversityName || 'N/A'}"`,
      `"${(sub.selectedAchievementCategories || []).join(', ')}"`,
      `"${sub.exitProgression?.isExiting ? sub.exitProgression.exitYear : 'N/A'}"`,
      `"${sub.exitProgression?.isExiting ? sub.exitProgression.pathway : 'N/A'}"`,
      `"${sub.submittedAt || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `student_outcomes_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(submissions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `student_outcomes_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6" id="records-view-container">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Student Outcome Submissions Database
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
              {filtered.length} of {submissions.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Backed by <strong className="text-slate-700">{dbType}</strong>. All student entries, certificates, and admission proofs.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={exportJSON}
            disabled={submissions.length === 0}
            className="px-3 py-2 text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search enrollment no or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Academic Years</option>
            <option value="2023-24">2023-24</option>
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
            <option value="2026-27">2026-27</option>
          </select>
        </div>

        <div>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Semesters</option>
            <option value="I">Semester I</option>
            <option value="II">Semester II</option>
            <option value="III">Semester III</option>
            <option value="IV">Semester IV</option>
            <option value="V">Semester V</option>
            <option value="VI">Semester VI</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          Loading student submissions from {dbType}...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No submissions found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No records match the current filters. Switch to the "Data Form" tab to submit a student outcome entry!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const id = item._id || item.id || '';
            const isExpanded = expandedId === id;

            return (
              <div
                key={id}
                id={`record-card-${id}`}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Collapsed Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {item.enrollmentNumber}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{item.fullName}</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        AY {item.academicYear} • Sem {item.semester}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      Higher Studies: <span className="font-medium text-slate-800">{item.higherStudiesPlan}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <div className="text-right hidden md:block">
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {new Date(item.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      {(item as any).updatedAt && (
                        <p className="text-[10px] text-amber-600 font-medium">
                          Updated: {new Date((item as any).updatedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      )}
                      <p className="text-[11px] text-indigo-600 font-medium">
                        {(item.selectedAchievementCategories || []).length} Achievements
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                      className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit record"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteTarget({
                          id,
                          name: item.fullName,
                          enrollment: item.enrollmentNumber,
                        });
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-5 text-xs">
                      {/* Timestamps */}
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                          <Clock className="w-3 h-3" />
                          Submitted: {new Date(item.submittedAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'medium' })}
                        </span>
                        {(item as any).updatedAt && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                            <Pencil className="w-3 h-3" />
                            Last Updated: {new Date((item as any).updatedAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'medium' })}
                          </span>
                        )}
                      </div>
                      {/* Basic Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-400 block">Enrollment No</span>
                        <span className="font-mono font-bold text-slate-800">{item.enrollmentNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Full Name</span>
                        <span className="font-semibold text-slate-800">{item.fullName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Academic Year</span>
                        <span className="font-semibold text-slate-800">{item.academicYear}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Semester</span>
                        <span className="font-semibold text-slate-800">Sem {item.semester}</span>
                      </div>
                    </div>

                    {/* Higher Studies Details & Proof */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 block">Higher Studies Decision &amp; Verification</span>
                      <p className="text-slate-700">{item.higherStudiesPlan}</p>
                      {item.higherStudiesUniversityName && (
                        <p className="text-xs text-indigo-700 font-semibold bg-indigo-50/70 border border-indigo-100 px-2.5 py-1 rounded inline-block">
                          Institution: {item.higherStudiesUniversityName}
                        </p>
                      )}
                      {item.higherStudiesProof && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setPreviewFile(item.higherStudiesProof!)}
                            className="px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1 font-medium"
                          >
                            <Eye className="w-3 h-3" />
                            View Admit Card / Admission Proof ({item.higherStudiesProof.name})
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Exit Progression */}
                    {item.exitProgression?.isExiting && (
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">Exit / Progression After {item.exitProgression.exitYear}</span>
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                            {item.exitProgression.pathway}
                          </span>
                        </div>

                        {item.exitProgression.pathway === 'Higher Education' && (
                          <div className="space-y-1">
                            <p><strong>Institution:</strong> {item.exitProgression.institutionName}</p>
                            <p><strong>Program:</strong> {item.exitProgression.programName}</p>
                            {item.exitProgression.admissionDocument && (
                              <button
                                type="button"
                                onClick={() => setPreviewFile(item.exitProgression!.admissionDocument!)}
                                className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 flex items-center gap-1 font-medium mt-1"
                              >
                                <Eye className="w-3 h-3" />
                                View Admission Letter ({item.exitProgression.admissionDocument.name})
                              </button>
                            )}
                          </div>
                        )}

                        {item.exitProgression.pathway === 'Placement / Employment' && (
                          <div className="space-y-1">
                            <p><strong>Organization:</strong> {item.exitProgression.companyName}</p>
                            <p><strong>Designation:</strong> {item.exitProgression.designation}</p>
                            {item.exitProgression.employmentDocument && (
                              <button
                                type="button"
                                onClick={() => setPreviewFile(item.exitProgression!.employmentDocument!)}
                                className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 flex items-center gap-1 font-medium mt-1"
                              >
                                <Eye className="w-3 h-3" />
                                View Offer / Employment Letter ({item.exitProgression.employmentDocument.name})
                              </button>
                            )}
                          </div>
                        )}

                        {item.exitProgression.pathway === 'Entrepreneurship' && (
                          <div className="space-y-1">
                            <p><strong>Venture Name:</strong> {item.exitProgression.companyOrVentureName}</p>
                            <p><strong>GST Number:</strong> {item.exitProgression.gstNumber}</p>
                            {item.exitProgression.gstOrOfficialDocument && (
                              <button
                                type="button"
                                onClick={() => setPreviewFile(item.exitProgression!.gstOrOfficialDocument!)}
                                className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 flex items-center gap-1 font-medium mt-1"
                              >
                                <Eye className="w-3 h-3" />
                                View GST / Venture Document ({item.exitProgression.gstOrOfficialDocument.name})
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Achievements Breakdown */}
                    {item.selectedAchievementCategories && item.selectedAchievementCategories.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-bold text-slate-900 block">Reported Achievements &amp; Proofs:</span>

                        <div className="grid grid-cols-1 gap-2.5">
                          {/* Standard events */}
                          {Object.entries(item.competitionAchievements || {}).map(([cat, rawEv]) => {
                            const ev = rawEv as CompetitionAchievement;
                            return (
                            <div key={cat} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-indigo-900">{cat}: {ev.eventName}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-semibold">
                                  {ev.level} • {ev.participationStatus}
                                </span>
                              </div>
                              <p className="text-slate-600">Organized by: {ev.organizedBy} | Date: {ev.dateOfAchievement}</p>
                              {ev.description && <p className="text-slate-500 italic">{ev.description}</p>}
                              {ev.certificateFile && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(ev.certificateFile!)}
                                  className="mt-1 px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1 font-medium"
                                >
                                  <Eye className="w-3 h-3" />
                                  View Certificate ({ev.certificateFile.name})
                                </button>
                              )}
                            </div>
                          );
                          })}

                          {/* Patent */}
                          {item.patentDetail?.patentTitle && (
                            <div className="p-3 bg-white rounded-lg border border-amber-200 space-y-1">
                              <span className="font-bold text-amber-900">Patent: {item.patentDetail.patentTitle}</span>
                              <p className="text-slate-600">App No: {item.patentDetail.patentAppNumber} • Status: {item.patentDetail.patentStatus} • Date: {item.patentDetail.filingDate}</p>
                              {item.patentDetail.proofFile && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(item.patentDetail!.proofFile!)}
                                  className="mt-1 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 flex items-center gap-1 font-medium"
                                >
                                  <Eye className="w-3 h-3" />
                                  View Patent Proof ({item.patentDetail.proofFile.name})
                                </button>
                              )}
                            </div>
                          )}

                          {/* Startup */}
                          {item.startupDetail?.startupName && (
                            <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-1">
                              <span className="font-bold text-emerald-900">Startup: {item.startupDetail.startupName}</span>
                              <p className="text-slate-600">Role: {item.startupDetail.studentRole} • Status: {item.startupDetail.startupStatus}</p>
                              {item.startupDetail.registrationDetails && (
                                <p className="text-slate-500">Reg: {item.startupDetail.registrationDetails}</p>
                              )}
                              {item.startupDetail.proofFile && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(item.startupDetail!.proofFile!)}
                                  className="mt-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 font-medium"
                                >
                                  <Eye className="w-3 h-3" />
                                  View Startup Proof ({item.startupDetail.proofFile.name})
                                </button>
                              )}
                            </div>
                          )}

                          {/* Funded Project */}
                          {item.fundedProjectDetail?.projectTitle && (
                            <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-1">
                              <span className="font-bold text-blue-900">Funded Project: {item.fundedProjectDetail.projectTitle}</span>
                              <p className="text-slate-600">Agency: {item.fundedProjectDetail.fundingAgency} • Amount: {item.fundedProjectDetail.fundingAmount} • Status: {item.fundedProjectDetail.projectStatus}</p>
                              {item.fundedProjectDetail.proofFile && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(item.fundedProjectDetail!.proofFile!)}
                                  className="mt-1 px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 flex items-center gap-1 font-medium"
                                >
                                  <Eye className="w-3 h-3" />
                                  View Funding Proof ({item.fundedProjectDetail.proofFile.name})
                                </button>
                              )}
                            </div>
                          )}

                          {/* SSIP Project */}
                          {item.ssipProjectDetail?.projectTitle && (
                            <div className="p-3 bg-white rounded-lg border border-purple-200 space-y-1">
                              <span className="font-bold text-purple-900">SSIP Project: {item.ssipProjectDetail.projectTitle}</span>
                              <p className="text-slate-600">Status: {item.ssipProjectDetail.ssipStatus} • Amount: {item.ssipProjectDetail.fundingAmount}</p>
                              {item.ssipProjectDetail.proofFile && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(item.ssipProjectDetail!.proofFile!)}
                                  className="mt-1 px-2.5 py-1 rounded bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 flex items-center gap-1 font-medium"
                                >
                                  <Eye className="w-3 h-3" />
                                  View SSIP Proof ({item.ssipProjectDetail.proofFile.name})
                                </button>
                              )}
                            </div>
                          )}

                          {/* Research Publication */}
                          {item.researchPublicationDetail?.paperTitle && (
                            <div className="p-3 bg-white rounded-lg border border-teal-200 space-y-1">
                              <span className="font-bold text-teal-900">Research Publication: {item.researchPublicationDetail.paperTitle}</span>
                              <p className="text-slate-600">
                                Venue: {item.researchPublicationDetail.journalConferenceName} • Type: {item.researchPublicationDetail.publicationType} • Status: {item.researchPublicationDetail.publicationStatus}
                              </p>
                              {item.researchPublicationDetail.doiOrLink && (
                                <p className="text-slate-500">DOI / Link: {item.researchPublicationDetail.doiOrLink}</p>
                              )}
                              {item.researchPublicationDetail.proofFile && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(item.researchPublicationDetail!.proofFile!)}
                                  className="mt-1 px-2.5 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 flex items-center gap-1 font-medium"
                                >
                                  <Eye className="w-3 h-3" />
                                  View Publication Proof ({item.researchPublicationDetail.proofFile.name})
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Global Document Viewer Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">{previewFile.name}</h4>
                <p className="text-xs text-slate-500">{(previewFile.size / 1024).toFixed(1)} KB • {previewFile.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.dataUrl}
                  download={previewFile.name}
                  className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-100 min-h-[350px]">
              {previewFile.dataUrl.startsWith('data:image/') ? (
                <img
                  src={previewFile.dataUrl}
                  alt={previewFile.name}
                  className="max-h-[65vh] max-w-full rounded object-contain shadow-xs"
                />
              ) : previewFile.dataUrl.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewFile.dataUrl}
                  title={previewFile.name}
                  className="w-full h-[65vh] rounded border border-slate-200"
                />
              ) : (
                <div className="text-center p-6 bg-white rounded-lg border border-slate-200">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Document ready for download</p>
                  <a
                    href={previewFile.dataUrl}
                    download={previewFile.name}
                    className="mt-3 inline-block px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {confirmDeleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setConfirmDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Student Record?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete the submission record for{' '}
                  <strong className="text-slate-800">{confirmDeleteTarget.name}</strong> (Enrollment:{' '}
                  <span className="font-mono text-indigo-600">{confirmDeleteTarget.enrollment}</span>)?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
              This will remove the student entry and all attached certification files from {dbType}. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = confirmDeleteTarget.id;
                  setConfirmDeleteTarget(null);
                  onDelete(targetId);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
