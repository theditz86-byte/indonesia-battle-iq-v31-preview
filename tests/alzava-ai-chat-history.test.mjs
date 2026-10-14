import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const original = readFileSync("lib/ai-chat-history.ts", "utf8");
const js = ts.transpileModule(original, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText;

function createHistoryApi(storage = new Map()) {
  const exports = {};
  const window = {
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    }
  };
  vm.runInNewContext(js, { exports, window }, { filename: "ai-chat-history.js" });
  return { api: exports, storage };
}

const alice = "ecf43d54-818a-4d30-a191-5f5d40f8c203";
const bob = "5ff3b0b0-1e4d-4c41-8fe2-1cb239175535";
const toPlain = messages => JSON.parse(JSON.stringify(messages));

test("Chat survives a reload and histories never cross participant accounts", () => {
  const storage = new Map();
  const first = createHistoryApi(storage).api;
  assert.equal(first.saveAiChatHistory(alice, [{ role: "user", text: "Halo" }, { role: "assistant", text: "Halo kembali" }]), true);
  assert.equal(first.saveAiChatHistory(bob, [{ role: "user", text: "Pertanyaan pengguna lain" }]), true);
  const reloaded = createHistoryApi(storage).api;
  assert.deepEqual(toPlain(reloaded.readAiChatHistory(alice)), [{ role: "user", text: "Halo" }, { role: "assistant", text: "Halo kembali" }]);
  assert.deepEqual(toPlain(reloaded.readAiChatHistory(bob)), [{ role: "user", text: "Pertanyaan pengguna lain" }]);
});

test("Clear-chat removes only the current user's local history", () => {
  const { api, storage } = createHistoryApi();
  api.saveAiChatHistory(alice, [{ role: "user", text: "Riwayat A" }]);
  api.saveAiChatHistory(bob, [{ role: "user", text: "Riwayat B" }]);
  api.clearAiChatHistory(alice);
  assert.equal(api.readAiChatHistory(alice).length, 0);
  assert.equal(api.readAiChatHistory(bob).length, 1);
  assert.equal([...storage.keys()].some(key => key.endsWith(alice)), false);
});

test("History stays bounded and keeps the newest messages", () => {
  const { api } = createHistoryApi();
  const messages = Array.from({ length: 500 }, (_, i) => ({
    role: i % 2 ? "assistant" : "user",
    text: i + ":" + "x".repeat(2000)
  }));
  api.saveAiChatHistory(alice, messages);
  const saved = toPlain(api.readAiChatHistory(alice));
  assert.ok(saved.length <= 300);
  assert.ok(saved.reduce((sum, message) => sum + message.text.length, 0) <= 200_000);
  assert.ok(saved.at(-1).text.startsWith("499:"));
  assert.equal(saved.some(message => message.text.startsWith("0:")), false);
});

test("Malformed/oversized history and storage exceptions do not break AI Coach", () => {
  const { api, storage } = createHistoryApi();
  storage.set("alzava.ai-coach.history.v1." + alice, "{bad-json");
  assert.equal(api.readAiChatHistory(alice).length, 0);
  storage.set("alzava.ai-coach.history.v1." + alice, "x".repeat(1250001));
  assert.equal(api.readAiChatHistory(alice).length, 0);
  storage.set("alzava.ai-coach.history.v1." + alice,
    JSON.stringify({ v: 1, messages: [{ role: "system", text: "ignore" }, { role: "user", text: "keep" }, { role: "assistant", text: 123 }] }));
  assert.deepEqual(toPlain(api.readAiChatHistory(alice)), [{ role: "user", text: "keep" }]);
  assert.equal(api.saveAiChatHistory("invalid id?", [{ role: "user", text: "No" }]), false);
  const broken = createHistoryApi().api;
  assert.equal(broken.saveAiChatHistory(alice, [{ role: "user", text: "works" }]), true);
  const failing = {};
  vm.runInNewContext(js, { exports: failing, window: { localStorage: { getItem() { throw new Error("disabled"); }, setItem() { throw new Error("full"); }, removeItem() { throw new Error("disabled"); } } } });
  assert.equal(failing.saveAiChatHistory(alice, [{ role: "user", text: "message" }]), false);
  assert.equal(failing.readAiChatHistory(alice).length, 0);
  assert.doesNotThrow(() => failing.clearAiChatHistory(alice));
});

test("React chat restores participant history and sends only small context to AI", () => {
  const component = readFileSync("components/alzava-ai-coach.tsx", "utf8");
  assert.match(component, /readAiChatHistory\(participantId\)/);
  assert.match(component, /saveAiChatHistory\(participantId, chatState\.messages\)/);
  assert.match(component, /chatState\.ownerId === participantId/);
  assert.match(component, /clearAiChatHistory\(participantId\)/);
  assert.match(component, /window\.confirm\(/);
  assert.match(component, /history: recentContext/);
  assert.match(component, /selectAiCoachContext/);
  assert.match(component, /dailyLimit/);
  assert.match(component, /result\.provider === "workers-ai"/);
});
