import React, { useEffect, useState, useMemo } from 'react';
import { FileText, ExternalLink, Download, X, Smartphone } from 'lucide-react';
import { UploadedFile } from '../types';

interface PdfPreviewModalProps {
  file: UploadedFile | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Detect if the current device is a mobile/tablet that doesn't support
 * inline PDF rendering via <object> or <iframe>.
 */
const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  // iPad with desktop-mode UA can be detected via touch + platform
  const isIPad = /Macintosh/i.test(ua) && 'ontouchend' in document;

  // Also check for small screen width as a secondary signal
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;

  return isMobileUA || isIPad || isSmallScreen;
};

import { decompressPdfData } from '../utils/documentUtils';

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ file, isOpen, onClose }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMemo(() => isMobileDevice(), []);

  useEffect(() => {
    if (!file || !isOpen || !file.dataUrl) {
      setBlobUrl(null);
      setError(null);
      setLoading(false);
      return;
    }

    let createdBlobUrl = '';
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadPdf() {
      try {
        if (file!.dataUrl.startsWith('data:')) {
          const { buffer, isCompressed } = decompressPdfData(file!.dataUrl);
          if (!buffer || buffer.length === 0) {
            throw new Error('Document buffer is empty or corrupted');
          }
          const blob = new Blob([buffer], { type: 'application/pdf' });
          createdBlobUrl = URL.createObjectURL(blob);
          if (isMounted) {
            setBlobUrl(createdBlobUrl);
            setLoading(false);
          }
        } else {
          // Fetch from server endpoint (e.g. /api/submissions/:id/file?name=...)
          const res = await fetch(file!.dataUrl);
          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error || `Server returned status ${res.status}`);
          }
          const blob = await res.blob();
          if (blob.size === 0) {
            throw new Error('Received empty file data from server');
          }
          createdBlobUrl = URL.createObjectURL(blob);
          if (isMounted) {
            setBlobUrl(createdBlobUrl);
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.error('Error preparing PDF preview blob:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load PDF preview');
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
      if (createdBlobUrl && createdBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [file, isOpen]);

  if (!isOpen || !file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
          isMobile ? 'max-w-lg max-h-[80vh]' : 'max-w-4xl h-[90vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden min-w-0">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-900 text-sm truncate">{file.name}</h4>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB • PDF Document
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {!isMobile && blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                <span>Open in Tab</span>
              </a>
            )}
            {!isMobile && blobUrl && (
              <a
                href={blobUrl}
                download={file.name}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
          {blobUrl ? (
            isMobile ? (
              /* ── Mobile-friendly fallback ── */
              <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-white">
                <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
                  <Smartphone className="w-10 h-10 text-indigo-500" />
                </div>
                <p className="text-base font-bold text-slate-900 mb-1">
                  View Document
                </p>
                <p className="text-sm text-slate-500 max-w-xs mb-6 leading-relaxed">
                  Inline PDF preview is not available on mobile devices. Use the options below to view or save the document.
                </p>
                <div className="flex flex-col w-full max-w-xs gap-3">
                  <a
                    href={blobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <ExternalLink className="w-4.5 h-4.5" />
                    Open PDF
                  </a>
                  <a
                    href={blobUrl}
                    download={file.name}
                    className="w-full px-5 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-slate-200 transition-colors"
                  >
                    <Download className="w-4.5 h-4.5" />
                    Download PDF
                  </a>
                </div>
                <p className="text-[11px] text-slate-400 mt-5">
                  {file.name} • {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              /* ── Desktop: inline embed with fallback ── */
              <object
                data={blobUrl}
                type="application/pdf"
                className="w-full h-full flex-1"
              >
                <iframe
                  src={blobUrl}
                  title={file.name}
                  className="w-full h-full flex-1 border-0"
                />
                <div className="p-8 text-center flex flex-col items-center justify-center h-full bg-white">
                  <FileText className="w-16 h-16 text-indigo-400 mb-3" />
                  <p className="text-sm font-semibold text-slate-800">
                    PDF Preview is not supported by your browser directly
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    You can open this PDF in a new tab or download it to view on your device.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <a
                      href={blobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open PDF in New Tab
                    </a>
                    <a
                      href={blobUrl}
                      download={file.name}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </a>
                  </div>
                </div>
              </object>
            )
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-white space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Unable to load document preview</p>
                <p className="text-xs text-slate-500 mt-1">{error}</p>
              </div>
              {file?.dataUrl && (
                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={file.dataUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Direct Link
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs space-y-2">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading document preview...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
