-- Migration: Create transactions table
-- Description: Stores treasury transactions requiring approvals
-- Created: 2026-03-25

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    treasury_id INTEGER NOT NULL REFERENCES treasuries(id) ON DELETE CASCADE,
    to_address TEXT NOT NULL, -- Destination Stellar address
    amount BIGINT NOT NULL, -- Amount in stroops
    memo TEXT, -- Optional memo
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executed', 'rejected')),
    approvals_json JSONB DEFAULT '[]'::jsonb, -- Array of approver addresses
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_transactions_treasury_id ON transactions(treasury_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);