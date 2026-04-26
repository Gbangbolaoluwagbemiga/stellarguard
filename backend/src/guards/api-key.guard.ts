import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Guard that validates API key for protected endpoints.
 * Checks for API key in X-API-Key header or Authorization Bearer token.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  private readonly validApiKeys: Set<string>;

  constructor(private reflector: Reflector) {
    // Load API keys from environment variable
    const apiKeysEnv = process.env.API_KEYS || '';
    this.validApiKeys = new Set(
      apiKeysEnv
        .split(',')
        .map((key) => key.trim())
        .filter((key) => key.length > 0)
    );

    if (this.validApiKeys.size === 0) {
      this.logger.warn(
        'No API keys configured. Set API_KEYS environment variable for write endpoint protection.'
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    // Check if endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
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

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException(
        'API key is required. Provide it via X-API-Key header or Authorization Bearer token.'
      );
    }

    if (!this.validApiKeys.has(apiKey)) {
      this.logger.warn(`Invalid API key attempt from IP: ${request.ip}`);
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }

  private extractApiKey(request: Request): string | null {
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
}
