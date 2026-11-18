-- ==============================================================================
-- Flyway Migration: V11__employee_management_schema.sql
-- Description: Complete Employee Management, People & Roles schema for Teamden
-- ==============================================================================

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    subtitle VARCHAR(255),
    department_head_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departments_org ON departments(organization_id, sort_order);

-- 2. Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    employee_id_number VARCHAR(50),
    full_name VARCHAR(150) NOT NULL,
    initials VARCHAR(10) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    job_title VARCHAR(150) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    department_name VARCHAR(150) NOT NULL DEFAULT 'Design Team',
    company_name VARCHAR(150) NOT NULL DEFAULT 'Acme Co.',
    short_bio TEXT,
    detailed_bio TEXT,
    card_theme VARCHAR(50) NOT NULL DEFAULT 'lavender',
    role_title VARCHAR(100) NOT NULL DEFAULT 'Employee',
    employment_type VARCHAR(50) NOT NULL DEFAULT 'Full-time',
    work_location VARCHAR(100) NOT NULL DEFAULT 'London / Remote',
    joining_date DATE,
    reporting_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    reporting_manager_name VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_employees_org_email UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_employees_org_sort ON employees(organization_id, sort_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department_id);

-- 3. Employee Responsibilities Table
CREATE TABLE IF NOT EXISTS employee_responsibilities (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emp_resp_emp ON employee_responsibilities(employee_id, sort_order ASC);

-- 4. Workspace Roles Table
CREATE TABLE IF NOT EXISTS workspace_roles (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions_summary VARCHAR(255),
    employee_count INT NOT NULL DEFAULT 0,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_workspace_roles_org_name UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_workspace_roles_org ON workspace_roles(organization_id, sort_order ASC);

-- 5. Employee Collaborations Table
CREATE TABLE IF NOT EXISTS employee_collaborations (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    partner_name VARCHAR(150) NOT NULL,
    partner_initials VARCHAR(10) NOT NULL,
    project_title VARCHAR(255) NOT NULL,
    status_label VARCHAR(150) NOT NULL,
    card_theme VARCHAR(50) NOT NULL DEFAULT 'peach',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emp_collab_emp ON employee_collaborations(employee_id, sort_order ASC);

-- 6. Employee Shared Documents Table
CREATE TABLE IF NOT EXISTS employee_shared_documents (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_title VARCHAR(255) NOT NULL,
    maintained_by_label VARCHAR(255) NOT NULL,
    document_url VARCHAR(255) NOT NULL DEFAULT '/pages/workspace/workspace.html',
    card_theme VARCHAR(50) NOT NULL DEFAULT 'green',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emp_docs_emp ON employee_shared_documents(employee_id, sort_order ASC);
