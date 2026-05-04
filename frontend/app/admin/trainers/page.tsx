'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface TrainerApplication {
  id: string;
  experience: string;
  skills: string;
  bio: string;
  cv_url: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
}

interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  trainer_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  application: TrainerApplication | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-green-100  text-green-700  border-green-200',
  rejected: 'bg-red-100    text-red-700    border-red-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending:  <ClockIcon        className="w-3.5 h-3.5" />,
  approved: <CheckCircleIcon  className="w-3.5 h-3.5" />,
  rejected: <XCircleIcon      className="w-3.5 h-3.5" />,
};

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selected, setSelected] = useState<Trainer | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { fetchTrainers(); }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await apiClient.get('/admin/trainers');
      setTrainers(res.data?.trainers || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load trainer requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selected) return;
    try {
      setReviewing(true);
      await apiClient.patch(`/admin/trainer-applications/${selected.id}/review`, {
        decision,
        adminNotes: adminNotes.trim() || undefined,
      });
      setActionMsg({ type: 'success', text: `Trainer ${decision} successfully.` });
      setSelected(null);
      setAdminNotes('');
      fetchTrainers();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Review failed' });
    } finally {
      setReviewing(false);
    }
  };

  const filtered = trainers.filter(t => {
    const matchSearch = !search ||
      `${t.first_name} ${t.last_name} ${t.email}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.trainer_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:      trainers.length,
    pending:  trainers.filter(t => t.trainer_status === 'pending').length,
    approved: trainers.filter(t => t.trainer_status === 'approved').length,
    rejected: trainers.filter(t => t.trainer_status === 'rejected').length,
  };

  return (
    <DashboardLayout title="Trainer Requests" subtitle="Review and approve trainer verification applications">
      <div className="space-y-6">

        {/* Action message */}
        {actionMsg && (
          <div className={`p-4 rounded-xl border flex items-center gap-2 ${
            actionMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {actionMsg.type === 'success'
              ? <CheckCircleIcon className="w-5 h-5 shrink-0" />
              : <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />}
            <span className="text-sm flex-1">{actionMsg.text}</span>
            <button onClick={() => setActionMsg(null)} className="text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Summary pills */}
        <div className="flex flex-wrap gap-3">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s === 'all' ? '' : s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                (s === 'all' && !statusFilter) || statusFilter === s
                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-white/60 text-gray-600 border-white/30 hover:bg-white/80'
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1.5 px-1.5 py-0.5 bg-white/60 rounded-full text-xs">{counts[s]}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
        </div>

        {/* Table */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
          <div className="p-4 border-b border-white/20">
            <h2 className="font-semibold text-gray-800">Trainer Requests ({filtered.length})</h2>
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
                    {['Name', 'Email', 'Status', 'Joined', 'Application', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(t => (
                    <tr key={t.id} className="hover:bg-white/60 transition">
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {t.first_name} {t.last_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{t.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium border capitalize ${STATUS_STYLES[t.trainer_status]}`}>
                          {STATUS_ICONS[t.trainer_status]}
                          {t.trainer_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {t.application ? (
                          <span className="text-xs text-purple-600 flex items-center gap-1">
                            <DocumentTextIcon className="w-3.5 h-3.5" />
                            {new Date(t.application.submitted_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No application</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setSelected(t); setDecision('approved'); setAdminNotes(''); }}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="p-8 text-center text-gray-500">No trainers found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Review Trainer Request</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {selected.first_name} {selected.last_name} · {selected.email}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Current status */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Current status:</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium border capitalize ${STATUS_STYLES[selected.trainer_status]}`}>
                  {STATUS_ICONS[selected.trainer_status]}
                  {selected.trainer_status}
                </span>
              </div>

              {/* Application details */}
              {selected.application ? (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Application Details</p>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Experience</p>
                    <p className="text-sm text-gray-700">{selected.application.experience}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.application.skills.split(',').map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Bio</p>
                    <p className="text-sm text-gray-700">{selected.application.bio}</p>
                  </div>
                  {selected.application.cv_url && (
                    <a href={selected.application.cv_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:underline flex items-center gap-1">
                      <DocumentTextIcon className="w-3.5 h-3.5" /> View CV
                    </a>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 text-center">
                  No application submitted yet
                </div>
              )}

              {/* Decision */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDecision('approved')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                      decision === 'approved'
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50'
                    }`}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => setDecision('rejected')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                      decision === 'rejected'
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50'
                    }`}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>

              {/* Admin notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={2}
                  placeholder={decision === 'rejected' ? 'Reason for rejection...' : 'Any notes for the trainer...'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleReview}
                disabled={reviewing}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-50 ${
                  decision === 'approved'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {reviewing ? 'Saving...' : `Confirm ${decision.charAt(0).toUpperCase() + decision.slice(1)}`}
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
