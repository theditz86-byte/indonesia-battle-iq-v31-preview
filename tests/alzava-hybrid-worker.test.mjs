import test from "node:test";
import assert from "node:assert/strict";
import worker from "../cloudflare/alzava-ai-worker-hybrid-v1.mjs";

const url = "https://alzava-ai.test/api/ask";
const defaults = () => ({
  GEMINI_API_KEY: "not-a-real-api-key",
  GATEWAY_ADMIN_TOKEN: "test-secret-token"
});
function request(prompt = "Halo", token = "test-secret-token") {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ prompt })
  });
}
function fakeJson(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
}
async function mockFetch(run) {
  const before = globalThis.fetch;
  try { return await run(); }
  finally { globalThis.fetch = before; }
}

test("Rejects unauthenticated calls before any Gemini or Workers AI invocation", async () => {
  await mockFetch(async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; throw Error("must not call Gemini"); };
    const env = { ...defaults(), AI_FALLBACK_ENABLED: "true", AI: { run: async () => { calls++; } } };
    const r = await worker.fetch(request("Halo", "wrong-token"), env);
    assert.equal(r.status, 401);
    assert.equal(calls, 0);
  });
});

test("Healthy route does not expose secrets and fallback is off without opt-in", async () => {
  const r = await worker.fetch(new Request("https://alzava-ai.test/health"), defaults());
  assert.equal(r.status, 200);
  const text = await r.text();
  assert.match(text, /gemini-3-flash-preview/);
  assert.doesNotMatch(text, /test-secret-token|not-a-real-api-key/);
  assert.equal(JSON.parse(text).workersAiFallbackReady, false);
});

test("Gemini answers normally without Workers AI binding", async () => {
  await mockFetch(async () => {
    let sentModel = "";
    globalThis.fetch = async (endpoint) => {
      sentModel = String(endpoint);
      return fakeJson({ candidates: [{ content: { parts: [{ text: "Halo juga!" }] } }] });
    };
    const r = await worker.fetch(request(), defaults());
    const body = await r.json();
    assert.equal(r.status, 200);
    assert.equal(body.provider, "gemini");
    assert.equal(body.answer, "Halo juga!");
    assert.match(sentModel, /gemini-3-flash-preview/);
  });
});

test("Gemini free tier precondition failure falls back to Workers AI only when enabled", async () => {
  await mockFetch(async () => {
    globalThis.fetch = async () => fakeJson({ error: { status: "FAILED_PRECONDITION" } }, 400);
    let aiCalls = 0;
    const env = {
      ...defaults(),
      AI_FALLBACK_ENABLED: "true",
      AI: { run: async (model, options) => {
        aiCalls++;
        assert.match(model, /llama-3.2-3b/);
        assert.equal(options.messages[1].content, "Halo");
        return { response: "Halo dari cadangan." };
      } }
    };
    const r = await worker.fetch(request(), env);
    const body = await r.json();
    assert.equal(r.status, 200);
    assert.equal(body.provider, "workers-ai");
    assert.equal(body.usedFallback, true);
    assert.equal(aiCalls, 1);
  });
});

test("Non-retriable Gemini 403 is not sent to fallback", async () => {
  await mockFetch(async () => {
    globalThis.fetch = async () => fakeJson({ error: { status: "PERMISSION_DENIED" } }, 403);
    let aiCalls = 0;
    const env = { ...defaults(), AI_FALLBACK_ENABLED: "true", AI: { run: async () => { aiCalls++; } } };
    const r = await worker.fetch(request(), env);
    assert.notEqual(r.status, 200);
    assert.equal(aiCalls, 0);
  });
});

test("Input is validated before invoking paid or free inference", async () => {
  await mockFetch(async () => {
    globalThis.fetch = async () => { throw Error("unexpected"); };
    const huge = "X".repeat(7000);
    const r = await worker.fetch(request(huge), defaults());
    assert.equal(r.status, 400);
  });
});

test("Workers AI fallback is disabled until explicit opt-in even when binding exists", async () => {
  await mockFetch(async () => {
    globalThis.fetch = async () => fakeJson({ error: { status: "RESOURCE_EXHAUSTED" } }, 429);
    let calls = 0;
    const env = { ...defaults(), AI: { run: async () => { calls++; } } };
    const r = await worker.fetch(request(), env);
    assert.equal(r.status, 429);
    assert.equal(calls, 0);
  });
});
