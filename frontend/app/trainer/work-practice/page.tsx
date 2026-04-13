'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ClockIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface WPTask {
  id: string;
  title: string;
  description: string;
  task_type: string;
  deadline: string | null;
  status: string;
  created_at: string;
  course_offerings: { id: string; courses: { title: string } } | null;
}

const TYPE_COLORS: Record<string, string> = {
  project: 'bg-purple-100 text-purple-700',
  coding: 'bg-blue-100 text-blue-700',
  quiz: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function TrainerWorkPractice() {
  const [tasks, setTasks] = useState<WPTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<WPTask | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<WPTask | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [taskType, setTaskType] = useState('project');
  const [deadline, setDeadline] = useState('');
  const [resourceFile, setResourceFile] = useState<File | null>(null);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/tasks/trainer');
      setTasks(res.data?.tasks || []);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load tasks' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setInstructions('');
    setTaskType('project'); setDeadline(''); setResourceFile(null);
    setEditTask(null); setShowForm(false);
  };

  const openEdit = (task: WPTask) => {
    setEditTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setTaskType(task.task_type);
    setDeadline(task.deadline ? task.deadline.slice(0, 16) : '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMsg(null);

      if (editTask) {
        await apiClient.put(`/tasks/${editTask.id}`, {
          title, description, instructions, taskType,
          deadline: deadline || null,
        });
        setMsg({ type: 'success', text: 'Task updated successfully' });
      } else {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('instructions', instructions);
        formData.append('taskType', taskType);
        if (deadline) formData.append('deadline', deadline);
        if (resourceFile) formData.append('resource', resourceFile);
        await apiClient.post('/tasks', formData);
        setMsg({ type: 'success', text: 'Task created successfully' });
      }

      resetForm();
      fetchTasks();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save task' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await apiClient.delete(`/tasks/${deleteConfirm.id}`);
      setMsg({ type: 'success', text: 'Task deleted' });
      setDeleteConfirm(null);
      fetchTasks();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Delete failed' });
      setDeleteConfirm(null);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const isPast = (d: string | null) => d ? new Date(d) < new Date() : false;

  return (
    <DashboardLayout title="Work & Practice" subtitle="Create and manage real-world tasks for students">
      <div className="space-y-6">

        {msg && (
          <div className={`p-4 rounded-xl border flex items-center space-x-2 ${
            msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {msg.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationTriangleIcon className="w-5 h-5" />}
            <span className="text-sm flex-1">{msg.text}</span>
            <button onClick={() => setMsg(null)} className="text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">My Tasks ({tasks.length})</h2>
            <p className="text-sm text-gray-500">Real-world projects and coding challenges</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>

        {/* Create / Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">{editTask ? 'Edit Task' : 'New Task'}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400"
                  placeholder="e.g. Build a REST API" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 resize-none"
                  placeholder="What should students build or solve?" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions / Resources</label>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 resize-none"
                  placeholder="Step-by-step instructions, links, or notes..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                <select value={taskType} onChange={e => setTaskType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400">
                  <option value="project">Project</option>
                  <option value="coding">Coding Challenge</option>
                  <option value="quiz">Quiz</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400" />
              </div>
              {!editTask && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource File (optional)</label>
                  <input type="file" onChange={e => setResourceFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700" />
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                {saving ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
              </button>
              <button type="button" onClick={resetForm}
                className="px-5 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Task List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-white/60 rounded-2xl p-5 border border-white/30 animate-pulse h-20" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-12 text-center">
            <p className="text-gray-500 mb-4">No tasks yet. Create your first Work & Practice task.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:bg-white/80 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{task.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${TYPE_COLORS[task.task_type] || 'bg-gray-100 text-gray-700'}`}>
                        {task.task_type}
                      </span>
                      {task.status === 'closed' && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">Closed</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <ClockIcon className="w-3 h-3" />
                        <span className={isPast(task.deadline) ? 'text-red-500' : ''}>
                          {task.deadline ? `Due: ${formatDate(task.deadline)}` : 'No deadline'}
                        </span>
                      </span>
                      {task.course_offerings && (
                        <span>📚 {task.course_offerings.courses?.title}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Link href={`/trainer/work-practice/${task.id}/submissions`}
                      className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200 transition flex items-center space-x-1">
                      <UsersIcon className="w-3 h-3" />
                      <span>Submissions</span>
                    </Link>
                    <button onClick={() => openEdit(task)}
                      className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(task)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">Delete Task?</h2>
            <p className="text-sm text-gray-600 mb-6">Delete <strong>{deleteConfirm.title}</strong>? All submissions will also be deleted.</p>
            <div className="flex space-x-3">
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
