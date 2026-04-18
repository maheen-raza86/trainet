'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { 
  HomeIcon, 
  AcademicCapIcon, 
  DocumentTextIcon, 
  TrophyIcon, 
  UserIcon,
  UsersIcon,
  BriefcaseIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  role: 'student' | 'trainer' | 'alumni' | 'recruiter' | 'admin';
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Navigation items for each role
  const navigationItems = {
    student: [
      { name: 'Dashboard',      href: '/student/dashboard',    icon: HomeIcon },
      { name: 'My Courses',     href: '/student/courses',       icon: AcademicCapIcon },
      { name: 'Assignments',    href: '/student/assignments',   icon: DocumentTextIcon },
      { name: 'Work & Practice',href: '/student/work-practice', icon: ClipboardDocumentListIcon },
      { name: 'Certificates',   href: '/student/certificates',  icon: TrophyIcon },
      { name: 'Alumni Guidance',href: '/student/guidance',      icon: SparklesIcon },
      { name: 'Profile',        href: '/student/profile',       icon: UserIcon },
    ],
    trainer: [
      { name: 'Dashboard', href: '/trainer/dashboard', icon: HomeIcon },
      { name: 'My Courses', href: '/trainer/courses', icon: AcademicCapIcon },
      { name: 'Assignments', href: '/trainer/assignments', icon: DocumentTextIcon },
      { name: 'Work & Practice', href: '/trainer/work-practice', icon: ClipboardDocumentListIcon },
      { name: 'Submissions', href: '/trainer/submissions', icon: SparklesIcon },
      { name: 'Profile', href: '/trainer/profile', icon: UserIcon },
    ],
    alumni: [
      { name: 'Dashboard',         href: '/alumni/dashboard', icon: HomeIcon },
      { name: 'Guidance Requests', href: '/alumni/requests',  icon: ClipboardDocumentListIcon },
      { name: 'Sessions',          href: '/alumni/sessions',  icon: AcademicCapIcon },
      { name: 'Profile',           href: '/alumni/profile',   icon: UserIcon },
    ],
    recruiter: [
      { name: 'Dashboard', href: '/recruiter/dashboard', icon: HomeIcon },
      { name: 'Talent Pool', href: '/recruiter/talent', icon: UsersIcon },
      { name: 'Bookmarks', href: '/recruiter/bookmarks', icon: BriefcaseIcon },
      { name: 'Messages', href: '/recruiter/messages/inbox', icon: SparklesIcon },
      { name: 'Profile', href: '/recruiter/profile', icon: UserIcon },
    ],
    admin: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
      { name: 'Users', href: '/admin/users', icon: UsersIcon },
      { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
      { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
      { name: 'Profile', href: '/admin/profile', icon: UserIcon },
    ],
  };

  const navItems = navigationItems[role] || navigationItems.student;

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-72'} transition-all duration-300 bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 flex flex-col relative`}>
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
          <Link href={`/${role}/dashboard`} className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-2xl font-bold text-white">TRAINET</span>
            )}
          </Link>
          
          {/* Collapse button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-5 h-5 text-white" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'} transition-colors`} />
                {!isCollapsed && (
                  <span className={`font-medium ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                    {item.name}
                  </span>
                )}
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Role Badge */}
        {!isCollapsed && (
          <div className="px-6 py-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold capitalize">
                    {role.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium capitalize">{role}</p>
                  <p className="text-white/60 text-xs">Dashboard</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-red-500/20 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <ArrowLeftOnRectangleIcon className="w-6 h-6" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
