'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

// Human-readable labels and input types per key
const SETTING_META: Record<string, { label: string; type: 'number' | 'boolean' | 'text'; min?: number; max?: number }> = {
  certificate_threshold: { label: 'Certificate Completion Threshold (%)', type: 'number', min: 1, max: 100 },
  plagiarism_threshold: { label: 'Plagiarism Flag Threshold (%)', type: 'number', min: 1, max: 100 },
  ai_grading_enabled: { label: 'AI Auto-Grading Enabled', type: 'boolean' },
  max_offerings_per_trainer: { label: 'Max Active Offerings per Trainer', type: 'number', min: 1, max: 20 },
  platform_name: { label: 'Platform Name', type: 'text' },
  registration_enabled: { label: 'Allow New Registrations', type: 'boolean' },
  max_course_duration_weeks: { label: 'Max Course Duration (weeks)', type: 'number', min: 1, max: 52 },
  certificates_enabled: { label: 'Certificate Generation Enabled', type: 'boolean' },
  maintenance_mode: { label: 'Maintenance Mode', type: 'boolean' },
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/admin/settings');
      const s: Setting[] = res.data?.settings || [];
      setSettings(s);
      const initial: Record<string, string> = {};
      s.forEach(item => { initial[item.key] = item.value; });
      setEdits(initial);
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    try {
      setSaving(key);
      await apiClient.patch(`/admin/settings/${key}`, { value: edits[key] });
      setActionMsg({ type: 'success', text: `Setting "${key}" updated successfully` });
      fetchSettings();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Update failed' });
    } finally {
      setSaving(null);
    }
  };

  const isDirty = (key: string) => {
    const original = settings.find(s => s.key === key)?.value;
    return original !== edits[key];
  };

  return (
    <DashboardLayout title="System Settings" subtitle="Configure platform behaviour and thresholds">
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

        {loading ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center text-gray-500 border border-white/30">Loading settings...</div>
        ) : (
          <div className="space-y-4">
            {settings.map(setting => {
              const meta = SETTING_META[setting.key];
              const currentEdit = edits[setting.key] ?? setting.value;
              const dirty = isDirty(setting.key);

              return (
                <div key={setting.key} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Cog6ToothIcon className="w-4 h-4 text-gray-400" />
                        <h3 className="font-semibold text-gray-800">{meta?.label || setting.key}</h3>
                        {dirty && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Unsaved</span>}
                      </div>
                      {setting.description && (
                        <p className="text-xs text-gray-500 mb-3">{setting.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mb-3">
                        Key: <code className="bg-gray-100 px-1 rounded">{setting.key}</code> · Last updated: {new Date(setting.updated_at).toLocaleString()}
                      </p>

                      {/* Input based on type */}
                      {meta?.type === 'boolean' ? (
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setEdits(prev => ({ ...prev, [setting.key]: currentEdit === 'true' ? 'false' : 'true' }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              currentEdit === 'true' ? 'bg-purple-500' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              currentEdit === 'true' ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                          <span className="text-sm text-gray-700">{currentEdit === 'true' ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      ) : meta?.type === 'number' ? (
                        <input
                          type="number"
                          min={meta.min}
                          max={meta.max}
                          value={currentEdit}
                          onChange={e => setEdits(prev => ({ ...prev, [setting.key]: e.target.value }))}
                          className="w-32 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400"
                        />
                      ) : (
                        <input
                          type="text"
                          value={currentEdit}
                          onChange={e => setEdits(prev => ({ ...prev, [setting.key]: e.target.value }))}
                          className="w-64 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400"
                        />
                      )}
                    </div>

                    <button
                      onClick={() => handleSave(setting.key)}
                      disabled={!dirty || saving === setting.key}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-40 whitespace-nowrap"
                    >
                      {saving === setting.key ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
