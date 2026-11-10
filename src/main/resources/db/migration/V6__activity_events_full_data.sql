-- ==============================================================================
-- Flyway Migration: V6__activity_events_full_data.sql
-- Supports: Storing complete rich activity metadata in PostgreSQL/H2 tables
--           and backing full Activity Table View
-- ==============================================================================

-- 1. Enhance activity_events with rich display columns
ALTER TABLE activity_events ADD COLUMN action_text VARCHAR(100);
ALTER TABLE activity_events ADD COLUMN target_title VARCHAR(255);
ALTER TABLE activity_events ADD COLUMN sub_meta VARCHAR(255);
ALTER TABLE activity_events ADD COLUMN info_text VARCHAR(500);
ALTER TABLE activity_events ADD COLUMN quote_preview TEXT;
ALTER TABLE activity_events ADD COLUMN badge_type VARCHAR(50);
ALTER TABLE activity_events ADD COLUMN dot_color VARCHAR(30);

-- 2. Index for high-performance filtering across badge type, organization, and timestamp
CREATE INDEX idx_activity_badge_time ON activity_events(organization_id, badge_type, event_timestamp DESC);
