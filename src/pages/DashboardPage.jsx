import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CloudSun,
  Cpu,
  Droplets,
  Flame,
  ShieldAlert,
  Thermometer,
  UserCheck,
  Users,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext.jsx';
import { UI_COPY } from '../i18n';
import { SimpleBarChart, SimpleLineChart } from '../components/ui/Charts.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export function DashboardPage() {
  const {
    currentUser,
    language,
    students,
    attendance,
    telemetry,
    telemetrySeries,
    securityEvents,
    emergencyEvents,
    devices,
    notifications,
    handRaiseEvents,
    config,
    connectionMode,
    selectedClassroom,
    setSelectedClassroom,
    setActivePage,
    acknowledgeNotification,
    resetFireEmergency,
  } = usePlatform();

  const [dateFilter, setDateFilter] = useState('2026-11-12');
  const [weatherSummary, setWeatherSummary] = useState({
    temp: 32.1,
    condition: 'Partly Cloudy',
    humidity: 69,
    stale: false,
  });

  useEffect(() => {
    fetch('/api/weather')
      .then((r) => r.json())
      .then((res) => {
        if (res?.data) {
          setWeatherSummary({
            temp: res.data.temperature,
            condition: res.data.condition,
            humidity: res.data.humidity,
            stale: res.status !== 'LIVE',
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!currentUser) return null;

  const copy = UI_COPY[language];
  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const lateCount = attendance.filter((a) => a.status === 'LATE').length;
  const activeAlertsCount =
    (telemetry.flameDetected ? 1 : 0) +
    (telemetry.panicActive ? 1 : 0) +
    securityEvents.filter((s) => !s.resolved).length +
    notifications.filter((n) => !n.acknowledged && (n.priority === 'CRITICAL' || n.priority === 'HIGH')).length;

  const tempStatus = telemetry.flameDetected
    ? 'FIRE'
    : telemetry.temperature >= config.tempDangerThreshold
    ? 'DANGER'
    : telemetry.temperature >= config.tempWarningThreshold
    ? 'WARNING'
    : 'SAFE';

  if (currentUser.role === 'Student') {
    const myStudent = students.find((s) => s.studentId === currentUser.linkedStudentId) ?? students[0];
    const myAttendance = attendance.filter((a) => a.studentId === myStudent.studentId);
    const todayAtt = myAttendance[0];
    const notices = notifications.filter((n) => n.category !== 'Face Mismatch' && n.category !== 'Intruder Detected');

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={myStudent.avatar}
              alt={myStudent.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">{myStudent.name}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                ID: {myStudent.studentId} · {myStudent.className} ({myStudent.section}) · RFID: {myStudent.rfidUid}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={todayAtt?.status ?? 'ABSENT'} />
            <span className="text-sm font-mono font-bold tabular-nums text-slate-900 dark:text-white">
              {myStudent.attendancePercentage}% Overall
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="font-display text-base font-semibold mb-4">Personal Attendance History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Scan Time</th>
                    <th className="pb-2">Verification</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {myAttendance.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2.5 font-mono text-xs tabular-nums">{a.date}</td>
                      <td className="py-2.5 font-mono text-xs tabular-nums">{a.scanTime ?? '—'}</td>
                      <td className="py-2.5 text-xs">{a.faceVerified ? `Face (${a.confidence}%)` : 'Not Scanned'}</td>
                      <td className="py-2.5">
                        <StatusBadge status={a.status} />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2.5 font-mono text-xs tabular-nums">2026-11-11</td>
                    <td className="py-2.5 font-mono text-xs tabular-nums">09:03:41</td>
                    <td className="py-2.5 text-xs">Face (98.1%)</td>
                    <td className="py-2.5">
                      <StatusBadge status="PRESENT" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="font-display text-base font-semibold">Classroom Notices & Personal Activity</h2>
            {notices.slice(0, 4).map((n) => (
              <div key={n.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">{n.title}</span>
                  <span className="font-mono text-slate-400">{n.timestamp.slice(11, 16)}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentUser.role === 'Guardian') {
    const child = students.find((s) => s.studentId === currentUser.linkedStudentId) ?? students[0];
    const childAtt = attendance.filter((a) => a.studentId === child.studentId);
    const latestAtt = childAtt[0];

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={child.avatar}
              alt={child.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <p className="text-xs font-semibold text-blue-600">Linked Child Profile</p>
              <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">{child.name}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                Student ID: {child.studentId} · Classroom {child.className} ({child.section})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={latestAtt?.status ?? 'ABSENT'} />
            <span className="text-sm font-mono font-semibold tabular-nums">{child.attendancePercentage}% Attendance</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="font-display text-base font-semibold mb-3">Child Attendance & Check-In Verification</h2>
            <div className="space-y-3">
              {childAtt.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold">{a.date}</p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">
                      Scan: {a.scanTime ?? 'No scan recorded'} · RFID: {a.rfidUid}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="font-display text-base font-semibold mb-3">Safety & Attendance Notifications</h2>
            <div className="space-y-2.5">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">{n.title}</span>
                    <span className="font-mono text-slate-400">{n.timestamp.slice(11, 16)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: copy.totalStudents, value: students.length, sub: 'Enrolled', icon: Users, target: 'students' },
    { label: copy.presentStudents, value: presentCount, sub: '≤ 15 min rule', badge: 'PRESENT', icon: UserCheck, target: 'attendance' },
    { label: copy.absentStudents, value: absentCount, sub: '> 45 min rule', badge: absentCount > 0 ? 'ABSENT' : 'SAFE', icon: Users, target: 'attendance' },
    { label: copy.lateStudents, value: lateCount, sub: '15–45 min window', badge: lateCount > 0 ? 'LATE' : 'SAFE', icon: Users, target: 'attendance' },
    { label: copy.temperature, value: `${telemetry.temperature.toFixed(1)}°C`, sub: `Warn ${config.tempWarningThreshold}°C`, badge: tempStatus, icon: Thermometer, target: 'safety' },
    { label: copy.humidity, value: `${telemetry.humidity}%`, sub: 'DHT11 Sensor', icon: Droplets, target: 'safety' },
    { label: copy.heatIndex, value: `${telemetry.heatIndex}°C`, sub: 'Apparent Temp', icon: Flame, target: 'safety' },
    { label: copy.roomOccupancy, value: `${telemetry.occupancy}/${telemetry.capacity}`, sub: `CSI: ${telemetry.csiPresence}`, badge: telemetry.csiPresence, icon: Users, target: 'wifi-csi' },
    { label: copy.deviceStatus, value: devices[0]?.status ?? 'ONLINE', sub: `RSSI ${devices[0]?.rssi ?? -54} dBm`, badge: connectionMode === 'LIVE' ? 'ONLINE' : connectionMode, icon: Cpu, target: 'devices' },
    { label: copy.activeAlerts, value: activeAlertsCount, sub: 'Requires review', badge: activeAlertsCount > 0 ? 'WARNING' : 'SAFE', icon: ShieldAlert, target: 'notifications' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {currentUser.role === 'Admin' ? 'Smart Classroom Command Dashboard' : 'Teacher Classroom Operations'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Room {selectedClassroom} · Last telemetry packet {telemetry.timestamp} · ESP32-S3-CAM
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="date"
            aria-label="Filter dashboard date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          <select
            aria-label="Filter classroom"
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="CSE-401">CSE-401 (Main)</option>
            <option value="CSE-402">CSE-402 (Vision Lab)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => setActivePage(card.target)}
              className="text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{card.label}</span>
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {card.value}
                </span>
                {card.badge && <StatusBadge status={card.badge} />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
                <span>{card.sub}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold">Temperature & Humidity Telemetry</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                DHT11 readings with {config.tempWarningThreshold}°C Warning & {config.tempDangerThreshold}°C Danger thresholds
              </p>
            </div>
            <StatusBadge status={tempStatus} />
          </div>
          <SimpleLineChart
            labels={telemetrySeries.map((d) => d.time)}
            series={[
              { name: 'Temp (°C)', color: '#2563EB', values: telemetrySeries.map((d) => d.temperature), unit: '°C' },
              { name: 'Humidity (%)', color: '#16A34A', values: telemetrySeries.map((d) => d.humidity), unit: '%' },
            ]}
            thresholds={[
              { label: 'Warn', value: config.tempWarningThreshold, color: '#D97706' },
              { label: 'Danger', value: config.tempDangerThreshold, color: '#DC2626' },
            ]}
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-base font-semibold">Attendance Overview</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Daily biometric + RFID status breakdown</p>
          </div>
          <SimpleBarChart
            data={[
              { label: 'Present', value: presentCount, color: '#16A34A' },
              { label: 'Late', value: lateCount, color: '#D97706' },
              { label: 'Absent', value: absentCount, color: '#DC2626' },
            ]}
          />
          <button
            type="button"
            onClick={() => setActivePage('attendance')}
            className="mt-4 w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Open Attendance & Access Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">Live Classroom Status</h3>
            <StatusBadge status={telemetry.doorStatus} />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Door Lock</span>
              <span className="font-mono font-semibold">{telemetry.doorStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Occupancy</span>
              <span className="font-mono font-semibold tabular-nums">{telemetry.occupancy} / {telemetry.capacity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Wi-Fi CSI</span>
              <span className="font-mono font-semibold">{telemetry.csiPresence}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hand-Raise Queue</span>
              <span className="font-mono font-semibold">{handRaiseEvents.filter((h) => !h.acknowledged).length} pending</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">Safety Alert Panel</h3>
            <StatusBadge status={telemetry.flameDetected ? 'FIRE' : telemetry.panicActive ? 'PANIC' : 'SAFE'} />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">IR Flame Sensor</span>
              <span className={`font-semibold ${telemetry.flameDetected ? 'text-red-600' : 'text-emerald-600'}`}>
                {telemetry.flameDetected ? 'FIRE DETECTED' : 'CLEAR'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Panic Button</span>
              <span className={`font-semibold ${telemetry.panicActive ? 'text-red-600' : 'text-emerald-600'}`}>
                {telemetry.panicActive ? 'ACTIVE' : 'STANDBY'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Recent Emergencies</span>
              <span className="font-mono font-semibold">{emergencyEvents.length}</span>
            </div>
          </div>
          {telemetry.flameDetected ? (
            <button
              type="button"
              onClick={resetFireEmergency}
              className="w-full py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
            >
              Reset Fire State
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActivePage('safety')}
              className="w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Open Safety Console
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">Device Health Summary</h3>
            <StatusBadge status={devices[0]?.status ?? 'ONLINE'} />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Node</span>
              <span className="font-mono font-semibold">{devices[0]?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Firmware</span>
              <span className="font-mono font-semibold">{devices[0]?.firmwareVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Free Heap</span>
              <span className="font-mono font-semibold tabular-nums">{devices[0]?.freeHeapKb} KB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Chip Temp</span>
              <span className="font-mono font-semibold tabular-nums">{devices[0]?.chipTemp}°C</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">Weather Overview</h3>
            <CloudSun className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums">{weatherSummary.temp}°C</span>
            <span className="text-xs text-slate-500">{weatherSummary.condition}</span>
          </div>
          <p className="text-xs text-slate-500 font-mono tabular-nums">
            Outdoor Humidity: {weatherSummary.humidity}% · {weatherSummary.stale ? 'Cached' : '60m API Sync'}
          </p>
          <button
            type="button"
            onClick={() => setActivePage('weather-analytics')}
            className="w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            24h Forecast & Analytics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-semibold">Recent Attendance Activity</h3>
            <button type="button" onClick={() => setActivePage('attendance')} className="text-xs text-blue-600 font-semibold hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-2.5">
            {attendance.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-b-0 border-slate-100 dark:border-slate-800 text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{a.studentName}</p>
                  <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                    {a.scanTime ?? 'No scan'} · {a.rfidUid}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-semibold">Recent Security Events</h3>
            <button type="button" onClick={() => setActivePage('attendance')} className="text-xs text-blue-600 font-semibold hover:underline">
              Security tab
            </button>
          </div>
          <div className="space-y-2.5">
            {securityEvents.slice(0, 4).map((ev) => (
              <div key={ev.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    {ev.type.replace(/_/g, ' ')}
                  </span>
                  <StatusBadge status={ev.resolved ? 'RESOLVED' : ev.severity} />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">{ev.details}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-semibold">Recent Notifications</h3>
            <button type="button" onClick={() => setActivePage('notifications')} className="text-xs text-blue-600 font-semibold hover:underline">
              Center
            </button>
          </div>
          <div className="space-y-2.5">
            {notifications.slice(0, 4).map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-2 py-1.5 border-b last:border-b-0 border-slate-100 dark:border-slate-800 text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Bell className="w-3 h-3 text-blue-600 shrink-0" />
                    <span className="truncate">{n.title}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{n.message}</p>
                </div>
                {!n.acknowledged && (
                  <button
                    type="button"
                    onClick={() => acknowledgeNotification(n.id)}
                    className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold hover:bg-blue-600 hover:text-white transition-colors shrink-0"
                  >
                    Ack
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
