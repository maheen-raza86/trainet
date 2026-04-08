-- Migration: Admin & Analytics Module
-- SRDS FR-AD-1 through FR-AD-4
-- Date: 2026-04-08

-- ============================================
-- STEP 1: system_logs table (FR-AD-3)
-- ============================================

CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON system_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp DESC);

COMMENT ON TABLE system_logs IS 'System-wide audit log for security and monitoring (SRDS FR-AD-3)';

-- ============================================
-- STEP 2: settings table (FR-AD-4)
-- ============================================

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default settings aligned with SRDS
INSERT INTO settings (key, value, description) VALUES
  ('certificate_threshold', '60', 'Minimum completion % required to earn a certificate'),
  ('plagiarism_threshold', '70', 'Plagiarism % above which submission is flagged'),
  ('ai_grading_enabled', 'true', 'Enable/disable AI auto-grading on submission'),
  ('max_offerings_per_trainer', '5', 'Maximum active course offerings per trainer'),
  ('platform_name', 'TRAINET', 'Platform display name')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE settings IS 'System configuration settings (SRDS FR-AD-4)';
