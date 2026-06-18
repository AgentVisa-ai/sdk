/**
 * @agentvisa/verify — core verification logic
 */
import type { VerifyOptions, VerifyResult } from './types.js';
type Headers = Record<string, string | string[] | undefined>;
/**
 * Extract the AgentVisa token from incoming request headers.
 *
 * Checks in order:
 *  1. AgentVisa-Assertion  — Web Bot Auth mode (token bound in RFC 9421 signature)
 *  2. X-AgentVisa-Token    — Standard mode
 *
 * Returns the token and which header it came from.
 */
export declare function extractToken(headers: Headers): {
    token: string | null;
    source: 'assertion' | 'header' | null;
};
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
export declare function verify(token: string, options: VerifyOptions, headers?: Headers): Promise<VerifyResult>;
export {};
//# sourceMappingURL=verify.d.ts.map