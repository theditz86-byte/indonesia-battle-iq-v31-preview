import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import ts from "typescript";

// Run the real Supabase Edge Function through TypeScript transpilation with
// mocked services. This catches runtime scope errors not detected by typecheck.
const sourcePath = "supabase/functions/alzava-ai-coach/index.ts";
const source = fs.readFileSync(sourcePath, "utf8")
  .replace(/^import "jsr:@supabase\/functions-js\/edge-runtime\.d\.ts";\s*/, "");
const js = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.None
  }
}).outputText;

async function exercise({ provider = "gemini", gatewayFails = false, limited = false } = {}) {
  let handler = null;
  const calls = { claim: 0, refund: 0, gateway: 0 };
  const fakeFetch = async (input) => {
    const url = String(input);
    if (url.includes("/rest/v1/rpc/alzava_ai_claim")) {
      calls.claim++;
      return Response.json(limited
        ? { ok: false, reason: "daily_limit" }
        : { ok: true, remaining: 2 });
    }
    if (url.includes("/rest/v1/rpc/alzava_ai_refund")) {
      calls.refund++;
      return Response.json({});
    }
    if (url.includes("/api/ask")) {
      calls.gateway++;
      return Response.json(gatewayFails
        ? { error: "upstream failed", code: "AI_DOWN" }
        : { ok: true, answer: "Halo! Ada yang bisa saya bantu?", provider },
        { status: gatewayFails ? 502 : 200 });
    }
    throw new Error("Unexpected destination: " + url);
  };
  const sandbox = {
    Deno: {
      env: { get: (key) => ({
        SUPABASE_URL: "https://test.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
        GATEWAY_ADMIN_TOKEN: "test-gateway-secret"
      })[key] || "" },
      serve: fn => { handler = fn; }
    },
    crypto: webcrypto,
    fetch: fakeFetch,
    TextEncoder,
    Response,
    AbortSignal,
    URL,
    setTimeout,
    clearTimeout,
    console: { info() {}, error() {} }
  };
  vm.runInNewContext(js, sandbox, { filename: sourcePath, timeout: 1000 });
  assert.equal(typeof handler, "function");
  const response = await handler(new Request("https://test.supabase.co/functions/v1/alzava-ai-coach", {
    method: "POST",
    headers: {
      Origin: "https://alzava-battle-iq.pages.dev",
      "Content-Type": "application/json",
      "X-Battle-Token": "a".repeat(48)
    },
    body: JSON.stringify({ prompt: "Halo!" })
  }));
  return { response, body: await response.json(), calls };
}

test("Gemini success response does not throw a result scope ReferenceError", async () => {
  const { response, body, calls } = await exercise();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.provider, "gemini");
  assert.equal(body.remaining, 2);
  assert.equal(calls.refund, 0);
});

test("Workers AI fallback success is returned with correct provider", async () => {
  const { response, body, calls } = await exercise({ provider: "workers-ai" });
  assert.equal(response.status, 200);
  assert.equal(body.provider, "workers-ai");
  assert.match(body.answer, /Halo/);
  assert.equal(calls.refund, 0);
});

test("Upstream failure refunds the existing cloud quota", async () => {
  const { response, calls } = await exercise({ gatewayFails: true });
  assert.equal(response.status, 503);
  assert.equal(calls.refund, 1);
});

test("Daily-limit denial never calls the AI gateway", async () => {
  const { response, calls } = await exercise({ limited: true });
  assert.equal(response.status, 429);
  assert.equal(calls.gateway, 0);
});
