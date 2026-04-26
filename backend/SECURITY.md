# Security Features

This document describes the security features implemented in the StellarGuard backend API.

## Overview

The backend API implements multiple layers of security to protect against unauthorized access and abuse:

1. **API Key Authentication** - Protects write endpoints
2. **Rate Limiting** - Prevents DDoS and abuse (100 req/min per IP)
3. **Request Logging** - Tracks all API requests for monitoring
4. **CORS Whitelist** - Controls which origins can access the API
5. **OpenAPI Documentation** - Provides clear API documentation at `/api/docs`

## API Key Authentication

### Configuration

API keys are configured via the `API_KEYS` environment variable:

```bash
# Single API key
API_KEYS=your-secret-api-key-here

# Multiple API keys (comma-separated)
API_KEYS=key1,key2,key3
```

### Usage

Clients can provide API keys in two ways:

**Option 1: X-API-Key Header**
```bash
curl -H "X-API-Key: your-api-key" http://localhost:3001/api/endpoint
```

**Option 2: Authorization Bearer Token**
```bash
curl -H "Authorization: Bearer your-api-key" http://localhost:3001/api/endpoint
```

### Public Endpoints

Read-only endpoints are marked as public and don't require API keys:

- `GET /api/health` - Health check
- `GET /api/treasury/*` - All treasury read endpoints
- `GET /api/governance/*` - All governance read endpoints
- `GET /api/vault/*` - All vault read endpoints

### Protected Endpoints

Future write endpoints (POST, PUT, DELETE) will require API keys by default unless explicitly marked as public with the `@Public()` decorator.

### Development Mode

If no API keys are configured (`API_KEYS` is empty or not set), the API allows all requests. This is convenient for development but should **never** be used in production.

## Rate Limiting

### Configuration

Rate limiting is configured in `app.module.ts`:

```typescript
ThrottlerModule.forRoot([
  {
    ttl: 60000,  // 60 seconds
    limit: 100,  // 100 requests
  },
])
```

### Behavior

- **Limit**: 100 requests per minute per IP address
- **Response**: Returns `429 Too Many Requests` when limit exceeded
- **Headers**: Includes rate limit headers in responses:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Time when the limit resets

### Customization

To adjust rate limits, modify the configuration in `backend/src/app.module.ts`.

## Request Logging

All HTTP requests are logged with the following information:

- HTTP method and URL
- Client IP address
- User agent
- Response status code
- Response time in milliseconds

**Example log output:**
```
[HTTP] → GET /api/treasury/balance - 127.0.0.1 - Mozilla/5.0...
[HTTP] ← GET /api/treasury/balance 200 - 45ms - 127.0.0.1
```

Logs are written to stdout and can be collected by your logging infrastructure.

## CORS Configuration

CORS (Cross-Origin Resource Sharing) is configured via the `CORS_ORIGIN` environment variable:

```bash
# Single origin
CORS_ORIGIN=https://app.stellarguard.io

# Multiple origins (comma-separated)
CORS_ORIGIN=https://app.stellarguard.io,https://staging.stellarguard.io

# Allow all origins (NOT recommended for production)
CORS_ORIGIN=*
```

### Production Warning

The API will log a warning if `CORS_ORIGIN=*` is used in production:

```
Warning: CORS_ORIGIN is '*' in production. Restrict it before exposing this service.
```

## API Documentation

Interactive API documentation is available at `/api/docs` when the server is running.

**Access documentation:**
```
http://localhost:3001/api/docs
```

The documentation includes:
- All available endpoints
- Request/response schemas
- Authentication requirements
- Try-it-out functionality

## Security Best Practices

### For Development

1. Leave `API_KEYS` empty for convenience
2. Use `CORS_ORIGIN=http://localhost:3000` for local frontend
3. Monitor logs for any suspicious activity

### For Production

1. **Always set strong API keys**:
   ```bash
   API_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32)
   ```

2. **Restrict CORS origins**:
   ```bash
   CORS_ORIGIN=https://app.stellarguard.io
   ```

3. **Use HTTPS only** - Never expose the API over HTTP in production

4. **Monitor rate limit violations** - Set up alerts for excessive 429 responses

5. **Rotate API keys regularly** - Implement a key rotation policy

6. **Use environment-specific keys** - Different keys for staging and production

7. **Secure key storage** - Use secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)

## Adding Protected Endpoints

When adding new write endpoints, they are automatically protected by the API key guard:

```typescript
@Controller('api/treasury')
export class TreasuryController {
  // This endpoint requires API key (not marked as @Public())
  @Post('deposit')
  async deposit(@Body() data: DepositDto) {
    // Implementation
  }

  // This endpoint is public (marked with @Public())
  @Public()
  @Get('balance')
  async getBalance() {
    // Implementation
  }
}
```

## Testing Security Features

### Test Rate Limiting

```bash
# Send 101 requests rapidly to trigger rate limit
for i in {1..101}; do
  curl http://localhost:3001/api/health
done
```

### Test API Key Authentication

```bash
# Without API key (should fail if keys are configured)
curl -X POST http://localhost:3001/api/protected-endpoint

# With valid API key (should succeed)
curl -X POST -H "X-API-Key: your-key" http://localhost:3001/api/protected-endpoint

# With invalid API key (should fail)
curl -X POST -H "X-API-Key: wrong-key" http://localhost:3001/api/protected-endpoint
```

## Troubleshooting

### "API key is required" error

- Ensure you're providing the API key via `X-API-Key` header or `Authorization: Bearer` header
- Verify the API key matches one of the keys in the `API_KEYS` environment variable

### "Invalid API key" error

- Check that the API key is correct (no extra spaces or characters)
- Verify the server has the correct `API_KEYS` environment variable set

### Rate limit exceeded (429)

- Wait for the rate limit window to reset (60 seconds)
- Consider requesting a higher rate limit if legitimate use case
- Check if your IP is making too many requests

### CORS errors in browser

- Verify `CORS_ORIGIN` includes your frontend's origin
- Check browser console for specific CORS error messages
- Ensure the origin matches exactly (including protocol and port)

## Security Incident Response

If you suspect a security breach:

1. **Immediately rotate all API keys**
2. **Review request logs** for suspicious activity
3. **Check rate limit violations** for DDoS attempts
4. **Update CORS origins** if unauthorized origins are accessing the API
5. **Report the incident** to the security team

## Future Enhancements

Planned security improvements:

- [ ] JWT-based authentication for user-specific operations
- [ ] Role-based access control (RBAC)
- [ ] API key scoping (read-only vs read-write keys)
- [ ] Request signing for additional security
- [ ] IP whitelisting for sensitive operations
- [ ] Audit logging for all write operations
