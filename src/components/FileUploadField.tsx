import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Eye } from 'lucide-react';
import { UploadedFile } from '../types';

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
  description = 'Upload 1 supported file. Max 2 MB (PDF or Image).',
  required = false,
  value,
  onChange,
  accept = '.pdf,image/jpeg,image/png,image/webp',
  maxSizeMB = 2,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const processFile = (file: File) => {
    setErrorMessage(null);
    const maxBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxBytes) {
      setErrorMessage(`File size exceeds ${maxSizeMB} MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please upload a smaller file.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onChange({
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
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
          className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-sm text-slate-800"
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate max-w-xs sm:max-w-md">{value.name}</p>
              <div className="flex items-center space-x-2 text-xs text-emerald-700">
                <span>{(value.size / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified &lt; {maxSizeMB}MB
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              id={`${id}-preview-btn`}
              onClick={() => setPreviewOpen(true)}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-1 shadow-xs"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              Preview
            </button>
            <button
              type="button"
              id={`${id}-remove-btn`}
              onClick={removeFile}
              className="p-1.5 text-rose-500 hover:bg-rose-100/60 rounded transition-colors"
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
            <p className="text-xs text-slate-400">PDF, JPG, PNG or WEBP (Max {maxSizeMB} MB)</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewOpen && value && (
        <div
          id={`${id}-modal`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">{value.name}</h4>
                <p className="text-xs text-slate-500">{(value.size / 1024).toFixed(1)} KB • {value.type}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-100 min-h-[300px]">
              {value.dataUrl.startsWith('data:image/') ? (
                <img
                  src={value.dataUrl}
                  alt={value.name}
                  className="max-h-[60vh] max-w-full rounded object-contain"
                />
              ) : value.dataUrl.startsWith('data:application/pdf') ? (
                <iframe
                  src={value.dataUrl}
                  title={value.name}
                  className="w-full h-[60vh] rounded border border-slate-200"
                />
              ) : (
                <div className="text-center p-6 bg-white rounded-lg border border-slate-200">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Preview not directly embeddable</p>
                  <a
                    href={value.dataUrl}
                    download={value.name}
                    className="mt-3 inline-block px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
