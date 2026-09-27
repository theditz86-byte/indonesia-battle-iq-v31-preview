import fs from "node:fs"

function read(path){return fs.readFileSync(path,"utf8")}
function write(path,content){fs.writeFileSync(path,content)}
function mustReplace(s,from,to,label){if(!s.includes(from))throw new Error(`Missing patch target: ${label}`);return s.replace(from,to)}

// Ranked uses the dedicated native-20 backend. Overview/registration remain on battle-public.
{
  const path="app/battle-test/page.tsx"
  let s=read(path)
  s=mustReplace(s,
    'const SUBMIT20_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-submit20"',
    'const SUBMIT20_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-submit20"\nconst RANKED_START_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-ranked-start"',
    "ranked start constant")
  s=mustReplace(s,
`async function callSubmit(body: Record<string, unknown>, token: string) {`,
`async function callRankedStart(token: string) {
  const response = await fetch(RANKED_START_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Battle-Token": token },
    body: JSON.stringify({ action: "start" }),
    cache: "no-store",
  })
  const data = await response.json().catch(() => ({}))
  return { response, data }
}

async function callSubmit(body: Record<string, unknown>, token: string) {`,
    "ranked start helper")
  s=mustReplace(s,
    'const { response, data } = await callBattle({ action: "start" }, rawToken)',
    'const { response, data } = await callRankedStart(rawToken)',
    "ranked start call")
  write(path,s)
}

// Participant payment page is intentionally disabled during Open Beta.
write("app/payment/page.tsx",`"use client"

import { ArrowLeft, BrainCircuit, ShieldCheck, Swords } from "lucide-react"

export default function PaymentPage() {
  return <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,.14),transparent_32rem),linear-gradient(180deg,#020817,#07142f)] px-4 py-10 text-white sm:px-6">
    <div className="mx-auto max-w-3xl">
      <a href="/battle" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4"/>Kembali</a>
      <section className="overflow-hidden rounded-[32px] border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(16,185,129,.12),rgba(7,20,47,.9)_50%,rgba(34,211,238,.09))] p-7 shadow-2xl sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.16em] text-emerald-200"><ShieldCheck className="h-4 w-4"/>Open Beta Gratis</div>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Pembayaran sementara dinonaktifkan.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-300">Selama Open Beta, Ranked Battle, latihan TIU, simulasi, dan laporan hasil yang tersedia dapat digunakan tanpa membeli kredit. Semua pemain mendapat aturan Ranked yang sama.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <a href="/battle-test" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 font-black"><Swords className="h-5 w-5"/>Masuk Ranked Battle</a>
          <a href="/latihan-skd" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3.5 font-black text-cyan-100"><BrainCircuit className="h-5 w-5"/>Latihan SKD & TIU</a>
        </div>
        <p className="mt-6 text-xs leading-5 text-slate-500">Fitur pembayaran disimpan untuk fase produk berikutnya, tetapi tidak menerima transaksi baru selama Open Beta.</p>
      </section>
    </div>
  </main>
}
`)

// TIU: add figural + client-side resume for the same active server session.
{
  const path="components/tiu-practice.tsx"
  let s=read(path)
  s=mustReplace(s,'type Category = "numerik" | "logika" | "verbal"','type Category = "numerik" | "logika" | "verbal" | "figural"',"TIU category type")
  s=mustReplace(s,
`  verbal: { title:"Verbal", short:"Verbal", description:"Analogi konsep serta kosakata terpilih tanpa mendominasi porsi latihan." },
}`,
`  verbal: { title:"Verbal", short:"Verbal", description:"Analogi konsep serta kosakata terpilih tanpa mendominasi porsi latihan." },
  figural: { title:"Figural & Spasial", short:"Figural", description:"Rotasi, arah, pola bentuk, simetri, matriks visual, dan penalaran spasial." },
}`,
"figural metadata")
  s=s.replace('if (value === "numerik" || value === "logika" || value === "verbal") return categoryMeta[value].title','if (value === "numerik" || value === "logika" || value === "verbal" || value === "figural") return categoryMeta[value].title')
  s=s.replace('if (raw === "numerik" || raw === "logika" || raw === "verbal") setCategory(raw)','if (raw === "numerik" || raw === "logika" || raw === "verbal" || raw === "figural") setCategory(raw)')
  s=mustReplace(s,
`  const autoSubmitRef = useRef(false)
`,
`  const autoSubmitRef = useRef(false)
  const progressKey = (id:string) => \`alzava.tiu.progress.\${id}\`

  function restoreLocalProgress(id:string,count:number) {
    try {
      const raw=window.localStorage.getItem(progressKey(id)); if(!raw) return null
      const parsed=JSON.parse(raw)
      const saved=Array.isArray(parsed?.answers)?parsed.answers:[]
      if(saved.length!==count) return null
      const answers=saved.map((v:unknown)=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<=4?Number(v):null)
      const index=Number.isInteger(parsed?.index)&&parsed.index>=0&&parsed.index<count?parsed.index:0
      return {answers,index}
    } catch { return null }
  }
`,
"local resume helpers")
  s=mustReplace(s,
`      setSession(s)
      setAnswers(Array(s.question_count).fill(null))
      setIndex(0)
`,
`      setSession(s)
      const restored = s.resumed ? restoreLocalProgress(s.id,s.question_count) : null
      setAnswers(restored?.answers || Array(s.question_count).fill(null))
      setIndex(restored?.index || 0)
`,
"restore active TIU session")
  s=mustReplace(s,
`  function choose(option:number) {
    if (!session || result || busy) return
    setAnswers(old=>old.map((value,i)=>i===index?option:value))
  }
`,
`  function choose(option:number) {
    if (!session || result || busy) return
    setAnswers(old=>old.map((value,i)=>i===index?option:value))
  }

  useEffect(()=>{
    if(!session || !answers.length) return
    try { window.localStorage.setItem(progressKey(session.id),JSON.stringify({answers,index,saved_at:Date.now()})) } catch {}
  },[session?.id,answers,index])
`,
"persist TIU progress")
  s=mustReplace(s,
`      setResult(data.result || null)
      setSession(null)
`,
`      setResult(data.result || null)
      try { window.localStorage.removeItem(progressKey(session.id)) } catch {}
      setSession(null)
`,
"clear TIU progress")
  write(path,s)
}

// SKD Hub: expose Figural training and reflect new simulation mix.
{
  const path="components/skd-hub.tsx"
  let s=read(path)
  s=s.replace('ArrowRight, BarChart3, BrainCircuit, Clock3, Construction, Flame, Sigma, Swords','ArrowRight, BarChart3, BrainCircuit, Clock3, Construction, Flame, Shapes, Sigma, Swords')
  s=s.replace('Asah kemampuan numerik, logika-analitis, dan verbal dengan sesi singkat sampai simulasi 35 soal.','Asah kemampuan numerik, logika-analitis, verbal, dan figural dengan sesi singkat sampai simulasi 35 soal.')
  s=mustReplace(s,
`        <a href="/simulasi-tiu" className="group rounded-[28px] border border-amber-300/15 bg-amber-300/[.055] p-6 transition hover:-translate-y-1 hover:border-amber-300/30 md:col-span-2 lg:col-span-1">`,
`        <a href="/latihan-tiu?category=figural" className="group rounded-[28px] border border-sky-300/15 bg-sky-300/[.05] p-6 transition hover:-translate-y-1 hover:border-sky-300/30"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-300/10"><Shapes className="h-6 w-6 text-sky-300"/></div><p className="mt-5 text-xs font-black uppercase tracking-[.16em] text-sky-300">10 Soal</p><h2 className="mt-2 text-2xl font-black">Figural & Spasial</h2><p className="mt-2 text-sm leading-6 text-slate-400">Rotasi, arah, pola bentuk, simetri, matriks visual, dan penalaran spasial.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-sky-200">Latihan Figural <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></span></a>
        <a href="/simulasi-tiu" className="group rounded-[28px] border border-amber-300/15 bg-amber-300/[.055] p-6 transition hover:-translate-y-1 hover:border-amber-300/30 md:col-span-2 lg:col-span-1">`,
"figural SKD card")
  write(path,s)
}

// SEO copy includes figural.
{
  const path="app/latihan-tiu/page.tsx"
  let s=read(path)
  s=s.replace('Numerik, Logika & Verbal','Numerik, Logika, Verbal & Figural')
  s=s.replace('soal numerik, logika analitis, dan verbal','soal numerik, logika analitis, verbal, dan figural')
  s=s.replace('"tes intelegensia umum"','"latihan figural CPNS","tes intelegensia umum"')
  write(path,s)
}

// Analytics route mapping for the SKD/TIU funnel.
{
  const path="components/growth-tracker.tsx"
  let s=read(path)
  s=mustReplace(s,
`  if (path.startsWith("/daily-training")) return "page_daily_training"
  if (path.startsWith("/result")) return "page_result"`,
`  if (path.startsWith("/daily-training")) return "page_daily_training"
  if (path.startsWith("/latihan-skd")) return "page_latihan_skd"
  if (path.startsWith("/latihan-tiu")) return "page_latihan_tiu"
  if (path.startsWith("/simulasi-tiu")) return "page_simulasi_tiu"
  if (path.startsWith("/result")) return "page_result"`,
"growth page routes")
  s=mustReplace(s,
`      else if (href.startsWith("/daily-training")) void send("click_daily_training", { href })
      else if (href.startsWith("/pvp")) void send("click_pvp", { href })`,
`      else if (href.startsWith("/daily-training")) void send("click_daily_training", { href })
      else if (href.startsWith("/latihan-skd")) void send("click_latihan_skd", { href })
      else if (href.startsWith("/latihan-tiu")) void send("click_latihan_tiu", { href })
      else if (href.startsWith("/simulasi-tiu")) void send("click_simulasi_tiu", { href })
      else if (href.startsWith("/pvp")) void send("click_pvp", { href })`,
"growth click routes")
  write(path,s)
}

// CI policy tests.
fs.mkdirSync("tests",{recursive:true})
write("tests/open-beta-policy.test.mjs",`import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
const read=(p)=>fs.readFileSync(p,"utf8")

test("Ranked uses dedicated native-20 start backend",()=>{
  const s=read("app/battle-test/page.tsx")
  assert.match(s,/battle-ranked-start/)
  assert.doesNotMatch(s,/callBattle\(\{ action: "start" \}/)
})

test("Open Beta participant payment page has no QRIS purchase flow",()=>{
  const s=read("app/payment/page.tsx")
  assert.match(s,/Open Beta Gratis/)
  assert.match(s,/Pembayaran sementara dinonaktifkan/)
  assert.doesNotMatch(s,/qris-alzava|Kirim Bukti|Rp5\.000/)
})

test("TIU exposes figural and local resume",()=>{
  const s=read("components/tiu-practice.tsx")
  assert.match(s,/\| "figural"/)
  assert.match(s,/alzava\.tiu\.progress/)
})

test("Growth tracker covers SKD and TIU funnel",()=>{
  const s=read("components/growth-tracker.tsx")
  for(const event of ["page_latihan_skd","page_latihan_tiu","page_simulasi_tiu","click_latihan_skd","click_latihan_tiu","click_simulasi_tiu"]) assert.match(s,new RegExp(event))
})
`)

// Make tests part of the standard quality gate.
{
  const path="package.json"
  const pkg=JSON.parse(read(path))
  pkg.scripts.test="node --test tests/*.test.mjs"
  pkg.scripts.check="npm run test && npm run typecheck && npm run build"
  write(path,JSON.stringify(pkg,null,2)+"\n")
}

console.log("Open Beta stabilization patch applied")
