# API Documentation

Complete API reference for StellarPay backend endpoints.

## Base URL

**Production:** `https://stellar-pay-cross-border-remittance-hub.vercel.app/api`

**Local Development:** `http://localhost:3000/api`

---

## Endpoints

### 1. Health Check

Check system health and connectivity.

**Endpoint:** `GET /api/health`

**Authentication:** None

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-04-04T12:00:00.000Z",
  "services": {
    "horizon": "connected",
    "supabase": "connected"
  }
}
```

**Status Codes:**
- `200` - All services healthy
- `503` - One or more services unavailable

**Example:**

```bash
curl https://stellar-pay-cross-border-remittance-hub.vercel.app/api/health
```

---

### 2. Platform Metrics

Get platform usage metrics.

**Endpoint:** `GET /api/metrics`

**Authentication:** None (consider adding auth for production)

**Response:**

```json
{
  "totalUsers": 45,
  "dailyActiveUsers": 12,
  "totalTransactions": 234,
  "transactionVolume": [
    { "date": "2026-04-01", "count": 15, "volume": 1250.50 },
    { "date": "2026-04-02", "count": 18, "volume": 1580.25 }
  ]
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

**Example:**

```bash
curl https://stellar-pay-cross-border-remittance-hub.vercel.app/api/metrics
```

---

### 3. Multi-Sig Transactions

Manage pending multi-signature transactions.

#### 3.1 List Pending Transactions

**Endpoint:** `GET /api/multisig`

**Authentication:** None (filtered by vault key in query)

**Query Parameters:**
- `vaultPublicKey` (optional) - Filter by vault address

**Response:**

```json
{
  "pendingTransactions": [
    {
      "id": "uuid",
      "vault_public_key": "GXXX...",
      "creator_public_key": "GXXX...",
      "xdr_payload": "AAAAAgAAAA...",
      "required_signatures": 2,
      "current_signatures": 1,
      "status": "pending",
      "created_at": "2026-04-04T12:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

**Example:**

```bash
curl "https://stellar-pay-cross-border-remittance-hub.vercel.app/api/multisig?vaultPublicKey=GXXX..."
```

#### 3.2 Create Pending Transaction

**Endpoint:** `POST /api/multisig`

**Authentication:** None

**Request Body:**

```json
{
  "action": "create",
  "vaultPublicKey": "GXXX...",
  "creatorPublicKey": "GXXX...",
  "xdrPayload": "AAAAAgAAAA..."
}
```

**Response:**

```json
{
  "success": true,
  "transactionId": "uuid"
}
```

**Status Codes:**
- `200` - Transaction created
- `400` - Invalid request
- `500` - Server error

**Example:**

```bash
curl -X POST https://stellar-pay-cross-border-remittance-hub.vercel.app/api/multisig \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "vaultPublicKey": "GXXX...",
    "creatorPublicKey": "GXXX...",
    "xdrPayload": "AAAAAgAAAA..."
  }'
```

#### 3.3 Update Transaction (Add Signature)

**Endpoint:** `POST /api/multisig`

**Request Body:**

```json
{
  "action": "update",
  "txId": "uuid",
  "xdrPayload": "AAAAAgAAAA..."
}
```

**Response:**

```json
{
  "success": true
}
```

**Status Codes:**
- `200` - Transaction updated
- `400` - Invalid request
- `404` - Transaction not found
- `500` - Server error

#### 3.4 Reject Transaction

**Endpoint:** `POST /api/multisig`

**Request Body:**

```json
{
  "action": "reject",
  "txId": "uuid"
}
```

**Response:**

```json
{
  "success": true
}
```

**Status Codes:**
- `200` - Transaction rejected
- `400` - Invalid request
- `404` - Transaction not found
- `500` - Server error

---

## Rate Limiting

**Current Status:** No rate limiting implemented

**Recommended Limits (for production):**

| Endpoint | Rate Limit | Window |
|----------|-----------|--------|
| `/api/health` | 100 requests | 1 minute |
| `/api/metrics` | 30 requests | 1 minute |
| `/api/multisig` GET | 60 requests | 1 minute |
| `/api/multisig` POST | 20 requests | 1 minute |

**Implementation Recommendation:**

Use Vercel Edge Config or Upstash Redis for distributed rate limiting:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1 m"),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  
  // Handle request...
}
```

---

## Error Responses

All endpoints follow a consistent error format:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes:**

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request body |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | External service down |

---

## Authentication

**Current Status:** No authentication required

**Recommended for Production:**

1. **API Keys** for server-to-server communication
2. **JWT tokens** for user-specific operations
3. **Stellar signatures** for transaction verification

**Example JWT Implementation:**

```typescript
import { verify } from 'jsonwebtoken';

export async function authenticateRequest(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return { authenticated: false, error: 'Missing token' };
  }
  
  try {
    const payload = verify(token, process.env.JWT_SECRET!);
    return { authenticated: true, user: payload };
  } catch {
    return { authenticated: false, error: 'Invalid token' };
  }
}
```

---

## CORS Configuration

**Current:** Allows all origins (development)

**Production Recommendation:**

```typescript
export async function GET(request: Request) {
  const response = Response.json(data);
  
  response.headers.set('Access-Control-Allow-Origin', 'https://yourdomain.com');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
```

---

## Webhooks

**Status:** Not implemented

**Potential Use Cases:**

1. **Transaction Confirmation** - Notify when multi-sig transaction is executed
2. **Vault Creation** - Alert when new vault is created
3. **Payment Received** - Notify user of incoming payment

**Example Webhook Payload:**

```json
{
  "event": "transaction.executed",
  "timestamp": "2026-04-04T12:00:00.000Z",
  "data": {
    "transactionId": "uuid",
    "vaultPublicKey": "GXXX...",
    "stellarTxHash": "abc123...",
    "amount": "100.50",
    "asset": "USDC"
  }
}
```

---

## SDK / Client Libraries

**Status:** Not available

**Recommended Implementation:**

Create a TypeScript SDK for easier integration:

```typescript
import { StellarPayClient } from '@stellarpay/sdk';

const client = new StellarPayClient({
  baseUrl: 'https://stellar-pay-cross-border-remittance-hub.vercel.app',
  apiKey: 'your-api-key'
});

// Check health
const health = await client.health.check();

// Get metrics
const metrics = await client.metrics.get();

// Create pending transaction
const tx = await client.multisig.create({
  vaultPublicKey: 'GXXX...',
  creatorPublicKey: 'GXXX...',
  xdrPayload: 'AAAAAgAAAA...'
});
```

---

## Testing

**Test Endpoints:**

All endpoints work on Stellar testnet. Use test accounts from:
- [Stellar Laboratory](https://laboratory.stellar.org/)
- [Friendbot](https://friendbot.stellar.org/)

**Example Test Flow:**

```bash
# 1. Check health
curl https://stellar-pay-cross-border-remittance-hub.vercel.app/api/health

# 2. Get metrics
curl https://stellar-pay-cross-border-remittance-hub.vercel.app/api/metrics

# 3. List pending transactions
curl "https://stellar-pay-cross-border-remittance-hub.vercel.app/api/multisig"

# 4. Create transaction (requires valid XDR)
curl -X POST https://stellar-pay-cross-border-remittance-hub.vercel.app/api/multisig \
  -H "Content-Type: application/json" \
  -d '{"action":"create","vaultPublicKey":"GXXX...","creatorPublicKey":"GXXX...","xdrPayload":"AAAAAgAAAA..."}'
```

---

## Monitoring

**Sentry Integration:** Active

All API errors are automatically logged to Sentry with:
- Request details
- Error stack traces
- User context
- Performance metrics

**View Logs:**
- Sentry Dashboard: [Your Sentry URL]
- Vercel Logs: [Vercel Dashboard](https://vercel.com/dashboard)

---

## Changelog

### v1.1.0 (Current)
- Added multi-sig transaction endpoints
- Improved error handling
- Added health check endpoint

### v1.0.0
- Initial API release
- Basic metrics endpoint
- Supabase integration

---

## Support

For API support:
- GitHub Issues: https://github.com/KB2410/StellarPay-Cross-Border-Remittance-Hub/issues
- Email: [Your email]
- Documentation: [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md)

---

**Last Updated:** April 2026
