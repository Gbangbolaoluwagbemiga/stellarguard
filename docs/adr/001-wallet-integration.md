# ADR-001: Wallet Integration via Freighter Provider

**Status:** Accepted
**Date:** 2026-03-28
**Authors:** StellarGuard Team

## Context

StellarGuard needs a reliable way to connect to user wallets for signing transactions on the Stellar network. The wallet integration must handle connection state, network detection, and disconnection across the entire application.

## Decision

Use the Freighter browser extension as the primary wallet provider, wrapped in a React context (`FreighterProvider`) that exposes wallet state via the `useFreighter` hook.

Key design choices:
- Single context provider at the root layout level
- All wallet access goes through `useFreighter` hook (re-exported from `@/hooks/useFreighter`)
- Direct imports from `@/context/FreighterProvider` are discouraged to maintain a stable API boundary
- Connection state is checked on mount and updated reactively

## Consequences

### Positive

- Consistent wallet state across all pages and components
- Single point of change if we need to swap wallet providers
- Clean separation between wallet state management and UI components

### Negative

- Tightly coupled to the Freighter extension API
- No multi-wallet support without refactoring the provider

### Neutral

- Components must be wrapped in `FreighterProvider` to access wallet state

## Alternatives Considered

- **Direct Freighter API calls in components:** Rejected because it leads to duplicated connection logic and inconsistent state.
- **Zustand store for wallet state:** Viable but adds a dependency; React context is sufficient for this use case since wallet state changes infrequently.
