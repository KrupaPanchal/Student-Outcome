import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Eye } from 'lucide-react';
import { UploadedFile } from '../types';
import { PdfPreviewModal } from './PdfPreviewModal';

interface FileUploadFieldProps {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  value?: UploadedFile;
  onChange: (file?: UploadedFile) => void;
  accept?: string;
  maxSizeMB?: number;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  id,
  label,
  description = 'Upload 1 supported file. Max 2 MB (PDF only).',
  required = false,
  value,
  onChange,
  accept = '.pdf,application/pdf',
  maxSizeMB = 2,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const processFile = (file: File) => {
    setErrorMessage(null);
    const maxBytes = maxSizeMB * 1024 * 1024;

    // Strict validation: Only PDF files allowed
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setErrorMessage('Only PDF files are allowed. Please upload a valid .pdf document.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.size > maxBytes) {
      setErrorMessage(`File size exceeds ${maxSizeMB} MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please upload a smaller file.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onChange({
        name: file.name,
        size: file.size,
        type: 'application/pdf',
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-1.5" id={`${id}-container`}>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <p className="text-xs text-slate-500">{description}</p>

      {value ? (
        <div
          id={`${id}-uploaded-card`}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-sm text-slate-800 gap-2 sm:gap-3"
        >
          <div className="flex items-center space-x-2.5 sm:space-x-3 overflow-hidden min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-700 rounded-md shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-xs sm:text-sm text-slate-900 truncate">{value.name}</p>
              <div className="flex items-center space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs text-emerald-700 flex-wrap">
                <span>{(value.size / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  PDF Document &lt; {maxSizeMB}MB
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              id={`${id}-preview-btn`}
              onClick={() => setPreviewOpen(true)}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              Preview
            </button>
            <button
              type="button"
              id={`${id}-remove-btn`}
              onClick={removeFile}
              className="p-1 text-rose-500 hover:bg-rose-100/60 rounded transition-colors cursor-pointer"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          id={id}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-lg p-5 text-center transition-colors flex flex-col items-center justify-center gap-2 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            id={`${id}-input`}
          />
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Upload className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-slate-700">
              <span className="text-indigo-600 font-semibold hover:underline">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-400">PDF only (Max {maxSizeMB} MB)</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Reusable Document Preview Modal */}
      <PdfPreviewModal
        isOpen={previewOpen}
        file={value || null}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
};
