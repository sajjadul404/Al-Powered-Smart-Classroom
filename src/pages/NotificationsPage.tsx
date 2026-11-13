import { useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { NotificationCategory } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';

const ALL_CATEGORIES: Array<'ALL' | NotificationCategory> = [
  'ALL',
  'Fire Alert',
  'Panic Alert',
  'Temperature Warning',
  'Temperature Danger',
  'Student Absent',
  'Student Late',
  'Face Mismatch',
  'Intruder Detected',
  'Hand Raised',
  'Device Offline',
  'Camera Fault',
  'OTA Update',
  'Sync Completed',
];

export function NotificationsPage() {
  const { notifications, setNotifications, acknowledgeNotification } = usePlatform();
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | NotificationCategory>('ALL');
  const [readFilter, setReadFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const filtered = notifications.filter((n) => {
    const matchCat = categoryFilter === 'ALL' || n.category === categoryFilter;
    const matchRead = readFilter === 'ALL' || (readFilter === 'UNREAD' ? !n.read : n.read);
    const matchPri = priorityFilter === 'ALL' || n.priority === priorityFilter;
    return matchCat && matchRead && matchPri;
  });

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Notifications & Alerts Center</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Unified 13-category alert stream with read state, priority filtering, and staff acknowledgement
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
        >
          <CheckCheck className="w-4 h-4 text-blue-600" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <select
          aria-label="Filter Notification Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | NotificationCategory)}
          className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          {ALL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'ALL' ? 'All 13 Categories' : c}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter Priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
          className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {(['ALL', 'UNREAD', 'READ'] as const).map((rf) => (
            <button
              key={rf}
              type="button"
              onClick={() => setReadFilter(rf)}
              className={`px-3 py-1 text-xs font-semibold rounded-md ${
                readFilter === rf ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              {rf}
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              n.read
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-display text-sm font-bold">{n.title}</span>
                <StatusBadge
                  status={n.priority === 'CRITICAL' ? 'DANGER' : n.priority === 'HIGH' ? 'WARNING' : n.priority === 'MEDIUM' ? 'LATE' : 'SAFE'}
                  label={`${n.priority} · ${n.category}`}
                />
                <span className="font-mono text-xs text-slate-400 tabular-nums">{n.timestamp}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{n.message}</p>
              {n.acknowledged && (
                <p className="text-[11px] text-emerald-600 font-semibold">
                  Acknowledged by {n.acknowledgedBy}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!n.read && (
                <button
                  type="button"
                  onClick={() => setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Mark Read
                </button>
              )}
              {!n.acknowledged && (
                <button
                  type="button"
                  onClick={() => acknowledgeNotification(n.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Acknowledge</span>
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-sm text-slate-500">
            No notifications match the active filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
