// Sandboxed execution context (dedicated Worker): no DOM or localStorage access.
// Import WebLLM only on explicit user activation. No Gemini API keys or auth tokens.
const MODEL = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
const LIBRARY = "https://esm.run/@mlc-ai/web-llm@0.2.85";
let enginePromise = null;

async function init(id) {
  if (!self.navigator?.gpu) throw new Error("WebGPU belum tersedia di Worker browser ini.");
  if (!enginePromise) {
    enginePromise = (async () => {
      self.postMessage({ id, type: "progress", progress: "Memuat AI Lokal..." });
      const lib = await import(LIBRARY);
      return lib.CreateMLCEngine(MODEL, {
        initProgressCallback: report => {
          if (typeof report?.text === "string") {
            self.postMessage({ id, type: "progress", progress: report.text.slice(0, 160) });
          }
        }
      });
    })();
  }
  try {
    await enginePromise;
    self.postMessage({ id, type: "done" });
  } catch (e) {
    enginePromise = null;
    throw e;
  }
}

async function ask(id, question, history) {
  if (!enginePromise) throw new Error("AI Lokal belum diaktifkan.");
  const engine = await enginePromise;
  const safeHistory = (Array.isArray(history) ? history : [])
    .slice(-6)
    .filter(x => x && (x.role === "user" || x.role === "assistant") && typeof x.text === "string")
    .map(x => ({ role: x.role, content: x.text.slice(0, 850) }));
  const reply = await engine.chat.completions.create({
    messages: [
      { role: "system", content: "Kamu ALZAVA AI, asisten belajar berbahasa Indonesia. Jawab berbagai pertanyaan. ALZAVA dikembangkan Aditaka, sebutkan hanya jika ditanya. Jangan memberi bocoran kompetisi aktif." },
      ...safeHistory,
      { role: "user", content: String(question).slice(0, 650) }
    ],
    temperature: 0.6,
    max_tokens: 360
  });
  const answer = reply?.choices?.[0]?.message?.content;
  if (typeof answer !== "string" || !answer.trim()) throw new Error("Model belum menghasilkan jawaban.");
  self.postMessage({ id, type: "done", answer: answer.slice(0, 6000) });
}

self.addEventListener("message", async event => {
  const { id, type, question, history } = event.data || {};
  if (!Number.isSafeInteger(id) || id < 1) return;
  try {
    if (type === "init") await init(id);
    else if (type === "ask") await ask(id, question, history);
    else throw new Error("Perintah AI Lokal tidak dikenal.");
  } catch {
    // No prompt, account token, or raw stack trace is sent to the UI.
    self.postMessage({ id, type: "error", error: "AI Lokal gagal memproses permintaan. Periksa dukungan WebGPU dan memori GPU." });
  }
});
