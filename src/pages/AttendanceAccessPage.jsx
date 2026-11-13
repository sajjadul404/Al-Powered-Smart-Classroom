import { useState } from 'react';
import { AlertTriangle, Camera, CreditCard, Edit3, Lock, Search, ShieldAlert, Unlock } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext.jsx';
import { ASSETS } from '../data/seedData';
import { Modal } from '../components/ui/Modal.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export function AttendanceAccessPage() {
  const {
    attendance,
    setAttendance,
    accessLogs,
    setAccessLogs,
    securityEvents,
    students,
    currentUser,
    unblockStudentCard,
    simulateFiveFaceMismatches,
    unlockDoorTemporary,
    pushToast,
    addHistoryLog,
    addAuditLog,
  } = usePlatform();

  const [activeTab, setActiveTab] = useState('Attendance');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('2026-11-12');
  const [correctingRow, setCorrectingRow] = useState(null);
  const [correctionStatus, setCorrectionStatus] = useState('PRESENT');
  const [correctionReason, setCorrectionReason] = useState('');
  const [snapshotPreview, setSnapshotPreview] = useState(null);

  const isAdmin = currentUser?.role === 'Admin';
  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const lateCount = attendance.filter((a) => a.status === 'LATE').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const grantedCount = accessLogs.filter((l) => l.entryPermission === 'GRANTED').length;
  const deniedCount = accessLogs.filter((l) => l.entryPermission === 'DENIED').length;

  const lockedCards = students.filter((s) => s.cardStatus === 'BLOCKED');

  const filteredAttendance = attendance.filter((a) => {
    const q = search.toLowerCase();
    const matchText =
      a.studentName.toLowerCase().includes(q) ||
      a.studentId.toLowerCase().includes(q) ||
      a.rfidUid.toLowerCase().includes(q);
    const matchClass = classFilter === 'ALL' || a.className === classFilter;
    const matchDate = !dateFilter || a.date === dateFilter;
    return matchText && matchClass && matchDate;
  });

  const handleSimulateValidScan = () => {
    const candidate = attendance.find((a) => a.status === 'ABSENT');
    if (!candidate) {
      pushToast({ type: 'info', title: 'Duplicate Attendance Prevented', description: 'All enrolled students already have attendance logged for this session.' });
      return;
    }
    const stu = students.find((s) => s.studentId === candidate.studentId);
    if (stu?.cardStatus === 'BLOCKED') {
      pushToast({ type: 'error', title: 'Entry Denied — Card Blocked', description: `RFID ${stu.rfidUid} is locked due to face mismatch threshold.` });
      return;
    }
    const nowTime = new Date().toTimeString().slice(0, 8);
    setAttendance((prev) =>
      prev.map((a) =>
        a.id === candidate.id
          ? { ...a, scanTime: nowTime, minutesAfterStart: 11, status: 'PRESENT', faceVerified: true, confidence: 96.9 }
          : a
      )
    );
    setAccessLogs((prev) => [
      {
        id: `acc-${Date.now()}`,
        timestamp: `${dateFilter} ${nowTime}`,
        rfidUid: candidate.rfidUid,
        matchedStudentId: candidate.studentId,
        matchedStudentName: candidate.studentName,
        faceResult: 'MATCHED',
        verificationStatus: 'VERIFIED',
        entryPermission: 'GRANTED',
        doorStatus: 'UNLOCKED',
        roomId: candidate.className,
      },
      ...prev,
    ]);
    unlockDoorTemporary(`Verified RFID + Face Entry (${candidate.studentName})`);
    addHistoryLog('Attendance History', candidate.studentName, 'PRESENT', `RFID ${candidate.rfidUid} + Face matched (96.9%)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Attendance & Access Control</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rules: Present ≤ 15 min · Late 15–45 min · Absent &gt; 45 min · Duplicate scans prevented · 5 mismatches in 2m locks card
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateValidScan}
            className="px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            Simulate RFID + Face Check-In
          </button>
          <button
            type="button"
            onClick={() => simulateFiveFaceMismatches('D7:30:F1:88')}
            className="px-3.5 py-2 rounded-lg border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            Test 5 Mismatches Lockout
          </button>
        </div>
      </div>

      {lockedCards.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900 dark:text-red-200">
                Card Lockout Warning — {lockedCards.length} RFID Card(s) Blocked
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                5 consecutive face mismatches within 2 minutes triggered automatic hardware lockout:{' '}
                {lockedCards.map((c) => `${c.name} (${c.rfidUid})`).join(', ')}
              </p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              {lockedCards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => unblockStudentCard(c.rfidUid)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unblock {c.rfidUid}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Present</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-emerald-600 mt-1">{presentCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Late</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-amber-600 mt-1">{lateCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Absent</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-red-600 mt-1">{absentCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Entry Granted</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1">{grantedCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Entry Denied</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-red-600 mt-1">{deniedCount}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          {['Attendance', 'Access Logs', 'Security Events'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or RFID..."
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
          <input
            type="date"
            aria-label="Filter attendance date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          <select
            aria-label="Filter class"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="ALL">All Classes</option>
            <option value="CSE-401">CSE-401</option>
            <option value="CSE-402">CSE-402</option>
          </select>
        </div>
      </div>

      {activeTab === 'Attendance' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Student</th>
                  <th className="text-left px-4 py-3 font-semibold">Class</th>
                  <th className="text-left px-4 py-3 font-semibold">RFID UID</th>
                  <th className="text-left px-4 py-3 font-semibold">Scan Time</th>
                  <th className="text-left px-4 py-3 font-semibold">Face Check</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAttendance.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{a.studentName}</p>
                      <p className="text-xs font-mono text-slate-500 tabular-nums">{a.studentId}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">{a.className}</td>
                    <td className="px-4 py-3 font-mono text-xs">{a.rfidUid}</td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums">
                      {a.scanTime ? `${a.scanTime} (+${a.minutesAfterStart}m)` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {a.faceVerified ? `Matched (${a.confidence}%)` : 'Not Verified'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setCorrectingRow(a);
                          setCorrectionStatus(a.status);
                          setCorrectionReason(a.correctionReason ?? '');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Correct</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Access Logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Timestamp</th>
                  <th className="text-left px-4 py-3 font-semibold">RFID Card UID</th>
                  <th className="text-left px-4 py-3 font-semibold">Matched Student</th>
                  <th className="text-left px-4 py-3 font-semibold">Face Result</th>
                  <th className="text-left px-4 py-3 font-semibold">Verification</th>
                  <th className="text-left px-4 py-3 font-semibold">Permission</th>
                  <th className="text-left px-4 py-3 font-semibold">Door Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {accessLogs
                  .filter((l) => l.matchedStudentName.toLowerCase().includes(search.toLowerCase()) || l.rfidUid.toLowerCase().includes(search.toLowerCase()))
                  .map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono text-xs tabular-nums">{l.timestamp}</td>
                      <td className="px-4 py-3 font-mono text-xs flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        {l.rfidUid}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold">{l.matchedStudentName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={l.faceResult === 'MATCHED' ? 'VERIFIED' : 'MISMATCH'} label={l.faceResult} />
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={l.verificationStatus} /></td>
                      <td className="px-4 py-3"><StatusBadge status={l.entryPermission} /></td>
                      <td className="px-4 py-3"><StatusBadge status={l.doorStatus} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Security Events' && (
        <div className="space-y-3">
          {securityEvents.map((ev) => (
            <div
              key={ev.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span className="font-display text-sm font-bold">{ev.type.replace(/_/g, ' ')}</span>
                  <StatusBadge status={ev.resolved ? 'RESOLVED' : ev.severity} />
                  <span className="font-mono text-xs text-slate-500 tabular-nums">{ev.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{ev.details}</p>
                <p className="text-[11px] text-slate-500">
                  Teacher Alerted: {ev.teacherAlerted ? 'Yes' : 'No'} · Encrypted Snapshot: <span className="font-mono">{ev.snapshotLabel}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSnapshotPreview({ label: ev.snapshotLabel, details: ev.details })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Private Snapshot</span>
                </button>
                {isAdmin && !ev.resolved && ev.rfidUid && (
                  <button
                    type="button"
                    onClick={() => unblockStudentCard(ev.rfidUid)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Admin Unblock</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(correctingRow)}
        onClose={() => setCorrectingRow(null)}
        title="Manual Attendance Correction"
        subtitle={correctingRow ? `${correctingRow.studentName} (${correctingRow.studentId})` : undefined}
      >
        {correctingRow && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setAttendance((prev) =>
                prev.map((r) =>
                  r.id === correctingRow.id
                    ? { ...r, status: correctionStatus, correctedBy: currentUser?.name, correctionReason }
                    : r
                )
              );
              addAuditLog('MANUAL_ATTENDANCE_CORRECTION', correctingRow.studentId, `Changed status to ${correctionStatus}: ${correctionReason}`);
              pushToast({ type: 'success', title: 'Attendance Updated', description: `${correctingRow.studentName} marked ${correctionStatus}.` });
              setCorrectingRow(null);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold mb-1">Updated Attendance Status</label>
              <select
                value={correctionStatus}
                onChange={(e) => setCorrectionStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="PRESENT">PRESENT (≤ 15 min)</option>
                <option value="LATE">LATE (15–45 min)</option>
                <option value="ABSENT">ABSENT (&gt; 45 min)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Audit Reason</label>
              <input
                type="text"
                required
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="e.g., RFID card reader missed initial tap"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCorrectingRow(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                Save Correction
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(snapshotPreview)}
        onClose={() => setSnapshotPreview(null)}
        title="Authorized Security Snapshot"
        subtitle={snapshotPreview?.label}
      >
        {snapshotPreview && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <img
                src={ASSETS.doorCam}
                alt="Security Snapshot"
                referrerPolicy="no-referrer"
                className="w-full h-56 object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-slate-950/80 text-white font-mono text-[11px]">
                {snapshotPreview.label} · Authorized Access Only
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{snapshotPreview.details}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
