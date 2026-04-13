-- Migration: Recruiter / Talent Pool Module
-- Date: 2026-04-12

-- ============================================
-- Recruiter Bookmarks
-- ============================================
CREATE TABLE IF NOT EXISTS recruiter_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recruiter_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_recruiter_bookmarks_recruiter ON recruiter_bookmarks(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_bookmarks_candidate ON recruiter_bookmarks(candidate_id);

-- ============================================
-- Recruiter Messages
-- ============================================
CREATE TABLE IF NOT EXISTS recruiter_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_messages_sender ON recruiter_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_messages_receiver ON recruiter_messages(receiver_id);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE recruiter_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters manage own bookmarks" ON recruiter_bookmarks FOR ALL USING (auth.uid() = recruiter_id);
CREATE POLICY "Participants view own messages" ON recruiter_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Authenticated users send messages" ON recruiter_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
