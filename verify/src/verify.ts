/**
 * @agentvisa/verify — core verification logic
 */

import type { VerifyOptions, VerifyResult } from './types.js';

const DEFAULT_API_URL = 'https://api.agentvisa.ai';

type Headers = Record<string, string | string[] | undefined>;

function headerValue(headers: Headers, name: string): string | undefined {
  const val = headers[name.toLowerCase()];
  if (!val) return undefined;
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
function isWebBotAuthBound(headers: Headers): boolean {
  const sigInput = headerValue(headers, 'signature-input');
  if (!sigInput) return false;
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
export function extractToken(headers: Headers): {
  token: string | null;
  source: 'assertion' | 'header' | null;
} {
  const assertion = headerValue(headers, 'agentvisa-assertion');
  if (assertion) return { token: assertion, source: 'assertion' };

  const token = headerValue(headers, 'x-agentvisa-token');
  if (token) return { token, source: 'header' };

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
export async function verify(
  token: string,
  options: VerifyOptions,
  headers?: Headers,
): Promise<VerifyResult> {
  const apiUrl = (options.apiUrl ?? DEFAULT_API_URL).replace(/\/$/, '');
  const webBotAuthBound = headers ? isWebBotAuthBound(headers) : undefined;

  let response: Response;
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
  } catch (err) {
    return {
      valid: false,
      humanVerified: false,
      reason: 'network_error',
      webBotAuthBound,
      raw: { error: String(err) },
    };
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
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
    reason: (data.reason as string | undefined) ?? (response.ok ? 'ok' : `http_${response.status}`),
    verifiedAt:    data.verified_at    as string  | undefined,
    expiresAt:     data.expires_at     as string  | undefined,
    domainVerified: data.domain_verified as boolean | undefined,
    webBotAuthBound,
    raw: data,
  };
}
