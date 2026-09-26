"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, BrainCircuit, CheckCircle2, Clock3, Flame, RotateCcw, Swords, Target, Trophy, XCircle } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { getParticipantToken } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"
import { trackGrowthEvent } from "@/components/growth-tracker"

const DAILY_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-daily"

type DailyQuestion = {
  id?: string
  category?: string
  prompt?: string
  options?: string[]
  difficulty?: string
}

type ReviewRow = DailyQuestion & {
  index?: number
  selected_index?: number | null
  correct_index?: number
  correct?: boolean
  explanation?: string
}

type DailyData = {
  date_key?: string
  participant?: BattleParticipant | null
  streak?: number
  started_at?: string | null
  completed_at?: string | null
  completed?: boolean
  questions?: DailyQuestion[]
  result?: {
    correct_count?: number
    question_count?: number
    accuracy?: number
    duration_ms?: number
    review?: ReviewRow[]
  } | null
}

async function daily(action: "state" | "start" | "submit", payload: Record<string, unknown> = {}) {
  const token = getParticipantToken()
  if (!token) throw new Error("participant_required")
  const response = await fetch(DAILY_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Battle-Token": token },
    body: JSON.stringify({ action, ...payload }),
    cache: "no-store",
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || "Latihan Harian belum dapat dimuat.")
  return data as DailyData
}

function fmtDuration(ms = 0) {
  const sec = Math.max(0, Math.round(ms / 1000))
  const min = Math.floor(sec / 60)
  return `${String(min).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`
}

export default function DailyTrainingPage() {
  const [data, setData] = useState<DailyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Array<number | null>>([null, null, null, null, null])
  const [busy, setBusy] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const token = getParticipantToken()
    if (!token) { setLoading(false); return }
    void daily("state")
      .then((result) => {
        setData(result)
        if (!result.completed) setStartedAt(Date.now())
        setError("")
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Latihan Harian belum dapat dimuat."))
      .finally(() => setLoading(false))
  }, [])

  const questions = Array.isArray(data?.questions) ? data!.questions! : []
  const current = questions[index]
  const selected = answers[index]
  const elapsed = startedAt ? Math.max(0, now - startedAt) : Number(data?.result?.duration_ms || 0)
  const answeredCount = answers.filter((value) => value !== null).length

  const scoreLabel = useMemo(() => {
    const correct = Number(data?.result?.correct_count || 0)
    if (correct === 5) return "Sempurna!"
    if (correct >= 4) return "Tajam hari ini!"
    if (correct >= 3) return "Bagus, lanjutkan!"
    return "Terus asah kemampuanmu"
  }, [data?.result?.correct_count])

  function choose(optionIndex: number) {
    if (busy || data?.completed) return
    setAnswers((old) => old.map((value, i) => i === index ? optionIndex : value))
  }

  function next() {
    if (selected === null) return
    if (index < 4) setIndex((value) => value + 1)
  }

  async function submit() {
    if (busy || answers.some((value) => value === null)) return
    setBusy(true)
    setError("")
    try {
      const result = await daily("submit", { answers, duration_ms: elapsed })
      setData(result)
      trackGrowthEvent("daily_training_complete", { correct_count: result.result?.correct_count || 0, streak: result.streak || 0 })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Latihan belum dapat diselesaikan.")
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#020817] text-white"><BrainCircuit className="h-11 w-11 animate-pulse text-cyan-300" /><p className="mt-3 text-sm font-bold text-slate-400">Menyiapkan Latihan Harian…</p></div>

  const participant = (data?.participant || null) as BattleParticipant | null

  return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(34,211,238,.14),transparent_34rem),radial-gradient(circle_at_85%_20%,rgba(124,58,237,.12),transparent_28rem),linear-gradient(180deg,#020617,#07142e_55%,#020617)] text-white">
    <SiteNavbar participant={participant} />
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {!getParticipantToken() ? (
        <section className="mx-auto max-w-2xl rounded-[32px] border border-cyan-300/15 bg-white/[.045] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,.35)] backdrop-blur-xl sm:p-10">
          <BrainCircuit className="mx-auto h-14 w-14 text-cyan-300" />
          <span className="mt-5 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-cyan-200">5 Soal · Setiap Hari</span>
          <h1 className="mt-4 text-4xl font-black tracking-tight">Latihan Harian</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">Latihan TIU singkat untuk menjaga ketajaman. Tidak memberi Battle Point dan tidak memengaruhi Ranking resmi.</p>
          <a href={`/account?next=${encodeURIComponent("/daily-training")}`} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 px-6 py-3.5 font-black text-white shadow-[0_0_30px_rgba(34,211,238,.25)]"><Swords className="h-5 w-5" /> Masuk / Daftar untuk Latihan</a>
        </section>
      ) : error && !data ? (
        <section className="mx-auto max-w-2xl rounded-3xl border border-rose-300/20 bg-rose-400/10 p-8 text-center"><XCircle className="mx-auto h-10 w-10 text-rose-300"/><h1 className="mt-4 text-2xl font-black">Latihan belum dapat dimuat</h1><p className="mt-2 text-sm text-rose-100/70">{error}</p><button onClick={() => window.location.reload()} className="mt-5 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-black">Coba Lagi</button></section>
      ) : data?.completed ? (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[32px] border border-emerald-300/15 bg-[linear-gradient(135deg,rgba(16,185,129,.10),rgba(3,12,32,.78)_46%,rgba(34,211,238,.08))] shadow-[0_30px_100px_rgba(0,0,0,.36)]">
            <div className="p-7 text-center sm:p-10">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] border border-amber-300/25 bg-amber-300/10 text-amber-300 shadow-[0_0_40px_rgba(251,191,36,.14)]"><Trophy className="h-10 w-10" /></div>
              <p className="mt-5 text-xs font-black uppercase tracking-[.22em] text-emerald-300">Latihan Hari Ini Selesai</p>
              <h1 className="mt-2 text-4xl font-black sm:text-5xl">{scoreLabel}</h1>
              <p className="mt-3 text-sm text-slate-400">Latihan ini tidak mengubah Battle Point atau Ranking resmi.</p>
              <div className="mx-auto mt-7 grid max-w-3xl gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.06] p-5"><CheckCircle2 className="mx-auto h-5 w-5 text-emerald-300"/><p className="mt-2 text-3xl font-black">{data.result?.correct_count || 0}/5</p><p className="text-xs text-slate-500">Benar</p></div>
                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.06] p-5"><Target className="mx-auto h-5 w-5 text-cyan-300"/><p className="mt-2 text-3xl font-black">{data.result?.accuracy || 0}%</p><p className="text-xs text-slate-500">Ketepatan</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><Clock3 className="mx-auto h-5 w-5 text-violet-300"/><p className="mt-2 text-3xl font-black">{fmtDuration(data.result?.duration_ms)}</p><p className="text-xs text-slate-500">Durasi</p></div>
                <div className="rounded-2xl border border-orange-300/15 bg-orange-300/[.06] p-5"><Flame className="mx-auto h-5 w-5 text-orange-300"/><p className="mt-2 text-3xl font-black">{data.streak || 0}</p><p className="text-xs text-slate-500">Hari Streak</p></div>
              </div>
              <div className="mt-7 flex flex-wrap justify-center gap-3"><a href="/battle-test" className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-black">Masuk Ranked Battle</a><a href="/pvp" className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100">Battle PVP</a></div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[.04] p-5 sm:p-7">
            <div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Review Hari Ini</p><h2 className="mt-2 text-2xl font-black">Pelajari 5 soalmu</h2><p className="mt-1 text-sm text-slate-500">Lihat jawaban yang benar dan alasan singkatnya.</p></div>
            <div className="mt-6 grid gap-4">
              {(data.result?.review || []).map((row, i) => <article key={i} className={`rounded-2xl border p-5 ${row.correct ? "border-emerald-300/15 bg-emerald-300/[.045]" : "border-rose-300/15 bg-rose-300/[.045]"}`}>
                <div className="flex items-start gap-3"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${row.correct ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"}`}>{row.correct ? <CheckCircle2 className="h-5 w-5"/> : <XCircle className="h-5 w-5"/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black text-slate-500">SOAL {i+1}</span><span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">{row.category}</span></div><p className="mt-2 font-bold leading-6 text-slate-100">{row.prompt}</p></div></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">{(row.options || []).map((option, oi) => <div key={oi} className={`rounded-xl border px-3 py-2.5 text-sm ${oi === row.correct_index ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : oi === row.selected_index && !row.correct ? "border-rose-300/25 bg-rose-300/10 text-rose-100" : "border-white/8 bg-slate-950/25 text-slate-400"}`}><span className="mr-2 font-black">{String.fromCharCode(65+oi)}.</span>{option}{oi === row.correct_index ? <span className="ml-2 text-xs font-black text-emerald-300">BENAR</span> : null}</div>)}</div>
                <p className="mt-4 rounded-xl border border-cyan-300/10 bg-cyan-300/[.04] px-4 py-3 text-xs leading-5 text-cyan-50/80"><strong className="text-cyan-300">Pembahasan:</strong> {row.explanation}</p>
              </article>)}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="flex flex-col justify-between gap-4 rounded-[28px] border border-cyan-300/15 bg-white/[.045] p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:p-6">
            <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-cyan-200">Latihan Harian</span><span className="rounded-full border border-orange-300/15 bg-orange-300/[.07] px-3 py-1 text-[10px] font-black text-orange-200"><Flame className="mr-1 inline h-3 w-3"/>{data?.streak || 0} hari streak</span></div><h1 className="mt-3 text-3xl font-black sm:text-4xl">5 soal untuk menjaga ketajaman</h1><p className="mt-2 text-sm text-slate-400">TIU fokus · non-ranked · tidak mengubah Battle Point.</p></div>
            <div className="grid min-w-[150px] grid-cols-2 gap-2 text-center"><div className="rounded-xl border border-white/10 bg-slate-950/35 p-3"><p className="text-2xl font-black">{answeredCount}/5</p><p className="text-[10px] text-slate-500">Terjawab</p></div><div className="rounded-xl border border-white/10 bg-slate-950/35 p-3"><p className="font-mono text-xl font-black">{fmtDuration(elapsed)}</p><p className="text-[10px] text-slate-500">Waktu</p></div></div>
          </section>

          {error && <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{error}</div>}

          {current && <section className="mx-auto max-w-4xl rounded-[32px] border border-cyan-300/15 bg-gradient-to-b from-[#0a1931] to-[#061126] p-6 shadow-[0_30px_90px_rgba(0,0,0,.35)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-200">SOAL {index+1} / 5</span><div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-400">{current.category}</span><span className="rounded-full border border-amber-300/15 bg-amber-300/[.06] px-2 py-1 text-[10px] font-black uppercase text-amber-200">{current.difficulty || "sulit"}</span></div></div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transition-all" style={{ width: `${((index+1)/5)*100}%` }} /></div>
            <h2 className="mt-7 text-xl font-black leading-relaxed text-white sm:text-2xl">{current.prompt}</h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">{(current.options || []).map((option, oi) => <button key={oi} onClick={() => choose(oi)} className={`group flex min-h-[78px] items-center gap-4 rounded-2xl border p-4 text-left font-bold transition ${selected === oi ? "border-cyan-300/55 bg-cyan-300/12 text-white shadow-[0_0_25px_rgba(34,211,238,.10)]" : "border-white/10 bg-white/[.04] text-slate-100 hover:border-cyan-300/30 hover:bg-cyan-300/[.07]"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-sm font-black ${selected === oi ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-200" : "border-white/10 bg-slate-950 text-cyan-300"}`}>{String.fromCharCode(65+oi)}</span><span>{option}</span></button>)}</div>
            <div className="mt-7 flex items-center justify-between gap-3"><button disabled={index===0} onClick={() => setIndex((value) => Math.max(0,value-1))} className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm font-bold text-slate-300 disabled:opacity-30"><RotateCcw className="mr-2 inline h-4 w-4"/>Kembali</button>{index < 4 ? <button disabled={selected===null} onClick={next} className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40">Soal Berikutnya <ArrowRight className="ml-2 inline h-4 w-4"/></button> : <button disabled={busy || answers.some((value)=>value===null)} onClick={() => void submit()} className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(34,211,238,.20)] disabled:opacity-40">{busy ? "Memeriksa…" : "Selesaikan Latihan"} <CheckCircle2 className="ml-2 inline h-4 w-4"/></button>}</div>
          </section>}

          <p className="text-center text-xs leading-5 text-slate-500">Latihan Harian hanya dapat diselesaikan satu paket per hari. Besok tersedia paket baru dengan variasi soal berbeda.</p>
        </div>
      )}
    </main>
    <SiteFooter />
  </div>
}
