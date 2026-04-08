-- Migration: Certification & QR Verification Module
-- SRDS: FR-CV-1 through FR-CV-5
-- Date: 2026-04-07

-- ============================================
-- STEP 1: certificates table
-- ============================================

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  -- Public-facing unique identifier used in QR codes and verification URLs
  certificate_uuid TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked')),
  -- Performance summary stored at time of issue
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  average_score INTEGER,
  -- QR code stored as base64 data URL
  qr_code_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- One certificate per student per offering
  UNIQUE (student_id, offering_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_offering_id ON certificates(offering_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_uuid ON certificates(certificate_uuid);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);

COMMENT ON TABLE certificates IS 'Digital certificates issued to students upon course completion (SRDS FR-CV-1)';

-- ============================================
-- STEP 2: certificate_logs table (FR-CV-5)
-- ============================================

CREATE TABLE IF NOT EXISTS certificate_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('generated', 'verified', 'revoked')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_certificate_logs_certificate_id ON certificate_logs(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificate_logs_event_type ON certificate_logs(event_type);

COMMENT ON TABLE certificate_logs IS 'Audit log for certificate generation and verification events (SRDS FR-CV-5)';

-- ============================================
-- STEP 3: RLS policies
-- ============================================

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_logs ENABLE ROW LEVEL SECURITY;

-- Students can view their own certificates
CREATE POLICY "Students can view own certificates"
  ON certificates FOR SELECT
  USING (auth.uid() = student_id);

-- Public verification: anyone can read by certificate_uuid (handled in backend with service role)
-- certificate_logs: only service role (backend) writes/reads
