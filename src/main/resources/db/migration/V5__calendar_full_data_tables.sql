-- ==============================================================================
-- Flyway Migration: V5__calendar_full_data_tables.sql
-- Supports: Moving all calendar raw data (commitments, scheduling, sources, team)
--           and rich drawer metadata into PostgreSQL relational tables
-- ==============================================================================

-- 1. Enhance calendar_events with rich drawer metadata
ALTER TABLE calendar_events ADD COLUMN agenda_text TEXT;
ALTER TABLE calendar_events ADD COLUMN notes_text TEXT;
ALTER TABLE calendar_events ADD COLUMN notes_timestamp VARCHAR(50);
ALTER TABLE calendar_events ADD COLUMN decision_title VARCHAR(255);
ALTER TABLE calendar_events ADD COLUMN decision_status VARCHAR(255);
ALTER TABLE calendar_events ADD COLUMN followups_json TEXT;
ALTER TABLE calendar_events ADD COLUMN attendees_json TEXT;
ALTER TABLE calendar_events ADD COLUMN organizer_name VARCHAR(100);
ALTER TABLE calendar_events ADD COLUMN organizer_role VARCHAR(100);
ALTER TABLE calendar_events ADD COLUMN meeting_url VARCHAR(255);
ALTER TABLE calendar_events ADD COLUMN rsvp_status VARCHAR(50) DEFAULT 'Accepted';

-- 2. Table: calendar_commitments (Top 4 upcoming commitment cards)
CREATE TABLE calendar_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    day_text VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    theme VARCHAR(30) NOT NULL DEFAULT 'lime',
    icon VARCHAR(30) NOT NULL DEFAULT 'flag',
    target_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
    commitment_date DATE NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendar_commitments_org ON calendar_commitments(organization_id, display_order);

-- 3. Table: calendar_needs_scheduling (Right rail review alert card)
CREATE TABLE calendar_needs_scheduling (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project VARCHAR(100),
    action_label VARCHAR(100) DEFAULT 'Find a time',
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendar_needs_sched_org ON calendar_needs_scheduling(organization_id);

-- 4. Table: calendar_sources (Connected calendars: Brick, Google, Microsoft 365)
CREATE TABLE calendar_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    account_email VARCHAR(255),
    color_dot VARCHAR(30) NOT NULL DEFAULT 'lime',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendar_sources_org ON calendar_sources(organization_id);

-- 5. Table: calendar_team_availability (Right rail team avatars & presence)
CREATE TABLE calendar_team_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    member_initials VARCHAR(10) NOT NULL,
    member_name VARCHAR(100) NOT NULL,
    member_role VARCHAR(100),
    avatar_theme VARCHAR(30) NOT NULL DEFAULT 'avatar-pk',
    availability_status VARCHAR(50) DEFAULT 'Available',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendar_team_avail_org ON calendar_team_availability(organization_id, display_order);
