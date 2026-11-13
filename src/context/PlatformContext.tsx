import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
import {
  AccessLogRecord,
  AttendanceRecord,
  AuditLogEntry,
  CSILocalizationEvent,
  CameraEventRecord,
  ConfigHistoryEntry,
  ConfigSettings,
  DeviceRecord,
  EmergencyEventRecord,
  HandRaiseEventRecord,
  HistoryLogRecord,
  LanguageCode,
  NotificationCategory,
  NotificationItem,
  OTAUpdateEntry,
  PageId,
  PlatformUser,
  SeatZone,
  SecurityEventRecord,
  SensorTelemetry,
  StudentRecord,
  SyncQueueItem,
  ToastMessage,
  UserRole,
} from '../types';

export const ROLE_ALLOWED_PAGES: Record<UserRole, PageId[]> = {
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

interface PlatformContextValue {
  currentUser: PlatformUser | null;
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  selectedClassroom: string;
  setSelectedClassroom: (room: string) => void;
  connectionMode: 'LIVE' | 'OFFLINE' | 'SYNCING';
  setConnectionMode: (mode: 'LIVE' | 'OFFLINE' | 'SYNCING') => void;
  offlineDurationSec: number;
  teamId: string;
  users: PlatformUser[];
  setUsers: React.Dispatch<React.SetStateAction<PlatformUser[]>>;
  students: StudentRecord[];
  setStudents: React.Dispatch<React.SetStateAction<StudentRecord[]>>;
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  accessLogs: AccessLogRecord[];
  setAccessLogs: React.Dispatch<React.SetStateAction<AccessLogRecord[]>>;
  securityEvents: SecurityEventRecord[];
  setSecurityEvents: React.Dispatch<React.SetStateAction<SecurityEventRecord[]>>;
  telemetry: SensorTelemetry;
  setTelemetry: React.Dispatch<React.SetStateAction<SensorTelemetry>>;
  telemetrySeries: Array<{ time: string; temperature: number; humidity: number; occupancy: number }>;
  emergencyEvents: EmergencyEventRecord[];
  devices: DeviceRecord[];
  setDevices: React.Dispatch<React.SetStateAction<DeviceRecord[]>>;
  config: ConfigSettings;
  updateConfig: (next: ConfigSettings, actor: string) => { ok: boolean; error?: string };
  configHistory: ConfigHistoryEntry[];
  otaHistory: OTAUpdateEntry[];
  setOtaHistory: React.Dispatch<React.SetStateAction<OTAUpdateEntry[]>>;
  seatZones: SeatZone[];
  setSeatZones: React.Dispatch<React.SetStateAction<SeatZone[]>>;
  cameraEvents: CameraEventRecord[];
  setCameraEvents: React.Dispatch<React.SetStateAction<CameraEventRecord[]>>;
  handRaiseEvents: HandRaiseEventRecord[];
  setHandRaiseEvents: React.Dispatch<React.SetStateAction<HandRaiseEventRecord[]>>;
  csiGrid: number[][];
  setCsiGrid: React.Dispatch<React.SetStateAction<number[][]>>;
  csiHistory: CSILocalizationEvent[];
  setCsiHistory: React.Dispatch<React.SetStateAction<CSILocalizationEvent[]>>;
  cameraCoveredMode: boolean;
  setCameraCoveredMode: React.Dispatch<React.SetStateAction<boolean>>;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  syncQueue: SyncQueueItem[];
  setSyncQueue: React.Dispatch<React.SetStateAction<SyncQueueItem[]>>;
  historyLogs: HistoryLogRecord[];
  auditLogs: AuditLogEntry[];
  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  login: (identifier: string, password: string) => { ok: boolean; error?: string };
  quickLoginRole: (role: UserRole) => void;
  logout: () => void;
  triggerFireEmergency: () => void;
  resetFireEmergency: () => void;
  triggerPanicAlert: () => void;
  resetPanicAlert: () => void;
  unlockDoorTemporary: (reason: string) => void;
  deleteStudentWithAudit: (studentId: string) => void;
  unblockStudentCard: (rfidUid: string) => void;
  simulateFiveFaceMismatches: (rfidUid: string) => void;
  acknowledgeNotification: (id: string) => void;
  addNotification: (category: NotificationCategory, priority: NotificationItem['priority'], title: string, message: string) => void;
  addHistoryLog: (category: HistoryLogRecord['category'], actor: string, status: string, summary: string) => void;
  addAuditLog: (action: string, target: string, details: string) => void;
  toggleOfflineSimulation: () => void;
  runSyncProcess: () => void;
  selectedStudentIdForDetails: string | null;
  setSelectedStudentIdForDetails: (id: string | null) => void;
  selectedDeviceIdForDetails: string | null;
  setSelectedDeviceIdForDetails: (id: string | null) => void;
  sitemapOpen: boolean;
  setSitemapOpen: (open: boolean) => void;
  institutionName: string;
  setInstitutionName: (name: string) => void;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

function nowStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<PlatformUser | null>(null);
  const [activePage, setActivePageState] = useState<PageId>('dashboard');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [selectedClassroom, setSelectedClassroom] = useState('CSE-401');
  const [connectionMode, setConnectionMode] = useState<'LIVE' | 'OFFLINE' | 'SYNCING'>('LIVE');
  const [offlineDurationSec, setOfflineDurationSec] = useState(0);
  const [teamId] = useState('FR04');
  const [institutionName, setInstitutionName] = useState('Bangladesh University of Business & Technology (BUBT)');

  const [users, setUsers] = useState<PlatformUser[]>(INITIAL_USERS);
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [accessLogs, setAccessLogs] = useState<AccessLogRecord[]>(INITIAL_ACCESS_LOGS);
  const [securityEvents, setSecurityEvents] = useState<SecurityEventRecord[]>(INITIAL_SECURITY_EVENTS);
  const [telemetry, setTelemetry] = useState<SensorTelemetry>(INITIAL_TELEMETRY);
  const [telemetrySeries, setTelemetrySeries] = useState(INITIAL_TELEMETRY_SERIES);
  const [emergencyEvents, setEmergencyEvents] = useState<EmergencyEventRecord[]>(INITIAL_EMERGENCY_EVENTS);
  const [devices, setDevices] = useState<DeviceRecord[]>(INITIAL_DEVICES);
  const [config, setConfig] = useState<ConfigSettings>(INITIAL_CONFIG);
  const [configHistory, setConfigHistory] = useState<ConfigHistoryEntry[]>(INITIAL_CONFIG_HISTORY);
  const [otaHistory, setOtaHistory] = useState<OTAUpdateEntry[]>(INITIAL_OTA_HISTORY);
  const [seatZones, setSeatZones] = useState<SeatZone[]>(INITIAL_SEAT_ZONES);
  const [cameraEvents, setCameraEvents] = useState<CameraEventRecord[]>(INITIAL_CAMERA_EVENTS);
  const [handRaiseEvents, setHandRaiseEvents] = useState<HandRaiseEventRecord[]>(INITIAL_HAND_RAISE_EVENTS);
  const [csiGrid, setCsiGrid] = useState<number[][]>(INITIAL_CSI_GRID);
  const [csiHistory, setCsiHistory] = useState<CSILocalizationEvent[]>(INITIAL_CSI_HISTORY);
  const [cameraCoveredMode, setCameraCoveredMode] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(INITIAL_SYNC_QUEUE);
  const [historyLogs, setHistoryLogs] = useState<HistoryLogRecord[]>(INITIAL_HISTORY_LOGS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedStudentIdForDetails, setSelectedStudentIdForDetails] = useState<string | null>(null);
  const [selectedDeviceIdForDetails, setSelectedDeviceIdForDetails] = useState<string | null>(null);
  const [sitemapOpen, setSitemapOpen] = useState(false);

  const setTheme = (nextTheme: 'light' | 'dark') => {
    setThemeState(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const pushToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addNotification = (
    category: NotificationCategory,
    priority: NotificationItem['priority'],
    title: string,
    message: string
  ) => {
    const item: NotificationItem = {
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

  const addHistoryLog = (
    category: HistoryLogRecord['category'],
    actor: string,
    status: string,
    summary: string
  ) => {
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

  const addAuditLog = (action: string, target: string, details: string) => {
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

  const setActivePage = (page: PageId) => {
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

  // Door auto-relock timer (3 seconds) — Fire overrides every other door rule!
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

  // Offline duration counter when offline
  useEffect(() => {
    if (connectionMode === 'OFFLINE') {
      const interval = setInterval(() => {
        setOfflineDurationSec((s) => s + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [connectionMode]);

  // Subtle live demo telemetry heartbeat every 10s when LIVE
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

  const login = (identifier: string, password: string) => {
    const clean = identifier.trim().toLowerCase();
    const matched = users.find(
      (u) => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean
    );
    if (!matched) {
      return { ok: false, error: 'Invalid username/email or password.' };
    }
    if (matched.status !== 'ACTIVE') {
      return { ok: false, error: 'This account has been deactivated by an Administrator.' };
    }
    if ((matched.password ?? 'Password123!') !== password) {
      return { ok: false, error: 'Incorrect password. Please verify your credentials.' };
    }
    const ts = nowStr();
    const updatedUser: PlatformUser = {
      ...matched,
      lastLogin: ts,
      loginHistory: [
        { id: `lh-${Date.now()}`, timestamp: ts, ip: '192.168.1.24', device: 'Web Browser', status: 'SUCCESS' },
        ...matched.loginHistory,
      ],
    };
    setUsers((prev) => prev.map((u) => (u.id === matched.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setActivePageState('dashboard');
    pushToast({ type: 'success', title: `Welcome back, ${updatedUser.name}`, description: `Signed in as ${updatedUser.role}` });
    return { ok: true };
  };

  const quickLoginRole = (role: UserRole) => {
    const found = users.find((u) => u.role === role && u.status === 'ACTIVE');
    if (!found) return;
    setCurrentUser(found);
    setActivePageState('dashboard');
    pushToast({ type: 'success', title: `Demo Session: ${found.name}`, description: `Role: ${role}` });
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

  const unlockDoorTemporary = (reason: string) => {
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

  const deleteStudentWithAudit = (studentId: string) => {
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

  const unblockStudentCard = (rfidUid: string) => {
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

  const simulateFiveFaceMismatches = (rfidUid: string) => {
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

  const acknowledgeNotification = (id: string) => {
    const actor = currentUser?.name ?? 'Staff';
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, acknowledged: true, acknowledgedBy: actor } : n))
    );
  };

  const updateConfig = (next: ConfigSettings, actor: string) => {
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
    const diffs: ConfigHistoryEntry[] = [];
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
    addAuditLog('UPDATE_REMOTE_CONFIG', next.roomId, `Saved remote configuration parameters.`);
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

  const value = useMemo<PlatformContextValue>(
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
      quickLoginRole,
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
