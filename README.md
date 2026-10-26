# Teamden

<p align="center">
  <img src="Teamden%20Minimalist%20Logo.png" alt="Teamden Logo" width="320"/>
</p>

> **Teamden by shed** — A unified team productivity, project management, and business operations platform designed for modern, multi-unit organizations.

---

## 🚀 Overview

Teamden centralizes daily work, people operations, planning, internal knowledge, and executive reporting into one intuitive workspace. Built with strict role-based access control (RBAC) and least-privilege scoping across business units and departments.

### Key Capabilities (MVP / P0)

* **Work Management**:
  * **My Day & Tasks**: Individual daily standup view with prioritized tasks, deadlines, and blockers.
  * **Task Boards & Details**: Interactive board and list views with subtasks, comments, attachments, and blocker escalation.
  * **Projects & Health**: High-level project overviews, outcome tracking, deadline management, and risk indicators.
  * **Daily Updates & Standups**: Automated suggestion of completed task activity with friction-free daily submissions.
  * **Time Tracking**: Live timers and manual time logs with structured manager approval queues.

* **People & Operations**:
  * **Directory & Profiles**: Employee profiles with department, business unit, and reporting manager hierarchies.
  * **Attendance**: Digital check-in/out logging with traceable correction workflows (strictly isolated from billable task time).
  * **Leave Management**: Leave requests, allowance balances, and multi-tier approval queues.

* **Planning & Knowledge**:
  * **Unified Calendar**: Personal, team, and project calendars for milestones and leave schedules.
  * **Notification Center**: Real-time alerts for assignments, mentions, and approvals with data isolation.
  * **Knowledge Hub**: Scoped SOPs, company policies, and onboarding documentation.

* **Management & Oversight**:
  * **Manager Dashboard**: Real-time metrics on blockers, overdue items, missing updates, and project health.
  * **Audit Log & Security**: Comprehensive audit trails for lifecycle events, permission modifications, and data exports.

---

## 🛠️ Tech Stack

* **Backend**: Java 21, Spring Boot
* **Persistence**: Spring Data JPA, PostgreSQL, Flyway Database Migrations
* **Security**: Spring Security (RBAC & Least-Privilege Scoping)
* **Observability**: Spring Boot Actuator, Spring Boot Admin

---

## 📋 Getting Started

### Prerequisites
* Java Development Kit (JDK 21 or 17+)
* PostgreSQL 15+
* Maven 3.9+ (or included `./mvnw`)

### Running the Application

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mirrodevelopment/Teamden.git
   cd Teamden
   ```

2. **Configure PostgreSQL**:
   Update `src/main/resources/application.yaml` with your database credentials.

3. **Build & Run**:
   ```bash
   ./mvnw spring-boot:run
   ```

---

## 📄 License

Proprietary © Shed. All rights reserved.
