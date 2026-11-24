-- ==============================================================================
-- Flyway Migration: V13__role_permissions_schema.sql
-- Table: workspace_role_permissions
-- Purpose: Relational persistence for module-level role permissions in Workspace Settings
-- ==============================================================================

CREATE TABLE workspace_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_code VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    role_description TEXT,
    role_icon VARCHAR(50) NOT NULL DEFAULT 'shield',
    module_name VARCHAR(50) NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT TRUE,
    can_create BOOLEAN NOT NULL DEFAULT FALSE,
    can_edit BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_org_role_module UNIQUE (organization_id, role_code, module_name)
);

CREATE INDEX idx_workspace_role_perms_org ON workspace_role_permissions(organization_id, role_code);
