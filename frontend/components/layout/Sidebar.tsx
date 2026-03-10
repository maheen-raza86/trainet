'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  role: 'student' | 'trainer' | 'alumni' | 'recruiter' | 'admin';
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Student navigation items
  const studentNavItems = [
    { name: 'Dashboard', href: '/student/dashboard', icon: '📊' },
    { name: 'My Courses', href: '/student/courses', icon: '📚' },
    { name: 'Assignments', href: '/student/assignments', icon: '📝' },
    { name: 'Certificates', href: '/student/certificates', icon: '🎓' },
    { name: 'Profile', href: '/student/profile', icon: '👤' },
  ];

  // Trainer navigation items
  const trainerNavItems = [
    { name: 'Dashboard', href: '/trainer/dashboard', icon: '📊' },
    { name: 'My Courses', href: '/trainer/courses', icon: '📚' },
    { name: 'Assignments', href: '/trainer/assignments', icon: '📝' },
    { name: 'Student Submissions', href: '/trainer/submissions', icon: '📥' },
    { name: 'Profile', href: '/trainer/profile', icon: '👤' },
  ];

  // Alumni navigation items
  const alumniNavItems = [
    { name: 'Dashboard', href: '/alumni/dashboard', icon: '📊' },
    { name: 'Network', href: '/alumni/network', icon: '🤝' },
    { name: 'Events', href: '/alumni/events', icon: '📅' },
    { name: 'Profile', href: '/alumni/profile', icon: '👤' },
  ];

  // Recruiter navigation items
  const recruiterNavItems = [
    { name: 'Dashboard', href: '/recruiter/dashboard', icon: '📊' },
    { name: 'Candidates', href: '/recruiter/candidates', icon: '👥' },
    { name: 'Jobs', href: '/recruiter/jobs', icon: '💼' },
    { name: 'Profile', href: '/recruiter/profile', icon: '👤' },
  ];

  // Select navigation items based on role
  let navItems = studentNavItems;
  if (role === 'trainer') navItems = trainerNavItems;
  if (role === 'alumni') navItems = alumniNavItems;
  if (role === 'recruiter') navItems = recruiterNavItems;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href={`/${role}/dashboard`} className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <span className="text-xl font-bold text-gray-900">TRAINET</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
        >
          <span className="text-xl">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
