import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { Pool } from 'pg';
import { MongoClient, ObjectId } from 'mongodb';

// Load .env and .env.local
if (fs.existsSync(path.join(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
}
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Ensure data directory exists for local fallback
const DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'submissions.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(LOCAL_DB_FILE)) {
  fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// PostgreSQL / Neon DB Connection handling
let activePgUri = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || '';
let pgPool: Pool | null = null;
let pgConnected = false;
let pgConnectionError: string | null = null;

// MongoDB Connection handling (optional)
let activeMongoUri = process.env.MONGODB_URI || '';
let mongoClient: MongoClient | null = null;
let mongoDbConnected = false;

async function connectToPg(uriToTest: string): Promise<{ success: boolean; error?: string; count?: number }> {
  if (!uriToTest) {
    pgConnected = false;
    pgConnectionError = 'No DATABASE_URL configured';
    return { success: false, error: pgConnectionError };
  }

  try {
    if (pgPool) {
      try { await pgPool.end(); } catch {}
    }

    const pool = new Pool({
      connectionString: uriToTest,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();
    const countRes = await client.query('SELECT COUNT(*) FROM submissions');
    client.release();

    pgPool = pool;
    pgConnected = true;
    activePgUri = uriToTest;
    pgConnectionError = null;

    const count = parseInt(countRes.rows[0].count, 10);
    console.log(`[Neon DB] Connected successfully to Neon PostgreSQL. Found ${count} submissions.`);
    return { success: true, count };
  } catch (err: any) {
    pgConnected = false;
    pgConnectionError = err?.message || 'Failed to connect to Neon PostgreSQL';
    console.warn(`[Neon DB] Connection failed: ${pgConnectionError}. Active fallback: Persistent Local Storage.`);
    return { success: false, error: pgConnectionError };
  }
}

if (activePgUri) {
  connectToPg(activePgUri);
}

// Helper to get local records
function getLocalSubmissions(): any[] {
  try {
    const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
    const list = JSON.parse(raw);
    let updated = false;
    const normalized = list.map((item: any, idx: number) => {
      if (!item.id && !item._id) {
        item.id = `sub_${item.enrollmentNumber || idx}_${idx}`;
        updated = true;
      }
      return item;
    });
    if (updated) {
      saveLocalSubmissions(normalized);
    }
    return normalized;
  } catch (err) {
    return [];
  }
}

function saveLocalSubmissions(data: any[]): void {
  fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// API Routes
app.get('/api/health', async (req, res) => {
  let count = 0;
  let dbName = 'Local Persistent Storage';

  if (pgConnected && pgPool) {
    try {
      const result = await pgPool.query('SELECT COUNT(*) FROM submissions');
      count = parseInt(result.rows[0].count, 10);
      dbName = 'Neon PostgreSQL (Active)';
    } catch {
      count = getLocalSubmissions().length;
    }
  } else if (mongoDbConnected && mongoClient) {
    try {
      count = await mongoClient.db().collection('submissions').countDocuments();
      dbName = 'MongoDB Active';
    } catch {
      count = getLocalSubmissions().length;
    }
  } else {
    count = getLocalSubmissions().length;
  }

  res.json({
    status: 'ok',
    database: dbName,
    isNeon: pgConnected,
    isMongo: mongoDbConnected,
    neonConfigured: Boolean(activePgUri),
    neonError: pgConnectionError || undefined,
    totalSubmissions: count,
  });
});

app.post('/api/reconnect-db', async (req, res) => {
  const { uri } = req.body || {};
  const uriToUse = (typeof uri === 'string' && uri.trim()) ? uri.trim() : activePgUri;
  const result = await connectToPg(uriToUse);

  let count = 0;
  if (pgConnected && pgPool) {
    try {
      const resCount = await pgPool.query('SELECT COUNT(*) FROM submissions');
      count = parseInt(resCount.rows[0].count, 10);
    } catch {
      count = getLocalSubmissions().length;
    }
  } else {
    count = getLocalSubmissions().length;
  }

  res.json({
    success: result.success,
    isNeon: pgConnected,
    database: pgConnected ? 'Neon PostgreSQL (Active)' : 'Local Persistent Storage',
    error: pgConnectionError,
    totalSubmissions: count,
  });
});

app.get('/api/submissions', async (req, res) => {
  try {
    const { academicYear, semester, search } = req.query;

    if (pgConnected && pgPool) {
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

      const result = await pgPool.query(query, params);
      const docs = result.rows.map((row: any) => row.raw_data || row);
      return res.json(docs);
    }

    // Local JSON DB fallback
    let list = getLocalSubmissions();
    if (academicYear) {
      list = list.filter((item) => item.academicYear === academicYear);
    }
    if (semester) {
      list = list.filter((item) => item.semester === semester);
    }
    if (search) {
      const s = String(search).toLowerCase();
      list = list.filter(
        (item) =>
          item.enrollmentNumber?.toLowerCase().includes(s) ||
          item.fullName?.toLowerCase().includes(s)
      );
    }
    list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    res.json(list);
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

    // Always persist to local storage as durable safeguard
    const list = getLocalSubmissions();
    list.unshift(newRecord);
    saveLocalSubmissions(list);

    if (pgConnected && pgPool) {
      try {
        const client = await pgPool.connect();
        try {
          // Upsert student
          const studentRes = await client.query(
            `INSERT INTO students (enrollment_number, full_name)
             VALUES ($1, $2)
             ON CONFLICT (enrollment_number) DO UPDATE SET full_name = EXCLUDED.full_name
             RETURNING id`,
            [newRecord.enrollmentNumber, newRecord.fullName]
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
            message: 'Student outcome submission saved to Neon DB and local backup successfully.',
          });
        } finally {
          client.release();
        }
      } catch (dbErr) {
        console.warn('[Storage Engine] Neon DB write error, preserved in local storage:', dbErr);
      }
    }

    res.status(201).json({
      success: true,
      id: newRecord.id,
      database: 'Local Storage',
      message: 'Student outcome submission saved successfully in Persistent Storage.',
    });
  } catch (err: any) {
    console.error('Error creating submission:', err);
    res.status(500).json({ error: 'Failed to save submission', details: err?.message });
  }
});

app.delete('/api/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete from local storage
    let list = getLocalSubmissions();
    list = list.filter((item) => item.id !== id && item._id !== id);
    saveLocalSubmissions(list);

    // Delete from Neon DB if connected
    if (pgConnected && pgPool) {
      try {
        await pgPool.query(
          `DELETE FROM submissions WHERE id::text = $1 OR enrollment_number = $1 OR raw_data->>'id' = $1`,
          [id]
        );
      } catch (err) {
        console.warn('[Storage Engine] Failed to delete from Neon DB:', err);
      }
    }

    res.json({ success: true, message: 'Record deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete record', details: err?.message });
  }
});

app.get('/api/export', async (req, res) => {
  try {
    let list: any[] = [];
    if (pgConnected && pgPool) {
      const result = await pgPool.query('SELECT raw_data FROM submissions ORDER BY submitted_at DESC');
      list = result.rows.map((r: any) => r.raw_data || r);
    } else {
      list = getLocalSubmissions();
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="student_outcomes_export.json"');
    res.send(JSON.stringify(list, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Setup Vite Dev Middleware / Static Production Serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Student Outcome Portal Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
