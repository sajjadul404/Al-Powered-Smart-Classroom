import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  CreditCard,
  Edit2,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext.jsx';
import { ASSETS } from '../data/seedData';
import { Modal } from '../components/ui/Modal.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export function StudentManagementPage() {
  const {
    students,
    setStudents,
    attendance,
    accessLogs,
    currentUser,
    deleteStudentWithAudit,
    unblockStudentCard,
    pushToast,
    addAuditLog,
    selectedStudentIdForDetails,
    setSelectedStudentIdForDetails,
  } = usePlatform();

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [detailTab, setDetailTab] = useState('Overview');
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    studentId: '',
    name: '',
    className: 'CSE-401',
    section: 'Section A',
    rfidUid: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    faceConsentSigned: true,
    faceSlots: [true, true, true],
  });

  const isAdmin = currentUser?.role === 'Admin';
  const detailStudent = students.find((s) => s.id === selectedStudentIdForDetails) ?? null;

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchText =
      s.name.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.rfidUid.toLowerCase().includes(q);
    const matchClass = classFilter === 'ALL' || s.className === classFilter;
    return matchText && matchClass;
  });

  const openAdd = () => {
    setEditingStudent(null);
    setForm({
      studentId: `2024410300${students.length + 1}`,
      name: '',
      className: 'CSE-401',
      section: 'Section A',
      rfidUid: `AA:10:4C:${String(10 + students.length).padStart(2, '0')}`,
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      faceConsentSigned: true,
      faceSlots: [true, true, false],
    });
    setFormOpen(true);
  };

  const openEdit = (s) => {
    setEditingStudent(s);
    setForm({
      studentId: s.studentId,
      name: s.name,
      className: s.className,
      section: s.section,
      rfidUid: s.rfidUid,
      guardianName: s.guardianName,
      guardianPhone: s.guardianPhone,
      guardianEmail: s.guardianEmail,
      faceConsentSigned: s.faceConsentSigned,
      faceSlots: [Boolean(s.faceImages[0]), Boolean(s.faceImages[1]), Boolean(s.faceImages[2])],
    });
    setFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.faceConsentSigned) {
      pushToast({ type: 'error', title: 'Consent Required', description: 'Biometric face registration requires signed privacy consent.' });
      return;
    }
    const faceImages = [
      form.faceSlots[0] ? ASSETS.studentAvatar : null,
      form.faceSlots[1] ? ASSETS.studentAvatar : null,
      form.faceSlots[2] ? ASSETS.studentAvatar : null,
    ];
    if (editingStudent) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingStudent.id
            ? {
                ...s,
                studentId: form.studentId,
                name: form.name,
                className: form.className,
                section: form.section,
                rfidUid: form.rfidUid,
                guardianName: form.guardianName,
                guardianPhone: form.guardianPhone,
                guardianEmail: form.guardianEmail,
                faceConsentSigned: form.faceConsentSigned,
                faceImages,
              }
            : s
        )
      );
      addAuditLog('UPDATE_STUDENT', form.studentId, `Updated profile & RFID (${form.rfidUid}) for ${form.name}`);
      pushToast({ type: 'success', title: 'Student Updated', description: `${form.name} saved.` });
    } else {
      const created = {
        id: `st-${Date.now()}`,
        studentId: form.studentId,
        name: form.name,
        className: form.className,
        section: form.section,
        rfidUid: form.rfidUid,
        cardStatus: form.rfidUid ? 'ACTIVE' : 'UNASSIGNED',
        faceImages,
        faceConsentSigned: form.faceConsentSigned,
        faceConsentDate: '2026-11-12',
        guardianName: form.guardianName,
        guardianPhone: form.guardianPhone,
        guardianEmail: form.guardianEmail,
        attendancePercentage: 100,
        status: 'ACTIVE',
        avatar: ASSETS.studentAvatar,
      };
      setStudents((prev) => [created, ...prev]);
      addAuditLog('ENROLL_STUDENT', created.studentId, `Enrolled ${created.name} with RFID ${created.rfidUid}`);
      pushToast({ type: 'success', title: 'Student Enrolled', description: `${created.name} added to ${created.className}.` });
    }
    setFormOpen(false);
  };

  if (detailStudent) {
    const studentAtt = attendance.filter((a) => a.studentId === detailStudent.studentId);
    const studentAccess = accessLogs.filter((l) => l.matchedStudentId === detailStudent.studentId);
    const registeredCount = detailStudent.faceImages.filter(Boolean).length;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setSelectedStudentIdForDetails(null)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Student Directory</span>
          </button>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEdit(detailStudent)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(detailStudent)}
                className="px-3.5 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                Delete Student
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={detailStudent.avatar}
              alt={detailStudent.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">{detailStudent.name}</h1>
              <p className="text-xs font-mono text-slate-500 mt-0.5 tabular-nums">
                ID: {detailStudent.studentId} · {detailStudent.className} ({detailStudent.section}) · Attendance: {detailStudent.attendancePercentage}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <StatusBadge status={detailStudent.status} />
            <StatusBadge status={detailStudent.cardStatus} label={`Card ${detailStudent.cardStatus}`} />
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          {['Overview', 'Attendance', 'RFID Information', 'Face Registration', 'Guardian', 'Activity History'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setDetailTab(tab)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                detailTab === tab ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          {detailTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-slate-500">Student Identifier</p>
                <p className="font-mono font-semibold">{detailStudent.studentId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500">Class & Section</p>
                <p className="font-semibold">{detailStudent.className} · {detailStudent.section}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500">Enrolled Face Embeddings</p>
                <p className="font-mono font-semibold">{registeredCount} / 3 Reference Angles</p>
              </div>
            </div>
          )}

          {detailTab === 'Attendance' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left pb-2">Date</th>
                    <th className="text-left pb-2">Scan Time</th>
                    <th className="text-left pb-2">Face Match</th>
                    <th className="text-left pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentAtt.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2.5 font-mono text-xs">{a.date}</td>
                      <td className="py-2.5 font-mono text-xs">{a.scanTime ?? '—'}</td>
                      <td className="py-2.5 text-xs">{a.faceVerified ? `Verified (${a.confidence}%)` : 'No scan'}</td>
                      <td className="py-2.5"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'RFID Information' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-500">Assigned RFID-RC522 Card UID</p>
                    <p className="font-mono text-lg font-bold">{detailStudent.rfidUid}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={detailStudent.cardStatus} />
                  {isAdmin && detailStudent.cardStatus === 'BLOCKED' && (
                    <button
                      type="button"
                      onClick={() => unblockStudentCard(detailStudent.rfidUid)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                    >
                      Admin Unblock Card
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {detailTab === 'Face Registration' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Biometric Privacy & Consent Verified ({detailStudent.faceConsentDate})</p>
                  <p className="mt-1">
                    FastRobox 1.0 stores encrypted 128-d embeddings on-device for access verification. Raw classroom frames are never retained unless an authorized security event requires a private snapshot.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0, 1, 2].map((idx) => {
                  const img = detailStudent.faceImages[idx];
                  return (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Reference Frame #{idx + 1}</span>
                        <span className={img ? 'text-emerald-600' : 'text-slate-400'}>{img ? 'Registered' : 'Empty'}</span>
                      </div>
                      {img ? (
                        <img
                          src={img}
                          alt={`Face sample ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-40 rounded-lg bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                          <Camera className="w-6 h-6" />
                          <span>No image captured</span>
                        </div>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setStudents((prev) =>
                              prev.map((s) => {
                                if (s.id !== detailStudent.id) return s;
                                const nextImgs = [...s.faceImages];
                                nextImgs[idx] = ASSETS.studentAvatar;
                                return { ...s, faceImages: nextImgs };
                              })
                            );
                            pushToast({ type: 'success', title: `Face Slot #${idx + 1} Captured`, description: 'ESP32-S3-CAM embedding updated.' });
                          }}
                          className="w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          {img ? 'Recapture Angle' : 'Register Face Image'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {detailTab === 'Guardian' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-xs text-slate-500">Guardian Name</p>
                <p className="font-semibold mt-0.5">{detailStudent.guardianName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Contact Phone</p>
                <p className="font-mono font-semibold mt-0.5">{detailStudent.guardianPhone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email for Alerts</p>
                <p className="font-semibold mt-0.5">{detailStudent.guardianEmail}</p>
              </div>
            </div>
          )}

          {detailTab === 'Activity History' && (
            <div className="space-y-2.5">
              {studentAccess.length === 0 ? (
                <p className="text-xs text-slate-500">No door access events recorded for this student yet.</p>
              ) : (
                studentAccess.map((l) => (
                  <div key={l.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-mono font-semibold">{l.timestamp}</p>
                      <p className="text-slate-500">Room {l.roomId} · Face: {l.faceResult} · Door: {l.doorStatus}</p>
                    </div>
                    <StatusBadge status={l.entryPermission} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete Student & Biometric Data">
          {deleteTarget && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <p className="font-bold">Permanent Biometric & Card Purge</p>
                  <p className="mt-1">
                    Deleting <strong>{deleteTarget.name}</strong> ({deleteTarget.studentId}) will permanently delete their associated face embeddings (3 slots), RFID card mapping ({deleteTarget.rfidUid}), and private security snapshots. An immutable audit record of this deletion will be retained.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteStudentWithAudit(deleteTarget.id);
                    setDeleteTarget(null);
                    setSelectedStudentIdForDetails(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Confirm Delete & Record Audit
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Student Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enroll students, assign RFID cards, register 3 face angles, and manage guardian contacts
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student ID, name, or RFID UID..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
          />
        </div>
        <select
          aria-label="Filter by Class"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <option value="ALL">All Classes</option>
          <option value="CSE-401">CSE-401</option>
          <option value="CSE-402">CSE-402</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Student</th>
                <th className="text-left px-4 py-3 font-semibold">Class & Section</th>
                <th className="text-left px-4 py-3 font-semibold">RFID UID</th>
                <th className="text-left px-4 py-3 font-semibold">Face Angles</th>
                <th className="text-right px-4 py-3 font-semibold">Attendance</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((s) => {
                const faceCount = s.faceImages.filter(Boolean).length;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDetailTab('Overview');
                          setSelectedStudentIdForDetails(s.id);
                        }}
                        className="flex items-center gap-3 text-left group"
                      >
                        <img
                          src={s.avatar}
                          alt={s.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600">{s.name}</p>
                          <p className="text-xs font-mono text-slate-500 tabular-nums">{s.studentId}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs">{s.className} · {s.section}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{s.rfidUid}</span>
                        {s.cardStatus === 'BLOCKED' && <StatusBadge status="BLOCKED" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums">
                      <span className={faceCount === 3 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {faceCount} / 3
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold tabular-nums">
                      {s.attendancePercentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDetailTab('Overview');
                            setSelectedStudentIdForDetails(s.id);
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Details
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(s)}
                              aria-label={`Edit ${s.name}`}
                              className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(s)}
                              aria-label={`Delete ${s.name}`}
                              className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingStudent ? 'Edit Student Enrollment' : 'Enroll New Student'}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Student ID</label>
              <input
                type="text"
                required
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Student Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Class</label>
              <select
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="CSE-401">CSE-401</option>
                <option value="CSE-402">CSE-402</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">RFID Card UID</label>
              <input
                type="text"
                required
                value={form.rfidUid}
                onChange={(e) => setForm({ ...form, rfidUid: e.target.value.toUpperCase() })}
                placeholder="A4:7F:21:9C"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Guardian Name</label>
              <input
                type="text"
                required
                value={form.guardianName}
                onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Guardian Phone</label>
              <input
                type="text"
                required
                value={form.guardianPhone}
                onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Guardian Email</label>
              <input
                type="email"
                required
                value={form.guardianEmail}
                onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2">Register 3 Face Images (Front, Left 15°, Right 15°)</label>
            <div className="grid grid-cols-3 gap-2.5">
              {['Front Pose', 'Left 15°', 'Right 15°'].map((lbl, idx) => {
                const active = form.faceSlots[idx];
                return (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => {
                      const next = [...form.faceSlots];
                      next[idx] = !next[idx];
                      setForm({ ...form, faceSlots: next });
                    }}
                    className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 ${
                      active
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {active ? <CheckCircle2 className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    <span>{lbl}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.faceConsentSigned}
              onChange={(e) => setForm({ ...form, faceConsentSigned: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-blue-600"
            />
            <span>
              Student & guardian signed biometric privacy consent: face embeddings are stored exclusively for attendance/door verification and purged upon student deletion.
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              {editingStudent ? 'Save Student' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete Student & Biometric Data">
        {deleteTarget && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="font-bold">Permanent Biometric & Card Purge</p>
                <p className="mt-1">
                  Deleting <strong>{deleteTarget.name}</strong> ({deleteTarget.studentId}) will also permanently delete their associated face embeddings, RFID card mapping ({deleteTarget.rfidUid}), and private snapshots. An audit record of this deletion will be saved.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteStudentWithAudit(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Confirm Delete & Record Audit
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
