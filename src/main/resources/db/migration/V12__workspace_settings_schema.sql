-- =============================================================================
-- Flyway Database Migration: V12__workspace_settings_schema.sql
-- Module: Workspace Organisation Settings (Brick UI Control Studio)
-- Purpose: Persist workspace identity, timezone, language, week start,
--          connected integrations, and security policy configurations.
-- =============================================================================

CREATE TABLE IF NOT EXISTS workspace_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_name VARCHAR(150) NOT NULL DEFAULT 'Acme Co.',
    workspace_type VARCHAR(100) NOT NULL DEFAULT 'Organisation workspace',
    workspace_url VARCHAR(255) NOT NULL DEFAULT 'acme.brick.app',
    logo_initials VARCHAR(10) NOT NULL DEFAULT 'AC',
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata (GMT+5:30)',
    language VARCHAR(50) NOT NULL DEFAULT 'English',
    week_starts_on VARCHAR(50) NOT NULL DEFAULT 'Monday',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_workspace_settings_org UNIQUE (organization_id)
);

CREATE TABLE IF NOT EXISTS workspace_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    icon_letter VARCHAR(10),
    is_connected BOOLEAN NOT NULL DEFAULT FALSE,
    connection_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_workspace_integrations_org_code UNIQUE (organization_id, code)
);

CREATE TABLE IF NOT EXISTS workspace_security_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    policy_key VARCHAR(100) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    config_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_workspace_security_org_key UNIQUE (organization_id, policy_key)
);

CREATE INDEX IF NOT EXISTS idx_workspace_settings_org ON workspace_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspace_integrations_org ON workspace_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspace_security_org ON workspace_security_policies(organization_id);
