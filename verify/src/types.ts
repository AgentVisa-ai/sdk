/**
 * @agentvisa/verify — TypeScript types
 */

export interface VerifyOptions {
  /** Widget ID from your AgentVisa dashboard (wgt_xxx) */
  widgetId: string;
  /** Widget API key from your AgentVisa dashboard (wk_xxx) */
  apiKey: string;
  /** Override the AgentVisa API base URL (default: https://api.agentvisa.ai) */
  apiUrl?: string;
}

export interface VerifyResult {
  /** Whether the AgentVisa token is valid */
  valid: boolean;
  /** Whether human verification passed (same as valid — future-proofing) */
  humanVerified: boolean;
  /** Reason code from AgentVisa API, or an internal error code */
  reason: string;
  /** ISO timestamp of when the human was verified */
  verifiedAt?: string;
  /** ISO timestamp of when this token expires */
  expiresAt?: string;
  /** Whether the requesting domain is verified by the Widget Holder */
  domainVerified?: boolean;
  /**
   * Whether the AgentVisa-Assertion header was structurally bound in a
   * Web Bot Auth (RFC 9421) Signature-Input.
   *
   * true  = the token was covered by a Web Bot Auth signature (binding is present).
   *         The WAF/CDN (e.g. Cloudflare) is responsible for verifying the signature itself.
   * false = token arrived via X-AgentVisa-Token (standard, non-bound mode).
   * undefined = header inspection was not performed.
   */
  webBotAuthBound?: boolean;
  /** Raw response body from the AgentVisa API */
  raw?: Record<string, unknown>;
}

export interface MiddlewareOptions extends VerifyOptions {
  /**
   * What to do when verification fails:
   *  'reject' — respond 401 immediately (default)
   *  'flag'   — set req.agentVisa and continue; let your handler decide
   */
  onFail?: 'reject' | 'flag';
  /** Custom 401 response body when onFail = 'reject' */
  rejectBody?: Record<string, unknown>;
}
