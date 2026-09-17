export type AcademicYear = '2023-24' | '2024-25' | '2025-26' | '2026-27';

export type Semester = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export type HigherStudiesPlan = 
  | 'No, I do not plan to pursue higher studies'
  | 'Yes – Sardar Vallabhbhai Global University (SVGU)'
  | 'Yes – Other University in India'
  | 'Yes – Foreign University';

export type AchievementCategory =
  | 'Sports Competition'
  | 'Hackathon'
  | 'Coding Competition'
  | 'Cultural Competition'
  | 'Patent'
  | 'Startup'
  | 'Funded Project'
  | 'SSIP Project'
  | 'Research Publication'
  | 'Workshop / Technical Event'
  | 'Other Achievement';

export type CompetitionLevel = 'State Level' | 'National Level' | 'International Level';

export type ParticipationStatus = 'Participated' | 'Winner' | 'Runner Up' | 'Presented' | 'Published';

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  dataUrl: string; // Base64 encoded for PDF or image
  uploadedAt: string;
}

export interface CompetitionAchievement {
  category: string;
  eventName: string;
  organizedBy: string;
  level: CompetitionLevel | '';
  participationStatus: ParticipationStatus | '';
  dateOfAchievement: string;
  description: string;
  certificateFile?: UploadedFile;
}

export interface PatentDetail {
  patentTitle: string;
  patentAppNumber: string;
  patentStatus: 'Filed' | 'Published' | 'Granted' | '';
  filingDate: string;
  proofFile?: UploadedFile;
}

export interface StartupDetail {
  startupName: string;
  studentRole: string;
  startupStatus: 'Idea Stage' | 'Registered' | 'Operational' | 'Other' | '';
  registrationDetails: string;
  proofFile?: UploadedFile;
}

export interface FundedProjectDetail {
  projectTitle: string;
  fundingAgency: string;
  fundingAmount: string;
  projectStatus: 'Approved' | 'Ongoing' | 'Completed' | '';
  proofFile?: UploadedFile;
}

export interface SSIPProjectDetail {
  projectTitle: string;
  ssipStatus: 'Selected' | 'Approved' | 'Funded' | 'Ongoing' | 'Completed' | '';
  fundingAmount: string;
  proofFile?: UploadedFile; // Required
}

export interface ResearchPublicationDetail {
  paperTitle: string;
  journalConferenceName: string;
  publicationType: 'Journal' | 'Conference' | 'Book' | 'Chapter' | 'Other' | '';
  publicationStatus: 'Published' | 'Accepted' | 'Presented' | '';
  doiOrLink: string;
  proofFile?: UploadedFile;
}

export type ExitPathway = 'None' | 'Higher Education' | 'Placement / Employment' | 'Entrepreneurship';

export interface ExitProgression {
  isExiting: boolean;
  exitYear: 'Year 2' | 'Year 3' | 'Year 4' | '';
  pathway: ExitPathway;
  // Higher Education details
  institutionName?: string;
  programName?: string;
  admissionDocument?: UploadedFile;
  // Placement / Employment details
  companyName?: string;
  designation?: string;
  employmentDocument?: UploadedFile;
  // Entrepreneurship details
  gstNumber?: string;
  companyOrVentureName?: string;
  gstOrOfficialDocument?: UploadedFile;
}

export interface StudentSubmission {
  _id?: string;
  id?: string;
  enrollmentNumber: string;
  fullName: string;
  academicYear: AcademicYear | '';
  semester: Semester | '';
  higherStudiesPlan: HigherStudiesPlan | '';
  higherStudiesUniversityName?: string; // For Other University or Foreign University
  higherStudiesProof?: UploadedFile; // Required when higher studies is Yes
  selectedAchievementCategories: AchievementCategory[];
  competitionAchievements: Record<string, CompetitionAchievement>;
  patentDetail?: PatentDetail;
  startupDetail?: StartupDetail;
  fundedProjectDetail?: FundedProjectDetail;
  ssipProjectDetail?: SSIPProjectDetail;
  researchPublicationDetail?: ResearchPublicationDetail;
  exitProgression?: ExitProgression;
  submittedAt: string;
}
