'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import EditAssignmentModal from '@/components/trainer/EditAssignmentModal';
import GradeSubmissionModal from '@/components/trainer/GradeSubmissionModal';
import {
  DocumentTextIcon,
  LinkIcon,
  VideoCameraIcon,
  TrashIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  PencilSquareIcon,
  SparklesIcon,
  ShieldExclamationIcon,
  CheckBadgeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Material {
  id: string;
  title: string;
  description: string | null;
  material_type: string;
  file_url: string | null;
  external_url: string | null;
  file_name: string | null;
  created_at: string;
}

interface OfferingDetail {
  id: string;
  duration_weeks: number;
  hours_per_week: number;
  outline: string;
  status: string;
  live_session_link: string | null;
  live_session_notes: string | null;
  start_date: string | null;
  end_date: string | null;
  weekly_days: string[] | null;
  session_start_time: string | null;
  session_end_time: string | null;
  courses: { id: string; title: string; description: string };
  profiles: { id: string; first_name: string; last_name: string };
  materials: Material[];
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  course_offering_id: string;
}

/* ── Submission Card ── */
function SubmissionCard({ sub: initialSub, assignmentTitle, onRefresh }: { sub: any; assignmentTitle: string; onRefresh: () => void }) {
  // localSub holds the live data — updated immediately from API response
  const [localSub, setLocalSub] = useState<any>(initialSub);
  const [overrideScore, setOverrideScore] = useState<string>(
    initialSub.final_score ?? initialSub.ai_score ?? ''
  );
  const [trainerFeedback, setTrainerFeedback] = useState<string>(
    initialSub.trainer_feedback || ''
  );
  const [saving, setSaving] = useState(false);
  const [recheckLoading, setRecheckLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync localSub when parent passes a new sub (after onRefresh)
  useEffect(() => {
    setLocalSub(initialSub);
    setOverrideScore(initialSub.final_score ?? initialSub.ai_score ?? '');
    setTrainerFeedback(initialSub.trainer_feedback || '');
  }, [initialSub.id, initialSub.ai_status, initialSub.final_score]);

  // Always read display values from localSub — never stale
  const sub = localSub;

  const missingConcepts: string[] = (() => {
    try { return JSON.parse(sub.missing_concepts || '[]'); } catch { return []; }
  })();

  const plagPct = sub.plagiarism_percentage ?? sub.plagiarism_score ?? null;
  const plagStatus = sub.plagiarism_status || 'pending';
  const aiStatus = sub.ai_status || 'Pending AI Check';
  const finalScore = sub.final_score ?? null;
  const aiScore = sub.ai_score ?? null;

  const plagBadgeColor = plagStatus === 'flagged' || plagStatus === 'High Plagiarism'
    ? 'bg-red-100 text-red-700 border-red-200'
    : plagStatus === 'suspicious' || plagStatus === 'Warning'
    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
    : 'bg-green-100 text-green-700 border-green-200';

  const aiStatusColor = aiStatus === 'Finalized'
    ? 'bg-green-100 text-green-700'
    : aiStatus === 'Flagged for Plagiarism'
    ? 'bg-red-100 text-red-700'
    : aiStatus === 'AI Checked'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-yellow-100 text-yellow-700';

  const scoreBadgeColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100 text-gray-500';
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const handleFinalize = async () => {
    setSaving(true); setMsg(null);
    try {
      const res: any = await apiClient.put(`/submissions/${sub.id}/finalize`, {
        finalScore: overrideScore !== '' ? Number(overrideScore) : undefined,
        trainerFeedback: trainerFeedback || undefined,
      });
      // Update local state immediately from the API response — no stale data
      if (res?.data) {
        setLocalSub(res.data);
        setOverrideScore(res.data.final_score ?? res.data.ai_score ?? '');
        setTrainerFeedback(res.data.trainer_feedback || '');
      }
      setMsg({ type: 'success', text: 'Final evaluation saved successfully!' });
      // Also refresh the parent list in the background
      onRefresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleRecheck = async () => {
    setRecheckLoading(true); setMsg(null);
    try {
      const res: any = await apiClient.post(`/submissions/${sub.id}/evaluate`, {});
      if (res?.data) {
        setLocalSub(res.data);
      }
      setMsg({ type: 'success', text: 'AI re-check complete!' });
      onRefresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Re-check failed' });
    } finally {
      setRecheckLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Top section */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-gray-900">{sub.profiles?.first_name} {sub.profiles?.last_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{sub.profiles?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Submitted: {new Date(sub.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* AI Status */}
            <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${aiStatusColor}`}>{aiStatus}</span>
            {/* AI Score */}
            {aiScore !== null && (
              <span className={`px-2.5 py-1 text-xs rounded-full font-medium border ${scoreBadgeColor(aiScore)}`}>
                AI: {aiScore}/100
              </span>
            )}
            {/* Final Score */}
            {finalScore !== null && (
              <span className={`px-2.5 py-1 text-xs rounded-full font-semibold border ${scoreBadgeColor(finalScore)}`}>
                Final: {finalScore}/100
              </span>
            )}
            {/* Plagiarism */}
            {plagPct !== null && (
              <span className={`px-2.5 py-1 text-xs rounded-full font-medium border ${plagBadgeColor}`}>
                Plagiarism: {plagPct}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle section — two columns */}
      <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Left: answer + attachment */}
        <div className="p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Submission</p>
          {sub.attachment_url ? (
            <a href={sub.attachment_url.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api','')}${sub.attachment_url}` : sub.attachment_url}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition">
              📎 View Submitted File
            </a>
          ) : (
            <p className="text-sm text-gray-400 italic">No file attached</p>
          )}

          {/* Plagiarism details */}
          {plagPct !== null && (
            <div className={`rounded-xl p-3 border text-sm ${plagBadgeColor}`}>
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldExclamationIcon className="w-4 h-4" />
                Plagiarism: {plagPct}% — {plagStatus}
              </p>
              {plagPct > 70 && (
                <p className="text-xs mt-1 opacity-80">⚠ This submission may contain copied content.</p>
              )}
            </div>
          )}
        </div>

        {/* Right: AI evaluation */}
        <div className="p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <SparklesIcon className="w-3.5 h-3.5" />AI Evaluation
          </p>

          {sub.ai_feedback ? (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">AI Feedback</p>
              <p className="text-sm text-gray-700 leading-relaxed">{sub.ai_feedback}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">AI feedback not yet available.</p>
          )}

          {missingConcepts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Missing Concepts</p>
              <div className="flex flex-wrap gap-1.5">
                {missingConcepts.map((c: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full border border-orange-200">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Score comparison */}
          {aiScore !== null && finalScore !== null && aiScore !== finalScore && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs text-gray-600 space-y-0.5">
              <p>AI Suggested Score: <strong>{aiScore}</strong></p>
              <p>Trainer Final Score: <strong className="text-purple-700">{finalScore}</strong></p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom section — trainer override */}
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trainer Evaluation</p>

        {msg && (
          <div className={`px-3 py-2 rounded-lg text-xs font-medium ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Override Score (0–100)</label>
            <input
              type="number" min={0} max={100}
              value={overrideScore}
              onChange={e => setOverrideScore(e.target.value)}
              placeholder={aiScore !== null ? `AI suggested: ${aiScore}` : 'Enter score'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trainer Feedback</label>
            <textarea
              value={trainerFeedback}
              onChange={e => setTrainerFeedback(e.target.value)}
              rows={2}
              placeholder="Write feedback for the student..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleFinalize}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
            <CheckBadgeIcon className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Final Evaluation'}
          </button>
          <button
            onClick={handleRecheck}
            disabled={recheckLoading}
            className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 rounded-lg text-sm hover:bg-purple-50 transition disabled:opacity-50">
            <SparklesIcon className="w-4 h-4" />
            {recheckLoading ? 'Checking...' : 'Re-check with AI'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Session Date helper ── */
function AddSessionDate({ offeringId, onAdded }: { offeringId: string; onAdded: () => void }) {
  const [date, setDate] = useState('');
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState('');

  const handleAdd = async () => {
    if (!date) return;
    setAdding(true);
    setErr('');
    try {
      // Use the dedicated /attendance/session endpoint which seeds absent records
      // for every enrolled student — this is what makes the date appear in the grid.
      await apiClient.post('/attendance/session', { offeringId, sessionDate: date });
      onAdded();
      setDate('');
    } catch (e: any) {
      setErr(e.message || 'Failed to add session date');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 space-y-2">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-gray-700 shrink-0">Add Session Date:</p>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400" />
        <button onClick={handleAdd} disabled={adding || !date}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm rounded-lg hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50 shrink-0">
          {adding ? 'Adding...' : 'Add'}
        </button>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}

export default function TrainerCourseManage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const offeringId = params.id as string;

  const [offering, setOffering] = useState<OfferingDetail | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'assignments' | 'live' | 'students' | 'attendance'>('materials');

  // Initialize tab from URL query param
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'students') {
      setActiveTab('students');
      fetchStudentProgress();
    }
  }, [searchParams]);

  // Material form
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matType, setMatType] = useState<'file' | 'link' | 'video' | 'document'>('file');
  const [matUrl, setMatUrl] = useState('');
  const [matFile, setMatFile] = useState<File | null>(null);
  const [matSaving, setMatSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live session form
  const [liveLink, setLiveLink] = useState('');
  const [liveNotes, setLiveNotes] = useState('');
  const [liveSaving, setLiveSaving] = useState(false);

  // Assignment form
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDue, setAssignDue] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);

  // Assignment edit modal
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);

  // Submissions viewer
  const [viewSubmissionsFor, setViewSubmissionsFor] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [gradeSubmission, setGradeSubmission] = useState<any | null>(null);

  const [showQRModal, setShowQRModal] = useState(false);
  const [studentProgress, setStudentProgress] = useState<any[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [certMsg, setCertMsg] = useState<{ id: string; text: string; type: 'success' | 'error' } | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<any | null>(null);

  // Attendance state
  const [attendanceData, setAttendanceData] = useState<{ sessions: string[]; students: any[] } | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState<string | null>(null); // "studentId-date"

  useEffect(() => {
    fetchAll();
  }, [offeringId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [detailRes, assignmentsRes] = await Promise.all([
        apiClient.get(`/materials/offering-detail/${offeringId}`),
        apiClient.get(`/assignments/course-offering/${offeringId}`),
      ]);
      const detail = (detailRes as any).data as OfferingDetail;
      setOffering(detail);
      setLiveLink(detail.live_session_link || '');
      setLiveNotes(detail.live_session_notes || '');
      setAssignments((assignmentsRes as any).data?.assignments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProgress = async () => {
    try {
      setProgressLoading(true);
      const res: any = await apiClient.get(`/progress/offering/${offeringId}/students`);
      setStudentProgress(res.data?.students || []);
    } catch { /* ignore */ } finally {
      setProgressLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const res: any = await apiClient.get(`/attendance/offering/${offeringId}`);
      setAttendanceData(res.data || null);
    } catch { /* ignore */ } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchSubmissionsForAssignment = async (assignment: Assignment) => {
    setViewSubmissionsFor(assignment);
    setSubmissionsLoading(true);
    setSubmissions([]);
    try {
      const res: any = await apiClient.get(`/submissions/assignment/${assignment.id}`);
      setSubmissions(res.data?.submissions || []);
    } catch { /* ignore */ } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleMarkAttendance = async (studentId: string, sessionDate: string, status: 'present' | 'absent') => {
    const key = `${studentId}-${sessionDate}`;
    setMarkingAttendance(key);
    try {
      await apiClient.post('/attendance/mark', { offeringId, studentId, sessionDate, status });
      fetchAttendance();
    } catch (err: any) {
      alert(err.message || 'Failed to mark attendance');
    } finally {
      setMarkingAttendance(null);
    }
  };

  const handleGenerateCertificate = async (studentId: string) => {
    try {
      await apiClient.post('/certificates/trainer/issue', { studentId, offeringId });
      setCertMsg({ id: studentId, text: 'Certificate issued!', type: 'success' });
      setTimeout(() => setCertMsg(null), 3000);
      // Refresh student progress to show updated certificate state
      fetchStudentProgress();
    } catch (err: any) {
      setCertMsg({ id: studentId, text: err.message || 'Failed to issue certificate', type: 'error' });
      setTimeout(() => setCertMsg(null), 4000);
    }
  };

  const handleRemoveStudent = async () => {
    if (!removeConfirm) return;
    try {
      await apiClient.delete(`/course-offerings/enrollment/${removeConfirm.enrollment_id}`);
      setRemoveConfirm(null);
      fetchStudentProgress();
    } catch (err: any) {
      alert(err.message || 'Failed to remove student');
      setRemoveConfirm(null);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim()) return;
    try {
      setMatSaving(true);
      const formData = new FormData();
      formData.append('offeringId', offeringId);
      formData.append('title', matTitle);
      formData.append('description', matDesc);
      formData.append('materialType', matType);
      if (matType === 'link' || matType === 'video') {
        formData.append('externalUrl', matUrl);
      }
      if (matFile) formData.append('file', matFile);

      await apiClient.post('/materials', formData);
      setMatTitle(''); setMatDesc(''); setMatUrl(''); setMatFile(null); setShowMaterialForm(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to add material');
    } finally {
      setMatSaving(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Delete this material?')) return;
    try {
      await apiClient.delete(`/materials/${id}`);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleSaveLiveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLiveSaving(true);
      await apiClient.put(`/materials/live-session/${offeringId}`, {
        liveSessionLink: liveLink,
        liveSessionNotes: liveNotes,
      });
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setLiveSaving(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim() || !assignDesc.trim()) return;
    try {
      setAssignSaving(true);
      await apiClient.post('/assignments', {
        title: assignTitle,
        description: assignDesc,
        courseOfferingId: offeringId,
        dueDate: assignDue || undefined,
      });
      setAssignTitle(''); setAssignDesc(''); setAssignDue(''); setShowAssignForm(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create assignment');
    } finally {
      setAssignSaving(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Delete this assignment? All submissions will also be deleted.')) return;
    try {
      await apiClient.delete(`/assignments/${id}`);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoCameraIcon className="w-5 h-5" />;
      case 'link': return <LinkIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const fmtTime = (t: string | null) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !offering) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{error || 'Course not found'}</p>
          <Link href="/trainer/courses" className="mt-4 inline-block text-purple-600 underline">Back</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
          <Link href="/trainer/courses" className="text-white/70 hover:text-white text-sm mb-3 inline-block">
            ← Back to My Courses
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">{offering.courses.title}</h1>
              <p className="text-white/80 text-sm">{offering.duration_weeks} weeks · {offering.hours_per_week}h/week</p>
            </div>
          </div>
        </div>

        {/* Course Schedule Card */}
        {(offering.start_date || offering.weekly_days) && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/30">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-purple-500" />Course Schedule
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {offering.start_date && <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Start Date</p><p className="font-medium text-gray-800">{fmtDate(offering.start_date)}</p></div>}
              {offering.end_date && <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">End Date</p><p className="font-medium text-gray-800">{fmtDate(offering.end_date)}</p></div>}
              {offering.weekly_days && offering.weekly_days.length > 0 && <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Schedule</p><p className="font-medium text-gray-800">{offering.weekly_days.join(', ')}</p></div>}
              {(offering.session_start_time || offering.session_end_time) && <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Session Time</p><p className="font-medium text-gray-800">{fmtTime(offering.session_start_time)}{offering.session_end_time ? ` – ${fmtTime(offering.session_end_time)}` : ''}</p></div>}
              <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Weekly Hours</p><p className="font-medium text-gray-800">{offering.hours_per_week}h/week</p></div>
              <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Duration</p><p className="font-medium text-gray-800">{offering.duration_weeks} weeks</p></div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/30">
          {(['materials', 'assignments', 'live', 'students', 'attendance'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'students') fetchStudentProgress();
                if (tab === 'attendance') fetchAttendance();
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'materials' ? '📚 Materials' : tab === 'assignments' ? '📝 Assignments' : tab === 'live' ? '🎥 Live' : tab === 'students' ? '👥 Students' : '✅ Attendance'}
            </button>
          ))}
        </div>

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowMaterialForm(!showMaterialForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Material</span>
              </button>
            </div>

            {showMaterialForm && (
              <form onSubmit={handleAddMaterial} className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/30 space-y-4">
                <h3 className="font-semibold text-gray-800">Add New Material</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input value={matTitle} onChange={e => setMatTitle(e.target.value)} required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent" placeholder="e.g. Week 1 Slides" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input value={matDesc} onChange={e => setMatDesc(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent" placeholder="Optional description" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select value={matType} onChange={e => setMatType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400">
                      <option value="file">File Upload</option>
                      <option value="link">External Link</option>
                      <option value="video">Video Link</option>
                      <option value="document">Document</option>
                    </select>
                  </div>
                  {(matType === 'link' || matType === 'video') ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                      <input value={matUrl} onChange={e => setMatUrl(e.target.value)} required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400" placeholder="https://..." />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                      <input ref={fileInputRef} type="file" onChange={e => setMatFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700" />
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button type="submit" disabled={matSaving}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                    {matSaving ? 'Saving...' : 'Add Material'}
                  </button>
                  <button type="button" onClick={() => setShowMaterialForm(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {offering.materials.length > 0 ? (
              offering.materials.map((m) => (
                <div key={m.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                      {getMaterialIcon(m.material_type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{m.title}</p>
                      {m.description && <p className="text-xs text-gray-500">{m.description}</p>}
                      {m.file_name && <p className="text-xs text-gray-400">{m.file_name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(m.external_url || m.file_url) && (
                      <a href={m.external_url || (m.file_url ? (m.file_url.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api','')}${m.file_url}` : m.file_url) : '#')} target="_blank" rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-purple-600 transition">
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </a>
                    )}
                    <button onClick={() => handleDeleteMaterial(m.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-10 text-center border border-white/30">
                <DocumentTextIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No materials yet. Add your first material above.</p>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAssignForm(!showAssignForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Create Assignment</span>
              </button>
            </div>

            {showAssignForm && (
              <form onSubmit={handleCreateAssignment} className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/30 space-y-4">
                <h3 className="font-semibold text-gray-800">New Assignment</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input value={assignTitle} onChange={e => setAssignTitle(e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400" placeholder="Assignment title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions *</label>
                  <textarea value={assignDesc} onChange={e => setAssignDesc(e.target.value)} required rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 resize-none" placeholder="Describe the assignment requirements..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="datetime-local" value={assignDue} onChange={e => setAssignDue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400" />
                </div>
                <div className="flex space-x-3">
                  <button type="submit" disabled={assignSaving}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                    {assignSaving ? 'Creating...' : 'Create Assignment'}
                  </button>
                  <button type="button" onClick={() => setShowAssignForm(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {assignments.length > 0 ? (
              assignments.map((a) => (
                <div key={a.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{a.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{a.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Due: {new Date(a.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => fetchSubmissionsForAssignment(a)}
                        className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200 transition">
                        View Submissions
                      </button>
                      <button
                        onClick={() => setEditAssignment(a)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 transition"
                        title="Edit assignment">
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteAssignment(a.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-10 text-center border border-white/30">
                <DocumentTextIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No assignments yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Live Session Tab */}
        {activeTab === 'live' && (
          <form onSubmit={handleSaveLiveSession} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/30 space-y-4">
            <h3 className="font-semibold text-gray-800">Live Session Settings</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Link (Google Meet, Zoom, etc.)</label>
              <input value={liveLink} onChange={e => setLiveLink(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400" placeholder="https://meet.google.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Notes</label>
              <textarea value={liveNotes} onChange={e => setLiveNotes(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 resize-none"
                placeholder="e.g. Every Tuesday 7PM, password: 1234" />
            </div>
            <button type="submit" disabled={liveSaving}
              className="px-5 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
              {liveSaving ? 'Saving...' : 'Save Live Session'}
            </button>
          </form>
        )}
        {/* Students Progress Tab */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{studentProgress.length} enrolled student{studentProgress.length !== 1 ? 's' : ''}</p>
              <button onClick={fetchStudentProgress} className="text-xs text-purple-600 hover:text-purple-700">Refresh</button>
            </div>

            {progressLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white/60 rounded-xl p-5 border border-white/30 animate-pulse h-20" />)}</div>
            ) : studentProgress.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-10 text-center border border-white/30">
                <p className="text-gray-500 text-sm">No students enrolled yet.</p>
              </div>
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80">
                    <tr>
                      {['Student', 'Progress', 'Submitted', 'Avg Grade', 'Certificate', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {studentProgress.map(s => (
                      <tr key={s.student_id} className="hover:bg-white/60 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{s.student?.first_name} {s.student?.last_name}</p>
                          <p className="text-xs text-gray-500">{s.student?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{ width: `${s.progress}%` }} />
                            </div>
                            <span className="text-xs font-medium text-gray-700">{s.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{s.submitted_assignments}/{s.total_assignments}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{s.average_grade !== null ? `${s.average_grade}%` : '—'}</td>
                        <td className="px-4 py-3">
                          {certMsg?.id === s.student_id ? (
                            <span className={`text-xs px-2 py-1 rounded-lg ${certMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{certMsg.text}</span>
                          ) : s.certificate ? (
                            <span className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-700 font-medium">✓ Issued</span>
                          ) : (
                            <button
                              onClick={() => handleGenerateCertificate(s.student_id)}
                              disabled={s.submitted_assignments < s.total_assignments}
                              className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-lg hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                              title={s.submitted_assignments < s.total_assignments
                                ? `Student needs ${s.total_assignments} submissions (has ${s.submitted_assignments})`
                                : 'Issue certificate'}
                            >
                              Issue Cert
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setRemoveConfirm(s)}
                            className="px-3 py-1 border border-red-200 text-red-600 text-xs rounded-lg hover:bg-red-50 transition"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">

            {/* Summary row */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {attendanceData?.sessions?.length
                  ? `${attendanceData.sessions.length} session${attendanceData.sessions.length !== 1 ? 's' : ''} recorded`
                  : 'No sessions yet — add a date below'}
              </p>
              <button onClick={fetchAttendance} className="text-xs text-purple-600 hover:text-purple-700">Refresh</button>
            </div>

            {/* Per-student summary badges */}
            {attendanceData && attendanceData.students.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attendanceData.students.map(s => (
                  <span key={s.student_id}
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      s.attendance_pct >= 85 ? 'bg-green-100 text-green-700'
                      : s.attendance_pct >= 60 ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                    {s.student?.first_name} {s.student?.last_name} — {s.attendance_pct}%
                  </span>
                ))}
              </div>
            )}

            {attendanceLoading ? (
              <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="bg-white/60 rounded-xl p-5 border border-white/30 animate-pulse h-20"/>)}</div>
            ) : !attendanceData || attendanceData.sessions.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-10 text-center border border-white/30">
                <p className="text-gray-500 text-sm">No sessions recorded yet.</p>
                <p className="text-xs text-gray-400 mt-2">Add a session date below to start tracking attendance.</p>
              </div>
            ) : (
              /* Session cards — one card per date */
              <div className="space-y-4">
                {attendanceData.sessions.map(date => (
                  <div key={date} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
                    {/* Session header */}
                    <div className="px-5 py-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-white/20">
                      <p className="font-semibold text-gray-800 text-sm">
                        📅 Session: {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    {/* Students for this date */}
                    <div className="divide-y divide-gray-100">
                      {attendanceData.students.length === 0 ? (
                        <p className="px-5 py-4 text-sm text-gray-400">No students enrolled.</p>
                      ) : (
                        attendanceData.students.map(s => {
                          const current = s.records[date] || 'absent';
                          const key = `${s.student_id}-${date}`;
                          const isMarking = markingAttendance === key;
                          return (
                            <div key={s.student_id} className="flex items-center justify-between px-5 py-3 hover:bg-white/40 transition">
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {s.student?.first_name} {s.student?.last_name}
                                </p>
                                <p className="text-xs text-gray-400">{s.student?.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Current status badge */}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${current === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {current === 'present' ? 'Present' : 'Absent'}
                                </span>
                                {/* Toggle buttons */}
                                <button
                                  onClick={() => handleMarkAttendance(s.student_id, date, 'present')}
                                  disabled={isMarking || current === 'present'}
                                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                                    current === 'present'
                                      ? 'bg-green-500 text-white cursor-default'
                                      : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700 disabled:opacity-50'
                                  }`}
                                >
                                  {isMarking ? '…' : 'Present'}
                                </button>
                                <button
                                  onClick={() => handleMarkAttendance(s.student_id, date, 'absent')}
                                  disabled={isMarking || current === 'absent'}
                                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                                    current === 'absent'
                                      ? 'bg-red-500 text-white cursor-default'
                                      : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700 disabled:opacity-50'
                                  }`}
                                >
                                  {isMarking ? '…' : 'Absent'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add session date */}
            <AddSessionDate offeringId={offeringId} onAdded={fetchAttendance} />
          </div>
        )}
      </div>
      {/* Remove Student Confirmation */}
      {removeConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Remove Student?</h2>
            <p className="text-sm text-gray-600 mb-6">
              Remove <strong>{removeConfirm.student?.first_name} {removeConfirm.student?.last_name}</strong> from this course?
              Their submissions and progress will be preserved but they will lose access.
            </p>
            <div className="flex gap-3">
              <button onClick={handleRemoveStudent} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition">Remove</button>
              <button onClick={() => setRemoveConfirm(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      <EditAssignmentModal
        isOpen={!!editAssignment}
        onClose={() => setEditAssignment(null)}
        onSuccess={() => { setEditAssignment(null); fetchAll(); }}
        assignment={editAssignment}
      />

      {/* View Submissions Modal */}
      {viewSubmissionsFor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Submissions</h2>
                <p className="text-sm text-gray-500 mt-0.5">{viewSubmissionsFor.title}</p>
              </div>
              <button onClick={() => setViewSubmissionsFor(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Submissions list */}
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {submissionsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-16">
                  <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No submissions yet for this assignment.</p>
                </div>
              ) : (
                submissions.map((sub: any) => (
                  <SubmissionCard
                    key={sub.id}
                    sub={sub}
                    assignmentTitle={viewSubmissionsFor.title}
                    onRefresh={() => fetchSubmissionsForAssignment(viewSubmissionsFor)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      {gradeSubmission && (
        <GradeSubmissionModal
          isOpen={!!gradeSubmission}
          onClose={() => setGradeSubmission(null)}
          onSuccess={() => {
            setGradeSubmission(null);
            if (viewSubmissionsFor) fetchSubmissionsForAssignment(viewSubmissionsFor);
          }}
          submissionId={gradeSubmission.id}
          assignmentTitle={viewSubmissionsFor?.title || ''}
          studentName={`${gradeSubmission.profiles?.first_name} ${gradeSubmission.profiles?.last_name}`}
          attachmentUrl={gradeSubmission.attachment_url}
        />
      )}

    </DashboardLayout>
  );
}
