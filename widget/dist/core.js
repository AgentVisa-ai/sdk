/**
 * Shared server-side verification logic.
 * Used by Express and Next.js middleware — no framework deps here.
 */
export const DEFAULT_API_BASE = "https://api.agentvisa.ai";
export const DEFAULT_REDIRECT_URL = "https://agentvisa.ai/for-agents";
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
export async function callVerify(temporaryToken, config, forwardHeaders) {
    try {
        // Forward Signature-Input from the original agent request so the backend
        // can detect Web Bot Auth binding and set web_bot_auth_bound in Pro responses.
        const extraHeaders = {};
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
        return await response.json();
    }
    catch {
        return { valid: false, reason: "network_error" };
    }
}
export function resolveConfig(config) {
    return {
        apiBaseUrl: DEFAULT_API_BASE,
        onUnverified: "redirect",
        redirectUrl: DEFAULT_REDIRECT_URL,
        ...config,
    };
}
//# sourceMappingURL=core.js.map