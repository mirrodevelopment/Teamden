-- ==============================================================================
-- Flyway Migration: V10__notifications_schema.sql
-- Supports: Brick Inbox & Notifications, Attention Queue, Notification Register,
--           multi-tenant isolation, read/archive/snooze statuses, action controls
-- ==============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    section VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    filter_type VARCHAR(50) NOT NULL DEFAULT 'ALL',
    item_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    quote TEXT,
    description TEXT,
    project_title VARCHAR(255),
    project_id UUID,
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
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_notifications_org_sec ON notifications(organization_id, section, sort_order ASC);
CREATE INDEX idx_notifications_org_cat ON notifications(organization_id, category);
CREATE INDEX idx_notifications_org_read ON notifications(organization_id, is_read, is_archived);
