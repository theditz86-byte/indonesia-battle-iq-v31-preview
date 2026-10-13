import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const API_BASE = "https://alzava-ai.theditz86.workers.dev/api/ask";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function allowedOrigin(origin: string) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return (url.protocol === "https:" && (
      url.hostname === "alzava-battle-iq.pages.dev" ||
      url.hostname.endsWith(".alzava-battle-iq.pages.dev")
    )) || (url.protocol === "http:" && ["localhost","127.0.0.1"].includes(url.hostname));
  } catch { return false; }
}
function reply(data: unknown, status: number, origin: string) {
  return new Response(status === 204 ? null : JSON.stringify(data), {
    status, headers: {
      "Content-Type":"application/json; charset=utf-8",
      "Cache-Control":"no-store",
      "X-Content-Type-Options":"nosniff",
      "Vary":"Origin",
      ...(allowedOrigin(origin) ? {
        "Access-Control-Allow-Origin":origin,
        "Access-Control-Allow-Methods":"POST, OPTIONS",
        "Access-Control-Allow-Headers":"Content-Type, X-Battle-Token",
        "Access-Control-Max-Age":"300"
      } : {})
    }
  });
}
async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,"0")).join("");
}
async function rpc(name: string, tokenHash: string): Promise<{ok?:boolean;reason?:string;remaining?:number}> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method:"POST",
    headers:{"Content-Type":"application/json","apikey":SERVICE_KEY,"Authorization":`Bearer ${SERVICE_KEY}`},
    body:JSON.stringify({p_token_hash:tokenHash}),
    signal:AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error("Quota service unavailable");
  return name.endsWith("refund") ? {} : await response.json();
}
Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  if (!allowedOrigin(origin)) return reply({error:"Origin not allowed"},403,origin);
  if (req.method === "OPTIONS") return reply({},204,origin);
  if (req.method !== "POST") return reply({error:"Method not allowed"},405,origin);

  // Fail closed: no unverified or anonymous calls to the shared free-tier key.
  const token = (req.headers.get("X-Battle-Token") || "").trim();
  if (token.length < 24 || token.length > 512) return reply({error:"Silakan masuk ke akun ALZAVA terlebih dahulu."},401,origin);
  const gatewayToken = Deno.env.get("GATEWAY_ADMIN_TOKEN");
  if (!gatewayToken || !SERVICE_KEY || !SUPABASE_URL) {
    return reply({error:"AI Coach sedang disiapkan. Coba lagi nanti."},503,origin);
  }

  const len = Number(req.headers.get("content-length") || 0);
  if (len > 2500) return reply({error:"Pesan terlalu panjang."},413,origin);
  let body: {prompt?:unknown};
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).byteLength > 2500) return reply({error:"Pesan terlalu panjang."},413,origin);
    body = JSON.parse(raw);
  } catch { return reply({error:"Format pertanyaan tidak valid."},400,origin); }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt || prompt.length > 650) return reply({error:"Pertanyaan maksimal 650 karakter."},400,origin);

  let tokenHash = "";
  let claimed = false;
  try {
    tokenHash = await digest(token);
    const quota = await rpc("alzava_ai_claim",tokenHash);
    if (!quota.ok) {
      if (quota.reason === "unauthorized") return reply({error:"Sesi telah berakhir. Silakan masuk kembali."},401,origin);
      if (quota.reason === "daily_limit") return reply({error:"Jatah 3 pertanyaan AI hari ini sudah digunakan. Kembali besok ya."},429,origin);
      return reply({error:"Kuota AI gratis hari ini sudah habis. Coba lagi besok."},429,origin);
    }
    claimed = true;

    const instruction = [
      "Kamu ALZAVA AI Coach, tutor persiapan SKD CASN, TIU, TWK, TKP dan penalaran.",
      "Jawab dalam bahasa Indonesia, jelas, bertahap, singkat dan akurat.",
      "Bila soal ambigu, sebutkan ambiguitasnya. Jangan mengarang aturan seleksi atau kunci jawaban.",
      "Jangan membantu membocorkan jawaban ujian/ranked battle yang sedang berlangsung.",
      "Gunakan contoh latihan jika relevan, bukan jawaban langsung untuk kompetisi aktif.",
      "Jangan menyatakan punya akses ke riwayat peserta bila data tidak diberikan.",
      "Pertanyaan peserta:"
    ].join("\n");
    const response = await fetch(API_BASE, {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${gatewayToken}`},
      body:JSON.stringify({prompt:`${instruction}\n${prompt}`}),
      signal:AbortSignal.timeout(29000)
    });
    const result = await response.json().catch(()=>({}));
    if (!response.ok || result.ok !== true || typeof result.answer !== "string") {
      throw new Error(response.status === 429 ? "quota" : "gateway");
    }
    return reply({ok:true,answer:result.answer.slice(0,6000),remaining:quota.remaining},200,origin);
  } catch (e) {
    if (claimed && tokenHash) {
      try { await rpc("alzava_ai_refund", tokenHash); } catch { /* return safe failure */ }
    }
    return reply({
      error:e instanceof Error && e.message==="quota"
        ? "Kuota Gemini gratis sedang habis. Coba lagi nanti."
        : "AI Coach sementara belum bisa menjawab. Coba kembali nanti."
    },503,origin);
  }
});
