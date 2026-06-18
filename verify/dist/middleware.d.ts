/**
 * @agentvisa/verify — Express middleware
 */
import type { Request, Response, NextFunction } from 'express';
import type { MiddlewareOptions, VerifyResult } from './types.js';
declare global {
    namespace Express {
        interface Request {
            agentVisa?: VerifyResult & {
                token: string | null;
            };
        }
    }
}
/**
 * Express middleware that verifies an incoming AgentVisa token.
 *
 * Reads the token from AgentVisa-Assertion (Web Bot Auth mode) or
 * X-AgentVisa-Token (standard mode), calls the AgentVisa API, and
 * either rejects the request (401) or attaches the result to req.agentVisa.
 *
 * @example
 * // Reject unverified agents immediately
 * app.use('/api', agentVisa({ widgetId: 'wgt_xxx', apiKey: 'wk_xxx' }));
 *
 * @example
 * // Flag and decide in your handler
 * app.use(agentVisa({ widgetId: 'wgt_xxx', apiKey: 'wk_xxx', onFail: 'flag' }));
 * app.post('/checkout', (req, res) => {
 *   if (!req.agentVisa?.valid) return res.status(401).json({ error: 'human_required' });
 *   // ... proceed
 * });
 *
 * @example
 * // Web Bot Auth — check binding too
 * app.use(agentVisa({ widgetId: 'wgt_xxx', apiKey: 'wk_xxx' }));
 * app.post('/api', (req, res) => {
 *   const av = req.agentVisa!;
 *   // av.valid          → human verified
 *   // av.webBotAuthBound → token was bound in RFC 9421 signature
 * });
 */
export declare function agentVisa(options: MiddlewareOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=middleware.d.ts.map