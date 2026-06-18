# @agentvisa/verify

Verify human-authorized AI agents in one call. Drop into any Node.js backend — Express, Fastify, Next.js, or plain `fetch`. Supports [Web Bot Auth (RFC 9421)](https://blog.cloudflare.com/web-bot-auth/) via the `AgentVisa-Assertion` header.

```bash
npm install @agentvisa/verify
```

---

## The two-layer model

Cloudflare's [Web Bot Auth](https://blog.cloudflare.com/web-bot-auth/) tells you **which company's agent** is making a request — operator identity, cryptographically signed. It stops there by design. AgentVisa adds the missing half:

```
Layer 1 — Web Bot Auth (Cloudflare)
  "This request is from Acme Corp's agent — verified."

Layer 2 — AgentVisa (this library)
  "A real human (Face ID, just now) authorized that agent to act."
```

When both are present, the `AgentVisa-Assertion` token is covered by the RFC 9421 signature — operator identity and human authorization cryptographically bound in one request.

---

## Quick start

Get your `widgetId` and `apiKey` from your [AgentVisa dashboard](https://agentvisa.ai/dashboard/vendor).

### Express middleware

```typescript
import express from 'express';
import { agentVisa } from '@agentvisa/verify';

const app = express();

// Reject any request without a valid AgentVisa token
app.use('/api', agentVisa({
  widgetId: process.env.AGENTVISA_WIDGET_ID!,
  apiKey:   process.env.AGENTVISA_API_KEY!,
}));

app.post('/api/checkout', (req, res) => {
  // req.agentVisa is populated — token is valid
  res.json({ ok: true });
});
```

### Flag mode (decide in your handler)

```typescript
app.use(agentVisa({
  widgetId: process.env.AGENTVISA_WIDGET_ID!,
  apiKey:   process.env.AGENTVISA_API_KEY!,
  onFail: 'flag',   // don't auto-reject — let the handler decide
}));

app.post('/api/order', (req, res) => {
  if (!req.agentVisa?.valid) {
    // Downgrade: show a CAPTCHA, require extra confirmation, etc.
    return res.status(401).json({ error: 'human_required' });
  }
  // Full trust path
  res.json({ ok: true });
});
```

### Standalone (any framework)

```typescript
import { extractToken, verify } from '@agentvisa/verify';

// Works with any framework — Next.js, Fastify, plain Node http, etc.
async function handler(req, res) {
  const { token } = extractToken(req.headers);
  if (!token) return res.status(401).json({ error: 'agentvisa_required' });

  const result = await verify(token, {
    widgetId: process.env.AGENTVISA_WIDGET_ID!,
    apiKey:   process.env.AGENTVISA_API_KEY!,
  });

  if (!result.valid) return res.status(401).json({ error: result.reason });
  // Proceed
}
```

### Web Bot Auth (RFC 9421)

When an agent sends `AgentVisa-Assertion` instead of `X-AgentVisa-Token`, the library detects that the token was bound in a Web Bot Auth signature and reports it:

```typescript
app.post('/api/action', (req, res) => {
  const av = req.agentVisa!;

  console.log(av.valid);           // true  — human verified
  console.log(av.webBotAuthBound); // true  — token covered by RFC 9421 signature
                                   // false — arrived via X-AgentVisa-Token (standard)

  // Both true = complete trust: which agent + which human, cryptographically bound
});
```

> **Note:** `webBotAuthBound: true` confirms the structural binding is present. The RFC 9421 signature cryptography is verified by your WAF/CDN (e.g. Cloudflare Web Bot Auth) before the request reaches your app.

---

## API reference

### `agentVisa(options)` — Express middleware

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `widgetId` | `string` | ✓ | Your `wgt_xxx` widget ID |
| `apiKey` | `string` | ✓ | Your `wk_xxx` API key |
| `onFail` | `'reject' \| 'flag'` | — | `'reject'` (default) sends 401; `'flag'` sets `req.agentVisa` and continues |
| `rejectBody` | `object` | — | Custom body for 401 responses |
| `apiUrl` | `string` | — | Override API base URL (testing) |

Attaches `req.agentVisa: VerifyResult & { token: string \| null }` to the request.

---

### `verify(token, options, headers?)` — standalone

```typescript
const result = await verify(token, { widgetId, apiKey }, req.headers);
```

Returns a `VerifyResult`:

| Field | Type | Description |
|-------|------|-------------|
| `valid` | `boolean` | Token is valid and human is verified |
| `humanVerified` | `boolean` | Alias for `valid` |
| `reason` | `string` | `'ok'` or error code |
| `verifiedAt` | `string` | ISO timestamp of human verification |
| `expiresAt` | `string` | ISO timestamp of token expiry |
| `domainVerified` | `boolean` | Requesting domain is verified by the Widget Holder |
| `webBotAuthBound` | `boolean` | Token was covered by RFC 9421 Signature-Input |
| `raw` | `object` | Raw AgentVisa API response |

---

### `extractToken(headers)` — utility

```typescript
const { token, source } = extractToken(req.headers);
// source: 'assertion' | 'header' | null
// 'assertion' = AgentVisa-Assertion header (Web Bot Auth mode)
// 'header'    = X-AgentVisa-Token header (standard mode)
```

---

## How agents send the token

Agents use the [AgentVisa MCP server](https://github.com/AgentVisa-ai/agentvisa/tree/main/mcp) (`@agentvisa/mcp`) to get a `tmp_xxx` token, then send it in one of two ways:

**Standard mode:**
```
X-AgentVisa-Token: tmp_xxxxxxxxxxxxxxxxxxxx
```

**Web Bot Auth mode** (RFC 9421 — token bound in the signature):
```
AgentVisa-Assertion: tmp_xxxxxxxxxxxxxxxxxxxx
Signature-Input: sig1=("@method" "@path" "host" "agentvisa-assertion");keyid="acme-bot-key";created=1234567890
Signature: sig1=:base64sig:
```

---

## License

MIT · [agentvisa.ai](https://agentvisa.ai)
