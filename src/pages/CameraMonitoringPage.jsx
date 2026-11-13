import { useEffect, useState } from 'react';
import { AlertTriangle, Camera, EyeOff, Moon, Plus, Shield, Trash2 } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext.jsx';
import { ASSETS } from '../data/seedData';
import { Modal } from '../components/ui/Modal.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export function CameraMonitoringPage() {
  const {
    seatZones,
    setSeatZones,
    cameraEvents,
    setCameraEvents,
    telemetry,
    setTelemetry,
    addNotification,
    addHistoryLog,
    pushToast,
  } = usePlatform();

  const [cameraMode, setCameraMode] = useState('ROOM');
  const [fps, setFps] = useState(2.4);
  const [frameTick, setFrameTick] = useState(1);
  const [showBoxes, setShowBoxes] = useState(true);
  const [nightWatch, setNightWatch] = useState(false);
  const [tamperStatus, setTamperStatus] = useState('OK');
  const [intruderAlert, setIntruderAlert] = useState(null);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm, setZoneForm] = useState({ label: 'Row 3 · Seat C1', row: 3, col: 1, occupied: true, studentName: 'Tanvir Hossain' });

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameTick((t) => t + 1);
      setFps(Number((1.8 + Math.random() * 1.1).toFixed(1)));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const occupiedZones = seatZones.filter((z) => z.occupied).length;
  const capacityAlert = telemetry.occupancy > telemetry.capacity;

  const triggerTamper = (type) => {
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (type === 'RESTORED') {
      setTamperStatus('OK');
      setCameraEvents((prev) => [
        { id: `cam-${Date.now()}`, timestamp: ts, camera: cameraMode, eventType: 'RESTORED', details: `${cameraMode} Camera occlusion/angle fault cleared.`, snapshotRetained: false },
        ...prev,
      ]);
      pushToast({ type: 'success', title: 'Camera Restored', description: `${cameraMode} Camera optical view normal.` });
      return;
    }
    setTamperStatus(type);
    setCameraEvents((prev) => [
      { id: `cam-${Date.now()}`, timestamp: ts, camera: cameraMode, eventType: type, details: `${cameraMode} Camera reported ${type.replace('_', ' ')} fault.`, snapshotRetained: true },
      ...prev,
    ]);
    addNotification('Camera Fault', 'HIGH', `${type.replace('_', ' ')} — ${cameraMode} Cam`, 'Immediate physical camera inspection required.');
    addHistoryLog('Camera Events', `${cameraMode} Camera`, type, `${type} alert triggered`);
    pushToast({ type: 'error', title: type.replace('_', ' '), description: `${cameraMode} Camera tamper alert raised.` });
  };

  const triggerIntruder = () => {
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    setNightWatch(true);
    setIntruderAlert({ time: ts, snapshot: `NIGHT_INTRUDER_${Date.now()}.enc` });
    setCameraEvents((prev) => [
      { id: `cam-${Date.now()}`, timestamp: ts, camera: cameraMode, eventType: 'INTRUDER_DETECTED', details: 'Night Watch detected unauthorized person inside classroom after hours.', snapshotRetained: true },
      ...prev,
    ]);
    addNotification('Intruder Detected', 'CRITICAL', 'Night Watch Intruder Alert', `Motion & human silhouette detected at ${ts}. Private snapshot retained.`);
    addHistoryLog('Intruder Events', 'Night Watch Vision', 'INTRUDER', `Intruder detected on ${cameraMode} Camera`);
    pushToast({ type: 'error', title: 'Intruder Detected', description: 'Private snapshot captured and Teacher notified.' });
  };

  const saveSeatZone = (e) => {
    e.preventDefault();
    if (editingZone) {
      setSeatZones((prev) =>
        prev.map((z) =>
          z.id === editingZone.id
            ? { ...z, label: zoneForm.label, row: zoneForm.row, col: zoneForm.col, occupied: zoneForm.occupied, studentName: zoneForm.occupied ? zoneForm.studentName : null }
            : z
        )
      );
      pushToast({ type: 'success', title: 'Seat Zone Updated' });
    } else {
      const created = {
        id: `sz-${Date.now()}`,
        label: zoneForm.label,
        row: zoneForm.row,
        col: zoneForm.col,
        occupied: zoneForm.occupied,
        studentName: zoneForm.occupied ? zoneForm.studentName : null,
        xPct: 14 + (seatZones.length * 15) % 65,
        yPct: 45 + (seatZones.length * 9) % 30,
        wPct: 14,
        hPct: 18,
      };
      setSeatZones((prev) => [...prev, created]);
      pushToast({ type: 'success', title: 'Seat Zone Added', description: created.label });
    }
    setZoneModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Classroom Camera Monitoring</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live ≥ 1 FPS inference stream · Bounding boxes · Seat zones · Night Watch & Camera Tampering
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setCameraMode('ROOM')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              cameraMode === 'ROOM' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ROOM Camera
          </button>
          <button
            type="button"
            onClick={() => setCameraMode('DOOR')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              cameraMode === 'DOOR' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            DOOR Camera
          </button>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center gap-3 text-xs text-blue-900 dark:text-blue-200">
        <Shield className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Privacy Guarantee:</strong> Normal classroom camera frames are processed transiently in memory and never stored. Private snapshots are retained only when an authorized security event (Intruder, Spoofing, Lockout) occurs.
        </span>
      </div>

      {capacityAlert && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200 font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Capacity Alert: Detected {telemetry.occupancy} occupants exceeds room limit ({telemetry.capacity}).</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Camera className="w-4 h-4 text-blue-600" />
              <span className="font-display text-sm font-semibold">
                {cameraMode} Camera Stream · <span className="font-mono">{fps} FPS</span> (Frame #{frameTick})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={tamperStatus === 'OK' ? 'ONLINE' : tamperStatus} />
              <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" checked={showBoxes} onChange={(e) => setShowBoxes(e.target.checked)} />
                <span>Bounding Boxes</span>
              </label>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
            {tamperStatus === 'CAMERA_COVERED' ? (
              <div className="w-full h-80 flex flex-col items-center justify-center text-white space-y-2 bg-slate-950">
                <EyeOff className="w-10 h-10 text-red-500" />
                <p className="font-display text-base font-bold text-red-400">CAMERA COVERED — Optical Feed Obstructed</p>
                <p className="text-xs text-slate-400">Switch to Wi-Fi CSI for camera-free occupancy localization</p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={cameraMode === 'ROOM' ? ASSETS.roomCam : ASSETS.doorCam}
                  alt={`${cameraMode} Camera View`}
                  referrerPolicy="no-referrer"
                  className={`w-full h-80 object-cover ${tamperStatus === 'CAMERA_MOVED' ? 'rotate-2 scale-105' : ''}`}
                />
                {showBoxes && cameraMode === 'ROOM' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {seatZones.map((z) => (
                      <div
                        key={z.id}
                        style={{ left: `${z.xPct}%`, top: `${z.yPct}%`, width: `${z.wPct}%`, height: `${z.hPct}%` }}
                        className={`absolute border-2 rounded ${
                          z.occupied ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-300/70 border-dashed'
                        }`}
                      >
                        <span className="px-1 py-0.5 text-[10px] font-mono font-semibold bg-slate-950/80 text-white block truncate">
                          {z.label} {z.occupied ? '· OCC' : '· EMPTY'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => triggerTamper('CAMERA_COVERED')}
                className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 font-semibold hover:bg-red-50"
              >
                Simulate Covered
              </button>
              <button
                type="button"
                onClick={() => triggerTamper('CAMERA_MOVED')}
                className="px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 font-semibold hover:bg-amber-50"
              >
                Simulate Moved
              </button>
              {tamperStatus !== 'OK' && (
                <button
                  type="button"
                  onClick={() => triggerTamper('RESTORED')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                >
                  Restore Camera
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTelemetry((t) => ({ ...t, occupancy: t.capacity + 2 }))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Test Capacity Alert
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="font-display text-sm font-semibold">People Counting & Occupancy</h2>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-bold tabular-nums">{telemetry.occupancy}</span>
              <span className="text-xs text-slate-500 font-mono">Capacity: {telemetry.capacity} seats</span>
            </div>
            <p className="text-xs text-slate-500">
              Active Seat Zones Occupied: <strong className="font-mono">{occupiedZones} / {seatZones.length}</strong>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-blue-600" />
                <span>Night Watch Security</span>
              </h2>
              <StatusBadge status={intruderAlert ? 'INTRUDER_DETECTED' : nightWatch ? 'ACTIVE' : 'STANDBY'} />
            </div>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span>Enable After-Hours Intruder Watch</span>
              <input type="checkbox" checked={nightWatch} onChange={(e) => setNightWatch(e.target.checked)} />
            </label>
            <button
              type="button"
              onClick={triggerIntruder}
              className="w-full py-2 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
            >
              Simulate Intruder Detection
            </button>
            {intruderAlert && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs space-y-1">
                <p className="font-bold text-red-800 dark:text-red-300">Intruder Alert Triggered</p>
                <p className="font-mono text-[11px]">Time: {intruderAlert.time}</p>
                <p className="font-mono text-[11px]">Private Snapshot: {intruderAlert.snapshot}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Seat Zone Monitoring</h2>
            <button
              type="button"
              onClick={() => {
                setEditingZone(null);
                setZoneForm({ label: `Row 3 · Seat C${seatZones.length + 1}`, row: 3, col: 1, occupied: false, studentName: '' });
                setZoneModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Seat Zone</span>
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {seatZones.map((z) => (
              <div key={z.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                <div>
                  <p className="font-semibold">{z.label}</p>
                  <p className="text-slate-500">{z.occupied ? `Student: ${z.studentName ?? 'Occupied'}` : 'Position empty'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={z.occupied ? 'OCCUPIED' : 'EMPTY'} />
                  <button
                    type="button"
                    onClick={() => {
                      setEditingZone(z);
                      setZoneForm({ label: z.label, row: z.row, col: z.col, occupied: z.occupied, studentName: z.studentName ?? '' });
                      setZoneModalOpen(true);
                    }}
                    className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeatZones((prev) => prev.filter((item) => item.id !== z.id))}
                    className="p-1 text-slate-400 hover:text-red-600"
                    aria-label={`Delete ${z.label}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="font-display text-base font-semibold">Camera Status & Tamper History</h2>
          <div className="space-y-2">
            {cameraEvents.map((ce) => (
              <div key={ce.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold">{ce.camera} CAM · {ce.eventType.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-slate-400">{ce.timestamp}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{ce.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={zoneModalOpen} onClose={() => setZoneModalOpen(false)} title={editingZone ? 'Edit Seat Zone' : 'Add Seat Zone'}>
        <form onSubmit={saveSeatZone} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Zone Label</label>
            <input
              type="text"
              required
              value={zoneForm.label}
              onChange={(e) => setZoneForm({ ...zoneForm, label: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={zoneForm.occupied} onChange={(e) => setZoneForm({ ...zoneForm, occupied: e.target.checked })} />
            <span>Seat Occupied</span>
          </label>
          {zoneForm.occupied && (
            <div>
              <label className="block text-xs font-semibold mb-1">Student Position Name</label>
              <input
                type="text"
                value={zoneForm.studentName}
                onChange={(e) => setZoneForm({ ...zoneForm, studentName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setZoneModalOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              Save Zone
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
