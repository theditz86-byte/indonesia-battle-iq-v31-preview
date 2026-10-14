// ALZAVA Local AI (opt-in). Imported ONLY when participant chooses Local AI.
// WebLLM is downloaded from a pinned CDN package; model weights are fetched on demand.
// All inference and prompt history stay in the participant's browser.
const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
const WEBLLM_CDN = "https://esm.run/@mlc-ai/web-llm@0.2.85";
let enginePromise = null;
let currentEngine = null;

export async function canRunLocal() {
  if (typeof navigator === "undefined" || !navigator.gpu || !globalThis.isSecureContext) {
    return false;
  }
  try { return Boolean(await navigator.gpu.requestAdapter()); }
  catch { return false; }
}

export async function warmupLocal(onProgress = () => {}) {
  if (!await canRunLocal()) {
    throw new Error("Browser/perangkat belum mendukung WebGPU untuk AI Lokal. Gunakan AI Online.");
  }
  if (currentEngine) return;
  if (!enginePromise) {
    enginePromise = (async () => {
      onProgress("Memuat pustaka AI lokal...");
      const webllm = await import(WEBLLM_CDN);
      const engine = await webllm.CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (report) => onProgress(
          typeof report?.text === "string" ? report.text.slice(0, 160) : "Mengunduh model..."
        )
      });
      currentEngine = engine;
      onProgress("AI Lokal siap. Pertanyaan tidak dikirim ke server AI.");
    })();
  }
  try { await enginePromise; }
  catch (error) { enginePromise = null; currentEngine = null; throw error; }
}

export async function askLocal(question, history = []) {
  if (!currentEngine) throw new Error("AI Lokal belum siap. Aktifkan model terlebih dahulu.");
  const safeHistory = (Array.isArray(history) ? history : [])
    .slice(-6)
    .filter(item => item && ["user", "assistant"].includes(item.role) && typeof item.text === "string")
    .map(item => ({ role: item.role, content: item.text.slice(0, 850) }));
  const response = await currentEngine.chat.completions.create({
    messages: [
      { role: "system", content: "Kamu ALZAVA AI, asisten belajar berbahasa Indonesia. Jawab pertanyaan umum dengan singkat dan akurat. ALZAVA dikembangkan Aditaka, sebutkan hanya jika ditanya. Jangan memberi bocoran kompetisi aktif." },
      ...safeHistory,
      { role: "user", content: String(question).slice(0, 650) }
    ],
    temperature: 0.6,
    max_tokens: 360
  });
  const answer = response?.choices?.[0]?.message?.content;
  if (typeof answer !== "string" || !answer.trim()) {
    throw new Error("AI Lokal belum dapat memberikan jawaban. Silakan coba lagi.");
  }
  return answer.trim().slice(0, 6000);
}
