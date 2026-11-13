import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, History, RotateCcw, ShieldCheck, Sliders, UploadCloud } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';

export function RemoteConfigOTAPage({ initialSection }: { initialSection: 'config' | 'ota' }) {
  const {
    config,
    updateConfig,
    configHistory,
    currentUser,
    devices,
    setDevices,
    otaHistory,
    setOtaHistory,
    addNotification,
    addHistoryLog,
    pushToast,
  } = usePlatform();

  const [section, setSection] = useState<'config' | 'ota'>(initialSection);
  const [draft, setDraft] = useState(config);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);

  // OTA states
  const [newVersion, setNewVersion] = useState('v2.5.0');
  const [firmwareFile, setFirmwareFile] = useState('fastrobox_esp32s3_v2.5.0.bin');
  const [firmwareError, setFirmwareError] = useState<string | null>(null);
  const [firmwareVerified, setFirmwareVerified] = useState(true);
  const [confirmOtaOpen, setConfirmOtaOpen] = useState(false);
  const [otaProgress, setOtaProgress] = useState<number | null>(null);
  const [otaStatusText, setOtaStatusText] = useState<string>('Idle — Ready for signed .bin image');
  const [restartStatus, setRestartStatus] = useState<string>('Device running normally (no pending reboot)');

  const activeDevice = devices[0];

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateConfig(draft, currentUser?.name ?? 'Admin');
    if (!res.ok) {
      setConfigError(res.error ?? 'Invalid configuration parameters.');
      setConfigSuccess(null);
      return;
    }
    setConfigError(null);
    setConfigSuccess('Configuration saved and pushed to ESP32-S3-CAM via MQTT.');
    pushToast({ type: 'success', title: 'Configuration Saved', description: `Thresholds updated (${draft.tempWarningThreshold}°C / ${draft.tempDangerThreshold}°C).` });
  };

  const verifyFirmwareFilename = (name: string) => {
    setFirmwareFile(name);
    if (!name.endsWith('.bin') || name.toLowerCase().includes('corrupt') || name.toLowerCase().includes('invalid')) {
      setFirmwareVerified(false);
      setFirmwareError('Invalid firmware image: expected signed ESP32-S3 .bin binary with valid CRC32 header.');
    } else {
      setFirmwareVerified(true);
      setFirmwareError(null);
    }
  };

  const startOtaUpdate = () => {
    setConfirmOtaOpen(false);
    if (!firmwareVerified) return;
    setOtaProgress(5);
    setOtaStatusText(`Uploading ${firmwareFile} to ${activeDevice.id}...`);
    setRestartStatus('Preparing OTA flash partition...');

    let pct = 10;
    const timer = setInterval(() => {
      pct += 18;
      if (pct < 100) {
        setOtaProgress(pct);
        setOtaStatusText(pct < 60 ? `Writing flash blocks (${pct}%)...` : `Verifying SHA-256 signature (${pct}%)...`);
      } else {
        clearInterval(timer);
        setOtaProgress(100);
        setOtaStatusText(`Update Complete — Restarting ${activeDevice.id} into ${newVersion}`);
        setRestartStatus(`Device rebooted into ${newVersion} cleanly (Rollback slot: ${activeDevice.firmwareVersion})`);
        const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const prevVer = activeDevice.firmwareVersion;
        setDevices((prev) =>
          prev.map((d, idx) => (idx === 0 ? { ...d, firmwareVersion: newVersion, lastRestartReason: `OTA Update to ${newVersion}` } : d))
        );
        setOtaHistory((prev) => [
          {
            id: `ota-${Date.now()}`,
            timestamp: ts,
            fromVersion: prevVer,
            toVersion: newVersion,
            filename: firmwareFile,
            checksum: 'sha256:4a91d8c0f2b7',
            status: 'SUCCESS',
            rollbackAvailable: true,
            initiatedBy: currentUser?.name ?? 'Admin',
            notes: `Verified OTA deployment from ${prevVer} to ${newVersion}.`,
          },
          ...prev,
        ]);
        addNotification('OTA Update', 'LOW', `OTA Firmware ${newVersion} Deployed`, `${activeDevice.id} updated and restarted cleanly.`);
        addHistoryLog('OTA Update History', currentUser?.name ?? 'Admin', 'SUCCESS', `Upgraded ${activeDevice.id} from ${prevVer} to ${newVersion}`);
        pushToast({ type: 'success', title: 'OTA Update Succeeded', description: `${activeDevice.id} is now running ${newVersion}.` });
      }
    }, 350);
  };

  const handleRollback = (targetVersion: string) => {
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const currentVer = activeDevice.firmwareVersion;
    setDevices((prev) =>
      prev.map((d, idx) => (idx === 0 ? { ...d, firmwareVersion: targetVersion, lastRestartReason: `OTA Rollback to ${targetVersion}` } : d))
    );
    setOtaHistory((prev) => [
      {
        id: `ota-rb-${Date.now()}`,
        timestamp: ts,
        fromVersion: currentVer,
        toVersion: targetVersion,
        filename: `rollback_slot_${targetVersion}.bin`,
        checksum: 'sha256:verified-slot',
        status: 'ROLLED_BACK',
        rollbackAvailable: false,
        initiatedBy: currentUser?.name ?? 'Admin',
        notes: `Manual bootloader slot rollback from ${currentVer} to ${targetVersion}.`,
      },
      ...prev,
    ]);
    setRestartStatus(`Device rolled back and restarted into ${targetVersion}`);
    pushToast({ type: 'warning', title: 'Firmware Rolled Back', description: `${activeDevice.id} restored to ${targetVersion}.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {section === 'config' ? 'Remote Configuration' : 'OTA Firmware Updates'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage ESP32-S3-CAM thresholds, room settings, signed firmware updates, and rollback slots
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setSection('config')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              section === 'config' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Remote Config</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('ota')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              section === 'ota' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>OTA Firmware</span>
          </button>
        </div>
      </div>

      {section === 'config' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleSaveConfig}
            className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5"
          >
            <h2 className="font-display text-base font-semibold">Classroom & Threshold Parameters</h2>

            {configError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{configError}</span>
              </div>
            )}
            {configSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{configSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Temperature Warning Threshold (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={draft.tempWarningThreshold}
                  onChange={(e) => setDraft({ ...draft, tempWarningThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Temperature Danger Threshold (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={draft.tempDangerThreshold}
                  onChange={(e) => setDraft({ ...draft, tempDangerThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Room ID</label>
                <input
                  type="text"
                  required
                  value={draft.roomId}
                  onChange={(e) => setDraft({ ...draft, roomId: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Door Unlock Duration (sec)</label>
                <input
                  type="number"
                  value={draft.doorUnlockDurationSec}
                  onChange={(e) => setDraft({ ...draft, doorUnlockDurationSec: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Telemetry Sampling Interval (sec)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={draft.samplingIntervalSec}
                  onChange={(e) => setDraft({ ...draft, samplingIntervalSec: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Notification & Hardware Preferences</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.buzzerEnabled}
                  onChange={(e) => setDraft({ ...draft, buzzerEnabled: e.target.checked })}
                />
                <span>Enable on-device piezoelectric buzzer for Fire/Panic alerts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.notifyPush}
                  onChange={(e) => setDraft({ ...draft, notifyPush: e.target.checked })}
                />
                <span>Push real-time dashboard notifications to Teachers & Guardians</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.notifyEmail}
                  onChange={(e) => setDraft({ ...draft, notifyEmail: e.target.checked })}
                />
                <span>Dispatch email digest on Danger / Security Lockout events</span>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                Save Configuration
              </button>
            </div>
          </form>

          {/* Configuration History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="font-display text-base font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>Configuration History</span>
            </h2>
            <div className="space-y-2.5">
              {configHistory.map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{item.parameter}</span>
                    <span className="font-mono text-[11px] text-slate-400">{item.timestamp.slice(0, 16)}</span>
                  </div>
                  <p className="font-mono text-slate-600 dark:text-slate-300">
                    {item.oldValue} → <strong>{item.newValue}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500">Changed by {item.changedBy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-semibold">Deploy OTA Firmware Update</h2>
                  <p className="text-xs text-slate-500">Target Node: {activeDevice.id} (Current: {activeDevice.firmwareVersion})</p>
                </div>
                <StatusBadge status={firmwareVerified ? 'VERIFIED' : 'ERROR'} label={firmwareVerified ? 'Image Verified' : 'Invalid Firmware'} />
              </div>

              {firmwareError && (
                <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{firmwareError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Current Firmware Version</label>
                  <input
                    type="text"
                    readOnly
                    value={activeDevice.firmwareVersion}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">New Firmware Version</label>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Upload / Select Firmware Binary (.bin)</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={firmwareFile}
                    onChange={(e) => verifyFirmwareFilename(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                  <label className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-center">
                    Choose .bin File
                    <input
                      type="file"
                      accept=".bin"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) verifyFirmwareFilename(f.name);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => verifyFirmwareFilename('corrupt_unsigned_image.hex')}
                    className="px-3 py-2 rounded-lg border border-amber-300 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-50"
                  >
                    Test Invalid Image
                  </button>
                </div>
              </div>

              {/* Update Progress & Restart Status */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{otaStatusText}</span>
                  {otaProgress !== null && <span className="font-mono font-bold tabular-nums">{otaProgress}%</span>}
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${otaProgress ?? 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Device Restart Status: {restartStatus}</p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!firmwareVerified}
                  onClick={() => setConfirmOtaOpen(true)}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  Verify & Deploy OTA Update
                </button>
              </div>
            </div>

            {/* Rollback & Verification Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="font-display text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Rollback & Bootloader</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                ESP32-S3 dual OTA partitions retain the previous verified image. If heartbeat telemetry fails within 30s post-reboot, automatic rollback restores the prior slot.
              </p>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <p className="text-slate-500">Standby Rollback Image</p>
                <p className="font-mono font-bold">v2.3.8 (Verified Slot A)</p>
              </div>
              <button
                type="button"
                onClick={() => handleRollback('v2.3.8')}
                className="w-full py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Manual Rollback to v2.3.8</span>
              </button>
            </div>
          </div>

          {/* Update History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="font-display text-base font-semibold mb-4">OTA Update History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left pb-2.5">Timestamp</th>
                    <th className="text-left pb-2.5">Transition</th>
                    <th className="text-left pb-2.5">Binary File</th>
                    <th className="text-left pb-2.5">Status</th>
                    <th className="text-left pb-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {otaHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 font-mono text-xs tabular-nums">{item.timestamp}</td>
                      <td className="py-3 font-mono text-xs">{item.fromVersion} → <strong>{item.toVersion}</strong></td>
                      <td className="py-3 font-mono text-xs">{item.filename}</td>
                      <td className="py-3"><StatusBadge status={item.status} /></td>
                      <td className="py-3 text-xs text-slate-600 dark:text-slate-300">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={confirmOtaOpen}
        onClose={() => setConfirmOtaOpen(false)}
        title="Confirm OTA Firmware Deployment"
        subtitle={`Target: ${activeDevice.id} · ${activeDevice.firmwareVersion} → ${newVersion}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Deploying <strong>{firmwareFile}</strong> will temporarily pause classroom camera streaming for ~10 seconds while the ESP32-S3-CAM verifies CRC32 and reboots.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmOtaOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700">
              Cancel
            </button>
            <button type="button" onClick={startOtaUpdate} className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              Proceed with OTA Flash
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
