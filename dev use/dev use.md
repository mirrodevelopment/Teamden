# Teamden by shed — Developer Reference Guide

Comprehensive developer reference document detailing database connection parameters, complete schema tables, active accounts and credentials, REST API specifications, and local development workflows.

---

## 1. Environment & Architecture Overview

| Component | Technology | Version / Configuration |
| :--- | :--- | :--- |
| **Backend Framework** | Spring Boot | 3.5.x (Java 21) |
| **Relational Database** | PostgreSQL | 17 / 16 |
| **Database Migrations** | Flyway | Location: `src/main/resources/db/migration` |
| **Web Application** | Vanilla HTML / CSS / JS | Served from `src/main/resources/static` |
| **Design System** | Centralized Theme | `fragments/theme/theme.css` (Light & B&W) |
| **Primary Typography** | Montserrat (Google Fonts) | `fragments/fonts/fonts.css` |
| **Authentication** | Spring Security + HttpSession | Cookie: `TEAMDEN_SESSION` (Lax, HttpOnly) |
| **Password Encoder** | BCrypt | Strength: 12 rounds |
| **Default Web Port** | HTTP | `8080` (`http://localhost:8080`) |
| **Default DB Port** | TCP | `5432` (`localhost:5432`) |

---

## 2. Database Connection & Credentials

| Parameter | Configuration Value | Environment Variable Override |
| :--- | :--- | :--- |
| **Host** | `localhost` (127.0.0.1) | — |
| **Port** | `5432` | — |
| **Database Name** | `teamden` | — |
| **Username** | `postgres` | `DB_USERNAME` |
| **Password** | `[Configured via DB_PASSWORD]` | `DB_PASSWORD` |
| **JDBC URL** | `jdbc:postgresql://localhost:5432/teamden` | `DB_URL` |
| **Driver Class** | `org.postgresql.Driver` | — |
| **Connection Pool** | HikariCP (Max: 10, Min Idle: 2) | — |

### Direct Connection via PSQL
Run from PowerShell:
```powershell
$env:PGPASSWORD=$env:DB_PASSWORD; & 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -U postgres -d teamden
```

---

## 3. Database Schema & Tables

Teamden uses 7 core business tables and 1 Flyway migration metadata table:

### 3.1. `organizations`
Stores tenant organizations and workspaces.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `name` | `VARCHAR(150)` | **NO** | — | Workspace / Company Name |
| `status` | `VARCHAR(30)` | **NO** | `'ACTIVE'` | `ACTIVE`, `SUSPENDED`, `ARCHIVED` |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Last updated timestamp |

---

### 3.2. `users`
Stores user accounts across all workspaces.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `full_name` | `VARCHAR(150)` | **NO** | — | Employee / User display name |
| `email` | `VARCHAR(255)` | **NO** | — | Unique login email (`uk_users_email`) |
| `password_hash` | `VARCHAR(255)` | **NO** | — | BCrypt password hash (12 rounds) |
| `status` | `VARCHAR(30)` | **NO** | `'ACTIVE'` | `ACTIVE`, `DISABLED`, `PENDING_INVITE` |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Account creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Last updated timestamp |
| `last_login_at` | `TIMESTAMPTZ` | YES | `NULL` | Timestamp of last successful login |

---

### 3.3. `organization_memberships`
Maps users to organizations with role-based access control.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `organization_id` | `UUID` | **NO** | — | Foreign Key -> `organizations(id)` |
| `user_id` | `UUID` | **NO** | — | Foreign Key -> `users(id)` |
| `role` | `VARCHAR(30)` | **NO** | — | `OWNER`, `ADMIN`, `MEMBER`, `GUEST` |
| `status` | `VARCHAR(30)` | **NO** | `'ACTIVE'` | `ACTIVE`, `SUSPENDED` |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Membership creation timestamp |

- **Unique Constraint:** `(organization_id, user_id)`
- **Indexes:** `idx_memberships_org`, `idx_memberships_user`

---

### 3.4. `projects`
Work management projects within an organization.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `organization_id` | `UUID` | **NO** | — | Foreign Key -> `organizations(id)` |
| `name` | `VARCHAR(200)` | **NO** | — | Project Name |
| `description` | `TEXT` | YES | `NULL` | Detailed project scope and info |
| `status` | `VARCHAR(30)` | **NO** | `'ACTIVE'` | `PLANNING`, `ACTIVE`, `COMPLETED`, `ON_HOLD` |
| `health` | `VARCHAR(30)` | **NO** | `'ON_TRACK'` | `ON_TRACK`, `AT_RISK`, `OFF_TRACK` (V2) |
| `priority` | `VARCHAR(30)` | **NO** | `'MEDIUM'` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` (V2) |
| `project_type` | `VARCHAR(100)` | YES | `'General'` | Category/Type e.g. `Design / Development` (V2) |
| `owner_id` | `UUID` | YES | `NULL` | Foreign Key -> `users(id)` (Project Lead) |
| `start_date` | `DATE` | YES | `NULL` | Planned start date |
| `due_date` | `DATE` | YES | `NULL` | Planned completion date |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Project creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Last updated timestamp |

- **Indexes:** `idx_projects_org_status`

---

### 3.5. `tasks`
Individual tasks linked to projects and assigned to members.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `organization_id` | `UUID` | **NO** | — | Foreign Key -> `organizations(id)` |
| `project_id` | `UUID` | YES | `NULL` | Foreign Key -> `projects(id)` |
| `milestone_id` | `UUID` | YES | `NULL` | Foreign Key -> `project_milestones(id)` (V2) |
| `task_code` | `VARCHAR(50)` | YES | `NULL` | Display code e.g. `T-014` (V2) |
| `title` | `VARCHAR(255)` | **NO** | — | Task title |
| `description` | `TEXT` | YES | `NULL` | Task details / acceptance criteria |
| `assignee_id` | `UUID` | YES | `NULL` | Foreign Key -> `users(id)` |
| `creator_id` | `UUID` | **NO** | — | Foreign Key -> `users(id)` |
| `priority` | `VARCHAR(30)` | **NO** | `'MEDIUM'` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `status` | `VARCHAR(30)` | **NO** | `'TODO'` | `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE` |
| `is_blocked` | `BOOLEAN` | **NO** | `FALSE` | Explicit blocker flag (V2) |
| `blocker_reason` | `VARCHAR(255)` | YES | `NULL` | Rationale/dependency blocking work (V2) |
| `subtasks_count` | `INTEGER` | **NO** | `0` | Cached count of subtasks (V2) |
| `due_date` | `DATE` | YES | `NULL` | Due date for task |
| `completed_at` | `TIMESTAMPTZ` | YES | `NULL` | Timestamp when marked DONE |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Task creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Last updated timestamp |

- **Indexes:** `idx_tasks_org_status`, `idx_tasks_org_assignee`, `idx_tasks_org_completed`, `idx_tasks_project_milestone`, `idx_tasks_project_blocked`

---

### 3.6. `attendance_records`
Employee daily punch-in and punch-out attendance records.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `organization_id` | `UUID` | **NO** | — | Foreign Key -> `organizations(id)` |
| `employee_id` | `UUID` | **NO** | — | Foreign Key -> `users(id)` |
| `attendance_date` | `DATE` | **NO** | — | Work date (UTC) |
| `check_in_time` | `TIMESTAMPTZ` | **NO** | — | Clock-in timestamp |
| `check_out_time` | `TIMESTAMPTZ` | YES | `NULL` | Clock-out timestamp |
| `status` | `VARCHAR(30)` | **NO** | `'PRESENT'` | `PRESENT`, `HALF_DAY`, `ON_LEAVE`, `ABSENT` |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Last update timestamp |

- **Unique Constraint:** `(organization_id, employee_id, attendance_date)`
- **Special Rule:** Users with `role = 'OWNER'` are automatically **exempt** from attendance check-in.
- **Indexes:** `idx_attendance_org_date_status`

---

### 3.7. `activity_events`
Audit trail and recent activity feed for organization dashboards.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `organization_id` | `UUID` | **NO** | — | Foreign Key -> `organizations(id)` |
| `actor_id` | `UUID` | YES | `NULL` | User who performed the action |
| `project_id` | `UUID` | YES | `NULL` | Foreign Key -> `projects(id)` (V2) |
| `event_type` | `VARCHAR(50)` | **NO** | — | `TASK_CREATED`, `TASK_COMPLETED`, `PROJECT_CREATED`, etc. |
| `entity_type` | `VARCHAR(50)` | **NO** | — | `TASK`, `PROJECT`, `ORGANIZATION`, `ATTENDANCE` |
| `entity_id` | `UUID` | YES | `NULL` | Target entity UUID |
| `title` | `VARCHAR(255)` | **NO** | — | Event headline |
| `description` | `VARCHAR(500)` | YES | `NULL` | Event summary details |
| `event_timestamp` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Event timestamp |

- **Indexes:** `idx_activity_org_time`, `idx_activity_org_proj_time`

---

### 3.8. `project_specifications` (V2 Project Flow)
Strategic goals, deliverables breakdown, and project context.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `organization_id` | `UUID` | **NO** | — | Foreign Key -> `organizations(id)` |
| `project_id` | `UUID` | **NO** | — | Foreign Key -> `projects(id)` (Unique) |
| `title` | `VARCHAR(255)` | **NO** | — | Strategic specification title |
| `objectives` | `TEXT` | YES | `NULL` | Strategic objectives list |
| `deliverables` | `TEXT` | YES | `NULL` | Deliverables breakdown |
| `success_criteria` | `TEXT` | YES | `NULL` | Acceptance and KPI criteria |
| `client_name` | `VARCHAR(150)` | YES | `NULL` | Client / stakeholder name |
| `focus_area` | `VARCHAR(255)` | YES | `NULL` | Strategic focus area |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Last updated timestamp |

- **Unique Constraint:** `(project_id)`
- **Indexes:** `idx_proj_spec_org_project`

---

### 3.9. `project_milestones` (V2 Project Flow)
Ordered delivery stages tracking milestone progress.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `organization_id` | `UUID` | **NO** | — | Foreign Key -> `organizations(id)` |
| `project_id` | `UUID` | **NO** | — | Foreign Key -> `projects(id)` |
| `seq_num` | `INTEGER` | **NO** | — | Stage sequence number (1, 2, 3...) |
| `code` | `VARCHAR(20)` | **NO** | — | Code e.g. `01`, `06`, `MS-01` |
| `name` | `VARCHAR(150)` | **NO** | — | Stage name (e.g. `Discovery`, `Review`) |
| `description` | `TEXT` | YES | `NULL` | Stage scope & deliverables |
| `status` | `VARCHAR(30)` | **NO** | `'UPCOMING'` | `UPCOMING`, `CURRENT`, `COMPLETED`, `DELAYED` |
| `status_label` | `VARCHAR(50)` | YES | `NULL` | Display label e.g. `In Progress` |
| `due_date` | `DATE` | YES | `NULL` | Target completion date |
| `completed_at` | `TIMESTAMPTZ` | YES | `NULL` | Timestamp when stage completed |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Last updated timestamp |

- **Unique Constraint:** `(project_id, seq_num)`
- **Indexes:** `idx_milestones_proj_seq`, `idx_milestones_org_status`

---

### 3.10. `task_subtasks` (V2 Project Flow)
Checklist items and subtasks linked to parent tasks.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `organization_id` | `UUID` | **NO** | — | Foreign Key -> `organizations(id)` |
| `task_id` | `UUID` | **NO** | — | Foreign Key -> `tasks(id)` |
| `title` | `VARCHAR(255)` | **NO** | — | Subtask description |
| `is_completed` | `BOOLEAN` | **NO** | `FALSE` | Completion status |
| `seq_num` | `INTEGER` | **NO** | `1` | Order index |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Last updated timestamp |

- **Indexes:** `idx_subtasks_task`

---

### 3.11. `project_decisions` (V2 Project Flow)
Decision register tracking sign-offs, approvals, and stakeholders.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `organization_id` | `UUID` | **NO** | — | Foreign Key -> `organizations(id)` |
| `project_id` | `UUID` | **NO** | — | Foreign Key -> `projects(id)` |
| `decision_code` | `VARCHAR(50)` | YES | `NULL` | Decision code e.g. `DEC-01` |
| `title` | `VARCHAR(255)` | **NO** | — | Decision title / headline |
| `sub_title` | `VARCHAR(255)` | YES | `NULL` | Secondary summary line |
| `description` | `TEXT` | YES | `NULL` | Decision rationale & scope |
| `status` | `VARCHAR(30)` | **NO** | `'PENDING'` | `PENDING`, `APPROVED`, `REJECTED`, `IN_REVIEW` |
| `due_date` | `DATE` | YES | `NULL` | Decision due date |
| `decider_id` | `UUID` | YES | `NULL` | Foreign Key -> `users(id)` |
| `action_url` | `VARCHAR(255)` | YES | `NULL` | Link or route to review action |
| `action_label` | `VARCHAR(100)` | YES | `NULL` | Action button text (e.g. `Review →`) |
| `indicator_color` | `VARCHAR(30)` | YES | `'amber'` | Status indicator color badge |
| `decided_at` | `TIMESTAMPTZ` | YES | `NULL` | Timestamp of sign-off |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Last updated timestamp |

- **Indexes:** `idx_decisions_proj_status`, `idx_decisions_org_decider`

---

### 3.12. `project_documents` (V2 Project Flow)
Knowledge base repository (specs, briefs, notes, design assets).
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `organization_id` | `UUID` | **NO** | — | Foreign Key -> `organizations(id)` |
| `project_id` | `UUID` | **NO** | — | Foreign Key -> `projects(id)` |
| `doc_number` | `VARCHAR(50)` | **NO** | — | Display number e.g. `DOCUMENT / 001` |
| `title` | `VARCHAR(255)` | **NO** | — | Document title |
| `category` | `VARCHAR(50)` | **NO** | `'Meeting Notes'` | Category (e.g. `Meeting Notes`, `Foundation`, `Reference`) |
| `category_key` | `VARCHAR(30)` | **NO** | `'Notes'` | Filter category (`Notes`, `Plans`, `Design`, `Other`) |
| `file_type` | `VARCHAR(30)` | **NO** | `'DOC'` | File extension / type (`DOC`, `PDF`, `FIGMA`, `NOTE`) |
| `file_size` | `VARCHAR(50)` | YES | `NULL` | File size display string |
| `file_url` | `VARCHAR(500)` | YES | `NULL` | External link or file path |
| `content` | `TEXT` | YES | `NULL` | Rich text or markdown note body |
| `author_id` | `UUID` | YES | `NULL` | Foreign Key -> `users(id)` |
| `is_pinned` | `BOOLEAN` | **NO** | `FALSE` | Pinned status in library |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Last updated timestamp |

- **Indexes:** `idx_docs_proj_cat`, `idx_docs_org`

---

### 3.13. `project_document_collaborators` (V2 Project Flow)
Meeting attendees and document contributors.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `organization_id` | `UUID` | **NO** | — | Foreign Key -> `organizations(id)` |
| `document_id` | `UUID` | **NO** | — | Foreign Key -> `project_documents(id)` |
| `user_id` | `UUID` | **NO** | — | Foreign Key -> `users(id)` |
| `role` | `VARCHAR(30)` | **NO** | `'COLLABORATOR'` | `AUTHOR`, `COLLABORATOR`, `ATTENDEE` |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Creation timestamp |

- **Unique Constraint:** `(document_id, user_id, role)`
- **Indexes:** `idx_doc_collab_doc`

---

### 3.14. `project_members` (V2 Project Flow)
Dedicated project team allocations and project-specific roles.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `organization_id` | `UUID` | **NO** | — | Foreign Key -> `organizations(id)` |
| `project_id` | `UUID` | **NO** | — | Foreign Key -> `projects(id)` |
| `user_id` | `UUID` | **NO** | — | Foreign Key -> `users(id)` |
| `role` | `VARCHAR(50)` | **NO** | `'CONTRIBUTOR'` | `LEAD`, `DESIGNER`, `DEVELOPER`, `CONTRIBUTOR` |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Creation timestamp |

- **Unique Constraint:** `(project_id, user_id)`
- **Indexes:** `idx_proj_members_proj`, `idx_proj_members_user`

---

### 3.15. `task_linked_documents` (V2 Project Flow)
Cross-reference mapping between tasks and project knowledge documents.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **NO** | — | Primary Key |
| `organization_id` | `UUID` | **NO** | — | Foreign Key -> `organizations(id)` |
| `task_id` | `UUID` | **NO** | — | Foreign Key -> `tasks(id)` |
| `document_id` | `UUID` | **NO** | — | Foreign Key -> `project_documents(id)` |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Creation timestamp |

- **Unique Constraint:** `(task_id, document_id)`
- **Indexes:** `idx_task_docs_task`

---

### 3.16. `flyway_schema_history`
Flyway migration tracking table.
| Column | Type | Description |
| :--- | :--- | :--- |
| `installed_rank` | `INTEGER` | Migration execution sequence rank |
| `version` | `VARCHAR` | Version number (e.g., `1` for `V1__init_schema.sql`, `2` for `V2__project_flow_tables.sql`) |
| `description` | `VARCHAR` | Migration description |
| `script` | `VARCHAR` | File name (`V1__init_schema.sql`, `V2__project_flow_tables.sql`) |
| `checksum` | `INTEGER` | CRC32 checksum |
| `installed_on` | `TIMESTAMP` | Execution date and time |
| `success` | `BOOLEAN` | `true` if migration succeeded |
| `success` | `BOOLEAN` | `true` if migration succeeded |

---

## 4. Active Users & Accounts

User accounts and workspaces are provisioned dynamically during registration or company onboarding.

### 4.1. Account Provisioning & Roles
- **OWNER**: Provisioned during initial workspace setup (`/api/setup/register-company`).
- **MEMBER / ADMIN / VIEWER**: Invited to organizations via membership records.
- **Attendance Tracking**: Owners are exempt; all members have daily punch-in/out records.

### 4.2. Creating / Resetting Passwords via BCrypt

Teamden uses BCrypt with strength 12. To generate a hash directly in Java:
```java
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
String hash = encoder.encode("<raw_password>");
```
Or via SQL update if needing to reset an account directly:
```sql
-- Sets password hash for target user
UPDATE users 
SET password_hash = '<bcrypt_12_hash>' 
WHERE email = '<target_user_email>';
```

---

## 5. REST API Endpoints Quick Reference

Base URL: `http://localhost:8080`

### 5.1. Authentication & Session

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | No | Authenticate user (`email`, `password`) |
| `POST` | `/api/auth/logout` | Yes | Destroy current session and clear cookie |
| `GET` | `/api/auth/session` | Yes | Get currently authenticated user details |
| `GET` | `/api/auth/csrf` | No | Fetch CSRF token cookie (`XSRF-TOKEN`) |

#### Sample Login Request:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "YOUR_PASSWORD"
}
```

### 5.2. Workspace Setup (First Boot)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/setup/status` | No | Check if workspace has been provisioned |
| `POST` | `/api/setup` | No | Create initial organization and owner account |

### 5.3. Operations & Workspaces

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/attendance/check-in` | Yes | Clock in for today (Standard members) |
| `POST` | `/api/attendance/check-out` | Yes | Clock out for today |
| `GET` | `/api/projects` | Yes | List projects for active workspace |
| `POST` | `/api/projects` | Yes | Create project |
| `GET` | `/api/tasks` | Yes | List tasks for active workspace |
| `POST` | `/api/tasks` | Yes | Create task |

### 5.4. System Actuator & Health

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/actuator/health` | Health status (`{"status":"UP"}`) |
| `GET` | `/actuator/info` | Application metadata |

---

## 6. Developer Commands & Workflows

### 6.1. One-Click Launcher (`start.bat`)
Run from the root directory:
```cmd
start.bat
```
What it does:
1. Checks PostgreSQL on port 5432 and auto-starts the service if stopped.
2. Checks port 8080 and frees any lingering zombie processes.
3. Spawns background health monitor that opens Google Chrome when backend HTTP 200 is confirmed.
4. Boots Spring Boot with DB password from environment configuration.

### 6.2. Maven Build & Test Commands
Run via the bundled Maven Wrapper:
```cmd
:: Compile all classes
mvnw.cmd compile

:: Run full automated test suite (14 test cases)
mvnw.cmd test

:: Run application with specific port or database
mvnw.cmd spring-boot:run
```

### 6.3. Theme & Font Assets
- **Central Theme:** `src/main/resources/static/fragments/theme/theme.css`
  - Toggle between `data-theme="light"` and `data-theme="black-and-white"`.
- **Central Font:** `src/main/resources/static/fragments/fonts/fonts.css`
  - Font: **Montserrat** exclusively.
