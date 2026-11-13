export type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Guardian';

export type LanguageCode = 'en' | 'bn';

export type PageId =
  | 'dashboard'
  | 'users'
  | 'students'
  | 'attendance'
  | 'safety'
  | 'devices'
  | 'remote-config'
  | 'ota-updates'
  | 'camera'
  | 'hand-raise'
  | 'wifi-csi'
  | 'weather-analytics'
  | 'history-reports'
  | 'ai-assistant'
  | 'offline-sync'
  | 'notifications'
  | 'settings';

export interface LoginHistoryEntry {
  id: string;
  timestamp: string;
  ip: string;
  device: string;
  status: 'SUCCESS' | 'FAILED' | 'LOCKED';
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  avatar: string;
  passwordHash: string;
  linkedStudentId?: string;
  assignedRoom?: string;
  lastLogin: string;
  loginHistory: LoginHistoryEntry[];
}

export interface StudentRecord {
  id: string;
  studentId: string;
  name: string;
  className: string;
  section: string;
  rfidUid: string;
  cardStatus: 'ACTIVE' | 'BLOCKED' | 'UNASSIGNED';
  faceImages: [string | null, string | null, string | null];
  faceConsentSigned: boolean;
  faceConsentDate: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  attendancePercentage: number;
  status: 'ACTIVE' | 'INACTIVE';
  seatZoneId?: string;
  avatar: string;
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT';

export interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  className: string;
  rfidUid: string;
  scanTime: string | null;
  minutesAfterStart: number | null;
  status: AttendanceStatus;
  faceVerified: boolean;
  confidence: number | null;
  correctedBy?: string;
  correctionReason?: string;
}

export interface AccessLogRecord {
  id: string;
  timestamp: string;
  rfidUid: string;
  matchedStudentId: string | null;
  matchedStudentName: string;
  faceResult: 'MATCHED' | 'MISMATCH' | 'SPOOF_DETECTED' | 'NO_FACE';
  verificationStatus: 'VERIFIED' | 'DENIED';
  entryPermission: 'GRANTED' | 'DENIED';
  doorStatus: 'UNLOCKED' | 'LOCKED';
  roomId: string;
}

export interface SecurityEventRecord {
  id: string;
  timestamp: string;
  type: 'FACE_MISMATCH' | 'CARD_SHARING' | 'PHOTO_SPOOFING' | 'CARD_LOCKOUT' | 'INTRUDER_DETECTED' | 'CAMERA_TAMPER';
  severity: 'WARNING' | 'DANGER';
  rfidUid?: string;
  studentName?: string;
  details: string;
  snapshotLabel: string;
  resolved: boolean;
  teacherAlerted: boolean;
}

export interface EmergencyEventRecord {
  id: string;
  timestamp: string;
  type: 'FIRE' | 'PANIC' | 'TEMP_DANGER' | 'DOOR_OVERRIDE';
  message: string;
  roomId: string;
  buzzerActive: boolean;
  doorUnlocked: boolean;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface SensorTelemetry {
  roomId: string;
  temperature: number;
  humidity: number;
  heatIndex: number;
  flameDetected: boolean;
  panicActive: boolean;
  doorStatus: 'LOCKED' | 'UNLOCKED';
  doorUnlockReason: string;
  doorUnlockRemainingSec: number;
  buzzerActive: boolean;
  occupancy: number;
  capacity: number;
  csiPresence: 'EMPTY' | 'OCCUPIED';
  timestamp: string;
}

export interface DeviceRecord {
  id: string;
  roomId: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';
  firmwareVersion: string;
  uptimeSeconds: number;
  rssi: number;
  freeHeapKb: number;
  totalHeapKb: number;
  chipTemp: number;
  lastSeen: string;
  lastDataReceived: string;
  cpuLoadPct: number;
  sensorStatus: 'OK' | 'FAULT';
  cameraStatus: 'OK' | 'COVERED' | 'MOVED' | 'FAULT';
  wifiConnected: boolean;
  mqttConnected: boolean;
  lastRestartReason: string;
  logs: Array<{ id: string; time: string; level: 'INFO' | 'WARN' | 'ERROR'; message: string }>;
}

export interface ConfigSettings {
  roomId: string;
  tempWarningThreshold: number;
  tempDangerThreshold: number;
  samplingIntervalSec: number;
  doorUnlockDurationSec: number;
  buzzerEnabled: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
  nightWatchEnabled: boolean;
}

export interface ConfigHistoryEntry {
  id: string;
  timestamp: string;
  changedBy: string;
  parameter: string;
  oldValue: string;
  newValue: string;
}

export interface OTAUpdateEntry {
  id: string;
  timestamp: string;
  fromVersion: string;
  toVersion: string;
  filename: string;
  checksum: string;
  status: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  rollbackAvailable: boolean;
  initiatedBy: string;
  notes: string;
}

export interface SeatZone {
  id: string;
  label: string;
  row: number;
  col: number;
  occupied: boolean;
  studentName: string | null;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
}

export interface CameraEventRecord {
  id: string;
  timestamp: string;
  camera: 'DOOR' | 'ROOM';
  eventType: 'CAMERA_COVERED' | 'CAMERA_MOVED' | 'INTRUDER_DETECTED' | 'CAPACITY_EXCEEDED' | 'RESTORED';
  details: string;
  snapshotRetained: boolean;
}

export interface HandRaiseEventRecord {
  id: string;
  timestamp: string;
  studentName: string;
  seatLabel: string;
  holdDurationSec: number;
  confidence: number;
  acknowledged: boolean;
}

export interface CSILocalizationEvent {
  id: string;
  timestamp: string;
  zoneRow: number;
  zoneCol: number;
  zoneLabel: string;
  presence: 'EMPTY' | 'OCCUPIED';
  packetRate: number;
  cameraCoveredMode: boolean;
}

export interface HistoryLogRecord {
  id: string;
  timestamp: string;
  category:
    | 'Attendance History'
    | 'RFID Scan History'
    | 'Face Verification History'
    | 'Fire Events'
    | 'Panic Events'
    | 'Temperature History'
    | 'Humidity History'
    | 'Door Access History'
    | 'Entry Granted / Denied'
    | 'Camera Events'
    | 'Intruder Events'
    | 'Hand-Raise Events'
    | 'Device Errors'
    | 'Device Restart History'
    | 'OTA Update History'
    | 'Security Events'
    | 'Configuration Changes'
    | 'Offline / Sync History';
  roomId: string;
  deviceId: string;
  actor: string;
  status: string;
  summary: string;
}

export type NotificationCategory =
  | 'Fire Alert'
  | 'Panic Alert'
  | 'Temperature Warning'
  | 'Temperature Danger'
  | 'Student Absent'
  | 'Student Late'
  | 'Face Mismatch'
  | 'Intruder Detected'
  | 'Hand Raised'
  | 'Device Offline'
  | 'Camera Fault'
  | 'OTA Update'
  | 'Sync Completed';

export interface NotificationItem {
  id: string;
  timestamp: string;
  category: NotificationCategory;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  read: boolean;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

export interface SyncQueueItem {
  id: string;
  originalTimestamp: string;
  recordType: 'ATTENDANCE' | 'TELEMETRY' | 'SECURITY' | 'EMERGENCY';
  payloadSummary: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED' | 'INCOMPLETE_QUARANTINED';
  errorReason?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  action: string;
  target: string;
  details: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}
