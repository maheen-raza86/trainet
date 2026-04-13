'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { ChatBubbleLeftRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface InboxItem {
  id: string; message: string; created_at: string; sender_id: string; receiver_id: string;
  sender: { id: string; first_name: string; last_name: string };
  receiver: { id: string; first_name: string; last_name: string };
}

export default function RecruiterInboxPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchInbox(); }, [user]);

  const fetchInbox = async () => {
    try {
      const res: any = await apiClient.get('/recruiter/messages/inbox');
      setInbox(res.data?.inbox || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Messages" subtitle="Your conversations with candidates">
      <div className="space-y-3 max-w-2xl">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white/60 rounded-2xl p-5 border border-white/30 animate-pulse h-16" />)}</div>
        ) : inbox.length === 0 ? (
          <div className="text-center py-16 bg-white/60 rounded-2xl border border-white/30">
            <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No messages yet</p>
          </div>
        ) : (
          inbox.map(msg => {
            const partner = msg.sender_id === user?.id ? msg.receiver : msg.sender;
            return (
              <div key={msg.id} onClick={() => router.push(`/recruiter/messages/${partner.id}`)}
                className="group bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:bg-white/80 hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 group-hover:text-purple-700 transition">{partner.first_name} {partner.last_name}</p>
                    <p className="text-sm text-gray-500 truncate">{msg.message}</p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleDateString()}</span>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
