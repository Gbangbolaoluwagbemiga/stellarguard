"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Public = void 0;
const common_1 = require("@nestjs/common");
const api_key_guard_1 = require("../guards/api-key.guard");
/**
 * Decorator to mark endpoints as public (no API key required).
 * Use this on read-only endpoints that should be publicly accessible.
 */
const Public = () => (0, common_1.SetMetadata)(api_key_guard_1.IS_PUBLIC_KEY, true);
exports.Public = Public;
//# sourceMappingURL=public.decorator.js.map