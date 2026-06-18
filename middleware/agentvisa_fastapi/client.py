"""
Async HTTP client for POST /v1/verify.
Uses httpx with a shared client for connection pooling.
"""
from __future__ import annotations
import httpx
from .config import AgentVisaConfig
from .models import AgentVisaResult


async def verify_token(
    token: str,
    config: AgentVisaConfig,
    human_assertion: str | None = None,
) -> AgentVisaResult:
    """
    Call POST /v1/verify and return a parsed AgentVisaResult.
    Never raises — returns AgentVisaResult.error() on any network/API failure.
    """
    url = f"{config.api_base}/v1/verify"
    params: dict = {"token": token, "widget_id": config.widget_id}
    if human_assertion is not None:
        params["human_assertion"] = human_assertion

    try:
        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                url,
                params=params,
                headers={"X-Widget-Api-Key": config.api_key},
            )
            if response.status_code == 401:
                return AgentVisaResult.error("invalid_api_key")
            if response.status_code == 404:
                return AgentVisaResult.error("invalid_widget")
            if not response.is_success:
                return AgentVisaResult.error(f"api_error_{response.status_code}")

            return AgentVisaResult.from_api(response.json())

    except httpx.TimeoutException:
        return AgentVisaResult.error("verification_timeout")
    except Exception:
        return AgentVisaResult.error("verification_error")
