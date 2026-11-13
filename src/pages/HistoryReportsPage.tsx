import { useState } from 'react';
import { Download, Printer, Search } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { HistoryLogRecord } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';

const CATEGORIES: Array<'ALL' | HistoryLogRecord['category']> = [
  'ALL',
  'Attendance History',
  'RFID Scan History',
  'Face Verification History',
  'Fire Events',
  'Panic Events',
  'Temperature History',
  'Humidity History',
  'Door Access History',
  'Entry Granted / Denied',
  'Camera Events',
  'Intruder Events',
  'Hand-Raise Events',
  'Device Errors',
  'Device Restart History',
  'OTA Update History',
  'Security Events',
  'Configuration Changes',
  'Offline / Sync History',
];

export function HistoryReportsPage() {
  const { historyLogs, pushToast } = usePlatform();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'ALL' | HistoryLogRecord['category']>('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('2026-11-01');
  const [dateTo, setDateTo] = useState('2026-11-12');
  const [reportType, setReportType] = useState('Daily Report');

  const filtered = historyLogs.filter((h) => {
    const q = search.toLowerCase();
    const matchText =
      h.actor.toLowerCase().includes(q) ||
      h.summary.toLowerCase().includes(q) ||
      h.category.toLowerCase().includes(q) ||
      h.deviceId.toLowerCase().includes(q);
    const matchCat = category === 'ALL' || h.category === category;
    const matchRoom = roomFilter === 'ALL' || h.roomId === roomFilter;
    const matchStatus = statusFilter === 'ALL' || h.status === statusFilter;
    const day = h.timestamp.slice(0, 10);
    const matchDate = (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
    return matchText && matchCat && matchRoom && matchStatus && matchDate;
  });

  const exportCsv = () => {
    const headers = ['Timestamp', 'Category', 'Room', 'Device', 'Actor', 'Status', 'Summary'];
    const rows = filtered.map((r) => [
      r.timestamp,
      r.category,
      r.roomId,
      r.deviceId,
      r.actor,
      r.status,
      `"${r.summary.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fastrobox_${reportType.toLowerCase().replace(/\s+/g, '_')}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({ type: 'success', title: 'CSV Exported', description: `Downloaded ${filtered.length} records for ${reportType}.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">History & Reports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Searchable audit across all 18 telemetry, security, access & device categories with CSV export and print
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Select Report Template"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option>Daily Report</option>
            <option>Weekly Report</option>
            <option>Monthly Report</option>
            <option>Attendance Report</option>
            <option>Safety Report</option>
            <option>Device Health Report</option>
          </select>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 no-print">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, teacher, device, or summary..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
          />
        </div>
        <select
          aria-label="Filter Event Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as 'ALL' | HistoryLogRecord['category'])}
          className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'ALL' ? 'All 18 Categories' : c}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter Room"
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <option value="ALL">All Rooms</option>
          <option value="CSE-401">CSE-401</option>
          <option value="CSE-402">CSE-402</option>
        </select>
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            aria-label="Date From"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-2 py-2 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          <input
            type="date"
            aria-label="Date To"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-2 py-2 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>{reportType} · Showing {filtered.length} matching log records</span>
          {statusFilter !== 'ALL' && (
            <button type="button" onClick={() => setStatusFilter('ALL')} className="text-blue-600 font-semibold">
              Clear Status Filter
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Timestamp</th>
                <th className="text-left px-4 py-3 font-semibold">Category</th>
                <th className="text-left px-4 py-3 font-semibold">Room / Device</th>
                <th className="text-left px-4 py-3 font-semibold">Actor</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono text-xs tabular-nums whitespace-nowrap">{row.timestamp}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{row.category}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.roomId} · {row.deviceId}</td>
                  <td className="px-4 py-3 text-xs">{row.actor}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setStatusFilter(row.status)}>
                      <StatusBadge status={row.status} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{row.summary}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No records matched the selected date range and category filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
