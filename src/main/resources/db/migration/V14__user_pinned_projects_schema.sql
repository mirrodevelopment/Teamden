-- Flyway migration: V14__user_pinned_projects_schema.sql
-- User-scoped pinned projects for sidebar navigation

CREATE TABLE IF NOT EXISTS user_pinned_projects (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    project_id UUID NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_pinned_projects_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_pinned_projects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_pinned_projects_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_pinned_project UNIQUE (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_user_pinned_projects_user_org 
    ON user_pinned_projects(user_id, organization_id, sort_order);
