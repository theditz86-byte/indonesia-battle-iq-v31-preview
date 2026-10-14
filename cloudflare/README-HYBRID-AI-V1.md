# ALZAVA Hybrid AI — Cloud-Only (Gemini + Workers AI)

## Production architecture
- Frontend: one ALZAVA AI Coach chat panel; no model selector or browser-local/WebGPU mode.
- Supabase Edge Function `alzava-ai-coach`: validates the ALZAVA participant session, enforces cloud quotas, forwards questions to the authenticated Cloudflare Gateway, and refunds failed requests.
- Cloudflare Worker `alzava-ai`: tries Gemini 3 Flash Preview first, then Workers AI Llama 3.2 3B when Gemini fails with an eligible error and fallback binding/flag is enabled.
- Workers AI fallback is conditional, not guaranteed to answer when its own free quota is exhausted.

## Operational limits and costs
- Internal limits **remain 3 successful questions per account per WIB day and 120 global claims/day**. Do not remove them without separately assessing abuse/cost controls.
- Google Gemini API free tier has project/model-specific rate limits.
- Workers AI Free has a daily free allocation; Workers Paid may charge beyond its free allocation. Check current account usage and billing before increasing traffic.
- Free cloud chatbot service **is not unlimited**; both upstreams can become unavailable.
- No rotating API keys to evade rate limits. Never publish `GEMINI_API_KEY` or `GATEWAY_ADMIN_TOKEN` in frontend assets.

## Verification
1. Sign in to https://alzava-battle-iq.pages.dev and open AI Coach: there is **one cloud chat interface** (no AI Lokal tab).
2. Confirm remaining quota is read from Supabase on opening and stays consistent across reloads.
3. Ask a general question: confirm `Gemini AI` or `Cloudflare AI` provider label appears after a successful answer.
4. Check https://alzava-ai.theditz86.workers.dev/health; `geminiReady`, `workersAiFallbackReady`, `securityReady` indicate configuration readiness only, **not** guaranteed inference success.
5. For fallback failure diagnostics check Cloudflare Observability logs; avoid sharing API keys, auth headers or user question text.
6. Confirm payment, leaderboard, game, sign-in, and mobile layout continue to function.

## Rollback
- Rollback Cloudflare Pages to the preceding successful deployment if this UI-only cleanup causes trouble.
- No Supabase database migration and no Worker configuration changes are required for this cleanup.
- To disable inference fallback manually, set `AI_FALLBACK_ENABLED` to `false`; keep original Secrets and authentication intact.

## Official references
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/configuration/bindings/
