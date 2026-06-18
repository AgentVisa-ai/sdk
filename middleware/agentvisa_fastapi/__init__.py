"""
agentvisa-fastapi — AgentVisa verification middleware for FastAPI.

Quick start:

    from agentvisa_fastapi import AgentVisaConfig, AgentVisaMiddleware, require_agentvisa

    config = AgentVisaConfig(
        api_key="your_widget_api_key",   # server-side only
        widget_id="your_widget_id",       # from your AgentVisa dashboard
    )

    # Option A: middleware (enriches all requests, doesn't block)
    app.add_middleware(AgentVisaMiddleware, config=config)

    # Option B: per-route dependency (blocks unverified agents with 401)
    @app.get("/protected")
    async def handler(av=Depends(require_agentvisa(config))):
        return {"verified": True, "plan": av.plan}

    # Option C: both (recommended — middleware caches result, dependency enforces)
    app.add_middleware(AgentVisaMiddleware, config=config)

    @app.get("/protected")
    async def handler(av=Depends(require_agentvisa(config))):
        return {"plan": av.plan, "human_name": av.human_name}
"""

from .config import AgentVisaConfig
from .middleware import AgentVisaMiddleware
from .dependencies import get_agentvisa, require_agentvisa
from .models import AgentVisaResult

__all__ = [
    "AgentVisaConfig",
    "AgentVisaMiddleware",
    "get_agentvisa",
    "require_agentvisa",
    "AgentVisaResult",
]

__version__ = "0.1.0"
