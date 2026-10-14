// ALZAVA browser-local inference bridge.
// Heavy code, remote WebLLM import, and AI computations run in a dedicated Worker.
// Browser account credentials, cookies and localStorage are never passed to Worker.
let localWorker = null;
let ready = false;
let sequence = 0;
const pending = new Map();

function clearWorker(reason = "AI Lokal berhenti.") {
  try { localWorker?.terminate(); } catch { /* already terminated */ }
  localWorker = null;
  ready = false;
  for (const entry of pending.values()) entry.reject(new Error(reason));
  pending.clear();
}

function getWorker() {
  if (localWorker) return localWorker;
  if (typeof Worker === "undefined") throw new Error("Browser tidak mendukung Web Workers.");
  const instance = new Worker("/ai/alzava-local-worker.mjs", { type: "module", name: "alzava-local" });
  localWorker = instance;
  instance.onmessage = event => {
    const { id, type, progress, answer, error, code } = event.data || {};
    const entry = pending.get(id);
    if (!entry) return;
    if (type === "progress") { entry.onProgress?.(String(progress).slice(0, 160)); return; }
    pending.delete(id);
    if (type === "error") entry.reject(new Error(`[${String(code || "MODEL_ERROR").replace(/[^A-Z_]/g, "").slice(0, 40)}] ${String(error || "AI Lokal mengalami gangguan.").slice(0, 220)}`));
    else entry.resolve(answer);
  };
  instance.onerror = () => clearWorker("[WORKER_BLOCKED] Worker AI Lokal gagal dijalankan. Periksa pengaturan keamanan browser dan coba lagi.");
  instance.onmessageerror = () => clearWorker("Pesan AI Lokal tidak terbaca.");
  return instance;
}

function send(type, data = {}, onProgress) {
  const worker = getWorker();
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress });
    try { worker.postMessage({ id, type, ...data }); }
    catch (error) { pending.delete(id); reject(error); }
  });
}

export async function canRunLocal() {
  if (typeof navigator === "undefined" || !navigator.gpu || !globalThis.isSecureContext) return false;
  try { return Boolean(await navigator.gpu.requestAdapter()); }
  catch { return false; }
}

export async function warmupLocal(onProgress = () => {}) {
  if (!await canRunLocal()) throw new Error("Browser/perangkat belum mendukung WebGPU untuk AI Lokal. Gunakan AI Online.");
  if (ready) return;
  await send("init", {}, onProgress);
  ready = true;
}

export async function askLocal(question, history = []) {
  if (!ready || !localWorker) throw new Error("AI Lokal belum siap. Aktifkan model terlebih dahulu.");
  const safeHistory = (Array.isArray(history) ? history : [])
    .slice(-6)
    .filter(item => item && ["user", "assistant"].includes(item.role) && typeof item.text === "string")
    .map(item => ({ role: item.role, text: item.text.slice(0, 850) }));
  const answer = await send("ask", { question: String(question).slice(0, 650), history: safeHistory });
  if (typeof answer !== "string" || !answer.trim()) throw new Error("AI Lokal belum dapat memberikan jawaban.");
  return answer.trim().slice(0, 6000);
}

export function stopLocal() {
  clearWorker("AI Lokal dihentikan.");
}
