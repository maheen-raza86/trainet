'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/client';
import {
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface SearchResult {
  courses: { id: string; title: string; description: string }[];
  alumni: { id: string; headline: string; profiles: { first_name: string; last_name: string } }[];
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title = 'Welcome back!', subtitle = "Here's what's happening" }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchNotifications();
    const interval = setInterval(() => { if (user) fetchNotifications(); }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults(null); return; }
    const t = setTimeout(async () => {
      try {
        const res: any = await apiClient.get(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data || null);
        setSearchOpen(true);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchNotifications = async () => {
    try {
      const res: any = await apiClient.get('/notifications');
      setNotifications(res.data?.notifications || []);
      setUnread(res.data?.unread || 0);
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const markOneRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const handleLogout = () => { logout(); window.location.href = '/login'; };

  const headerAvatarSrc = user?.profile_picture_url || user?.avatar_url || null;

  const typeIcon = (type: string) => {
    const map: Record<string, string> = { grade: '📊', enrollment: '🎓', certificate: '🏆', mentorship: '🤝', submission: '📝', assignment: '📋', info: 'ℹ️' };
    return map[type] || 'ℹ️';
  };

  const hasResults = searchResults && (searchResults.courses.length > 0 || searchResults.alumni.length > 0);

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{title}</h1>
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search with dropdown */}
          <div className="relative hidden md:block" ref={searchRef}>
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => hasResults && setSearchOpen(true)}
                placeholder="Search courses, alumni..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-48"
              />
            </div>
            {searchOpen && hasResults && (
              <div className="absolute top-full mt-2 left-0 w-80 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 z-50 overflow-hidden">
                {searchResults!.courses.length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Courses</p>
                    {searchResults!.courses.map(c => (
                      <div key={c.id} onClick={() => { router.push('/student/courses'); setSearchOpen(false); setSearchQuery(''); }}
                        className="px-4 py-2.5 hover:bg-purple-50 cursor-pointer transition">
                        <p className="text-sm font-medium text-gray-800">{c.title}</p>
                        <p className="text-xs text-gray-500 truncate">{c.description}</p>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults!.alumni.length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Alumni</p>
                    {searchResults!.alumni.map(a => (
                      <div key={a.id} onClick={() => { router.push('/student/alumni'); setSearchOpen(false); setSearchQuery(''); }}
                        className="px-4 py-2.5 hover:bg-purple-50 cursor-pointer transition">
                        <p className="text-sm font-medium text-gray-800">{a.profiles?.first_name} {a.profiles?.last_name}</p>
                        {a.headline && <p className="text-xs text-gray-500 truncate">{a.headline}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {searchOpen && searchQuery.length >= 2 && !hasResults && (
              <div className="absolute top-full mt-2 left-0 w-64 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 z-50 p-4 text-center text-sm text-gray-400">
                No results found
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setIsNotifOpen(!isNotifOpen); if (!isNotifOpen && unread > 0) markAllRead(); }}
              className="p-2 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/80 transition-all duration-200 hover:shadow-lg relative"
            >
              <BellIcon className="w-6 h-6 text-gray-600" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-semibold text-gray-900 text-sm">Notifications</p>
                  {notifications.some(n => !n.read) && (
                    <button onClick={markAllRead} className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1">
                      <CheckIcon className="w-3 h-3" />Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">No notifications yet</div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div key={n.id} onClick={() => !n.read && markOneRead(n.id)}
                        className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${!n.read ? 'bg-purple-50/50' : ''}`}>
                        <div className="flex items-start gap-2">
                          <span className="text-lg shrink-0">{typeIcon(n.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                          </div>
                          {!n.read && <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0 mt-1" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-2 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/80 transition-all duration-200 hover:shadow-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                {headerAvatarSrc ? (
                  <img src={headerAvatarSrc} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-medium text-sm">{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs rounded-full capitalize">{user?.role}</span>
                </div>
                <div className="py-2">
                  <Link href={`/${user?.role}/profile`} onClick={() => setIsProfileOpen(false)}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <UserIcon className="w-4 h-4" /><span>View Profile</span>
                  </Link>
                  <Link href={user?.role === 'admin' ? '/admin/settings' : `/${user?.role}/profile`} onClick={() => setIsProfileOpen(false)}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Cog6ToothIcon className="w-4 h-4" /><span>Settings</span>
                  </Link>
                </div>
                <div className="border-t border-gray-100 pt-2">
                  <button onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <ArrowLeftOnRectangleIcon className="w-4 h-4" /><span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
