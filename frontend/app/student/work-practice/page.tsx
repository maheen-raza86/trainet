'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface WPTask {
  id: string;
  title: string;
  description: string;
  task_type: string;
  deadline: string | null;
  status: string;
  created_at: string;
  profiles: { first_name: string; last_name: string } | null;
  course_offerings: { id: string; courses: { title: string } } | null;
}

const TYPE_COLORS: Record<string, string> = {
  project: 'bg-purple-100 text-purple-700',
  coding: 'bg-blue-100 text-blue-700',
  quiz: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function StudentWorkPractice() {
  const [tasks, setTasks] = useState<WPTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'project' | 'coding' | 'quiz'>('all');

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/tasks');
      setTasks(res.data?.tasks || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const isPast = (d: string | null) => d ? new Date(d) < new Date() : false;

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

  const filtered = tasks.filter(t => filter === 'all' || t.task_type === filter);

  if (loading) {
    return (
      <DashboardLayout title="Work & Practice" subtitle="Real-world tasks and challenges">
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-white/60 rounded-2xl p-5 border border-white/30 animate-pulse h-24" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Work & Practice" subtitle="Real-world tasks and challenges from your trainers">
      <div className="space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-2 text-red-700">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/30 w-fit">
          {(['all', 'project', 'coding', 'quiz'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition capitalize ${
                filter === f ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow' : 'text-gray-600 hover:text-gray-900'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-12 text-center">
            <p className="text-gray-500">No tasks available yet. Check back after your trainer posts tasks.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map(task => {
              const past = isPast(task.deadline);
              return (
                <Link key={task.id} href={`/student/work-practice/${task.id}`}
                  className="group bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:bg-white/80 hover:-translate-y-0.5 hover:shadow-lg transition block">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${TYPE_COLORS[task.task_type] || 'bg-gray-100 text-gray-700'}`}>
                      {task.task_type}
                    </span>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition" />
                  </div>

                  <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-purple-700 transition">{task.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>👨‍🏫 {task.profiles?.first_name} {task.profiles?.last_name}</span>
                    {task.deadline && (
                      <div className="flex items-center space-x-1.5">
                        <span className="flex items-center space-x-1 text-gray-500">
                          <ClockIcon className="w-3 h-3" />
                          <span>Due {formatDate(task.deadline)}</span>
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${past ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {past ? 'Closed' : 'Open'}
                        </span>
                      </div>
                    )}
                  </div>

                  {task.course_offerings && (
                    <p className="text-xs text-gray-400 mt-1">📚 {task.course_offerings.courses?.title}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
