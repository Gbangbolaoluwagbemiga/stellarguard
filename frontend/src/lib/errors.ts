/**
 * App-wide error taxonomy for wallet and RPC failures.
 *
 * Canonical error codes map Freighter, Soroban RPC, and validation
 * errors to a uniform shape so all hooks emit structured errors and
 * the UI can render consistent, actionable recovery guidance.
 */

// ============================================================================
// Error codes
// ============================================================================

export const ErrorCode = {
  // Wallet (Freighter)
  WALLET_NOT_INSTALLED: "WALLET_NOT_INSTALLED",
  WALLET_NOT_CONNECTED: "WALLET_NOT_CONNECTED",
  WALLET_ACCESS_DENIED: "WALLET_ACCESS_DENIED",
  WALLET_SIGN_REJECTED: "WALLET_SIGN_REJECTED",
  WALLET_NETWORK_MISMATCH: "WALLET_NETWORK_MISMATCH",

  // Soroban RPC
  RPC_SIMULATION_FAILED: "RPC_SIMULATION_FAILED",
  RPC_SUBMISSION_FAILED: "RPC_SUBMISSION_FAILED",
  RPC_TIMEOUT: "RPC_TIMEOUT",
  RPC_NOT_FOUND: "RPC_NOT_FOUND",

  // Contract
  CONTRACT_EXECUTION_FAILED: "CONTRACT_EXECUTION_FAILED",
  CONTRACT_UNAUTHORIZED: "CONTRACT_UNAUTHORIZED",

  // Input validation
  VALIDATION_INVALID_ADDRESS: "VALIDATION_INVALID_ADDRESS",
  VALIDATION_INVALID_AMOUNT: "VALIDATION_INVALID_AMOUNT",
  VALIDATION_REQUIRED_FIELD: "VALIDATION_REQUIRED_FIELD",

  // Generic
  UNKNOWN: "UNKNOWN",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ============================================================================
// AppError shape
// ============================================================================

export interface AppError {
  /** Canonical code for programmatic handling and analytics. */
  code: ErrorCode;
  /** Human-readable message suitable for display in the UI. */
  message: string;
  /** Whether the user can meaningfully retry the failed action. */
  recoverable: boolean;
  /** Raw detail from the underlying error, for debugging only. */
  detail?: string;
}

// ============================================================================
// Classification helpers
// ============================================================================

function matchesAny(msg: string, patterns: readonly string[]): boolean {
  const lower = msg.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

function rawDetail(err: unknown): string | undefined {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return undefined;
}

// ============================================================================
// classifyError
// ============================================================================

/**
 * Classify any thrown value into a structured {@link AppError}.
 *
 * Precedence:
 *  1. Already-classified AppError → pass through unchanged
 *  2. Known Freighter message patterns (not-installed, denied, network)
 *  3. Known Soroban / RPC patterns (timeout, simulation, submission)
 *  4. Contract error patterns (unauthorized, execution failure)
 *  5. Validation patterns (address, amount)
 *  6. Generic Error → UNKNOWN with original message
 */
export function classifyError(err: unknown): AppError {
  if (isAppError(err)) return err;

  const msg = err instanceof Error ? err.message : String(err ?? "");

  // --- Wallet: not installed ---
  if (matchesAny(msg, ["not installed", "freighter is not installed"])) {
    return {
      code: ErrorCode.WALLET_NOT_INSTALLED,
      message: "Freighter wallet is not installed. Install the extension to continue.",
      recoverable: false,
      detail: rawDetail(err),
    };
  }

  // --- Wallet: not connected ---
  if (matchesAny(msg, ["wallet not connected", "not connected"])) {
    return {
      code: ErrorCode.WALLET_NOT_CONNECTED,
      message: "Connect your wallet to perform this action.",
      recoverable: true,
      detail: rawDetail(err),
    };
  }

  // --- Wallet: user rejected sign or access request ---
  if (
    matchesAny(msg, [
      "user declined",
      "user rejected",
      "user denied",
      "denied",
      "rejected",
      "cancel",
    ])
  ) {
    return {
      code: ErrorCode.WALLET_SIGN_REJECTED,
      message: "Transaction was rejected. You can try again when ready.",
      recoverable: true,
      detail: rawDetail(err),
    };
  }

  // --- Wallet: wrong network ---
  if (matchesAny(msg, ["network", "passphrase", "mismatch"])) {
    return {
      code: ErrorCode.WALLET_NETWORK_MISMATCH,
      message:
        "Your wallet is on a different network. Switch to the correct network and retry.",
      recoverable: true,
      detail: rawDetail(err),
    };
  }

  // --- RPC: timeout ---
  if (matchesAny(msg, ["timeout", "timed out", "time out"])) {
    return {
      code: ErrorCode.RPC_TIMEOUT,
      message: "The request timed out. The network may be congested — please retry.",
      recoverable: true,
      detail: rawDetail(err),
    };
  }

  // --- RPC: simulation failure ---
  if (matchesAny(msg, ["simulation", "simulate", "invoke_contract", "preflight"])) {
    return {
      code: ErrorCode.RPC_SIMULATION_FAILED,
      message: "Transaction simulation failed. Check your inputs and try again.",
      recoverable: true,
      detail: rawDetail(err),
    };
  }

  // --- RPC: submission failure ---
  if (matchesAny(msg, ["submit", "broadcast", "send_transaction"])) {
    return {
      code: ErrorCode.RPC_SUBMISSION_FAILED,
      message: "Failed to submit the transaction. Please retry.",
      recoverable: true,
      detail: rawDetail(err),
    };
  }

  // --- Contract: unauthorized ---
  if (matchesAny(msg, ["unauthorized", "not authorized", "permission denied"])) {
    return {
      code: ErrorCode.CONTRACT_UNAUTHORIZED,
      message: "You are not authorized to perform this action.",
      recoverable: false,
      detail: rawDetail(err),
    };
  }

  // --- Contract: general execution failure ---
  if (matchesAny(msg, ["contract", "soroban", "ledger", "execution failed"])) {
    return {
      code: ErrorCode.CONTRACT_EXECUTION_FAILED,
      message: "The contract operation failed. Check the details and retry.",
      recoverable: true,
      detail: rawDetail(err),
    };
  }

  // --- Validation: invalid address ---
  if (matchesAny(msg, ["invalid address", "address is invalid", "strkey"])) {
    return {
      code: ErrorCode.VALIDATION_INVALID_ADDRESS,
      message: "The provided address is invalid. Check it and try again.",
      recoverable: true,
      detail: rawDetail(err),
    };
  }

  // --- Validation: invalid amount ---
  if (matchesAny(msg, ["invalid amount", "amount must", "amount cannot"])) {
    return {
      code: ErrorCode.VALIDATION_INVALID_AMOUNT,
      message: "The provided amount is invalid.",
      recoverable: true,
      detail: rawDetail(err),
    };
  }

  // --- Generic fallthrough ---
  return {
    code: ErrorCode.UNKNOWN,
    message: msg || "An unexpected error occurred. Please try again.",
    recoverable: true,
    detail: rawDetail(err),
  };
}

// ============================================================================
// Type guard
// ============================================================================

export function isAppError(err: unknown): err is AppError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    "message" in err &&
    "recoverable" in err
  );
}

// ============================================================================
// UI labels
// ============================================================================

/** Short human-readable label per error code, for headings / toasts. */
export const ERROR_CODE_LABELS: Record<ErrorCode, string> = {
  [ErrorCode.WALLET_NOT_INSTALLED]: "Wallet Not Installed",
  [ErrorCode.WALLET_NOT_CONNECTED]: "Wallet Not Connected",
  [ErrorCode.WALLET_ACCESS_DENIED]: "Access Denied",
  [ErrorCode.WALLET_SIGN_REJECTED]: "Signature Rejected",
  [ErrorCode.WALLET_NETWORK_MISMATCH]: "Network Mismatch",
  [ErrorCode.RPC_SIMULATION_FAILED]: "Simulation Failed",
  [ErrorCode.RPC_SUBMISSION_FAILED]: "Submission Failed",
  [ErrorCode.RPC_TIMEOUT]: "Request Timed Out",
  [ErrorCode.RPC_NOT_FOUND]: "Not Found",
  [ErrorCode.CONTRACT_EXECUTION_FAILED]: "Contract Error",
  [ErrorCode.CONTRACT_UNAUTHORIZED]: "Unauthorized",
  [ErrorCode.VALIDATION_INVALID_ADDRESS]: "Invalid Address",
  [ErrorCode.VALIDATION_INVALID_AMOUNT]: "Invalid Amount",
  [ErrorCode.VALIDATION_REQUIRED_FIELD]: "Required Field Missing",
  [ErrorCode.UNKNOWN]: "Unexpected Error",
};
