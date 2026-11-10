-- ==============================================================================
-- Flyway Migration: V7__project_chronicle_activity_schema.sql
-- Supports: Unified relational activity persistence for Project Chronicle Activity,
--           milestone tracking, decision tracking, and contextual actions
-- ==============================================================================

-- 1. Enhance activity_events with Project Chronicle fields
ALTER TABLE activity_events ADD COLUMN category_key VARCHAR(50);
ALTER TABLE activity_events ADD COLUMN icon_type VARCHAR(50);
ALTER TABLE activity_events ADD COLUMN icon_bg_class VARCHAR(50);
ALTER TABLE activity_events ADD COLUMN action_label VARCHAR(100);
ALTER TABLE activity_events ADD COLUMN action_type VARCHAR(50);
ALTER TABLE activity_events ADD COLUMN action_target_id VARCHAR(100);
ALTER TABLE activity_events ADD COLUMN is_important BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE activity_events ADD COLUMN is_mention BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE activity_events ADD COLUMN status_from VARCHAR(50);
ALTER TABLE activity_events ADD COLUMN status_to VARCHAR(50);

-- 2. Indexes for project timeline and category filtering performance
CREATE INDEX idx_activity_proj_time ON activity_events(project_id, event_timestamp DESC);
CREATE INDEX idx_activity_org_cat ON activity_events(organization_id, category_key);
