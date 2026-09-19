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
  FileSpreadsheet,
  FolderDown,
  Archive,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StudentSubmission, AcademicYear, Semester, UploadedFile, CompetitionAchievement } from '../types';
import { PdfPreviewModal } from './PdfPreviewModal';
import { downloadStudentDocumentsZip, extractSubmissionDocuments } from '../utils/documentUtils';

interface RecordsListProps {
  submissions: StudentSubmission[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  onEdit?: (sub: StudentSubmission) => void;
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
  const [exportingType, setExportingType] = useState<'csv' | 'excel' | 'json' | null>(null);
  const [downloadingZipId, setDownloadingZipId] = useState<string | null>(null);

  const handleDownloadZip = async (sub: StudentSubmission, e: React.MouseEvent) => {
    e.stopPropagation();
    const subId = sub._id || sub.id || sub.enrollmentNumber;
    try {
      setDownloadingZipId(subId);
      await downloadStudentDocumentsZip(sub);
    } catch (err: any) {
      console.error('Failed to download documents ZIP:', err);
      alert(err.message || 'Failed to download student documents archive.');
    } finally {
      setDownloadingZipId(null);
    }
  };

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

  const getSubmissionDocuments = (sub: StudentSubmission) => {
    const docs: { label: string; file: UploadedFile }[] = [];

    if (sub.higherStudiesProof) {
      docs.push({ label: 'Higher Studies Proof', file: sub.higherStudiesProof });
    }

    if (sub.competitionAchievements) {
      for (const [cat, raw] of Object.entries(sub.competitionAchievements)) {
        const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
        arr.forEach((ach, i) => {
          if (ach.certificateFile) {
            docs.push({ label: `${cat} #${i + 1} Certificate`, file: ach.certificateFile });
          }
        });
      }
    }

    (sub.patentDetails || (sub.patentDetail ? [sub.patentDetail] : [])).forEach((p, idx) => {
      if (p.proofFile) {
        docs.push({ label: `Patent #${idx + 1} Proof`, file: p.proofFile });
      }
    });

    (sub.startupDetails || (sub.startupDetail ? [sub.startupDetail] : [])).forEach((s, idx) => {
      if (s.proofFile) {
        docs.push({ label: `Startup #${idx + 1} Proof`, file: s.proofFile });
      }
    });

    (sub.fundedProjectDetails || (sub.fundedProjectDetail ? [sub.fundedProjectDetail] : [])).forEach((fp, idx) => {
      if (fp.proofFile) {
        docs.push({ label: `Funded Project #${idx + 1} Proof`, file: fp.proofFile });
      }
    });

    (sub.ssipProjectDetails || (sub.ssipProjectDetail ? [sub.ssipProjectDetail] : [])).forEach((sp, idx) => {
      if (sp.proofFile) {
        docs.push({ label: `SSIP Project #${idx + 1} Proof`, file: sp.proofFile });
      }
    });

    (sub.researchPublicationDetails || (sub.researchPublicationDetail ? [sub.researchPublicationDetail] : [])).forEach((rp, idx) => {
      if (rp.proofFile) {
        docs.push({ label: `Publication #${idx + 1} Proof`, file: rp.proofFile });
      }
    });

    if (sub.exitProgression?.admissionDocument) {
      docs.push({ label: 'Exit Higher Ed Admission Proof', file: sub.exitProgression.admissionDocument });
    }
    if (sub.exitProgression?.employmentDocument) {
      docs.push({ label: 'Exit Employment Proof', file: sub.exitProgression.employmentDocument });
    }
    if (sub.exitProgression?.gstOrOfficialDocument) {
      docs.push({ label: 'Exit GST / Venture Proof', file: sub.exitProgression.gstOrOfficialDocument });
    }

    return docs;
  };

  const exportExcel = () => {
    if (filtered.length === 0) return;
    setExportingType('excel');

    try {
      const data = filtered.map((sub) => {
        const attachedDocs = getSubmissionDocuments(sub);
        const docNames = attachedDocs.map((d) => `${d.label}: ${d.file.name}`).join(' | ') || 'None';

        return {
          'Enrollment Number': sub.enrollmentNumber || '',
          'Full Name': sub.fullName || '',
          'Academic Year': sub.academicYear || '',
          'Semester': sub.semester || '',
          'Higher Studies Plan': sub.higherStudiesPlan || '',
          'Higher Studies University / Institute': sub.higherStudiesUniversityName || 'N/A',
          'Achievement Categories': (sub.selectedAchievementCategories || []).join(', '),
          'Exiting After': sub.exitProgression?.isExiting ? sub.exitProgression.exitYear : 'N/A',
          'Progression Pathway': sub.exitProgression?.isExiting ? sub.exitProgression.pathway : 'N/A',
          'Progression Details': sub.exitProgression?.isExiting
            ? sub.exitProgression.pathway === 'Higher Education'
              ? `${sub.exitProgression.institutionName || ''} - ${sub.exitProgression.programName || ''}`
              : sub.exitProgression.pathway === 'Placement / Employment'
              ? `${sub.exitProgression.companyName || ''} (${sub.exitProgression.designation || ''})`
              : sub.exitProgression.pathway === 'Entrepreneurship'
              ? `${sub.exitProgression.companyOrVentureName || ''} (GST: ${sub.exitProgression.gstNumber || ''})`
              : sub.exitProgression.otherDetails || ''
            : 'N/A',
          'Attached Documents': docNames,
          'Submitted At': sub.submittedAt || '',
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      // Format column widths for better readability
      ws['!cols'] = [
        { wch: 18 }, // Enrollment
        { wch: 22 }, // Full Name
        { wch: 14 }, // AY
        { wch: 10 }, // Sem
        { wch: 20 }, // Higher Studies Plan
        { wch: 25 }, // University
        { wch: 30 }, // Achievement Categories
        { wch: 14 }, // Exiting After
        { wch: 22 }, // Pathway
        { wch: 30 }, // Progression Details
        { wch: 40 }, // Attached Documents
        { wch: 22 }, // Submitted At
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Student Outcomes');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileName = `student_outcomes_${Date.now()}.xlsx`;
      const fileUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to export Excel:', e);
    } finally {
      setExportingType(null);
    }
  };

  const exportCSV = () => {
    if (filtered.length === 0) return;
    setExportingType('csv');

    try {
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
        'Attached Documents',
        'Submitted At',
      ];

      const rows = filtered.map((sub) => {
        const attachedDocs = getSubmissionDocuments(sub);
        const docNames = attachedDocs.map((d) => `${d.label}: ${d.file.name}`).join(' | ') || 'None';

        return [
          `"${sub.enrollmentNumber || ''}"`,
          `"${sub.fullName || ''}"`,
          `"${sub.academicYear || ''}"`,
          `"${sub.semester || ''}"`,
          `"${sub.higherStudiesPlan || ''}"`,
          `"${sub.higherStudiesUniversityName || 'N/A'}"`,
          `"${(sub.selectedAchievementCategories || []).join(', ')}"`,
          `"${sub.exitProgression?.isExiting ? sub.exitProgression.exitYear : 'N/A'}"`,
          `"${sub.exitProgression?.isExiting ? sub.exitProgression.pathway : 'N/A'}"`,
          `"${docNames}"`,
          `"${sub.submittedAt || ''}"`,
        ];
      });

      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const fileName = `student_outcomes_${Date.now()}.csv`;
      const fileUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to export CSV:', e);
    } finally {
      setExportingType(null);
    }
  };

  const exportJSON = () => {
    if (submissions.length === 0) return;
    setExportingType('json');

    try {
      const dataStr = JSON.stringify(filtered, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
      const fileName = `student_outcomes_${Date.now()}.json`;
      const fileUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to export JSON:', e);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="space-y-6" id="records-view-container">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 flex-wrap">
            <span>Student Outcome Submissions Database</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
              {filtered.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Backed by <strong className="text-slate-700">{dbType}</strong>. All student entries, certificates, and admission proofs.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex-1 xs:flex-none justify-center px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={exportExcel}
            disabled={filtered.length === 0 || Boolean(exportingType)}
            className="flex-1 xs:flex-none justify-center px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap"
          >
            {exportingType === 'excel' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            <span>Export to Excel</span>
          </button>
          <button
            type="button"
            onClick={exportCSV}
            disabled={filtered.length === 0 || Boolean(exportingType)}
            className="flex-1 xs:flex-none justify-center px-3 py-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap"
          >
            {exportingType === 'csv' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-700" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={exportJSON}
            disabled={submissions.length === 0 || Boolean(exportingType)}
            className="flex-1 xs:flex-none justify-center px-3 py-2 text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap"
          >
            {exportingType === 'json' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-700" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export JSON</span>
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
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
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
            const studentDocs = extractSubmissionDocuments(item);
            const docCount = studentDocs.length;
            const hasDocs = docCount > 0;
            const isDownloadingThis = downloadingZipId === id || downloadingZipId === item.enrollmentNumber;

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

                  <div className="flex items-center space-x-1.5 sm:space-x-2 self-end sm:self-center shrink-0">
                    <div className="text-right hidden md:block mr-2">
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
                      id={`download-zip-btn-${id || item.enrollmentNumber}`}
                      onClick={(e) => hasDocs && handleDownloadZip(item, e)}
                      disabled={!hasDocs || isDownloadingThis}
                      className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold select-none ${
                        hasDocs
                          ? 'text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 cursor-pointer shadow-2xs'
                          : 'text-slate-300 bg-slate-50 border border-slate-200/50 cursor-not-allowed opacity-60'
                      }`}
                      title={
                        hasDocs
                          ? `Download all ${docCount} document${docCount > 1 ? 's' : ''} as ZIP for ${item.enrollmentNumber}`
                          : 'No documents uploaded for this student'
                      }
                    >
                      {isDownloadingThis ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      ) : (
                        <Archive className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {hasDocs ? `ZIP (${docCount})` : 'No Docs'}
                      </span>
                    </button>

                    {onEdit && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                        }}
                        className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit this record"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

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
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete this record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="text-slate-400 p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-5 text-xs">
                      {/* Timestamps */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
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

                        {hasDocs && (
                          <button
                            type="button"
                            onClick={(e) => handleDownloadZip(item, e)}
                            disabled={isDownloadingThis}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0 text-xs"
                          >
                            {isDownloadingThis ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>Download All {docCount} Document{docCount > 1 ? 's' : ''} (ZIP)</span>
                          </button>
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

                        {item.exitProgression.pathway === 'Other' && (
                          <div className="space-y-1">
                            <p><strong>Status / Details:</strong> {item.exitProgression.otherDetails || 'Not specified'}</p>
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
                            const evList: CompetitionAchievement[] = Array.isArray(rawEv)
                              ? rawEv
                              : (rawEv && typeof rawEv === 'object' ? [rawEv as CompetitionAchievement] : []);
                            return evList.map((ev, idx) => (
                              <div key={`${cat}-${idx}`} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-indigo-900">
                                    {cat}{evList.length > 1 ? ` #${idx + 1}` : ''}: {ev.eventName || 'Untitled Event'}
                                  </span>
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
                            ));
                          })}

                          {/* Patent */}
                          {((item.patentDetails && item.patentDetails.length > 0)
                            ? item.patentDetails
                            : (item.patentDetail?.patentTitle ? [item.patentDetail] : [])
                          ).map((pat, idx) => pat.patentTitle && (
                            <div key={`pat-${idx}`} className="p-3 bg-white rounded-lg border border-amber-200 space-y-1">
                              <span className="font-bold text-amber-900">Patent{item.patentDetails && item.patentDetails.length > 1 ? ` #${idx + 1}` : ''}: {pat.patentTitle}</span>
                              <p className="text-slate-600">App No: {pat.patentAppNumber} • Status: {pat.patentStatus} • Date: {pat.filingDate}</p>
                              {pat.proofFile && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(pat.proofFile!)}
                                  className="mt-1 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 flex items-center gap-1 font-medium"
                                >
                                  <Eye className="w-3 h-3" />
                                  View Patent Proof ({pat.proofFile.name})
                                </button>
                              )}
                            </div>
                          ))}

                          {/* Startup */}
                          {((item.startupDetails && item.startupDetails.length > 0)
                            ? item.startupDetails
                            : (item.startupDetail?.startupName ? [item.startupDetail] : [])
                          ).map((startup, idx) => startup.startupName && (
                            <div key={`startup-${idx}`} className="p-3 bg-white rounded-lg border border-emerald-200 space-y-1">
                              <span className="font-bold text-emerald-900">Startup{item.startupDetails && item.startupDetails.length > 1 ? ` #${idx + 1}` : ''}: {startup.startupName}</span>
                              <p className="text-slate-600">Role: {startup.studentRole} • Status: {startup.startupStatus}</p>
                              {startup.registrationDetails && (
                                <p className="text-slate-500">Reg: {startup.registrationDetails}</p>
                              )}
                              {startup.proofFile && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(startup.proofFile!)}
                                  className="mt-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 font-medium"
                                >
                                  <Eye className="w-3 h-3" />
                                  View Startup Proof ({startup.proofFile.name})
                                </button>
                              )}
                            </div>
                          ))}

                          {/* Funded Project */}
                          {((item.fundedProjectDetails && item.fundedProjectDetails.length > 0)
                            ? item.fundedProjectDetails
                            : (item.fundedProjectDetail?.projectTitle ? [item.fundedProjectDetail] : [])
                          ).map((proj, idx) => proj.projectTitle && (
                            <div key={`proj-${idx}`} className="p-3 bg-white rounded-lg border border-blue-200 space-y-1">
                              <span className="font-bold text-blue-900">Funded Project{item.fundedProjectDetails && item.fundedProjectDetails.length > 1 ? ` #${idx + 1}` : ''}: {proj.projectTitle}</span>
                              <p className="text-slate-600">Agency: {proj.fundingAgency} • Amount: {proj.fundingAmount} • Status: {proj.projectStatus}</p>
                              {proj.proofFile && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(proj.proofFile!)}
                                  className="mt-1 px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 flex items-center gap-1 font-medium"
                                >
                                  <Eye className="w-3 h-3" />
                                  View Funding Proof ({proj.proofFile.name})
                                </button>
                              )}
                            </div>
                          ))}

                          {/* SSIP Project */}
                          {((item.ssipProjectDetails && item.ssipProjectDetails.length > 0)
                            ? item.ssipProjectDetails
                            : (item.ssipProjectDetail?.projectTitle ? [item.ssipProjectDetail] : [])
                          ).map((ssip, idx) => ssip.projectTitle && (
                            <div key={`ssip-${idx}`} className="p-3 bg-white rounded-lg border border-purple-200 space-y-1">
                              <span className="font-bold text-purple-900">SSIP Project{item.ssipProjectDetails && item.ssipProjectDetails.length > 1 ? ` #${idx + 1}` : ''}: {ssip.projectTitle}</span>
                              <p className="text-slate-600">Status: {ssip.ssipStatus} • Amount: {ssip.fundingAmount}</p>
                              {ssip.proofFile && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(ssip.proofFile!)}
                                  className="mt-1 px-2.5 py-1 rounded bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 flex items-center gap-1 font-medium"
                                >
                                  <Eye className="w-3 h-3" />
                                  View SSIP Proof ({ssip.proofFile.name})
                                </button>
                              )}
                            </div>
                          ))}

                          {/* Research Publication */}
                          {((item.researchPublicationDetails && item.researchPublicationDetails.length > 0)
                            ? item.researchPublicationDetails
                            : (item.researchPublicationDetail?.paperTitle ? [item.researchPublicationDetail] : [])
                          ).map((pub, idx) => pub.paperTitle && (
                            <div key={`pub-${idx}`} className="p-3 bg-white rounded-lg border border-teal-200 space-y-1">
                              <span className="font-bold text-teal-900">Research Publication{item.researchPublicationDetails && item.researchPublicationDetails.length > 1 ? ` #${idx + 1}` : ''}: {pub.paperTitle}</span>
                              <p className="text-slate-600">
                                Venue: {pub.journalConferenceName} • Type: {pub.publicationType} • Status: {pub.publicationStatus}
                              </p>
                              {pub.doiOrLink && (
                                <p className="text-slate-500">DOI / Link: {pub.doiOrLink}</p>
                              )}
                              {pub.proofFile && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(pub.proofFile!)}
                                  className="mt-1 px-2.5 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 flex items-center gap-1 font-medium"
                                >
                                  <Eye className="w-3 h-3" />
                                  View Publication Proof ({pub.proofFile.name})
                                </button>
                              )}
                            </div>
                          ))}
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
      <PdfPreviewModal
        isOpen={Boolean(previewFile)}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

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
