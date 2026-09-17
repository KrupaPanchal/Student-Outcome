import React, { useState } from 'react';
import { Settings, X, KeyRound, User, Eye, EyeOff, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  onCredentialsChanged: (newUsername: string) => void;
}

const CREDS_KEY = 'portal_admin_credentials';

export const DEFAULT_CREDENTIALS = {
  username: 'Krupa',
  password: 'Krupa@123',
};

export function getAdminCredentials(): { username: string; password: string } {
  try {
    const stored = localStorage.getItem(CREDS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_CREDENTIALS;
}

export function saveAdminCredentials(username: string, password: string) {
  localStorage.setItem(CREDS_KEY, JSON.stringify({ username, password }));
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
  onCredentialsChanged,
}) => {
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const creds = getAdminCredentials();

    // Verify current password
    if (currentPassword.trim() !== creds.password) {
      setError('Current password is incorrect.');
      return;
    }

    // Validate new username
    if (newUsername.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    // Validate new password only if provided
    if (newPassword) {
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match.');
        return;
      }
    }

    const finalPassword = newPassword.trim() || creds.password;
    saveAdminCredentials(newUsername.trim(), finalPassword);
    onCredentialsChanged(newUsername.trim());

    setSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1800);
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Admin Settings</h2>
              <p className="text-[11px] sm:text-xs text-indigo-200">Change login credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">

          {/* Logged in as */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Logged in as <strong>{currentUsername}</strong></span>
          </div>

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Credentials updated successfully!</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* New Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1" />
              New Username
            </label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition"
            />
          </div>

          <hr className="border-slate-100" />
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Change Password</p>

          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              <KeyRound className="w-3.5 h-3.5 inline mr-1" />
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none pr-10 transition"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              New Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none pr-10 transition"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          {newPassword && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`w-full text-sm px-3.5 py-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none pr-10 transition ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-300'
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-rose-500 mt-1">Passwords do not match</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
