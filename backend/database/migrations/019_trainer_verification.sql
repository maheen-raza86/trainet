-- Migration: Trainer Verification System
-- Description: Adds trainer_status to profiles and a trainer_applications table
--              for the trainer approval workflow.
-- Date: 2026-05-03

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Add trainer_status to profiles
-- Default is NULL so existing rows are unaffected.
-- Application code treats NULL as 'approved' for backward compatibility.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trainer_status VARCHAR(20)
    DEFAULT NULL
    CHECK (trainer_status IN ('pending', 'approved', 'rejected'));

COMMENT ON COLUMN profiles.trainer_status IS
  'Trainer approval status. NULL = legacy approved trainer. pending | approved | rejected for new trainers.';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Create trainer_applications table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trainer_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  experience      TEXT NOT NULL,
  skills          TEXT NOT NULL,
  bio             TEXT NOT NULL,
  cv_url          TEXT,
  submitted_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at     TIMESTAMP WITH TIME ZONE,
  reviewed_by     UUID REFERENCES profiles(id),
  admin_notes     TEXT,
  UNIQUE (trainer_id)   -- one application per trainer
);

CREATE INDEX IF NOT EXISTS idx_trainer_applications_trainer_id
  ON trainer_applications(trainer_id);

COMMENT ON TABLE trainer_applications IS
  'Trainer verification applications submitted after signup.';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: RLS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE trainer_applications ENABLE ROW LEVEL SECURITY;

-- Trainers can read their own application
CREATE POLICY "Trainers can view own application"
  ON trainer_applications FOR SELECT
  USING (auth.uid() = trainer_id);

-- Trainers can insert their own application
CREATE POLICY "Trainers can submit application"
  ON trainer_applications FOR INSERT
  WITH CHECK (auth.uid() = trainer_id);

-- Trainers can update their own application (re-submit after rejection)
CREATE POLICY "Trainers can update own application"
  ON trainer_applications FOR UPDATE
  USING (auth.uid() = trainer_id);
