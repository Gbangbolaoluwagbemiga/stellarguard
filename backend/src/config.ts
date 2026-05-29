import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

export interface Config {
  databaseUrl: string;
  redisUrl: string;
  sorobanRpcUrl: string;
  networkPassphrase: string;
  contractIds: string[];
  pollIntervalMs: number;
  /** Minimum poll interval when events are actively flowing (ms). Default 2 000. */
  minPollIntervalMs: number;
  /** Maximum poll interval during idle periods with no on-chain activity (ms). Default 30 000. */
  maxPollIntervalMs: number;
  /** Step multiplier applied to the interval after each empty poll. Default 1.5. */
  pollBackoffFactor: number;
  corsOrigin: string | string[];
  nodeEnv: string;
  dbPoolMax: number;
}

export function getContractIds(): string[] {
  const ids: string[] = [];
  const envKeys = [
    "TREASURY_CONTRACT_ID",
    "GOVERNANCE_CONTRACT_ID",
    "TOKEN_VAULT_CONTRACT_ID",
    "ACCESS_CONTROL_CONTRACT_ID",
  ];

  for (const key of envKeys) {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      ids.push(value.trim());
    }
  }

  return ids;
}

function parseCorsOrigin(nodeEnv: string): string | string[] {
  const rawOrigin = process.env.CORS_ORIGIN?.trim();
  if (!rawOrigin) {
    return nodeEnv === "production" ? "*" : "http://localhost:3000";
  }

  const origins = rawOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length <= 1) {
    return origins[0] || rawOrigin;
  }

  return origins;
}

function validateConfig(config: Config): void {
  const errors: string[] = [];

  // Critical environment variables that must be set
  if (!config.databaseUrl) {
    errors.push("DATABASE_URL is required");
  }

  if (!config.sorobanRpcUrl) {
    errors.push("SOROBAN_RPC_URL is required");
  }

  if (!config.networkPassphrase) {
    errors.push("NETWORK_PASSPHRASE is required");
  }

  // Validate numeric values
  if (isNaN(config.pollIntervalMs) || config.pollIntervalMs <= 0) {
    errors.push("POLL_INTERVAL_MS must be a positive number");
  }

  if (isNaN(config.dbPoolMax) || config.dbPoolMax <= 0) {
    errors.push("DB_POOL_MAX must be a positive number");
  }

  // Validate DATABASE_URL format
  if (config.databaseUrl && !config.databaseUrl.startsWith("postgresql://")) {
    errors.push("DATABASE_URL must be a valid PostgreSQL connection string");
  }

  // Validate Soroban RPC URL format
  if (config.sorobanRpcUrl && !config.sorobanRpcUrl.startsWith("http")) {
    errors.push("SOROBAN_RPC_URL must be a valid HTTP/HTTPS URL");
  }

  if (errors.length > 0) {
    console.error("\n❌ Configuration Validation Failed\n");
    console.error("The following required environment variables are missing or invalid:\n");
    errors.forEach((error) => console.error(`  - ${error}`));
    console.error("\nPlease set these environment variables before starting the server.");
    console.error("Refer to .env.example for the required configuration.\n");
    process.exit(1);
  }
}

export function loadConfig(): Config {
  const nodeEnv = process.env.NODE_ENV || "development";
  
  // Critical: No fallback for DATABASE_URL - must be explicitly set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("\n❌ Fatal Error: DATABASE_URL is not set\n");
    console.error("DATABASE_URL is a required environment variable.");
    console.error("Please set it in your .env file or environment.");
    console.error("Example: DATABASE_URL=postgresql://user:password@localhost:5432/stellarguard\n");
    console.error("Refer to .env.example for the required configuration.\n");
    process.exit(1);
  }

  const sorobanRpcUrl = process.env.SOROBAN_RPC_URL;
  if (!sorobanRpcUrl) {
    console.error("\n❌ Fatal Error: SOROBAN_RPC_URL is not set\n");
    console.error("SOROBAN_RPC_URL is a required environment variable.");
    console.error("Please set it in your .env file or environment.");
    console.error("Example: SOROBAN_RPC_URL=https://soroban-testnet.stellar.org\n");
    console.error("Refer to .env.example for the required configuration.\n");
    process.exit(1);
  }

  const networkPassphrase = process.env.NETWORK_PASSPHRASE;
  if (!networkPassphrase) {
    console.error("\n❌ Fatal Error: NETWORK_PASSPHRASE is not set\n");
    console.error("NETWORK_PASSPHRASE is a required environment variable.");
    console.error("Please set it in your .env file or environment.");
    console.error("Example: NETWORK_PASSPHRASE=Test SDF Network ; September 2015\n");
    console.error("Refer to .env.example for the required configuration.\n");
    process.exit(1);
  }

  const pollIntervalMs = parseInt(process.env.POLL_INTERVAL_MS || "5000", 10);
  const minPollIntervalMs = parseInt(process.env.MIN_POLL_INTERVAL_MS || "2000", 10);
  const maxPollIntervalMs = parseInt(process.env.MAX_POLL_INTERVAL_MS || "30000", 10);
  const pollBackoffFactor = parseFloat(process.env.POLL_BACKOFF_FACTOR || "1.5");
  const dbPoolMax = parseInt(process.env.DB_POOL_MAX || "10", 10);
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const contractIds = getContractIds();
  const corsOrigin = parseCorsOrigin(nodeEnv);

  if (contractIds.length === 0) {
    console.warn(
      "⚠️  Warning: No contract IDs configured. Set at least one of: " +
        "TREASURY_CONTRACT_ID, GOVERNANCE_CONTRACT_ID, TOKEN_VAULT_CONTRACT_ID, ACCESS_CONTROL_CONTRACT_ID"
    );
  }

  const wildcardCors =
    corsOrigin === "*" ||
    (Array.isArray(corsOrigin) && corsOrigin.includes("*"));
  if (nodeEnv === "production" && wildcardCors) {
    console.warn(
      "⚠️  Warning: CORS_ORIGIN resolves to '*' while NODE_ENV=production. Restrict CORS_ORIGIN before deploying."
    );
  }

  const config: Config = {
    databaseUrl,
    redisUrl,
    sorobanRpcUrl,
    networkPassphrase,
    contractIds,
    pollIntervalMs,
    minPollIntervalMs,
    maxPollIntervalMs,
    pollBackoffFactor,
    corsOrigin,
    nodeEnv,
    dbPoolMax,
  };

  // Validate configuration before returning
  validateConfig(config);

  console.log(`✅ Configuration loaded successfully (NODE_ENV=${nodeEnv})`);
  
  return config;
}

export const config = loadConfig();
