"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.loadConfig = loadConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "..", ".env") });
function getContractIds() {
    const ids = [];
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
function parseCorsOrigin(nodeEnv) {
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
function loadConfig() {
    const nodeEnv = process.env.NODE_ENV || "development";
    const databaseUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/stellarguard";
    const sorobanRpcUrl = process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
    const networkPassphrase = process.env.NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
    const pollIntervalMs = parseInt(process.env.POLL_INTERVAL_MS || "5000", 10);
    const contractIds = getContractIds();
    const corsOrigin = parseCorsOrigin(nodeEnv);
    if (contractIds.length === 0) {
        console.warn("Warning: No contract IDs configured. Set at least one of: " +
            "TREASURY_CONTRACT_ID, GOVERNANCE_CONTRACT_ID, TOKEN_VAULT_CONTRACT_ID, ACCESS_CONTROL_CONTRACT_ID");
    }
    const wildcardCors = corsOrigin === "*" ||
        (Array.isArray(corsOrigin) && corsOrigin.includes("*"));
    if (nodeEnv === "production" && wildcardCors) {
        console.warn("Warning: CORS_ORIGIN resolves to '*' while NODE_ENV=production. Restrict CORS_ORIGIN before deploying.");
    }
    return {
        databaseUrl,
        sorobanRpcUrl,
        networkPassphrase,
        contractIds,
        pollIntervalMs,
        corsOrigin,
        nodeEnv,
    };
}
exports.config = loadConfig();
//# sourceMappingURL=config.js.map