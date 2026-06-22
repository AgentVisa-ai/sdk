"""
AgentVisa result models — mirroring the /v1/verify response schema.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal, Optional


@dataclass
class AgentVisaResult:
    """
    The parsed response from POST /v1/verify.
    Injected into request.state.agentvisa by the middleware.
    """
    # Always present
    valid: bool
    reason: str
    plan: str
    widget_id: str

    # Present on valid tokens
    verified_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    # Domain verification — whether the widget's registered domain is verified
    domain_verified: Optional[bool] = None

    # === Pro-only confirmation flags (AVS-style — no raw PII ever returned) ===
    # These are "y"/"n"/"null" signals — the API never returns name, email, or phone.
    age_over_18: Optional[Literal["y", "n", "null"]] = None
    age_over_21: Optional[Literal["y", "n", "null"]] = None
    multiple_agents_authorized: Optional[Literal["y", "n", "null"]] = None

    # Web Bot Auth (RFC 9421) binding — True when AgentVisa-Assertion was
    # covered by a Signature-Input header on the incoming request.
    # Structural check only; RFC 9421 crypto is verified by the WAF/CDN layer.
    web_bot_auth_bound: Optional[bool] = None

    # Set when no token was present in the request at all
    skipped: bool = False

    @classmethod
    def from_api(cls, data: dict) -> "AgentVisaResult":
        """Build from the raw /v1/verify JSON response."""
        def parse_dt(val: Optional[str]) -> Optional[datetime]:
            if not val:
                return None
            try:
                return datetime.fromisoformat(val.replace("Z", "+00:00"))
            except Exception:
                return None

        return cls(
            valid=data.get("valid", False),
            reason=data.get("reason", "unknown"),
            plan=data.get("plan", "basic"),
            widget_id=data.get("widget_id", ""),
            verified_at=parse_dt(data.get("verified_at")),
            expires_at=parse_dt(data.get("expires_at")),
            domain_verified=data.get("domain_verified"),
            age_over_18=data.get("age_over_18"),
            age_over_21=data.get("age_over_21"),
            multiple_agents_authorized=data.get("multiple_agents_authorized"),
            web_bot_auth_bound=data.get("web_bot_auth_bound"),
        )

    @classmethod
    def not_present(cls) -> "AgentVisaResult":
        """Returned when no X-AgentVisa-Token header was in the request."""
        return cls(valid=False, reason="token_not_present", plan="basic", widget_id="", skipped=True)

    @classmethod
    def error(cls, reason: str = "verification_error") -> "AgentVisaResult":
        """Returned when the /v1/verify call itself failed."""
        return cls(valid=False, reason=reason, plan="basic", widget_id="")
