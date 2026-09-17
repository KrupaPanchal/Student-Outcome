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
  ShieldCheck,
  Lock,
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

import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'form' | 'records'>('form');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('portal_admin_auth') === 'true';
  });
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string>(
    () => sessionStorage.getItem('portal_admin_user') || 'admin'
  );

  const [dbStatus, setDbStatus] = useState<{
    database: string;
    isNeon?: boolean;
    isMongo?: boolean;
    neonConfigured?: boolean;
    mongoConfigured?: boolean;
    neonError?: string;
    mongoError?: string;
    mongoErrorDetail?: string;
    status: string;
    totalSubmissions: number;
  }>({
    database: 'Neon PostgreSQL (Active)',
    isNeon: true,
    isMongo: false,
    neonConfigured: true,
    mongoConfigured: false,
    status: 'ok',
    totalSubmissions: 0,
  });
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);


  // Form State
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [academicYear, setAcademicYear] = useState<AcademicYear | ''>('2024-25');
  const [semester, setSemester] = useState<Semester | ''>('IV');

  // Higher studies
  const [higherStudiesPlan, setHigherStudiesPlan] = useState<HigherStudiesPlan | ''>('');
  const [higherStudiesUniversityName, setHigherStudiesUniversityName] = useState('');
  const [higherStudiesProof, setHigherStudiesProof] = useState<UploadedFile | undefined>(undefined);

  // Achievements
  const [selectedAchievementCategories, setSelectedAchievementCategories] = useState<AchievementCategory[]>([]);
  const [competitionAchievements, setCompetitionAchievements] = useState<Record<string, CompetitionAchievement[]>>({});

  const [patentDetails, setPatentDetails] = useState<PatentDetail[]>([
    { patentTitle: '', patentAppNumber: '', patentStatus: 'Filed', filingDate: '' },
  ]);

  const [startupDetails, setStartupDetails] = useState<StartupDetail[]>([
    { startupName: '', studentRole: '', startupStatus: 'Idea Stage', registrationDetails: '' },
  ]);

  const [fundedProjectDetails, setFundedProjectDetails] = useState<FundedProjectDetail[]>([
    { projectTitle: '', fundingAgency: '', fundingAmount: '', projectStatus: 'Approved' },
  ]);

  const [ssipProjectDetails, setSSIPProjectDetails] = useState<SSIPProjectDetail[]>([
    { projectTitle: '', ssipStatus: 'Approved', fundingAmount: '' },
  ]);

  const [researchPublicationDetails, setResearchPublicationDetails] = useState<ResearchPublicationDetail[]>([
    {
      paperTitle: '',
      journalConferenceName: '',
      publicationType: 'Journal',
      publicationStatus: 'Published',
      doiOrLink: '',
    },
  ]);

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
          database: data.database || 'Neon PostgreSQL (Active)',
          isNeon: Boolean(data.isNeon),
          isMongo: Boolean(data.isMongo),
          neonConfigured: Boolean(data.neonConfigured),
          mongoConfigured: Boolean(data.mongoConfigured),
          neonError: data.neonError,
          mongoError: data.mongoError,
          mongoErrorDetail: data.mongoErrorDetail,
          status: data.status,
          totalSubmissions: data.totalSubmissions || 0,
        });
      }
    } catch {
      // Fallback
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

  const handleAdminLogout = () => {
    sessionStorage.removeItem('portal_admin_auth');
    sessionStorage.removeItem('portal_admin_user');
    setIsAdmin(false);
    setCurrentTab('form');
  };

  const handleToggleCategory = (cat: AchievementCategory) => {
    setSelectedAchievementCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  // Multi-entry CRUD for Standard Events / Competitions
  const addCompetitionEntry = (cat: string) => {
    setCompetitionAchievements((prev) => {
      const existing = prev[cat] || [];
      return {
        ...prev,
        [cat]: [
          ...existing,
          {
            category: cat,
            eventName: '',
            organizedBy: '',
            level: 'State Level',
            participationStatus: 'Participated',
            dateOfAchievement: '',
            description: '',
          },
        ],
      };
    });
  };

  const updateCompetitionEntry = (cat: string, index: number, updates: Partial<CompetitionAchievement>) => {
    setCompetitionAchievements((prev) => {
      const existing = prev[cat] ? [...prev[cat]] : [
        {
          category: cat,
          eventName: '',
          organizedBy: '',
          level: 'State Level',
          participationStatus: 'Participated',
          dateOfAchievement: '',
          description: '',
        },
      ];
      if (existing[index]) {
        existing[index] = { ...existing[index], ...updates };
      }
      return { ...prev, [cat]: existing };
    });
  };

  const removeCompetitionEntry = (cat: string, index: number) => {
    setCompetitionAchievements((prev) => {
      const existing = prev[cat] ? [...prev[cat]] : [];
      if (existing.length <= 1) return prev;
      const next = existing.filter((_, i) => i !== index);
      return { ...prev, [cat]: next };
    });
  };

  // Patent CRUD
  const addPatent = () => {
    setPatentDetails((prev) => [
      ...prev,
      { patentTitle: '', patentAppNumber: '', patentStatus: 'Filed', filingDate: '' },
    ]);
  };
  const updatePatent = (index: number, updates: Partial<PatentDetail>) => {
    setPatentDetails((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], ...updates };
      return next;
    });
  };
  const removePatent = (index: number) => {
    setPatentDetails((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  // Startup CRUD
  const addStartup = () => {
    setStartupDetails((prev) => [
      ...prev,
      { startupName: '', studentRole: '', startupStatus: 'Idea Stage', registrationDetails: '' },
    ]);
  };
  const updateStartup = (index: number, updates: Partial<StartupDetail>) => {
    setStartupDetails((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], ...updates };
      return next;
    });
  };
  const removeStartup = (index: number) => {
    setStartupDetails((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  // Funded Project CRUD
  const addFundedProject = () => {
    setFundedProjectDetails((prev) => [
      ...prev,
      { projectTitle: '', fundingAgency: '', fundingAmount: '', projectStatus: 'Approved' },
    ]);
  };
  const updateFundedProject = (index: number, updates: Partial<FundedProjectDetail>) => {
    setFundedProjectDetails((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], ...updates };
      return next;
    });
  };
  const removeFundedProject = (index: number) => {
    setFundedProjectDetails((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  // SSIP Project CRUD
  const addSSIPProject = () => {
    setSSIPProjectDetails((prev) => [
      ...prev,
      { projectTitle: '', ssipStatus: 'Approved', fundingAmount: '' },
    ]);
  };
  const updateSSIPProject = (index: number, updates: Partial<SSIPProjectDetail>) => {
    setSSIPProjectDetails((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], ...updates };
      return next;
    });
  };
  const removeSSIPProject = (index: number) => {
    setSSIPProjectDetails((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  // Research Publication CRUD
  const addResearchPublication = () => {
    setResearchPublicationDetails((prev) => [
      ...prev,
      {
        paperTitle: '',
        journalConferenceName: '',
        publicationType: 'Journal',
        publicationStatus: 'Published',
        doiOrLink: '',
      },
    ]);
  };
  const updateResearchPublication = (index: number, updates: Partial<ResearchPublicationDetail>) => {
    setResearchPublicationDetails((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], ...updates };
      return next;
    });
  };
  const removeResearchPublication = (index: number) => {
    setResearchPublicationDetails((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const resetForm = () => {
    setEnrollmentNumber('');
    setFullName('');
    setAcademicYear('2024-25');
    setSemester('IV');
    setHigherStudiesPlan('');
    setHigherStudiesUniversityName('');
    setHigherStudiesProof(undefined);
    setSelectedAchievementCategories([]);
    setCompetitionAchievements({});
    setPatentDetails([{ patentTitle: '', patentAppNumber: '', patentStatus: 'Filed', filingDate: '' }]);
    setStartupDetails([{ startupName: '', studentRole: '', startupStatus: 'Idea Stage', registrationDetails: '' }]);
    setFundedProjectDetails([{ projectTitle: '', fundingAgency: '', fundingAmount: '', projectStatus: 'Approved' }]);
    setSSIPProjectDetails([{ projectTitle: '', ssipStatus: 'Approved', fundingAmount: '' }]);
    setResearchPublicationDetails([{
      paperTitle: '',
      journalConferenceName: '',
      publicationType: 'Journal',
      publicationStatus: 'Published',
      doiOrLink: '',
    }]);
    setExitProgression({ isExiting: false, exitYear: 'Year 3', pathway: 'Higher Education' });
    setSubmitError(null);
    setSubmitSuccess(null);
    setEditingId(null);
  };

  const handleEditRecord = (sub: StudentSubmission) => {
    const id = sub._id || sub.id || null;
    setEditingId(id);
    setEnrollmentNumber(sub.enrollmentNumber || '');
    setFullName(sub.fullName || '');
    setAcademicYear((sub.academicYear as AcademicYear) || '2024-25');
    setSemester((sub.semester as any) || 'IV');
    setHigherStudiesPlan((sub.higherStudiesPlan as any) || '');
    setHigherStudiesUniversityName(sub.higherStudiesUniversityName || '');
    setHigherStudiesProof(sub.higherStudiesProof);
    setSelectedAchievementCategories(sub.selectedAchievementCategories || []);

    // Normalize competitionAchievements
    const rawComp = sub.competitionAchievements || {};
    const normComp: Record<string, CompetitionAchievement[]> = {};
    for (const [k, v] of Object.entries(rawComp)) {
      if (Array.isArray(v)) {
        normComp[k] = v;
      } else if (v && typeof v === 'object') {
        normComp[k] = [v as CompetitionAchievement];
      }
    }
    setCompetitionAchievements(normComp);

    // Normalize patents
    if (sub.patentDetails && sub.patentDetails.length > 0) {
      setPatentDetails(sub.patentDetails);
    } else if (sub.patentDetail) {
      setPatentDetails([sub.patentDetail]);
    } else {
      setPatentDetails([{ patentTitle: '', patentAppNumber: '', patentStatus: 'Filed', filingDate: '' }]);
    }

    // Normalize startups
    if (sub.startupDetails && sub.startupDetails.length > 0) {
      setStartupDetails(sub.startupDetails);
    } else if (sub.startupDetail) {
      setStartupDetails([sub.startupDetail]);
    } else {
      setStartupDetails([{ startupName: '', studentRole: '', startupStatus: 'Idea Stage', registrationDetails: '' }]);
    }

    // Normalize funded projects
    if (sub.fundedProjectDetails && sub.fundedProjectDetails.length > 0) {
      setFundedProjectDetails(sub.fundedProjectDetails);
    } else if (sub.fundedProjectDetail) {
      setFundedProjectDetails([sub.fundedProjectDetail]);
    } else {
      setFundedProjectDetails([{ projectTitle: '', fundingAgency: '', fundingAmount: '', projectStatus: 'Approved' }]);
    }

    // Normalize SSIP projects
    if (sub.ssipProjectDetails && sub.ssipProjectDetails.length > 0) {
      setSSIPProjectDetails(sub.ssipProjectDetails);
    } else if (sub.ssipProjectDetail) {
      setSSIPProjectDetails([sub.ssipProjectDetail]);
    } else {
      setSSIPProjectDetails([{ projectTitle: '', ssipStatus: 'Approved', fundingAmount: '' }]);
    }

    // Normalize research publications
    if (sub.researchPublicationDetails && sub.researchPublicationDetails.length > 0) {
      setResearchPublicationDetails(sub.researchPublicationDetails);
    } else if (sub.researchPublicationDetail) {
      setResearchPublicationDetails([sub.researchPublicationDetail]);
    } else {
      setResearchPublicationDetails([{
        paperTitle: '',
        journalConferenceName: '',
        publicationType: 'Journal',
        publicationStatus: 'Published',
        doiOrLink: '',
      }]);
    }

    setExitProgression(sub.exitProgression || { isExiting: false, exitYear: 'Year 3', pathway: 'Higher Education' });
    setSubmitError(null);
    setSubmitSuccess(null);
    setCurrentTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const isOtherOrForeign =
      higherStudiesPlan === 'Yes – Other University in India' || higherStudiesPlan === 'Yes – Foreign University';
    if (isOtherOrForeign && !higherStudiesUniversityName.trim()) {
      setSubmitError('Please enter the name of the University / Institution for higher studies.');
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
      const firstSSIP = ssipProjectDetails[0];
      if (!firstSSIP || !firstSSIP.projectTitle.trim()) {
        setSubmitError('Please enter the SSIP Project Title.');
        return;
      }
      if (!firstSSIP.proofFile) {
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
      higherStudiesUniversityName: isOtherOrForeign ? higherStudiesUniversityName.trim() : undefined,
      higherStudiesProof,
      selectedAchievementCategories,
      competitionAchievements,
      patentDetails: selectedAchievementCategories.includes('Patent') ? patentDetails : undefined,
      patentDetail: selectedAchievementCategories.includes('Patent') ? patentDetails[0] : undefined,
      startupDetails: selectedAchievementCategories.includes('Startup') ? startupDetails : undefined,
      startupDetail: selectedAchievementCategories.includes('Startup') ? startupDetails[0] : undefined,
      fundedProjectDetails: selectedAchievementCategories.includes('Funded Project') ? fundedProjectDetails : undefined,
      fundedProjectDetail: selectedAchievementCategories.includes('Funded Project') ? fundedProjectDetails[0] : undefined,
      ssipProjectDetails: selectedAchievementCategories.includes('SSIP Project') ? ssipProjectDetails : undefined,
      ssipProjectDetail: selectedAchievementCategories.includes('SSIP Project') ? ssipProjectDetails[0] : undefined,
      researchPublicationDetails: selectedAchievementCategories.includes('Research Publication')
        ? researchPublicationDetails
        : undefined,
      researchPublicationDetail: selectedAchievementCategories.includes('Research Publication')
        ? researchPublicationDetails[0]
        : undefined,
      exitProgression: exitProgression.isExiting ? exitProgression : undefined,
      submittedAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      let res: Response;
      if (editingId) {
        // UPDATE existing record
        res = await fetch(`/api/submissions/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // CREATE new record
        res = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit data');
      }

      setSubmitSuccess(
        editingId
          ? `Record updated successfully!`
          : `Student outcome submission recorded successfully in ${resData.database || 'Database'}!`
      );
      setEditingId(null);
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
        isAdmin={isAdmin}
        adminUsername={adminUsername}
        onOpenAdminModal={() => setAdminModalOpen(true)}
        onAdminLogout={handleAdminLogout}
        onOpenMongoModal={() => {}}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 pt-4 sm:pt-8 space-y-4 sm:space-y-6">


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
                    onClick={resetForm}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    Submit Another Student
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setCurrentTab('records');
                      }}
                      className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      View All in Records List
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Error Banner */}
        {submitError && (
          <div
            id="submission-error-banner"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3 shadow-xs animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{submitError}</span>
          </div>
        )}

        {currentTab === 'form' ? (
          /* Tab 1: Data Collection Form */
          <>
          {editingId && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-amber-700 font-bold text-xs">✏️ Editing Record</span>
                <span className="text-xs text-amber-600">You are editing an existing submission. Submit to save changes.</span>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg cursor-pointer"
              >
                Cancel Edit
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6" id="student-outcome-form">
            {/* Section 1: Basic Student Profile */}
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

            {/* Section 2: Higher Studies Verification */}
            <HigherStudiesSection
              higherStudiesPlan={higherStudiesPlan}
              setHigherStudiesPlan={setHigherStudiesPlan}
              higherStudiesUniversityName={higherStudiesUniversityName}
              setHigherStudiesUniversityName={setHigherStudiesUniversityName}
              higherStudiesProof={higherStudiesProof}
              setHigherStudiesProof={setHigherStudiesProof}
            />

            {/* Section 3: Achievements & Progression */}
            <AchievementTypesSection
              selectedCategories={selectedAchievementCategories}
              onToggleCategory={handleToggleCategory}
              toggleCategory={handleToggleCategory}
              competitionAchievements={competitionAchievements}
              addCompetitionEntry={addCompetitionEntry}
              updateCompetitionEntry={updateCompetitionEntry}
              removeCompetitionEntry={removeCompetitionEntry}
              patentDetails={patentDetails}
              addPatent={addPatent}
              updatePatent={updatePatent}
              removePatent={removePatent}
              startupDetails={startupDetails}
              addStartup={addStartup}
              updateStartup={updateStartup}
              removeStartup={removeStartup}
              fundedProjectDetails={fundedProjectDetails}
              addFundedProject={addFundedProject}
              updateFundedProject={updateFundedProject}
              removeFundedProject={removeFundedProject}
              ssipProjectDetails={ssipProjectDetails}
              addSSIPProject={addSSIPProject}
              updateSSIPProject={updateSSIPProject}
              removeSSIPProject={removeSSIPProject}
              researchPublicationDetails={researchPublicationDetails}
              addResearchPublication={addResearchPublication}
              updateResearchPublication={updateResearchPublication}
              removeResearchPublication={removeResearchPublication}
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
                className={`w-full sm:w-auto px-8 py-3 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Saving...' : editingId ? 'Update Record' : 'Submit Student Outcome Record'}
              </button>
            </div>
          </form>
          </>
        ) : isAdmin ? (
          /* Tab 2: Records List View (Admin Only) */
          <RecordsList
            submissions={submissions}
            loading={loadingSubmissions}
            onRefresh={() => {
              fetchDbHealth();
              fetchSubmissions();
            }}
            onDelete={handleDeleteRecord}
            onEdit={handleEditRecord}
            dbType={dbStatus.database}
          />
        ) : (
          /* Admin Access Locked Screen */
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Admin Access Required</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Viewing student submissions, uploaded documents, and exporting reports is restricted to administrators and authorized faculty members.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentTab('form')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Back to Student Form
              </button>
              <button
                type="button"
                onClick={() => setAdminModalOpen(true)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                Sign In as Admin
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Admin Login Dialog */}
      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onLoginSuccess={() => {
          setIsAdmin(true);
          setAdminUsername(sessionStorage.getItem('portal_admin_user') || 'admin');
          setCurrentTab('records');
          fetchSubmissions();
        }}
      />

      {/* Admin Settings Dialog */}
      <AdminSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        currentUsername={adminUsername}
        onCredentialsChanged={(newUsername) => {
          setAdminUsername(newUsername);
          sessionStorage.setItem('portal_admin_user', newUsername);
        }}
      />

      {/* Footer */}
      <footer className="mt-auto py-4 text-center border-t border-slate-100 bg-white">
        <p className="text-xs text-slate-400">
          Developed by{' '}
          <span className="font-semibold text-indigo-600">Krupa Panchal</span>
        </p>
      </footer>

    </div>
  );
}
