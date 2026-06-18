/**
 * AgentVisa Express middleware
 *
 * Usage:
 *   import { agentVisa } from "@agentvisa/widget/express";
 *
 *   app.use(agentVisa({
 *     widgetId: process.env.AV_WIDGET_ID!,
 *     apiKey:   process.env.AV_API_KEY!,
 *   }));
 *
 * Or protect specific routes only:
 *   app.get("/premium", agentVisa({ widgetId, apiKey }), handler);
 *
 * On success, req.agentVisa is populated:
 *   req.agentVisa.verified  — boolean
 *   req.agentVisa.result    — full VerifyResult (if verified)
 *   req.agentVisa.reason    — failure reason (if not verified + passthrough mode)
 */
import { callVerify, resolveConfig } from "../core.js";
export function agentVisa(config) {
    const resolved = resolveConfig(config);
    return async function agentVisaMiddleware(req, res, next) {
        // Accept both header modes:
        //   Standard:     X-AgentVisa-Token: tmp_xxx
        //   Web Bot Auth: AgentVisa-Assertion: tmp_xxx (covered by RFC 9421 Signature-Input)
        const rawAssertion = req.headers["agentvisa-assertion"];
        const rawToken = rawAssertion ?? req.headers["x-agentvisa-token"];
        const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
        // ── No token present ────────────────────────────────────────────────────
        if (!token) {
            if (resolved.onUnverified === "passthrough") {
                req.agentVisa = { verified: false, reason: "no_token" };
                return next();
            }
            if (resolved.onUnverified === "redirect") {
                res.setHeader("X-AgentVisa-Required", resolved.widgetId);
                res.setHeader("Location", resolved.redirectUrl);
                res.status(302).json({
                    error: "agentvisa_required",
                    reason: "no_token",
                    widget_id: resolved.widgetId,
                    redirect_url: resolved.redirectUrl,
                    message: "This endpoint requires an AgentVisa token. Visit the redirect_url to get set up.",
                });
                return;
            }
            res.setHeader("X-AgentVisa-Required", resolved.widgetId);
            res.status(401).json({
                error: "agentvisa_required",
                reason: "no_token",
                widget_id: resolved.widgetId,
                redirect_url: resolved.redirectUrl,
                message: "This endpoint requires an AgentVisa verification token. " +
                    "Visit redirect_url to get set up, or call POST /v1/token/assert " +
                    "with your av_xxx token and this widget_id to get a TemporaryToken.",
            });
            return;
        }
        // ── Token present — verify it ───────────────────────────────────────────
        // Forward original request headers so the backend can detect Signature-Input
        // and populate web_bot_auth_bound in Pro responses.
        const result = await callVerify(token, resolved, req.headers);
        if (!result.valid) {
            if (resolved.onUnverified === "passthrough") {
                req.agentVisa = { verified: false, reason: result.reason, result };
                return next();
            }
            if (resolved.onUnverified === "redirect") {
                res.setHeader("X-AgentVisa-Required", resolved.widgetId);
                res.setHeader("Location", resolved.redirectUrl);
                res.status(302).json({
                    error: "agentvisa_verification_failed",
                    reason: result.reason,
                    widget_id: resolved.widgetId,
                    redirect_url: resolved.redirectUrl,
                    message: "AgentVisa verification failed. Visit the redirect_url to get set up.",
                });
                return;
            }
            res.setHeader("X-AgentVisa-Required", resolved.widgetId);
            res.status(401).json({
                error: "agentvisa_verification_failed",
                reason: result.reason,
                widget_id: resolved.widgetId,
                redirect_url: resolved.redirectUrl,
            });
            return;
        }
        // ── Verified ────────────────────────────────────────────────────────────
        req.agentVisa = { verified: true, result };
        return next();
    };
}
//# sourceMappingURL=index.js.map