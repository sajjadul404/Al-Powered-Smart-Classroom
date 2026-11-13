import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  Lock,
  Radio,
  RefreshCw,
  ShieldAlert,
  WifiOff,
  XCircle,
} from 'lucide-react';

const VARIANT_STYLES = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  amber: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
  blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

function getStyleKey(status) {
  const s = status.toUpperCase();
  if (['SAFE', 'ONLINE', 'SUCCESS', 'PRESENT', 'ACTIVE', 'GRANTED', 'VERIFIED', 'OK', 'LIVE', 'SYNCED', 'RESOLVED', 'RESTORED'].includes(s)) {
    return 'green';
  }
  if (['WARNING', 'LATE', 'PENDING', 'CAMERA_MOVED', 'PHOTO_SPOOFING', 'STALE', 'INCOMPLETE_QUARANTINED'].includes(s)) {
    return 'amber';
  }
  if (['DANGER', 'FIRE', 'PANIC', 'ERROR', 'ABSENT', 'OFFLINE', 'BLOCKED', 'DENIED', 'FAILED', 'CARD_LOCKOUT', 'MISMATCH', 'INTRUDER_DETECTED', 'CAMERA_COVERED'].includes(s)) {
    return 'red';
  }
  if (['SYNCING', 'OCCUPIED', 'UNLOCKED'].includes(s)) {
    return 'blue';
  }
  return 'slate';
}

function getIcon(status) {
  const s = status.toUpperCase();
  if (s === 'FIRE') return <Flame className="w-3.5 h-3.5 shrink-0" />;
  if (s === 'PANIC' || s === 'CARD_LOCKOUT' || s === 'INTRUDER_DETECTED') return <ShieldAlert className="w-3.5 h-3.5 shrink-0" />;
  if (s === 'OFFLINE') return <WifiOff className="w-3.5 h-3.5 shrink-0" />;
  if (s === 'SYNCING') return <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />;
  if (s === 'ONLINE' || s === 'LIVE') return <Radio className="w-3.5 h-3.5 shrink-0" />;
  if (s === 'LOCKED' || s === 'BLOCKED') return <Lock className="w-3.5 h-3.5 shrink-0" />;
  const key = getStyleKey(s);
  if (key === 'green') return <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />;
  if (key === 'amber') return <AlertTriangle className="w-3.5 h-3.5 shrink-0" />;
  if (key === 'red') return <XCircle className="w-3.5 h-3.5 shrink-0" />;
  return null;
}

export function StatusBadge({ status, label }) {
  const styleKey = getStyleKey(status);
  const icon = getIcon(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-md border whitespace-nowrap shrink-0 ${VARIANT_STYLES[styleKey]}`}
    >
      {icon}
      <span>{label ?? status.replace(/_/g, ' ')}</span>
    </span>
  );
}
