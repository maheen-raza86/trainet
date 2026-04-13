'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
  last_activity_at: string | null;
}

const ROLES = ['student', 'trainer', 'alumni', 'recruiter', 'admin'];
const ROLE_COLORS: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700',
  trainer: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
  alumni: 'bg-green-100 text-green-700',
  recruiter: 'bg-orange-100 text-orange-700',
};

/** Human-readable relative time, e.g. "2 hours ago" */
function timeAgo(ts: string | null): string {
  if (!ts) return 'Never';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'last_login_at' | 'last_activity_at'>('created_at');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editVerified, setEditVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res: any = await apiClient.get(`/admin/users?${params}`);
      setUsers(res.data?.users || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Client-side sort
  const sorted = [...users].sort((a, b) => {
    const av = a[sortBy] ?? '';
    const bv = b[sortBy] ?? '';
    return bv > av ? 1 : -1;
  });

  const handleEdit = (u: User) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditVerified(u.email_verified);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    try {
      setSaving(true);
      await apiClient.patch(`/admin/users/${editUser.id}`, { role: editRole, email_verified: editVerified });
      setActionMsg({ type: 'success', text: 'User updated successfully' });
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await apiClient.delete(`/admin/users/${deleteConfirm.id}`);
      setActionMsg({ type: 'success', text: 'User deleted successfully' });
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Delete failed' });
      setDeleteConfirm(null);
    }
  };

  const SortBtn = ({ field, label }: { field: typeof sortBy; label: string }) => (
    <button
      onClick={() => setSortBy(field)}
      className={`text-xs px-2 py-1 rounded-lg transition ${sortBy === field ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
    >
      {label}
    </button>
  );

  return (
    <DashboardLayout title="User Management" subtitle="View, edit, and manage all platform users">
      <div className="space-y-6">

        {actionMsg && (
          <div className={`p-4 rounded-xl border flex items-center space-x-2 ${
            actionMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {actionMsg.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationTriangleIcon className="w-5 h-5" />}
            <span className="text-sm">{actionMsg.text}</span>
            <button onClick={() => setActionMsg(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Filters + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400"
          >
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
          <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/30">
            <span className="text-xs text-gray-500 px-2">Sort:</span>
            <SortBtn field="created_at" label="Joined" />
            <SortBtn field="last_login_at" label="Login" />
            <SortBtn field="last_activity_at" label="Activity" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
          <div className="p-4 border-b border-white/20">
            <h2 className="font-semibold text-gray-800">Users ({users.length})</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    {['Name', 'Email', 'Role', 'Verified', 'Joined', 'Last Login', 'Last Activity', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map(u => (
                    <tr key={u.id} className="hover:bg-white/60 transition">
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.first_name} {u.last_name}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.email_verified
                          ? <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          : <XCircleIcon className="w-4 h-4 text-gray-400" />}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-3 h-3 text-gray-400" />
                          <span className={`text-xs ${u.last_login_at ? 'text-gray-700' : 'text-gray-400'}`}>
                            {timeAgo(u.last_login_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            u.last_activity_at && Date.now() - new Date(u.last_activity_at).getTime() < 24 * 60 * 60 * 1000
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`} />
                          <span className={`text-xs ${u.last_activity_at ? 'text-gray-700' : 'text-gray-400'}`}>
                            {timeAgo(u.last_activity_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleEdit(u)} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          {u.role !== 'admin' && (
                            <button onClick={() => setDeleteConfirm(u)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sorted.length === 0 && (
                <div className="p-8 text-center text-gray-500">No users found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Edit User</h2>
            <p className="text-sm text-gray-500 mb-4">{editUser.first_name} {editUser.last_name} · {editUser.email}</p>

            {/* Activity info in modal */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1">
              <p className="text-xs text-gray-500">Last login: <span className="font-medium text-gray-700">{timeAgo(editUser.last_login_at)}</span></p>
              <p className="text-xs text-gray-500">Last activity: <span className="font-medium text-gray-700">{timeAgo(editUser.last_activity_at)}</span></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400">
                  {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="verified" checked={editVerified} onChange={e => setEditVerified(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded" />
                <label htmlFor="verified" className="text-sm text-gray-700">Email Verified</label>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditUser(null)}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">Delete User?</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.first_name} {deleteConfirm.last_name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
