/**
 * Shared server-side verification logic.
 * Used by Express and Next.js middleware — no framework deps here.
 */
export declare const DEFAULT_API_BASE = "https://api.agentvisa.ai";
export declare const DEFAULT_REDIRECT_URL = "https://agentvisa.ai/for-agents";
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
    verified_at?: string | null;
    expires_at?: string | null;
    domain_verified?: boolean;
    human_name?: string | null;
    email?: string | null;
    phone?: string | null;
    age_over_18?: "y" | "n" | "null";
    age_over_21?: "y" | "n" | "null";
    gov_id_pic_validation?: "y" | "n" | "null";
    multiple_agents_authorized?: "y" | "n" | "null";
    member_since?: string;
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
export declare function callVerify(temporaryToken: string, config: Required<AgentVisaConfig>, forwardHeaders?: Record<string, string | string[] | undefined>): Promise<VerifyResult>;
export declare function resolveConfig(config: AgentVisaConfig): Required<AgentVisaConfig>;
//# sourceMappingURL=core.d.ts.map