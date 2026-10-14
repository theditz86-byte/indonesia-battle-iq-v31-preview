// ALZAVA Hybrid AI Gateway V1 — Cloudflare Worker (module).
// Required encrypted secrets: GEMINI_API_KEY, GATEWAY_ADMIN_TOKEN.
// Fallback requires Workers AI binding "AI" plus variable AI_FALLBACK_ENABLED=true.
const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";
const CF_MODEL = "@cf/meta/llama-3.2-3b-instruct";
const MAX_BODY_BYTES = 10000;
const MAX_PROMPT_CHARS = 6000;
const GEMINI_TIMEOUT_MS = 17000;
const FALLBACK_TIMEOUT_MS = 8000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function cleanGoogleCode(result) {
  const code = result?.error?.status;
  return typeof code === "string" && /^[A-Z_]{1,48}$/.test(code) ? code : "UNKNOWN";
}

function timeout(promise, millis) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("FALLBACK_TIMEOUT")), millis);
    })
  ]).finally(() => clearTimeout(timer));
}

function geminiText(data) {
  return (data?.candidates?.[0]?.content?.parts || [])
    .filter(part => typeof part?.text === "string")
    .map(part => part.text).join("\n").trim();
}

async function askGemini(prompt, env, model) {
  if (!env.GEMINI_API_KEY) {
    return { ok: false, reason: "GEMINI_NOT_CONFIGURED", fallback: true, status: 503 };
  }
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent";
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 768, thinkingConfig: { thinkingLevel: "minimal" } }
      }),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS)
    });
  } catch (error) {
    const isTimeout = error?.name === "TimeoutError" || error?.name === "AbortError";
    console.error("alzava_hybrid_gemini_transport", { reason: isTimeout ? "TIMEOUT" : "NETWORK" });
    return { ok: false, fallback: true, status: isTimeout ? 504 : 502, reason: isTimeout ? "GEMINI_TIMEOUT" : "GEMINI_NETWORK" };
  }

  let result;
  try { result = await response.json(); }
  catch { return { ok: false, fallback: true, status: 502, reason: "GEMINI_INVALID_RESPONSE" }; }

  if (!response.ok) {
    const upstreamCode = cleanGoogleCode(result);
    console.error("alzava_hybrid_gemini_upstream", { status: response.status, code: upstreamCode });
    const canFallback = [429, 500, 502, 503, 504].includes(response.status) ||
      (response.status === 400 && upstreamCode === "FAILED_PRECONDITION");
    return {
      ok: false,
      fallback: canFallback,
      status: response.status === 429 ? 429 : response.status >= 500 ? 503 : 502,
      reason: "GEMINI_UPSTREAM",
      upstreamStatus: response.status,
      upstreamCode
    };
  }

  const answer = geminiText(result);
  if (!answer) {
    console.error("alzava_hybrid_gemini_empty", { reason: result?.candidates?.[0]?.finishReason || "UNKNOWN" });
    return { ok: false, fallback: true, status: 502, reason: "GEMINI_EMPTY" };
  }
  return { ok: true, provider: "gemini", model, answer };
}

async function askCloudflare(prompt, env) {
  try {
    const result = await timeout(env.AI.run(CF_MODEL, {
      messages: [
        { role: "system", content: "Kamu ALZAVA AI. Jawab jelas dalam bahasa Indonesia. Jangan mengarang fakta." },
        { role: "user", content: prompt }
      ],
      max_tokens: 450,
      temperature: 0.5
    }), FALLBACK_TIMEOUT_MS);
    const answer = typeof result?.response === "string" ? result.response.trim() : "";
    if (!answer) throw new Error("EMPTY_ANSWER");
    return { ok: true, provider: "workers-ai", model: CF_MODEL, answer, usedFallback: true };
  } catch (error) {
    const kind = error?.message === "FALLBACK_TIMEOUT" ? "TIMEOUT" : "UNAVAILABLE";
    console.error("alzava_hybrid_workers_ai_failure", { kind });
    return { ok: false, status: 503, reason: "ALL_PROVIDERS_UNAVAILABLE" };
  }
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const rawModel = String(env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL);
    const model = /^[a-zA-Z0-9._-]{1,100}$/.test(rawModel) ? rawModel : DEFAULT_GEMINI_MODEL;
    const fallbackReady = env.AI_FALLBACK_ENABLED === "true" && Boolean(env.AI?.run);

    if (path === "/" || path === "/health") {
      return json({
        service: "ALZAVA Hybrid AI Gateway",
        status: "online",
        geminiModel: model,
        geminiReady: Boolean(env.GEMINI_API_KEY),
        workersAiFallbackReady: fallbackReady,
        securityReady: Boolean(env.GATEWAY_ADMIN_TOKEN)
      });
    }
    if (path !== "/api/ask") return json({ error: "Not found" }, 404);
    if (request.method !== "POST") return json({ error: "POST required" }, 405);
    if (!env.GATEWAY_ADMIN_TOKEN) return json({ error: "Gateway not configured" }, 503);
    if (request.headers.get("Authorization") !== "Bearer " + env.GATEWAY_ADMIN_TOKEN) {
      return json({ error: "Unauthorized" }, 401);
    }
    if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
      return json({ error: "JSON required" }, 415);
    }

    const declaredSize = Number(request.headers.get("Content-Length") || 0);
    if (!Number.isFinite(declaredSize) || declaredSize < 0 || declaredSize > MAX_BODY_BYTES) {
      return json({ error: "Request too large" }, 413);
    }
    let raw;
    try { raw = await request.text(); }
    catch { return json({ error: "Invalid request" }, 400); }
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return json({ error: "Request too large" }, 413);
    }
    let body;
    try { body = JSON.parse(raw); }
    catch { return json({ error: "Invalid JSON" }, 400); }
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt || prompt.length > MAX_PROMPT_CHARS) {
      return json({ error: "Invalid prompt length" }, 400);
    }

    const primary = await askGemini(prompt, env, model);
    if (primary.ok) return json({ ok: true, answer: primary.answer, provider: primary.provider, model: primary.model });
    if (primary.fallback && fallbackReady) {
      const secondary = await askCloudflare(prompt, env);
      if (secondary.ok) return json({ ok: true, answer: secondary.answer, provider: secondary.provider, model: secondary.model, usedFallback: true });
    }
    return json({
      error: "Layanan AI sedang sibuk. Silakan coba lagi nanti atau gunakan mode AI Lokal.",
      code: primary.reason,
      ...(primary.upstreamCode ? { upstreamCode: primary.upstreamCode } : {})
    }, primary.status || 503);
  }
};
