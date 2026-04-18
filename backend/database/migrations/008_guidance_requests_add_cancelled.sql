-- Migration: Add 'cancelled' to guidance_requests status constraint
-- Date: 2026-04-18
--
-- Root cause: The original CHECK constraint on guidance_requests.status
-- only allowed ('pending', 'accepted', 'rejected').
-- The cancel feature requires 'cancelled' as a valid status.
-- This migration drops the old constraint and adds the updated one.

ALTER TABLE guidance_requests
  DROP CONSTRAINT IF EXISTS guidance_requests_status_check;

ALTER TABLE guidance_requests
  ADD CONSTRAINT guidance_requests_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'));
