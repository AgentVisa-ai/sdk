"""
FastAPI dependencies for AgentVisa verification.

Two options:

1. get_agentvisa(config) — returns the result, never blocks.
   Use when you want to check verification status yourself.

2. require_agentvisa(config) — returns the result OR raises HTTP 401.
   Use when the route must be verified to proceed.

Both work with or without AgentVisaMiddleware installed.
If the middleware is present, the cached result is reused (no second API call).
If not, the dependency calls /v1/verify itself.
"""
from __future__ import annotations
from fastapi import Depends, HTTPException, Request
from .config import AgentVisaConfig
from .client import verify_token
from .models import AgentVisaResult


def get_agentvisa(config: AgentVisaConfig):
    """
    FastAPI dependency — returns AgentVisaResult, never raises.

    Usage:
        @app.get("/my-route")
        async def handler(av: AgentVisaResult = Depends(get_agentvisa(config))):
            if av.valid:
                ...
    """
    async def _dependency(request: Request) -> AgentVisaResult:
        # If middleware already ran, reuse its result
        existing = getattr(request.state, "agentvisa", None)
        if existing is not None:
            return existing

        token = request.headers.get("X-AgentVisa-Token")
        if not token:
            return AgentVisaResult.not_present()

        return await verify_token(token, config)

    return _dependency


def require_agentvisa(config: AgentVisaConfig):
    """
    FastAPI dependency — returns AgentVisaResult or raises HTTP 401.

    Usage:
        @app.get("/protected")
        async def handler(av: AgentVisaResult = Depends(require_agentvisa(config))):
            # Only reaches here if av.valid is True
            return {"plan": av.plan, "verified": av.valid}
    """
    async def _dependency(
        result: AgentVisaResult = Depends(get_agentvisa(config)),
    ) -> AgentVisaResult:
        if not result.valid:
            reason = result.reason

            # Tell the agent what it needs to do next
            if reason == "token_not_present":
                raise HTTPException(
                    status_code=401,
                    detail="AgentVisa token required",
                    headers={"X-AgentVisa-Required": config.widget_id},
                )
            if reason == "reverification_required":
                raise HTTPException(
                    status_code=401,
                    detail="AgentVisa reverification required — check email",
                    headers={"X-AgentVisa-Required": config.widget_id},
                )
            if reason in ("expired", "revoked"):
                raise HTTPException(
                    status_code=401,
                    detail=f"AgentVisa token {reason}",
                    headers={"X-AgentVisa-Required": config.widget_id},
                )

            raise HTTPException(
                status_code=401,
                detail=f"AgentVisa verification failed: {reason}",
                headers={"X-AgentVisa-Required": config.widget_id},
            )

        return result

    return _dependency
