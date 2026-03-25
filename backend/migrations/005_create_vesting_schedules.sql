-- Migration: Create vesting_schedules table
-- Description: Stores token vesting schedules
-- Created: 2026-03-25

CREATE TABLE IF NOT EXISTS vesting_schedules (
    id SERIAL PRIMARY KEY,
    beneficiary TEXT NOT NULL, -- Beneficiary's Stellar address
    total_amount BIGINT NOT NULL, -- Total vesting amount in stroops
    claimed_amount BIGINT NOT NULL DEFAULT 0, -- Amount already claimed in stroops
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration BIGINT NOT NULL, -- Duration in seconds
    cliff BIGINT NOT NULL -- Cliff period in seconds
);

-- Indexes
CREATE INDEX idx_vesting_schedules_beneficiary ON vesting_schedules(beneficiary);
CREATE INDEX idx_vesting_schedules_start_time ON vesting_schedules(start_time);