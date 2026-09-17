import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load .env.local and .env
if (fs.existsSync(path.join(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
}
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  console.error('❌ ERROR: No DATABASE_URL found in .env.local or environment.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  console.log('🚀 Connecting to Neon PostgreSQL...');
  const client = await pool.connect();

  try {
    const schemaSql = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8');
    console.log('📄 Executing schema.sql to create tables and indexes...');
    await client.query(schemaSql);
    console.log('✅ Tables and indexes created successfully!');

    // List all user tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📊 Tables in Neon Database:');
    for (const row of res.rows) {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
      console.log(`  - 📁 ${row.table_name} (${countRes.rows[0].count} rows)`);
    }

    // Check if local submissions exist to sync
    const localDbPath = path.join(process.cwd(), 'data', 'submissions.json');
    if (fs.existsSync(localDbPath)) {
      const localData = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
      if (Array.isArray(localData) && localData.length > 0) {
        console.log(`\n🔄 Syncing ${localData.length} local submissions into Neon DB...`);
        for (const sub of localData) {
          // Upsert student
          const studentRes = await client.query(
            `INSERT INTO students (enrollment_number, full_name)
             VALUES ($1, $2)
             ON CONFLICT (enrollment_number) DO UPDATE SET full_name = EXCLUDED.full_name
             RETURNING id`,
            [sub.enrollmentNumber, sub.fullName]
          );
          const studentId = studentRes.rows[0]?.id;

          // Insert submission
          const subRes = await client.query(
            `INSERT INTO submissions (
              student_id, enrollment_number, full_name, academic_year, semester,
              higher_studies_plan, higher_studies_proof, selected_achievement_categories,
              competition_achievements, patent_detail, startup_detail, funded_project_detail,
              ssip_project_detail, research_publication_detail, exit_progression, raw_data, submitted_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id`,
            [
              studentId,
              sub.enrollmentNumber,
              sub.fullName,
              sub.academicYear || '',
              sub.semester || '',
              sub.higherStudiesPlan || '',
              sub.higherStudiesProof ? JSON.stringify(sub.higherStudiesProof) : null,
              JSON.stringify(sub.selectedAchievementCategories || []),
              JSON.stringify(sub.competitionAchievements || {}),
              sub.patentDetail ? JSON.stringify(sub.patentDetail) : null,
              sub.startupDetail ? JSON.stringify(sub.startupDetail) : null,
              sub.fundedProjectDetail ? JSON.stringify(sub.fundedProjectDetail) : null,
              sub.ssipProjectDetail ? JSON.stringify(sub.ssipProjectDetail) : null,
              sub.researchPublicationDetail ? JSON.stringify(sub.researchPublicationDetail) : null,
              sub.exitProgression ? JSON.stringify(sub.exitProgression) : null,
              JSON.stringify(sub),
              sub.submittedAt || new Date().toISOString(),
            ]
          );

          const subId = subRes.rows[0]?.id;

          // Insert competition achievements if any
          if (sub.competitionAchievements) {
            for (const [key, comp] of Object.entries<any>(sub.competitionAchievements)) {
              await client.query(
                `INSERT INTO competition_achievements (
                  submission_id, enrollment_number, category, event_name, organized_by,
                  level, participation_status, date_of_achievement, description, certificate_file
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                  subId,
                  sub.enrollmentNumber,
                  comp.category || key,
                  comp.eventName || '',
                  comp.organizedBy || '',
                  comp.level || '',
                  comp.participationStatus || '',
                  comp.dateOfAchievement || '',
                  comp.description || '',
                  comp.certificateFile ? JSON.stringify(comp.certificateFile) : null,
                ]
              );
            }
          }

          // Insert patent if any
          if (sub.patentDetail && sub.patentDetail.patentTitle) {
            await client.query(
              `INSERT INTO patents (
                submission_id, enrollment_number, patent_title, patent_app_number, patent_status, filing_date, proof_file
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                subId,
                sub.enrollmentNumber,
                sub.patentDetail.patentTitle,
                sub.patentDetail.patentAppNumber || '',
                sub.patentDetail.patentStatus || '',
                sub.patentDetail.filingDate || '',
                sub.patentDetail.proofFile ? JSON.stringify(sub.patentDetail.proofFile) : null,
              ]
            );
          }

          // Insert startup if any
          if (sub.startupDetail && sub.startupDetail.startupName) {
            await client.query(
              `INSERT INTO startups (
                submission_id, enrollment_number, startup_name, student_role, startup_status, registration_details, proof_file
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                subId,
                sub.enrollmentNumber,
                sub.startupDetail.startupName,
                sub.startupDetail.studentRole || '',
                sub.startupDetail.startupStatus || '',
                sub.startupDetail.registrationDetails || '',
                sub.startupDetail.proofFile ? JSON.stringify(sub.startupDetail.proofFile) : null,
              ]
            );
          }

          // Insert research publication if any
          if (sub.researchPublicationDetail && sub.researchPublicationDetail.paperTitle) {
            await client.query(
              `INSERT INTO research_publications (
                submission_id, enrollment_number, paper_title, journal_conference_name, publication_type, publication_status, doi_or_link, proof_file
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                subId,
                sub.enrollmentNumber,
                sub.researchPublicationDetail.paperTitle,
                sub.researchPublicationDetail.journalConferenceName || '',
                sub.researchPublicationDetail.publicationType || '',
                sub.researchPublicationDetail.publicationStatus || '',
                sub.researchPublicationDetail.doiOrLink || '',
                sub.researchPublicationDetail.proofFile ? JSON.stringify(sub.researchPublicationDetail.proofFile) : null,
              ]
            );
          }
        }
        console.log('✅ Local data successfully migrated to Neon DB!');
      }
    }
  } catch (err) {
    console.error('❌ Migration Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
