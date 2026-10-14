"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRight, BrainCircuit, CheckCircle2, Loader2, Send, ShieldCheck, Sparkles, X } from "lucide-react"
import type { BattleParticipant } from "@/lib/battle"
import { getParticipantToken } from "@/lib/battle"

const AI_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/alzava-ai-coach"
const LOGO = "/ai/alzava-ai-coach.svg"
const AI_DAILY_LIMIT = 5
const SUGGESTIONS = [
  "Ajari aku trik deret angka TIU",
  "Bagaimana cara belajar TWK yang efektif?",
  "Buat contoh soal penalaran sulit",
  "Jelaskan topik sains yang menarik",
]
type Message = { role: "user" | "assistant"; text: string }
export function AlzavaAiCoach({ participant }: { participant: BattleParticipant | null }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [remaining, setRemaining] = useState<number | null>(null)
  const [dailyLimit, setDailyLimit] = useState(AI_DAILY_LIMIT)
  const [lastProvider, setLastProvider] = useState("")
  const [quotaLoading, setQuotaLoading] = useState(false)
  const quotaRequestRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => { setMessages([]); setRemaining(null); setError(""); setLastProvider("") }, [participant?.public_id])

  const refreshRemaining = useCallback(async () => {
    const requestId = ++quotaRequestRef.current
    const token = getParticipantToken()
    if (!token || !participant) { setRemaining(null); setQuotaLoading(false); return }
    setQuotaLoading(true)
    try {
      const response = await fetch(AI_API, {
        method: "GET",
        headers: { "X-Battle-Token": token },
        cache: "no-store",
      })
      const result = await response.json().catch(() => ({}))
      if (quotaRequestRef.current !== requestId) return
      if (response.ok && result?.ok && Number.isInteger(result?.daily_limit) && result.daily_limit > 0 && result.daily_limit <= 100) {
        setDailyLimit(result.daily_limit)
      }
      setRemaining(response.ok && result?.ok && Number.isFinite(result?.remaining)
        ? Math.max(0, Number(result.remaining)) : null)
    } catch {
      if (quotaRequestRef.current === requestId) setRemaining(null)
    } finally {
      if (quotaRequestRef.current === requestId) setQuotaLoading(false)
    }
  }, [participant?.public_id])

  useEffect(() => {
    if (open && participant) void refreshRemaining()
  }, [open, participant?.public_id, refreshRemaining])

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }) }, [messages, busy])
  useEffect(() => {
    if (open && participant) inputRef.current?.focus()
  }, [open, participant])

  async function send(event?: React.FormEvent) {
    event?.preventDefault()
    if (busy || !participant) return
    const question = draft.trim()
    if (!question) return
    if (question.length > 650) { setError("Maksimal 650 karakter."); return }
    if (remaining === 0) {
      setError("Jatah AI hari ini sudah habis. Coba lagi setelah reset 00.00 WIB.")
      return
    }
    const token = getParticipantToken()
    if (!token) { setError("Silakan masuk kembali ke akun ALZAVA."); return }
    ++quotaRequestRef.current
    setQuotaLoading(false)
    setBusy(true)
    setError("")
    setMessages(previous => [...previous, { role: "user", text: question }])
    setDraft("")
    try {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 35000)
      let response: Response
      try {
        response = await fetch(AI_API, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Battle-Token": token },
          body: JSON.stringify({ prompt: question }),
          signal: controller.signal,
          cache: "no-store",
        })
      } finally {
        window.clearTimeout(timeout)
      }
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.ok || typeof result?.answer !== "string") {
        throw new Error(typeof result?.error === "string" ? result.error : "AI sedang tidak tersedia. Coba lagi nanti.")
      }
      setMessages(previous => [...previous, { role: "assistant", text: result.answer }])
      if (Number.isFinite(result.remaining)) setRemaining(Number(result.remaining))
      if (Number.isInteger(result.daily_limit) && result.daily_limit > 0 && result.daily_limit <= 100) setDailyLimit(result.daily_limit)
      setLastProvider(result.provider === "workers-ai" ? "Cloudflare AI" : "Gemini AI")
    } catch (cause) {
      void refreshRemaining()
      setError(cause instanceof Error && cause.name === "AbortError"
        ? "Respons terlalu lama. Silakan coba lagi."
        : cause instanceof Error ? cause.message : "Terjadi kendala, coba lagi nanti.")
    } finally { setBusy(false) }
  }

  return (
    <>
      <section aria-label="ALZAVA AI Coach" className="relative overflow-hidden rounded-[26px] border border-cyan-300/25 bg-[radial-gradient(circle_at_15%_50%,rgba(34,211,238,0.14),transparent_46%),linear-gradient(115deg,#0b1b37,#08142d_54%,#101a40)] px-4 py-5 shadow-[0_15px_55px_rgba(0,0,0,0.20)] sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle,rgba(251,191,36,.13),transparent_68%)]" />
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
          <img src={LOGO} alt="Lambang ALZAVA AI Coach" width={92} height={92} className="h-16 w-20 shrink-0 object-contain drop-shadow-[0_0_18px_rgba(34,211,238,.25)] sm:h-20 sm:w-24" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[.19em] text-cyan-300">ALZAVA Intelligence</span>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-extrabold text-emerald-300">Hybrid AI</span>
            </div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-[27px]">Kenalkan, <span className="bg-gradient-to-r from-amber-300 to-cyan-300 bg-clip-text text-transparent">ALZAVA AI Coach</span></h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">Asisten belajar untuk SKD, penalaran, matematika, sains, bahasa, dan pengetahuan umum. Tanyakan konsep yang ingin kamu pahami.</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-cyan-100/75">
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> Gemini + Cloudflare AI · kuota harian</span>
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-amber-300" /> Tidak aktif untuk bantuan ujian berlangsung</span>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 via-cyan-300 to-sky-400 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_25px_rgba(34,211,238,.23)] transition hover:-translate-y-0.5 hover:brightness-110 sm:w-auto">
            <Sparkles className="h-4 w-4" /> Coba AI Coach <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setOpen(previous => !previous)}
        aria-label={open ? "Tutup ALZAVA AI Coach" : "Buka ALZAVA AI Coach"}
        aria-expanded={open}
        className="fixed bottom-5 right-4 z-[155] grid h-[62px] w-[62px] place-items-center rounded-2xl border border-amber-300/45 bg-[#08172f] p-1.5 shadow-[0_0_25px_rgba(34,211,238,.25),0_14px_40px_rgba(0,0,0,.55)] ring-1 ring-cyan-200/15 transition hover:-translate-y-1 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 sm:bottom-6 sm:right-6"
      >
        {open ? <X className="h-6 w-6 text-white" /> : <img src={LOGO} alt="" className="h-11 w-11 object-contain" />}
      </button>

      {open && (
        <div role="dialog" aria-modal="false" aria-label="ALZAVA AI Coach" className="fixed bottom-[90px] right-3 z-[154] flex max-h-[min(76dvh,650px)] w-[calc(100vw-24px)] max-w-[400px] flex-col overflow-hidden rounded-[24px] border border-cyan-300/30 bg-[#07152c] shadow-[0_20px_80px_rgba(0,0,0,.75)] sm:bottom-[100px] sm:right-6">
          <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-gradient-to-r from-[#102b53] via-[#101d3a] to-[#1a2347] p-4">
            <img src={LOGO} alt="" className="h-12 w-12 object-contain" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-black tracking-[.1em] text-amber-300">ALZAVA AI COACH</div>
              <p className="text-[11px] font-medium text-cyan-100/80">Asisten belajar SKD & pengetahuan umum</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup panel" className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
          </header>

          {!participant ? (
            <div className="flex flex-col items-center gap-3 px-5 py-9 text-center">
              <BrainCircuit className="h-10 w-10 text-cyan-300" />
              <h3 className="text-base font-extrabold text-white">Masuk untuk belajar bersama AI</h3>
              <p className="text-sm leading-6 text-slate-300">AI Coach tersedia untuk peserta ALZAVA agar kuota gratis dapat dibagi secara adil.</p>
              <a href="/account" className="mt-1 rounded-xl bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950">Masuk / Daftar Gratis</a>
            </div>
          ) : (
            <>
              <div ref={scrollRef} aria-live="polite" className="min-h-[190px] flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
                {messages.length === 0 && (
                  <div className="space-y-4">
                    <p className="text-sm leading-6 text-slate-200">Halo! Aku siap membantu belajar SKD, penalaran, dan berbagai topik pengetahuan umum. Mau bertanya apa hari ini?</p>
                    <div className="grid gap-2">
                      {SUGGESTIONS.map(text => (
                        <button key={text} type="button" onClick={() => { setDraft(text); inputRef.current?.focus() }} className="rounded-xl border border-cyan-300/20 bg-cyan-300/[.07] px-3 py-2.5 text-left text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/15">
                          <Sparkles className="mr-2 inline h-3.5 w-3.5 text-amber-300" />{text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div key={index} className={`rounded-2xl px-3.5 py-3 leading-6 whitespace-pre-wrap break-words ${message.role === "user" ? "ml-7 bg-cyan-300/15 text-cyan-50" : "mr-4 border border-white/10 bg-white/[.06] text-slate-100"}`}>
                    {message.text}
                  </div>
                ))}
                {busy && <div className="flex items-center gap-2 text-xs text-cyan-200"><Loader2 className="h-4 w-4 animate-spin" /> AI sedang menyusun jawaban...</div>}
                {error && <p role="alert" className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-100">{error}</p>}
              </div>
              <form onSubmit={send} className="shrink-0 border-t border-white/10 bg-[#0a1931] p-3">
                <div className="flex items-end gap-2 rounded-xl border border-cyan-300/20 bg-white/[.05] p-2">
                  <textarea ref={inputRef} value={draft} maxLength={650} rows={2} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send() } }} placeholder="Tanya SKD, sains, bahasa, atau apa saja..." aria-label="Pertanyaan untuk AI Coach" className="max-h-28 min-h-[48px] flex-1 resize-none bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-slate-500" />
                  <button type="submit" disabled={busy || !draft.trim() || remaining === 0} aria-label="Kirim pertanyaan" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-300 text-slate-950 disabled:opacity-40"><Send className="h-4 w-4" /></button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                  <span>{quotaLoading ? "Memeriksa kuota akun..." : remaining === null ? `Kuota belum terbaca · maks. ${AI_DAILY_LIMIT}/hari` : remaining === 0 ? "Jatah hari ini habis · reset 00.00 WIB" : `Sisa ${remaining} dari ${dailyLimit} pertanyaan hari ini`}</span>
                  <span>{lastProvider ? `${lastProvider} · ` : ""}AI dapat keliru</span>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}
