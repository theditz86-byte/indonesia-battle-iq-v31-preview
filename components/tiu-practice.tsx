"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, BarChart3, BrainCircuit, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Loader2, RotateCcw, Swords, Target, Trophy, XCircle } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"
import { trackGrowthEvent } from "@/components/growth-tracker"

const TIU_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-tiu"

type Mode = "category" | "simulation"
type Category = "numerik" | "logika" | "verbal" | "figural"

type Question = {
  id: string
  category: Category
  subcategory?: string
  prompt: string
  options: string[]
  difficulty?: string
}

type Review = Question & {
  selected_index?: number | null
  correct_index?: number
  correct?: boolean
  explanation?: string
}

type Session = {
  id: string
  mode: Mode
  category?: Category | null
  started_at?: string
  deadline_at: string
  question_count: number
  questions: Question[]
  resumed?: boolean
}

type Result = {
  session_id?: string
  mode?: Mode
  category?: Category | null
  correct_count?: number
  question_count?: number
  accuracy?: number
  score?: number
  max_score?: number
  breakdown?: Record<string,{correct?:number;total?:number;accuracy?:number}>
  review?: Review[]
  completed_at?: string
}

type HistoryRow = {
  id?: string
  mode?: Mode
  category?: Category | null
  correct_count?: number
  score?: number
  completed_at?: string
  breakdown?: Record<string,{accuracy?:number}>
}

const categoryMeta: Record<Category,{title:string;short:string;description:string}> = {
  numerik: { title:"Numerik", short:"Angka", description:"Deret, persentase, aljabar, perbandingan, kerja, peluang, dan aritmetika sosial." },
  logika: { title:"Logika & Analitis", short:"Logika", description:"Silogisme, logika kondisional, urutan, inferensi, dan penalaran kritis." },
  verbal: { title:"Verbal", short:"Verbal", description:"Analogi konsep serta kosakata terpilih tanpa mendominasi porsi latihan." },
  figural: { title:"Figural & Spasial", short:"Figural", description:"Rotasi, arah, pola bentuk, simetri, matriks visual, dan penalaran spasial." },
}

async function callTiu(body: Record<string,unknown>) {
  const token = getParticipantToken()
  if (!token) throw new Error("participant_required")
  const response = await fetch(TIU_API, {
    method: "POST",
    headers: { "Content-Type":"application/json", "X-Battle-Token":token },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || "Latihan TIU belum dapat diproses.")
  return data
}

function timeText(ms:number) {
  const total = Math.max(0, Math.ceil(ms/1000))
  return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`
}

function labelCategory(value?: string | null) {
  if (value === "numerik" || value === "logika" || value === "verbal" || value === "figural") return categoryMeta[value].title
  return "Campuran TIU"
}

export function TiuPractice({ mode, defaultCategory="numerik" }: { mode:Mode; defaultCategory?:Category }) {
  const [participant,setParticipant] = useState<BattleParticipant|null>(null)
  const [category,setCategory] = useState<Category>(defaultCategory)
  const [session,setSession] = useState<Session|null>(null)
  const [answers,setAnswers] = useState<Array<number|null>>([])
  const [index,setIndex] = useState(0)
  const [result,setResult] = useState<Result|null>(null)
  const [history,setHistory] = useState<HistoryRow[]>([])
  const [loading,setLoading] = useState(true)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState("")
  const [now,setNow] = useState(Date.now())
  const autoSubmitRef = useRef(false)
  const progressKey = (id:string) => `alzava.tiu.progress.${id}`

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

  useEffect(() => {
    if (mode === "category") {
      const raw = new URLSearchParams(window.location.search).get("category")
      if (raw === "numerik" || raw === "logika" || raw === "verbal" || raw === "figural") setCategory(raw)
    }
    const token = getParticipantToken()
    if (!token) { setLoading(false); return }
    Promise.all([
      fetch(BATTLE_API_URL,{headers:{"X-Battle-Token":token},cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null),
      callTiu({action:"history"}).catch(()=>null),
    ]).then(([overview,h])=>{
      setParticipant((overview?.participant || h?.participant || null) as BattleParticipant|null)
      setHistory(Array.isArray(h?.history)?h.history:[])
    }).finally(()=>setLoading(false))
  }, [mode])

  useEffect(() => {
    if (!session) return
    const timer = window.setInterval(()=>setNow(Date.now()),1000)
    return ()=>window.clearInterval(timer)
  }, [session?.id])

  const remainingMs = session ? Math.max(0,new Date(session.deadline_at).getTime()-now) : 0
  const current = session?.questions[index]
  const unanswered = answers.filter(a=>a===null).length
  const answered = answers.length-unanswered
  const progress = session?.questions.length ? Math.round((answered/session.questions.length)*100) : 0

  useEffect(() => {
    if (!session || result || busy || remainingMs>0 || autoSubmitRef.current) return
    autoSubmitRef.current = true
    void submit(true)
  }, [remainingMs,session?.id,result,busy])

  const bestHistory = useMemo(()=>{
    const rows = history.filter(row => mode === "simulation" ? row.mode === "simulation" : row.mode === "category" && row.category === category)
    return rows.sort((a,b)=>Number(b.score||0)-Number(a.score||0))[0] || null
  },[history,mode,category])

  async function start() {
    if (!getParticipantToken()) {
      const next = mode === "simulation" ? "/simulasi-tiu" : `/latihan-tiu?category=${category}`
      window.location.href = `/account?next=${encodeURIComponent(next)}`
      return
    }
    setBusy(true); setError(""); setResult(null)
    try {
      const data = await callTiu({action:"start",mode,category})
      const s = data.session as Session
      setSession(s)
      const restored = s.resumed ? restoreLocalProgress(s.id,s.question_count) : null
      setAnswers(restored?.answers || Array(s.question_count).fill(null))
      setIndex(restored?.index || 0)
      setNow(Date.now())
      autoSubmitRef.current=false
      trackGrowthEvent(mode === "simulation" ? "tiu_simulation_start" : "tiu_practice_start", {category:mode === "category" ? category : "mixed",question_count:s.question_count})
      window.scrollTo({top:0,behavior:"smooth"})
    } catch(e) {
      setError(e instanceof Error ? e.message : "Latihan TIU belum dapat dimulai.")
    } finally { setBusy(false) }
  }

  function choose(option:number) {
    if (!session || result || busy) return
    setAnswers(old=>old.map((value,i)=>i===index?option:value))
  }

  useEffect(()=>{
    if(!session || !answers.length) return
    try { window.localStorage.setItem(progressKey(session.id),JSON.stringify({answers,index,saved_at:Date.now()})) } catch {}
  },[session?.id,answers,index])

  async function submit(force=false) {
    if (!session || busy || result) return
    if (!force && unanswered>0 && !window.confirm(`Masih ada ${unanswered} soal belum dijawab. Tetap kirim?`)) return
    setBusy(true); setError("")
    try {
      const data = await callTiu({action:"submit",session_id:session.id,answers})
      setResult(data.result || null)
      try { window.localStorage.removeItem(progressKey(session.id)) } catch {}
      setSession(null)
      trackGrowthEvent(mode === "simulation" ? "tiu_simulation_complete" : "tiu_practice_complete", {category:mode === "category" ? category : "mixed",score:data.result?.score||0,accuracy:data.result?.accuracy||0})
      const h = await callTiu({action:"history"}).catch(()=>null)
      if (Array.isArray(h?.history)) setHistory(h.history)
      window.scrollTo({top:0,behavior:"smooth"})
    } catch(e) {
      setError(e instanceof Error ? e.message : "Hasil latihan belum dapat disimpan.")
      autoSubmitRef.current=false
    } finally { setBusy(false) }
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#020817] text-white"><div className="text-center"><BrainCircuit className="mx-auto h-10 w-10 animate-pulse text-cyan-300"/><p className="mt-3 text-sm font-bold text-slate-400">Menyiapkan Latihan TIU…</p></div></main>

  return <div className="min-h-screen bg-[radial-gradient(circle_at_15%_-10%,rgba(34,211,238,.16),transparent_34rem),radial-gradient(circle_at_90%_12%,rgba(124,58,237,.13),transparent_30rem),linear-gradient(180deg,#020617,#07142e_55%,#020617)] text-white">
    <SiteNavbar participant={participant}/>
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {!getParticipantToken() ? <section className="mx-auto max-w-2xl rounded-[32px] border border-cyan-300/15 bg-white/[.045] p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10">
        <BrainCircuit className="mx-auto h-14 w-14 text-cyan-300"/>
        <p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-cyan-300">Open Beta · Gratis</p>
        <h1 className="mt-3 text-4xl font-black">{mode === "simulation" ? "Simulasi TIU 35 Soal" : "Latihan TIU"}</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">Masuk atau daftar untuk menyimpan hasil, melihat perkembangan, dan menghubungkan latihanmu ke Ranked Battle.</p>
        <button onClick={()=>void start()} className="mt-7 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 px-6 py-3.5 font-black">Masuk / Daftar</button>
      </section> : result ? <ResultView result={result} mode={mode} category={category} onRetry={()=>{setResult(null);void start()}}/> : session && current ? <section>
        <div className="mb-5 flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/[.045] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">{mode === "simulation" ? "Simulasi TIU · 35 Soal" : `Latihan ${labelCategory(category)} · 10 Soal`}</p><h1 className="mt-1 text-xl font-black">Soal {index+1} dari {session.questions.length}</h1></div>
          <div className="flex items-center gap-3"><span className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs font-bold text-slate-300">{answered}/{session.questions.length} dijawab</span><span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-sm font-black ${remainingMs<120000?"border-rose-300/25 bg-rose-300/10 text-rose-200":"border-cyan-300/15 bg-cyan-300/[.06] text-cyan-100"}`}><Clock3 className="h-4 w-4"/>{timeText(remainingMs)}</span></div>
        </div>
        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-slate-900"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all" style={{width:`${progress}%`}}/></div>
        {error && <div className="mb-5 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{error}</div>}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_285px]">
          <article className="rounded-[30px] border border-white/10 bg-[#091936]/92 p-5 shadow-2xl sm:p-8">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-200">{current.subcategory || labelCategory(current.category)}</span><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-500">{current.difficulty || "menengah"}</span></div>
            <h2 className="mt-6 text-xl font-black leading-8 sm:text-2xl">{current.prompt}</h2>
            <div className="mt-7 grid gap-3">{current.options.map((option,oi)=>{
              const selected=answers[index]===oi
              return <button key={oi} onClick={()=>choose(oi)} className={`flex min-h-14 items-center gap-4 rounded-2xl border p-4 text-left transition ${selected?"border-indigo-300/50 bg-indigo-500/20 shadow-[0_0_26px_rgba(99,102,241,.18)]":"border-white/10 bg-slate-950/40 hover:border-cyan-300/30 hover:bg-white/[.05]"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${selected?"bg-indigo-500":"bg-white/5 text-slate-400"}`}>{String.fromCharCode(65+oi)}</span><span className="font-semibold text-slate-100">{option}</span></button>
            })}</div>
            <div className="mt-8 flex items-center justify-between gap-3"><button onClick={()=>setIndex(i=>Math.max(0,i-1))} disabled={index===0} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-bold disabled:opacity-30"><ChevronLeft className="h-4 w-4"/>Sebelumnya</button>{index<session.questions.length-1?<button onClick={()=>setIndex(i=>Math.min(session.questions.length-1,i+1))} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-black">Berikutnya<ChevronRight className="h-4 w-4"/></button>:<button onClick={()=>void submit(false)} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-black disabled:opacity-50">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<CheckCircle2 className="h-4 w-4"/>}Selesai</button>}</div>
          </article>
          <aside className="h-fit rounded-[26px] border border-white/10 bg-white/[.04] p-5 lg:sticky lg:top-24"><h3 className="font-black">Navigasi Soal</h3><div className="mt-4 grid grid-cols-5 gap-2">{session.questions.map((_,i)=><button key={i} onClick={()=>setIndex(i)} className={`h-9 rounded-lg text-xs font-black ${i===index?"bg-indigo-500 text-white ring-2 ring-indigo-300/40":answers[i]!==null?"bg-emerald-500/20 text-emerald-200":"bg-slate-900 text-slate-500"}`}>{i+1}</button>)}</div><div className="mt-5 rounded-2xl bg-slate-950/40 p-4 text-sm text-slate-400">Belum dijawab: <b className="text-white">{unanswered}</b></div><button onClick={()=>void submit(false)} disabled={busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 font-black text-emerald-200 disabled:opacity-50"><CheckCircle2 className="h-4 w-4"/>Kirim Hasil</button></aside>
        </div>
      </section> : <section>
        <a href="/latihan-skd" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4"/>Latihan SKD</a>
        <div className="mt-6 grid gap-7 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
          <div>
            <span className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-emerald-200">Open Beta · 100% Gratis</span>
            <p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-cyan-300">Latihan SKD · TIU</p>
            <h1 className="mt-3 text-5xl font-black tracking-[-.05em] sm:text-6xl">{mode === "simulation" ? <>Simulasi TIU<br/><span className="text-indigo-300">35 Soal.</span></> : <>Latihan TIU<br/><span className="text-indigo-300">Fokus Kategori.</span></>}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">{mode === "simulation" ? "Uji kemampuan TIU dalam 35 soal campuran numerik, logika-analitis, dan verbal. Hasil latihan tidak memengaruhi Battle Point atau leaderboard." : "Pilih kemampuan yang ingin diasah. Setiap sesi berisi 10 soal dengan pembahasan setelah selesai dan tidak memengaruhi Ranking resmi."}</p>
            {mode === "category" && <div className="mt-7 grid gap-3 sm:grid-cols-3">{(["numerik","logika","verbal"] as Category[]).map(key=><button key={key} onClick={()=>{setCategory(key);window.history.replaceState(null,"",`/latihan-tiu?category=${key}`)}} className={`rounded-2xl border p-4 text-left transition ${category===key?"border-cyan-300/40 bg-cyan-300/10":"border-white/10 bg-white/[.04] hover:bg-white/[.07]"}`}><strong className="block text-lg">{categoryMeta[key].title}</strong><span className="mt-2 block text-xs leading-5 text-slate-500">{categoryMeta[key].description}</span></button>)}</div>}
            <div className="mt-7 flex flex-wrap gap-3"><button onClick={()=>void start()} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 font-black shadow-[0_0_30px_rgba(99,102,241,.25)] disabled:opacity-50">{busy?<Loader2 className="h-5 w-5 animate-spin"/>:<Swords className="h-5 w-5"/>}{mode === "simulation" ? "Mulai Simulasi 35 Soal" : `Mulai ${categoryMeta[category].title}`}</button>{mode === "category" && <a href="/simulasi-tiu" className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 font-black text-slate-200">Simulasi 35 Soal</a>}</div>
            {error && <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{error}</div>}
          </div>
          <aside className="rounded-[30px] border border-white/10 bg-white/[.045] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/10"><BarChart3 className="h-6 w-6 text-cyan-300"/></span><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">Format</p><h2 className="text-xl font-black">{mode === "simulation" ? "35 soal · 35 menit" : "10 soal · 15 menit"}</h2></div></div>
            <div className="mt-5 grid gap-3"><div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><p className="text-xs text-slate-500">Penilaian latihan</p><p className="mt-1 font-black">5 poin per jawaban benar</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><p className="text-xs text-slate-500">Dampak Ranking</p><p className="mt-1 font-black text-emerald-300">Tidak memengaruhi leaderboard</p></div>{bestHistory && <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-4"><p className="text-xs text-amber-200/70">Skor terbaik latihan ini</p><p className="mt-1 text-3xl font-black text-amber-200">{bestHistory.score ?? 0}</p></div>}</div>
            <p className="mt-5 text-xs leading-5 text-slate-500">Latihan ini adalah fitur belajar ALZAVA dan bukan soal resmi BKN. Gunakan untuk melatih pola kemampuan TIU dan evaluasi kelemahan.</p>
          </aside>
        </div>
      </section>}
    </main>
    <SiteFooter/>
  </div>
}

function ResultView({result,mode,category,onRetry}:{result:Result;mode:Mode;category:Category;onRetry:()=>void}) {
  const rows=Object.entries(result.breakdown||{})
  return <section className="space-y-6">
    <div className="rounded-[34px] border border-emerald-300/15 bg-gradient-to-br from-emerald-400/[.09] via-[#07162f] to-cyan-400/[.05] p-7 text-center shadow-2xl sm:p-10">
      <Trophy className="mx-auto h-12 w-12 text-amber-300"/><p className="mt-4 text-xs font-black uppercase tracking-[.2em] text-emerald-300">Latihan Selesai</p><h1 className="mt-2 text-4xl font-black sm:text-5xl">{Number(result.score||0)} <span className="text-cyan-300">/ {Number(result.max_score||0)}</span></h1><p className="mt-3 text-sm text-slate-400">{result.correct_count||0}/{result.question_count||0} benar · Akurasi {result.accuracy||0}% · tidak memengaruhi Ranking resmi.</p>
      <div className="mx-auto mt-7 grid max-w-3xl gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.06] p-5"><CheckCircle2 className="mx-auto h-5 w-5 text-emerald-300"/><strong className="mt-2 block text-3xl">{result.correct_count||0}</strong><span className="text-xs text-slate-500">Jawaban benar</span></div><div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.06] p-5"><Target className="mx-auto h-5 w-5 text-cyan-300"/><strong className="mt-2 block text-3xl">{result.accuracy||0}%</strong><span className="text-xs text-slate-500">Akurasi</span></div><div className="rounded-2xl border border-violet-300/15 bg-violet-300/[.06] p-5"><BrainCircuit className="mx-auto h-5 w-5 text-violet-300"/><strong className="mt-2 block text-xl">{mode==="simulation"?"Campuran":labelCategory(category)}</strong><span className="text-xs text-slate-500">Fokus latihan</span></div></div>
      <div className="mt-7 flex flex-wrap justify-center gap-3"><a href="/battle-test" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-black"><Swords className="h-4 w-4"/>Masuk Ranked Battle</a><button onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-black"><RotateCcw className="h-4 w-4"/>Latihan Lagi</button><a href="/latihan-skd" className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 font-black text-cyan-100">Latihan SKD</a></div>
    </div>
    {rows.length>0 && <section className="rounded-[28px] border border-white/10 bg-white/[.04] p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Analisis Kategori</p><h2 className="mt-2 text-2xl font-black">Di mana kamu paling kuat?</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{rows.map(([key,value])=><div key={key} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><span className="text-xs font-bold text-slate-500">{labelCategory(key)}</span><strong className="mt-2 block text-3xl">{value.accuracy||0}%</strong><p className="mt-1 text-xs text-slate-500">{value.correct||0}/{value.total||0} benar</p></div>)}</div></section>}
    <section className="rounded-[28px] border border-white/10 bg-white/[.04] p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-[.18em] text-violet-300">Review & Pembahasan</p><h2 className="mt-2 text-2xl font-black">Pelajari kesalahanmu</h2><div className="mt-6 grid gap-4">{(result.review||[]).map((row,i)=><article key={row.id||i} className={`rounded-2xl border p-5 ${row.correct?"border-emerald-300/15 bg-emerald-300/[.04]":"border-rose-300/15 bg-rose-300/[.04]"}`}><div className="flex gap-3">{row.correct?<CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300"/>:<XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300"/>}<div><div className="flex flex-wrap gap-2"><span className="text-xs font-black text-slate-500">SOAL {i+1}</span><span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">{row.subcategory||labelCategory(row.category)}</span></div><p className="mt-2 font-bold leading-6">{row.prompt}</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{(row.options||[]).map((option,oi)=><div key={oi} className={`rounded-xl border px-3 py-2.5 text-sm ${oi===row.correct_index?"border-emerald-300/30 bg-emerald-300/10 text-emerald-100":oi===row.selected_index&&!row.correct?"border-rose-300/25 bg-rose-300/10 text-rose-100":"border-white/8 bg-slate-950/25 text-slate-400"}`}><b className="mr-2">{String.fromCharCode(65+oi)}.</b>{option}{oi===row.correct_index&&<span className="ml-2 text-[10px] font-black text-emerald-300">BENAR</span>}</div>)}</div><p className="mt-4 rounded-xl border border-cyan-300/10 bg-cyan-300/[.04] px-4 py-3 text-xs leading-5 text-cyan-50/80"><b className="text-cyan-300">Pembahasan:</b> {row.explanation}</p></article>)}</div></section>
  </section>
}
