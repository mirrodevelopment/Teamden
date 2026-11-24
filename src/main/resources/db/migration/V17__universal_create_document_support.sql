-- ==============================================================================
-- Flyway Migration: V17__universal_create_document_support.sql
-- Description: Allow project_documents to support standalone workspace documents
--              (nullable project_id) and add performance index for recency queries.
-- ==============================================================================

-- 1. Relax project_id foreign key to allow standalone documents
ALTER TABLE project_documents ALTER COLUMN project_id DROP NOT NULL;

-- 2. Performance index for workspace document recency queries
CREATE INDEX IF NOT EXISTS idx_docs_org_created ON project_documents(organization_id, created_at DESC);
