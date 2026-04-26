import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../guards/api-key.guard';

/**
 * Decorator to mark endpoints as public (no API key required).
 * Use this on read-only endpoints that should be publicly accessible.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
