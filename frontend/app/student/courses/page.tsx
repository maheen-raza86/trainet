'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';

interface CourseOffering {
  id: string;
  duration_weeks: number;
  hours_per_week: number;
  outline: string;
  status: string;
  end_date: string | null;
  courses: {
    id: string;
    title: string;
    description: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface Enrollment {
  id: string;
  offering_id: string;
  progress: number;
  enrolled_at: string;
  course_offerings: CourseOffering;
}

interface CourseProgress {
  submitted_assignments: number;
  total_assignments: number;
  progress: number; // 0–100
}

export default function StudentCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, CourseProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await apiClient.get('/enrollments/my');
      const rawEnrollments: Enrollment[] = response.data?.enrollments || [];
      setEnrollments(rawEnrollments);

      // Fetch real progress for every enrollment from the progress API
      // (same source used by the course detail page)
      const map = new Map<string, CourseProgress>();
      await Promise.all(
        rawEnrollments.map(async (e) => {
          if (!e.offering_id) return;
          try {
            const pRes: any = await apiClient.get(`/progress/${e.offering_id}`);
            map.set(e.offering_id, pRes.data as CourseProgress);
          } catch {
            // Fall back to the enrollment's stored progress field
            map.set(e.offering_id, {
              submitted_assignments: 0,
              total_assignments: 0,
              progress: e.progress || 0,
            });
          }
        })
      );
      setProgressMap(map);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading courses...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchCourses}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600 mt-1">Continue your learning journey</p>
          </div>
          <Link
            href="/student/courses/browse"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
          >
            Browse Courses
          </Link>
        </div>

        {/* Courses Grid */}
        {enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => {
              const prog = progressMap.get(enrollment.offering_id);
              const pct = prog?.progress ?? enrollment.progress ?? 0;
              const submitted = prog?.submitted_assignments ?? 0;
              const total = prog?.total_assignments ?? 0;
              const offering = enrollment.course_offerings;
              const isCourseEnded =
                offering?.status === 'completed' ||
                (!!offering?.end_date && new Date(offering.end_date) < new Date());

              return (
                <div key={enrollment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                  {/* Course Header */}
                  <div className="h-32 bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center relative">
                    <span className="text-6xl">📚</span>
                    {isCourseEnded && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/30">
                        Ended
                      </span>
                    )}
                  </div>

                  {/* Course Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{offering?.courses?.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{offering?.courses?.description}</p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Progress</span>
                        <span className="text-xs font-medium text-gray-900">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      {total > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {submitted}/{total} assignment{total !== 1 ? 's' : ''} completed
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/student/courses/${enrollment.offering_id}`}
                      className="block w-full text-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                    >
                      View Course
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Enrolled</h3>
            <p className="text-gray-600 mb-6">Start your learning journey by enrolling in courses</p>
            <Link
              href="/student/courses/browse"
              className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
            >
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
