
'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import SubmissionModal from '@/components/student/SubmissionModal';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AcademicCapIcon, DocumentTextIcon, LinkIcon, VideoCameraIcon,
  ClockIcon, ArrowTopRightOnSquareIcon, SparklesIcon,
  CalendarIcon, ExclamationTriangleIcon, XCircleIcon,
} from '@heroicons/react/24/outline';

/* ── Types ── */
interface Material { id:string; title:string; description:string|null; material_type:string; file_url:string|null; external_url:string|null; file_name:string|null; }
interface Assignment { id:string; title:string; description:string; due_date:string; course_offering_id:string; }
interface Submission { id:string; assignment_id:string; status:string; grade:number|null; feedback:string|null; ai_score:number|null; ai_feedback:string|null; plagiarism_score:number|null; plagiarism_status:string|null; final_score:number|null; trainer_feedback:string|null; missing_concepts:string|null; plagiarism_percentage:number|null; ai_status:string|null; trainer_override:boolean; }
interface OfferingDetail {
  id:string; duration_weeks:number; hours_per_week:number; outline:string; status:string;
  live_session_link:string|null; live_session_notes:string|null;
  start_date:string|null; end_date:string|null;
  weekly_days:string[]|null; session_start_time:string|null; session_end_time:string|null;
  courses:{ id:string; title:string; description:string };
  profiles:{ id:string; first_name:string; last_name:string; email:string };
  materials:Material[];
}

/* ── Helpers ── */
const fmtTime = (t:string|null) => {
  if (!t) return '';
  const [h,m] = t.split(':');
  const hr = parseInt(h);
  return `${hr>12?hr-12:hr||12}:${m} ${hr>=12?'PM':'AM'}`;
};
const fmtDate = (d:string|null) => d ? new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—';

/* Correct weeks remaining: floor division, show days if < 1 week */
const timeRemaining = (end:string|null): string|null => {
  if (!end) return null;
  const diffMs = new Date(end).getTime() - Date.now();
  if (diffMs <= 0) return 'Course Ended';
  const diffDays = Math.floor(diffMs / (24*3600*1000));
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} remaining`;
};
const getWeekLabel = (dueDate:string, startDate:string|null) => {
  if (!startDate) return 'Assignments';
  const start = new Date(startDate);
  const due = new Date(dueDate);
  const diff = Math.floor((due.getTime()-start.getTime())/(7*24*3600*1000));
  return `Week ${Math.max(1,diff+1)}`;
};

export default function StudentCourseDetail() {
  const params = useParams();
  const router = useRouter();
  const offeringId = params.id as string;

  const [offering, setOffering] = useState<OfferingDetail|null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<'materials'|'assignments'|'live'>('materials');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment|null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [viewFeedback, setViewFeedback] = useState<Submission|null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [certClaiming, setCertClaiming] = useState(false);
  const [certSuccess, setCertSuccess] = useState(false);
  const [existingCert, setExistingCert] = useState<any>(null);
  const [showDropModal, setShowDropModal] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [attendance, setAttendance] = useState<{ records: any[]; present_count: number; total_sessions: number; attendance_pct: number }|null>(null);

  useEffect(() => { fetchAll(); }, [offeringId]);

  const fetchAll = async () => {
    try {
      setLoading(true); setError(null);
      const [detailRes, assignmentsRes, submissionsRes, progressRes, weeklyRes] = await Promise.all([
        apiClient.get(`/materials/offering-detail/${offeringId}`),
        apiClient.get(`/assignments/course-offering/${offeringId}`),
        apiClient.get('/submissions/my'),
        apiClient.get(`/progress/${offeringId}`).catch(()=>null),
        apiClient.get(`/progress/${offeringId}/weekly`).catch(()=>null),
      ]);
      setOffering((detailRes as any).data);
      setAssignments((assignmentsRes as any).data?.assignments || []);
      setSubmissions((submissionsRes as any).data?.submissions || []);
      if (progressRes) setProgress((progressRes as any).data);
      if (weeklyRes) setWeeklyProgress((weeklyRes as any).data);
      // Fetch attendance (non-blocking)
      try {
        const attRes: any = await apiClient.get(`/attendance/student/${offeringId}`);
        setAttendance(attRes.data || null);
      } catch { /* attendance not available yet */ }
      // Fetch existing certificate (non-blocking)
      try {
        const certRes: any = await apiClient.get('/certificates/my');
        const certs = certRes.data?.certificates || [];
        const thisCert = certs.find((c: any) => c.offering_id === offeringId);
        if (thisCert) { setExistingCert(thisCert); setCertSuccess(true); }
      } catch { /* ignore */ }
    } catch (err:any) {
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const getSubmission = (id:string) => submissions.find(s=>s.assignment_id===id);
  const isPastDeadline = (d:string) => new Date(d)<new Date();
  const getMaterialUrl = (m:Material) => m.external_url||(m.file_url?(m.file_url.startsWith('/')?`${process.env.NEXT_PUBLIC_API_URL?.replace('/api','')}${m.file_url}`:m.file_url):null);

  const handleClaimCertificate = async () => {
    try { setCertClaiming(true); await apiClient.post('/certificates/issue',{offeringId}); setCertSuccess(true); fetchAll(); }
    catch(err:any){ alert(err.message||'Failed to claim certificate'); }
    finally { setCertClaiming(false); }
  };

  const handleDrop = async () => {
    try {
      setDropping(true);
      await apiClient.post(`/course-offerings/${offeringId}/drop`);
      router.push('/student/courses');
    } catch(err:any){ alert(err.message||'Failed to drop course'); }
    finally { setDropping(false); setShowDropModal(false); }
  };

  // Fetch the latest submission from backend before opening the feedback modal
  const openFeedback = async (submission: Submission) => {
    setFeedbackLoading(true);
    setViewFeedback(submission); // show modal immediately with cached data
    try {
      const res: any = await apiClient.get(`/submissions/${submission.id}`);
      if (res?.data) setViewFeedback(res.data);
    } catch { /* keep cached data on error */ }
    finally { setFeedbackLoading(false); }
  };

  /* group assignments by week */
  const groupedAssignments = assignments.reduce((acc, a) => {
    const label = getWeekLabel(a.due_date, offering?.start_date||null);
    if (!acc[label]) acc[label] = [];
    acc[label].push(a);
    return acc;
  }, {} as Record<string, Assignment[]>);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"/>
      </div>
    </DashboardLayout>
  );

  if (error||!offering) return (
    <DashboardLayout>
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error||'Course not found'}</p>
        <Link href="/student/courses" className="mt-4 inline-block text-purple-600 underline">Back to Courses</Link>
      </div>
    </DashboardLayout>
  );

  const isCourseEnded = offering.status==='completed'||(!!offering.end_date&&new Date(offering.end_date)<new Date());
  const completionPct = progress?.progress ?? 0;
  const timeLeft = timeRemaining(offering.end_date);
  const behind = weeklyProgress&&weeklyProgress.weekly_total>0&&weeklyProgress.weekly_submitted<weeklyProgress.weekly_total;
  const attendancePct = attendance?.attendance_pct ?? 0;
  // Certificate eligibility: 100% assignments submitted AND 85%+ attendance
  const allSubmitted = progress && progress.total_assignments > 0 && progress.submitted_assignments >= progress.total_assignments;
  const attendanceOk = attendance === null || attendance.total_sessions === 0 || attendancePct >= 85;
  const certEligible = allSubmitted && attendanceOk;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Link href="/student/courses" className="text-white/70 hover:text-white text-sm mb-3 inline-block">
                ← Back to My Courses
              </Link>
              <h1 className="text-2xl font-bold mb-1">{offering.courses.title}</h1>
              <p className="text-white/80 text-sm mb-3">{offering.courses.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-white/80">
                <span>👨‍🏫 {offering.profiles.first_name} {offering.profiles.last_name}</span>
                <span>⏱ {offering.duration_weeks} weeks · {offering.hours_per_week}h/week</span>
                {isCourseEnded&&<span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">Course Ended</span>}
              </div>
            </div>
            {!isCourseEnded&&(
              <button onClick={()=>setShowDropModal(true)}
                className="ml-4 px-4 py-2 border-2 border-red-300 text-red-200 rounded-xl text-sm font-medium hover:bg-red-500/20 transition shrink-0">
                Drop Course
              </button>
            )}
          </div>
        </div>

        {/* Course Ended Banner */}
        {isCourseEnded&&(
          <div className="bg-gray-100 border border-gray-300 rounded-2xl p-5 text-center">
            <AcademicCapIcon className="w-10 h-10 text-gray-400 mx-auto mb-2"/>
            <p className="font-semibold text-gray-700">This course has ended.</p>
            <p className="text-sm text-gray-500 mt-1">You can still view your grades, materials, and download your certificate below.</p>
          </div>
        )}

        {/* Behind Warning */}
        {!isCourseEnded&&behind&&(
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 shrink-0"/>
            <p className="text-sm text-yellow-700">
              You missed {weeklyProgress.weekly_total-weeklyProgress.weekly_submitted} assignment(s) this week. Stay on track!
            </p>
          </div>
        )}

        {/* Schedule Card */}
        {(offering.start_date||offering.weekly_days)&&(
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/30">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-purple-500"/>Course Schedule
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {offering.start_date&&<div><p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Start Date</p><p className="font-medium text-gray-800">{fmtDate(offering.start_date)}</p></div>}
              {offering.end_date&&<div><p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">End Date</p><p className="font-medium text-gray-800">{fmtDate(offering.end_date)}</p></div>}
              {offering.weekly_days&&offering.weekly_days.length>0&&<div><p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Schedule</p><p className="font-medium text-gray-800">{offering.weekly_days.join(', ')}</p></div>}
              {(offering.session_start_time||offering.session_end_time)&&<div><p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Session Time</p><p className="font-medium text-gray-800">{fmtTime(offering.session_start_time)}{offering.session_end_time?` – ${fmtTime(offering.session_end_time)}`:''}</p></div>}
              <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Weekly Hours</p><p className="font-medium text-gray-800">{offering.hours_per_week}h/week</p></div>
              {timeLeft&&<div><p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Time Remaining</p><p className={`font-medium ${timeLeft==='Course Ended'?'text-gray-500':'text-purple-600'}`}>{timeLeft}</p></div>}
            </div>
          </div>
        )}

        {/* Progress Panel */}
        {progress&&(
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/30 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">My Progress</h2>
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${completionPct>=70?'bg-green-100 text-green-700':completionPct>0?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-600'}`}>
                {completionPct>=70?'✓ On Track':completionPct>0?'In Progress':'Not Started'}
              </span>
            </div>
            {/* Overall */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Assignment Completion</span><span className="font-medium">{progress.submitted_assignments}/{progress.total_assignments}</span></div>
              <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500" style={{width:`${completionPct}%`}}/></div>
            </div>
            {/* Attendance */}
            {attendance!==null&&attendance.total_sessions>0&&(
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Attendance</span>
                  <span className={`font-medium ${attendancePct>=85?'text-green-600':attendancePct>=60?'text-yellow-600':'text-red-600'}`}>{attendancePct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-500 ${attendancePct>=85?'bg-green-500':attendancePct>=60?'bg-yellow-400':'bg-red-400'}`} style={{width:`${attendancePct}%`}}/>
                </div>
              </div>
            )}
            {/* Weekly */}
            {weeklyProgress&&weeklyProgress.weekly_total>0&&(
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1"><span>This Week</span><span className="font-medium">{weeklyProgress.weekly_submitted}/{weeklyProgress.weekly_total} assignments</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full transition-all duration-500 ${weeklyProgress.weekly_progress===100?'bg-green-500':'bg-yellow-400'}`} style={{width:`${weeklyProgress.weekly_progress}%`}}/></div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/60 rounded-xl p-3 border border-white/30"><p className="text-2xl font-bold text-gray-800">{progress.submitted_assignments}</p><p className="text-xs text-gray-500">Submitted</p></div>
              <div className="bg-white/60 rounded-xl p-3 border border-white/30"><p className="text-2xl font-bold text-gray-800">{progress.total_assignments}</p><p className="text-xs text-gray-500">Total</p></div>
              <div className="bg-white/60 rounded-xl p-3 border border-white/30"><p className="text-2xl font-bold text-gray-800">{progress.average_grade!==null?progress.average_grade:'—'}</p><p className="text-xs text-gray-500">Avg Score</p></div>
            </div>

            {/* Certificate eligibility */}
            {certSuccess || existingCert ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎓</span>
                  <div>
                    <p className="font-semibold text-green-700 text-sm">Certificate Issued!</p>
                    <p className="text-xs text-green-600">Congratulations on completing this course.</p>
                  </div>
                </div>
                {existingCert && (
                  <Link href="/student/certificates"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-600 transition">
                    <AcademicCapIcon className="w-4 h-4" />
                    View Certificate
                  </Link>
                )}
              </div>
            ) : certEligible ? (
              <button onClick={handleClaimCertificate} disabled={certClaiming}
                className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl text-sm font-semibold hover:from-yellow-500 hover:to-orange-500 transition disabled:opacity-50">
                {certClaiming?'Claiming...':'🎓 Claim Certificate'}
              </button>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700">🔒 Certificate Locked</p>
                <p className="text-xs text-gray-500">You need both of the following:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={allSubmitted?'text-green-500':'text-red-500'}>{allSubmitted?'✓':'✗'}</span>
                    <span className={allSubmitted?'text-green-700':'text-gray-600'}>
                      100% assignment completion {!allSubmitted&&progress.total_assignments>0&&`(${progress.submitted_assignments}/${progress.total_assignments} done)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={attendanceOk?'text-green-500':'text-red-500'}>{attendanceOk?'✓':'✗'}</span>
                    <span className={attendanceOk?'text-green-700':'text-gray-600'}>
                      85% attendance {!attendanceOk&&`(currently ${attendancePct}%)`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attendance History Card */}
        {attendance&&attendance.total_sessions>0&&(
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/30">
            <h2 className="font-semibold text-gray-800 mb-3">Attendance History</h2>
            <div className="space-y-2">
              {attendance.records.map((r:any)=>(
                <div key={r.session_date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{new Date(r.session_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                  <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${r.status==='present'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                    {r.status==='present'?'Present':'Absent'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">{attendance.present_count} of {attendance.total_sessions} sessions attended</span>
              <span className={`font-semibold ${attendancePct>=85?'text-green-600':attendancePct>=60?'text-yellow-600':'text-red-600'}`}>{attendancePct}%</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/30">
          {(['materials','assignments','live'] as const).map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab===tab?'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow':'text-gray-600 hover:text-gray-900'}`}>
              {tab==='materials'?'📚 Materials':tab==='assignments'?'📝 Assignments':'🎥 Live Sessions'}
            </button>
          ))}
        </div>

        {/* Materials */}
        {activeTab==='materials'&&(
          <div className="space-y-3">
            {offering.materials.length>0 ? offering.materials.map(m=>{
              const url=getMaterialUrl(m);
              return (
                <div key={m.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 flex items-center justify-between hover:bg-white/80 transition">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center text-purple-600">
                      {m.material_type==='video'?<VideoCameraIcon className="w-5 h-5"/>:m.material_type==='link'?<LinkIcon className="w-5 h-5"/>:<DocumentTextIcon className="w-5 h-5"/>}
                    </div>
                    <div><p className="font-medium text-gray-800">{m.title}</p>{m.file_name&&<p className="text-xs text-gray-400">{m.file_name}</p>}</div>
                  </div>
                  {url&&<a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm hover:from-purple-600 hover:to-blue-600 transition"><ArrowTopRightOnSquareIcon className="w-4 h-4"/><span>Open</span></a>}
                </div>
              );
            }) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-12 text-center border border-white/30"><DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No materials uploaded yet</p></div>
            )}
          </div>
        )}

        {/* Assignments — grouped by week */}
        {activeTab==='assignments'&&(
          <div className="space-y-6">
            {Object.keys(groupedAssignments).length>0 ? Object.entries(groupedAssignments).map(([weekLabel,weekAssignments])=>(
              <div key={weekLabel}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">{weekLabel}</h3>
                <div className="space-y-3">
                  {weekAssignments.map(assignment=>{
                    const submission=getSubmission(assignment.id);
                    const past=isPastDeadline(assignment.due_date);
                    const canSubmit=!isCourseEnded&&!submission&&!past;
                    return (
                      <div key={assignment.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/30">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                              {submission?.grade!==null&&submission?.grade!==undefined
                                ?<span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Graded</span>
                                :submission?<span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Submitted</span>
                                :past?<span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Closed</span>
                                :<span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                            <p className="text-xs text-gray-500 flex items-center"><ClockIcon className="w-3 h-3 mr-1"/>Due: {new Date(assignment.due_date).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}</p>
                            {submission?.grade!==null&&submission?.grade!==undefined&&<p className="text-sm text-green-600 font-medium mt-1">Score: {submission.grade}/100</p>}
                          </div>
                          <div className="ml-4 flex flex-col space-y-2">
                            {canSubmit&&<button onClick={()=>{setSelectedAssignment(assignment);setIsSubmitModalOpen(true);}} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm hover:from-purple-600 hover:to-blue-600 transition">Submit</button>}
                            {submission&&<button onClick={()=>openFeedback(submission)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition">View Feedback</button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-12 text-center border border-white/30"><DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No assignments yet</p></div>
            )}
          </div>
        )}

        {/* Live Sessions */}
        {activeTab==='live'&&(
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            {offering.live_session_link ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl flex items-center justify-center"><VideoCameraIcon className="w-6 h-6 text-white"/></div>
                  <div><h3 className="font-semibold text-gray-800">Live Session</h3><p className="text-sm text-gray-500">Click to join</p></div>
                </div>
                {offering.live_session_notes&&<p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{offering.live_session_notes}</p>}
                {!isCourseEnded
                  ? <a href={offering.live_session_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition font-medium"><VideoCameraIcon className="w-5 h-5"/><span>Join Live Session</span><ArrowTopRightOnSquareIcon className="w-4 h-4"/></a>
                  : <p className="text-sm text-gray-400 italic">Live sessions are no longer available for this course.</p>}
              </div>
            ) : (
              <div className="text-center py-8"><VideoCameraIcon className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No live session scheduled yet</p></div>
            )}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {selectedAssignment&&<SubmissionModal isOpen={isSubmitModalOpen} onClose={()=>setIsSubmitModalOpen(false)} onSuccess={fetchAll} assignment={selectedAssignment}/>}

      {/* Feedback Modal */}
      {viewFeedback&&(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Submission Feedback</h2>
              <button onClick={()=>setViewFeedback(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
                <XCircleIcon className="w-5 h-5"/>
              </button>
            </div>

            {/* Loading overlay */}
            {feedbackLoading && (
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"/>
                <p className="text-xs text-blue-600">Fetching latest results...</p>
              </div>
            )}

            <div className="p-6 space-y-4">
              {/* ── STATE: Pending AI Check ── */}
              {(!viewFeedback.ai_status || viewFeedback.ai_status === 'Pending AI Check' || viewFeedback.ai_status === 'AI Check Failed') && (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ClockIcon className="w-7 h-7 text-yellow-600"/>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                    {viewFeedback.ai_status || 'Pending AI Check'}
                  </span>
                  <p className="text-gray-500 text-sm mt-3">Your submission is being reviewed. Check back soon.</p>
                </div>
              )}

              {/* ── STATE: AI Checked ── */}
              {viewFeedback.ai_status === 'AI Checked' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">AI Checked</span>
                    <span className="text-xs text-gray-400">Awaiting trainer review</span>
                  </div>

                  {/* AI Score */}
                  {viewFeedback.ai_score !== null && (
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <SparklesIcon className="w-4 h-4 text-purple-600"/>
                        <p className="text-sm font-medium text-purple-700">AI Score</p>
                      </div>
                      <p className="text-3xl font-bold text-purple-600">{viewFeedback.ai_score}<span className="text-lg text-gray-400">/100</span></p>
                      {viewFeedback.ai_feedback && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{viewFeedback.ai_feedback}</p>}
                    </div>
                  )}

                  {/* Missing Concepts */}
                  {(() => { try { const mc = JSON.parse(viewFeedback.missing_concepts||'[]'); if(!mc.length) return null; return (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Missing Concepts</p>
                      <div className="flex flex-wrap gap-1.5">{mc.map((c:string,i:number)=><span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">{c}</span>)}</div>
                    </div>
                  ); } catch { return null; } })()}

                  {/* Plagiarism */}
                  {viewFeedback.plagiarism_percentage !== null && viewFeedback.plagiarism_percentage !== undefined && (
                    <div className={`p-3 rounded-xl border text-sm ${viewFeedback.plagiarism_status==='flagged'||viewFeedback.plagiarism_status==='High Plagiarism'?'bg-red-50 border-red-200 text-red-700':viewFeedback.plagiarism_status==='suspicious'||viewFeedback.plagiarism_status==='Warning'?'bg-yellow-50 border-yellow-200 text-yellow-700':'bg-green-50 border-green-200 text-green-700'}`}>
                      <p className="font-medium">Plagiarism: {viewFeedback.plagiarism_percentage}%</p>
                    </div>
                  )}
                </>
              )}

              {/* ── STATE: Finalized ── */}
              {viewFeedback.ai_status === 'Finalized' && (
                <>
                  {/* Status row */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">✓ Finalized</span>
                    {viewFeedback.final_score !== null && (
                      <span className={`px-3 py-1 text-xs rounded-full font-semibold border ${viewFeedback.final_score>=80?'bg-green-100 text-green-700 border-green-200':viewFeedback.final_score>=60?'bg-yellow-100 text-yellow-700 border-yellow-200':'bg-red-100 text-red-700 border-red-200'}`}>
                        Final: {viewFeedback.final_score}/100
                      </span>
                    )}
                    {viewFeedback.ai_score !== null && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium border border-purple-200">
                        AI: {viewFeedback.ai_score}/100
                      </span>
                    )}
                    {viewFeedback.plagiarism_percentage !== null && viewFeedback.plagiarism_percentage !== undefined && (
                      <span className={`px-3 py-1 text-xs rounded-full font-medium border ${viewFeedback.plagiarism_percentage>70?'bg-red-100 text-red-700 border-red-200':viewFeedback.plagiarism_percentage>=31?'bg-yellow-100 text-yellow-700 border-yellow-200':'bg-green-100 text-green-700 border-green-200'}`}>
                        Plagiarism: {viewFeedback.plagiarism_percentage}%
                      </span>
                    )}
                  </div>

                  {/* Final Score card */}
                  {viewFeedback.final_score !== null && (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-xs text-gray-500 mb-1">Final Score</p>
                      <p className="text-3xl font-bold text-green-600">{viewFeedback.final_score}<span className="text-lg text-gray-400">/100</span></p>
                      <p className="text-xs text-gray-500 mt-1">✓ Reviewed by trainer</p>
                    </div>
                  )}

                  {/* Trainer Feedback */}
                  {viewFeedback.trainer_feedback && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Trainer Feedback</p>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">{viewFeedback.trainer_feedback}</p>
                    </div>
                  )}

                  {/* AI Feedback */}
                  {viewFeedback.ai_score !== null && (
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <SparklesIcon className="w-4 h-4 text-purple-600"/>
                        <p className="text-sm font-medium text-purple-700">AI Evaluation</p>
                        <span className="text-xs text-purple-500">{viewFeedback.ai_score}/100</span>
                      </div>
                      {viewFeedback.ai_feedback && <p className="text-sm text-gray-600 leading-relaxed">{viewFeedback.ai_feedback}</p>}
                    </div>
                  )}

                  {/* Missing Concepts */}
                  {(() => { try { const mc = JSON.parse(viewFeedback.missing_concepts||'[]'); if(!mc.length) return null; return (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Missing Concepts</p>
                      <div className="flex flex-wrap gap-1.5">{mc.map((c:string,i:number)=><span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">{c}</span>)}</div>
                    </div>
                  ); } catch { return null; } })()}
                </>
              )}

              <button onClick={()=>setViewFeedback(null)} className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Drop Course Modal */}
      {showDropModal&&(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4"><XCircleIcon className="w-8 h-8 text-red-500"/><h2 className="text-xl font-bold text-gray-800">Drop Course?</h2></div>
            <p className="text-gray-600 mb-3">Are you sure you want to drop <strong>{offering.courses.title}</strong>?</p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 space-y-1 text-sm text-red-700">
              <p>You will lose access to:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2"><li>Course materials</li><li>Assignment submissions</li><li>Course progress</li><li>Live sessions</li></ul>
              <p className="font-semibold mt-2">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setShowDropModal(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">Keep Course</button>
              <button onClick={handleDrop} disabled={dropping} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition disabled:opacity-50">{dropping?'Dropping...':'Yes, Drop Course'}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
