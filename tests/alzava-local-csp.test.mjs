import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

test("Existing page-level CSP remains strict while the local Worker has a scoped exception", () => {
  const config = readFileSync("public/_headers", "utf8");
  const globalRule = config.split("# The local-model Web Worker")[0];
  const workerRule = config.split("/ai/alzava-local-worker.mjs")[1];
  assert.match(globalRule, /script-src 'self' 'unsafe-inline'/);
  assert.match(globalRule, /connect-src 'self' https:\/\/efndozplpwyemzgqfnep.supabase.co/);
  assert.doesNotMatch(globalRule, /https:\/\/esm.run|https:\/\/huggingface.co/);
  assert.ok(workerRule);
  assert.match(workerRule, /! Content-Security-Policy/);
  assert.match(workerRule, /Content-Security-Policy: default-src 'none';/);
  assert.match(workerRule, /script-src 'self' https:\/\/esm.run/);
  assert.match(workerRule, /connect-src 'self'.*https:\/\/huggingface.co/);
});

test("Local model Worker never sends raw inference error or prompt through its diagnostic channel", async () => {
  const code = readFileSync("public/ai/alzava-local-worker.mjs", "utf8");
  let handler;
  const messages = [];
  const scope = {
    navigator: {},
    postMessage: data => messages.push(data),
    addEventListener: (event, callback) => { if (event === "message") handler = callback; }
  };
  vm.runInNewContext(code, { self: scope }, { timeout: 1000 });
  assert.equal(typeof handler, "function");
  await handler({ data: { id: 1, type: "init" } });
  await handler({ data: { id: 2, type: "ask", question: "Rahasia pengunjung" } });
  assert.equal(messages[0].code, "WEBGPU_UNAVAILABLE");
  assert.equal(messages[1].code, "MODEL_INFERENCE_FAILED");
  assert.ok(messages.every(item => !JSON.stringify(item).includes("Rahasia pengunjung")));
});
