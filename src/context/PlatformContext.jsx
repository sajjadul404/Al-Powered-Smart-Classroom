import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  INITIAL_ACCESS_LOGS,
  INITIAL_ATTENDANCE,
  INITIAL_AUDIT_LOGS,
  INITIAL_CAMERA_EVENTS,
  INITIAL_CONFIG,
  INITIAL_CONFIG_HISTORY,
  INITIAL_CSI_GRID,
  INITIAL_CSI_HISTORY,
  INITIAL_DEVICES,
  INITIAL_EMERGENCY_EVENTS,
  INITIAL_HAND_RAISE_EVENTS,
  INITIAL_HISTORY_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_OTA_HISTORY,
  INITIAL_SEAT_ZONES,
  INITIAL_SECURITY_EVENTS,
  INITIAL_STUDENTS,
  INITIAL_SYNC_QUEUE,
  INITIAL_TELEMETRY,
  INITIAL_TELEMETRY_SERIES,
  INITIAL_USERS,
} from '../data/seedData';
import { hashPassword, verifyPassword } from '../utils/passwordHash.js';

const USERS_STORAGE_KEY = 'fastrobox_users_v2';

function loadInitialUsers() {
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return INITIAL_USERS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_USERS;
    return parsed
      .filter((u) => u && typeof u.email === 'string' && typeof u.passwordHash === 'string' && u.passwordHash.startsWith('pbkdf2_sha256$'))
      .map(({ password: _stripped, ...safeUser }) => safeUser);
  } catch {
    return INITIAL_USERS;
  }
}

export const ROLE_ALLOWED_PAGES = {
  Admin: [
    'dashboard',
    'users',
    'students',
    'attendance',
    'safety',
    'devices',
    'remote-config',
    'ota-updates',
    'camera',
    'hand-raise',
    'wifi-csi',
    'weather-analytics',
    'history-reports',
    'ai-assistant',
    'offline-sync',
    'notifications',
    'settings',
  ],
  Teacher: [
    'dashboard',
    'students',
    'attendance',
    'safety',
    'camera',
    'hand-raise',
    'wifi-csi',
    'weather-analytics',
    'history-reports',
    'ai-assistant',
    'notifications',
    'settings',
  ],
  Student: ['dashboard', 'notifications', 'settings'],
  Guardian: ['dashboard', 'notifications', 'settings'],
};

const PlatformContext = createContext(null);

function nowStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function PlatformProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePageState] = useState('dashboard');
  const [language, setLanguage] = useState('en');
  const [theme, setThemeState] = useState('light');
  const [selectedClassroom, setSelectedClassroom] = useState('CSE-401');
  const [connectionMode, setConnectionMode] = useState('LIVE');
  const [offlineDurationSec, setOfflineDurationSec] = useState(0);
  const [teamId] = useState('FR04');
  const [institutionName, setInstitutionName] = useState('Bangladesh University of Business & Technology (BUBT)');

  const [users, setUsersState] = useState(loadInitialUsers);

  const setUsers = (updater) => {
    setUsersState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const sanitized = next.map(({ password: _stripped, ...safeUser }) => safeUser);
      try {
        window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(sanitized));
      } catch {
        // Ignore storage quota errors
      }
      return sanitized;
    });
  };
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [accessLogs, setAccessLogs] = useState(INITIAL_ACCESS_LOGS);
  const [securityEvents, setSecurityEvents] = useState(INITIAL_SECURITY_EVENTS);
  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY);
  const [telemetrySeries, setTelemetrySeries] = useState(INITIAL_TELEMETRY_SERIES);
  const [emergencyEvents, setEmergencyEvents] = useState(INITIAL_EMERGENCY_EVENTS);
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [configHistory, setConfigHistory] = useState(INITIAL_CONFIG_HISTORY);
  const [otaHistory, setOtaHistory] = useState(INITIAL_OTA_HISTORY);
  const [seatZones, setSeatZones] = useState(INITIAL_SEAT_ZONES);
  const [cameraEvents, setCameraEvents] = useState(INITIAL_CAMERA_EVENTS);
  const [handRaiseEvents, setHandRaiseEvents] = useState(INITIAL_HAND_RAISE_EVENTS);
  const [csiGrid, setCsiGrid] = useState(INITIAL_CSI_GRID);
  const [csiHistory, setCsiHistory] = useState(INITIAL_CSI_HISTORY);
  const [cameraCoveredMode, setCameraCoveredMode] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [syncQueue, setSyncQueue] = useState(INITIAL_SYNC_QUEUE);
  const [historyLogs, setHistoryLogs] = useState(INITIAL_HISTORY_LOGS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [toasts, setToasts] = useState([]);
  const [selectedStudentIdForDetails, setSelectedStudentIdForDetails] = useState(null);
  const [selectedDeviceIdForDetails, setSelectedDeviceIdForDetails] = useState(null);
  const [sitemapOpen, setSitemapOpen] = useState(false);

  const setTheme = (nextTheme) => {
    setThemeState(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const pushToast = (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addNotification = (category, priority, title, message) => {
    const item = {
      id: `not-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: nowStr(),
      category,
      priority,
      title,
      message,
      read: false,
      acknowledged: false,
    };
    setNotifications((prev) => [item, ...prev]);
  };

  const addHistoryLog = (category, actor, status, summary) => {
    setHistoryLogs((prev) => [
      {
        id: `his-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        timestamp: nowStr(),
        category,
        roomId: selectedClassroom,
        deviceId: devices[0]?.id ?? 'ESP32-S3-CAM-01',
        actor,
        status,
        summary,
      },
      ...prev,
    ]);
  };

  const addAuditLog = (action, target, details) => {
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: nowStr(),
        actor: currentUser?.name ?? 'System',
        role: currentUser?.role ?? 'Admin',
        action,
        target,
        details,
      },
      ...prev,
    ]);
  };

  const setActivePage = (page) => {
    if (!currentUser) return;
    const allowed = ROLE_ALLOWED_PAGES[currentUser.role];
    if (!allowed.includes(page)) {
      pushToast({
        type: 'error',
        title: 'Access Restricted',
        description: `${currentUser.role} role cannot access ${page}.`,
      });
      return;
    }
    setActivePageState(page);
  };

  useEffect(() => {
    if (telemetry.doorStatus === 'UNLOCKED' && !telemetry.flameDetected && telemetry.doorUnlockRemainingSec > 0) {
      const timer = setTimeout(() => {
        setTelemetry((prev) => {
          if (prev.flameDetected) return prev;
          const nextRemaining = prev.doorUnlockRemainingSec - 1;
          if (nextRemaining <= 0) {
            return {
              ...prev,
              doorStatus: 'LOCKED',
              doorUnlockRemainingSec: 0,
              doorUnlockReason: 'Auto-relocked after 3s window',
            };
          }
          return { ...prev, doorUnlockRemainingSec: nextRemaining };
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [telemetry.doorStatus, telemetry.flameDetected, telemetry.doorUnlockRemainingSec]);

  useEffect(() => {
    if (connectionMode === 'OFFLINE') {
      const interval = setInterval(() => {
        setOfflineDurationSec((s) => s + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [connectionMode]);

  useEffect(() => {
    if (connectionMode !== 'LIVE') return;
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const delta = (Math.random() - 0.5) * 0.3;
        const nextTemp = prev.flameDetected ? prev.temperature : Number(Math.max(23.5, Math.min(39.5, prev.temperature + delta)).toFixed(1));
        const nextHum = Math.round(Math.max(45, Math.min(82, prev.humidity + (Math.random() - 0.5) * 1.6)));
        const heatIndex = Number((nextTemp + (nextHum - 50) * 0.08).toFixed(1));
        return {
          ...prev,
          temperature: nextTemp,
          humidity: nextHum,
          heatIndex,
          timestamp: nowStr(),
        };
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [connectionMode]);

  const login = async (identifier, password, expectedRole) => {
    const clean = identifier.trim().toLowerCase();
    const matched = users.find(
      (u) => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean
    );
    if (!matched) {
      return { ok: false, error: 'Invalid username/email or password.' };
    }
    if (expectedRole && matched.role !== expectedRole) {
      return { ok: false, error: `Selected role (${expectedRole}) does not match this account (${matched.role}).` };
    }
    if (matched.status !== 'ACTIVE') {
      return { ok: false, error: 'This account has been deactivated by an Administrator.' };
    }

    const isValid = await verifyPassword(password, matched.passwordHash);
    if (!isValid) {
      const failTs = nowStr();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === matched.id
            ? {
                ...u,
                loginHistory: [
                  { id: `lh-${Date.now()}`, timestamp: failTs, ip: '192.168.1.24', device: 'Web Browser', status: 'FAILED' },
                  ...(u.loginHistory ?? []),
                ],
              }
            : u
        )
      );
      return { ok: false, error: 'Incorrect password. Please verify your credentials.' };
    }

    const ts = nowStr();
    const updatedUser = {
      ...matched,
      lastLogin: ts,
      loginHistory: [
        { id: `lh-${Date.now()}`, timestamp: ts, ip: '192.168.1.24', device: 'Web Browser', status: 'SUCCESS' },
        ...(matched.loginHistory ?? []),
      ],
    };
    setUsers((prev) => prev.map((u) => (u.id === matched.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setActivePageState('dashboard');
    pushToast({ type: 'success', title: `Welcome back, ${updatedUser.name}`, description: `Signed in as ${updatedUser.role}` });
    return { ok: true };
  };

  const changeOwnPassword = async (currentPassword, newPassword) => {
    if (!currentUser) {
      return { ok: false, error: 'No active session.' };
    }
    const freshUser = users.find((u) => u.id === currentUser.id) ?? currentUser;
    const validCurrent = await verifyPassword(currentPassword, freshUser.passwordHash);
    if (!validCurrent) {
      return { ok: false, error: 'Current password is incorrect.' };
    }
    if (newPassword.length < 6) {
      return { ok: false, error: 'New password must be at least 6 characters.' };
    }
    const nextHash = await hashPassword(newPassword);
    setUsers((prev) =>
      prev.map((u) => (u.id === freshUser.id ? { ...u, passwordHash: nextHash } : u))
    );
    setCurrentUser((prev) => (prev ? { ...prev, passwordHash: nextHash } : prev));
    addAuditLog('CHANGE_OWN_PASSWORD', freshUser.email, 'User updated their own PBKDF2-SHA256 password hash');
    return { ok: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setActivePageState('dashboard');
  };

  const triggerFireEmergency = () => {
    const ts = nowStr();
    setTelemetry((prev) => ({
      ...prev,
      flameDetected: true,
      temperature: Math.max(prev.temperature, 44.5),
      heatIndex: 47.2,
      buzzerActive: true,
      doorStatus: 'UNLOCKED',
      doorUnlockReason: 'FIRE OVERRIDE: Door unlocked until Teacher/Admin resets fire',
      doorUnlockRemainingSec: 0,
      timestamp: ts,
    }));
    setTelemetrySeries((prev) => [...prev.slice(-8), { time: ts.slice(11, 16), temperature: 44.5, humidity: telemetry.humidity, occupancy: telemetry.occupancy }]);
    setEmergencyEvents((prev) => [
      {
        id: `emg-${Date.now()}`,
        timestamp: ts,
        type: 'FIRE',
        message: 'IR Flame Sensor triggered in Room CSE-401. Buzzer active and door forced UNLOCKED.',
        roomId: selectedClassroom,
        buzzerActive: true,
        doorUnlocked: true,
        resolved: false,
      },
      ...prev,
    ]);
    addNotification('Fire Alert', 'CRITICAL', 'FIRE DETECTED — Room CSE-401', 'Flame sensor triggered! Door unlocked under emergency override.');
    addHistoryLog('Fire Events', 'IR Flame Sensor', 'FIRE', 'Fire detected; buzzer activated and door forced unlocked');
    pushToast({ type: 'error', title: 'FIRE DETECTED', description: 'Emergency override unlocked classroom door.' });
  };

  const resetFireEmergency = () => {
    const actor = currentUser?.name ?? 'Authorized Staff';
    const ts = nowStr();
    setTelemetry((prev) => ({
      ...prev,
      flameDetected: false,
      temperature: 27.6,
      heatIndex: 29.1,
      buzzerActive: prev.panicActive,
      doorStatus: 'LOCKED',
      doorUnlockReason: `Fire emergency reset by ${actor}`,
      doorUnlockRemainingSec: 0,
      timestamp: ts,
    }));
    setEmergencyEvents((prev) =>
      prev.map((e) => (e.type === 'FIRE' && !e.resolved ? { ...e, resolved: true, resolvedBy: actor, resolvedAt: ts, buzzerActive: false } : e))
    );
    addHistoryLog('Fire Events', actor, 'SAFE', `Fire alarm reset and door restored to LOCKED by ${actor}`);
    addAuditLog('RESET_FIRE', selectedClassroom, `Fire emergency cleared by ${actor}`);
    pushToast({ type: 'success', title: 'Fire State Reset', description: 'Classroom door relocked and flame sensor cleared.' });
  };

  const triggerPanicAlert = () => {
    const ts = nowStr();
    setTelemetry((prev) => ({
      ...prev,
      panicActive: true,
      buzzerActive: true,
      timestamp: ts,
    }));
    setEmergencyEvents((prev) => [
      {
        id: `emg-${Date.now()}`,
        timestamp: ts,
        type: 'PANIC',
        message: 'Hardware Panic Button pressed inside Room CSE-401.',
        roomId: selectedClassroom,
        buzzerActive: true,
        doorUnlocked: telemetry.doorStatus === 'UNLOCKED',
        resolved: false,
      },
      ...prev,
    ]);
    addNotification('Panic Alert', 'CRITICAL', 'PANIC ALERT — Room CSE-401', 'Classroom panic button triggered. Immediate assistance requested.');
    addHistoryLog('Panic Events', 'Panic Button', 'PANIC', 'Panic alert triggered in CSE-401');
    pushToast({ type: 'error', title: 'PANIC ALERT ACTIVE', description: 'Emergency notification dispatched to Admin & Teachers.' });
  };

  const resetPanicAlert = () => {
    const actor = currentUser?.name ?? 'Authorized Staff';
    const ts = nowStr();
    setTelemetry((prev) => ({
      ...prev,
      panicActive: false,
      buzzerActive: prev.flameDetected,
      timestamp: ts,
    }));
    setEmergencyEvents((prev) =>
      prev.map((e) => (e.type === 'PANIC' && !e.resolved ? { ...e, resolved: true, resolvedBy: actor, resolvedAt: ts, buzzerActive: false } : e))
    );
    addHistoryLog('Panic Events', actor, 'RESOLVED', `Panic alert acknowledged and cleared by ${actor}`);
    pushToast({ type: 'success', title: 'Panic Alert Cleared', description: `Acknowledged by ${actor}` });
  };

  const unlockDoorTemporary = (reason) => {
    setTelemetry((prev) => ({
      ...prev,
      doorStatus: 'UNLOCKED',
      doorUnlockReason: reason,
      doorUnlockRemainingSec: prev.flameDetected ? 0 : config.doorUnlockDurationSec,
      timestamp: nowStr(),
    }));
    addHistoryLog('Door Access History', currentUser?.name ?? 'System', 'UNLOCKED', `${reason} (duration: ${config.doorUnlockDurationSec}s)`);
    pushToast({ type: 'info', title: 'Door Unlocked', description: `${reason} (${config.doorUnlockDurationSec}s)` });
  };

  const deleteStudentWithAudit = (studentId) => {
    const target = students.find((s) => s.id === studentId || s.studentId === studentId);
    if (!target) return;
    setStudents((prev) => prev.filter((s) => s.id !== target.id));
    setAttendance((prev) => prev.filter((a) => a.studentId !== target.studentId));
    addAuditLog(
      'DELETE_STUDENT_BIOMETRIC_PURGE',
      `${target.name} (${target.studentId})`,
      `Deleted student record, RFID card mapping (${target.rfidUid}), 3 face embeddings, and private security snapshots.`
    );
    addHistoryLog('Security Events', currentUser?.name ?? 'Admin', 'DELETED', `Purged student ${target.name} and associated biometric embeddings`);
    pushToast({
      type: 'warning',
      title: 'Student & Biometrics Deleted',
      description: `Removed ${target.name}, RFID ${target.rfidUid}, and face embeddings. Audit log recorded.`,
    });
  };

  const unblockStudentCard = (rfidUid) => {
    setStudents((prev) =>
      prev.map((s) => (s.rfidUid === rfidUid ? { ...s, cardStatus: 'ACTIVE' } : s))
    );
    setSecurityEvents((prev) =>
      prev.map((ev) => (ev.rfidUid === rfidUid ? { ...ev, resolved: true } : ev))
    );
    addAuditLog('UNBLOCK_RFID_CARD', rfidUid, `Admin unblocked RFID card ${rfidUid} following face mismatch lockout.`);
    addHistoryLog('Security Events', currentUser?.name ?? 'Admin', 'UNBLOCKED', `RFID card ${rfidUid} unblocked by Admin`);
    pushToast({ type: 'success', title: 'Card Unblocked', description: `RFID ${rfidUid} is active again.` });
  };

  const simulateFiveFaceMismatches = (rfidUid) => {
    const student = students.find((s) => s.rfidUid === rfidUid);
    const name = student?.name ?? 'Unknown Holder';
    setStudents((prev) => prev.map((s) => (s.rfidUid === rfidUid ? { ...s, cardStatus: 'BLOCKED' } : s)));
    const ts = nowStr();
    setSecurityEvents((prev) => [
      {
        id: `sec-${Date.now()}`,
        timestamp: ts,
        type: 'CARD_LOCKOUT',
        severity: 'DANGER',
        rfidUid,
        studentName: name,
        details: `5 face mismatches within 2 minutes detected on RFID ${rfidUid}. Card blocked automatically pending Admin unblock.`,
        snapshotLabel: `DOOR_CAM_LOCKOUT_${Date.now()}.enc`,
        resolved: false,
        teacherAlerted: true,
      },
      ...prev,
    ]);
    setAccessLogs((prev) => [
      {
        id: `acc-${Date.now()}`,
        timestamp: ts,
        rfidUid,
        matchedStudentId: student?.studentId ?? null,
        matchedStudentName: name,
        faceResult: 'MISMATCH',
        verificationStatus: 'DENIED',
        entryPermission: 'DENIED',
        doorStatus: 'LOCKED',
        roomId: selectedClassroom,
      },
      ...prev,
    ]);
    addNotification('Face Mismatch', 'HIGH', `Card Lockout Warning (${rfidUid})`, `5 face mismatches within 2 minutes for ${name}.`);
    pushToast({ type: 'error', title: 'Card Locked (5 Mismatches)', description: `${rfidUid} blocked for 2-minute threshold violation.` });
  };

  const acknowledgeNotification = (id) => {
    const actor = currentUser?.name ?? 'Staff';
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, acknowledged: true, acknowledgedBy: actor } : n))
    );
  };

  const updateConfig = (next, actor) => {
    if (next.tempWarningThreshold >= next.tempDangerThreshold) {
      return { ok: false, error: 'Warning threshold must be strictly lower than Danger threshold.' };
    }
    if (next.tempWarningThreshold < 15 || next.tempDangerThreshold > 60) {
      return { ok: false, error: 'Temperature thresholds must remain within safe operational bounds (15°C – 60°C).' };
    }
    if (next.doorUnlockDurationSec < 1 || next.doorUnlockDurationSec > 30) {
      return { ok: false, error: 'Door unlock duration must be between 1 and 30 seconds.' };
    }
    const ts = nowStr();
    const diffs = [];
    if (next.tempWarningThreshold !== config.tempWarningThreshold) {
      diffs.push({
        id: `cfg-${Date.now()}-1`,
        timestamp: ts,
        changedBy: actor,
        parameter: 'Temperature Warning Threshold',
        oldValue: `${config.tempWarningThreshold}°C`,
        newValue: `${next.tempWarningThreshold}°C`,
      });
    }
    if (next.tempDangerThreshold !== config.tempDangerThreshold) {
      diffs.push({
        id: `cfg-${Date.now()}-2`,
        timestamp: ts,
        changedBy: actor,
        parameter: 'Temperature Danger Threshold',
        oldValue: `${config.tempDangerThreshold}°C`,
        newValue: `${next.tempDangerThreshold}°C`,
      });
    }
    if (next.roomId !== config.roomId) {
      diffs.push({
        id: `cfg-${Date.now()}-3`,
        timestamp: ts,
        changedBy: actor,
        parameter: 'Room ID',
        oldValue: config.roomId,
        newValue: next.roomId,
      });
    }
    if (diffs.length === 0) {
      diffs.push({
        id: `cfg-${Date.now()}-4`,
        timestamp: ts,
        changedBy: actor,
        parameter: 'Device & Notification Profile',
        oldValue: 'Previous',
        newValue: 'Updated',
      });
    }
    setConfig(next);
    setConfigHistory((prev) => [...diffs, ...prev]);
    addHistoryLog('Configuration Changes', actor, 'SAVED', `Updated configuration for ${next.roomId}`);
    addAuditLog('UPDATE_REMOTE_CONFIG', next.roomId, 'Saved remote configuration parameters.');
    return { ok: true };
  };

  const toggleOfflineSimulation = () => {
    if (connectionMode === 'LIVE') {
      setConnectionMode('OFFLINE');
      setOfflineDurationSec(125);
      setDevices((prev) => prev.map((d, i) => (i === 0 ? { ...d, status: 'OFFLINE', wifiConnected: false, mqttConnected: false } : d)));
      setSyncQueue((prev) => [
        {
          id: `sq-${Date.now()}-1`,
          originalTimestamp: nowStr(),
          recordType: 'ATTENDANCE',
          payloadSummary: 'Offline RFID scan D7:30:F1:88 (Tanvir Hossain)',
          status: 'PENDING',
        },
        {
          id: `sq-${Date.now()}-2`,
          originalTimestamp: nowStr(),
          recordType: 'TELEMETRY',
          payloadSummary: 'Buffered DHT11 temp=27.9C, hum=62%',
          status: 'PENDING',
        },
        ...prev,
      ]);
      addNotification('Device Offline', 'HIGH', 'ESP32-S3-CAM-01 Offline', `Local AP SmartRoom-${teamId} started at 192.168.10.1 after 120s without Wi-Fi.`);
      pushToast({ type: 'warning', title: 'Device Switched to Offline Mode', description: `SoftAP SmartRoom-${teamId} active at 192.168.10.1` });
    } else {
      runSyncProcess();
    }
  };

  const runSyncProcess = () => {
    setConnectionMode('SYNCING');
    setDevices((prev) => prev.map((d, i) => (i === 0 ? { ...d, status: 'ONLINE', wifiConnected: true, mqttConnected: true, lastSeen: nowStr() } : d)));
    setTimeout(() => {
      setSyncQueue((prev) =>
        prev.map((item) => (item.status === 'PENDING' || item.status === 'FAILED' ? { ...item, status: 'SYNCED', errorReason: undefined } : item))
      );
      setConnectionMode('LIVE');
      setOfflineDurationSec(0);
      addNotification('Sync Completed', 'LOW', 'Offline Buffer Synchronized', 'All queued records uploaded oldest-first with original timestamps preserved.');
      addHistoryLog('Offline / Sync History', 'ESP32-S3-CAM-01', 'SYNCED', 'Uploaded buffered records oldest-first without duplicates');
      pushToast({ type: 'success', title: 'Synchronization Complete', description: 'All pending offline records merged safely.' });
    }, 1800);
  };

  const value = useMemo(
    () => ({
      currentUser,
      activePage,
      setActivePage,
      language,
      setLanguage,
      theme,
      setTheme,
      selectedClassroom,
      setSelectedClassroom,
      connectionMode,
      setConnectionMode,
      offlineDurationSec,
      teamId,
      users,
      setUsers,
      students,
      setStudents,
      attendance,
      setAttendance,
      accessLogs,
      setAccessLogs,
      securityEvents,
      setSecurityEvents,
      telemetry,
      setTelemetry,
      telemetrySeries,
      emergencyEvents,
      devices,
      setDevices,
      config,
      updateConfig,
      configHistory,
      otaHistory,
      setOtaHistory,
      seatZones,
      setSeatZones,
      cameraEvents,
      setCameraEvents,
      handRaiseEvents,
      setHandRaiseEvents,
      csiGrid,
      setCsiGrid,
      csiHistory,
      setCsiHistory,
      cameraCoveredMode,
      setCameraCoveredMode,
      notifications,
      setNotifications,
      syncQueue,
      setSyncQueue,
      historyLogs,
      auditLogs,
      toasts,
      pushToast,
      dismissToast,
      login,
      changeOwnPassword,
      logout,
      triggerFireEmergency,
      resetFireEmergency,
      triggerPanicAlert,
      resetPanicAlert,
      unlockDoorTemporary,
      deleteStudentWithAudit,
      unblockStudentCard,
      simulateFiveFaceMismatches,
      acknowledgeNotification,
      addNotification,
      addHistoryLog,
      addAuditLog,
      toggleOfflineSimulation,
      runSyncProcess,
      selectedStudentIdForDetails,
      setSelectedStudentIdForDetails,
      selectedDeviceIdForDetails,
      setSelectedDeviceIdForDetails,
      sitemapOpen,
      setSitemapOpen,
      institutionName,
      setInstitutionName,
    }),
    [
      currentUser,
      activePage,
      language,
      theme,
      selectedClassroom,
      connectionMode,
      offlineDurationSec,
      teamId,
      users,
      students,
      attendance,
      accessLogs,
      securityEvents,
      telemetry,
      telemetrySeries,
      emergencyEvents,
      devices,
      config,
      configHistory,
      otaHistory,
      seatZones,
      cameraEvents,
      handRaiseEvents,
      csiGrid,
      csiHistory,
      cameraCoveredMode,
      notifications,
      syncQueue,
      historyLogs,
      auditLogs,
      toasts,
      selectedStudentIdForDetails,
      selectedDeviceIdForDetails,
      sitemapOpen,
      institutionName,
    ]
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider');
  return ctx;
}
