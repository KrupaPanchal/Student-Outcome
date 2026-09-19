import express from 'express';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import JSZip from 'jszip';
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
    // Prime in-memory cache asynchronously
    loadSubmissionsCache(true).catch(() => {});
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

// In-Memory Submissions Cache for high-performance database querying
let memorySubmissionsCache: any[] | null = null;
try {
  memorySubmissionsCache = getLocalSubmissions();
} catch {}
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // Auto re-sync every 60s
let isCacheLoading = false;

async function loadSubmissionsCache(force = false): Promise<any[]> {
  const now = Date.now();
  if (!force && memorySubmissionsCache && (now - cacheTimestamp < CACHE_TTL_MS)) {
    return memorySubmissionsCache;
  }

  if (isCacheLoading && memorySubmissionsCache) {
    return memorySubmissionsCache;
  }

  isCacheLoading = true;
  try {
    if (pgConnected && pgPool) {
      const result = await pgPool.query('SELECT raw_data FROM submissions ORDER BY submitted_at DESC');
      const docs = result.rows.map((row: any) => {
        const item = row.raw_data || row;
        if (!item.id && !item._id && row.id) {
          item.id = String(row.id);
        }
        return item;
      });
      memorySubmissionsCache = docs;
      cacheTimestamp = Date.now();
      console.log(`[Cache] Preloaded ${docs.length} submissions from Neon PostgreSQL.`);
      return docs;
    }
    const localList = getLocalSubmissions();
    memorySubmissionsCache = localList;
    cacheTimestamp = Date.now();
    return localList;
  } catch (err) {
    console.error('[Cache] Error loading submissions cache:', err);
    if (memorySubmissionsCache) return memorySubmissionsCache;
    return getLocalSubmissions();
  } finally {
    isCacheLoading = false;
  }
}

// Convert large base64 dataUrls into fast direct document download URLs for list view
function sanitizeSubmissionForList(sub: any): any {
  if (!sub || typeof sub !== 'object') return sub;
  const subId = sub.id || sub._id || sub.enrollmentNumber;

  function processObj(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(processObj);

    // If it's an uploaded file object
    if (typeof obj.name === 'string' && typeof obj.dataUrl === 'string') {
      const isBase64 = obj.dataUrl.startsWith('data:');
      return {
        ...obj,
        dataUrl: isBase64
          ? `/api/submissions/${encodeURIComponent(subId)}/file?name=${encodeURIComponent(obj.name)}`
          : obj.dataUrl,
      };
    }

    const copy: any = {};
    for (const [k, v] of Object.entries(obj)) {
      copy[k] = processObj(v);
    }
    return copy;
  }

  return processObj(sub);
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

// Preload cache on initialization
loadSubmissionsCache().catch(() => {});

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
      count = (memorySubmissionsCache || getLocalSubmissions()).length;
    }
  } else if (mongoDbConnected && mongoClient) {
    try {
      count = await mongoClient.db().collection('submissions').countDocuments();
      dbName = 'MongoDB Active';
    } catch {
      count = (memorySubmissionsCache || getLocalSubmissions()).length;
    }
  } else {
    count = (memorySubmissionsCache || getLocalSubmissions()).length;
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
      count = (memorySubmissionsCache || getLocalSubmissions()).length;
    }
  } else {
    count = (memorySubmissionsCache || getLocalSubmissions()).length;
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
    const { academicYear, semester, search, full } = req.query;

    const list = await loadSubmissionsCache();
    let filtered = [...list];

    if (academicYear) {
      filtered = filtered.filter((item) => String(item.academicYear) === String(academicYear));
    }
    if (semester) {
      filtered = filtered.filter((item) => String(item.semester) === String(semester));
    }
    if (search) {
      const s = String(search).toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.enrollmentNumber?.toLowerCase().includes(s) ||
          item.fullName?.toLowerCase().includes(s)
      );
    }

    filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    // Unless full payload is explicitly asked, strip heavy base64 strings to direct file URLs
    if (full !== 'true') {
      filtered = filtered.map(sanitizeSubmissionForList);
    }

    res.json(filtered);
  } catch (err: any) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({ error: 'Failed to fetch submissions', details: err?.message });
  }
});

// Dedicated File Serving Endpoint: opens inline in tab or downloads on click
app.get('/api/submissions/:id/file', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, download } = req.query as { name?: string; download?: string };

    const cache = await loadSubmissionsCache();
    const record = cache.find(
      (item) =>
        String(item.id) === String(id) ||
        String(item._id) === String(id) ||
        String(item.enrollmentNumber) === String(id)
    );

    if (!record) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const allFiles: { name: string; type?: string; dataUrl: string; compressed?: boolean }[] = [];

    function collectAllFiles(obj: any) {
      if (!obj || typeof obj !== 'object') return;
      if (typeof obj.dataUrl === 'string' && (typeof obj.name === 'string' || obj.dataUrl.startsWith('data:'))) {
        allFiles.push({
          name: obj.name || 'document.pdf',
          type: obj.type || 'application/pdf',
          dataUrl: obj.dataUrl,
          compressed: obj.compressed,
        });
        return;
      }
      for (const val of Object.values(obj)) {
        if (typeof val === 'object') collectAllFiles(val);
      }
    }

    collectAllFiles(record);

    if (allFiles.length === 0) {
      return res.status(404).json({ error: 'No files found in submission' });
    }

    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const reqName = (name || '').trim();
    const reqClean = clean(reqName);

    // 1. Exact match
    let foundFile = allFiles.find((f) => f.name.toLowerCase() === reqName.toLowerCase());

    // 2. Decoded URL match
    if (!foundFile && reqName) {
      try {
        const decoded = decodeURIComponent(reqName).toLowerCase();
        foundFile = allFiles.find((f) => f.name.toLowerCase() === decoded);
      } catch {}
    }

    // 3. Alphanumeric clean match (ignores spaces, underscores, hashes, parentheses)
    if (!foundFile && reqClean) {
      foundFile = allFiles.find((f) => clean(f.name) === reqClean);
    }

    // 4. Substring containment match
    if (!foundFile && reqClean) {
      foundFile = allFiles.find(
        (f) => clean(f.name).includes(reqClean) || reqClean.includes(clean(f.name))
      );
    }

    // 5. Fallback: If no name specified or only 1 file exists
    if (!foundFile) {
      if (!reqName || allFiles.length === 1) {
        foundFile = allFiles[0];
      }
    }

    if (!foundFile) {
      return res.status(404).json({ error: 'Requested file not found in submission' });
    }

    const dataUrl: string = (foundFile as any).dataUrl;
    if (dataUrl && dataUrl.startsWith('data:')) {
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid base64 document format' });
      }

      let contentType = match[1] || 'application/pdf';
      let fileBuffer = Buffer.from(match[2], 'base64');
      const isDeflated = contentType.includes('+deflate') || (foundFile as any).compressed;

      if (isDeflated) {
        try {
          fileBuffer = zlib.inflateSync(fileBuffer);
          contentType = 'application/pdf';
        } catch (zlibErr) {
          console.error('Error decompressing deflated PDF in server:', zlibErr);
        }
      }

      const fileName = (foundFile as any).name || 'document.pdf';

      res.setHeader('Content-Type', contentType);
      const disposition = download === '1' || download === 'true' ? 'attachment' : 'inline';
      res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(fileName)}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(fileBuffer);
    }

    if (dataUrl && (dataUrl.startsWith('http') || dataUrl.startsWith('/'))) {
      return res.redirect(dataUrl);
    }

    return res.status(404).json({ error: 'File data unavailable' });
  } catch (err: any) {
    console.error('Error serving submission file:', err);
    res.status(500).json({ error: 'Failed to retrieve file', details: err?.message });
  }
});

// Dedicated ZIP Archive Download for all documents of a student
app.get('/api/submissions/:id/zip', async (req, res) => {
  try {
    const { id } = req.params;
    const cache = await loadSubmissionsCache();
    const record = cache.find(
      (item) =>
        String(item.id) === String(id) ||
        String(item._id) === String(id) ||
        String(item.enrollmentNumber) === String(id)
    );

    if (!record) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const enrollment = (record.enrollmentNumber || 'STUDENT').replace(/[^a-zA-Z0-9_-]/g, '_');
    const zip = new JSZip();

    // Helper to find all files recursively
    const files: { name: string; dataUrl: string; compressed?: boolean }[] = [];
    function collectFiles(obj: any) {
      if (!obj || typeof obj !== 'object') return;
      if (typeof obj.dataUrl === 'string' && typeof obj.name === 'string') {
        files.push(obj);
        return;
      }
      for (const val of Object.values(obj)) {
        if (typeof val === 'object') collectFiles(val);
      }
    }

    collectFiles(record);

    if (files.length === 0) {
      return res.status(404).json({ error: 'No documents uploaded for this student' });
    }

    const usedNames = new Set<string>();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = file.dataUrl;
      if (!dataUrl || !dataUrl.startsWith('data:')) continue;

      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) continue;

      const contentType = match[1] || '';
      let fileBuffer = Buffer.from(match[2], 'base64');
      if (contentType.includes('+deflate') || file.compressed) {
        try {
          fileBuffer = zlib.inflateSync(fileBuffer);
        } catch (e) {
          console.error('Error decompressing deflated PDF for ZIP:', e);
        }
      }

      let filename = file.name || `Document_${i + 1}.pdf`;
      if (!filename.toLowerCase().endsWith('.pdf')) filename += '.pdf';
      if (!filename.startsWith(`${enrollment}_`)) {
        filename = `${enrollment}_${filename}`;
      }

      let finalName = filename;
      let counter = 1;
      while (usedNames.has(finalName)) {
        const dotIndex = filename.lastIndexOf('.');
        const base = dotIndex !== -1 ? filename.slice(0, dotIndex) : filename;
        const ext = dotIndex !== -1 ? filename.slice(dotIndex) : '.pdf';
        finalName = `${base}_(${counter})${ext}`;
        counter++;
      }
      usedNames.add(finalName);

      zip.file(finalName, fileBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const zipFilename = `${enrollment}_All_Documents.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFilename)}"`);
    res.setHeader('Content-Length', zipBuffer.length);
    return res.send(zipBuffer);
  } catch (err: any) {
    console.error('Error generating student ZIP:', err);
    res.status(500).json({ error: 'Failed to generate documents ZIP', details: err?.message });
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

    // Update in-memory cache immediately
    if (memorySubmissionsCache) {
      memorySubmissionsCache.unshift(newRecord);
    }

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

app.put('/api/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ error: 'No data provided' });
    }

    payload.updatedAt = new Date().toISOString();

    // Update in local storage
    const localList = getLocalSubmissions();
    const idx = localList.findIndex(
      (item) => String(item.id) === String(id) || String(item._id) === String(id) || String(item.enrollmentNumber) === String(id)
    );
    if (idx !== -1) {
      localList[idx] = { ...localList[idx], ...payload, id };
      saveLocalSubmissions(localList);
    }

    // Update in memory cache
    if (memorySubmissionsCache) {
      const cIdx = memorySubmissionsCache.findIndex(
        (item) => String(item.id) === String(id) || String(item._id) === String(id) || String(item.enrollmentNumber) === String(id)
      );
      if (cIdx !== -1) {
        memorySubmissionsCache[cIdx] = { ...memorySubmissionsCache[cIdx], ...payload, id };
      }
    }

    // Update in Neon DB
    if (pgConnected && pgPool) {
      try {
        await pgPool.query(
          `UPDATE submissions SET 
            academic_year = $1,
            semester = $2,
            higher_studies_plan = $3,
            selected_achievement_categories = $4,
            raw_data = $5,
            updated_at = NOW()
          WHERE id::text = $6 OR enrollment_number = $6 OR raw_data->>'id' = $6`,
          [
            payload.academicYear || '',
            payload.semester || '',
            payload.higherStudiesPlan || '',
            JSON.stringify(payload.selectedAchievementCategories || []),
            JSON.stringify(payload),
            id,
          ]
        );
      } catch (dbErr) {
        console.warn('[Storage Engine] Failed to update Neon DB:', dbErr);
      }
    }

    res.json({ success: true, message: 'Record updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update record', details: err?.message });
  }
});

app.delete('/api/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete from local storage
    let list = getLocalSubmissions();
    list = list.filter((item) => String(item.id) !== String(id) && String(item._id) !== String(id) && String(item.enrollmentNumber) !== String(id));
    saveLocalSubmissions(list);

    // Delete from cache
    if (memorySubmissionsCache) {
      memorySubmissionsCache = memorySubmissionsCache.filter(
        (item) => String(item.id) !== String(id) && String(item._id) !== String(id) && String(item.enrollmentNumber) !== String(id)
      );
    }

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
    const list = await loadSubmissionsCache();
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

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Student Outcome Portal Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
