# ADR-002: Data Loading via Custom Hooks with Request Guards

**Status:** Accepted
**Date:** 2026-03-28
**Authors:** StellarGuard Team

## Context

StellarGuard fetches on-chain data from Soroban RPC for treasury balances, governance proposals, and voting state. These requests can be slow, may fail, and must handle concurrent navigation (stale closures, race conditions).

## Decision

Use custom React hooks (`useTreasury`, `useGovernance`) that encapsulate data fetching with the following patterns:

- **AbortController/request guards:** Every fetch is wrapped with `throwIfAborted` from `@/lib/requestGuard` to prevent stale responses from overwriting current state.
- **Soroban client abstraction:** All RPC calls go through `@/lib/sorobanClient` which provides a single, configurable polling strategy.
- **Loading/error/data triad:** Every hook returns `{ data, loading, error }` to enable consistent skeleton and error states in the UI.
- **No global cache layer (yet):** Data is fetched per-component lifecycle. If caching becomes necessary, React Query can be introduced without changing the hook API.

## Consequences

### Positive

- Race conditions are handled at the fetch level, not in UI components
- Consistent error and loading patterns across all data-dependent pages
- Easy to test hooks in isolation

### Negative

- No cross-component cache: navigating away and back re-fetches data
- Manual retry logic must be implemented per-hook if needed

### Neutral

- Future migration to React Query would preserve the existing hook interface

## Alternatives Considered

- **React Query from the start:** Rejected to keep dependencies minimal during the prototype phase. The hook API is designed to be compatible with a future migration.
- **SWR:** Similar trade-offs to React Query; deferred for the same reason.
