import React from 'react';
import { User, Hash, Calendar, Layers } from 'lucide-react';
import { AcademicYear, Semester } from '../types';

interface BasicInfoSectionProps {
  enrollmentNumber: string;
  setEnrollmentNumber: (val: string) => void;
  fullName: string;
  setFullName: (val: string) => void;
  academicYear: AcademicYear | '';
  setAcademicYear: (val: AcademicYear) => void;
  semester: Semester | '';
  setSemester: (val: Semester) => void;
}

const ACADEMIC_YEARS: AcademicYear[] = ['2023-24', '2024-25', '2025-26', '2026-27'];
const SEMESTERS: Semester[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  enrollmentNumber,
  setEnrollmentNumber,
  fullName,
  setFullName,
  academicYear,
  setAcademicYear,
  semester,
  setSemester,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6" id="basic-info-section">
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
          1
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Basic Student Information</h2>
          <p className="text-xs text-slate-500">Provide official identity and current academic enrollment details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Enrollment Number */}
        <div className="space-y-1.5">
          <label htmlFor="enrollment-number-input" className="block text-sm font-semibold text-slate-800">
            Enrollment Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Hash className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="enrollment-number-input"
              value={enrollmentNumber}
              onChange={(e) => setEnrollmentNumber(e.target.value)}
              placeholder="e.g. 21012011001"
              required
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
            />
          </div>
          <p className="text-xs text-slate-400">Unique university student ID or registration number.</p>
        </div>

        {/* Full Name as per certificate */}
        <div className="space-y-1.5">
          <label htmlFor="fullname-input" className="block text-sm font-semibold text-slate-800">
            Full Name as per Certificate <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="fullname-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Patel Krupa Rameshchandra"
              required
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all capitalize"
            />
          </div>
          <p className="text-xs text-slate-400">Must exactly match your university certificates &amp; records.</p>
        </div>
      </div>

      {/* Academic Year - Radio Buttons */}
      <div className="space-y-2 pt-1" id="academic-year-container">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Participated in the Academic Year <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACADEMIC_YEARS.map((year) => {
            const isSelected = academicYear === year;
            return (
              <label
                key={year}
                htmlFor={`academic-year-${year}`}
                className={`relative flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 text-indigo-900 font-semibold shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <span className="text-sm">{year}</span>
                <input
                  type="radio"
                  id={`academic-year-${year}`}
                  name="academicYear"
                  value={year}
                  checked={isSelected}
                  onChange={() => setAcademicYear(year)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Semester - Radio Buttons */}
      <div className="space-y-2 pt-1" id="semester-container">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Layers className="w-4 h-4 text-indigo-600" />
          Semester based on the academic year <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {SEMESTERS.map((sem) => {
            const isSelected = semester === sem;
            return (
              <label
                key={sem}
                htmlFor={`semester-${sem}`}
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-lg border cursor-pointer transition-all text-center ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 text-indigo-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <span className="text-sm">Sem {sem}</span>
                <input
                  type="radio"
                  id={`semester-${sem}`}
                  name="semester"
                  value={sem}
                  checked={isSelected}
                  onChange={() => setSemester(sem)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
