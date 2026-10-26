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
| `title` | `VARCHAR(255)` | **NO** | — | Task title |
| `description` | `TEXT` | YES | `NULL` | Task details / acceptance criteria |
| `assignee_id` | `UUID` | YES | `NULL` | Foreign Key -> `users(id)` |
| `creator_id` | `UUID` | **NO** | — | Foreign Key -> `users(id)` |
| `priority` | `VARCHAR(30)` | **NO** | `'MEDIUM'` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `status` | `VARCHAR(30)` | **NO** | `'TODO'` | `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE` |
| `due_date` | `DATE` | YES | `NULL` | Due date for task |
| `completed_at` | `TIMESTAMPTZ` | YES | `NULL` | Timestamp when marked DONE |
| `created_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Task creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Last updated timestamp |

- **Indexes:** `idx_tasks_org_status`, `idx_tasks_org_assignee`, `idx_tasks_org_completed`

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
| `event_type` | `VARCHAR(50)` | **NO** | — | `TASK_CREATED`, `TASK_COMPLETED`, `PROJECT_CREATED`, etc. |
| `entity_type` | `VARCHAR(50)` | **NO** | — | `TASK`, `PROJECT`, `ORGANIZATION`, `ATTENDANCE` |
| `entity_id` | `UUID` | YES | `NULL` | Target entity UUID |
| `title` | `VARCHAR(255)` | **NO** | — | Event headline |
| `description` | `VARCHAR(500)` | YES | `NULL` | Event summary details |
| `event_timestamp` | `TIMESTAMPTZ` | **NO** | `CURRENT_TIMESTAMP` | Event timestamp |

- **Indexes:** `idx_activity_org_time`

---

### 3.8. `flyway_schema_history`
Flyway migration tracking table.
| Column | Type | Description |
| :--- | :--- | :--- |
| `installed_rank` | `INTEGER` | Migration execution sequence rank |
| `version` | `VARCHAR` | Version number (e.g., `1` for `V1__init_schema.sql`) |
| `description` | `VARCHAR` | Migration description |
| `script` | `VARCHAR` | File name (`V1__init_schema.sql`) |
| `checksum` | `INTEGER` | CRC32 checksum |
| `installed_on` | `TIMESTAMP` | Execution date and time |
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

### 5.3. Dashboard & Operations

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/dashboard/summary` | Yes | KPIs, attendance status, tasks & activity |
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
