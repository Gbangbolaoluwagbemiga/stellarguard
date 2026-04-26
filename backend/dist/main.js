"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("./config");
require("reflect-metadata");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const wildcardCors = config_1.config.corsOrigin === '*' ||
        (Array.isArray(config_1.config.corsOrigin) && config_1.config.corsOrigin.includes('*'));
    if (config_1.config.nodeEnv === 'production' && wildcardCors) {
        common_1.Logger.warn("CORS_ORIGIN is '*' in production. Restrict it before exposing this service.", 'Bootstrap');
    }
    app.enableCors({
        origin: config_1.config.corsOrigin,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    // Setup Swagger/OpenAPI documentation
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('StellarGuard API')
        .setDescription('API for StellarGuard treasury management, governance, and vault operations on Stellar blockchain')
        .setVersion('0.1.0')
        .addApiKey({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API key for write operations (read operations are public)',
    }, 'api-key')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key',
        description: 'API key as Bearer token (alternative to X-API-Key header)',
    }, 'bearer')
        .addTag('health', 'Health check and system status')
        .addTag('treasury', 'Treasury balance, transactions, and configuration')
        .addTag('governance', 'Governance proposals, votes, and members')
        .addTag('vault', 'Token locks, vesting schedules, and vault statistics')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'StellarGuard API Documentation',
        customCss: '.swagger-ui .topbar { display: none }',
    });
    const port = process.env.PORT || 3001;
    await app.listen(port);
    common_1.Logger.log(`StellarGuard API Server running on: http://localhost:${port}/api`, 'Bootstrap');
    common_1.Logger.log(`API Documentation available at: http://localhost:${port}/api/docs`, 'Bootstrap');
}
bootstrap().catch((err) => {
    common_1.Logger.error(`Error starting server: ${err.message}`, 'Bootstrap');
    process.exit(1);
});
//# sourceMappingURL=main.js.map