# ADR-003: Transaction Pipeline with Lifecycle Tracking

**Status:** Accepted
**Date:** 2026-03-28
**Authors:** StellarGuard Team

## Context

StellarGuard submits Soroban transactions for treasury operations (deposits, withdrawals) and governance actions (proposal creation, voting). Each transaction passes through multiple stages: simulation, signing via Freighter, submission, and confirmation polling. Users need visibility into which stage is active and clear error reporting when a stage fails.

## Decision

Implement a transaction lifecycle model with the `useTxLifecycle` hook:

- **Step-based state machine:** Transactions progress through `idle -> simulating -> signing -> submitting -> polling -> success | error` states.
- **Freighter signing:** Transaction XDR is passed to `signTransaction` from `@stellar/freighter-api`. The signed XDR is then submitted to Soroban RPC.
- **Polling via sorobanClient:** After submission, `sorobanClient.pollTransaction` handles confirmation with configurable timeout and interval.
- **Error model:** Errors are classified by stage (`simulation_failed`, `user_rejected`, `submission_failed`, `timeout`) so the UI can display stage-specific guidance.
- **Toast integration:** `react-hot-toast` provides user feedback for success and failure states.

## Consequences

### Positive

- Users always know the current transaction stage
- Stage-specific errors enable targeted recovery guidance
- The lifecycle hook is reusable across all transaction types

### Negative

- The step model adds complexity compared to a simple submit-and-wait approach
- Polling timeout must be tuned per network (testnet vs mainnet block times)

### Neutral

- The error classification schema may need extension as new transaction types are added

## Alternatives Considered

- **Fire-and-forget submission:** Rejected because users need confirmation feedback, and Soroban transactions require polling for finality.
- **WebSocket subscription for confirmation:** Not available on Soroban RPC; polling is the only option.
