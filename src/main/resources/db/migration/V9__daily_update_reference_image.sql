-- ==============================================================================
-- Flyway Migration: V9__daily_update_reference_image.sql
-- Adds reference image attachment support to daily_updates
-- ==============================================================================

ALTER TABLE daily_updates ADD COLUMN IF NOT EXISTS reference_image_url TEXT;
ALTER TABLE daily_updates ADD COLUMN IF NOT EXISTS reference_image_name VARCHAR(255);
