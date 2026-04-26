"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const health_controller_1 = require("./health/health.controller");
const treasury_controller_1 = require("./treasury/treasury.controller");
const treasury_service_1 = require("./treasury/treasury.service");
const governance_controller_1 = require("./governance/governance.controller");
const governance_service_1 = require("./governance/governance.service");
const vault_controller_1 = require("./vault/vault.controller");
const vault_service_1 = require("./vault/vault.service");
const listener_service_1 = require("./listener.service");
const api_key_guard_1 = require("./guards/api-key.guard");
const request_logger_middleware_1 = require("./middleware/request-logger.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        // Apply request logging to all routes
        consumer.apply(request_logger_middleware_1.RequestLoggerMiddleware).forRoutes("*");
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // Rate limiting: 100 requests per minute per IP
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000, // 60 seconds
                    limit: 100, // 100 requests
                },
            ]),
        ],
        controllers: [
            health_controller_1.HealthController,
            treasury_controller_1.TreasuryController,
            governance_controller_1.GovernanceController,
            vault_controller_1.VaultController,
        ],
        providers: [
            treasury_service_1.TreasuryService,
            governance_service_1.GovernanceService,
            vault_service_1.VaultService,
            listener_service_1.ListenerService,
            // Apply rate limiting globally
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            // Apply API key guard globally (endpoints can opt-out with @Public())
            {
                provide: core_1.APP_GUARD,
                useClass: api_key_guard_1.ApiKeyGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map