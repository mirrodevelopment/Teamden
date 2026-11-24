-- ==============================================================================
-- Flyway Migration: V19__brick_teams_and_members_schema.sql
-- Description: Complete Team Creation schema for BRICK (Teams, Team Members,
--              Team Lead Assignments, and Team Permissions)
-- ==============================================================================

-- 1. Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    logo_url TEXT,
    team_lead_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assistant_team_lead_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    reporting_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    visibility VARCHAR(50) NOT NULL DEFAULT 'ORGANIZATION_WIDE',
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_teams_org_name UNIQUE (organization_id, name),
    CONSTRAINT uk_teams_org_code UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teams_dept ON teams(department_id);
CREATE INDEX IF NOT EXISTS idx_teams_lead ON teams(team_lead_id);

-- 2. Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    member_role VARCHAR(100) NOT NULL DEFAULT 'Member',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_team_members_team_emp UNIQUE (team_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_emp ON team_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_team_members_org ON team_members(organization_id);

-- 3. Team Lead Assignments Table
CREATE TABLE IF NOT EXISTS team_lead_assignments (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    lead_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL, -- 'TEAM_LEAD' or 'ASSISTANT_LEAD'
    assigned_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_team_leads_team ON team_lead_assignments(team_id);

-- 4. Team Permissions Table
CREATE TABLE IF NOT EXISTS team_permissions (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    permission_key VARCHAR(100) NOT NULL,
    permission_value VARCHAR(100) NOT NULL DEFAULT 'ENABLED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_team_perms_team_key UNIQUE (team_id, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_team_perms_team ON team_permissions(team_id);
