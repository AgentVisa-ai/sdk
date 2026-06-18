"""
AgentVisa configuration — holds the Widget Holder's credentials.
"""
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class AgentVisaConfig:
    """
    Configuration for the AgentVisa middleware and dependencies.

    Args:
        api_key:    Your Widget Holder API key (X-Widget-Api-Key).
                    Keep this server-side only — never expose in client code.
        widget_id:  Your widget ID (public, from your AgentVisa dashboard).
        api_base:   Override the AgentVisa API base URL (default: https://api.agentvisa.ai).
        timeout:    HTTP timeout in seconds for /v1/verify calls (default: 5).
    """
    api_key: str
    widget_id: str
    api_base: str = "https://api.agentvisa.ai"
    timeout: float = 5.0

    def __post_init__(self):
        if not self.api_key:
            raise ValueError("AgentVisaConfig: api_key is required")
        if not self.widget_id:
            raise ValueError("AgentVisaConfig: widget_id is required")
        self.api_base = self.api_base.rstrip("/")
