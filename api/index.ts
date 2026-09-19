import express from 'express';
import zlib from 'zlib';
import JSZip from 'jszip';
import { Pool } from 'pg';

const app = express();

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

let poolInstance: Pool | null = null;

function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || '';
  if (!connectionString) {
    return null;
  }
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
  }
  return poolInstance;
}

app.get('/api/health', async (req, res) => {
  let count = 0;
  let isConnected = false;
  let errorMsg: string | undefined;

  const pool = getPool();
  if (pool) {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM submissions');
      count = parseInt(result.rows[0].count, 10);
      isConnected = true;
    } catch (err: any) {
      console.error('Health check DB error:', err);
      errorMsg = err?.message;
    }
  }

  res.json({
    status: 'ok',
    database: isConnected ? 'Neon PostgreSQL (Active)' : 'Database Not Connected',
    isNeon: isConnected,
    neonConfigured: Boolean(process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED),
    totalSubmissions: count,
    error: errorMsg,
  });
});

app.get('/api/submissions', async (req, res) => {
  try {
    const pool = getPool();
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

app.get('/api/submissions/:id/file', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, download } = req.query as { name?: string; download?: string };
    const pool = getPool();
    if (!pool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const result = await pool.query(
      `SELECT raw_data FROM submissions WHERE id::text = $1 OR enrollment_number = $1 OR raw_data->>'id' = $1 LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const record = result.rows[0].raw_data || result.rows[0];
    let foundFile: { name: string; type?: string; dataUrl: string } | null = null;

    function searchFile(obj: any) {
      if (!obj || typeof obj !== 'object' || foundFile) return;
      if (typeof obj.name === 'string' && typeof obj.dataUrl === 'string') {
        if (!name || obj.name.toLowerCase() === name.toLowerCase()) {
          foundFile = obj;
          return;
        }
      }
      for (const val of Object.values(obj)) {
        if (typeof val === 'object') searchFile(val);
      }
    }

    searchFile(record);

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

app.get('/api/submissions/:id/zip', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    if (!pool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const result = await pool.query(
      `SELECT raw_data FROM submissions WHERE id::text = $1 OR enrollment_number = $1 OR raw_data->>'id' = $1 LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const record = result.rows[0].raw_data || result.rows[0];
    const enrollment = (record.enrollmentNumber || 'STUDENT').replace(/[^a-zA-Z0-9_-]/g, '_');
    const zip = new JSZip();

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

    const pool = getPool();
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
    const pool = getPool();
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
    const pool = getPool();
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
