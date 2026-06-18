/**
 * @agentvisa/verify
 *
 * Verify human-authorized AI agents in one call.
 * Works standalone or as Express middleware.
 * Supports Web Bot Auth (RFC 9421) via AgentVisa-Assertion header.
 *
 * @example
 * // Standalone
 * import { extractToken, verify } from '@agentvisa/verify';
 * const { token } = extractToken(req.headers);
 * const result = await verify(token, { widgetId, apiKey });
 *
 * @example
 * // Express middleware
 * import { agentVisa } from '@agentvisa/verify';
 * app.use('/api', agentVisa({ widgetId: 'wgt_xxx', apiKey: 'wk_xxx' }));
 */

export { extractToken, verify } from './verify.js';
export { agentVisa } from './middleware.js';
export type { VerifyOptions, VerifyResult, MiddlewareOptions } from './types.js';
