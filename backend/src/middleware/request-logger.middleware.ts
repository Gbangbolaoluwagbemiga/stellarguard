import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that logs all incoming HTTP requests with timing information.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    // Log request
    this.logger.log(`→ ${method} ${originalUrl} - ${ip} - ${userAgent}`);

    // Log response when finished
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      const logLevel = statusCode >= 400 ? 'warn' : 'log';
      
      this.logger[logLevel](
        `← ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${ip}`
      );
    });

    next();
  }
}
