import { cleanDocumentIdentifier, cleanEnrollmentNumber, getStandardizedFilename, extractSubmissionDocuments } from '../src/utils/documentUtils';
import { deflate, inflate } from 'pako';
import JSZip from 'jszip';
import assert from 'assert';

console.log('Testing Document Storage & Compression Features...\n');

// 1. Test Standardized Naming
const name1 = getStandardizedFilename('23CI2020044', 'Higher Studies Proof');
console.log('Test 1 - Higher Studies:', name1);
assert.strictEqual(name1, '23CI2020044_Higher_Studies_Proof.pdf');

const name2 = getStandardizedFilename('23CI2020044', 'Coding Competition #1 Certificate');
console.log('Test 2 - Competition #1:', name2);
assert.strictEqual(name2, '23CI2020044_Coding_Competition_1_Certificate.pdf');

const name3 = getStandardizedFilename('23CI2020044', 'Patent #2 Proof');
console.log('Test 3 - Patent #2:', name3);
assert.strictEqual(name3, '23CI2020044_Patent_2_Proof.pdf');

// 2. Test Lossless DEFLATE Compression & Decompression
const mockPdfContent = '%PDF-1.4\n1 0 obj\n<< /Title (Student Outcome Certificate) /Author (23CI2020044) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF' + '0'.repeat(5000);
const rawBytes = new TextEncoder().encode(mockPdfContent);
const compressed = deflate(rawBytes, { level: 6 });
console.log(`\nTest 4 - Compression: ${rawBytes.length} bytes -> ${compressed.length} bytes (${Math.round((1 - compressed.length / rawBytes.length) * 100)}% reduction)`);
assert(compressed.length < rawBytes.length, 'Compression should reduce size for repetitive PDF streams');

const decompressed = inflate(compressed);
const decompressedText = new TextDecoder().decode(decompressed);
assert.strictEqual(decompressedText, mockPdfContent, 'Lossless decompression must perfectly match original');
console.log('Test 5 - Lossless Decompression: OK (100% byte fidelity verified)');

// 3. Test Dynamic Document Extraction
const mockSubmission: any = {
  enrollmentNumber: '23CI2020044',
  fullName: 'Jeet Pitale',
  academicYear: '2024-25',
  semester: 'IV',
  higherStudiesPlan: 'Yes – Top University',
  higherStudiesProof: { name: 'higher.pdf', size: 1024, type: 'application/pdf', dataUrl: 'data:application/pdf;base64,AAAA' },
  competitionAchievements: {
    Hackathon: [
      { eventName: 'Smart India Hackathon', certificateFile: { name: 'sih.pdf', size: 2048, type: 'application/pdf', dataUrl: 'data:application/pdf;base64,BBBB' } }
    ],
    Sports: [
      { eventName: 'Badminton Championship', certificateFile: { name: 'badminton.pdf', size: 2048, type: 'application/pdf', dataUrl: 'data:application/pdf;base64,CCCC' } }
    ]
  },
  patentDetails: [
    { patentTitle: 'AI System', proofFile: { name: 'pat.pdf', size: 3000, type: 'application/pdf', dataUrl: 'data:application/pdf;base64,DDDD' } }
  ],
  exitProgression: {
    isExiting: true,
    exitYear: 'Year 3',
    pathway: 'Higher Education',
    admissionDocument: { name: 'admit.pdf', size: 4000, type: 'application/pdf', dataUrl: 'data:application/pdf;base64,EEEE' }
  }
};

const extractedDocs = extractSubmissionDocuments(mockSubmission);
console.log(`\nTest 6 - Extracted ${extractedDocs.length} documents dynamically:`);
extractedDocs.forEach(d => console.log(`  - [${d.label}] -> ${d.filename}`));

assert.strictEqual(extractedDocs.length, 5, 'Should extract all 5 documents across various sections');
assert.strictEqual(extractedDocs[0].filename, '23CI2020044_Higher_Studies_Proof.pdf');
assert.strictEqual(extractedDocs[1].filename, '23CI2020044_Hackathon_Certificate.pdf');
assert.strictEqual(extractedDocs[2].filename, '23CI2020044_Sports_Certificate.pdf');
assert.strictEqual(extractedDocs[3].filename, '23CI2020044_Patent_Proof.pdf');
assert.strictEqual(extractedDocs[4].filename, '23CI2020044_Exit_Higher_Education_Proof.pdf');

// 4. Test ZIP Generation
const zip = new JSZip();
for (const doc of extractedDocs) {
  zip.file(doc.filename, new Uint8Array([1, 2, 3, 4]));
}
zip.generateAsync({ type: 'uint8array' }).then((zipBytes) => {
  assert(zipBytes.length > 0, 'ZIP archive must be non-empty');
  console.log(`\nTest 7 - Generated ZIP archive: ${zipBytes.length} bytes. All tests passed successfully! ✨\n`);
});
