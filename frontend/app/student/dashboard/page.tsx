'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import Link from 'next/link';
import {
  AcademicCapIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  PlayIcon,
  DocumentTextIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Offering {
  id: string;
  status: string;
  duration_weeks: number;
  hours_per_week: number;
  start_date: string | null;
  end_date: string | null;
  courses: { id: string; title: string; description: string };
  profiles: { first_name: string; last_name: string } | null;
}

interface Enrollment {
  id: string;
  offering_id: string;
  progress: number;
  enrolled_at: string;
  course_offerings: Offering;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  course_offering_id: string;
}

interface CourseProgress {
  offeringId: string;
  submitted: number;
  required: number;
  pct: number;
}

interface RecommendedOffering {
  id: string;
  title: string;
  description: string;
  trainerName: string;
  durationWeeks: number;
  hoursPerWeek: number;
  category: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** A course is active if it has no end_date OR end_date >= today */
const isActive = (offering: Offering): boolean => {
  if (!offering.end_date) return true;
  return new Date(offering.end_date) >= new Date();
};

/** Due-date badge */
const dueBadge = (dueDate: string): { label: string; cls: string } => {
  const now  = new Date();
  const due  = new Date(dueDate);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { label: 'Overdue',   cls: 'bg-red-100 text-red-700 border-red-200' };
  if (diff <= 3) return { label: 'Due Soon',  cls: 'bg-orange-100 text-orange-700 border-orange-200' };
  return           { label: 'Upcoming',   cls: 'bg-blue-100 text-blue-700 border-blue-200' };
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * Simple keyword-based recommendation:
 * Given enrolled course titles, return open offerings whose title shares
 * a keyword with the enrolled titles, excluding already-enrolled offerings.
 */
const buildRecommendations = (
  enrolledOfferingIds: Set<string>,
  enrolledTitles: string[],
  allOfferings: RecommendedOffering[],
): RecommendedOffering[] => {
  // Extract meaningful keywords from enrolled course titles
  const stopWords = new Set(['and', 'the', 'for', 'with', 'in', 'of', 'a', 'an', 'to']);
  const keywords = new Set<string>();
  enrolledTitles.forEach(t =>
    t.toLowerCase().split(/\s+/).forEach(w => {
      if (w.length > 2 && !stopWords.has(w)) keywords.add(w);
    })
  );

  // Score each non-enrolled offering
  const scored = allOfferings
    .filter(o => !enrolledOfferingIds.has(o.id))
    .map(o => {
      const titleWords = o.title.toLowerCase().split(/\s+/);
      const matches = titleWords.filter(w => keywords.has(w)).length;
      return { ...o, score: matches };
    })
    .sort((a, b) => b.score - a.score);

  // Return top 4 (at least show something even if score=0)
  return scored.slice(0, 4);
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [enrollments,    setEnrollments]    = useState<Enrollment[]>([]);
  const [assignments,    setAssignments]    = useState<Assignment[]>([]);
  const [submissions,    setSubmissions]    = useState<Set<string>>(new Set());
  const [courseProgress, setCourseProgress] = useState<Map<string, CourseProgress>>(new Map());
  const [allOfferings,   setAllOfferings]   = useState<RecommendedOffering[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  // Role guard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== 'student') {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'student') fetchAll();
  }, [user]);

  if (!isLoading && isAuthenticated && user && user.role !== 'student') return null;

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Enrollments + submissions in parallel
      const [enrollRes, subRes, offeringsRes]: any[] = await Promise.all([
        apiClient.get('/enrollments/my'),
        apiClient.get('/submissions/my'),
        apiClient.get('/course-offerings/available').catch(() => ({ data: { offerings: [] } })),
      ]);

      const rawEnrollments: Enrollment[] = enrollRes.data?.enrollments || [];
      const rawSubs: any[]               = subRes.data?.submissions    || [];
      // /available returns { data: { offerings: [...] } }
      const rawOfferings: any[]          = offeringsRes.data?.offerings || [];

      const submittedIds = new Set<string>(rawSubs.map((s: any) => s.assignment_id));
      setEnrollments(rawEnrollments);
      setSubmissions(submittedIds);

      // 2. Assignments for every enrolled offering (parallel)
      const allAssignments: Assignment[] = [];
      await Promise.all(
        rawEnrollments.map(async (e) => {
          if (!e.offering_id) return;
          try {
            const aRes: any = await apiClient.get(`/assignments/course-offering/${e.offering_id}`);
            allAssignments.push(...(aRes.data?.assignments || []));
          } catch { /* skip */ }
        })
      );
      setAssignments(allAssignments);

      // 3. Per-course progress from the progress API (parallel)
      const progressMap = new Map<string, CourseProgress>();
      await Promise.all(
        rawEnrollments.map(async (e) => {
          if (!e.offering_id) return;
          try {
            const pRes: any = await apiClient.get(`/progress/${e.offering_id}`);
            const d = pRes.data;
            progressMap.set(e.offering_id, {
              offeringId: e.offering_id,
              submitted:  d.submitted_assignments ?? 0,
              required:   d.total_assignments     ?? 0,
              pct:        d.progress              ?? 0,
            });
          } catch { /* skip */ }
        })
      );
      setCourseProgress(progressMap);

      // 4. All open offerings for recommendations
      const recs: RecommendedOffering[] = rawOfferings
        .filter((o: any) => o.status === 'open')
        .map((o: any) => ({
          id:           o.id,
          title:        o.courses?.title        || 'Course',
          description:  o.courses?.description  || '',
          trainerName:  o.profiles
            ? `${o.profiles.first_name} ${o.profiles.last_name}`.trim()
            : 'TRAINET Trainer',
          durationWeeks: o.duration_weeks  || 0,
          hoursPerWeek:  o.hours_per_week  || 0,
          category:      o.courses?.title?.split(' ')[0] || 'Course',
        }));
      setAllOfferings(recs);

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  // Active enrollments only (end_date >= today or no end_date)
  const activeEnrollments = enrollments.filter(
    e => e.course_offerings && isActive(e.course_offerings)
  );

  // Pending count across ALL enrollments (not just active)
  const pendingCount = assignments.filter(a => !submissions.has(a.id)).length;

  // My Courses: active only, sorted by progress desc
  const myCourses = activeEnrollments
    .filter(e => e.course_offerings)
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))
    .slice(0, 4);

  // Upcoming assignments: not submitted, due >= today, from active courses
  const activeOfferingIds = new Set(activeEnrollments.map(e => e.offering_id));
  const upcomingAssignments = assignments
    .filter(a =>
      !submissions.has(a.id) &&
      a.due_date &&
      activeOfferingIds.has(a.course_offering_id)
    )
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5)
    .map(a => {
      const enrollment = activeEnrollments.find(e => e.offering_id === a.course_offering_id);
      return {
        ...a,
        courseName:  enrollment?.course_offerings?.courses?.title || 'Unknown Course',
        trainerName: enrollment?.course_offerings?.profiles
          ? `${enrollment.course_offerings.profiles.first_name} ${enrollment.course_offerings.profiles.last_name}`.trim()
          : '',
        badge: dueBadge(a.due_date),
      };
    });

  // Recommended courses
  const enrolledIds    = new Set(enrollments.map(e => e.offering_id));
  const enrolledTitles = enrollments
    .map(e => e.course_offerings?.courses?.title || '')
    .filter(Boolean);
  const recommendations = buildRecommendations(enrolledIds, enrolledTitles, allOfferings);

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard" subtitle="Loading your learning progress...">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Student Dashboard" subtitle="Error loading dashboard">
        <div className="bg-red-50/80 border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchAll} className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.firstName}!`}
      subtitle="Continue your learning journey"
    >
      <div className="space-y-8">

        {/* ── 2 Summary Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Enrolled Courses */}
          <div
            onClick={() => router.push('/student/courses')}
            className="group bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Enrolled Courses</p>
                <p className="text-3xl font-bold text-gray-800">{enrollments.length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <AcademicCapIcon className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Pending Assignments */}
          <div
            onClick={() => router.push('/student/assignments')}
            className="group bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Assignments</p>
                <p className="text-3xl font-bold text-gray-800">{pendingCount}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClockIcon className="w-7 h-7 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* ── My Courses + Upcoming Assignments ── */}
        <div className="grid lg:grid-cols-2 gap-8">

          {/* My Courses — active only, real progress */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">My Courses</h2>
              <button
                onClick={() => router.push('/student/courses')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View All
              </button>
            </div>
            <div className="p-6">
              {myCourses.length > 0 ? (
                <div className="space-y-4">
                  {myCourses.map(e => {
                    const prog = courseProgress.get(e.offering_id);
                    const pct  = prog?.pct        ?? 0;
                    const sub  = prog?.submitted   ?? 0;
                    const req  = prog?.required    ?? 0;
                    const trainer = e.course_offerings.profiles
                      ? `${e.course_offerings.profiles.first_name} ${e.course_offerings.profiles.last_name}`.trim()
                      : '';
                    return (
                      <div
                        key={e.id}
                        onClick={() => router.push(`/student/courses/${e.offering_id}`)}
                        className="group bg-white/40 rounded-xl p-4 border border-white/30 hover:bg-white/60 transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 group-hover:text-purple-700 transition truncate">
                              {e.course_offerings.courses?.title}
                            </h3>
                            {trainer && (
                              <p className="text-xs text-gray-500 mt-0.5">by {trainer}</p>
                            )}
                          </div>
                          <PlayIcon className="w-4 h-4 text-purple-500 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2" />
                        </div>
                        {/* Progress bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 shrink-0 w-8 text-right">
                            {pct}%
                          </span>
                        </div>
                        {req > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            {sub}/{req} assignment{req !== 1 ? 's' : ''} completed
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AcademicCapIcon className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4 text-sm">No active courses</p>
                  <button
                    onClick={() => router.push('/student/courses/browse')}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition"
                  >
                    Browse Courses
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Assignments — real data, sorted by due date */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Upcoming Assignments</h2>
              <button
                onClick={() => router.push('/student/assignments')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View All
              </button>
            </div>
            <div className="p-6">
              {upcomingAssignments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAssignments.map(a => (
                    <div
                      key={a.id}
                      onClick={() => router.push(`/student/courses/${a.course_offering_id}`)}
                      className="group bg-white/40 rounded-xl p-4 border border-white/30 hover:bg-white/60 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 group-hover:text-purple-700 transition text-sm truncate">
                            {a.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{a.courseName}</p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            Due: {fmtDate(a.due_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${a.badge.cls}`}>
                            {a.badge.label}
                          </span>
                          <ArrowRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 transition" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No pending assignments</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Recommended Courses — always rendered, shows empty state if none ── */}
        {(() => {
          console.log('[Dashboard] recommendations:', recommendations.length, recommendations.map(r => r.title));
          return null;
        })()}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Recommended Courses</h2>
              <Link
                href="/student/courses/browse"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                Browse All <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.length === 0 && (
                <div className="col-span-4 text-center py-6">
                  <p className="text-gray-400 text-sm">No recommendations available right now.</p>
                </div>
              )}
              {recommendations.map(rec => (
                <Link
                  key={rec.id}
                  href="/student/courses/browse"
                  className="group bg-white/40 rounded-xl p-4 border border-white/30 hover:bg-white/70 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col"
                >
                  {/* Category badge */}
                  <span className="self-start px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded-full uppercase tracking-wide mb-2">
                    {rec.category}
                  </span>
                  <h3 className="font-semibold text-gray-800 group-hover:text-purple-700 transition text-sm leading-snug mb-1">
                    {rec.title}
                  </h3>
                  {rec.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">
                      {rec.description}
                    </p>
                  )}
                  <div className="mt-auto space-y-1 text-xs text-gray-500">
                    {rec.trainerName && (
                      <p className="truncate">👨‍🏫 {rec.trainerName}</p>
                    )}
                    <p>⏱ {rec.durationWeeks}w · {rec.hoursPerWeek}h/week</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-purple-600 font-medium group-hover:underline">
                      View Course
                    </span>
                    <ArrowRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 transition" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

      </div>
    </DashboardLayout>
  );
}
