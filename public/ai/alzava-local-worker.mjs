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
      let lib;
      try {
        lib = await import(LIBRARY);
      } catch {
        throw new Error("LOCAL_LIBRARY_LOAD_FAILED");
      }
      if (typeof lib.CreateMLCEngine !== "function") {
        throw new Error("LOCAL_LIBRARY_API_UNAVAILABLE");
      }
      self.postMessage({ id, type: "progress", progress: "Menyiapkan model dan memori GPU..." });
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
  } catch (cause) {
    // Intentionally emit only an allowlisted code, never the user's prompt,
    // a full stack trace, account token, or arbitrary upstream exception.
    const message = cause instanceof Error ? cause.message : "";
    const code = message === "LOCAL_LIBRARY_LOAD_FAILED" ? "LIBRARY_BLOCKED"
      : message === "LOCAL_LIBRARY_API_UNAVAILABLE" ? "LIBRARY_INCOMPATIBLE"
      : /WebGPU/i.test(message) ? "WEBGPU_UNAVAILABLE"
      : /memory|allocation|out of memory|GPUDeviceLost|device lost|limits/i.test(message) ? "GPU_LIMIT"
      : /fetch|network|download|cache|HTTP/i.test(message) ? "MODEL_DOWNLOAD_FAILED"
      : type === "init" ? "MODEL_INIT_FAILED"
      : "MODEL_INFERENCE_FAILED";
    const explanations = {
      LIBRARY_BLOCKED: "Pustaka AI Lokal tidak dapat diunduh. Periksa koneksi internet, pemblokir konten, dan kebijakan keamanan browser.",
      LIBRARY_INCOMPATIBLE: "Pustaka model AI Lokal tidak sesuai. Silakan gunakan AI Online.",
      WEBGPU_UNAVAILABLE: "WebGPU tidak tersedia di browser ini. Coba perbarui Chrome/Safari atau gunakan AI Online.",
      GPU_LIMIT: "GPU atau memori perangkat tidak cukup untuk AI Lokal. Gunakan AI Online.",
      MODEL_DOWNLOAD_FAILED: "Unduhan model AI Lokal gagal. Coba koneksi Wi-Fi yang stabil atau gunakan AI Online.",
      MODEL_INIT_FAILED: "Model AI Lokal belum bisa disiapkan pada perangkat ini. Gunakan AI Online.",
      MODEL_INFERENCE_FAILED: "AI Lokal gagal membuat jawaban. Coba buka ulang panel atau gunakan AI Online."
    };
    self.postMessage({ id, type: "error", code, error: explanations[code] });
  }
});
