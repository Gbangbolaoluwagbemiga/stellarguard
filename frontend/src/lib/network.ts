/**
 * Network configuration for StellarGuard.
 */

import { SorobanRpc } from "@stellar/stellar-sdk";

// ============================================================================
// Network Constants
// ============================================================================

export const NETWORKS = {
  testnet: {
    name: "Testnet",
    networkPassphrase: "Test SDF Network ; September 2015",
    sorobanRpcUrl: "https://soroban-testnet.stellar.org",
    horizonUrl: "https://horizon-testnet.stellar.org",
    friendbotUrl: "https://friendbot.stellar.org",
  },
  futurenet: {
    name: "Futurenet",
    networkPassphrase: "Test SDF Future Network ; October 2022",
    sorobanRpcUrl: "https://rpc-futurenet.stellar.org",
    horizonUrl: "https://horizon-futurenet.stellar.org",
    friendbotUrl: "https://friendbot-futurenet.stellar.org",
  },
  mainnet: {
    name: "Mainnet",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    sorobanRpcUrl: "https://soroban-rpc.mainnet.stellar.gateway.fm",
    horizonUrl: "https://horizon.stellar.org",
    friendbotUrl: null,
  },
} as const;

// ============================================================================
// Active Network
// ============================================================================

function resolveActiveNetwork(): (typeof NETWORKS)[keyof typeof NETWORKS] {
  const key = (
    process.env.NEXT_PUBLIC_NETWORK ?? "testnet"
  ).toLowerCase() as keyof typeof NETWORKS;
  return key in NETWORKS ? NETWORKS[key] : NETWORKS.testnet;
}

/** The currently active network, resolved from NEXT_PUBLIC_NETWORK (defaults to testnet). */
export const ACTIVE_NETWORK = resolveActiveNetwork();

/** Soroban RPC URL — overridable via NEXT_PUBLIC_SOROBAN_RPC_URL. */
export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? ACTIVE_NETWORK.sorobanRpcUrl;

/** Horizon API URL — overridable via NEXT_PUBLIC_HORIZON_URL. */
export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ?? ACTIVE_NETWORK.horizonUrl;

/** Network passphrase for the active network. */
export const NETWORK_PASSPHRASE = ACTIVE_NETWORK.networkPassphrase;
export const ACTIVE_NETWORK_KEY = Object.entries(NETWORKS).find(
  ([, network]) => network.networkPassphrase === NETWORK_PASSPHRASE,
)?.[0] as keyof typeof NETWORKS | undefined;

/**
 * Transaction time-bound in seconds. Configurable via NEXT_PUBLIC_TX_TIMEOUT.
 * Defaults to 300 s on mainnet (slow wallets need more time) and 30 s elsewhere.
 */
export const TX_TIMEOUT =
  Number(process.env.NEXT_PUBLIC_TX_TIMEOUT) ||
  (ACTIVE_NETWORK_KEY === "mainnet" ? 300 : 30);

// ============================================================================
// Helpers
// ============================================================================

let _serverInstance: SorobanRpc.Server | null = null;

/** Returns the shared Soroban RPC server singleton. Prefer sorobanClient in new code. */
export function getServer(): SorobanRpc.Server {
  if (!_serverInstance) {
    _serverInstance = new SorobanRpc.Server(SOROBAN_RPC_URL);
  }
  return _serverInstance;
}

/**
 * Fund an account on testnet/futurenet using Friendbot.
 */
export async function fundAccount(address: string): Promise<boolean> {
  const friendbotUrl = ACTIVE_NETWORK.friendbotUrl;
  if (!friendbotUrl) {
    throw new Error("Friendbot not available on mainnet");
  }

  try {
    const response = await fetch(`${friendbotUrl}?addr=${address}`);
    return response.ok;
  } catch (err) {
    console.error("Failed to fund account:", err);
    return false;
  }
}

export function normalizeWalletNetwork(
  value: string,
): "testnet" | "futurenet" | "mainnet" | null {
  const normalized = value.trim().toLowerCase();

  if (
    normalized.includes("testnet") ||
    normalized.includes("test sdf network ; september 2015")
  ) {
    return "testnet";
  }

  if (
    normalized.includes("futurenet") ||
    normalized.includes("future network ; october 2022")
  ) {
    return "futurenet";
  }

  if (
    normalized.includes("mainnet") ||
    normalized.includes("public") ||
    normalized.includes("public global stellar network ; september 2015")
  ) {
    return "mainnet";
  }

  return null;
}

export function getWalletNetworkLabel(walletNetwork: string | null): string {
  if (!walletNetwork) {
    return "unknown";
  }

  const normalized = normalizeWalletNetwork(walletNetwork);
  if (normalized) {
    return NETWORKS[normalized].name;
  }

  return walletNetwork;
}

export function isWalletNetworkMismatch(walletNetwork: string | null): boolean {
  if (!walletNetwork || !ACTIVE_NETWORK_KEY) {
    return false;
  }

  const walletNetworkKey = normalizeWalletNetwork(walletNetwork);
  if (!walletNetworkKey) {
    return false;
  }

  return walletNetworkKey !== ACTIVE_NETWORK_KEY;
}
