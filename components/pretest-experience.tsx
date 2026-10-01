"use client"

import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Gauge, Share2, Sparkles, Trophy } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { PARTICIPANT_TOKEN_KEY } from "@/lib/battle"

export const PRETEST_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-pretest"
export const PRETEST_GUEST_KEY = "alzava_pretest_guest_v1"
export const PRETEST_CLAIMED_KEY = "alzava_pretest_claimed_v1"
export const PRETEST_SUMMARY_KEY = "alzava_pretest_summary_v1"

type Question = { id: string; section: string; category: string; prompt: string; options: string[] }
type Session = { id: string; started_at: string; deadline_at: string; completed_at?: string | null; battle_score?: number | null; best_count?: number | null; breakdown?: Record<string, number> | null; questions: Question[] }
type Review = Question & { selected_index: number | null; selected_score?: number; correct_index?: number | null; correct?: boolean; best_choice?: boolean; explanation?: string }
type Result = { id: string; battle_score: number; max_score: number; best_count: number; question_count: number; breakdown: Record<string, number>; started_at?: string; completed_at?: string; review?: Review[] }

async function request(action: string, body: Record<string, unknown> = {}) {
  const guest = localStorage.getItem(PRETEST_GUEST_KEY) || ""
  const participant = localStorage.getItem(PARTICIPANT_TOKEN_KEY) || ""
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (guest) headers["X-Pretest-Token"] = guest
  if (participant) headers["X-Battle-Token"] = participant
  const response = await fetch(PRETEST_API, { method: "POST", headers, body: JSON.stringify({ action, ...body }), cache: "no-store" })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || "Pre-Test belum dapat diproses.")
  if (data?.guest_token) localStorage.setItem(PRETEST_GUEST_KEY, data.guest_token)
  return data
}

function mmss(total: number) {
  const s = Math.max(0, Math.floor(total))
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

export function PretestExperience() {
  const [session, setSession] = useState<Session | null>(null)
  const [answers, setAnswers] = useState<Array<number | null>>([null, null, null, null, null])
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [now, setNow] = useState(Date.now())
  const [hasAccount, setHasAccount] = useState(false)

  useEffect(() => {
    setHasAccount(Boolean(localStorage.getItem(PARTICIPANT_TOKEN_KEY)))
    request("start")
      .then((data) => {
        const next = data?.session as Session
        setSession(next)
        if (next?.completed_at) {
          const restored: Result = {
            id: next.id,
            battle_score: Number(next.battle_score || 0),
            max_score: 500,
            best_count: Number(next.best_count || 0),
            question_count: 5,
            breakdown: next.breakdown || {},
            completed_at: next.completed_at,
          }
          setResult(restored)
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Pre-Test belum dapat dimuat."))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const left = session ? Math.max(0, Math.ceil((new Date(session.deadline_at).getTime() - now) / 1000)) : 180
  const answered = answers.filter((x) => x !== null).length
  const q = session?.questions?.[index]
  const complete = answered === 5

  const level = useMemo(() => {
    const score = Number(result?.battle_score || 0)
    if (score >= 440) return "Sangat Kuat"
    if (score >= 360) return "Kompetitif"
    if (score >= 280) return "Berkembang"
    return "Pemanasan"
  }, [result?.battle_score])

  async function submit() {
    if (!complete || submitting) return
    if (left <= 0) { setError("Waktu Pre-Test sudah habis. Muat ulang halaman untuk memulai sesi baru."); return }
    setSubmitting(true); setError("")
    try {
      const data = await request("submit", { answers })
      const next = data.result as Result
      setResult(next)
      localStorage.setItem(PRETEST_SUMMARY_KEY, JSON.stringify({ battle_score: next.battle_score, best_count: next.best_count, completed_at: next.completed_at }))
      window.dispatchEvent(new Event("alzava-pretest-completed"))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hasil Pre-Test belum dapat dihitung.")
    } finally { setSubmitting(false) }
  }

  function choose(option: number) {
    setAnswers((current) => current.map((value, i) => i === index ? option : value))
  }

  async function share() {
    if (!result) return
    const text = `Battle Point awal saya ${result.battle_score}/500 di Pre-Test ALZAVA. Coba kalahkan skorku!`
    try {
      if (navigator.share) await navigator.share({ title: "Pre-Test ALZAVA Battle Point", text, url: `${location.origin}/pretest` })
      else await navigator.clipboard.writeText(`${text} ${location.origin}/pretest`)
    } catch {}
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#020617] text-slate-300">Menyiapkan Quick Battle…</main>

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(6,182,212,.17),transparent_32rem),radial-gradient(circle_at_90%_10%,rgba(124,58,237,.18),transparent_32rem),linear-gradient(180deg,#020617,#07152d_48%,#020617)] text-white">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <a href="/battle" className="flex items-center gap-3"><img src="/brand/alvaza-logo-new.svg" alt="ALZAVA Battle Point" className="h-10 w-10 object-contain"/><div><p className="font-black">ALZAVA <span className="text-[#D4AF37]">Battle Point</span></p><p className="text-[10px] uppercase tracking-[.16em] text-cyan-300">Quick Battle · Pre-Test</p></div></a>
          <a href="/battle" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-300"><ArrowLeft className="h-4 w-4"/>Beranda</a>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
        {!result ? (
          <section className="overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[#07162f]/90 shadow-[0_30px_100px_rgba(0,0,0,.36)]">
            <div className="border-b border-white/10 bg-gradient-to-r from-cyan-400/[.08] to-violet-500/[.08] p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-cyan-300"><Sparkles className="h-4 w-4"/>Pre-Test Kemampuan Awal</div><h1 className="mt-2 text-3xl font-black sm:text-4xl">5 soal. ±3 menit. Tanpa daftar.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Selesaikan satu paket singkat TWK, TIU, dan TKP untuk mendapatkan Battle Point awalmu. Hasil ini tidak memengaruhi ranking.</p></div>
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[.08] px-5 py-3 text-center"><Clock3 className="mx-auto h-5 w-5 text-amber-300"/><strong className="mt-1 block font-mono text-2xl">{mmss(left)}</strong><span className="text-[10px] text-slate-500">sisa waktu</span></div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all" style={{width:`${(answered/5)*100}%`}}/></div>
              <div className="mt-2 flex justify-between text-[11px] font-bold text-slate-500"><span>{answered}/5 dijawab</span><span>Soal {index+1}/5</span></div>
            </div>

            <div className="p-5 sm:p-8">
              {error && <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>}
              {q ? <>
                <div className="flex items-center justify-between gap-3"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-200">{q.category}</span><span className="text-xs font-bold text-slate-500">Maks. 100 BP</span></div>
                <h2 className="mt-5 text-xl font-black leading-8 sm:text-2xl">{q.prompt}</h2>
                <div className="mt-6 grid gap-3">{q.options.map((option, i) => <button key={i} onClick={()=>choose(i)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${answers[index]===i?"border-cyan-300/60 bg-cyan-300/12 ring-1 ring-cyan-300/20":"border-white/10 bg-white/[.035] hover:border-white/20 hover:bg-white/[.055]"}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black ${answers[index]===i?"bg-cyan-300 text-slate-950":"bg-white/10 text-slate-300"}`}>{String.fromCharCode(65+i)}</span><span className="pt-0.5 text-sm font-semibold leading-6 text-slate-200">{option}</span></button>)}</div>
                <div className="mt-7 flex items-center justify-between gap-3"><button disabled={index===0} onClick={()=>setIndex(i=>Math.max(0,i-1))} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold disabled:opacity-30">Sebelumnya</button>{index<4?<button disabled={answers[index]===null} onClick={()=>setIndex(i=>Math.min(4,i+1))} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-30">Berikutnya <ArrowRight className="h-4 w-4"/></button>:<button disabled={!complete||submitting} onClick={()=>void submit()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_28px_rgba(34,211,238,.22)] disabled:opacity-30"><Gauge className="h-4 w-4"/>{submitting?"Menghitung…":"Lihat Battle Point"}</button>}</div>
              </> : <p className="text-slate-400">Paket soal belum tersedia.</p>}
            </div>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[2rem] border border-amber-300/25 bg-[#07162f]/94 shadow-[0_30px_100px_rgba(0,0,0,.4)]">
            <div className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,.22),transparent_22rem)] px-6 py-10 text-center sm:px-10">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-amber-300/30 bg-amber-300/10"><Trophy className="h-8 w-8 text-amber-300"/></div>
              <p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-amber-300">Battle Point Awal</p>
              <div className="mt-2 text-7xl font-black tracking-tight text-white sm:text-8xl">{result.battle_score}<span className="text-2xl text-slate-500">/500</span></div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100"><Gauge className="h-4 w-4"/>{level}</div>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">Kamu memilih opsi terbaik pada <strong className="text-white">{result.best_count}/5 soal</strong>. Ini adalah baseline awal, bukan skor Ranked.</p>
            </div>
            <div className="border-t border-white/10 p-6 sm:p-8">
              <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="text-xs text-slate-500">TWK</span><strong className="mt-1 block text-2xl font-black">{Number(result.breakdown?.twk||0)}/5</strong></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="text-xs text-slate-500">TIU</span><strong className="mt-1 block text-2xl font-black">{Number(result.breakdown?.tiu||0)}/10</strong></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="text-xs text-slate-500">TKP</span><strong className="mt-1 block text-2xl font-black">{Number(result.breakdown?.tkp||0)}/10</strong></div></div>
              {!hasAccount ? <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[.07] p-5"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300"/><div><h3 className="font-black">Skormu sudah diamankan sementara</h3><p className="mt-1 text-sm leading-6 text-slate-400">Buat akun gratis agar hasil {result.battle_score} BP menjadi <strong className="text-white">Pre-Test Pertama</strong> dan tersimpan permanen di Riwayat Tes.</p></div></div><div className="mt-4 flex flex-wrap gap-3"><a href="/account?pretest=register" className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-black">Simpan Hasil & Buat Akun</a><a href="/account?pretest=login" className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200">Saya Sudah Punya Akun</a></div></div> : <div className="mt-6 flex flex-wrap gap-3"><a href="/account/results#riwayat-hasil" className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-black">Lihat Riwayat Tes</a><button onClick={()=>void share()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold"><Share2 className="h-4 w-4"/>Bagikan Skor</button></div>}
              <p className="mt-5 text-center text-xs text-slate-600">Pre-Test tidak masuk leaderboard dan tidak mengurangi kuota Ranked Battle.</p>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
