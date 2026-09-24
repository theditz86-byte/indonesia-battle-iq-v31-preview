"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock3, CreditCard, Flag, Loader2, ShieldCheck } from "lucide-react"
import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"

type Question = {
  id: string
  domain: "fluid" | "verbal" | "visual" | "memory" | "speed"
  kind: string
  prompt: string
  instruction?: string
  options: string[]
  stimulus?: string
  memorize_ms?: number
}

type Attempt = {
  attempt_id: string
  attempt_number: number
  started_at?: string
  deadline_at: string
  resumed?: boolean
  high_range_unlocked?: boolean
  core_answers?: Array<number | null> | null
  questions: Question[]
}

type ParticipantState = {
  nickname?: string
  attempts_used?: number
  free_attempts_remaining?: number
  paid_credits?: number
  attempts_remaining?: number
  active_attempt_id?: string | null
}

const domainLabel: Record<string,string> = {
  fluid: "Logika & Numerik",
  verbal: "Penalaran Verbal",
  visual: "Spasial & Visual",
  memory: "Memori Kerja",
  speed: "Kecepatan Nalar",
}

async function callBattle(body: Record<string, unknown>, token: string) {
  const response = await fetch(BATTLE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Battle-Token": token },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  return { response, data }
}

function timeText(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`
}

export default function BattleTestPage() {
  const [participant, setParticipant] = useState<ParticipantState | null>(null)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [answers, setAnswers] = useState<Array<number | null>>([])
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<"loading"|"lobby"|"test"|"submitting"|"error">("loading")
  const [error, setError] = useState("")
  const [paywall, setPaywall] = useState(false)
  const [remainingMs, setRemainingMs] = useState(15 * 60 * 1000)
  const [integrity, setIntegrity] = useState(false)
  const autoSubmitRef = useRef(false)
  const answersRef = useRef<Array<number | null>>([])
  const [stageNotice,setStageNotice] = useState("")

  const token = typeof window === "undefined" ? "" : getParticipantToken()

  useEffect(() => {
    const rawToken = getParticipantToken()
    if (!rawToken) {
      window.location.replace("/account")
      return
    }
    fetch(BATTLE_API_URL, { headers: { "X-Battle-Token": rawToken }, cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Akun peserta belum dapat dimuat.")
        return await r.json()
      })
      .then((data) => {
        setParticipant(data.participant || null)
        setPhase("lobby")
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Akun peserta belum dapat dimuat.")
        setPhase("error")
      })
  }, [])

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    if (!attempt || phase !== "test") return
    const update = () => {
      const left = new Date(attempt.deadline_at).getTime() - Date.now()
      setRemainingMs(Math.max(0, left))
      if (left <= 0 && !autoSubmitRef.current) {
        autoSubmitRef.current = true
        void finishStage(true)
      }
    }
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [attempt, phase])

  useEffect(() => {
    if (phase !== "test") return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [phase])

  const unanswered = useMemo(() => answers.filter((a) => a === null).length, [answers])
  const current = attempt?.questions[index]
  const progress = attempt?.questions.length ? Math.round(((index + 1) / attempt.questions.length) * 100) : 0
  const isPaidRanked = Boolean(attempt && attempt.attempt_number > 1)

  async function start() {
    const rawToken = getParticipantToken()
    if (!rawToken) {
      window.location.href = "/account"
      return
    }
    setError("")
    setPaywall(false)
    setPhase("loading")
    try {
      const { response, data } = await callBattle({ action: "start" }, rawToken)
      if (response.status === 402) {
        setPaywall(true)
        setError(data?.error || "Ranked Attempt gratis season ini sudah digunakan.")
        setPhase("lobby")
        return
      }
      if (response.status === 401) {
        window.location.href = "/account"
        return
      }
      if (!response.ok) throw new Error(data?.error || "Tes belum dapat dimulai.")
      const started = data as Attempt
      if (!Array.isArray(started.questions) || !started.questions.length) throw new Error("Paket soal belum tersedia.")
      setAttempt(started)
      const restored = Array.isArray(started.core_answers) && started.high_range_unlocked
        ? [...started.core_answers, ...Array(Math.max(0, started.questions.length - started.core_answers.length)).fill(null)]
        : Array(started.questions.length).fill(null)
      setAnswers(restored)
      answersRef.current = restored
      setIndex(started.high_range_unlocked && started.questions.length > 30 ? 30 : 0)
      autoSubmitRef.current = false
      setRemainingMs(Math.max(0, new Date(started.deadline_at).getTime() - Date.now()))
      setPhase("test")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tes belum dapat dimulai.")
      setPhase("lobby")
    }
  }

  function choose(optionIndex: number) {
    setAnswers((previous) => {
      const next = [...previous]
      next[index] = optionIndex
      return next
    })
  }

  async function sendSubmit(payload: Array<number | null>) {
    if (!attempt) return
    const rawToken = getParticipantToken()
    if (!rawToken) {
      window.location.href = "/account"
      return
    }
    setPhase("submitting")
    setError("")
    try {
      const { response, data } = await callBattle({
        action: "submit",
        attempt_id: attempt.attempt_id,
        answers: payload,
      }, rawToken)
      if (!response.ok) throw new Error(data?.error || "Hasil belum berhasil dikirim.")
      try {
        localStorage.setItem("battle_iq.last_result", JSON.stringify(data.result || {}))
      } catch {}
      window.location.href = "/result"
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hasil belum berhasil dikirim.")
      setPhase("test")
      autoSubmitRef.current = false
    }
  }

  async function finishStage(force = false) {
    if (!attempt || phase === "submitting") return
    const payload = answersRef.current
    const missing = payload.filter((a) => a === null).length

    if (!force && missing > 0 && !window.confirm(`Masih ada ${missing} soal belum dijawab. Tetap lanjut?`)) return

    // Core stage: evaluate eligibility before final submission.
    if (attempt.questions.length === 30 && !attempt.high_range_unlocked) {
      const rawToken = getParticipantToken()
      if (!rawToken) {
        window.location.href = "/account"
        return
      }
      setPhase("submitting")
      setError("")
      try {
        const { response, data } = await callBattle({
          action: "qualify",
          attempt_id: attempt.attempt_id,
          answers: payload.slice(0,30),
        }, rawToken)
        if (!response.ok) throw new Error(data?.error || "Tahap inti belum dapat diperiksa.")

        const result = data.result || {}
        if (result.qualified && Array.isArray(result.questions) && result.questions.length) {
          const extra = result.questions as Question[]
          const nextAnswers = [...payload.slice(0,30), ...Array(extra.length).fill(null)]
          setAttempt({
            ...attempt,
            questions:[...attempt.questions,...extra],
            deadline_at:result.deadline_at,
            high_range_unlocked:true,
            core_answers:payload.slice(0,30),
          })
          setAnswers(nextAnswers)
          answersRef.current = nextAnswers
          setIndex(30)
          setRemainingMs(Math.max(0,new Date(result.deadline_at).getTime()-Date.now()))
          setStageNotice(`High Range terbuka — skor inti ${result.core_score ?? "tinggi"}. Anda mendapat 10 soal tambahan dan 8 menit untuk mengonfirmasi rentang skor atas.`)
          autoSubmitRef.current=false
          setPhase("test")
          return
        }

        await sendSubmit(payload.slice(0,30))
        return
      } catch(e) {
        setError(e instanceof Error ? e.message : "Tahap inti belum dapat diperiksa.")
        setPhase("test")
        autoSubmitRef.current=false
        return
      }
    }

    await sendSubmit(payload)
  }

  if (phase === "loading") {
    return <main className="grid min-h-screen place-items-center bg-[#020817] text-white"><div className="flex items-center gap-3 text-slate-300"><Loader2 className="h-5 w-5 animate-spin"/>Menyiapkan Battle IQ…</div></main>
  }

  if (phase === "error") {
    return <main className="grid min-h-screen place-items-center bg-[#020817] px-5 text-white"><div className="max-w-lg rounded-3xl border border-rose-400/20 bg-rose-500/10 p-7 text-center"><p className="font-bold">{error}</p><a href="/account" className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-black">Masuk ke akun</a></div></main>
  }

  if (phase === "lobby") {
    const used = Math.max(0, Number(participant?.attempts_used) || 0)
    const freeRemaining = Math.max(0, Number(participant?.free_attempts_remaining ?? 1 - used) || 0)
    const paidCredits = Math.max(0, Number(participant?.paid_credits) || 0)
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_18%_0%,rgba(65,105,225,.22),transparent_30rem),linear-gradient(180deg,#020817,#07142f_55%,#040b1c)] text-white">
        <header className="border-b border-white/10 bg-[#020817]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <a href="/battle" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300"><ArrowLeft className="h-4 w-4"/> Battle</a>
            <span className="text-sm font-black">ALZAVA Battle Point</span>
          </div>
        </header>
        <section className="mx-auto grid max-w-6xl gap-7 px-5 py-12 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">Tes Kemampuan</p>
            <h1 className="mt-4 text-5xl font-black leading-[.95] tracking-[-.055em] sm:text-7xl">30 soal.<br/><span className="text-indigo-300">15 menit.</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300">Numerik, logika, verbal, dan spasial dalam satu tes. Setiap season menyediakan <b className="text-white">1 Ranked Attempt gratis</b> yang dapat masuk leaderboard resmi.</p>
            <div className="mt-5 max-w-2xl rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4 text-sm leading-6 text-violet-100"><b>High Range adaptif:</b> bila Battle Point inti mencapai 850+, sistem membuka 10 soal yang lebih sulit dengan tambahan waktu 8 menit. Skor sangat tinggi harus dikonfirmasi pada tahap ini.</div>
            <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Gratis tersisa</span><strong className="mt-1 block text-3xl font-black">{freeRemaining}x</strong></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Kredit Ranked</span><strong className="mt-1 block text-3xl font-black">{paidCredits}x</strong></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Sudah digunakan</span><strong className="mt-1 block text-3xl font-black">{used}x</strong></div>
            </div>
          </div>
          <div className="rounded-3xl border border-cyan-300/20 bg-[#0a1c3b]/90 p-6 shadow-2xl">
            <div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-6 w-6 text-cyan-300"/><div><h2 className="text-xl font-black">Aturan Fair Play</h2><p className="mt-1 text-sm leading-6 text-slate-400">Kerjakan sendiri. Dilarang menggunakan AI generatif, kalkulator, mesin pencari, catatan jawaban, atau bantuan orang lain.</p></div></div>
            <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
              Setelah 1 Ranked Attempt gratis habis, setiap kredit Rp5.000 membuka <b>Ranked Attempt tambahan</b>. Hasilnya tetap dapat memperbaiki skor terbaik dan <b>mempengaruhi leaderboard resmi</b>.
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-6 text-slate-200">
              <input type="checkbox" checked={integrity} onChange={(e)=>setIntegrity(e.target.checked)} className="mt-1 h-5 w-5 accent-indigo-500"/>
              Saya akan mengerjakan sendiri tanpa AI generatif, kalkulator, pencarian web, atau bantuan lain.
            </label>
            {error && <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>}
            {paywall ? (
              <a href="/payment?product=attempt_credit" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3.5 font-black text-slate-950"><CreditCard className="h-5 w-5"/>Beli Ranked Attempt · Rp5.000</a>
            ) : (
              <button onClick={start} disabled={!integrity} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 font-black disabled:cursor-not-allowed disabled:opacity-50"><Flag className="h-5 w-5"/>Mulai / Lanjutkan Tes</button>
            )}
          </div>
        </section>
      </main>
    )
  }

  if (!attempt || !current) return null

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(55,115,255,.16),transparent_28rem),linear-gradient(180deg,#020817,#06132b)] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#020817]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div><p className="text-xs font-black text-cyan-300">{attempt.high_range_unlocked ? "HIGH RANGE · VERIFIED PATH" : isPaidRanked ? "PAID RANKED ATTEMPT" : "RANKED ATTEMPT"}</p><p className="text-sm font-bold text-white">Percobaan #{attempt.attempt_number}{attempt.high_range_unlocked ? " · Tahap 2/2" : " · Tahap 1/2"}</p></div>
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-lg font-black ${remainingMs < 5*60*1000 ? "border-rose-400/30 bg-rose-500/10 text-rose-200" : "border-white/10 bg-white/5"}`}><Clock3 className="h-4 w-4"/>{timeText(remainingMs)}</div>
        </div>
        <div className="h-1 bg-slate-900"><div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all" style={{width: `${progress}%`}}/></div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {isPaidRanked && <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">Ranked Attempt berbayar — hasil tes ini dapat memperbaiki skor terbaik dan posisi leaderboard resmi.</div>}
        {stageNotice && <div className="mb-5 rounded-2xl border border-violet-300/30 bg-violet-500/15 px-4 py-3 text-sm font-semibold leading-6 text-violet-100">{stageNotice}</div>}
        <div className="mb-5 rounded-2xl border border-cyan-300/15 bg-cyan-400/[.06] px-4 py-3 text-xs font-semibold leading-5 text-cyan-100">{attempt.high_range_unlocked ? "High Range: 10 soal tambahan · 8 menit · skor rentang atas sedang diverifikasi." : "Fair Play: 30 soal · 15 menit · kerjakan tanpa AI generatif, mesin pencari, kalkulator, atau bantuan orang lain."}</div>
        {error && <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="rounded-3xl border border-white/10 bg-[#0a1a37]/90 p-5 shadow-2xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">{domainLabel[current.domain] || current.domain}</span>
              <span className="text-sm font-bold text-slate-400">Soal {index + 1} / {attempt.questions.length}</span>
            </div>
            <h1 className="mt-7 text-xl font-extrabold leading-8 text-white sm:text-2xl">{current.prompt}</h1>
            {current.instruction && <p className="mt-3 text-sm leading-6 text-slate-400">{current.instruction}</p>}
            <div className="mt-7 grid gap-3">
              {current.options.map((option, optionIndex) => {
                const selected = answers[index] === optionIndex
                return (
                  <button key={optionIndex} onClick={()=>choose(optionIndex)} className={`flex min-h-14 items-center gap-4 rounded-2xl border p-4 text-left transition-all ${selected ? "border-indigo-400 bg-indigo-500/20 shadow-[0_0_24px_rgba(99,102,241,.18)]" : "border-white/10 bg-slate-950/40 hover:border-cyan-300/30 hover:bg-white/5"}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-black ${selected ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-400"}`}>{String.fromCharCode(65 + optionIndex)}</span>
                    <span className="font-semibold text-slate-100">{option}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-8 flex items-center justify-between gap-3">
              <button onClick={()=>setIndex((i)=>Math.max(0,i-1))} disabled={index===0} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-slate-200 disabled:opacity-30"><ChevronLeft className="h-4 w-4"/>Sebelumnya</button>
              {index < attempt.questions.length - 1 ? (
                <button onClick={()=>setIndex((i)=>Math.min(attempt.questions.length-1,i+1))} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-black">Berikutnya<ChevronRight className="h-4 w-4"/></button>
              ) : (
                <button onClick={()=>finishStage(false)} disabled={phase==="submitting"} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-black disabled:opacity-60">{phase==="submitting"?<Loader2 className="h-4 w-4 animate-spin"/>:<CheckCircle2 className="h-4 w-4"/>}{attempt.questions.length===30 ? "Periksa High Range" : "Kirim Hasil Final"}</button>
              )}
            </div>
          </article>

          <aside className="h-fit rounded-3xl border border-white/10 bg-white/5 p-5 lg:sticky lg:top-24">
            <div className="flex items-center justify-between"><h2 className="font-black">Navigasi Soal</h2><span className="text-xs text-slate-400">{attempt.questions.length-unanswered}/{attempt.questions.length} dijawab</span></div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {attempt.questions.map((_, i) => <button key={i} onClick={()=>setIndex(i)} className={`h-9 rounded-lg text-xs font-black ${i===index ? (i>=30 ? "bg-violet-500 text-white ring-2 ring-violet-300/40" : "bg-indigo-500 text-white ring-2 ring-indigo-300/40") : answers[i]!==null ? "bg-emerald-500/20 text-emerald-200" : i>=30 ? "bg-violet-950/70 text-violet-300" : "bg-slate-900 text-slate-500"}`}>{i+1}</button>)}
            </div>
            <div className="mt-5 rounded-2xl bg-slate-950/40 p-4 text-sm text-slate-400">Belum dijawab: <b className="text-white">{unanswered}</b></div>
            <button onClick={()=>finishStage(false)} disabled={phase==="submitting"} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 font-black text-emerald-200 disabled:opacity-60"><CheckCircle2 className="h-4 w-4"/>{attempt.questions.length===30 ? "Selesai Inti" : "Selesai High Range"}</button>
          </aside>
        </div>
      </section>
    </main>
  )
}
