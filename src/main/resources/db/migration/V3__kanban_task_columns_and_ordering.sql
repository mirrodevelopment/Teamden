-- ==========================================================
-- V3__kanban_task_columns_and_ordering.sql
-- Teamden by shed — Interactive Kanban Task Columns and Ordering
-- ==========================================================

-- 1. Alter tasks table to include kanban column and ordering index
ALTER TABLE tasks ADD COLUMN kanban_column VARCHAR(30) NOT NULL DEFAULT 'NOW';
ALTER TABLE tasks ADD COLUMN column_order INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill existing default tasks
UPDATE tasks SET kanban_column = 'NOW', column_order = 1 WHERE title LIKE '%Review mobile app%';
UPDATE tasks SET kanban_column = 'NOW', column_order = 2 WHERE title LIKE '%Update homepage%';
UPDATE tasks SET kanban_column = 'NEXT', column_order = 1 WHERE title LIKE '%Prepare client%';
UPDATE tasks SET kanban_column = 'NEXT', column_order = 2 WHERE title LIKE '%Refine brand%';
UPDATE tasks SET kanban_column = 'LATER', column_order = 1 WHERE title LIKE '%Set up analytics%';
UPDATE tasks SET kanban_column = 'LATER', column_order = 2 WHERE title LIKE '%Write project%';

-- 3. Composite Index for high-performance organization-scoped column queries
CREATE INDEX idx_tasks_org_kanban_col ON tasks(organization_id, kanban_column, column_order);
