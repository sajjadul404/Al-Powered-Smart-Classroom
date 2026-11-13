import { useState } from 'react';
import { Globe, Map, Moon, Shield, Sun } from 'lucide-react';
import { ROLE_ALLOWED_PAGES, usePlatform } from '../context/PlatformContext.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export function SettingsPage() {
  const {
    currentUser,
    language,
    setLanguage,
    theme,
    setTheme,
    selectedClassroom,
    setSelectedClassroom,
    institutionName,
    setInstitutionName,
    auditLogs,
    devices,
    setSitemapOpen,
    pushToast,
    addAuditLog,
  } = usePlatform();

  const [tab, setTab] = useState('General');
  const [profileName, setProfileName] = useState(currentUser?.name ?? '');
  const [lockoutLimit, setLockoutLimit] = useState(3);
  const [mismatchLimit, setMismatchLimit] = useState(5);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'Admin';
  const roles = ['Admin', 'Teacher', 'Student', 'Guardian'];

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    addAuditLog('UPDATE_SETTINGS', selectedClassroom, `Updated profile/institution settings (${institutionName})`);
    pushToast({ type: 'success', title: 'Settings Saved', description: 'System preferences updated successfully.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Settings & System Configuration</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Profile, institution details, English/Bangla language, Light/Dark theme, RBAC permissions, and audit logs
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSitemapOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
        >
          <Map className="w-4 h-4 text-blue-600" />
          <span>Open Website Sitemap</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {['General', 'Permissions', 'System & Audit Logs'].map((t) => {
          if (t !== 'General' && !isAdmin) return null;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                tab === t ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {tab === 'General' && (
        <form onSubmit={handleSaveGeneral} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-base font-semibold">Profile & Institution Information</h2>
            <div>
              <label className="block text-xs font-semibold mb-1">Display Name ({currentUser.role})</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">School / Institution Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Active Classroom / Room ID</label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="CSE-401">CSE-401 (Main Smart Classroom)</option>
                <option value="CSE-402">CSE-402 (Vision Lab)</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
            <h2 className="font-display text-base font-semibold">Language, Theme & Security</h2>

            <div>
              <label className="block text-xs font-semibold mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Interface Language</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold ${
                    language === 'en' ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  English (EN)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold ${
                    language === 'bn' ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  বাংলা (Bangla)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2">Theme Appearance</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
                    theme === 'light' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Light Mode
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
                    theme === 'dark' ? 'border-blue-600 bg-blue-950/40 text-blue-300' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Dark Mode
                </button>
              </div>
            </div>

            {isAdmin && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold mb-1">Login Lockout Attempts</label>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    value={lockoutLimit}
                    onChange={(e) => setLockoutLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Face Mismatch Card Lock</label>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    value={mismatchLimit}
                    onChange={(e) => setMismatchLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                Save Preferences
              </button>
            </div>
          </div>
        </form>
      )}

      {tab === 'Permissions' && isAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-base font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Role-Based Access Control (RBAC) Matrix</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((r) => (
              <div key={r} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-sm">{r}</span>
                  <span className="font-mono text-xs text-slate-500">{ROLE_ALLOWED_PAGES[r].length} modules</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {ROLE_ALLOWED_PAGES[r].map((pg) => (
                    <li key={pg} className="font-mono text-[11px]">· {pg}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'System & Audit Logs' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="font-display text-base font-semibold">Immutable Security & Deletion Audit Logs</h2>
            <div className="space-y-2.5">
              {auditLogs.map((a) => (
                <div key={a.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold">{a.action}</span>
                    <span className="font-mono text-slate-400">{a.timestamp}</span>
                  </div>
                  <p className="font-semibold">{a.actor} ({a.role}) → {a.target}</p>
                  <p className="text-slate-600 dark:text-slate-300">{a.details}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="font-display text-base font-semibold">ESP32-S3-CAM System Logs</h2>
            <div className="space-y-2">
              {devices.flatMap((d) =>
                d.logs.map((l) => (
                  <div key={l.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-slate-400 mr-2">{l.time}</span>
                      <span className="font-mono">{l.message}</span>
                    </div>
                    <StatusBadge status={l.level === 'WARN' ? 'WARNING' : 'OK'} label={l.level} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
