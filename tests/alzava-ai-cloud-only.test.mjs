import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const ui = readFileSync("components/alzava-ai-coach.tsx", "utf8");
const headers = readFileSync("public/_headers", "utf8");

test("AI Coach provides a single cloud chat interface, with no broken AI Lokal mode", () => {
  assert.doesNotMatch(ui, /AI Lokal|localStatus|localEngineRef|canRunLocal|WebGPU|WebLLM|webpackIgnore|setMode/);
  assert.match(ui, /X-Battle-Token/);
  assert.match(ui, /remaining === 0/);
  assert.match(ui, /result\.provider === "workers-ai"/);
  assert.match(ui, /\`Sisa \$\{remaining\} dari 3 pertanyaan hari ini\`/);
});

test("No dormant browser AI model script or WebLLM CSP exception remains", () => {
  assert.equal(existsSync("public/ai/alzava-local-engine.mjs"), false);
  assert.equal(existsSync("public/ai/alzava-local-worker.mjs"), false);
  assert.doesNotMatch(headers, /esm\.run|huggingface\.co|wasm-unsafe-eval|alzava-local-worker/);
  assert.match(headers, /connect-src 'self' https:\/\/efndozplpwyemzgqfnep\.supabase\.co/);
});

test("Hybrid Cloudflare gateway and quota remain supported", () => {
  const gateway = readFileSync("cloudflare/alzava-ai-worker-hybrid-v1.mjs", "utf8");
  const backend = readFileSync("supabase/functions/alzava-ai-coach/index.ts", "utf8");
  assert.match(gateway, /GEMINI_API_KEY/);
  assert.match(gateway, /AI_FALLBACK_ENABLED/);
  assert.match(gateway, /env\.AI\.run/);
  assert.match(backend, /alzava_ai_claim/);
  assert.match(backend, /alzava_ai_refund/);
});
