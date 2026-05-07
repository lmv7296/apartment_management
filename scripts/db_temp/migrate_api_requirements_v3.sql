-- Migration: align database schema with current API route expectations
-- Safe to run multiple times (uses IF NOT EXISTS checks)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Companies table required by auth query (users.company_id -> companies.id)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Properties fields used by /api/v1/Properties POST and RLS-style scoping
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS zip VARCHAR(20),
  ADD COLUMN IF NOT EXISTS property_type VARCHAR(60) NOT NULL DEFAULT 'Apartment',
  ADD COLUMN IF NOT EXISTS year_built INTEGER,
  ADD COLUMN IF NOT EXISTS square_feet INTEGER,
  ADD COLUMN IF NOT EXISTS amenities JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS company_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'properties_company_id_fkey'
  ) THEN
    ALTER TABLE properties
      ADD CONSTRAINT properties_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3) Users fields used by auth/session/preferences/tenant listing
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS company_id UUID,
  ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(10),
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10),
  ADD COLUMN IF NOT EXISTS preferred_unit_prefix VARCHAR(20),
  ADD COLUMN IF NOT EXISTS preferred_unit_count INTEGER,
  ADD COLUMN IF NOT EXISTS apartment_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_company_id_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_apartment_id_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_apartment_id_fkey
      FOREIGN KEY (apartment_id) REFERENCES units(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Keep apartment_id synchronized with unit_id for legacy API field compatibility.
UPDATE users
SET apartment_id = unit_id
WHERE apartment_id IS NULL
  AND unit_id IS NOT NULL;

-- 4) Units include company_id used by /api/v1/Properties/[id]/units POST
ALTER TABLE units
  ADD COLUMN IF NOT EXISTS company_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'units_company_id_fkey'
  ) THEN
    ALTER TABLE units
      ADD CONSTRAINT units_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill unit company from its property when possible.
UPDATE units u
SET company_id = p.company_id
FROM properties p
WHERE p.id = u.property_id
  AND u.company_id IS NULL;

-- 5) Lease move-out fields used by remove-tenant and unit/property detail endpoints
ALTER TABLE leases
  ADD COLUMN IF NOT EXISTS leave_date DATE,
  ADD COLUMN IF NOT EXISTS forwarding_address TEXT,
  ADD COLUMN IF NOT EXISTS leave_reason TEXT,
  ADD COLUMN IF NOT EXISTS deposit_return_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS move_out_notes TEXT,
  ADD COLUMN IF NOT EXISTS company_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leases_company_id_fkey'
  ) THEN
    ALTER TABLE leases
      ADD CONSTRAINT leases_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill lease company from unit when possible.
UPDATE leases l
SET company_id = u.company_id
FROM units u
WHERE u.id = l.unit_id
  AND l.company_id IS NULL;

-- 6) Remaining domain tables often queried through withRLS pathways
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS company_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_company_id_fkey'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

UPDATE payments p
SET company_id = u.company_id
FROM units u
WHERE u.id = p.unit_id
  AND p.company_id IS NULL;

ALTER TABLE maintenance_requests
  ADD COLUMN IF NOT EXISTS company_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'maintenance_requests_company_id_fkey'
  ) THEN
    ALTER TABLE maintenance_requests
      ADD CONSTRAINT maintenance_requests_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

UPDATE maintenance_requests mr
SET company_id = u.company_id
FROM units u
WHERE u.id = mr.unit_id
  AND mr.company_id IS NULL;

ALTER TABLE activity_events
  ADD COLUMN IF NOT EXISTS company_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'activity_events_company_id_fkey'
  ) THEN
    ALTER TABLE activity_events
      ADD CONSTRAINT activity_events_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 7) Performance indexes for frequently filtered columns
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_properties_company_id ON properties(company_id);
CREATE INDEX IF NOT EXISTS idx_units_company_id ON units(company_id);
CREATE INDEX IF NOT EXISTS idx_leases_company_id_status ON leases(company_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_company_id_status_due ON payments(company_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_company_id_status ON maintenance_requests(company_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_company_id_occurred_at ON activity_events(company_id, occurred_at DESC);

-- 8) Ensure at least one company exists for environments starting from old schema
INSERT INTO companies (id, name)
SELECT gen_random_uuid(), 'Default Company'
WHERE NOT EXISTS (SELECT 1 FROM companies);

-- 9) Attach existing records to a default company where company_id is still null
WITH default_company AS (
  SELECT id FROM companies ORDER BY created_at ASC LIMIT 1
)
UPDATE users u
SET company_id = dc.id
FROM default_company dc
WHERE u.company_id IS NULL;

WITH default_company AS (
  SELECT id FROM companies ORDER BY created_at ASC LIMIT 1
)
UPDATE properties p
SET company_id = dc.id
FROM default_company dc
WHERE p.company_id IS NULL;

WITH default_company AS (
  SELECT id FROM companies ORDER BY created_at ASC LIMIT 1
)
UPDATE units u
SET company_id = COALESCE(u.company_id, p.company_id, dc.id)
FROM properties p, default_company dc
WHERE p.id = u.property_id
  AND u.company_id IS NULL;

WITH default_company AS (
  SELECT id FROM companies ORDER BY created_at ASC LIMIT 1
)
UPDATE leases l
SET company_id = COALESCE(l.company_id, u.company_id, dc.id)
FROM units u, default_company dc
WHERE u.id = l.unit_id
  AND l.company_id IS NULL;

WITH default_company AS (
  SELECT id FROM companies ORDER BY created_at ASC LIMIT 1
)
UPDATE payments p
SET company_id = COALESCE(p.company_id, u.company_id, dc.id)
FROM units u, default_company dc
WHERE p.unit_id = u.id
  AND p.company_id IS NULL;

WITH default_company AS (
  SELECT id FROM companies ORDER BY created_at ASC LIMIT 1
)
UPDATE maintenance_requests mr
SET company_id = COALESCE(mr.company_id, u.company_id, dc.id)
FROM units u, default_company dc
WHERE mr.unit_id = u.id
  AND mr.company_id IS NULL;

WITH default_company AS (
  SELECT id FROM companies ORDER BY created_at ASC LIMIT 1
)
UPDATE activity_events ae
SET company_id = dc.id
FROM default_company dc
WHERE ae.company_id IS NULL;
