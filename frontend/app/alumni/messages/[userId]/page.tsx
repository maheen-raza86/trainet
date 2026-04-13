'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/api/client';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  sender: { id: string; first_name: string; last_name: string };
  receiver: { id: string; first_name: string; last_name: string };
}

export default function ConversationPage() {
  const { user } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && userId) fetchMessages();
  }, [user, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res: any = await apiClient.get(`/alumni/messages/${userId}`);
      const msgs: Message[] = res.data?.messages || [];
      setMessages(msgs);
      if (msgs.length > 0) {
        const partner = msgs[0].sender_id === user?.id ? msgs[0].receiver : msgs[0].sender;
        setPartnerName(`${partner.first_name} ${partner.last_name}`);
      }
    } catch { /* ignore */ }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      setSending(true);
      await apiClient.post('/alumni/messages', { receiverId: userId, message: text.trim() });
      setText('');
      fetchMessages();
    } catch (err: any) {
      alert(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout title={partnerName || 'Conversation'} subtitle="Direct message">
      <div className="flex flex-col h-[60vh] bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-8">No messages yet. Start the conversation!</p>
          )}
          {messages.map(msg => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${isMine ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : 'bg-white/80 text-gray-800 border border-white/30'}`}>
                  <p>{msg.message}</p>
                  <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/20 flex items-center space-x-3">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400"
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
