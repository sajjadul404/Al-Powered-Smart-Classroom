import { useState } from 'react';
import { BellRing, DoorOpen, Droplets, Flame, Lock, ShieldAlert, Thermometer, Unlock } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext.jsx';
import { SimpleLineChart } from '../components/ui/Charts.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export function SafetyEmergencyPage() {
  const {
    telemetry,
    telemetrySeries,
    config,
    emergencyEvents,
    currentUser,
    triggerFireEmergency,
    resetFireEmergency,
    triggerPanicAlert,
    resetPanicAlert,
    unlockDoorTemporary,
  } = usePlatform();

  const [confirmFireReset, setConfirmFireReset] = useState(false);

  const canClear = currentUser?.role === 'Admin' || currentUser?.role === 'Teacher';
  const tempState = telemetry.flameDetected
    ? 'FIRE'
    : telemetry.temperature >= config.tempDangerThreshold
    ? 'DANGER'
    : telemetry.temperature >= config.tempWarningThreshold
    ? 'WARNING'
    : 'SAFE';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Safety & Emergency Monitoring</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Warning Threshold: {config.tempWarningThreshold}°C · Danger Threshold: {config.tempDangerThreshold}°C · Fire overrides every door lock rule
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!telemetry.flameDetected ? (
            <button
              type="button"
              onClick={triggerFireEmergency}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
            >
              <Flame className="w-4 h-4" />
              <span>Test Fire Alarm</span>
            </button>
          ) : (
            canClear && (
              <button
                type="button"
                onClick={() => setConfirmFireReset(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-sm"
              >
                <Flame className="w-4 h-4" />
                <span>Reset Fire State</span>
              </button>
            )
          )}

          {!telemetry.panicActive ? (
            <button
              type="button"
              onClick={triggerPanicAlert}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Test Panic Button</span>
            </button>
          ) : (
            canClear && (
              <button
                type="button"
                onClick={resetPanicAlert}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                <span>Clear Panic Alert</span>
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5" />Temperature</p>
            <p className="font-mono text-2xl font-bold tabular-nums mt-1">{telemetry.temperature.toFixed(1)}°C</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Warn {config.tempWarningThreshold}°C / Danger {config.tempDangerThreshold}°C</p>
          </div>
          <StatusBadge status={tempState} />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5" />Humidity</p>
            <p className="font-mono text-2xl font-bold tabular-nums mt-1">{telemetry.humidity}%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">DHT11 Ambient Sensor</p>
          </div>
          <StatusBadge status="SAFE" />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" />Heat Index</p>
            <p className="font-mono text-2xl font-bold tabular-nums mt-1">{telemetry.heatIndex.toFixed(1)}°C</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Combined thermal index</p>
          </div>
          <StatusBadge status={telemetry.heatIndex >= config.tempDangerThreshold ? 'DANGER' : telemetry.heatIndex >= config.tempWarningThreshold ? 'WARNING' : 'SAFE'} />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" />IR Flame Sensor</p>
            <p className="font-mono text-lg font-bold mt-1">{telemetry.flameDetected ? 'FLAME DETECTED' : 'NO FLAME'}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Buzzer: {telemetry.buzzerActive ? 'ACTIVE' : 'OFF'}</p>
          </div>
          <StatusBadge status={telemetry.flameDetected ? 'FIRE' : 'SAFE'} />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5"><DoorOpen className="w-3.5 h-3.5" />Door Status</p>
            <p className="font-mono text-lg font-bold mt-1">{telemetry.doorStatus}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {telemetry.flameDetected
                ? 'FIRE OVERRIDE ACTIVE'
                : telemetry.doorUnlockRemainingSec > 0
                ? `Auto-relock in ${telemetry.doorUnlockRemainingSec}s`
                : telemetry.doorUnlockReason}
            </p>
          </div>
          <StatusBadge status={telemetry.doorStatus} />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5"><BellRing className="w-3.5 h-3.5" />Panic Status</p>
            <p className="font-mono text-lg font-bold mt-1">{telemetry.panicActive ? 'PANIC TRIGGERED' : 'STANDBY'}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {telemetry.panicActive ? 'Red/Blue Strobe + Buzzer Active' : 'Hardware switch normal'}
            </p>
          </div>
          <StatusBadge status={telemetry.panicActive ? 'PANIC' : 'SAFE'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold">Classroom Temperature Trend</h2>
              <p className="text-xs text-slate-500">Live threshold evaluation against {config.tempWarningThreshold}°C / {config.tempDangerThreshold}°C</p>
            </div>
            <StatusBadge status={tempState} />
          </div>
          <SimpleLineChart
            labels={telemetrySeries.map((t) => t.time)}
            series={[{ name: 'Temperature (°C)', color: '#DC2626', values: telemetrySeries.map((t) => t.temperature), unit: '°C' }]}
            thresholds={[
              { label: 'Warning', value: config.tempWarningThreshold, color: '#D97706' },
              { label: 'Danger', value: config.tempDangerThreshold, color: '#DC2626' },
            ]}
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h2 className="font-display text-base font-semibold">Door Control & Fire Override</h2>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Relay</span>
                <span className="font-mono font-bold flex items-center gap-1.5">
                  {telemetry.doorStatus === 'LOCKED' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-blue-600" />}
                  {telemetry.doorStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Standard Unlock Duration</span>
                <span className="font-mono font-semibold">{config.doorUnlockDurationSec} seconds</span>
              </div>
              <div className="pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block">Last Reason:</span>
                <span className="font-medium text-slate-900 dark:text-white">{telemetry.doorUnlockReason}</span>
              </div>
            </div>

            {telemetry.panicActive && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-red-600 to-blue-600 text-white text-xs font-semibold flex items-center justify-between">
                <span>Red & Blue Emergency Strobe Active</span>
                <span className="font-mono">BUZZER ON</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled={telemetry.flameDetected}
              onClick={() => unlockDoorTemporary(`Remote Manual Unlock by ${currentUser?.name ?? 'Staff'}`)}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {telemetry.flameDetected
                ? 'Door Held Unlocked (Fire Override Active)'
                : `Unlock Door for ${config.doorUnlockDurationSec}s`}
            </button>

            {telemetry.flameDetected && canClear && (
              <button
                type="button"
                onClick={() => setConfirmFireReset(true)}
                className="w-full py-2.5 px-4 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Reset Fire State & Restore Lock
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="font-display text-base font-semibold mb-4">Emergency Event History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left pb-2.5 font-semibold">Timestamp</th>
                <th className="text-left pb-2.5 font-semibold">Type</th>
                <th className="text-left pb-2.5 font-semibold">Room</th>
                <th className="text-left pb-2.5 font-semibold">Buzzer / Door</th>
                <th className="text-left pb-2.5 font-semibold">Details</th>
                <th className="text-left pb-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {emergencyEvents.map((ev) => (
                <tr key={ev.id}>
                  <td className="py-3 font-mono text-xs tabular-nums">{ev.timestamp}</td>
                  <td className="py-3"><StatusBadge status={ev.type} /></td>
                  <td className="py-3 text-xs font-mono">{ev.roomId}</td>
                  <td className="py-3 text-xs">
                    Buzzer: {ev.buzzerActive ? 'ON' : 'OFF'} · Door: {ev.doorUnlocked ? 'UNLOCKED' : 'LOCKED'}
                  </td>
                  <td className="py-3 text-xs text-slate-600 dark:text-slate-300">{ev.message}</td>
                  <td className="py-3">
                    <StatusBadge status={ev.resolved ? 'RESOLVED' : 'DANGER'} label={ev.resolved ? `Reset by ${ev.resolvedBy}` : 'ACTIVE'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={confirmFireReset}
        onClose={() => setConfirmFireReset(false)}
        title="Confirm Fire Alarm Reset"
        subtitle="Only Teacher or Admin roles may clear an active fire override."
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Confirm that Room {telemetry.roomId} has been inspected and is safe. Resetting will clear the red emergency banner, turn off the buzzer, and relock the classroom door.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmFireReset(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                resetFireEmergency();
                setConfirmFireReset(false);
              }}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Confirm Reset Fire
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
