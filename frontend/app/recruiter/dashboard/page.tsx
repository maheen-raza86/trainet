'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  UsersIcon, 
  BriefcaseIcon, 
  TrophyIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlusIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  StarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

interface JobPost {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
  posted_date: string;
  applications: number;
  status: 'active' | 'closed' | 'draft';
}

interface Candidate {
  id: string;
  name: string;
  skills: string[];
  experience: string;
  location: string;
  match_score: number;
  status: 'available' | 'interviewing' | 'hired';
}

interface Interview {
  id: string;
  candidate_name: string;
  job_title: string;
  scheduled_date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export default function RecruiterDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role validation
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role !== 'recruiter') {
        router.push(`/${user.role.toLowerCase()}/dashboard`);
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'recruiter') {
      fetchDashboardData();
    }
  }, [user]);

  if (!isLoading && isAuthenticated && user && user.role !== 'recruiter') {
    return null;
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for recruiter dashboard
      // In a real app, these would be API calls
      setJobPosts([
        {
          id: '1',
          title: 'Senior Frontend Developer',
          company: 'TechCorp Inc.',
          location: 'San Francisco, CA',
          type: 'full-time',
          posted_date: '2024-04-01',
          applications: 24,
          status: 'active'
        },
        {
          id: '2',
          title: 'Full Stack Engineer',
          company: 'StartupXYZ',
          location: 'Remote',
          type: 'full-time',
          posted_date: '2024-03-28',
          applications: 18,
          status: 'active'
        },
        {
          id: '3',
          title: 'UI/UX Designer',
          company: 'DesignStudio',
          location: 'New York, NY',
          type: 'contract',
          posted_date: '2024-03-25',
          applications: 12,
          status: 'closed'
        }
      ]);

      setCandidates([
        {
          id: '1',
          name: 'Alice Johnson',
          skills: ['React', 'TypeScript', 'Node.js'],
          experience: '3 years',
          location: 'San Francisco, CA',
          match_score: 95,
          status: 'available'
        },
        {
          id: '2',
          name: 'Bob Smith',
          skills: ['Python', 'Django', 'PostgreSQL'],
          experience: '5 years',
          location: 'Remote',
          match_score: 88,
          status: 'interviewing'
        },
        {
          id: '3',
          name: 'Carol Davis',
          skills: ['Figma', 'Adobe XD', 'Prototyping'],
          experience: '4 years',
          location: 'New York, NY',
          match_score: 92,
          status: 'available'
        }
      ]);

      setInterviews([
        {
          id: '1',
          candidate_name: 'Alice Johnson',
          job_title: 'Senior Frontend Developer',
          scheduled_date: '2024-04-10T14:00:00Z',
          status: 'scheduled'
        },
        {
          id: '2',
          candidate_name: 'Bob Smith',
          job_title: 'Full Stack Engineer',
          scheduled_date: '2024-04-08T10:00:00Z',
          status: 'completed'
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
  const activeJobPosts = jobPosts.filter(j => j.status === 'active').length;
  const totalApplications = jobPosts.reduce((sum, job) => sum + job.applications, 0);
  const availableCandidates = candidates.filter(c => c.status === 'available').length;
  const upcomingInterviews = interviews.filter(i => i.status === 'scheduled').length;

  const stats = [
    { 
      label: 'Active Job Posts', 
      value: activeJobPosts.toString(), 
      icon: BriefcaseIcon, 
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10'
    },
    { 
      label: 'Total Applications', 
      value: totalApplications.toString(), 
      icon: UsersIcon, 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/10 to-emerald-500/10'
    },
    { 
      label: 'Available Candidates', 
      value: availableCandidates.toString(), 
      icon: StarIcon, 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10'
    },
    { 
      label: 'Upcoming Interviews', 
      value: upcomingInterviews.toString(), 
      icon: ClockIcon, 
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-500/10 to-orange-500/10'
    },
  ];

  // Recent job posts
  const recentJobPosts = jobPosts
    .sort((a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime())
    .slice(0, 3);

  // Top candidates
  const topCandidates = candidates
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 3);

  if (loading) {
    return (
      <DashboardLayout title="Recruiter Dashboard" subtitle="Loading your recruitment overview...">
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
      <DashboardLayout title="Recruiter Dashboard" subtitle="Error loading dashboard">
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
      subtitle="Find the perfect talent for your organization"
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
          {/* Recent Job Posts */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Recent Job Posts</h2>
                <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:shadow-lg">
                  <PlusIcon className="w-4 h-4" />
                  <span>Post Job</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentJobPosts.length > 0 ? (
                <div className="space-y-4">
                  {recentJobPosts.map((job) => (
                    <div key={job.id} className="group bg-gradient-to-r from-white/40 to-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:from-white/60 hover:to-white/80 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-600">{job.company}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <MapPinIcon className="w-3 h-3 mr-1" />
                              {job.location}
                            </span>
                            <span className="capitalize">{job.type}</span>
                            <span>{job.applications} applications</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Posted: {new Date(job.posted_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 text-xs rounded-full border ${
                            job.status === 'active'
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200'
                              : job.status === 'closed'
                              ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-200'
                              : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200'
                          }`}>
                            {job.status}
                          </span>
                          <button className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:shadow-lg opacity-0 group-hover:opacity-100">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BriefcaseIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No job posts yet</p>
                  <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:shadow-lg">
                    Post Your First Job
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Top Candidates */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Top Candidates</h2>
                <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {topCandidates.length > 0 ? (
                <div className="space-y-3">
                  {topCandidates.map((candidate) => (
                    <div key={candidate.id} className="group bg-gradient-to-r from-white/40 to-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:from-white/60 hover:to-white/80 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-800 group-hover:text-purple-700 transition-colors">
                              {candidate.name}
                            </h3>
                            <div className="flex items-center space-x-1">
                              <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium text-gray-700">{candidate.match_score}%</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{candidate.experience} experience</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {candidate.skills.slice(0, 3).map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                {skill}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <MapPinIcon className="w-3 h-3 mr-1" />
                            {candidate.location}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 text-xs rounded-full border ${
                            candidate.status === 'available'
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200'
                              : candidate.status === 'interviewing'
                              ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200'
                              : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-200'
                          }`}>
                            {candidate.status}
                          </span>
                          <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No candidates available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Talent Matching Panel */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">AI Talent Matching</h3>
              <p className="text-sm text-gray-600">Smart recommendations powered by machine learning</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Skill Matching</h4>
              <p className="text-sm text-gray-600">
                {topCandidates.length > 0 
                  ? `Found ${topCandidates.length} highly matched candidates for your roles`
                  : 'AI will analyze candidate skills to find perfect matches'
                }
              </p>
            </div>
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Application Insights</h4>
              <p className="text-sm text-gray-600">
                {totalApplications > 0 
                  ? `Received ${totalApplications} applications across all job posts`
                  : 'Track application trends and candidate quality metrics'
                }
              </p>
            </div>
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Hiring Pipeline</h4>
              <p className="text-sm text-gray-600">
                {upcomingInterviews > 0 
                  ? `${upcomingInterviews} interviews scheduled this week`
                  : 'Streamline your hiring process with AI assistance'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}