"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ApiKeyGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyGuard = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
exports.IS_PUBLIC_KEY = 'isPublic';
/**
 * Guard that validates API key for protected endpoints.
 * Checks for API key in X-API-Key header or Authorization Bearer token.
 */
let ApiKeyGuard = ApiKeyGuard_1 = class ApiKeyGuard {
    constructor(reflector) {
        this.reflector = reflector;
        this.logger = new common_1.Logger(ApiKeyGuard_1.name);
        // Load API keys from environment variable
        const apiKeysEnv = process.env.API_KEYS || '';
        this.validApiKeys = new Set(apiKeysEnv
            .split(',')
            .map((key) => key.trim())
            .filter((key) => key.length > 0));
        if (this.validApiKeys.size === 0) {
            this.logger.warn('No API keys configured. Set API_KEYS environment variable for write endpoint protection.');
        }
    }
    canActivate(context) {
        // Check if endpoint is marked as public
        const isPublic = this.reflector.getAllAndOverride(exports.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        // If no API keys configured, allow access (development mode)
        if (this.validApiKeys.size === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const apiKey = this.extractApiKey(request);
        if (!apiKey) {
            throw new common_1.UnauthorizedException('API key is required. Provide it via X-API-Key header or Authorization Bearer token.');
        }
        if (!this.validApiKeys.has(apiKey)) {
            this.logger.warn(`Invalid API key attempt from IP: ${request.ip}`);
            throw new common_1.UnauthorizedException('Invalid API key');
        }
        return true;
    }
    extractApiKey(request) {
        // Check X-API-Key header
        const apiKeyHeader = request.headers['x-api-key'];
        if (apiKeyHeader) {
            return Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
        }
        // Check Authorization Bearer token
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    }
};
exports.ApiKeyGuard = ApiKeyGuard;
exports.ApiKeyGuard = ApiKeyGuard = ApiKeyGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], ApiKeyGuard);
//# sourceMappingURL=api-key.guard.js.map