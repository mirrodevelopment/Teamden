-- ==============================================================================
-- Flyway Migration: V18__brick_project_creation_fields.sql
-- Description: Add Brick 3-section project creation fields to projects table
-- ==============================================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_code VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_name VARCHAR(150);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_lead_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name VARCHAR(200);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS goals TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deliverables TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(organization_id, project_code);
CREATE INDEX IF NOT EXISTS idx_projects_team ON projects(organization_id, team_id);
