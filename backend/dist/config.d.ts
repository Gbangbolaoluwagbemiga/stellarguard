export interface Config {
    databaseUrl: string;
    sorobanRpcUrl: string;
    networkPassphrase: string;
    contractIds: string[];
    pollIntervalMs: number;
    corsOrigin: string | string[];
    nodeEnv: string;
}
export declare function loadConfig(): Config;
export declare const config: Config;
//# sourceMappingURL=config.d.ts.map