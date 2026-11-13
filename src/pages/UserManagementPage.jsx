import { useState } from 'react';
import { Edit2, KeyRound, Plus, Search, Shield, Trash2, UserCheck, UserX } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext.jsx';
import { ASSETS } from '../data/seedData';
import { hashPassword } from '../utils/passwordHash.js';
import { Modal } from '../components/ui/Modal.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export function UserManagementPage() {
  const { users, setUsers, currentUser, pushToast, addAuditLog } = usePlatform();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [detailsUser, setDetailsUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    role: 'Teacher',
    assignedRoom: 'CSE-401',
    password: '',
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchText =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchText && matchRole;
  });

  const openAdd = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', username: '', role: 'Teacher', assignedRoom: 'CSE-401', password: '' });
    setFormOpen(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      username: u.username,
      role: u.role,
      assignedRoom: u.assignedRoom ?? 'CSE-401',
      password: '',
    });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    const cleanEmail = form.email.trim().toLowerCase();
    const cleanUsername = (form.username || cleanEmail.split('@')[0]).trim().toLowerCase();

    const duplicate = users.find(
      (u) =>
        u.id !== editingUser?.id &&
        (u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername)
    );
    if (duplicate) {
      pushToast({
        type: 'error',
        title: 'Duplicate Account',
        description: 'Another user already exists with that email or username.',
      });
      return;
    }

    if (!editingUser && form.password.length < 6) {
      pushToast({ type: 'error', title: 'Weak Password', description: 'Password must be at least 6 characters.' });
      return;
    }
    if (editingUser && form.password && form.password.length < 6) {
      pushToast({ type: 'error', title: 'Weak Password', description: 'New password must be at least 6 characters.' });
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        const updatedHash = form.password ? await hashPassword(form.password) : editingUser.passwordHash;
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? {
                  ...u,
                  name: form.name.trim(),
                  email: form.email.trim(),
                  username: form.username.trim() || cleanUsername,
                  role: form.role,
                  assignedRoom: form.assignedRoom,
                  passwordHash: updatedHash,
                }
              : u
          )
        );
        addAuditLog(
          'EDIT_USER',
          form.email.trim(),
          `Updated role=${form.role}${form.password ? ' and rotated PBKDF2 password hash' : ''}`
        );
        pushToast({ type: 'success', title: 'User Updated', description: `${form.name} saved.` });
      } else {
        const passwordHash = await hashPassword(form.password);
        const created = {
          id: `usr-${Date.now()}`,
          name: form.name.trim(),
          email: form.email.trim(),
          username: cleanUsername,
          role: form.role,
          status: 'ACTIVE',
          avatar: form.role === 'Student' ? ASSETS.studentAvatar : ASSETS.adminAvatar,
          passwordHash,
          assignedRoom: form.assignedRoom,
          lastLogin: 'Never',
          loginHistory: [],
        };
        setUsers((prev) => [created, ...prev]);
        addAuditLog('CREATE_USER', created.email, `Created ${created.role} account with salted PBKDF2-SHA256 hash`);
        pushToast({ type: 'success', title: 'User Created', description: `${created.name} (${created.role}) added.` });
      }
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (u) => {
    if (u.id === currentUser?.id) {
      pushToast({ type: 'warning', title: 'Action Blocked', description: 'Cannot deactivate your currently signed-in Admin account.' });
      return;
    }
    const nextStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, status: nextStatus } : item)));
    addAuditLog('TOGGLE_USER_STATUS', u.email, `Set account status to ${nextStatus}`);
    pushToast({ type: 'info', title: `Account ${nextStatus}`, description: `${u.name} is now ${nextStatus}.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage Admin, Teacher, Student, and Guardian accounts with salted PBKDF2-SHA256 password hashing
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or username..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
          {['ALL', 'Admin', 'Teacher', 'Student', 'Guardian'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                roleFilter === role ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">User</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Role</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Last Login</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDetailsUser(u)}
                      className="flex items-center gap-3 text-left group"
                    >
                      <img
                        src={u.avatar}
                        alt={u.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600">{u.name}</p>
                        <p className="text-xs font-mono text-slate-500">@{u.username}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{u.email}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{u.role}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-500">{u.lastLogin}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDetailsUser(u)}
                        title="View Details & Login History"
                        className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        title="Edit User"
                        className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResetUser(u);
                          setNewPassword('');
                        }}
                        title="Reset Password"
                        className="p-1.5 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(u)}
                        title={u.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                        className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {u.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4 text-emerald-600" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteUser(u)}
                        title="Delete User"
                        className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No matching users found. Try clearing filters or add a new account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingUser ? 'Edit Platform User' : 'Add Platform User'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="Admin">Admin</option>
                <option value="Teacher">Teacher</option>
                <option value="Student">Student</option>
                <option value="Guardian">Guardian</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Assigned Room</label>
              <input
                type="text"
                value={form.assignedRoom}
                onChange={(e) => setForm({ ...form, assignedRoom: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              {editingUser ? 'New Password (optional — leave blank to keep current)' : 'Initial Password (min 6 characters)'}
            </label>
            <input
              type="password"
              required={!editingUser}
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editingUser ? 'Leave blank to keep existing hashed password' : 'Enter a strong password'}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Hashing...' : editingUser ? 'Save User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detailsUser)}
        onClose={() => setDetailsUser(null)}
        title={detailsUser?.name ?? 'User Details'}
        subtitle={detailsUser ? `${detailsUser.role} · ${detailsUser.email}` : undefined}
      >
        {detailsUser && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Assigned Classroom: <strong>{detailsUser.assignedRoom ?? 'CSE-401'}</strong></span>
              </div>
              <StatusBadge status={detailsUser.status} />
            </div>
            <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs space-y-1">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">Credential Storage: Salted PBKDF2-SHA256</p>
              <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
                {detailsUser.passwordHash}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Login History</h4>
              {detailsUser.loginHistory.length === 0 ? (
                <p className="text-xs text-slate-500">No recorded sign-ins yet.</p>
              ) : (
                <div className="space-y-2">
                  {detailsUser.loginHistory.map((lh) => (
                    <div key={lh.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-mono tabular-nums font-medium">{lh.timestamp}</p>
                        <p className="text-slate-500">{lh.device} · IP {lh.ip}</p>
                      </div>
                      <StatusBadge status={lh.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(resetUser)} onClose={() => setResetUser(null)} title="Reset User Password">
        {resetUser && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (newPassword.length < 6 || saving) return;
              setSaving(true);
              try {
                const hashed = await hashPassword(newPassword);
                setUsers((prev) => prev.map((u) => (u.id === resetUser.id ? { ...u, passwordHash: hashed } : u)));
                addAuditLog('RESET_PASSWORD', resetUser.email, 'Administrator rotated PBKDF2-SHA256 password hash');
                pushToast({ type: 'success', title: 'Password Reset', description: `Hashed & updated credentials for ${resetUser.name}.` });
                setResetUser(null);
                setNewPassword('');
              } finally {
                setSaving(false);
              }
            }}
            className="space-y-4"
          >
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Set a new password for <strong>{resetUser.name}</strong> ({resetUser.email}). Only the new password will work after saving.
            </p>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 chars)"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setResetUser(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Hashing...' : 'Confirm Reset'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(deleteUser)} onClose={() => setDeleteUser(null)} title="Confirm User Deletion">
        {deleteUser && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently remove <strong>{deleteUser.name}</strong> ({deleteUser.role})?
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteUser(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteUser.id === currentUser?.id) {
                    pushToast({ type: 'error', title: 'Cannot Delete Active User' });
                    return;
                  }
                  setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
                  addAuditLog('DELETE_USER', deleteUser.email, `Removed ${deleteUser.role} account`);
                  pushToast({ type: 'warning', title: 'User Removed', description: `${deleteUser.name} deleted.` });
                  setDeleteUser(null);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
