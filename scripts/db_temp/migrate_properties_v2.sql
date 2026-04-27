-- Migration: add new columns to the properties table
-- Run once against your database.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS total_units   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS zip           VARCHAR(20),
  ADD COLUMN IF NOT EXISTS property_type VARCHAR(60) NOT NULL DEFAULT 'Apartment',
  ADD COLUMN IF NOT EXISTS year_built    INTEGER,
  ADD COLUMN IF NOT EXISTS square_feet   INTEGER,
  ADD COLUMN IF NOT EXISTS amenities     JSONB NOT NULL DEFAULT '{}';
