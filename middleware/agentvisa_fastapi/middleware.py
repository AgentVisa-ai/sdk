"""
AgentVisa Starlette middleware.

Reads X-AgentVisa-Token from the request, calls /v1/verify,
and injects the result into request.state.agentvisa.

Does NOT block requests — use the require_agentvisa dependency for that.
This lets you enrich all requests and make per-route decisions.
"""
from __future__ import annotations
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from .config import AgentVisaConfig
from .client import verify_token
from .models import AgentVisaResult


class AgentVisaMiddleware(BaseHTTPMiddleware):
    """
    Drop-in Starlette/FastAPI middleware.

    Usage:
        app.add_middleware(
            AgentVisaMiddleware,
            config=AgentVisaConfig(api_key="...", widget_id="..."),
        )

    After adding, every request will have request.state.agentvisa set
    to an AgentVisaResult. No requests are blocked — use require_agentvisa
    as a dependency on individual routes to enforce verification.
    """

    def __init__(self, app, config: AgentVisaConfig):
        super().__init__(app)
        self.config = config

    async def dispatch(self, request: Request, call_next) -> Response:
        token = request.headers.get("X-AgentVisa-Token")

        if token:
            result = await verify_token(token, self.config)
        else:
            result = AgentVisaResult.not_present()

        request.state.agentvisa = result
        return await call_next(request)
