-- ==============================================================================
-- Flyway Database Migration: V15__inbox_items_schema.sql
-- Module: Inbox Page & User Notifications Register
-- Purpose: Dedicated relational persistence for inbox items, attention queue,
--          and user notification preferences with strict multi-tenant & user scoping.
-- Standard: ZERO SEED DATA. Clean table creation only.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    section VARCHAR(50) NOT NULL, -- ATTENTION_QUEUE, REGISTER_TODAY, REGISTER_EARLIER
    category VARCHAR(50) NOT NULL, -- NEEDS_ACTION, UPDATES, ARCHIVED
    filter_type VARCHAR(50) NOT NULL DEFAULT 'ALL', -- ALL, UNREAD, MENTIONS, FOLLOWING
    item_type VARCHAR(50) NOT NULL, -- APPROVAL, FEEDBACK, HANDOFF, MENTION, ASSIGNMENT, DECISION, UPDATE, CALENDAR
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    quote TEXT,
    description TEXT,
    project_title VARCHAR(255),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    requester_name VARCHAR(100),
    requester_initials VARCHAR(10),
    supporting_doc_title VARCHAR(255),
    supporting_doc_id UUID,
    due_date_str VARCHAR(50),
    action_label VARCHAR(100),
    action_url VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_snoozed BOOLEAN NOT NULL DEFAULT FALSE,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inbox_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notify_mentions BOOLEAN NOT NULL DEFAULT TRUE,
    notify_assignments BOOLEAN NOT NULL DEFAULT TRUE,
    notify_decisions BOOLEAN NOT NULL DEFAULT TRUE,
    notify_approvals BOOLEAN NOT NULL DEFAULT TRUE,
    muted_threads TEXT, -- JSON array of muted item IDs
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_inbox_pref_user_org UNIQUE (user_id, organization_id)
);

-- Performance & Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_inbox_items_user_org_sec 
    ON inbox_items(organization_id, user_id, section, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_inbox_items_user_read 
    ON inbox_items(organization_id, user_id, is_read, is_archived);

CREATE INDEX IF NOT EXISTS idx_inbox_items_project 
    ON inbox_items(project_id);
