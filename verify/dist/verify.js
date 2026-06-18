/**
 * @agentvisa/verify — core verification logic
 */
const DEFAULT_API_URL = 'https://api.agentvisa.ai';
function headerValue(headers, name) {
    const val = headers[name.toLowerCase()];
    if (!val)
        return undefined;
    return Array.isArray(val) ? val[0] : val;
}
/**
 * Check whether the AgentVisa-Assertion header is covered by a
 * Web Bot Auth (RFC 9421) Signature-Input.
 *
 * This is a structural check — confirms the token was included in the
 * set of headers the agent signed, but does NOT verify the RFC 9421
 * signature cryptography. Signature verification is handled by your
 * WAF/CDN layer (e.g. Cloudflare Web Bot Auth).
 */
function isWebBotAuthBound(headers) {
    const sigInput = headerValue(headers, 'signature-input');
    if (!sigInput)
        return false;
    return sigInput.toLowerCase().includes('"agentvisa-assertion"');
}
/**
 * Extract the AgentVisa token from incoming request headers.
 *
 * Checks in order:
 *  1. AgentVisa-Assertion  — Web Bot Auth mode (token bound in RFC 9421 signature)
 *  2. X-AgentVisa-Token    — Standard mode
 *
 * Returns the token and which header it came from.
 */
export function extractToken(headers) {
    const assertion = headerValue(headers, 'agentvisa-assertion');
    if (assertion)
        return { token: assertion, source: 'assertion' };
    const token = headerValue(headers, 'x-agentvisa-token');
    if (token)
        return { token, source: 'header' };
    return { token: null, source: null };
}
/**
 * Verify an AgentVisa temporary token against the AgentVisa API.
 *
 * @param token    The tmp_xxx token from the agent's request header
 * @param options  widgetId, apiKey, and optional apiUrl override
 * @param headers  Full request headers — used to detect Web Bot Auth binding
 *
 * @example
 * // Standalone usage (any framework)
 * const result = await verify(token, { widgetId, apiKey });
 * if (!result.valid) return res.status(401).json({ error: result.reason });
 */
export async function verify(token, options, headers) {
    const apiUrl = (options.apiUrl ?? DEFAULT_API_URL).replace(/\/$/, '');
    const webBotAuthBound = headers ? isWebBotAuthBound(headers) : undefined;
    let response;
    try {
        response = await fetch(`${apiUrl}/v1/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Widget-Api-Key': options.apiKey,
            },
            body: JSON.stringify({
                token,
                widget_id: options.widgetId,
            }),
        });
    }
    catch (err) {
        return {
            valid: false,
            humanVerified: false,
            reason: 'network_error',
            webBotAuthBound,
            raw: { error: String(err) },
        };
    }
    let data = {};
    try {
        data = (await response.json());
    }
    catch {
        // Non-JSON response — treat as error
        return {
            valid: false,
            humanVerified: false,
            reason: `http_${response.status}`,
            webBotAuthBound,
            raw: {},
        };
    }
    const valid = response.ok && data.valid === true;
    return {
        valid,
        humanVerified: valid,
        reason: data.reason ?? (response.ok ? 'ok' : `http_${response.status}`),
        verifiedAt: data.verified_at,
        expiresAt: data.expires_at,
        domainVerified: data.domain_verified,
        webBotAuthBound,
        raw: data,
    };
}
//# sourceMappingURL=verify.js.map