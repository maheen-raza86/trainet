'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import GradeSubmissionModal from '@/components/trainer/GradeSubmissionModal';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';

interface StudentRecord {
  student_id: string;
  enrollment_id: string;
  offering_id: string;
  course_title: string;
  student: {
    first_name: string;
    last_name: string;
    email: string;
  };
  progress: number;
  submitted_assignments: number;
  total_assignments: number;
  average_grade: number | null;
  attendance_pct: number | null;
}

interface SubmissionDetail {
  id: string;
  assignment_id: string;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  attachment_url: string | null;
  assignment_title?: string;
}

export default function TrainerStudents() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Student detail modal
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [studentSubmissions, setStudentSubmissions] = useState<SubmissionDetail[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<{ pct: number; sessions: number; present: number } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Grade modal
  const [gradeTarget, setGradeTarget] = useState<SubmissionDetail | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all trainer offerings
      const offeringsRes: any = await apiClient.get('/course-offerings/trainer');
      const offerings = offeringsRes.data?.offerings || [];

      const allStudents: StudentRecord[] = [];

      for (const offering of offerings) {
        try {
          // Get student progress for this offering (includes enrollment info)
          const progressRes: any = await apiClient.get(`/progress/offering/${offering.id}/students`);
          const progressStudents = progressRes.data?.students || [];

          // Get attendance for this offering
          let attendanceMap: Record<string, number> = {};
          try {
            const attRes: any = await apiClient.get(`/attendance/offering/${offering.id}`);
            const attStudents = attRes.data?.students || [];
            attStudents.forEach((s: any) => {
              attendanceMap[s.student_id] = s.attendance_pct ?? 0;
            });
          } catch { /* skip */ }

          for (const s of progressStudents) {
            allStudents.push({
              student_id: s.student_id,
              enrollment_id: s.enrollment_id || '',
              offering_id: offering.id,
              course_title: offering.courses?.title || 'Unknown Course',
              student: s.student,
              progress: s.progress ?? 0,
              submitted_assignments: s.submitted_assignments ?? 0,
              total_assignments: s.total_assignments ?? 0,
              average_grade: s.average_grade ?? null,
              attendance_pct: attendanceMap[s.student_id] ?? null,
            });
          }
        } catch { /* skip offering */ }
      }

      setStudents(allStudents);
    } catch (err: any) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const openStudentDetail = async (student: StudentRecord) => {
    setSelectedStudent(student);
    setDetailLoading(true);
    setStudentSubmissions([]);
    setStudentAttendance(null);

    try {
      // Fetch assignments for this offering, then submissions by this student
      const assignmentsRes: any = await apiClient.get(`/assignments/course-offering/${student.offering_id}`);
      const assignments = assignmentsRes.data?.assignments || [];

      const subs: SubmissionDetail[] = [];
      for (const a of assignments) {
        try {
          const subRes: any = await apiClient.get(`/submissions/assignment/${a.id}`);
          const allSubs = subRes.data?.submissions || [];
          const studentSub = allSubs.find((s: any) => s.student_id === student.student_id);
          if (studentSub) {
            subs.push({ ...studentSub, assignment_title: a.title });
          }
        } catch { /* skip */ }
      }
      setStudentSubmissions(subs);

      // Attendance summary
      try {
        const attRes: any = await apiClient.get(`/attendance/offering/${student.offering_id}`);
        const attStudents = attRes.data?.students || [];
        const sessions: string[] = attRes.data?.sessions || [];
        const attStudent = attStudents.find((s: any) => s.student_id === student.student_id);
        if (attStudent) {
          const presentCount = sessions.filter(d => attStudent.records?.[d] === 'present').length;
          setStudentAttendance({ pct: attStudent.attendance_pct ?? 0, sessions: sessions.length, present: presentCount });
        }
      } catch { /* skip */ }
    } catch { /* ignore */ } finally {
      setDetailLoading(false);
    }
  };

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      s.student?.first_name?.toLowerCase().includes(q) ||
      s.student?.last_name?.toLowerCase().includes(q) ||
      s.student?.email?.toLowerCase().includes(q) ||
      s.course_title?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout title="My Students" subtitle="All students enrolled across your course offerings">
      <div className="space-y-6">

        {/* Search */}
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or course..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/60 backdrop-blur-sm"
          />
          <span className="text-sm text-gray-500 shrink-0">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/30 animate-pulse h-24" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={fetchStudents} className="mt-3 text-red-600 underline text-sm">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/30">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {search ? 'No students match your search' : 'No students enrolled yet'}
            </h3>
            <p className="text-gray-500 text-sm">
              {search ? 'Try a different search term.' : 'Students will appear here once they enroll in your course offerings.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s, idx) => (
              <div key={`${s.student_id}-${s.offering_id}-${idx}`}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/30 hover:bg-white/80 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">
                        {s.student?.first_name?.[0]}{s.student?.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {s.student?.first_name} {s.student?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{s.student?.email}</p>
                      <p className="text-xs text-purple-600 mt-0.5">Enrolled in: <span className="font-medium">{s.course_title}</span></p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 text-center">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{s.progress}%</p>
                      <p className="text-xs text-gray-400">Progress</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{s.submitted_assignments}/{s.total_assignments}</p>
                      <p className="text-xs text-gray-400">Submitted</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{s.average_grade !== null ? `${s.average_grade}%` : '—'}</p>
                      <p className="text-xs text-gray-400">Avg Grade</p>
                    </div>
                    {s.attendance_pct !== null && (
                      <div>
                        <p className="text-sm font-bold text-gray-800">{s.attendance_pct}%</p>
                        <p className="text-xs text-gray-400">Attendance</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => openStudentDetail(s)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition shrink-0">
                    View Student
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">
                    {selectedStudent.student?.first_name?.[0]}{selectedStudent.student?.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedStudent.student?.first_name} {selectedStudent.student?.last_name}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedStudent.student?.email}</p>
                  <p className="text-xs text-purple-600 mt-0.5">Course: <span className="font-medium">{selectedStudent.course_title}</span></p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                </div>
              ) : (
                <>
                  {/* Summary stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-purple-700">{selectedStudent.progress}%</p>
                      <p className="text-xs text-purple-500 mt-0.5">Progress</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-blue-700">{selectedStudent.submitted_assignments}/{selectedStudent.total_assignments}</p>
                      <p className="text-xs text-blue-500 mt-0.5">Assignments</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-green-700">{selectedStudent.average_grade !== null ? `${selectedStudent.average_grade}%` : '—'}</p>
                      <p className="text-xs text-green-500 mt-0.5">Avg Grade</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-orange-700">
                        {studentAttendance !== null ? `${studentAttendance.pct}%` : '—'}
                      </p>
                      <p className="text-xs text-orange-500 mt-0.5">Attendance</p>
                    </div>
                  </div>

                  {/* Attendance detail */}
                  {studentAttendance && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2 text-sm">Attendance History</h3>
                      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                        {studentAttendance.present} present out of {studentAttendance.sessions} session{studentAttendance.sessions !== 1 ? 's' : ''} ({studentAttendance.pct}%)
                      </div>
                    </div>
                  )}

                  {/* Submitted assignments */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 text-sm">Submitted Assignments</h3>
                    {studentSubmissions.length === 0 ? (
                      <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4">No submissions yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {studentSubmissions.map(sub => (
                          <div key={sub.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-800 text-sm">{sub.assignment_title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Submitted: {new Date(sub.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </p>
                                {sub.attachment_url && (
                                  <a href={sub.attachment_url} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-purple-600 hover:underline mt-1 inline-block">
                                    📎 View Attachment
                                  </a>
                                )}
                                {sub.feedback && (
                                  <p className="text-xs text-gray-600 mt-2 bg-white rounded-lg p-2 border border-gray-100">
                                    <span className="font-medium">Feedback:</span> {sub.feedback}
                                  </p>
                                )}
                              </div>
                              <div className="ml-4 flex flex-col items-end gap-2">
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${sub.grade !== null ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {sub.grade !== null ? `${sub.grade}/100` : 'Pending'}
                                </span>
                                <button
                                  onClick={() => setGradeTarget(sub)}
                                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200 transition">
                                  {sub.grade !== null ? 'Update Grade' : 'Grade'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      {gradeTarget && selectedStudent && (
        <GradeSubmissionModal
          isOpen={!!gradeTarget}
          onClose={() => setGradeTarget(null)}
          onSuccess={() => {
            setGradeTarget(null);
            if (selectedStudent) openStudentDetail(selectedStudent);
          }}
          submissionId={gradeTarget.id}
          assignmentTitle={gradeTarget.assignment_title || ''}
          studentName={`${selectedStudent.student?.first_name} ${selectedStudent.student?.last_name}`}
          attachmentUrl={gradeTarget.attachment_url || undefined}
        />
      )}
    </DashboardLayout>
  );
}
