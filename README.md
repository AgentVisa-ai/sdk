# AgentVisa SDK

Open-source packages for the [AgentVisa](https://agentvisa.ai) protocol — the human identity layer for AI agents.

AgentVisa lets humans prove to websites that their AI agents are acting on their behalf. Sites embed a widget; agents carry a token; one API call confirms the human approved the action.

---

## Packages

| Package | Description | Install |
|---|---|---|
| [`mcp/`](./mcp) | MCP server — agents use this to present tokens automatically | `npx @agentvisa/mcp` |
| [`verify/`](./verify) | Server-side verifier — sites call this to validate tokens | `npm i @agentvisa/verify` |
| [`widget/`](./widget) | CDN widget — drop-in embed for sites | `cdn.agentvisa.ai/widget.js` |
| [`middleware/`](./middleware) | FastAPI middleware — Python sites | `pip install agentvisa-fastapi` |

---

## How it works

```
Human signs up → biometric verification → gets permanent av_xxx token
                                                        ↓
                                          Gives token to their AI agent

AI agent visits a protected site
Site returns:  401 + X-AgentVisa-Required: wgt_abc123
                                                        ↓
Agent calls:   POST api.agentvisa.ai/v1/token/assert
               { "token": "av_xxx", "widget_id": "wgt_abc123" }
                                                        ↓
               Response: { "temp_token": "tmp_xxx", "expires_at": "..." }
                                                        ↓
Agent retries: X-AgentVisa-Token: tmp_xxx
                                                        ↓
Site calls:    POST api.agentvisa.ai/v1/verify
               { "token": "tmp_xxx", "widget_id": "wgt_abc123" }
               + X-Widget-Api-Key: <your api key>
                                                        ↓
               Response: { "valid": true, "reason": "ok", ... }
```

---

## Quick start — for AI agents (MCP)

```json
{
  "mcpServers": {
    "agentvisa": {
      "command": "npx",
      "args": ["-y", "@agentvisa/mcp"],
      "env": {
        "AGENTVISA_TOKEN": "av_your_token_here"
      }
    }
  }
}
```

Get your token at [agentvisa.ai](https://agentvisa.ai).

---

## Quick start — for sites (Node.js)

```ts
import { extractToken, verify } from '@agentvisa/verify';

const { token } = extractToken(req.headers);
if (!token) {
  res.status(401).setHeader('X-AgentVisa-Required', 'wgt_abc123').send();
  return;
}

const result = await verify(token, {
  widgetId: 'wgt_abc123',
  apiKey: process.env.AGENTVISA_API_KEY,
});

if (!result.valid) {
  res.status(401).json({ error: result.reason });
  return;
}
```

Or use the Express middleware for the same thing in one line:

```ts
import { agentVisa } from '@agentvisa/verify';
app.use('/api', agentVisa({ widgetId: 'wgt_abc123', apiKey: process.env.AGENTVISA_API_KEY }));
```

## Quick start — for sites (Python / FastAPI)

```python
from agentvisa_fastapi import AgentVisaConfig, AgentVisaMiddleware, require_agentvisa

app.add_middleware(
    AgentVisaMiddleware,
    config=AgentVisaConfig(api_key=os.environ["AGENTVISA_API_KEY"], widget_id="wgt_abc123"),
)

@app.get("/protected")
async def protected(av=Depends(require_agentvisa)):
    return {"message": f"Hello verified agent"}
```

---

## Contributing

See [CONTRIBUTING.md](./mcp/CONTRIBUTING.md). All packages are MIT licensed.

Issues and PRs welcome at [github.com/AgentVisa-ai/sdk](https://github.com/AgentVisa-ai/sdk).
