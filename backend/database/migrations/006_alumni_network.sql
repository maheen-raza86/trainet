-- Migration: Alumni & Consultancy Network
-- Date: 2026-04-12

-- ============================================
-- Alumni Profiles
-- ============================================
CREATE TABLE IF NOT EXISTS alumni_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  headline VARCHAR(255),
  bio TEXT,
  experience TEXT,
  skills TEXT,
  achievements TEXT,
  linkedin_url VARCHAR(500),
  portfolio_url VARCHAR(500),
  available_for_mentorship BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_alumni_profiles_user_id ON alumni_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_mentorship ON alumni_profiles(available_for_mentorship);

-- ============================================
-- Mentorship Requests
-- ============================================
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alumni_id UUID NOT NULL REFERENCES alumni_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentorship_requests_student ON mentorship_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_alumni ON mentorship_requests(alumni_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_status ON mentorship_requests(status);

-- ============================================
-- Alumni Messages
-- ============================================
CREATE TABLE IF NOT EXISTS alumni_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alumni_messages_sender ON alumni_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_alumni_messages_receiver ON alumni_messages(receiver_id);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_messages ENABLE ROW LEVEL SECURITY;

-- Alumni profiles: anyone authenticated can view, only owner can modify
CREATE POLICY "Anyone can view alumni profiles" ON alumni_profiles FOR SELECT USING (true);
CREATE POLICY "Alumni can manage own profile" ON alumni_profiles FOR ALL USING (auth.uid() = user_id);

-- Mentorship requests: participants can view their own
CREATE POLICY "Students see own requests" ON mentorship_requests FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Alumni see own requests" ON mentorship_requests FOR SELECT
  USING (alumni_id IN (SELECT id FROM alumni_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Students can create requests" ON mentorship_requests FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Alumni can update request status" ON mentorship_requests FOR UPDATE
  USING (alumni_id IN (SELECT id FROM alumni_profiles WHERE user_id = auth.uid()));

-- Messages: participants can view and send
CREATE POLICY "Participants can view messages" ON alumni_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Authenticated users can send messages" ON alumni_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
