import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
/**
 * Middleware that logs all incoming HTTP requests with timing information.
 */
export declare class RequestLoggerMiddleware implements NestMiddleware {
    private readonly logger;
    use(req: Request, res: Response, next: NextFunction): void;
}
//# sourceMappingURL=request-logger.middleware.d.ts.map