import test from "node:test";
import assert from "node:assert/strict";
import { canRunLocal, warmupLocal, askLocal } from "../public/ai/alzava-local-engine.mjs";

test("Local AI is unavailable without WebGPU in a headless Node test", async () => {
  assert.equal(await canRunLocal(), false);
});

test("Local AI never calls a cloud API when device is unsupported", async () => {
  await assert.rejects(warmupLocal(), /WebGPU/);
});

test("Local model must be explicitly loaded before a chat request", async () => {
  await assert.rejects(askLocal("Halo"), /belum siap/);
});
