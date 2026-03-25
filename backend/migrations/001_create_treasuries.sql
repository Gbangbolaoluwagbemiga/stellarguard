-- Migration: Create treasuries table
-- Description: Stores treasury configurations and balances
-- Created: 2026-03-25

CREATE TABLE IF NOT EXISTS treasuries (
    id SERIAL PRIMARY KEY,
    admin TEXT NOT NULL, -- Stellar address of the admin
    threshold BIGINT NOT NULL, -- Approval threshold in stroops
    balance BIGINT NOT NULL DEFAULT 0, -- Current balance in stroops
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_treasuries_admin ON treasuries(admin);
CREATE INDEX idx_treasuries_created_at ON treasuries(created_at);