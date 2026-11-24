-- ==============================================================================
-- V16: Complete Organization Registration Schema (BRICK Specification)
-- Creates organization_addresses, user_profiles, email_verifications,
-- and legal_acceptances tables, and extends organizations with company details.
-- ==============================================================================

-- 1. Extend organizations with company details
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS legal_name VARCHAR(200);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_type VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry_other VARCHAR(150);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_size VARCHAR(50);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS year_established INT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Organization Addresses (Registered & Billing)
CREATE TABLE IF NOT EXISTS organization_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    country VARCHAR(100) NOT NULL,
    registered_address VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(30),
    business_reg_number VARCHAR(100),
    tax_id VARCHAR(100),
    billing_same_as_registered BOOLEAN NOT NULL DEFAULT TRUE,
    billing_address VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(30),
    billing_country VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Profiles (Job Title, Phone, Profile Picture)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(150),
    phone_number VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Email Verifications (OTP / Verification Tokens)
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(50) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Legal Acceptances (Terms, Privacy & Corporate Authorization)
CREATE TABLE IF NOT EXISTS legal_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    privacy_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    authorized_to_register BOOLEAN NOT NULL DEFAULT TRUE,
    terms_version VARCHAR(50) NOT NULL DEFAULT 'v1.0',
    privacy_version VARCHAR(50) NOT NULL DEFAULT 'v1.0',
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_addresses_org ON organization_addresses(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verif_lookup ON email_verifications(email, verification_code);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_org ON legal_acceptances(user_id, organization_id);
