'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { ClockIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface LogEntry {
  id: string;
  event_type: string;
  description: string;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  timestamp: string;
  profiles: { id: string; first_name: string; last_name: string; email: string; role: string } | null;
}

const EVENT_TYPES = [
  'user_login', 'user_updated', 'user_deleted',
  'course_deleted', 'certificate_revoked', 'setting_updated',
  'generated', 'verified', 'revoked',
];

const EVENT_COLORS: Record<string, string> = {
  user_login: 'bg-blue-100 text-blue-700',
  user_updated: 'bg-purple-100 text-purple-700',
  user_deleted: 'bg-red-100 text-red-700',
  course_deleted: 'bg-orange-100 text-orange-700',
  certificate_revoked: 'bg-red-100 text-red-700',
  setting_updated: 'bg-gray-100 text-gray-700',
  generated: 'bg-green-100 text-green-700',
  verified: 'bg-cyan-100 text-cyan-700',
  revoked: 'bg-red-100 text-red-700',
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => { fetchLogs(); }, [eventFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '100' });
      if (eventFilter) params.set('eventType', eventFilter);
      const res: any = await apiClient.get(`/admin/logs?${params}`);
      setLogs(res.data?.logs || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <DashboardLayout title="System Logs" subtitle="Audit trail of all platform events">
      <div className="space-y-6">

        {/* Filter */}
        <div className="flex items-center space-x-3">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400">
            <option value="">All Events</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          <span className="text-sm text-gray-500">{logs.length} entries</span>
        </div>

        {/* Log Table */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading logs...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    {['Time', 'Event', 'User', 'Description', 'Details'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log => (
                    <>
                      <tr key={log.id} className="hover:bg-white/60 transition cursor-pointer" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="w-3 h-3" />
                            <span>{formatTime(log.timestamp)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${EVENT_COLORS[log.event_type] || 'bg-gray-100 text-gray-700'}`}>
                            {log.event_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {log.profiles ? (
                            <div>
                              <p className="font-medium">{log.profiles.first_name} {log.profiles.last_name}</p>
                              <p className="text-xs text-gray-400 capitalize">{log.profiles.role}</p>
                            </div>
                          ) : <span className="text-gray-400">System</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{log.description}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {log.metadata && Object.keys(log.metadata).length > 0 ? (
                            <span className="text-purple-600 hover:underline">View ▾</span>
                          ) : '—'}
                        </td>
                      </tr>
                      {expandedLog === log.id && log.metadata && (
                        <tr key={`${log.id}-detail`} className="bg-gray-50/80">
                          <td colSpan={5} className="px-4 py-3">
                            <pre className="text-xs text-gray-600 bg-white rounded-lg p-3 overflow-x-auto border border-gray-200">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && <div className="p-8 text-center text-gray-500">No logs found</div>}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
