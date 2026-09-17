-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Submissions Main Table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    enrollment_number VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(10) NOT NULL,
    higher_studies_plan VARCHAR(150),
    higher_studies_proof JSONB,
    selected_achievement_categories JSONB DEFAULT '[]'::jsonb,
    competition_achievements JSONB DEFAULT '{}'::jsonb,
    patent_detail JSONB,
    startup_detail JSONB,
    funded_project_detail JSONB,
    ssip_project_detail JSONB,
    research_publication_detail JSONB,
    exit_progression JSONB,
    raw_data JSONB,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Competition Achievements Table
CREATE TABLE IF NOT EXISTS competition_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    enrollment_number VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    organized_by VARCHAR(255),
    level VARCHAR(50),
    participation_status VARCHAR(50),
    date_of_achievement VARCHAR(50),
    description TEXT,
    certificate_file JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Patents Table
CREATE TABLE IF NOT EXISTS patents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    enrollment_number VARCHAR(50) NOT NULL,
    patent_title VARCHAR(255) NOT NULL,
    patent_app_number VARCHAR(100) NOT NULL,
    patent_status VARCHAR(50),
    filing_date VARCHAR(50),
    proof_file JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Startups Table
CREATE TABLE IF NOT EXISTS startups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    enrollment_number VARCHAR(50) NOT NULL,
    startup_name VARCHAR(255) NOT NULL,
    student_role VARCHAR(100),
    startup_status VARCHAR(50),
    registration_details TEXT,
    proof_file JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Funded Projects & SSIP Table
CREATE TABLE IF NOT EXISTS funded_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    enrollment_number VARCHAR(50) NOT NULL,
    project_title VARCHAR(255) NOT NULL,
    funding_agency VARCHAR(255),
    funding_amount VARCHAR(100),
    project_status VARCHAR(50),
    is_ssip BOOLEAN DEFAULT FALSE,
    proof_file JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Research Publications Table
CREATE TABLE IF NOT EXISTS research_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    enrollment_number VARCHAR(50) NOT NULL,
    paper_title VARCHAR(255) NOT NULL,
    journal_conference_name VARCHAR(255),
    publication_type VARCHAR(50),
    publication_status VARCHAR(50),
    doi_or_link TEXT,
    proof_file JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Exit Progression Table
CREATE TABLE IF NOT EXISTS exit_progressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    enrollment_number VARCHAR(50) NOT NULL,
    is_exiting BOOLEAN DEFAULT FALSE,
    exit_year VARCHAR(20),
    pathway VARCHAR(100),
    institution_name VARCHAR(255),
    program_name VARCHAR(255),
    company_name VARCHAR(255),
    designation VARCHAR(100),
    gst_number VARCHAR(100),
    company_or_venture_name VARCHAR(255),
    document_file JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_enrollment ON submissions(enrollment_number);
CREATE INDEX IF NOT EXISTS idx_submissions_academic_year ON submissions(academic_year);
CREATE INDEX IF NOT EXISTS idx_submissions_semester ON submissions(semester);
CREATE INDEX IF NOT EXISTS idx_competition_achievements_submission ON competition_achievements(submission_id);
CREATE INDEX IF NOT EXISTS idx_competition_achievements_enrollment ON competition_achievements(enrollment_number);
CREATE INDEX IF NOT EXISTS idx_patents_submission ON patents(submission_id);
CREATE INDEX IF NOT EXISTS idx_startups_submission ON startups(submission_id);
CREATE INDEX IF NOT EXISTS idx_funded_projects_submission ON funded_projects(submission_id);
CREATE INDEX IF NOT EXISTS idx_research_pub_submission ON research_publications(submission_id);
CREATE INDEX IF NOT EXISTS idx_exit_progression_submission ON exit_progressions(submission_id);
