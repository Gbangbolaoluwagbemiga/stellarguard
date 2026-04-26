import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const IS_PUBLIC_KEY = "isPublic";
/**
 * Guard that validates API key for protected endpoints.
 * Checks for API key in X-API-Key header or Authorization Bearer token.
 */
export declare class ApiKeyGuard implements CanActivate {
    private reflector;
    private readonly logger;
    private readonly validApiKeys;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private extractApiKey;
}
//# sourceMappingURL=api-key.guard.d.ts.map