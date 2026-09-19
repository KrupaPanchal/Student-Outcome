import React from 'react';
import { Compass, CheckCircle2, FileCheck, Building2, Globe, AlertCircle } from 'lucide-react';
import { HigherStudiesPlan, UploadedFile } from '../types';
import { FileUploadField } from './FileUploadField';

interface HigherStudiesSectionProps {
  higherStudiesPlan: HigherStudiesPlan | '';
  setHigherStudiesPlan: (val: HigherStudiesPlan) => void;
  higherStudiesUniversityName?: string;
  setHigherStudiesUniversityName: (val: string) => void;
  higherStudiesProof?: UploadedFile;
  setHigherStudiesProof: (file?: UploadedFile) => void;
  errors?: Record<string, string>;
  enrollmentNumber?: string;
}

const HIGHER_STUDIES_OPTIONS: HigherStudiesPlan[] = [
  'No, I do not plan to pursue higher studies',
  'Yes – Sardar Vallabhbhai Global University (SVGU)',
  'Yes – Other University in India',
  'Yes – Foreign University',
];

export const HigherStudiesSection: React.FC<HigherStudiesSectionProps> = ({
  higherStudiesPlan,
  setHigherStudiesPlan,
  higherStudiesUniversityName = '',
  setHigherStudiesUniversityName,
  higherStudiesProof,
  setHigherStudiesProof,
  errors = {},
  enrollmentNumber = '',
}) => {
  const isNoSelected = higherStudiesPlan === 'No, I do not plan to pursue higher studies';
  const isYesSelected = higherStudiesPlan && !isNoSelected;
  const isOtherUniversity = higherStudiesPlan === 'Yes – Other University in India';
  const isForeignUniversity = higherStudiesPlan === 'Yes – Foreign University';
  const requiresUniversityName = isOtherUniversity || isForeignUniversity;

  const planError = errors['higher-studies-section'];
  const universityError = errors['higher-studies-university-name-input'];
  const proofError = errors['higher-studies-proof-container'];

  return (
    <div className={`bg-white rounded-xl border shadow-xs p-4 sm:p-6 space-y-5 sm:space-y-6 transition-all ${planError ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-slate-200'}`} id="higher-studies-section">
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
          2
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Higher Studies Progression Plan
          </h2>
          <p className="text-xs text-slate-500">
            After 3 years, do you plan to pursue higher studies? If yes, where would you prefer to study?
          </p>
        </div>
      </div>

      {/* Radio Options */}
      <div className={`space-y-2.5 p-2 rounded-xl transition-all ${planError ? 'bg-rose-50/40 border border-rose-300' : ''}`} id="higher-studies-options-container">
        <label className="block text-sm font-semibold text-slate-800">
          After 3 years, do you plan to pursue higher studies? If yes, where would you prefer to study? <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-2.5">
          {HIGHER_STUDIES_OPTIONS.map((option, idx) => {
            const isSelected = higherStudiesPlan === option;
            const isNo = option.startsWith('No');
            return (
              <label
                key={option}
                htmlFor={`higher-studies-${idx}`}
                className={`relative flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? isNo
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 text-slate-900 shadow-xs font-semibold'
                      : 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 text-indigo-950 shadow-xs font-semibold'
                    : planError
                    ? 'border-rose-300 bg-white hover:bg-rose-50/30 text-slate-700 font-medium'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? isNo
                          ? 'border-amber-600 bg-amber-600'
                          : 'border-indigo-600 bg-indigo-600'
                        : planError
                        ? 'border-rose-400 bg-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm">{option}</span>
                </div>

                <input
                  type="radio"
                  id={`higher-studies-${idx}`}
                  name="higherStudiesPlan"
                  value={option}
                  checked={isSelected}
                  onChange={() => setHigherStudiesPlan(option)}
                  className="hidden"
                />
              </label>
            );
          })}
        </div>
        {planError && (
          <p className="text-xs text-rose-600 font-medium flex items-center gap-1 pt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {planError}
          </p>
        )}
      </div>

      {/* Conditional: University Name Input for Other University or Foreign University */}
      {requiresUniversityName && (
        <div
          id="higher-studies-custom-university-field"
          className={`p-4 rounded-xl space-y-2 animate-in fade-in duration-200 transition-all ${
            universityError ? 'bg-rose-50/70 border-2 border-rose-400' : 'bg-slate-50/90 border border-slate-200'
          }`}
        >
          <label htmlFor="higher-studies-university-name-input" className="block text-xs font-semibold text-slate-800">
            {isOtherUniversity ? (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                Name of University / College in India <span className="text-rose-500">*</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                Name of Foreign University &amp; Country <span className="text-rose-500">*</span>
              </span>
            )}
          </label>
          <input
            type="text"
            id="higher-studies-university-name-input"
            value={higherStudiesUniversityName}
            onChange={(e) => setHigherStudiesUniversityName(e.target.value)}
            placeholder={
              isOtherUniversity
                ? 'e.g. Gujarat University, IIT Bombay, Delhi University'
                : 'e.g. Harvard University (USA), University of Toronto (Canada), Oxford (UK)'
            }
            className={`w-full text-sm px-3.5 py-2.5 rounded-lg focus:outline-hidden transition ${
              universityError
                ? 'bg-white border-2 border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'bg-white border border-slate-300 focus:ring-2 focus:ring-indigo-500'
            }`}
          />
          {universityError ? (
            <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {universityError}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500">
              {isOtherUniversity
                ? 'Enter the full name of the university or institute where you plan to pursue higher education.'
                : 'Enter the name of the overseas university and the destination country.'}
            </p>
          )}
        </div>
      )}

      {/* Conditional: If YES is selected -> Ask for Admit Card / Letter / Confirmation */}
      {isYesSelected && (
        <div
          id="higher-studies-proof-container"
          className={`p-5 rounded-xl space-y-4 animate-in fade-in duration-300 transition-all ${
            proofError
              ? 'bg-rose-50/60 border-2 border-rose-400'
              : 'bg-indigo-50/40 border border-indigo-100'
          }`}
        >
          <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
            <FileCheck className="w-4 h-4 text-indigo-600" />
            <span>Supporting Admission Verification Document</span>
          </div>
          <p className="text-xs text-slate-600">
            Please upload your official <strong>Admit Card</strong>, <strong>Admission Letter</strong>, or <strong>Admission Confirmation</strong> from the institution (clearly indicating student's name, program, and admission details).
          </p>

          <FileUploadField
            id="higher-studies-proof-upload"
            label="Admit Card / Admission Letter / Confirmation Document"
            documentName="Higher_Studies_Proof"
            enrollmentNumber={enrollmentNumber}
            description="Upload 1 supported file. Max 2 MB (PDF only)."
            required={true}
            value={higherStudiesProof}
            onChange={setHigherStudiesProof}
            maxSizeMB={2}
          />
          {proofError && (
            <p className="text-xs text-rose-600 font-medium flex items-center gap-1 pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {proofError}
            </p>
          )}
        </div>
      )}

      {/* Conditional: If NO is selected Notice */}
      {isNoSelected && (
        <div
          id="higher-studies-no-notice"
          className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start space-x-3 text-xs text-amber-900 animate-in fade-in duration-300"
        >
          <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">Direct Submission Available</p>
            <p className="text-amber-800">
              You have selected that you do not plan to pursue higher studies. You can proceed directly to submit your basic student outcome data using the submit button, or add achievement records and exit progression details if applicable.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
