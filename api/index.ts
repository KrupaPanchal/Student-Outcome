import express from 'express';
import { Pool } from 'pg';

const app = express();

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || '';

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    })
  : null;

app.get('/api/health', async (req, res) => {
  let count = 0;
  let isConnected = false;

  if (pool) {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM submissions');
      count = parseInt(result.rows[0].count, 10);
      isConnected = true;
    } catch (err) {
      console.error('Health check DB error:', err);
    }
  }

  res.json({
    status: 'ok',
    database: isConnected ? 'Neon PostgreSQL (Active)' : 'Database Not Connected',
    isNeon: isConnected,
    neonConfigured: Boolean(connectionString),
    totalSubmissions: count,
  });
});

app.get('/api/submissions', async (req, res) => {
  try {
    if (!pool) {
      return res.json([]);
    }

    const { academicYear, semester, search } = req.query;
    let query = 'SELECT raw_data FROM submissions WHERE 1=1';
    const params: any[] = [];

    if (academicYear) {
      params.push(academicYear);
      query += ` AND academic_year = $${params.length}`;
    }
    if (semester) {
      params.push(semester);
      query += ` AND semester = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (enrollment_number ILIKE $${params.length} OR full_name ILIKE $${params.length})`;
    }

    query += ' ORDER BY submitted_at DESC';

    const result = await pool.query(query, params);
    const docs = result.rows.map((row: any) => row.raw_data || row);
    res.json(docs);
  } catch (err: any) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({ error: 'Failed to fetch submissions', details: err?.message });
  }
});

app.post('/api/submissions', async (req, res) => {
  try {
    const payload = req.body;

    if (!payload.enrollmentNumber || !payload.fullName) {
      return res.status(400).json({ error: 'Enrollment number and full name are required.' });
    }

    const newRecord = {
      ...payload,
      id: payload.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      submittedAt: payload.submittedAt || new Date().toISOString(),
    };

    if (pool) {
      const client = await pool.connect();
      try {
        const studentRes = await client.query(
          `INSERT INTO students (enrollment_number, full_name)
           VALUES ($1, $2)
           ON CONFLICT (enrollment_number) DO UPDATE SET full_name = EXCLUDED.full_name
           RETURNING id`,
          [newRecord.enrollmentNumber, newRecord.fullName]
        );
        const studentId = studentRes.rows[0]?.id;

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
            newRecord.enrollmentNumber,
            newRecord.fullName,
            newRecord.academicYear || '',
            newRecord.semester || '',
            newRecord.higherStudiesPlan || '',
            newRecord.higherStudiesProof ? JSON.stringify(newRecord.higherStudiesProof) : null,
            JSON.stringify(newRecord.selectedAchievementCategories || []),
            JSON.stringify(newRecord.competitionAchievements || {}),
            newRecord.patentDetail ? JSON.stringify(newRecord.patentDetail) : null,
            newRecord.startupDetail ? JSON.stringify(newRecord.startupDetail) : null,
            newRecord.fundedProjectDetail ? JSON.stringify(newRecord.fundedProjectDetail) : null,
            newRecord.ssipProjectDetail ? JSON.stringify(newRecord.ssipProjectDetail) : null,
            newRecord.researchPublicationDetail ? JSON.stringify(newRecord.researchPublicationDetail) : null,
            newRecord.exitProgression ? JSON.stringify(newRecord.exitProgression) : null,
            JSON.stringify(newRecord),
            newRecord.submittedAt,
          ]
        );

        const subId = subRes.rows[0]?.id;

        // Normalized competition entries
        if (newRecord.competitionAchievements) {
          for (const [key, comp] of Object.entries<any>(newRecord.competitionAchievements)) {
            await client.query(
              `INSERT INTO competition_achievements (
                submission_id, enrollment_number, category, event_name, organized_by,
                level, participation_status, date_of_achievement, description, certificate_file
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                subId,
                newRecord.enrollmentNumber,
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

        // Normalized patent
        if (newRecord.patentDetail?.patentTitle) {
          await client.query(
            `INSERT INTO patents (
              submission_id, enrollment_number, patent_title, patent_app_number, patent_status, filing_date, proof_file
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              subId,
              newRecord.enrollmentNumber,
              newRecord.patentDetail.patentTitle,
              newRecord.patentDetail.patentAppNumber || '',
              newRecord.patentDetail.patentStatus || '',
              newRecord.patentDetail.filingDate || '',
              newRecord.patentDetail.proofFile ? JSON.stringify(newRecord.patentDetail.proofFile) : null,
            ]
          );
        }

        // Normalized startup
        if (newRecord.startupDetail?.startupName) {
          await client.query(
            `INSERT INTO startups (
              submission_id, enrollment_number, startup_name, student_role, startup_status, registration_details, proof_file
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              subId,
              newRecord.enrollmentNumber,
              newRecord.startupDetail.startupName,
              newRecord.startupDetail.studentRole || '',
              newRecord.startupDetail.startupStatus || '',
              newRecord.startupDetail.registrationDetails || '',
              newRecord.startupDetail.proofFile ? JSON.stringify(newRecord.startupDetail.proofFile) : null,
            ]
          );
        }

        // Normalized research publication
        if (newRecord.researchPublicationDetail?.paperTitle) {
          await client.query(
            `INSERT INTO research_publications (
              submission_id, enrollment_number, paper_title, journal_conference_name, publication_type, publication_status, doi_or_link, proof_file
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              subId,
              newRecord.enrollmentNumber,
              newRecord.researchPublicationDetail.paperTitle,
              newRecord.researchPublicationDetail.journalConferenceName || '',
              newRecord.researchPublicationDetail.publicationType || '',
              newRecord.researchPublicationDetail.publicationStatus || '',
              newRecord.researchPublicationDetail.doiOrLink || '',
              newRecord.researchPublicationDetail.proofFile ? JSON.stringify(newRecord.researchPublicationDetail.proofFile) : null,
            ]
          );
        }

        return res.status(201).json({
          success: true,
          id: subId || newRecord.id,
          database: 'Neon PostgreSQL (Active)',
          message: 'Saved to Neon DB successfully.',
        });
      } finally {
        client.release();
      }
    }

    res.status(201).json({
      success: true,
      id: newRecord.id,
      message: 'Submission received.',
    });
  } catch (err: any) {
    console.error('Error creating submission:', err);
    res.status(500).json({ error: 'Failed to save submission', details: err?.message });
  }
});

app.delete('/api/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (pool) {
      await pool.query(
        `DELETE FROM submissions WHERE id::text = $1 OR enrollment_number = $1 OR raw_data->>'id' = $1`,
        [id]
      );
    }
    res.json({ success: true, message: 'Record deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete record', details: err?.message });
  }
});

app.get('/api/export', async (req, res) => {
  try {
    let list: any[] = [];
    if (pool) {
      const result = await pool.query('SELECT raw_data FROM submissions ORDER BY submitted_at DESC');
      list = result.rows.map((r: any) => r.raw_data || r);
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="student_outcomes_export.json"');
    res.send(JSON.stringify(list, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default app;
