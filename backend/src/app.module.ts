import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { HealthController } from "./health/health.controller";
import { TreasuryController } from "./treasury/treasury.controller";
import { TreasuryService } from "./treasury/treasury.service";
import { GovernanceController } from "./governance/governance.controller";
import { GovernanceService } from "./governance/governance.service";
import { VaultController } from "./vault/vault.controller";
import { VaultService } from "./vault/vault.service";
import { ListenerService } from "./listener.service";
import { ApiKeyGuard } from "./guards/api-key.guard";
import { RequestLoggerMiddleware } from "./middleware/request-logger.middleware";

@Module({
  imports: [
    // Rate limiting: 100 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests
      },
    ]),
  ],
  controllers: [
    HealthController,
    TreasuryController,
    GovernanceController,
    VaultController,
  ],
  providers: [
    TreasuryService,
    GovernanceService,
    VaultService,
    ListenerService,
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Apply API key guard globally (endpoints can opt-out with @Public())
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request logging to all routes
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");
  }
}
