-- Migration: Create token_locks table
-- Description: Stores token lock positions
-- Created: 2026-03-25

CREATE TABLE IF NOT EXISTS token_locks (
    id SERIAL PRIMARY KEY,
    owner TEXT NOT NULL, -- Owner's Stellar address
    amount BIGINT NOT NULL, -- Locked amount in stroops
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unlock_at TIMESTAMP WITH TIME ZONE NOT NULL,
    claimed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_token_locks_owner ON token_locks(owner);
CREATE INDEX idx_token_locks_unlock_at ON token_locks(unlock_at);
CREATE INDEX idx_token_locks_claimed ON token_locks(claimed);