'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  UsersIcon, 
  CalendarIcon, 
  TrophyIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlusIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface MentorshipSession {
  id: string;
  student_name: string;
  topic: string;
  scheduled_date: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

interface NetworkConnection {
  id: string;
  name: string;
  role: string;
  company: string;
  connected_date: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: 'workshop' | 'networking' | 'webinar';
  attendees: number;
}

export default function AlumniDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mentorshipSessions, setMentorshipSessions] = useState<MentorshipSession[]>([]);
  const [networkConnections, setNetworkConnections] = useState<NetworkConnection[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role validation
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role !== 'alumni') {
        router.push(`/${user.role.toLowerCase()}/dashboard`);
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'alumni') {
      fetchDashboardData();
    }
  }, [user]);

  if (!isLoading && isAuthenticated && user && user.role !== 'alumni') {
    return null;
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for alumni dashboard
      // In a real app, these would be API calls
      setMentorshipSessions([
        {
          id: '1',
          student_name: 'John Smith',
          topic: 'Career Transition to Tech',
          scheduled_date: '2024-04-10T14:00:00Z',
          status: 'upcoming'
        },
        {
          id: '2',
          student_name: 'Sarah Johnson',
          topic: 'Interview Preparation',
          scheduled_date: '2024-04-08T10:00:00Z',
          status: 'completed'
        },
        {
          id: '3',
          student_name: 'Mike Davis',
          topic: 'Portfolio Review',
          scheduled_date: '2024-04-12T16:00:00Z',
          status: 'upcoming'
        }
      ]);

      setNetworkConnections([
        {
          id: '1',
          name: 'Alice Brown',
          role: 'Software Engineer',
          company: 'TechCorp',
          connected_date: '2024-03-15'
        },
        {
          id: '2',
          name: 'David Wilson',
          role: 'Product Manager',
          company: 'StartupXYZ',
          connected_date: '2024-03-20'
        }
      ]);

      setEvents([
        {
          id: '1',
          title: 'Alumni Networking Night',
          date: '2024-04-15T18:00:00Z',
          type: 'networking',
          attendees: 45
        },
        {
          id: '2',
          title: 'Tech Career Workshop',
          date: '2024-04-20T14:00:00Z',
          type: 'workshop',
          attendees: 32
        }
      ]);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalMentorshipSessions = mentorshipSessions.length;
  const upcomingSessions = mentorshipSessions.filter(s => s.status === 'upcoming').length;
  const completedSessions = mentorshipSessions.filter(s => s.status === 'completed').length;
  const networkSize = networkConnections.length;

  const stats = [
    { 
      label: 'Total Mentorship Sessions', 
      value: totalMentorshipSessions.toString(), 
      icon: UsersIcon, 
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10'
    },
    { 
      label: 'Upcoming Sessions', 
      value: upcomingSessions.toString(), 
      icon: ClockIcon, 
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-500/10 to-orange-500/10'
    },
    { 
      label: 'Completed Sessions', 
      value: completedSessions.toString(), 
      icon: CheckCircleIcon, 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/10 to-emerald-500/10'
    },
    { 
      label: 'Network Connections', 
      value: networkSize.toString(), 
      icon: UsersIcon, 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10'
    },
  ];

  // Recent mentorship sessions
  const recentSessions = mentorshipSessions
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
    .slice(0, 3);

  // Upcoming events
  const upcomingEvents = events
    .filter(e => new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <DashboardLayout title="Alumni Dashboard" subtitle="Loading your mentorship overview...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Alumni Dashboard" subtitle="Error loading dashboard">
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={`Welcome back, ${user?.firstName}!`} 
      subtitle="Continue making an impact through mentorship and networking"
    >
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                className="group bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/80 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl card-hover"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-14 h-14 bg-gradient-to-r ${stat.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-7 h-7 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Mentorship Sessions */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Recent Mentorship Sessions</h2>
                <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="group bg-gradient-to-r from-white/40 to-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:from-white/60 hover:to-white/80 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                            {session.student_name}
                          </h3>
                          <p className="text-sm text-gray-600">{session.topic}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {new Date(session.scheduled_date).toLocaleDateString()} at {new Date(session.scheduled_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 text-xs rounded-full border ${
                            session.status === 'completed'
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200'
                              : session.status === 'upcoming'
                              ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200'
                              : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-200'
                          }`}>
                            {session.status}
                          </span>
                          <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No mentorship sessions yet</p>
                  <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:shadow-lg">
                    Start Mentoring
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Upcoming Events</h2>
                <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="group bg-gradient-to-r from-white/40 to-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:from-white/60 hover:to-white/80 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 group-hover:text-purple-700 transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-sm text-gray-600 capitalize">{event.type}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{event.attendees} attending</span>
                          <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming events</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alumni Impact Panel */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <HeartIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Your Alumni Impact</h3>
              <p className="text-sm text-gray-600">Making a difference in the TRAINET community</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Mentorship Impact</h4>
              <p className="text-sm text-gray-600">
                {completedSessions > 0 
                  ? `You've completed ${completedSessions} mentorship sessions, helping students grow`
                  : 'Start mentoring to make an impact on student careers'
                }
              </p>
            </div>
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Network Growth</h4>
              <p className="text-sm text-gray-600">
                {networkSize > 0 
                  ? `Connected with ${networkSize} professionals in your network`
                  : 'Build your professional network through alumni events'
                }
              </p>
            </div>
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Community Engagement</h4>
              <p className="text-sm text-gray-600">
                Active participant in the TRAINET alumni community
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}