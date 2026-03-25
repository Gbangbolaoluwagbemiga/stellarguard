-- Migration: Create proposals table
-- Description: Stores governance proposals
-- Created: 2026-03-25

CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    action JSONB NOT NULL, -- Proposal action details (e.g., {"type": "transfer", "to": "...", "amount": 10000000})
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'passed', 'failed', 'executed')),
    proposer TEXT NOT NULL, -- Proposer's Stellar address
    votes_for BIGINT NOT NULL DEFAULT 0,
    votes_against BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_proposer ON proposals(proposer);
CREATE INDEX idx_proposals_created_at ON proposals(created_at);
CREATE INDEX idx_proposals_ends_at ON proposals(ends_at);