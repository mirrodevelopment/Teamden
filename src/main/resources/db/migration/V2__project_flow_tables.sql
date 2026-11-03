-- ==========================================================
-- V2__project_flow_tables.sql
-- Teamden by shed — Project Flow Relational Schema
-- ==========================================================

-- 1. Alter projects table to include project health, priority, and type
ALTER TABLE projects ADD COLUMN health VARCHAR(30) NOT NULL DEFAULT 'ON_TRACK';
ALTER TABLE projects ADD COLUMN priority VARCHAR(30) NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE projects ADD COLUMN project_type VARCHAR(100) DEFAULT 'General';

-- 2. Project Milestones
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    seq_num INTEGER NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'UPCOMING',
    status_label VARCHAR(50),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_milestones_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_milestones_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT uk_milestones_proj_seq UNIQUE (project_id, seq_num)
);

CREATE INDEX idx_milestones_proj_seq ON project_milestones(project_id, seq_num);
CREATE INDEX idx_milestones_org_status ON project_milestones(organization_id, status);

-- 3. Alter tasks table to include milestone link, blocker flags, task codes
ALTER TABLE tasks ADD COLUMN milestone_id UUID;
ALTER TABLE tasks ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN blocker_reason VARCHAR(255);
ALTER TABLE tasks ADD COLUMN task_code VARCHAR(50);
ALTER TABLE tasks ADD COLUMN subtasks_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE tasks ADD CONSTRAINT fk_tasks_milestone FOREIGN KEY (milestone_id) REFERENCES project_milestones(id) ON DELETE SET NULL;
CREATE INDEX idx_tasks_project_milestone ON tasks(project_id, milestone_id);
CREATE INDEX idx_tasks_project_blocked ON tasks(project_id, is_blocked);

-- 4. Task Subtasks
CREATE TABLE task_subtasks (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    task_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    seq_num INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subtasks_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_subtasks_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_subtasks_task ON task_subtasks(task_id, seq_num);

-- 5. Project Specifications
CREATE TABLE project_specifications (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    objectives TEXT,
    deliverables TEXT,
    success_criteria TEXT,
    client_name VARCHAR(150),
    focus_area VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_proj_spec_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_proj_spec_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT uk_proj_spec_project UNIQUE (project_id)
);

CREATE INDEX idx_proj_spec_org_project ON project_specifications(organization_id, project_id);

-- 6. Project Decisions Register
CREATE TABLE project_decisions (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    decision_code VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    sub_title VARCHAR(255),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    due_date DATE,
    decider_id UUID,
    action_url VARCHAR(255),
    action_label VARCHAR(100),
    indicator_color VARCHAR(30) DEFAULT 'amber',
    decided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_decisions_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_decisions_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_decisions_decider FOREIGN KEY (decider_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_decisions_proj_status ON project_decisions(project_id, status);
CREATE INDEX idx_decisions_org_decider ON project_decisions(organization_id, decider_id);

-- 7. Project Documents & Knowledge
CREATE TABLE project_documents (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    doc_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Meeting Notes',
    category_key VARCHAR(30) NOT NULL DEFAULT 'Notes',
    file_type VARCHAR(30) NOT NULL DEFAULT 'DOC',
    file_size VARCHAR(50),
    file_url VARCHAR(500),
    content TEXT,
    author_id UUID,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_docs_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_docs_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_docs_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_docs_proj_cat ON project_documents(project_id, category_key);
CREATE INDEX idx_docs_org ON project_documents(organization_id);

-- 8. Project Document Collaborators
CREATE TABLE project_document_collaborators (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    document_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'COLLABORATOR',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doc_collab_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_doc_collab_doc FOREIGN KEY (document_id) REFERENCES project_documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_doc_collab_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_doc_collab UNIQUE (document_id, user_id, role)
);

CREATE INDEX idx_doc_collab_doc ON project_document_collaborators(document_id);

-- 9. Project Members & Roles
CREATE TABLE project_members (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'CONTRIBUTOR',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_proj_members_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_proj_members_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_proj_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_proj_members UNIQUE (project_id, user_id)
);

CREATE INDEX idx_proj_members_proj ON project_members(project_id);
CREATE INDEX idx_proj_members_user ON project_members(user_id);

-- 10. Task Linked Documents
CREATE TABLE task_linked_documents (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    task_id UUID NOT NULL,
    document_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_docs_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_task_docs_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_docs_doc FOREIGN KEY (document_id) REFERENCES project_documents(id) ON DELETE CASCADE,
    CONSTRAINT uk_task_linked_doc UNIQUE (task_id, document_id)
);

CREATE INDEX idx_task_docs_task ON task_linked_documents(task_id);

-- 11. Alter activity_events table to include project_id reference
ALTER TABLE activity_events ADD COLUMN project_id UUID;
ALTER TABLE activity_events ADD CONSTRAINT fk_activity_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
CREATE INDEX idx_activity_org_proj_time ON activity_events(organization_id, project_id, event_timestamp DESC);
