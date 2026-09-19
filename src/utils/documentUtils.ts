import { deflate, inflate } from 'pako';
import JSZip from 'jszip';
import { StudentSubmission, UploadedFile, CompetitionAchievement } from '../types';

/**
 * Standardize document name by removing illegal filename characters,
 * replacing whitespace with underscores, and trimming.
 */
export function cleanDocumentIdentifier(name: string): string {
  if (!name) return 'Document';
  // Strip .pdf extension if present
  let clean = name.replace(/\.pdf$/i, '').trim();
  // Replace spaces, slashes, dashes, special chars with single underscore
  clean = clean.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return clean || 'Document';
}

/**
 * Clean and format student enrollment number for filenames.
 */
export function cleanEnrollmentNumber(enrollment: string): string {
  if (!enrollment) return 'STUDENT';
  const clean = enrollment.trim().replace(/[^a-zA-Z0-9_-]+/g, '');
  return clean || 'STUDENT';
}

/**
 * Generates standardized filename in the required format:
 * `<Enrollment>_<DocumentName>.pdf`
 * Example: `23CI2020044_Higher_Studies_Proof.pdf`
 */
export function getStandardizedFilename(
  enrollmentNumber: string,
  documentName: string
): string {
  const enrollment = cleanEnrollmentNumber(enrollmentNumber);
  const docName = cleanDocumentIdentifier(documentName);
  return `${enrollment}_${docName}.pdf`;
}

/**
 * Lossless PDF compression using DEFLATE (pako).
 * Converts binary PDF data into a compressed base64 dataUrl.
 */
export async function compressPdfFile(file: File): Promise<{
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressed: boolean;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const rawBytes = new Uint8Array(arrayBuffer);
  const originalSize = file.size;

  try {
    // Apply lossless DEFLATE compression with level 6
    const compressedBytes = deflate(rawBytes, { level: 6 });

    // Check if compression saved space
    if (compressedBytes.length < rawBytes.length) {
      let binaryStr = '';
      const chunkSize = 8192;
      for (let i = 0; i < compressedBytes.length; i += chunkSize) {
        binaryStr += String.fromCharCode.apply(
          null,
          Array.from(compressedBytes.subarray(i, i + chunkSize))
        );
      }
      const base64 = btoa(binaryStr);
      const dataUrl = `data:application/pdf+deflate;base64,${base64}`;

      return {
        dataUrl,
        originalSize,
        compressedSize: compressedBytes.length,
        compressed: true,
      };
    }
  } catch (err) {
    console.warn('PDF compression skipped or failed:', err);
  }

  // Fallback to standard base64 dataURL if compression was not beneficial or failed
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        dataUrl: reader.result as string,
        originalSize,
        compressedSize: originalSize,
        compressed: false,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Decompress a PDF from a base64 dataUrl or binary buffer.
 * Reliably restores original uncompressed PDF bytes for preview, download, and ZIP archiving.
 */
export function decompressPdfData(dataUrlOrBase64: string): {
  buffer: Uint8Array;
  dataUrl: string;
  isCompressed: boolean;
} {
  if (!dataUrlOrBase64) {
    return { buffer: new Uint8Array(), dataUrl: '', isCompressed: false };
  }

  let base64 = dataUrlOrBase64;
  let isExplicitlyCompressed = false;

  if (dataUrlOrBase64.startsWith('data:')) {
    const parts = dataUrlOrBase64.split(',');
    const header = parts[0] || '';
    base64 = parts[1] || '';
    if (header.includes('+deflate') || header.includes('compressed=deflate')) {
      isExplicitlyCompressed = true;
    }
  }

  try {
    const binary = atob(base64);
    const len = binary.length;
    const rawBytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      rawBytes[i] = binary.charCodeAt(i);
    }

    // Check if rawBytes is already a standard uncompressed PDF (starts with %PDF-)
    const isAlreadyPdf =
      rawBytes.length >= 4 &&
      rawBytes[0] === 0x25 && // '%'
      rawBytes[1] === 0x50 && // 'P'
      rawBytes[2] === 0x44 && // 'D'
      rawBytes[3] === 0x46;   // 'F'

    if (!isAlreadyPdf || isExplicitlyCompressed) {
      try {
        const decompressed = inflate(rawBytes);
        let decompBinaryStr = '';
        const chunkSize = 8192;
        for (let i = 0; i < decompressed.length; i += chunkSize) {
          decompBinaryStr += String.fromCharCode.apply(
            null,
            Array.from(decompressed.subarray(i, i + chunkSize))
          );
        }
        const decompBase64 = btoa(decompBinaryStr);
        return {
          buffer: decompressed,
          dataUrl: `data:application/pdf;base64,${decompBase64}`,
          isCompressed: true,
        };
      } catch {
        // If inflate fails, fall through
      }
    }

    return {
      buffer: rawBytes,
      dataUrl: dataUrlOrBase64.startsWith('data:') ? dataUrlOrBase64 : `data:application/pdf;base64,${base64}`,
      isCompressed: false,
    };
  } catch (err) {
    console.error('Error decompressing PDF data:', err);
    return { buffer: new Uint8Array(), dataUrl: dataUrlOrBase64, isCompressed: false };
  }
}

export interface ExtractedDocument {
  label: string;
  documentName: string;
  filename: string;
  file: UploadedFile;
}

/**
 * Extracts and standardizes every document attached to a student submission.
 * Handles all 8+ document fields with collision protection.
 */
export function extractSubmissionDocuments(sub: StudentSubmission): ExtractedDocument[] {
  const docs: ExtractedDocument[] = [];
  const usedFilenames = new Set<string>();
  const enrollment = sub.enrollmentNumber || 'STUDENT';

  function registerDoc(label: string, defaultDocName: string, file?: UploadedFile) {
    if (!file || (!file.dataUrl && !file.name)) return;

    let docName = file.documentName || defaultDocName;
    let filename = getStandardizedFilename(enrollment, docName);

    if (usedFilenames.has(filename)) {
      let counter = 2;
      while (usedFilenames.has(getStandardizedFilename(enrollment, `${docName}_${counter}`))) {
        counter++;
      }
      docName = `${docName}_${counter}`;
      filename = getStandardizedFilename(enrollment, docName);
    }

    usedFilenames.add(filename);
    docs.push({
      label,
      documentName: docName,
      filename,
      file: {
        ...file,
        name: filename,
        documentName: docName,
        documentLabel: label,
      },
    });
  }

  // 1. Higher Studies Proof
  if (sub.higherStudiesProof) {
    registerDoc('Higher Studies Admission Proof', 'Higher_Studies_Proof', sub.higherStudiesProof);
  }

  // 2. Competition & Event Certificates
  if (sub.competitionAchievements) {
    for (const [cat, raw] of Object.entries(sub.competitionAchievements)) {
      const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
      arr.forEach((ach: CompetitionAchievement, i: number) => {
        if (ach.certificateFile) {
          const suffix = arr.length > 1 ? `_${i + 1}` : '';
          const cleanCat = cleanDocumentIdentifier(cat);
          registerDoc(
            `${cat}${arr.length > 1 ? ` #${i + 1}` : ''} Certificate`,
            `${cleanCat}_Certificate${suffix}`,
            ach.certificateFile
          );
        }
      });
    }
  }

  // 3. Patent Proofs
  const patents = sub.patentDetails || (sub.patentDetail ? [sub.patentDetail] : []);
  patents.forEach((p, idx) => {
    if (p.proofFile) {
      const suffix = patents.length > 1 ? `_${idx + 1}` : '';
      registerDoc(
        `Patent Proof${patents.length > 1 ? ` #${idx + 1}` : ''}`,
        `Patent_Proof${suffix}`,
        p.proofFile
      );
    }
  });

  // 4. Startup Proofs
  const startups = sub.startupDetails || (sub.startupDetail ? [sub.startupDetail] : []);
  startups.forEach((s, idx) => {
    if (s.proofFile) {
      const suffix = startups.length > 1 ? `_${idx + 1}` : '';
      registerDoc(
        `Startup Proof${startups.length > 1 ? ` #${idx + 1}` : ''}`,
        `Startup_Proof${suffix}`,
        s.proofFile
      );
    }
  });

  // 5. Funded Project Proofs
  const funded = sub.fundedProjectDetails || (sub.fundedProjectDetail ? [sub.fundedProjectDetail] : []);
  funded.forEach((fp, idx) => {
    if (fp.proofFile) {
      const suffix = funded.length > 1 ? `_${idx + 1}` : '';
      registerDoc(
        `Funded Project Proof${funded.length > 1 ? ` #${idx + 1}` : ''}`,
        `Funded_Project_Proof${suffix}`,
        fp.proofFile
      );
    }
  });

  // 6. SSIP Project Proofs
  const ssips = sub.ssipProjectDetails || (sub.ssipProjectDetail ? [sub.ssipProjectDetail] : []);
  ssips.forEach((sp, idx) => {
    if (sp.proofFile) {
      const suffix = ssips.length > 1 ? `_${idx + 1}` : '';
      registerDoc(
        `SSIP Project Proof${ssips.length > 1 ? ` #${idx + 1}` : ''}`,
        `SSIP_Project_Proof${suffix}`,
        sp.proofFile
      );
    }
  });

  // 7. Research Publication Proofs
  const pubs = sub.researchPublicationDetails || (sub.researchPublicationDetail ? [sub.researchPublicationDetail] : []);
  pubs.forEach((rp, idx) => {
    if (rp.proofFile) {
      const suffix = pubs.length > 1 ? ` #${idx + 1}` : '';
      registerDoc(
        `Publication Proof${pubs.length > 1 ? ` #${idx + 1}` : ''}`,
        `Research_Publication_Proof${suffix}`,
        rp.proofFile
      );
    }
  });

  // 8. NEP Exit Progression Proofs
  if (sub.exitProgression?.admissionDocument) {
    registerDoc(
      'Exit Higher Education Admission Proof',
      'Exit_Higher_Education_Proof',
      sub.exitProgression.admissionDocument
    );
  }
  if (sub.exitProgression?.employmentDocument) {
    registerDoc(
      'Exit Employment Offer Letter',
      'Exit_Employment_Proof',
      sub.exitProgression.employmentDocument
    );
  }
  if (sub.exitProgression?.gstOrOfficialDocument) {
    registerDoc(
      'Exit GST Registration Proof',
      'Exit_GST_Proof',
      sub.exitProgression.gstOrOfficialDocument
    );
  }

  return docs;
}

/**
 * Standardizes all file objects inside a StudentSubmission to ensure their
 * filenames strictly follow `<Enrollment>_<DocumentName>.pdf`.
 */
export function standardizeSubmissionFiles(submission: StudentSubmission): StudentSubmission {
  const enrollment = cleanEnrollmentNumber(submission.enrollmentNumber);
  const copy: StudentSubmission = JSON.parse(JSON.stringify(submission));

  if (copy.higherStudiesProof) {
    const filename = getStandardizedFilename(enrollment, 'Higher_Studies_Proof');
    copy.higherStudiesProof.name = filename;
    copy.higherStudiesProof.documentName = 'Higher_Studies_Proof';
    copy.higherStudiesProof.documentLabel = 'Higher Studies Admission Proof';
  }

  if (copy.competitionAchievements) {
    for (const [cat, raw] of Object.entries(copy.competitionAchievements)) {
      const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
      arr.forEach((ach: CompetitionAchievement, i: number) => {
        if (ach.certificateFile) {
          const suffix = arr.length > 1 ? `_${i + 1}` : '';
          const cleanCat = cleanDocumentIdentifier(cat);
          const docName = `${cleanCat}_Certificate${suffix}`;
          ach.certificateFile.name = getStandardizedFilename(enrollment, docName);
          ach.certificateFile.documentName = docName;
          ach.certificateFile.documentLabel = `${cat}${arr.length > 1 ? ` #${i + 1}` : ''} Certificate`;
        }
      });
    }
  }

  const patents = copy.patentDetails || (copy.patentDetail ? [copy.patentDetail] : []);
  patents.forEach((p, idx) => {
    if (p.proofFile) {
      const suffix = patents.length > 1 ? `_${idx + 1}` : '';
      const docName = `Patent_Proof${suffix}`;
      p.proofFile.name = getStandardizedFilename(enrollment, docName);
      p.proofFile.documentName = docName;
      p.proofFile.documentLabel = `Patent Proof${patents.length > 1 ? ` #${idx + 1}` : ''}`;
    }
  });

  const startups = copy.startupDetails || (copy.startupDetail ? [copy.startupDetail] : []);
  startups.forEach((s, idx) => {
    if (s.proofFile) {
      const suffix = startups.length > 1 ? `_${idx + 1}` : '';
      const docName = `Startup_Proof${suffix}`;
      s.proofFile.name = getStandardizedFilename(enrollment, docName);
      s.proofFile.documentName = docName;
      s.proofFile.documentLabel = `Startup Proof${startups.length > 1 ? ` #${idx + 1}` : ''}`;
    }
  });

  const funded = copy.fundedProjectDetails || (copy.fundedProjectDetail ? [copy.fundedProjectDetail] : []);
  funded.forEach((fp, idx) => {
    if (fp.proofFile) {
      const suffix = funded.length > 1 ? `_${idx + 1}` : '';
      const docName = `Funded_Project_Proof${suffix}`;
      fp.proofFile.name = getStandardizedFilename(enrollment, docName);
      fp.proofFile.documentName = docName;
      fp.proofFile.documentLabel = `Funded Project Proof${funded.length > 1 ? ` #${idx + 1}` : ''}`;
    }
  });

  const ssips = copy.ssipProjectDetails || (copy.ssipProjectDetail ? [copy.ssipProjectDetail] : []);
  ssips.forEach((sp, idx) => {
    if (sp.proofFile) {
      const suffix = ssips.length > 1 ? `_${idx + 1}` : '';
      const docName = `SSIP_Project_Proof${suffix}`;
      sp.proofFile.name = getStandardizedFilename(enrollment, docName);
      sp.proofFile.documentName = docName;
      sp.proofFile.documentLabel = `SSIP Project Proof${ssips.length > 1 ? ` #${idx + 1}` : ''}`;
    }
  });

  const pubs = copy.researchPublicationDetails || (copy.researchPublicationDetail ? [copy.researchPublicationDetail] : []);
  pubs.forEach((rp, idx) => {
    if (rp.proofFile) {
      const suffix = pubs.length > 1 ? `_${idx + 1}` : '';
      const docName = `Research_Publication_Proof${suffix}`;
      rp.proofFile.name = getStandardizedFilename(enrollment, docName);
      rp.proofFile.documentName = docName;
      rp.proofFile.documentLabel = `Publication Proof${pubs.length > 1 ? ` #${idx + 1}` : ''}`;
    }
  });

  if (copy.exitProgression?.admissionDocument) {
    const docName = 'Exit_Higher_Education_Proof';
    copy.exitProgression.admissionDocument.name = getStandardizedFilename(enrollment, docName);
    copy.exitProgression.admissionDocument.documentName = docName;
    copy.exitProgression.admissionDocument.documentLabel = 'Exit Higher Education Admission Proof';
  }
  if (copy.exitProgression?.employmentDocument) {
    const docName = 'Exit_Employment_Proof';
    copy.exitProgression.employmentDocument.name = getStandardizedFilename(enrollment, docName);
    copy.exitProgression.employmentDocument.documentName = docName;
    copy.exitProgression.employmentDocument.documentLabel = 'Exit Employment Offer Letter';
  }
  if (copy.exitProgression?.gstOrOfficialDocument) {
    const docName = 'Exit_GST_Proof';
    copy.exitProgression.gstOrOfficialDocument.name = getStandardizedFilename(enrollment, docName);
    copy.exitProgression.gstOrOfficialDocument.documentName = docName;
    copy.exitProgression.gstOrOfficialDocument.documentLabel = 'Exit GST Registration Proof';
  }

  return copy;
}

/**
 * Downloads all documents for a single student packaged as a single ZIP archive.
 * Decompresses any stored compressed files and ensures standardized naming inside the ZIP.
 */
export async function downloadStudentDocumentsZip(
  submission: StudentSubmission,
  onProgress?: (msg: string) => void
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const subId = submission.id || submission._id || submission.enrollmentNumber;
    let fullSubmission = submission;

    // If dataUrls are sanitized server links or truncated, fetch full payload from server
    const hasSanitizedUrls = JSON.stringify(submission).includes('/api/submissions/');
    if (hasSanitizedUrls) {
      onProgress?.('Fetching full document records...');
      try {
        const res = await fetch(`/api/submissions?search=${encodeURIComponent(submission.enrollmentNumber)}&full=true`);
        if (res.ok) {
          const list: StudentSubmission[] = await res.json();
          const match = list.find(
            (s) =>
              s.id === subId ||
              s._id === subId ||
              s.enrollmentNumber === submission.enrollmentNumber
          );
          if (match) {
            fullSubmission = match;
          }
        }
      } catch (err) {
        console.warn('Could not fetch full record from API, using current state:', err);
      }
    }

    const docs = extractSubmissionDocuments(fullSubmission);
    if (docs.length === 0) {
      return { success: false, count: 0, error: 'No documents uploaded for this student.' };
    }

    onProgress?.(`Preparing ${docs.length} documents...`);
    const zip = new JSZip();
    let processedCount = 0;

    for (const doc of docs) {
      onProgress?.(`Decompressing ${doc.filename}...`);
      let binaryData: Uint8Array | null = null;

      if (doc.file.dataUrl && doc.file.dataUrl.startsWith('data:')) {
        const decompressed = decompressPdfData(doc.file.dataUrl);
        binaryData = decompressed.buffer;
      } else if (doc.file.dataUrl && doc.file.dataUrl.startsWith('/')) {
        try {
          const fileRes = await fetch(doc.file.dataUrl);
          if (fileRes.ok) {
            const arrayBuf = await fileRes.arrayBuffer();
            binaryData = new Uint8Array(arrayBuf);
          }
        } catch (err) {
          console.error(`Failed to fetch file: ${doc.filename}`, err);
        }
      }

      if (binaryData && binaryData.length > 0) {
        zip.file(doc.filename, binaryData);
        processedCount++;
      }
    }

    if (processedCount === 0) {
      return { success: false, count: 0, error: 'Could not load document files for packaging.' };
    }

    onProgress?.('Building ZIP archive...');
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const enrollment = cleanEnrollmentNumber(submission.enrollmentNumber);
    const zipFilename = `${enrollment}_Documents.zip`;

    const downloadUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = zipFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    return { success: true, count: processedCount };
  } catch (err: any) {
    console.error('Error generating student documents ZIP:', err);
    return { success: false, count: 0, error: err?.message || 'Failed to create ZIP archive.' };
  }
}
