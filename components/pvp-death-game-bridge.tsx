"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Flame, Loader2, Swords, Trophy, Zap } from "lucide-react"
import { getParticipantToken } from "@/lib/battle"

const PVP_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-pvp"
const DEATH_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-pvp-death"

type Player = { nickname?: string; avatar_url?: string | null }
type DeathMatch = {
  id?: string
  status?: string
  sudden_death_started_at?: string | null
  my_score?: number
  opponent_score?: number
}
type Question = { index: number; category: string; prompt: string; options: string[] }
type DeathState = { match?: DeathMatch; me?: Player; opponent?: Player; server_now?: string; question?: Question | null; death_countdown_ms?: number }

function initials(name?: string) {
  return (name || "BP").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "BP"
}

function Avatar({ player }: { player?: Player }) {
  if (player?.avatar_url) return <img src={player.avatar_url} alt={player.nickname || "Pemain"} className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-300/70" />
  return <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-lg font-black text-white ring-2 ring-amber-300/60">{initials(player?.nickname)}</div>
}

function bodyOf(init?: RequestInit) {
  if (typeof init?.body !== "string") return null
  try { return JSON.parse(init.body) as Record<string, unknown> } catch { return null }
}

function urlOf(input: RequestInfo | URL) {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.toString()
  return input.url
}

async function deathRequest(body: Record<string, unknown>) {
  const token = getParticipantToken()
  if (!token) throw new Error("Sesi peserta tidak ditemukan.")
  const response = await fetch(DEATH_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Battle-Token": token },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data?.error || "Death Game belum dapat diproses.") as Error & { code?: string }
    error.code = data?.code
    throw error
  }
  return data as DeathState
}

export function PvpDeathGameBridge() {
  const [active, setActive] = useState<DeathState | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [now, setNow] = useState(Date.now())
  const [serverOffset, setServerOffset] = useState(0)
  const loadingQuestion = useRef(false)

  const sync = useCallback((serverNow?: string) => {
    if (!serverNow) return
    const parsed = new Date(serverNow).getTime()
    if (Number.isFinite(parsed)) setServerOffset(parsed - Date.now())
  }, [])

  const clearDeath = useCallback(() => {
    setActive(null)
    setQuestion(null)
    setBusy(false)
    setError("")
    loadingQuestion.current = false
  }, [])

  useLayoutEffect(() => {
    const originalFetch = window.fetch.bind(window)
    const patchedFetch: typeof window.fetch = async (input, init) => {
      const response = await originalFetch(input, init)
      try {
        const url = urlOf(input)
        const requestBody = bodyOf(init)
        const action = String(requestBody?.action || "")
        if (url.includes("/functions/v1/battle-pvp") && !url.includes("battle-pvp-death") && response.ok && ["state", "ready", "answer"].includes(action)) {
          const data = await response.clone().json().catch(() => null) as DeathState | null
          if (data?.match?.status === "death" && data.match.id) {
            sync(data.server_now)
            setActive(data)
          } else if (data?.match?.status === "finished" || data?.match?.status === "cancelled") {
            clearDeath()
          }
        }
      } catch {
        // Death Game interception must never disturb the real PVP request.
      }
      return response
    }
    window.fetch = patchedFetch
    return () => { if (window.fetch === patchedFetch) window.fetch = originalFetch }
  }, [clearDeath, sync])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(timer)
  }, [])

  const startAt = active?.match?.sudden_death_started_at ? new Date(active.match.sudden_death_started_at).getTime() : 0
  const serverNow = now + serverOffset
  const countdownMs = Math.max(0, startAt - serverNow)
  const countdown = Math.max(0, Math.ceil(countdownMs / 1000))

  useEffect(() => {
    const matchId = active?.match?.id
    if (!matchId || question || loadingQuestion.current || countdownMs > 0) return
    loadingQuestion.current = true
    void deathRequest({ action: "question", match_id: matchId })
      .then((data) => {
        sync(data.server_now)
        if (data.question) setQuestion(data.question)
        if (data.match?.status !== "death") clearDeath()
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Soal Death Game belum dapat dimuat."))
      .finally(() => { loadingQuestion.current = false })
  }, [active?.match?.id, clearDeath, countdownMs, question, sync])

  useEffect(() => {
    if (!active?.match?.id || question || countdownMs > 0) return
    const timer = window.setInterval(() => {
      if (loadingQuestion.current || question) return
      loadingQuestion.current = true
      void deathRequest({ action: "question", match_id: active.match?.id })
        .then((data) => { sync(data.server_now); if (data.question) setQuestion(data.question) })
        .catch(() => {})
        .finally(() => { loadingQuestion.current = false })
    }, 500)
    return () => window.clearInterval(timer)
  }, [active?.match?.id, countdownMs, question, sync])

  const answer = useCallback(async (answerIndex: number) => {
    const matchId = active?.match?.id
    if (!matchId || !question || busy) return
    setBusy(true)
    setError("")
    try {
      await deathRequest({ action: "answer", match_id: matchId, answer_index: answerIndex })
    } catch (e) {
      const err = e as Error & { code?: string }
      if (err.code !== "match_finished") setError(err.message)
    } finally {
      const token = getParticipantToken()
      if (token) {
        try {
          await window.fetch(PVP_API, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Battle-Token": token },
            body: JSON.stringify({ action: "state", match_id: matchId }),
            cache: "no-store",
          })
        } catch {}
      }
      setBusy(false)
    }
  }, [active?.match?.id, busy, question])

  if (!active?.match?.id) return null

  const myScore = Number(active.match.my_score || 0)
  const opponentScore = Number(active.match.opponent_score || 0)

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_50%_22%,rgba(239,68,68,.22),transparent_30%),rgba(1,4,15,.94)] p-4 backdrop-blur-xl">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[34px] border border-rose-400/45 bg-[linear-gradient(180deg,rgba(28,9,29,.98),rgba(4,13,31,.99)_42%,rgba(2,8,24,.99))] p-5 shadow-[0_0_60px_rgba(239,68,68,.22),0_40px_100px_rgba(0,0,0,.75)] sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(251,191,36,.8)_1px,transparent_1.6px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_38%_at_50%_0%,black,transparent_75%)]" />
        <div className="relative text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[24px] border border-amber-300/40 bg-gradient-to-br from-rose-500/25 via-amber-400/15 to-violet-500/20 shadow-[0_0_34px_rgba(251,191,36,.24)]">
            <Flame className="h-10 w-10 text-amber-300 drop-shadow-[0_0_14px_rgba(251,191,36,.8)]" />
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[.34em] text-rose-300">Skor Seri</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-6xl">DEATH <span className="text-amber-300">GAME</span></h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Satu soal terakhir. <strong className="text-white">Jawaban pertama yang masuk</strong> langsung merebut <strong className="text-amber-300">+100 PVP Point</strong> dan menentukan pemenang.</p>
        </div>

        <div className="relative mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-3xl border border-white/10 bg-black/25 p-4 text-center sm:p-5">
          <div><p className="text-xs font-black uppercase tracking-wider text-cyan-300">{active.me?.nickname || "Kamu"}</p><p className="mt-1 text-4xl font-black text-white sm:text-5xl">{myScore}</p></div>
          <div className="grid h-12 w-12 place-items-center rounded-full border border-amber-300/35 bg-amber-300/10 text-sm font-black text-amber-200">VS</div>
          <div><p className="text-xs font-black uppercase tracking-wider text-violet-300">{active.opponent?.nickname || "Lawan"}</p><p className="mt-1 text-4xl font-black text-white sm:text-5xl">{opponentScore}</p></div>
        </div>

        {countdownMs > 0 ? (
          <div className="relative mt-7 rounded-[28px] border border-amber-300/25 bg-gradient-to-b from-amber-300/10 to-rose-500/5 px-5 py-10 text-center">
            <Zap className="mx-auto h-7 w-7 text-amber-300" />
            <p className="mt-3 text-sm font-black uppercase tracking-[.28em] text-amber-200">Soal rebutan dibuka dalam</p>
            <p className="mt-2 text-[92px] font-black leading-none text-white drop-shadow-[0_0_34px_rgba(251,191,36,.55)] sm:text-[120px]">{Math.max(1, countdown)}</p>
            <p className="mt-4 text-sm text-slate-400">Bersiap. Begitu soal muncul, kecepatan menentukan.</p>
          </div>
        ) : question ? (
          <div className="relative mt-7 rounded-[30px] border border-amber-300/30 bg-gradient-to-b from-[#111b35] to-[#071126] p-5 shadow-[0_26px_70px_rgba(0,0,0,.4)] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-rose-200"><Swords className="h-4 w-4" />Soal Rebutan</span><span className="text-xs font-bold text-amber-300">+100 untuk jawaban pertama</span></div>
            <h3 className="mt-6 text-xl font-black leading-relaxed text-white sm:text-2xl">{question.prompt}</h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">{question.options.map((option, index) => <button key={index} disabled={busy} onClick={() => void answer(index)} className="group flex min-h-[78px] items-center gap-4 rounded-2xl border border-white/10 bg-white/[.045] p-4 text-left font-bold text-slate-100 transition duration-150 hover:-translate-y-0.5 hover:border-amber-300/55 hover:bg-amber-300/10 hover:shadow-[0_0_22px_rgba(251,191,36,.12)] disabled:cursor-not-allowed disabled:opacity-45"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-300/25 bg-black/30 text-sm font-black text-amber-300">{String.fromCharCode(65 + index)}</span><span>{option}</span></button>)}</div>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-slate-400"><Trophy className="h-4 w-4 text-amber-300" />Tidak ada kesempatan kedua — siapa lebih cepat, dia menang.</div>
            {busy && <div className="absolute inset-0 grid place-items-center rounded-[30px] bg-black/45 backdrop-blur-sm"><div className="flex items-center gap-3 rounded-full border border-amber-300/30 bg-[#111827] px-5 py-3 font-black text-amber-200"><Loader2 className="h-5 w-5 animate-spin" />Mengunci jawaban…</div></div>}
          </div>
        ) : (
          <div className="relative mt-7 grid min-h-[260px] place-items-center rounded-[28px] border border-white/10 bg-white/[.035] text-center"><div><Loader2 className="mx-auto h-9 w-9 animate-spin text-amber-300"/><p className="mt-3 font-black text-white">Membuka soal Death Game…</p></div></div>
        )}
        {error && <div className="relative mt-4 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-center text-sm text-rose-100">{error}</div>}
      </div>
    </div>
  )
}

export default PvpDeathGameBridge
