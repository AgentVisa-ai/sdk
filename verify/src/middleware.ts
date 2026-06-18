/**
 * @agentvisa/verify — Express middleware
 */

import type { Request, Response, NextFunction } from 'express';
import { extractToken, verify } from './verify.js';
import type { MiddlewareOptions, VerifyResult } from './types.js';

// Augment Express Request so TypeScript knows about req.agentVisa
declare global {
  namespace Express {
    interface Request {
      agentVisa?: VerifyResult & { token: string | null };
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
export function agentVisa(options: MiddlewareOptions) {
  const { onFail = 'reject', rejectBody, ...verifyOptions } = options;

  return async function agentVisaMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const headers = req.headers as Record<string, string | string[] | undefined>;
    const { token } = extractToken(headers);

    if (!token) {
      if (onFail === 'flag') {
        req.agentVisa = {
          valid: false,
          humanVerified: false,
          reason: 'no_token',
          token: null,
        };
        next();
        return;
      }
      res.status(401).json(
        rejectBody ?? {
          error: 'agentvisa_required',
          message:
            'This endpoint requires an AgentVisa token. ' +
            'Set AgentVisa-Assertion (Web Bot Auth) or X-AgentVisa-Token header.',
          widget_id: verifyOptions.widgetId,
        },
      );
      return;
    }

    const result = await verify(token, verifyOptions, headers);
    req.agentVisa = { ...result, token };

    if (!result.valid) {
      if (onFail === 'flag') {
        next();
        return;
      }
      res.status(401).json(
        rejectBody ?? {
          error: 'agentvisa_invalid',
          reason: result.reason,
          message: 'AgentVisa verification failed.',
        },
      );
      return;
    }

    next();
  };
}
