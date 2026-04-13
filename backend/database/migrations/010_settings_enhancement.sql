-- Migration 010: Settings Enhancement
-- Adds additional platform configuration settings

INSERT INTO settings (key, value, description) VALUES
  ('registration_enabled', 'true', 'Allow new user registrations'),
  ('max_course_duration_weeks', '12', 'Maximum allowed course duration in weeks'),
  ('certificates_enabled', 'true', 'Enable certificate generation'),
  ('maintenance_mode', 'false', 'Put platform in maintenance mode')
ON CONFLICT (key) DO NOTHING;
