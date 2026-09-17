import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Database,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import {
  AcademicYear,
  Semester,
  HigherStudiesPlan,
  AchievementCategory,
  CompetitionAchievement,
  PatentDetail,
  StartupDetail,
  FundedProjectDetail,
  SSIPProjectDetail,
  ResearchPublicationDetail,
  ExitProgression,
  UploadedFile,
  StudentSubmission,
} from './types';

import { Header } from './components/Header';
import { BasicInfoSection } from './components/BasicInfoSection';
import { HigherStudiesSection } from './components/HigherStudiesSection';
import { AchievementTypesSection } from './components/AchievementTypesSection';
import { ExitProgressionSection } from './components/ExitProgressionSection';
import { RecordsList } from './components/RecordsList';
import { MongoFlaskModal } from './components/MongoFlaskModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'form' | 'records'>('form');
  const [dbStatus, setDbStatus] = useState<{
    database: string;
    isMongo: boolean;
    mongoConfigured?: boolean;
    mongoError?: string;
    mongoErrorDetail?: string;
    status: string;
    totalSubmissions: number;
  }>({
    database: 'Local Storage',
    isMongo: false,
    mongoConfigured: false,
    status: 'ok',
    totalSubmissions: 0,
  });
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mongoModalOpen, setMongoModalOpen] = useState(false);

  // Form State
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [academicYear, setAcademicYear] = useState<AcademicYear | ''>('2024-25');
  const [semester, setSemester] = useState<Semester | ''>('IV');

  // Higher studies
  const [higherStudiesPlan, setHigherStudiesPlan] = useState<HigherStudiesPlan | ''>('');
  const [higherStudiesProof, setHigherStudiesProof] = useState<UploadedFile | undefined>(undefined);

  // Achievements
  const [selectedAchievementCategories, setSelectedAchievementCategories] = useState<AchievementCategory[]>([]);
  const [competitionAchievements, setCompetitionAchievements] = useState<Record<string, CompetitionAchievement>>({});

  const [patentDetail, setPatentDetail] = useState<PatentDetail>({
    patentTitle: '',
    patentAppNumber: '',
    patentStatus: 'Filed',
    filingDate: '',
  });

  const [startupDetail, setStartupDetail] = useState<StartupDetail>({
    startupName: '',
    studentRole: '',
    startupStatus: 'Idea Stage',
    registrationDetails: '',
  });

  const [fundedProjectDetail, setFundedProjectDetail] = useState<FundedProjectDetail>({
    projectTitle: '',
    fundingAgency: '',
    fundingAmount: '',
    projectStatus: 'Approved',
  });

  const [ssipProjectDetail, setSSIPProjectDetail] = useState<SSIPProjectDetail>({
    projectTitle: '',
    ssipStatus: 'Approved',
    fundingAmount: '',
  });

  const [researchPublicationDetail, setResearchPublicationDetail] = useState<ResearchPublicationDetail>({
    paperTitle: '',
    journalConferenceName: '',
    publicationType: 'Journal',
    publicationStatus: 'Published',
    doiOrLink: '',
  });

  // Exit Progression
  const [exitProgression, setExitProgression] = useState<ExitProgression>({
    isExiting: false,
    exitYear: 'Year 3',
    pathway: 'Higher Education',
  });

  // Fetch DB Health & Records
  const fetchDbHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setDbStatus({
          database: data.database || 'Local Storage',
          isMongo: Boolean(data.isMongo),
          mongoConfigured: Boolean(data.mongoConfigured),
          mongoError: data.mongoError,
          mongoErrorDetail: data.mongoErrorDetail,
          status: data.status,
          totalSubmissions: data.totalSubmissions || 0,
        });
      }
    } catch {
      // Ignore in pure static mode
    }
  };

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const res = await fetch('/api/submissions');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchDbHealth();
    fetchSubmissions();
  }, []);

  const handleToggleCategory = (cat: AchievementCategory) => {
    setSelectedAchievementCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const updateCompetitionAchievement = (cat: string, updates: Partial<CompetitionAchievement>) => {
    setCompetitionAchievements((prev) => ({
      ...prev,
      [cat]: {
        ...(prev[cat] || {
          category: cat,
          eventName: '',
          organizedBy: '',
          level: 'State Level',
          participationStatus: 'Participated',
          dateOfAchievement: '',
          description: '',
        }),
        ...updates,
      },
    }));
  };

  const resetForm = () => {
    setEnrollmentNumber('');
    setFullName('');
    setAcademicYear('2024-25');
    setSemester('IV');
    setHigherStudiesPlan('');
    setHigherStudiesProof(undefined);
    setSelectedAchievementCategories([]);
    setCompetitionAchievements({});
    setPatentDetail({
      patentTitle: '',
      patentAppNumber: '',
      patentStatus: 'Filed',
      filingDate: '',
    });
    setStartupDetail({
      startupName: '',
      studentRole: '',
      startupStatus: 'Idea Stage',
      registrationDetails: '',
    });
    setFundedProjectDetail({
      projectTitle: '',
      fundingAgency: '',
      fundingAmount: '',
      projectStatus: 'Approved',
    });
    setSSIPProjectDetail({
      projectTitle: '',
      ssipStatus: 'Approved',
      fundingAmount: '',
    });
    setResearchPublicationDetail({
      paperTitle: '',
      journalConferenceName: '',
      publicationType: 'Journal',
      publicationStatus: 'Published',
      doiOrLink: '',
    });
    setExitProgression({
      isExiting: false,
      exitYear: 'Year 3',
      pathway: 'Higher Education',
    });
    setSubmitSuccess(null);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    // Validation
    if (!enrollmentNumber.trim()) {
      setSubmitError('Please enter your Enrollment Number.');
      return;
    }
    if (!fullName.trim()) {
      setSubmitError('Please enter your Full Name as per certificate.');
      return;
    }
    if (!academicYear) {
      setSubmitError('Please select the Academic Year.');
      return;
    }
    if (!semester) {
      setSubmitError('Please select your Semester.');
      return;
    }
    if (!higherStudiesPlan) {
      setSubmitError('Please indicate whether you plan to pursue higher studies.');
      return;
    }

    const isYesHigherStudies = higherStudiesPlan.startsWith('Yes');
    if (isYesHigherStudies && !higherStudiesProof) {
      setSubmitError(
        'Supporting Admit Card / Admission Letter / Confirmation document is required when choosing higher studies.'
      );
      return;
    }

    // Check SSIP Project requirement if selected
    if (selectedAchievementCategories.includes('SSIP Project')) {
      if (!ssipProjectDetail.projectTitle.trim()) {
        setSubmitError('Please enter the SSIP Project Title.');
        return;
      }
      if (!ssipProjectDetail.proofFile) {
        setSubmitError('SSIP Proof document upload is required for SSIP Projects.');
        return;
      }
    }

    // Check Exit progression requirements if checked
    if (exitProgression.isExiting) {
      if (exitProgression.pathway === 'Higher Education' && !exitProgression.admissionDocument) {
        setSubmitError('Admission Letter / Confirmation document is required for Higher Education exit.');
        return;
      }
      if (exitProgression.pathway === 'Placement / Employment' && !exitProgression.employmentDocument) {
        setSubmitError('Offer Letter / Employment Letter is required for Placement / Employment exit.');
        return;
      }
      if (exitProgression.pathway === 'Entrepreneurship' && !exitProgression.gstOrOfficialDocument) {
        setSubmitError('GST Registration / Official Proof is required for Entrepreneurship exit.');
        return;
      }
    }

    const payload: StudentSubmission = {
      enrollmentNumber: enrollmentNumber.trim(),
      fullName: fullName.trim(),
      academicYear,
      semester,
      higherStudiesPlan,
      higherStudiesProof,
      selectedAchievementCategories,
      competitionAchievements,
      patentDetail: selectedAchievementCategories.includes('Patent') ? patentDetail : undefined,
      startupDetail: selectedAchievementCategories.includes('Startup') ? startupDetail : undefined,
      fundedProjectDetail: selectedAchievementCategories.includes('Funded Project') ? fundedProjectDetail : undefined,
      ssipProjectDetail: selectedAchievementCategories.includes('SSIP Project') ? ssipProjectDetail : undefined,
      researchPublicationDetail: selectedAchievementCategories.includes('Research Publication')
        ? researchPublicationDetail
        : undefined,
      exitProgression: exitProgression.isExiting ? exitProgression : undefined,
      submittedAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit data');
      }

      setSubmitSuccess(`Student outcome submission recorded successfully in ${resData.database || 'Database'}!`);
      fetchDbHealth();
      fetchSubmissions();

      // Scroll smoothly to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Error occurred while saving data. Please check connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSubmissions();
        fetchDbHealth();
      }
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const isNoHigherStudies = higherStudiesPlan === 'No, I do not plan to pursue higher studies';
  const isYesHigherStudies = higherStudiesPlan && !isNoHigherStudies;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-16">
      {/* Top Navigation & Brand Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        submissionsCount={submissions.length}
        dbStatus={dbStatus}
        onOpenMongoModal={() => setMongoModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Storage Notice Banner if MongoDB is offline */}
        {!dbStatus.isMongo && dbStatus.mongoConfigured && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>
                <strong>Zero Data Loss Guaranteed:</strong> Persistent Local Storage is actively safeguarding all records. Cloud MongoDB is currently unreachable (DNS lookup notice).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMongoModalOpen(true)}
              className="px-3 py-1 bg-amber-200/90 hover:bg-amber-300 text-amber-950 font-semibold rounded-lg shrink-0 self-start sm:self-auto cursor-pointer transition-colors text-[11px]"
            >
              Diagnose &amp; Test MongoDB
            </button>
          </div>
        )}

        {/* Banner Alert for Success */}
        {submitSuccess && (
          <div
            id="submission-success-banner"
            className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start justify-between shadow-xs animate-in fade-in"
          >
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-emerald-950">Submission Completed Successfully</h3>
                <p className="text-xs text-emerald-800 leading-relaxed">{submitSuccess}</p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setCurrentTab('records');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    View in Records List
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Submit Another Student
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banner Alert for Error */}
        {submitError && (
          <div
            id="submission-error-banner"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-xs text-rose-800 shadow-xs"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-900">Submission Notice</p>
              <p>{submitError}</p>
            </div>
          </div>
        )}

        {/* Tab 1: Form View */}
        {currentTab === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-6" id="student-outcome-form">
            {/* Section 1: Basic Data */}
            <BasicInfoSection
              enrollmentNumber={enrollmentNumber}
              setEnrollmentNumber={setEnrollmentNumber}
              fullName={fullName}
              setFullName={setFullName}
              academicYear={academicYear}
              setAcademicYear={setAcademicYear}
              semester={semester}
              setSemester={setSemester}
            />

            {/* Section 2: Higher Studies Plan */}
            <HigherStudiesSection
              higherStudiesPlan={higherStudiesPlan}
              setHigherStudiesPlan={setHigherStudiesPlan}
              higherStudiesProof={higherStudiesProof}
              setHigherStudiesProof={setHigherStudiesProof}
            />

            {/* Prompt Condition:
                "after selecting no give submit button"
                When "No" is chosen, show a prominent direct submit button!
            */}
            {isNoHigherStudies && (
              <div
                id="direct-no-submit-card"
                className="p-5 bg-white rounded-xl border-2 border-indigo-200 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-indigo-600" />
                      Ready to Submit Student Information
                    </h3>
                    <p className="text-xs text-slate-500">
                      Since you are not pursuing higher studies, you can submit your basic record now or scroll down to declare achievements/progression if applicable.
                    </p>
                  </div>
                  <button
                    type="submit"
                    id="direct-submit-no-button"
                    disabled={submitting}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Submitting to Database...' : 'Submit Student Data'}
                  </button>
                </div>
              </div>
            )}

            {/* Section 3: Type of Achievement (Sports, Hackathon, Patent, Startup, SSIP, etc.) */}
            {/* Available to fill out for all students or after selecting yes/no */}
            <AchievementTypesSection
              selectedCategories={selectedAchievementCategories}
              toggleCategory={handleToggleCategory}
              competitionAchievements={competitionAchievements}
              updateCompetitionAchievement={updateCompetitionAchievement}
              patentDetail={patentDetail}
              setPatentDetail={setPatentDetail}
              startupDetail={startupDetail}
              setStartupDetail={setStartupDetail}
              fundedProjectDetail={fundedProjectDetail}
              setFundedProjectDetail={setFundedProjectDetail}
              ssipProjectDetail={ssipProjectDetail}
              setSSIPProjectDetail={setSSIPProjectDetail}
              researchPublicationDetail={researchPublicationDetail}
              setResearchPublicationDetail={setResearchPublicationDetail}
            />

            {/* Section 4: Exit / Progression After Year 2 / 3 / 4 */}
            <ExitProgressionSection
              exitProgression={exitProgression}
              setExitProgression={setExitProgression}
            />

            {/* Main Form Action Bar */}
            <div
              id="form-action-bar"
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                Reset Form
              </button>

              <button
                type="submit"
                id="main-submit-button"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Saving to Database...' : 'Submit Student Outcome Record'}
              </button>
            </div>
          </form>
        ) : (
          /* Tab 2: Records List View */
          <RecordsList
            submissions={submissions}
            loading={loadingSubmissions}
            onRefresh={() => {
              fetchDbHealth();
              fetchSubmissions();
            }}
            onDelete={handleDeleteRecord}
            dbType={dbStatus.database}
          />
        )}
      </main>

      {/* MongoDB & Flask Info Dialog */}
      <MongoFlaskModal
        isOpen={mongoModalOpen}
        onClose={() => setMongoModalOpen(false)}
        dbStatus={dbStatus}
        onRefreshHealth={() => {
          fetchDbHealth();
          fetchSubmissions();
        }}
      />
    </div>
  );
}
