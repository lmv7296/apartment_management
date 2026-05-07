-- Full bootstrap schema for a brand-new PostgreSQL database
-- Covers the tables and columns currently required by the app APIs.
-- Run with:
--   psql "$DATABASE_URL" -f scripts/db_temp/bootstrap_full_schema.sql
-- Optional seed after bootstrap:
--   psql "$DATABASE_URL" -f scripts/db_temp/seed.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(120),
  state VARCHAR(120),
  zip VARCHAR(20),
  property_type VARCHAR(60) NOT NULL DEFAULT 'Apartment',
  total_units INTEGER NOT NULL DEFAULT 0,
  year_built INTEGER,
  square_feet INTEGER,
  amenities JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  unit_code VARCHAR(50) NOT NULL,
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  square_feet INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, unit_code)
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(30),
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  apartment_id UUID REFERENCES units(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'tenant',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  preferred_currency VARCHAR(10),
  preferred_language VARCHAR(10),
  preferred_unit_prefix VARCHAR(20),
  preferred_unit_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  password_hash TEXT
);

CREATE TABLE IF NOT EXISTS leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_date DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  monthly_rent NUMERIC(12, 2) NOT NULL,
  forwarding_address TEXT,
  leave_reason TEXT,
  deposit_return_amount NUMERIC(12, 2),
  move_out_notes TEXT
);

CREATE TABLE IF NOT EXISTS listings (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  type VARCHAR(20) NOT NULL,
  image TEXT,
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  square_feet INTEGER,
  features TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  detail TEXT,
  status VARCHAR(30) NOT NULL,
  priority VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'low',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_properties_company_id ON properties(company_id);
CREATE INDEX IF NOT EXISTS idx_units_company_id ON units(company_id);
CREATE INDEX IF NOT EXISTS idx_leases_company_id_status ON leases(company_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_status_due_date ON payments(status, due_date);
CREATE INDEX IF NOT EXISTS idx_payments_company_id_status_due ON payments(company_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_company_id_status ON maintenance_requests(company_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_occurred_at ON activity_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_company_id_occurred_at ON activity_events(company_id, occurred_at DESC);

-- Ensure there is at least one company for fresh environments.
INSERT INTO companies (id, name)
SELECT gen_random_uuid(), 'Default Company'
WHERE NOT EXISTS (SELECT 1 FROM companies);
