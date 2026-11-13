import { useState } from 'react';
import { ArrowLeft, Cpu, Edit2, RefreshCw, RotateCcw, Sliders, Terminal, Wifi } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext.jsx';
import { ASSETS } from '../data/seedData';
import { Modal } from '../components/ui/Modal.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

function formatUptime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export function DeviceManagementPage() {
  const {
    devices,
    setDevices,
    setActivePage,
    selectedDeviceIdForDetails,
    setSelectedDeviceIdForDetails,
    pushToast,
    addHistoryLog,
  } = usePlatform();

  const [editingDevice, setEditingDevice] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [logsModalDevice, setLogsModalDevice] = useState(null);

  const detailDevice = devices.find((d) => d.id === selectedDeviceIdForDetails) ?? null;

  const handleReconnect = (dev) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === dev.id
          ? {
              ...d,
              status: 'ONLINE',
              wifiConnected: true,
              mqttConnected: true,
              lastSeen: new Date().toISOString().slice(0, 19).replace('T', ' '),
              logs: [
                { id: `dl-${Date.now()}`, time: new Date().toTimeString().slice(0, 8), level: 'INFO', message: 'MQTT & Wi-Fi reconnect handshake succeeded' },
                ...d.logs,
              ],
            }
          : d
      )
    );
    pushToast({ type: 'success', title: 'Device Reconnected', description: `${dev.id} MQTT stream restored.` });
  };

  const handleRestart = (dev) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === dev.id
          ? {
              ...d,
              status: 'ONLINE',
              uptimeSeconds: 12,
              lastRestartReason: 'Remote Admin Soft Restart',
              logs: [
                { id: `dl-${Date.now()}`, time: new Date().toTimeString().slice(0, 8), level: 'WARN', message: 'ESP32-S3-CAM rebooted via remote command' },
                ...d.logs,
              ],
            }
          : d
      )
    );
    addHistoryLog('Device Restart History', dev.id, 'RESTARTED', 'Remote Admin soft restart completed cleanly');
    pushToast({ type: 'info', title: 'Device Restarted', description: `${dev.id} rebooted and re-registered online.` });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingDevice) return;
    setDevices((prev) =>
      prev.map((d) => (d.id === editingDevice.id ? { ...d, name: editName, roomId: editRoom } : d))
    );
    pushToast({ type: 'success', title: 'Device Updated', description: `${editingDevice.id} assigned to ${editRoom}.` });
    setEditingDevice(null);
  };

  if (detailDevice) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setSelectedDeviceIdForDetails(null)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Devices</span>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleReconnect(detailDevice)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reconnect</span>
            </button>
            <button
              type="button"
              onClick={() => handleRestart(detailDevice)}
              className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-50 dark:hover:bg-amber-950/30 inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Device</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePage('remote-config')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 inline-flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configure Device</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <img
            src={ASSETS.esp32Hardware}
            alt={detailDevice.name}
            referrerPolicy="no-referrer"
            className="w-full h-52 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
          />
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="font-display text-xl font-bold">{detailDevice.name}</h1>
                <p className="font-mono text-xs text-slate-500">{detailDevice.id} · Room {detailDevice.roomId} · Firmware {detailDevice.firmwareVersion}</p>
              </div>
              <StatusBadge status={detailDevice.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <p className="text-slate-500">CPU / Task Load</p>
                <p className="font-mono text-base font-bold tabular-nums mt-0.5">{detailDevice.cpuLoadPct}%</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <p className="text-slate-500">Free Heap Memory</p>
                <p className="font-mono text-base font-bold tabular-nums mt-0.5">{detailDevice.freeHeapKb} / {detailDevice.totalHeapKb} KB</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <p className="text-slate-500">Wi-Fi RSSI</p>
                <p className="font-mono text-base font-bold tabular-nums mt-0.5">{detailDevice.rssi} dBm</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <p className="text-slate-500">Chip Temp</p>
                <p className="font-mono text-base font-bold tabular-nums mt-0.5">{detailDevice.chipTemp}°C</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div><span className="text-slate-500 block">Sensor Status</span><span className="font-semibold">{detailDevice.sensorStatus}</span></div>
              <div><span className="text-slate-500 block">Camera Status</span><span className="font-semibold">{detailDevice.cameraStatus}</span></div>
              <div><span className="text-slate-500 block">Wi-Fi / MQTT</span><span className="font-semibold">{detailDevice.wifiConnected ? 'Connected' : 'Down'} / {detailDevice.mqttConnected ? 'Connected' : 'Down'}</span></div>
              <div><span className="text-slate-500 block">Last Restart Reason</span><span className="font-semibold">{detailDevice.lastRestartReason}</span></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="font-display text-base font-semibold mb-3">Real-Time Device Telemetry & Task Logs</h2>
          <div className="space-y-2">
            {detailDevice.logs.map((log) => (
              <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-mono text-xs flex items-center gap-3">
                <span className="text-slate-400 tabular-nums">{log.time}</span>
                <StatusBadge status={log.level === 'WARN' ? 'WARNING' : log.level === 'ERROR' ? 'ERROR' : 'OK'} label={log.level} />
                <span className="text-slate-700 dark:text-slate-200">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Device Management & Health Monitoring</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          ESP32-S3-CAM classroom controller nodes, memory, RSSI, MQTT health, and remote operations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {devices.map((dev) => (
          <div key={dev.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">{dev.name}</h2>
                  <p className="font-mono text-xs text-slate-500">{dev.id} · Room {dev.roomId} · {dev.firmwareVersion}</p>
                </div>
              </div>
              <StatusBadge status={dev.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block">Uptime</span>
                <span className="font-mono font-semibold tabular-nums">{formatUptime(dev.uptimeSeconds)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block">Wi-Fi RSSI</span>
                <span className="font-mono font-semibold tabular-nums flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-blue-600" />
                  {dev.rssi} dBm
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block">Free Heap</span>
                <span className="font-mono font-semibold tabular-nums">{dev.freeHeapKb} KB</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block">Chip Temp</span>
                <span className="font-mono font-semibold tabular-nums">{dev.chipTemp}°C</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block">Last Seen</span>
                <span className="font-mono font-semibold tabular-nums">{dev.lastSeen.slice(11)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block">MQTT / Camera</span>
                <span className="font-semibold">{dev.mqttConnected ? 'OK' : 'DOWN'} / {dev.cameraStatus}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDeviceIdForDetails(dev.id)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                View Device
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingDevice(dev);
                  setEditName(dev.name);
                  setEditRoom(dev.roomId);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => handleReconnect(dev)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Reconnect
              </button>
              <button
                type="button"
                onClick={() => handleRestart(dev)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Restart
              </button>
              <button
                type="button"
                onClick={() => setLogsModalDevice(dev)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Logs</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePage('remote-config')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={Boolean(editingDevice)} onClose={() => setEditingDevice(null)} title="Edit ESP32-S3-CAM Device">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Device Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Assigned Room ID</label>
            <input
              type="text"
              required
              value={editRoom}
              onChange={(e) => setEditRoom(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditingDevice(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              Save Device
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(logsModalDevice)}
        onClose={() => setLogsModalDevice(null)}
        title={`Device Logs — ${logsModalDevice?.id ?? ''}`}
      >
        {logsModalDevice && (
          <div className="space-y-2">
            {logsModalDevice.logs.map((l) => (
              <div key={l.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-mono text-xs flex items-center gap-2.5">
                <span className="text-slate-400">{l.time}</span>
                <span className="font-bold">{l.level}</span>
                <span>{l.message}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
