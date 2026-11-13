import { useState } from 'react';
import {
  Activity,
  Bell,
  Bot,
  Camera,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Cpu,
  FileBarChart2,
  Flame,
  GraduationCap,
  Hand,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Radio,
  RefreshCw,
  Settings,
  ShieldAlert,
  Sliders,
  UploadCloud,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { ROLE_ALLOWED_PAGES, usePlatform } from '../../context/PlatformContext.jsx';
import { tPage, UI_COPY } from '../../i18n';
import { Logo } from '../ui/Logo.jsx';
import { Modal } from '../ui/Modal.jsx';
import { StatusBadge } from '../ui/StatusBadge.jsx';
import { SitemapModal } from './SitemapModal.jsx';

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'users', icon: Users },
  { id: 'students', icon: GraduationCap },
  { id: 'attendance', icon: UserCheck },
  { id: 'safety', icon: ShieldAlert },
  { id: 'devices', icon: Cpu },
  { id: 'remote-config', icon: Sliders },
  { id: 'ota-updates', icon: UploadCloud },
  { id: 'camera', icon: Camera },
  { id: 'hand-raise', icon: Hand },
  { id: 'wifi-csi', icon: Wifi },
  { id: 'weather-analytics', icon: CloudSun },
  { id: 'history-reports', icon: FileBarChart2 },
  { id: 'ai-assistant', icon: Bot },
  { id: 'offline-sync', icon: RefreshCw },
  { id: 'notifications', icon: Bell },
  { id: 'settings', icon: Settings },
];

export function AppShell({ children }) {
  const {
    currentUser,
    activePage,
    setActivePage,
    language,
    setLanguage,
    selectedClassroom,
    setSelectedClassroom,
    connectionMode,
    telemetry,
    notifications,
    logout,
    resetFireEmergency,
    resetPanicAlert,
    triggerFireEmergency,
    triggerPanicAlert,
    toggleOfflineSimulation,
    simulateFiveFaceMismatches,
    setSitemapOpen,
  } = usePlatform();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [resetFireModalOpen, setResetFireModalOpen] = useState(false);

  if (!currentUser) return null;

  const allowedPages = ROLE_ALLOWED_PAGES[currentUser.role];
  const visibleNav = NAV_ITEMS.filter((item) => allowedPages.includes(item.id));
  const unreadCount = notifications.filter((n) => !n.read).length;
  const copy = UI_COPY[language];
  const canClearEmergency = currentUser.role === 'Admin' || currentUser.role === 'Teacher';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-[#0B1324] text-slate-200 border-r border-slate-800/80 transition-all duration-200 ${
          collapsed ? 'w-[74px]' : 'w-[256px]'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
          <Logo compact={collapsed} light />
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;
            const badgeCount = item.id === 'notifications' && unreadCount > 0 ? unreadCount : 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                title={tPage(item.id, language)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate flex-1 text-left">{tPage(item.id, language)}</span>}
                {!collapsed && badgeCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[11px] font-mono font-semibold rounded bg-red-600 text-white">
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <button
            type="button"
            onClick={() => setSitemapOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
          >
            <Map className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{copy.sitemap}</span>}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-[#0B1324] text-slate-200 flex flex-col h-full z-10">
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
              <Logo light />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 rounded-lg text-slate-300 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActivePage(item.id);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{tPage(item.id, language)}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden">
              <Logo compact />
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm min-w-0">
              <span className="font-display font-semibold text-slate-900 dark:text-white truncate">
                {tPage(activePage, language)}
              </span>
              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">/</span>
              <select
                aria-label="Select Classroom"
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-slate-700 dark:text-slate-200"
              >
                <option value="CSE-401">Room CSE-401 (Main Lab)</option>
                <option value="CSE-402">Room CSE-402 (Vision Lab)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <StatusBadge
                status={connectionMode === 'LIVE' ? 'ONLINE' : connectionMode}
                label={connectionMode === 'LIVE' ? 'ESP32 ONLINE' : connectionMode}
              />
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  language === 'en' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  language === 'bn' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                বাং
              </button>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Open notifications"
                className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-semibold">Recent Alerts ({unreadCount} unread)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        setActivePage('notifications');
                      }}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.slice(0, 5).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          setActivePage('notifications');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-slate-900 dark:text-white truncate">{n.title}</span>
                          <span className="font-mono text-[11px] text-slate-400 shrink-0">{n.timestamp.slice(11, 16)}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="hidden xl:block text-left leading-tight">
                <p className="text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{currentUser.role}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                title={copy.logout}
                aria-label={copy.logout}
                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {telemetry.flameDetected && (
          <div
            role="alert"
            className="bg-red-600 text-white px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-red-700"
          >
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-display text-sm font-bold">{copy.fireBannerTitle}</p>
                <p className="text-xs text-red-100">
                  Room {telemetry.roomId} · Flame Sensor: ACTIVE · Buzzer: ON · Door: UNLOCKED (Override)
                </p>
              </div>
            </div>
            {canClearEmergency && (
              <button
                type="button"
                onClick={() => setResetFireModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-white text-red-700 text-xs font-bold hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                {copy.resetFire}
              </button>
            )}
          </div>
        )}

        {telemetry.panicActive && (
          <div
            role="alert"
            className="bg-gradient-to-r from-red-700 via-red-600 to-blue-700 text-white px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-red-800"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-display text-sm font-bold">{copy.panicBannerTitle}</p>
                <p className="text-xs text-red-100">
                  Room {telemetry.roomId} · Red/Blue Beacon: ACTIVE · Buzzer: ON · Teachers & Admin Alerted
                </p>
              </div>
            </div>
            {canClearEmergency && (
              <button
                type="button"
                onClick={resetPanicAlert}
                className="px-3.5 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                {copy.acknowledge} Panic
              </button>
            )}
          </div>
        )}

        <div className="bg-slate-100 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs no-print">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{copy.demoNotice}</span>
          </div>
          {(currentUser.role === 'Admin' || currentUser.role === 'Teacher') && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={telemetry.flameDetected ? () => setResetFireModalOpen(true) : triggerFireEmergency}
                className="px-2.5 py-1 rounded border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 text-red-700 dark:text-red-400 font-medium hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                {telemetry.flameDetected ? 'Reset Fire' : 'Simulate Fire'}
              </button>
              <button
                type="button"
                onClick={telemetry.panicActive ? resetPanicAlert : triggerPanicAlert}
                className="px-2.5 py-1 rounded border border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 font-medium hover:bg-amber-50 transition-colors whitespace-nowrap"
              >
                {telemetry.panicActive ? 'Clear Panic' : 'Simulate Panic'}
              </button>
              {currentUser.role === 'Admin' && (
                <>
                  <button
                    type="button"
                    onClick={toggleOfflineSimulation}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 transition-colors whitespace-nowrap inline-flex items-center gap-1"
                  >
                    {connectionMode === 'OFFLINE' ? <Radio className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    <span>{connectionMode === 'OFFLINE' ? 'Sync & Reconnect' : 'Simulate Offline'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => simulateFiveFaceMismatches('D7:30:F1:88')}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    Simulate 5 Mismatches
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <main className="flex-1 p-4 lg:p-6 max-w-[1440px] w-full mx-auto">{children}</main>
      </div>

      <Modal
        open={resetFireModalOpen}
        onClose={() => setResetFireModalOpen(false)}
        title="Confirm Fire Emergency Reset"
        subtitle="Verify the classroom is physically clear before restoring normal door lock rules."
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Resetting the fire state will silence the ESP32-S3-CAM emergency buzzer, clear the IR flame alert banner across all dashboards, and return the classroom door to <strong>LOCKED</strong>.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setResetFireModalOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                resetFireEmergency();
                setResetFireModalOpen(false);
              }}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Confirm Reset Fire
            </button>
          </div>
        </div>
      </Modal>

      <SitemapModal />
    </div>
  );
}
