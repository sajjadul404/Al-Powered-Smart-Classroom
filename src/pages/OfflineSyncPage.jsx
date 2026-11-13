import { Bluetooth, CheckCircle2, HardDrive, RefreshCw, Router, Wifi, WifiOff } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export function OfflineSyncPage() {
  const {
    connectionMode,
    offlineDurationSec,
    teamId,
    syncQueue,
    setSyncQueue,
    students,
    devices,
    toggleOfflineSimulation,
    runSyncProcess,
    pushToast,
  } = usePlatform();

  const pendingRecords = syncQueue.filter((q) => q.status === 'PENDING');
  const failedRecords = syncQueue.filter((q) => q.status === 'FAILED');
  const incompleteRecords = syncQueue.filter((q) => q.status === 'INCOMPLETE_QUARANTINED');
  const syncedRecords = syncQueue.filter((q) => q.status === 'SYNCED');

  const apActive = connectionMode === 'OFFLINE' && offlineDurationSec >= 120;
  const syncProgressPct =
    connectionMode === 'SYNCING'
      ? 68
      : syncQueue.length === 0
      ? 100
      : Math.round((syncedRecords.length / syncQueue.length) * 100);

  const addSampleFailedRecord = () => {
    setSyncQueue((prev) => [
      ...prev,
      {
        id: `sq-fail-${Date.now()}`,
        originalTimestamp: '2026-11-12 08:28:12',
        recordType: 'SECURITY',
        payloadSummary: 'Encrypted snapshot chunk #2 upload timeout',
        status: 'FAILED',
        errorReason: 'Socket timeout during uplink burst',
      },
      {
        id: `sq-inc-${Date.now()}`,
        originalTimestamp: '2026-11-12 08:29:00',
        recordType: 'TELEMETRY',
        payloadSummary: 'Truncated DHT11 frame (CRC mismatch quarantined)',
        status: 'INCOMPLETE_QUARANTINED',
        errorReason: 'Safely quarantined incomplete record to protect cloud DB',
      },
    ]);
    pushToast({ type: 'warning', title: 'Test Records Queued', description: 'Added 1 failed record and 1 incomplete quarantined record.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Offline Mode & Synchronization</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Offline SoftAP (<span className="font-mono">SmartRoom-{teamId}</span> · <span className="font-mono">192.168.10.1</span> after 120s), BLE (<span className="font-mono">FR-{teamId}</span>), and oldest-first sync
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleOfflineSimulation}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {connectionMode === 'OFFLINE' ? 'Restore Wi-Fi & Sync' : 'Simulate Wi-Fi Outage (>120s)'}
          </button>
          <button
            type="button"
            onClick={addSampleFailedRecord}
            className="px-3.5 py-2 rounded-lg border border-amber-300 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-50"
          >
            Simulate Failed / Incomplete Record
          </button>
          <button
            type="button"
            onClick={runSyncProcess}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${connectionMode === 'SYNCING' ? 'animate-spin' : ''}`} />
            <span>Retry Sync</span>
          </button>
        </div>
      </div>

      {/* Warning / Success State Banner */}
      {connectionMode === 'OFFLINE' ? (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Device Operating in Offline Mode ({offlineDurationSec}s elapsed)</p>
              <p>
                Local SoftAP <strong>SmartRoom-{teamId}</strong> active at <strong>192.168.10.1</strong> (started after 120s without Wi-Fi). Attendance & telemetry buffered safely on flash.
              </p>
            </div>
          </div>
          <StatusBadge status="OFFLINE" />
        </div>
      ) : connectionMode === 'SYNCING' ? (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
            <span>Synchronizing buffered records oldest-first while preserving original ESP32 timestamps...</span>
          </div>
          <StatusBadge status="SYNCING" />
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Internet & Cloud MQTT live. All buffered classroom records are synchronized without duplicates.</span>
          </div>
          <StatusBadge status="LIVE" />
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
          <p className="text-xs text-slate-500 flex items-center gap-1"><Wifi className="w-3.5 h-3.5" /> Internet & ESP32</p>
          <div className="flex items-center gap-2 pt-1">
            <StatusBadge status={connectionMode} />
            <span className="text-xs font-mono">{devices[0]?.status}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Offline Duration</p>
          <p className="font-mono text-2xl font-bold tabular-nums mt-1">{offlineDurationSec}s</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Pending / Failed</p>
          <p className="font-mono text-2xl font-bold tabular-nums mt-1">
            {pendingRecords.length} / <span className="text-red-600">{failedRecords.length}</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Sync Progress</p>
          <p className="font-mono text-2xl font-bold tabular-nums mt-1">{syncProgressPct}%</p>
        </div>
      </div>

      {/* Offline Infrastructure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-semibold flex items-center gap-2">
              <Router className="w-4 h-4 text-blue-600" />
              Local Access Point
            </span>
            <StatusBadge status={apActive ? 'ACTIVE' : 'STANDBY'} />
          </div>
          <p>SSID: <strong className="font-mono">SmartRoom-{teamId}</strong></p>
          <p>Gateway IP: <strong className="font-mono">192.168.10.1</strong></p>
          <p className="text-slate-500">Starts automatically after 120 seconds without campus Wi-Fi.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-semibold flex items-center gap-2">
              <Bluetooth className="w-4 h-4 text-blue-600" />
              BLE Beacon Status
            </span>
            <StatusBadge status="ACTIVE" label="Advertising" />
          </div>
          <p>BLE Device Name: <strong className="font-mono">FR-{teamId}</strong></p>
          <p>Cached Class Roster: <strong className="font-mono">{students.length} students</strong></p>
          <p className="text-slate-500">Enables local RFID + cached face hash attendance when offline.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-semibold flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-600" />
              Buffer & Power Recovery
            </span>
            <StatusBadge status="SAFE" label="NVM Protected" />
          </div>
          <p>Offline Telemetry Buffer: <strong className="font-mono">{syncQueue.length} records</strong></p>
          <p>Quarantined Incomplete: <strong className="font-mono">{incompleteRecords.length}</strong></p>
          <p className="text-slate-500">Brownout-safe SPIFFS journal preserves original RTC timestamps.</p>
        </div>
      </div>

      {/* Synchronization Queue Table (Oldest First) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Synchronization Queue (Oldest-First Order)</h2>
          <span className="text-xs text-slate-500">Duplicate prevention enabled via composite (deviceId, timestamp) key</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Original Timestamp</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Buffered Payload</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...syncQueue]
                .sort((a, b) => a.originalTimestamp.localeCompare(b.originalTimestamp))
                .map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums">{item.originalTimestamp}</td>
                    <td className="px-4 py-3 text-xs font-semibold">{item.recordType}</td>
                    <td className="px-4 py-3 text-xs">{item.payloadSummary}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{item.errorReason ?? 'Timestamp & integrity verified'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
