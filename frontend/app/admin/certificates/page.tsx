'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';

interface Certificate {
  id: string;
  certificate_uuid: string;
  status: 'valid' | 'revoked';
  issue_date: string;
  completion_percentage: number;
  average_score: number | null;
  revoke_reason: string | null;
  revoked_at: string | null;
  courses: { id: string; title: string };
  profiles: { id: string; first_name: string; last_name: string; email: string };
}

export default function AdminCertificates() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokeTarget, setRevokeTarget] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'valid' | 'revoked'>('all');

  useEffect(() => { fetchCerts(); }, []);

  const fetchCerts = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/admin/certificates');
      setCerts(res.data?.certificates || []);
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to load' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      setRevoking(true);
      await apiClient.patch(`/admin/certificates/${revokeTarget.id}/revoke`, { reason: revokeReason });
      setActionMsg({ type: 'success', text: 'Certificate revoked successfully' });
      setRevokeTarget(null);
      setRevokeReason('');
      fetchCerts();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Revoke failed' });
    } finally {
      setRevoking(false);
    }
  };

  const filtered = certs.filter(c => filter === 'all' || c.status === filter);

  return (
    <DashboardLayout title="Certificate Management" subtitle="View and manage all issued certificates">
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

        {/* Stats + Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-600">Total: <strong>{certs.length}</strong></span>
            <span className="text-green-600">Valid: <strong>{certs.filter(c => c.status === 'valid').length}</strong></span>
            <span className="text-red-600">Revoked: <strong>{certs.filter(c => c.status === 'revoked').length}</strong></span>
          </div>
          <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/30">
            {(['all', 'valid', 'revoked'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition capitalize ${
                  filter === f ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow' : 'text-gray-600 hover:text-gray-900'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    {['Student', 'Course', 'Issued', 'Completion', 'Score', 'Status', 'Revoke Reason', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-white/60 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{c.profiles?.first_name} {c.profiles?.last_name}</p>
                        <p className="text-xs text-gray-500">{c.profiles?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.courses?.title}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(c.issue_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-700">{c.completion_percentage}%</td>
                      <td className="px-4 py-3 text-gray-700">{c.average_score !== null ? `${c.average_score}/100` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          c.status === 'valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        {c.status === 'revoked' ? (
                          <div>
                            <p className="text-xs text-red-600 font-medium truncate" title={c.revoke_reason || 'No reason provided'}>
                              {c.revoke_reason || <span className="text-gray-400 italic">No reason</span>}
                            </p>
                            {c.revoked_at && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(c.revoked_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Link href={`/verify-certificate/${c.certificate_uuid}`} target="_blank"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                          </Link>
                          {c.status === 'valid' && (
                            <button onClick={() => setRevokeTarget(c)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                              <NoSymbolIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="p-8 text-center text-gray-500">No certificates found</div>}
            </div>
          )}
        </div>
      </div>

      {/* Revoke Modal */}
      {revokeTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <NoSymbolIcon className="w-8 h-8 text-red-500" />
              <h2 className="text-lg font-bold text-gray-800">Revoke Certificate</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Revoke certificate for <strong>{revokeTarget.profiles?.first_name} {revokeTarget.profiles?.last_name}</strong> — {revokeTarget.courses?.title}?
              This will make the certificate fail verification.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <textarea value={revokeReason} onChange={e => setRevokeReason(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 resize-none"
                placeholder="Reason for revocation..." />
            </div>
            <div className="flex space-x-3">
              <button onClick={handleRevoke} disabled={revoking}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition disabled:opacity-50">
                {revoking ? 'Revoking...' : 'Revoke Certificate'}
              </button>
              <button onClick={() => setRevokeTarget(null)}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
