import { TreasuryService } from './treasury.service';
export declare class TreasuryController {
    private readonly treasuryService;
    constructor(treasuryService: TreasuryService);
    getBalance(): Promise<{
        balance: string;
    }>;
    getConfig(): Promise<{
        admin: string;
        threshold: number;
        signer_count: number;
        balance: string;
        tx_count: number;
    }>;
    getTransactions(page?: string, limit?: string): Promise<{
        cursor: string | null;
        timestamp: number | null;
        id: number;
        contract_id: string;
        topic_1: string | null;
        topic_2: string | null;
        event_name: string | null;
        ledger: number;
        created_at: string;
        event_topics?: any;
        event_data?: any;
    }[]>;
    getTransaction(id: string): Promise<{
        cursor: string | null;
        timestamp: number | null;
        id: number;
        contract_id: string;
        topic_1: string | null;
        topic_2: string | null;
        event_name: string | null;
        ledger: number;
        created_at: string;
        event_topics?: any;
        event_data?: any;
    }>;
    getSigners(): Promise<{
        signers: string[];
    }>;
}
//# sourceMappingURL=treasury.controller.d.ts.map