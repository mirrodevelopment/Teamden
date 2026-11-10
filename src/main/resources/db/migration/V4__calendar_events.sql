-- ==============================================================================
-- Flyway Migration: V4__calendar_events.sql
-- Table: calendar_events
-- Supports: Relational persistence for Calendar page events, schedules & meetings
-- ==============================================================================

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    start_minutes INT NOT NULL,
    end_minutes INT NOT NULL,
    day_of_week INT NOT NULL DEFAULT 0,
    project VARCHAR(100),
    subtitle VARCHAR(100),
    category VARCHAR(50) NOT NULL DEFAULT 'meeting',
    color_theme VARCHAR(30) NOT NULL DEFAULT 'lavender',
    calendar_source VARCHAR(30) NOT NULL DEFAULT 'brick',
    icon VARCHAR(30) DEFAULT 'calendar',
    location VARCHAR(255),
    attendees TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendar_events_org_date ON calendar_events(organization_id, event_date);
CREATE INDEX idx_calendar_events_user ON calendar_events(user_id);
