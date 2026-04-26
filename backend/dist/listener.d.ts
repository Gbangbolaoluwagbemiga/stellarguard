/**
 * Main event listener loop.
 * Polls the Soroban RPC for contract events and stores them in the database.
 */
export declare function startListener(): Promise<void>;
/**
 * Request a graceful shutdown of the listener loop.
 */
export declare function stopListener(): void;
/**
 * Wait for in-flight events to complete, then resolve.
 */
export declare function waitForCompletion(): Promise<void>;
/**
 * Handle process signals for graceful shutdown.
 */
export declare function setupSignalHandlers(): void;
//# sourceMappingURL=listener.d.ts.map