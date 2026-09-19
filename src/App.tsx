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
  X,
  RefreshCw,
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
import { standardizeSubmissionFiles } from './utils/documentUtils';

import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { Footer } from './components/Footer';

export default function App() {
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [activeErrorFieldId, setActiveErrorFieldId] = useState<string | null>(null);

  // Auto-dismiss notifications
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setSubmitSuccess(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => {
        setSubmitError(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [submitError]);


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

  const resetForm = (clearSuccess = true) => {
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
    setFieldErrors({});
    setActiveErrorFieldId(null);
    if (clearSuccess) {
      setSubmitSuccess(null);
    }
  };

  const scrollToElement = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('input:not([type="hidden"]), select, textarea') as HTMLElement | null;
      if (input) {
        input.focus();
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const triggerFieldError = (fieldId: string, message: string) => {
    setFieldErrors({ [fieldId]: message });
    setActiveErrorFieldId(fieldId);
    setSubmitError(message);
    scrollToElement(fieldId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    // Section 1: Basic Information Validation
    if (!enrollmentNumber.trim()) {
      triggerFieldError('enrollment-number-input', 'Please enter your Enrollment Number.');
      return;
    }
    if (!fullName.trim()) {
      triggerFieldError('fullname-input', 'Please enter your Full Name as per certificate.');
      return;
    }
    if (!academicYear) {
      triggerFieldError('academic-year-container', 'Please select the Academic Year.');
      return;
    }
    if (!semester) {
      triggerFieldError('semester-container', 'Please select your Semester.');
      return;
    }

    // Section 2: Higher Studies Validation
    if (!higherStudiesPlan) {
      triggerFieldError('higher-studies-section', 'Please indicate whether you plan to pursue higher studies in Section 2.');
      return;
    }

    const isOtherOrForeign =
      higherStudiesPlan === 'Yes – Other University in India' || higherStudiesPlan === 'Yes – Foreign University';
    if (isOtherOrForeign && !higherStudiesUniversityName.trim()) {
      triggerFieldError('higher-studies-university-name-input', 'Please enter the name of the University / Institution for higher studies.');
      return;
    }

    const isYesHigherStudies = higherStudiesPlan.startsWith('Yes');
    if (isYesHigherStudies && !higherStudiesProof) {
      triggerFieldError(
        'higher-studies-proof-container',
        'Supporting Admit Card / Admission Letter / Confirmation document is required when choosing higher studies.'
      );
      return;
    }

    // Section 3: Achievements Validation
    for (const cat of selectedAchievementCategories) {
      if (
        [
          'Sports Competition',
          'Hackathon',
          'Coding Competition',
          'Cultural Competition',
          'Workshop / Technical Event',
          'Other Achievement',
        ].includes(cat)
      ) {
        const raw = competitionAchievements[cat];
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
        for (let i = 0; i < list.length; i++) {
          const entry = list[i];
          if (!entry.eventName?.trim()) {
            triggerFieldError('achievement-types-section', `Please enter the Name of Event for ${cat}${list.length > 1 ? ` Entry #${i + 1}` : ''}.`);
            return;
          }
          if (!entry.organizedBy?.trim()) {
            triggerFieldError('achievement-types-section', `Please enter the Organizing Body for ${cat}${list.length > 1 ? ` Entry #${i + 1}` : ''}.`);
            return;
          }
          if (!entry.dateOfAchievement) {
            triggerFieldError('achievement-types-section', `Please select the Date of Achievement for ${cat}${list.length > 1 ? ` Entry #${i + 1}` : ''}.`);
            return;
          }
        }
      }
    }

    if (selectedAchievementCategories.includes('Patent')) {
      for (let i = 0; i < patentDetails.length; i++) {
        if (!patentDetails[i]?.patentTitle?.trim()) {
          triggerFieldError('form-section-patent', `Please enter the Patent Title for Patent #${i + 1}.`);
          return;
        }
      }
    }

    if (selectedAchievementCategories.includes('Startup')) {
      for (let i = 0; i < startupDetails.length; i++) {
        if (!startupDetails[i]?.startupName?.trim()) {
          triggerFieldError('form-section-startup', `Please enter the Startup Name for Startup #${i + 1}.`);
          return;
        }
      }
    }

    if (selectedAchievementCategories.includes('Funded Project')) {
      for (let i = 0; i < fundedProjectDetails.length; i++) {
        if (!fundedProjectDetails[i]?.projectTitle?.trim()) {
          triggerFieldError('form-section-funded-project', `Please enter the Project Title for Funded Project #${i + 1}.`);
          return;
        }
      }
    }

    if (selectedAchievementCategories.includes('SSIP Project')) {
      for (let i = 0; i < ssipProjectDetails.length; i++) {
        const sp = ssipProjectDetails[i];
        if (!sp?.projectTitle?.trim()) {
          triggerFieldError('form-section-ssip-project', `Please enter the SSIP Project Title for SSIP Project #${i + 1}.`);
          return;
        }
        if (!sp.proofFile) {
          triggerFieldError('form-section-ssip-project', `SSIP Proof document upload is required for SSIP Project #${i + 1}.`);
          return;
        }
      }
    }

    if (selectedAchievementCategories.includes('Research Publication')) {
      for (let i = 0; i < researchPublicationDetails.length; i++) {
        if (!researchPublicationDetails[i]?.paperTitle?.trim()) {
          triggerFieldError('form-section-research-pub', `Please enter the Paper Title for Research Publication #${i + 1}.`);
          return;
        }
      }
    }

    // Section 4: Exit progression validation
    if (exitProgression.isExiting) {
      if (exitProgression.pathway === 'Higher Education' && !exitProgression.admissionDocument) {
        triggerFieldError('exit-progression-section', 'Admission Letter / Confirmation document is required for Higher Education exit.');
        return;
      }
      if (exitProgression.pathway === 'Placement / Employment' && !exitProgression.employmentDocument) {
        triggerFieldError('exit-progression-section', 'Offer Letter / Employment Letter is required for Placement / Employment exit.');
        return;
      }
      if (exitProgression.pathway === 'Entrepreneurship' && !exitProgression.gstOrOfficialDocument) {
        triggerFieldError('exit-progression-section', 'GST Registration / Official Proof is required for Entrepreneurship exit.');
        return;
      }
      if (exitProgression.pathway === 'Other' && !exitProgression.otherDetails?.trim()) {
        triggerFieldError('exit-progression-section', 'Please specify the reason / details for your exit progression.');
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

    const sanitizedPayload = standardizeSubmissionFiles(payload);

    setSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedPayload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit data');
      }

      resetForm(false);
      setSubmitSuccess('Form successfully uploaded.');
      fetchDbHealth();
      fetchSubmissions();

      // Scroll smoothly to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Error occurred while saving data. Please check connection and try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col">
      {/* Floating Success Toast (Always Visible on Laptop & Mobile) */}
      {submitSuccess && (
        <div
          id="global-floating-toast"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-emerald-600 text-white rounded-xl shadow-2xl border border-emerald-500 animate-in fade-in slide-in-from-top-4 duration-200 max-w-md w-[90vw] sm:w-auto"
        >
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span className="text-sm font-bold flex-1">{submitSuccess}</span>
          <button
            type="button"
            onClick={() => setSubmitSuccess(null)}
            className="p-1 text-emerald-100 hover:text-white hover:bg-emerald-700/60 rounded-md transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Error Toast (Always Visible on Laptop & Mobile) */}
      {submitError && (
        <div
          id="global-floating-error-toast"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 p-3.5 sm:p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-rose-500/80 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 max-w-lg w-[92vw] sm:w-auto"
        >
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl shrink-0 mt-0.5 border border-rose-500/30">
            <AlertCircle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                Required Field Missing
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-100 mt-1 leading-snug">
              {submitError}
            </p>
            {activeErrorFieldId && (
              <button
                type="button"
                onClick={() => scrollToElement(activeErrorFieldId)}
                className="mt-2 text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Jump to this field</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmitError(null);
              setActiveErrorFieldId(null);
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navigation & Brand Header */}
      <Header
        submissionsCount={submissions.length}
        dbStatus={dbStatus}
        isAdmin={isAdmin}
        adminUsername={adminUsername}
        onOpenAdminModal={() => setAdminModalOpen(true)}
        onAdminLogout={handleAdminLogout}
        onOpenMongoModal={() => { }}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* Main Container */}
      <main
        className={`${isAdmin ? 'max-w-7xl px-3 sm:px-6 lg:px-8' : 'max-w-4xl px-3 sm:px-6'
          } mx-auto pt-4 sm:pt-8 space-y-4 sm:space-y-6 flex-1 w-full pb-12`}
      >
        {isAdmin ? (
          /* Admin View: Records Management Dashboard (Form completely removed) */
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
        ) : (
          /* Student / Public View: Data Collection Form */
          <>
            {/* Minimal Clean Success Notification */}
            {submitSuccess && (
              <div
                id="submission-success-banner"
                className="p-3 sm:p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900 shadow-xs animate-in fade-in"
              >
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold text-emerald-900">{submitSuccess}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitSuccess(null)}
                  className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100/60 rounded transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
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

            <form noValidate onSubmit={handleSubmit} className="space-y-6" id="student-outcome-form">
              {/* Section 1: Basic Student Profile */}
              <BasicInfoSection
                enrollmentNumber={enrollmentNumber}
                setEnrollmentNumber={(val) => {
                  setEnrollmentNumber(val);
                  if (fieldErrors['enrollment-number-input']) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next['enrollment-number-input'];
                      return next;
                    });
                  }
                }}
                fullName={fullName}
                setFullName={(val) => {
                  setFullName(val);
                  if (fieldErrors['fullname-input']) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next['fullname-input'];
                      return next;
                    });
                  }
                }}
                academicYear={academicYear}
                setAcademicYear={(val) => {
                  setAcademicYear(val);
                  if (fieldErrors['academic-year-container']) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next['academic-year-container'];
                      return next;
                    });
                  }
                }}
                semester={semester}
                setSemester={(val) => {
                  setSemester(val);
                  if (fieldErrors['semester-container']) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next['semester-container'];
                      return next;
                    });
                  }
                }}
                errors={fieldErrors}
              />

              {/* Section 2: Higher Studies Verification */}
              <HigherStudiesSection
                higherStudiesPlan={higherStudiesPlan}
                setHigherStudiesPlan={(val) => {
                  setHigherStudiesPlan(val);
                  if (fieldErrors['higher-studies-section']) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next['higher-studies-section'];
                      return next;
                    });
                  }
                }}
                higherStudiesUniversityName={higherStudiesUniversityName}
                setHigherStudiesUniversityName={(val) => {
                  setHigherStudiesUniversityName(val);
                  if (fieldErrors['higher-studies-university-name-input']) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next['higher-studies-university-name-input'];
                      return next;
                    });
                  }
                }}
                higherStudiesProof={higherStudiesProof}
                setHigherStudiesProof={(val) => {
                  setHigherStudiesProof(val);
                  if (fieldErrors['higher-studies-proof-container']) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next['higher-studies-proof-container'];
                      return next;
                    });
                  }
                }}
                enrollmentNumber={enrollmentNumber}
                errors={fieldErrors}
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
                enrollmentNumber={enrollmentNumber}
              />

              {/* Section 4: Exit / Progression After Year 2 / 3 / 4 */}
              <ExitProgressionSection
                exitProgression={exitProgression}
                setExitProgression={setExitProgression}
                enrollmentNumber={enrollmentNumber}
              />

              {/* Main Form Action Bar */}
              <div
                id="form-action-bar"
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col gap-3"
              >
                {submitError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-semibold">{submitError}</span>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reset Form</span>
                  </button>

                  <button
                    type="submit"
                    id="main-submit-button"
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Record...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Student Outcome Record</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </main>

      {/* Application Footer */}
      <Footer />

      {/* Admin Login Dialog */}
      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onLoginSuccess={() => {
          setIsAdmin(true);
          setAdminUsername(sessionStorage.getItem('portal_admin_user') || 'admin');
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

    </div>
  );
}
