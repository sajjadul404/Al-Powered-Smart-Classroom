import { useEffect, useState } from 'react';
import { EyeOff, MapPin, Radio, Wifi } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { StatusBadge } from '../components/ui/StatusBadge';

const ZONE_LABELS = [
  ['R1C1 (Front Left)', 'R1C2 (Front Center)', 'R1C3 (Front Right)'],
  ['R2C1 (Mid Left)', 'R2C2 (Center)', 'R2C3 (Mid Right)'],
  ['R3C1 (Rear Left)', 'R3C2 (Rear Center)', 'R3C3 (Rear Right)'],
];

export function WifiCsiPage() {
  const {
    csiGrid,
    setCsiGrid,
    csiHistory,
    setCsiHistory,
    cameraCoveredMode,
    setCameraCoveredMode,
    telemetry,
    setTelemetry,
  } = usePlatform();

  const [packetRate, setPacketRate] = useState(50);
  const [packetCount, setPacketCount] = useState(14820);
  const [presence, setPresence] = useState<'OCCUPIED' | 'EMPTY'>(telemetry.csiPresence);
  const [liveSim, setLiveSim] = useState(false);

  // Find peak estimated person location
  let peakRow = 0;
  let peakCol = 0;
  let peakVal = -1;
  csiGrid.forEach((row, r) =>
    row.forEach((val, c) => {
      if (val > peakVal) {
        peakVal = val;
        peakRow = r;
        peakCol = c;
      }
    })
  );

  useEffect(() => {
    if (!liveSim) return;
    const timer = setInterval(() => {
      setPacketRate(47 + Math.floor(Math.random() * 6));
      setPacketCount((c) => c + 50);
      const nextGrid = csiGrid.map((row) =>
        row.map((val) => Number(Math.max(0.05, Math.min(0.98, val + (Math.random() - 0.5) * 0.25)).toFixed(2)))
      );
      setCsiGrid(nextGrid);
    }, 1500);
    return () => clearInterval(timer);
  }, [liveSim, csiGrid, setCsiGrid]);

  const togglePresence = () => {
    const next: 'OCCUPIED' | 'EMPTY' = presence === 'OCCUPIED' ? 'EMPTY' : 'OCCUPIED';
    setPresence(next);
    setTelemetry((t) => ({ ...t, csiPresence: next }));
    if (next === 'EMPTY') {
      setCsiGrid([
        [0.06, 0.08, 0.05],
        [0.09, 0.07, 0.04],
        [0.05, 0.06, 0.08],
      ]);
    } else {
      setCsiGrid([
        [0.14, 0.86, 0.72],
        [0.58, 0.93, 0.44],
        [0.19, 0.68, 0.24],
      ]);
    }
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    setCsiHistory((prev) => [
      {
        id: `csi-${Date.now()}`,
        timestamp: ts,
        zoneRow: peakRow,
        zoneCol: peakCol,
        zoneLabel: next === 'EMPTY' ? 'All Zones Clear' : ZONE_LABELS[peakRow][peakCol],
        presence: next,
        packetRate,
        cameraCoveredMode,
      },
      ...prev,
    ]);
  };

  const selectZoneDemo = (r: number, c: number) => {
    const next = csiGrid.map((row, ri) =>
      row.map((_, ci) => (ri === r && ci === c ? 0.94 : Number((0.1 + Math.random() * 0.35).toFixed(2))))
    );
    setPresence('OCCUPIED');
    setTelemetry((t) => ({ ...t, csiPresence: 'OCCUPIED' }));
    setCsiGrid(next);
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    setCsiHistory((prev) => [
      {
        id: `csi-${Date.now()}`,
        timestamp: ts,
        zoneRow: r,
        zoneCol: c,
        zoneLabel: ZONE_LABELS[r][c],
        presence: 'OCCUPIED',
        packetRate,
        cameraCoveredMode,
      },
      ...prev,
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Wi-Fi CSI Presence & Localization</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Channel State Information (CSI) 3×3 classroom zone sensing · Camera-independent presence & localization
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCameraCoveredMode((m) => !m)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              cameraCoveredMode
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>{cameraCoveredMode ? 'Camera-Covered Mode: ON' : 'Test Camera-Covered Mode'}</span>
          </button>
          <button
            type="button"
            onClick={() => setLiveSim((s) => !s)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold ${
              liveSim ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {liveSim ? 'Pause Live CSI Stream' : 'Start Live CSI Stream'}
          </button>
          <button
            type="button"
            onClick={togglePresence}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Toggle Empty / Occupied
          </button>
        </div>
      </div>

      {cameraCoveredMode && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-4 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Camera-Covered Mode Active:</strong> Optical camera input is completely disabled/occluded. Wi-Fi CSI subcarrier amplitude variance continues to localize classroom occupancy accurately.
            </span>
          </div>
          <StatusBadge status="ACTIVE" label="CSI Only" />
        </div>
      )}

      {/* Top CSI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Classroom Presence</p>
          <div className="mt-2"><StatusBadge status={presence} /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 flex items-center gap-1"><Radio className="w-3.5 h-3.5" /> Packet Rate</p>
          <p className="font-mono text-xl font-bold tabular-nums mt-1">{packetRate} pkt/s</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 flex items-center gap-1"><Wifi className="w-3.5 h-3.5" /> CSI Packet Count</p>
          <p className="font-mono text-xl font-bold tabular-nums mt-1">{packetCount.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Estimated Location</p>
          <p className="font-mono text-sm font-bold mt-1.5 truncate">
            {presence === 'EMPTY' ? 'No Occupants' : ZONE_LABELS[peakRow][peakCol]}
          </p>
        </div>
      </div>

      {/* 3x3 Live 2D Classroom Map + Model Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold">Live 2D Classroom Map (3 × 3 Grid)</h2>
              <p className="text-xs text-slate-500">Click any zone to simulate person movement · Whiteboard at top</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Occupied</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800 inline-block" /> Empty</span>
            </div>
          </div>

          <div className="text-center text-[11px] font-semibold uppercase tracking-wider py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
            Front Whiteboard & Teacher Podium
          </div>

          <div className="grid grid-cols-3 gap-3">
            {csiGrid.map((row, r) =>
              row.map((prob, c) => {
                const isOccupied = presence === 'OCCUPIED' && prob >= 0.5;
                const isPeak = presence === 'OCCUPIED' && r === peakRow && c === peakCol;
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => selectZoneDemo(r, c)}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      isOccupied
                        ? 'bg-blue-600/15 border-blue-500 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{ZONE_LABELS[r][c]}</span>
                      {isPeak && <MapPin className="w-4 h-4 text-blue-600 shrink-0" />}
                    </div>
                    <p className="font-mono text-lg font-bold tabular-nums mt-2">
                      {Math.round(prob * 100)}%
                    </p>
                    <p className="text-[11px] mt-0.5 font-semibold">
                      {isOccupied ? 'OCCUPIED' : 'EMPTY'}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="font-display text-base font-semibold">CSI Model & Signal Diagnostics</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">CSI Data Status</span>
              <StatusBadge status="ACTIVE" label="Streaming" />
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Wi-Fi Signal / Channel</span>
              <span className="font-mono font-semibold">-54 dBm · Ch 6 (2.4 GHz)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Data Collection Status</span>
              <span className="font-semibold text-emerald-600">Balanced (9 Zones)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Model Architecture</span>
              <span className="font-semibold">1D-CNN + Random Forest</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Dataset Size</span>
              <span className="font-mono font-semibold tabular-nums">5,400 CSI frames</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Held-Out Accuracy</span>
              <span className="font-mono font-bold text-emerald-600 tabular-nums">92.8%</span>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Localization History</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {csiHistory.map((h) => (
                <div key={h.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{h.zoneLabel}</p>
                    <p className="font-mono text-[11px] text-slate-500">
                      {h.timestamp.slice(11)} · {h.cameraCoveredMode ? 'Camera Covered' : 'Normal'}
                    </p>
                  </div>
                  <StatusBadge status={h.presence} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
