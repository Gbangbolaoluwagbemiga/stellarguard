# StellarGuard — Frontend Developer Guide

> A guide to understanding, developing, and extending the StellarGuard Next.js dashboard.

## Table of Contents
1. [Architecture](#architecture)
2. [Project Structure](#project-structure)
3. [Setup](#setup)
4. [Key Concepts](#key-concepts)
5. [Wallet Integration](#wallet-integration)
6. [Contract Interaction Pattern](#contract-interaction-pattern)
7. [Components](#components)
8. [Adding Features](#adding-features)
9. [Architecture Decision Records](#architecture-decision-records)

## Architecture Decision Records

Major frontend design decisions are documented as ADRs in [`docs/adr/`](./adr/):

| ADR | Title | Status |
|-----|-------|--------|
| [000](./adr/000-template.md) | ADR Template | - |
| [001](./adr/001-wallet-integration.md) | Wallet Integration via Freighter Provider | Accepted |
| [002](./adr/002-data-loading.md) | Data Loading via Custom Hooks with Request Guards | Accepted |
| [003](./adr/003-transaction-pipeline.md) | Transaction Pipeline with Lifecycle Tracking | Accepted |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Next.js App (Frontend)              │
├──────────────┬──────────────┬───────────────────┤
│    Pages     │  Components  │     Hooks         │
│              │              │                   │
│ /            │ WalletConnect│ useFreighter      │
│ /treasury    │ TreasuryCard │ useTreasury       │
│ /governance  │ ProposalCard │ useGovernance     │
│ /proposals/* │ VoteButton   │                   │
├──────────────┴──────────────┴───────────────────┤
│                    Lib Layer                     │
│  soroban.ts (XDR building) │ network.ts (RPC)  │
├─────────────────────────────┴───────────────────┤
│              Context (FreighterProvider)          │
├──────────────────────────────────────────────────┤
│         Stellar / Soroban / Freighter APIs        │
└──────────────────────────────────────────────────┘
```

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css         # Global styles + Tailwind
│   │   ├── layout.tsx          # Root layout with navbar
│   │   ├── page.tsx            # Dashboard home
│   │   ├── treasury/
│   │   │   └── page.tsx        # Treasury management
│   │   ├── governance/
│   │   │   └── page.tsx        # Proposal listing
│   │   └── proposals/
│   │       └── [id]/
│   │           └── page.tsx    # Proposal detail + voting
│   ├── components/             # Reusable UI components
│   │   ├── WalletConnect.tsx   # Smart wallet button
│   │   ├── TreasuryCard.tsx    # Transaction display card
│   │   ├── ProposalCard.tsx    # Proposal display card
│   │   └── VoteButton.tsx      # Vote casting button
│   ├── context/
│   │   └── FreighterProvider.tsx  # Wallet state context
│   ├── hooks/
│   │   ├── useFreighter.ts     # Re-export of wallet hook
│   │   ├── useTreasury.ts      # Treasury data hook
│   │   └── useGovernance.ts    # Governance data hook
│   └── lib/
│       ├── soroban.ts          # Contract interaction helpers
│       └── network.ts          # Network configuration
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── postcss.config.js
```

---

## Setup

### Prerequisites
- Node.js 20+
- npm or yarn
- [Freighter Wallet](https://www.freighter.app/) browser extension

### Install & Run
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Frontend Reliability Notes
- Use `src/lib/stellarAddress.ts` for all client-side Stellar address checks instead of duplicating prefix/length logic in components.
- Layout fonts are loaded through `next/font/google` with `display: "swap"` to avoid the blocking Google Fonts stylesheet path.
- Brand imagery in the app shell should go through `next/image` so width, height, and modern image formats are declared at the layout boundary.

### Environment Variables & Deployment Matrix

All frontend environment variables are `NEXT_PUBLIC_*` (exposed to browser) and configured per deployment stage. Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_TREASURY_CONTRACT_ID=<deployed-contract-id>
NEXT_PUBLIC_GOVERNANCE_CONTRACT_ID=<deployed-contract-id>
NEXT_PUBLIC_VAULT_CONTRACT_ID=<deployed-contract-id>
NEXT_PUBLIC_ACL_CONTRACT_ID=<deployed-contract-id>
```

#### Environment Matrix by Deployment Stage

| Variable | **Dev** | **Staging** | **Production** |
|----------|---------|------------|----------------|
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | `https://soroban-testnet.stellar.org` | `https://soroban-testnet.stellar.org` | `https://mainnet.sorobanrpc.com` |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | `"Test SDF Network ; September 2015"` | `"Test SDF Network ; September 2015"` | `"Public Global Stellar Network ; September 2015"` |
| `NEXT_PUBLIC_TREASURY_CONTRACT_ID` | Local testnet contract | Staging testnet contract | Mainnet contract (live funds) |
| `NEXT_PUBLIC_GOVERNANCE_CONTRACT_ID` | Local testnet contract | Staging testnet contract | Mainnet contract |
| `NEXT_PUBLIC_VAULT_CONTRACT_ID` | Local testnet contract | Staging testnet contract | Mainnet contract |
| `NEXT_PUBLIC_ACL_CONTRACT_ID` | Local testnet contract | Staging testnet contract | Mainnet contract |
| **Freighter Network** | Switch to **Testnet** | Switch to **Testnet** | Switch to **Public** |
| **Purpose** | Local feature development & testing | Integration testing before release | Live production (real XLM) |

#### Configuration Notes
- **Dev (`localhost:3000`):** Testnet RPC and any deployed testnet contracts. Freighter must be set to Testnet in settings.
- **Staging:** Separate testnet contracts from Dev; used for pre-release testing with realistic data.
- **Production:** Mainnet RPC and mainnet contracts. **Real XLM is at risk.** All contract IDs must reference audited, mainnet-deployed contracts.

#### Validating Your Configuration
The app throws a clear error on startup if any `NEXT_PUBLIC_*_CONTRACT_ID` is missing:
```
Error: Missing required contract ID: NEXT_PUBLIC_TREASURY_CONTRACT_ID
```

This prevents accidental deployments with placeholder values. Contract ID validation occurs in `src/lib/soroban.ts`.

---

## Key Concepts

### Design System
The frontend uses a dark-mode-first design with these custom classes:
- `.btn-primary` — Blue gradient button with shadow
- `.btn-secondary` — Dark card-style button with border
- `.card` — Dark card with border and shadow
- `.gradient-text` — Blue-to-purple gradient text

Brand colors are defined in `tailwind.config.ts` under `stellar.*` and `primary.*`.

### State Management
- **Wallet state**: React Context via `FreighterProvider`
- **Contract data**: Custom hooks (`useTreasury`, `useGovernance`)
- **UI state**: Local component state

---

## Wallet Integration

### How It Works
1. **FreighterProvider** wraps the entire app
2. On mount, it checks if Freighter extension is installed
3. User clicks "Connect Wallet" → calls `requestAccess()` from Freighter API
4. Connected address and network are stored in Context
5. All child components access wallet state via `useFreighter()` hook

### Usage
```tsx
import { useFreighter } from "@/hooks/useFreighter";

function MyComponent() {
  const { address, isConnected, connect } = useFreighter();

  if (!isConnected) {
    return <button onClick={connect}>Connect Wallet</button>;
  }

  return <p>Connected: {address}</p>;
}
```

---

## Contract Interaction Pattern

Every contract interaction follows this pattern:

```
1. Build → 2. Simulate → 3. Sign → 4. Submit → 5. Confirm
```

### Example: Approve a Treasury Transaction
```tsx
import { buildContractCall, signAndSubmit } from "@/lib/soroban";
import { CONTRACT_IDS } from "@/lib/soroban";

async function approveTx(signerAddress: string, txId: number) {
  // 1. Build the transaction
  const tx = await buildContractCall(
    CONTRACT_IDS.treasury,
    "approve",
    [signerAddress, txId],  // Contract arguments
    signerAddress            // Source account
  );

  // 2-4. Sign with Freighter and submit to network
  const result = await signAndSubmit(tx);

  // 5. Handle result
  console.log("Approved!", result);
}
```

### Read-Only Queries
```tsx
import { readContractValue, CONTRACT_IDS } from "@/lib/soroban";

async function getBalance() {
  const balance = await readContractValue(
    CONTRACT_IDS.treasury,
    "get_balance"
  );
  return Number(balance) / 10_000_000; // Convert stroops to XLM
}
```

### Real Wallet Connection Flow
```tsx
import { useFreighter } from "@/hooks/useFreighter";
import { useCallback } from "react";

export function TreasuryApprovalFlow({ txId }: { txId: number }) {
  const { address, isConnected, connect, isConnecting } = useFreighter();

  const handleApprove = useCallback(async () => {
    if (!address) {
      alert("Connect your wallet first");
      return;
    }

    try {
      const tx = await buildContractCall(
        CONTRACT_IDS.treasury,
        "approve",
        [address, txId],
        address
      );

      const result = await signAndSubmit(tx);
      console.log("Transaction approved:", result);
      // Update local state or refetch data
    } catch (error) {
      if (error.message.includes("User rejected")) {
        console.log("User cancelled signature");
      } else if (error.message.includes("Freighter")) {
        console.log("Freighter error:", error.message);
      } else {
        console.error("Unexpected error:", error);
      }
    }
  }, [address, txId]);

  return (
    <>
      {!isConnected ? (
        <button onClick={connect} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect Wallet to Approve"}
        </button>
      ) : (
        <>
          <p>Connected: {address}</p>
          <button onClick={handleApprove}>Approve Transaction</button>
        </>
      )}
    </>
  );
}
```

### Testing Wallet Interactions Locally
1. Install [Freighter](https://www.freighter.app/) extension in your browser
2. Create a testnet account at [StellarExpert](https://stellar.expert/testnet)
3. Set `NEXT_PUBLIC_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"` in `.env.local`
4. In the Freighter settings, switch to **Testnet** network
5. Create a new testnet account or import an existing one
6. Open the app at `http://localhost:3000` and test the "Connect Wallet" flow
7. Use Freighter's DevTools option to inspect transaction details before signing

---

## Components

### WalletConnect
Smart button handling 4 states: Not Installed, Disconnected, Connecting, Connected.

### TreasuryCard
Displays a treasury transaction with approval progress and action button. Props: `txId`, `to`, `amount`, `memo`, `approvals`, `threshold`, `executed`.

### ProposalCard
Links to proposal detail page. Shows status badge, vote progress bar, and proposer. Props: `id`, `title`, `description`, `status`, `votesFor`, `votesAgainst`, `totalMembers`, `proposer`.

### VoteButton
Handles vote casting with disabled states. Props: `proposalId`, `voteFor`, `hasVoted`, `votingClosed`, `onVote`.

---

## Troubleshooting Freighter Issues

### Freighter Extension Not Appearing
**Symptom:** "Install Freighter" button stays visible even after installing the extension.

**Solutions:**
1. Refresh the page after installing Freighter
2. Check that the extension is enabled in your browser (Chrome: Settings → Extensions → Freighter toggle)
3. If using an incognito/private window, Freighter may be disabled; add the extension to incognito mode
4. Try a hard refresh (`Ctrl+Shift+R` on Windows/Linux, `Cmd+Shift+R` on Mac)

### Permission Denied When Signing Transactions
**Symptom:** User clicks "Approve" but gets "User rejected" or "Permission denied" error.

**Solutions:**
1. Ensure Freighter is unlocked (click the extension icon and enter your password)
2. Verify the network in Freighter matches the app (should both be on Testnet for dev)
3. Check that the connected account is the one you intended to sign with
4. Some contract calls require specific signer permissions; verify in the smart contract code

### "Freighter is not defined" or "window.stellar undefined"
**Symptom:** App crashes with reference error to Freighter.

**Solutions:**
1. Check browser console for errors — Freighter may not have initialized
2. Ensure Freighter is installed and the tab has access to it
3. Wait for the app to load completely before testing interactions
4. Try disabling other Stellar/crypto extensions that may conflict

### Network Mismatch Between App and Freighter
**Symptom:** Transactions fail with "Network mismatch" or "Invalid account sequence".

**Solutions:**
1. Verify `NEXT_PUBLIC_NETWORK_PASSPHRASE` in `.env.local` matches the Freighter network:
   - **Testnet:** `"Test SDF Network ; September 2015"`
   - **Public:** `"Public Global Stellar Network ; September 2015"`
2. In Freighter settings, switch to the same network as your `.env` configuration
3. Restart the dev server after changing `.env` files

### Freighter UI Not Responsive or Hanging
**Symptom:** Freighter popup freezes or takes >10 seconds to respond to signature requests.

**Solutions:**
1. Clear Freighter's local cache: Open Freighter → Settings → Clear Cache
2. Restart your browser
3. Reinstall the Freighter extension
4. Check system resources; low memory can cause UI lag

---

## Adding Features

### Adding a New Page
1. Create a new directory under `src/app/`
2. Add `page.tsx` with a default export
3. Add navigation link in `layout.tsx`

### Adding a New Component
1. Create file in `src/components/`
2. Define props interface
3. Export named component
4. Add TODO comments referencing issue numbers

### Adding a New Hook
1. Create file in `src/hooks/`
2. Import helpers from `src/lib/soroban.ts`
3. Return typed functions and state
4. Handle loading and error states
