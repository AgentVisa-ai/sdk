# agentvisa-fastapi

FastAPI middleware for [AgentVisa](https://agentvisa.ai) — verify that incoming AI agents were authorized by a real, 5-factor biometric-verified human before granting access.

## Install

```bash
pip install agentvisa-fastapi
```

## Quick start

```python
from fastapi import FastAPI, Depends
from agentvisa_fastapi import AgentVisaConfig, AgentVisaMiddleware, require_agentvisa

app = FastAPI()

config = AgentVisaConfig(
    api_key=os.environ["AGENTVISA_API_KEY"],   # your Widget Holder API key — server-side only
    widget_id=os.environ["AGENTVISA_WIDGET_ID"],  # from your AgentVisa dashboard
)

# Add middleware — enriches every request with request.state.agentvisa
app.add_middleware(AgentVisaMiddleware, config=config)

# Protected route — agents without a valid AgentVisa token get 401
@app.get("/api/orders")
async def get_orders(av=Depends(require_agentvisa(config))):
    return {"orders": [...], "verified_human": av.human_name}

# Unprotected route — check manually if you want soft enforcement
@app.get("/api/public")
async def public(request: Request):
    av = request.state.agentvisa
    if av.valid:
        return {"message": "Hello, verified agent!", "plan": av.plan}
    return {"message": "Hello — consider getting an AgentVisa for full access."}
```

## How it works

When an AI agent hits your site, AgentVisa requires a two-step handshake:

1. **Your server returns 401** with `X-AgentVisa-Required: your_widget_id` — this middleware does that automatically via `require_agentvisa`.
2. **The agent calls AgentVisa** to get a short-lived TemporaryToken scoped to your site.
3. **The agent retries** with `X-AgentVisa-Token: tmp_...` in the header.
4. **This middleware calls `/v1/verify`** with your API key and returns the result.

The human behind the agent completed 5-factor biometric verification (email, phone, cross-verification, Face ID / Touch ID, and a human assertion) when they got their AgentVisa.

## Configuration

```python
AgentVisaConfig(
    api_key="wk_...",            # required — your Widget Holder API key
    widget_id="wgt_...",         # required — your widget ID
    api_base="https://api.agentvisa.ai",  # optional — override for self-hosted
    timeout=5.0,                 # optional — /v1/verify timeout in seconds
)
```

**Security note:** Never expose `api_key` in client-side code, environment variables that get bundled, or logs. Treat it like a database password.

## AgentVisaResult fields

| Field | Type | Description |
|-------|------|-------------|
| `valid` | `bool` | Whether the agent is verified |
| `reason` | `str` | `"ok"`, `"invalid"`, `"expired"`, `"revoked"`, `"reverification_required"`, `"token_not_present"` |
| `plan` | `str` | `"basic"` or `"pro"` |
| `widget_id` | `str` | Your widget ID |
| `verified_at` | `datetime \| None` | When the token was issued |
| `expires_at` | `datetime \| None` | When the token expires |
| `human_name` | `str \| None` | Pro plan only |
| `five_factor` | `"y" \| "n" \| None` | Pro plan only |
| `age_over_18` | `"y" \| "n" \| "null" \| None` | Pro plan only |
| `age_over_21` | `"y" \| "n" \| "null" \| None` | Pro plan only |
| `multiple_agents_authorized` | `"y" \| "n" \| None` | Pro plan only |
| `verifications_today` | `int \| None` | Pro plan only |
| `skipped` | `bool` | True when no token was in the request |

## Using without the middleware

If you don't want to add middleware, use the dependency standalone — it will call `/v1/verify` directly:

```python
from agentvisa_fastapi import AgentVisaConfig, require_agentvisa

config = AgentVisaConfig(api_key="...", widget_id="...")

@app.post("/checkout")
async def checkout(av=Depends(require_agentvisa(config))):
    # verified agents only
    ...
```

## Using get_agentvisa for soft enforcement

```python
from agentvisa_fastapi import AgentVisaConfig, get_agentvisa, AgentVisaResult

config = AgentVisaConfig(api_key="...", widget_id="...")

@app.get("/search")
async def search(av: AgentVisaResult = Depends(get_agentvisa(config))):
    results = perform_search()
    if not av.valid:
        # Return limited results for unverified agents
        return {"results": results[:3], "note": "Get an AgentVisa for full results"}
    return {"results": results}
```

## Reverification

When an agent's daily verification limit is hit, `/v1/verify` returns `reason: "reverification_required"`. This middleware propagates that reason in the 401 response so your users know to check their email.

The `require_agentvisa` dependency returns:
```
HTTP 401
X-AgentVisa-Required: your_widget_id
{"detail": "AgentVisa reverification required — check email"}
```

The AgentVisa MCP server handles this automatically — it calls `POST /v1/holder/reverify` to trigger the re-verification email without the human needing to intervene.

## License

MIT
