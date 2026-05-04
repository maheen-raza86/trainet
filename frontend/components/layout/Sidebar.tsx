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
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import BrandLogo from '@/components/BrandLogo';

interface SidebarProps {
  role: 'student' | 'trainer' | 'alumni' | 'recruiter' | 'admin';
  /** Mobile: whether the sidebar drawer is open */
  mobileOpen?: boolean;
  /** Mobile: callback to close the drawer */
  onMobileClose?: () => void;
}

export default function Sidebar({ role, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

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
      { name: 'Dashboard',      href: '/trainer/dashboard',     icon: HomeIcon },
      { name: 'My Courses',     href: '/trainer/courses',       icon: AcademicCapIcon },
      { name: 'My Students',    href: '/trainer/students',      icon: UsersIcon },
      { name: 'Work & Practice',href: '/trainer/work-practice', icon: ClipboardDocumentListIcon },
      { name: 'Verification',   href: '/trainer/apply',         icon: ShieldCheckIcon },
      { name: 'Profile',        href: '/trainer/profile',       icon: UserIcon },
    ],
    alumni: [
      { name: 'Dashboard',         href: '/alumni/dashboard', icon: HomeIcon },
      { name: 'Guidance Requests', href: '/alumni/requests',  icon: ClipboardDocumentListIcon },
      { name: 'Sessions',          href: '/alumni/sessions',  icon: AcademicCapIcon },
      { name: 'Profile',           href: '/alumni/profile',   icon: UserIcon },
    ],
    recruiter: [
      { name: 'Dashboard',  href: '/recruiter/dashboard', icon: HomeIcon },
      { name: 'Talent Pool',href: '/recruiter/talent',    icon: UsersIcon },
      { name: 'Bookmarks',  href: '/recruiter/bookmarks', icon: BriefcaseIcon },
      { name: 'Profile',    href: '/recruiter/profile',   icon: UserIcon },
    ],
    admin: [
      { name: 'Dashboard',        href: '/admin/dashboard', icon: HomeIcon },
      { name: 'Users',            href: '/admin/users',     icon: UsersIcon },
      { name: 'Analytics',        href: '/admin/analytics', icon: ChartBarIcon },
      { name: 'Trainer Requests', href: '/admin/trainers',  icon: ShieldCheckIcon },
      { name: 'Profile',          href: '/admin/profile',   icon: UserIcon },
    ],
  };

  const navItems = navigationItems[role] || navigationItems.student;

  // ── Shared inner content ──────────────────────────────────────────────────
  const sidebarContent = (collapsed: boolean, showCloseBtn: boolean) => (
    <div className="relative z-10 flex flex-col h-full">
      {/* Logo row */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
        <Link href={`/${role}/dashboard`} className="flex items-center" onClick={onMobileClose}>
          {collapsed ? <BrandLogo size="sm" iconOnly /> : <BrandLogo size="md" />}
        </Link>

        {/* Mobile: close button; Desktop: collapse toggle */}
        {showCloseBtn ? (
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        ) : (
          <button
            onClick={() => setIsCollapsed(!collapsed)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRightIcon className="w-5 h-5 text-white" />
              : <ChevronLeftIcon  className="w-5 h-5 text-white" />}
          </button>
        )}
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
              onClick={onMobileClose}
              className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'} transition-colors`} />
              {!collapsed && (
                <span className={`font-medium ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                  {item.name}
                </span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role badge — desktop only when not collapsed */}
      {!collapsed && (
        <div className="px-6 py-4 shrink-0">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold capitalize">{role.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium capitalize truncate">{role}</p>
                <p className="text-white/60 text-xs">Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <button
          onClick={handleLogout}
          className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-red-500/20 transition-all duration-200 ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <ArrowLeftOnRectangleIcon className="w-6 h-6 shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP sidebar (md+) ─────────────────────────────────────────── */}
      <aside
        className={`
          hidden md:flex flex-col relative shrink-0
          ${isCollapsed ? 'w-20' : 'w-72'}
          transition-all duration-300
          bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900
        `}
      >
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
        {sidebarContent(isCollapsed, false)}
      </aside>

      {/* ── MOBILE drawer overlay ─────────────────────────────────────────── */}
      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 flex flex-col
          bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900
          transform transition-transform duration-300 ease-in-out
          md:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
        {sidebarContent(false, true)}
      </aside>
    </>
  );
}
