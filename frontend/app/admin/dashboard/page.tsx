'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  UsersIcon, 
  AcademicCapIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlusIcon,
  EyeIcon,
  ShieldCheckIcon,
  ServerIcon,
  CpuChipIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface SystemMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'course_creation' | 'system_alert' | 'payment';
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role validation
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role !== 'admin') {
        router.push(`/${user.role.toLowerCase()}/dashboard`);
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  if (!isLoading && isAuthenticated && user && user.role !== 'admin') {
    return null;
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for admin dashboard
      // In a real app, these would be API calls
      setSystemMetrics([
        { label: 'Total Users', value: '2,847', change: '+12%', trend: 'up' },
        { label: 'Active Courses', value: '156', change: '+8%', trend: 'up' },
        { label: 'System Uptime', value: '99.9%', change: '0%', trend: 'stable' },
        { label: 'Revenue (MTD)', value: '$45,230', change: '+15%', trend: 'up' }
      ]);

      setRecentActivity([
        {
          id: '1',
          type: 'user_registration',
          description: 'New student registered: John Doe',
          timestamp: '2024-04-06T10:30:00Z',
          severity: 'info'
        },
        {
          id: '2',
          type: 'course_creation',
          description: 'New course created: Advanced React Development',
          timestamp: '2024-04-06T09:15:00Z',
          severity: 'success'
        },
        {
          id: '3',
          type: 'system_alert',
          description: 'High CPU usage detected on server-02',
          timestamp: '2024-04-06T08:45:00Z',
          severity: 'warning'
        },
        {
          id: '4',
          type: 'payment',
          description: 'Payment processed: $299 for Premium Course',
          timestamp: '2024-04-06T08:20:00Z',
          severity: 'success'
        }
      ]);

      setSystemAlerts([
        {
          id: '1',
          title: 'Database Performance',
          message: 'Query response time increased by 15% in the last hour',
          severity: 'medium',
          timestamp: '2024-04-06T09:00:00Z',
          resolved: false
        },
        {
          id: '2',
          title: 'Storage Capacity',
          message: 'File storage is at 85% capacity',
          severity: 'high',
          timestamp: '2024-04-06T07:30:00Z',
          resolved: false
        },
        {
          id: '3',
          title: 'SSL Certificate',
          message: 'SSL certificate expires in 30 days',
          severity: 'low',
          timestamp: '2024-04-05T14:00:00Z',
          resolved: true
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
  const totalUsers = parseInt(systemMetrics.find(m => m.label === 'Total Users')?.value.replace(/,/g, '') || '0');
  const activeCourses = parseInt(systemMetrics.find(m => m.label === 'Active Courses')?.value || '0');
  const unresolvedAlerts = systemAlerts.filter(a => !a.resolved).length;
  const criticalAlerts = systemAlerts.filter(a => a.severity === 'critical' && !a.resolved).length;

  const stats = [
    { 
      label: 'Total Users', 
      value: totalUsers.toLocaleString(), 
      icon: UsersIcon, 
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10'
    },
    { 
      label: 'Active Courses', 
      value: activeCourses.toString(), 
      icon: AcademicCapIcon, 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/10 to-emerald-500/10'
    },
    { 
      label: 'System Alerts', 
      value: unresolvedAlerts.toString(), 
      icon: BellIcon, 
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-500/10 to-orange-500/10'
    },
    { 
      label: 'Critical Issues', 
      value: criticalAlerts.toString(), 
      icon: ExclamationTriangleIcon, 
      color: 'from-red-500 to-pink-500',
      bgColor: 'from-red-500/10 to-pink-500/10'
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard" subtitle="Loading system overview...">
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
      <DashboardLayout title="Admin Dashboard" subtitle="Error loading dashboard">
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
      subtitle="Monitor and manage the TRAINET platform"
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

        {/* System Metrics */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-xl font-bold text-gray-800">System Metrics</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {systemMetrics.map((metric, index) => (
                <div key={index} className="bg-gradient-to-r from-white/40 to-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{metric.label}</p>
                      <p className="text-2xl font-bold text-gray-800">{metric.value}</p>
                    </div>
                    <div className={`flex items-center space-x-1 text-sm ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      <span>{metric.change}</span>
                      {metric.trend === 'up' && <ArrowRightIcon className="w-4 h-4 rotate-[-45deg]" />}
                      {metric.trend === 'down' && <ArrowRightIcon className="w-4 h-4 rotate-[45deg]" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* System Alerts */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">System Alerts</h2>
                <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {systemAlerts.length > 0 ? (
                <div className="space-y-3">
                  {systemAlerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="group bg-gradient-to-r from-white/40 to-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:from-white/60 hover:to-white/80 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-800 group-hover:text-purple-700 transition-colors">
                              {alert.title}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                              alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                              alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {alert.resolved ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          ) : (
                            <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShieldCheckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No system alerts</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
                <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="group bg-gradient-to-r from-white/40 to-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:from-white/60 hover:to-white/80 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-800 group-hover:text-purple-700 transition-colors">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${
                            activity.severity === 'error' ? 'bg-red-500' :
                            activity.severity === 'warning' ? 'bg-yellow-500' :
                            activity.severity === 'success' ? 'bg-green-500' :
                            'bg-blue-500'
                          }`}></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Health Panel */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <ServerIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">System Health</h3>
              <p className="text-sm text-gray-600">Real-time platform monitoring and insights</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center space-x-2 mb-2">
                <ServerIcon className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-gray-800">Server Status</h4>
              </div>
              <p className="text-sm text-gray-600">All systems operational with 99.9% uptime</p>
            </div>
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center space-x-2 mb-2">
                <CpuChipIcon className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-gray-800">Performance</h4>
              </div>
              <p className="text-sm text-gray-600">Average response time: 120ms, CPU usage: 45%</p>
            </div>
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center space-x-2 mb-2">
                <ShieldCheckIcon className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-gray-800">Security</h4>
              </div>
              <p className="text-sm text-gray-600">No security threats detected, all systems secure</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}