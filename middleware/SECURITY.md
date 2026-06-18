# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.1.x   | ✅ Active development |

## Reporting a Vulnerability

If you discover a security vulnerability in `agentvisa-fastapi`, please **do not** open a public issue.

Instead, email **security@agentvisa.ai** with:

- A description of the vulnerability
- Steps to reproduce (if possible)
- Potential impact

We will respond within 48 hours and work with you to resolve the issue.

## Security Notes

- Your `api_key` (Widget Holder API key) must never appear in client-side code, bundled environment variables, or logs. Treat it like a database password.
- The middleware uses `hmac.compare_digest`-equivalent timing-safe comparison on the AgentVisa API side — no timing attacks on API key verification.
- All verification calls go to `https://api.agentvisa.ai` over TLS.

Thank you for helping keep AgentVisa secure.
