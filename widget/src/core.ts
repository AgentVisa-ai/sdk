/**
 * Shared server-side verification logic.
 * Used by Express and Next.js middleware — no framework deps here.
 */

export const DEFAULT_API_BASE = "https://api.agentvisa.ai";
export const DEFAULT_REDIRECT_URL = "https://agentvisa.ai/for-agents";

export interface AgentVisaConfig {
  /** Your widget ID from the AgentVisa dashboard */
  widgetId: string;
  /** Your widget API key — keep server-side only, never expose to the browser */
  apiKey: string;
  /** Override API base URL (e.g. for staging) */
  apiBaseUrl?: string;
  /**
   * What to do when verification fails or token is missing.
   * "redirect" (default) — redirect the agent to redirectUrl (agentvisa.ai/for-agents).
   * "block"    — return 401 and stop the request. The redirect_url is still included
   *              in the JSON body so the agent knows where to go.
   * "passthrough" — attach result to request and continue; let your
   *   handler decide. Useful for soft-gating or analytics.
   */
  onUnverified?: "redirect" | "block" | "passthrough";
  /**
   * Where to send unverified agents.
   * Defaults to "https://agentvisa.ai/for-agents".
   * Only used when onUnverified is "redirect".
   */
  redirectUrl?: string;
}

export interface VerifyResult {
  valid: boolean;
  reason: string;
  plan?: string;
  widget_id?: string;

  // Timestamps — present on successful verifications
  verified_at?: string | null;
  expires_at?: string | null;

  // Domain verification (both plans)
  domain_verified?: boolean;

  // === Pro-only confirmation flags (AVS-style — no raw PII ever returned) ===
  age_over_18?: "y" | "n" | "null";
  age_over_21?: "y" | "n" | "null";
  gov_id_pic_validation?: "y" | "n" | "null";
  multiple_agents_authorized?: "y" | "n" | "null";
  member_since?: string;

  // AVS-style attribute confirmation — Pro only
  // Send confirm_email / confirm_phone_last4 in the verify request body to get these back
  email_confirmed?: boolean;
  phone_last4_confirmed?: boolean;

  // Web Bot Auth (RFC 9421) binding — Pro only
  // True if "agentvisa-assertion" appeared in Signature-Input on the original request
  web_bot_auth_bound?: boolean;
}

/**
 * Call /v1/verify with a TemporaryToken.
 *
 * @param temporaryToken  The tmp_xxx token from the agent's request header
 * @param config          Resolved widget config (widgetId, apiKey, apiBaseUrl)
 * @param forwardHeaders  Optional headers from the original agent request.
 *                        Pass these so the backend can detect Web Bot Auth binding
 *                        (Signature-Input header) and populate web_bot_auth_bound.
 *
 * Returns the full VerifyResult or a synthetic error result on network failure.
 */
export async function callVerify(
  temporaryToken: string,
  config: Required<AgentVisaConfig>,
  forwardHeaders?: Record<string, string | string[] | undefined>,
): Promise<VerifyResult> {
  try {
    // Forward Signature-Input from the original agent request so the backend
    // can detect Web Bot Auth binding and set web_bot_auth_bound in Pro responses.
    const extraHeaders: Record<string, string> = {};
    if (forwardHeaders) {
      const sigInput = forwardHeaders["signature-input"];
      if (sigInput) {
        extraHeaders["signature-input"] = Array.isArray(sigInput) ? sigInput[0] : sigInput;
      }
    }

    const response = await fetch(`${config.apiBaseUrl}/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Widget-Api-Key": config.apiKey,
        ...extraHeaders,
      },
      body: JSON.stringify({
        token: temporaryToken,
        widget_id: config.widgetId,
      }),
    });
    return await response.json() as VerifyResult;
  } catch {
    return { valid: false, reason: "network_error" };
  }
}

export function resolveConfig(config: AgentVisaConfig): Required<AgentVisaConfig> {
  return {
    apiBaseUrl: DEFAULT_API_BASE,
    onUnverified: "redirect",
    redirectUrl: DEFAULT_REDIRECT_URL,
    ...config,
  };
}
