-- ==============================================================================
-- Flyway Migration: V8__daily_updates_schema.sql
-- Supports: Daily Standup Updates persistence, accomplishments, planned focus,
--           blockers, mood tracking, and tenant isolation
-- ==============================================================================

CREATE TABLE daily_updates (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    update_date DATE NOT NULL,
    work_completed TEXT NOT NULL,
    work_planned TEXT,
    blockers TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    mood_tag VARCHAR(30) DEFAULT 'ON_TRACK',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_daily_update_org_user_date UNIQUE (organization_id, user_id, update_date)
);

CREATE INDEX idx_daily_update_org_date ON daily_updates(organization_id, update_date DESC);
CREATE INDEX idx_daily_update_user_date ON daily_updates(user_id, update_date DESC);
