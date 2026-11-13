import { Map, Shield } from 'lucide-react';
import { ROLE_ALLOWED_PAGES, usePlatform } from '../../context/PlatformContext';
import { PAGE_TITLES } from '../../i18n';
import { PageId, UserRole } from '../../types';
import { Modal } from '../ui/Modal';

const SITEMAP_GROUPS: Array<{ title: string; pages: Array<{ id: PageId; level: string }> }> = [
  {
    title: 'Core & Identity',
    pages: [
      { id: 'dashboard', level: 'Level 1 · Role Overview' },
      { id: 'users', level: 'Level 2 · RBAC Accounts' },
      { id: 'students', level: 'Level 3 · Enrollment & Biometrics' },
    ],
  },
  {
    title: 'Access, Safety & Hardware',
    pages: [
      { id: 'attendance', level: 'Level 4 · RFID + Face Access' },
      { id: 'safety', level: 'Level 5 · Fire, Panic & Door Control' },
      { id: 'devices', level: 'Level 6 · ESP32-S3-CAM Health' },
      { id: 'remote-config', level: 'Level 7 · Threshold & Room Config' },
      { id: 'ota-updates', level: 'Level 8 · Firmware Verification & Rollback' },
    ],
  },
  {
    title: 'Vision, AI & Sensing',
    pages: [
      { id: 'camera', level: 'Level 9 · Door/Room Cams & Seat Zones' },
      { id: 'hand-raise', level: 'Level 10 · 4s AI Hand-Raise Classifier' },
      { id: 'wifi-csi', level: 'Level 11 · 3×3 Wi-Fi CSI Localization' },
      { id: 'weather-analytics', level: 'Level 12 · Weather API & Analytics' },
    ],
  },
  {
    title: 'Operations, Sync & Governance',
    pages: [
      { id: 'history-reports', level: '18-Category Search & CSV/Print' },
      { id: 'ai-assistant', level: 'Strict Database-Grounded Assistant' },
      { id: 'offline-sync', level: 'SoftAP SmartRoom & Oldest-First Sync' },
      { id: 'notifications', level: '13-Category Alert Center' },
      { id: 'settings', level: 'EN/BN, Theme, Permissions & Audit' },
    ],
  },
];

const ROLES: UserRole[] = ['Admin', 'Teacher', 'Student', 'Guardian'];

export function SitemapModal() {
  const { sitemapOpen, setSitemapOpen, currentUser, setActivePage, language } = usePlatform();

  return (
    <Modal
      open={sitemapOpen}
      onClose={() => setSitemapOpen(false)}
      title="FastRobox 1.0 Complete Website Sitemap"
      subtitle="All 17 application modules mapped across the 12 project levels and 4 RBAC roles"
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Entry Point: <strong>Page 1 — Login & Lockout Authentication</strong> (3 failed attempts → 60s lockout)</span>
          </div>
          {currentUser && (
            <span className="font-semibold text-slate-900 dark:text-white">
              Signed in as {currentUser.role}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SITEMAP_GROUPS.map((group) => (
            <div
              key={group.title}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-3">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.pages.map((pg) => {
                  const canAccess = currentUser ? ROLE_ALLOWED_PAGES[currentUser.role].includes(pg.id) : false;
                  return (
                    <li key={pg.id} className="flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        {currentUser && canAccess ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActivePage(pg.id);
                              setSitemapOpen(false);
                            }}
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-left"
                          >
                            {PAGE_TITLES[pg.id][language]}
                          </button>
                        ) : (
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {PAGE_TITLES[pg.id][language]}
                          </span>
                        )}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{pg.level}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {ROLES.map((r) => {
                          const ok = ROLE_ALLOWED_PAGES[r].includes(pg.id);
                          return (
                            <span
                              key={r}
                              title={`${r}: ${ok ? 'Allowed' : 'Restricted'}`}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                ok
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                              }`}
                            >
                              {r[0]}
                            </span>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Shield className="w-4 h-4 shrink-0" />
          <span>Role Legend: A = Admin, T = Teacher, S = Student, G = Guardian. Restricted routes are hidden and blocked at runtime.</span>
        </div>
      </div>
    </Modal>
  );
}
