"use client"

import { FormEvent, useCallback, useEffect, useRef, useState } from "react"
import { Ban, Flag, MessageCircle, Send, ShieldCheck, Trash2, Users } from "lucide-react"
import { getParticipantToken } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"
import { moderationCall } from "@/lib/social"

const CHAT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-chat"

type ChatMessage = {
  id: number
  participant_public_id?: string
  nickname?: string
  avatar_url?: string | null
  message?: string
  created_at?: string
  is_own?: boolean
}

type ChatResponse = {
  messages?: ChatMessage[]
  online_count?: number
}

function initials(name?: string) {
  return (name || "BP").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "BP"
}

function timeLabel(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(date)
}

function playerHref(publicId?: string) {
  return publicId ? `/player/?id=${encodeURIComponent(publicId)}` : ""
}

function ChatAvatar({ item, own = false }: { item: ChatMessage; own?: boolean }) {
  const avatar = item.avatar_url ? (
    <img src={item.avatar_url} alt={item.nickname || "Peserta"} className={`mt-1 h-9 w-9 rounded-full object-cover ring-1 ${own ? "ring-violet-400/40" : "ring-cyan-400/40"}`} />
  ) : (
    <div className={`mt-1 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${own ? "from-violet-500 to-indigo-700" : "from-cyan-500 to-indigo-700"} text-[10px] font-black text-white`}>{initials(item.nickname)}</div>
  )

  const href = playerHref(item.participant_public_id)
  if (!href) return <div className="shrink-0">{avatar}</div>
  return <a href={href} title={`Lihat profil ${item.nickname || "peserta"}`} className="shrink-0 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-300/70">{avatar}</a>
}

export function GlobalChat({ participant }: { participant: BattleParticipant | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [moderatingId, setModeratingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const endRef = useRef<HTMLDivElement | null>(null)

  const callChat = useCallback(async (action: "sync" | "send" | "delete", message?: string, messageId?: number) => {
    const token = getParticipantToken()
    if (!token) throw new Error("participant_required")
    const response = await fetch(CHAT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Battle-Token": token },
      body: JSON.stringify({ action, message, message_id: messageId }),
      cache: "no-store",
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data?.error || "Chat Global belum dapat dimuat.")
    return data as ChatResponse
  }, [])

  const applyChatResponse = useCallback((data: ChatResponse) => {
    setMessages(Array.isArray(data.messages) ? data.messages : [])
    setOnlineCount(Number(data.online_count) || 0)
  }, [])

  const sync = useCallback(async (background = false) => {
    if (!participant || !getParticipantToken()) {
      setLoading(false)
      return
    }
    if (!background) setLoading(true)
    try {
      const data = await callChat("sync")
      applyChatResponse(data)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat Global belum dapat dimuat.")
    } finally {
      if (!background) setLoading(false)
    }
  }, [applyChatResponse, callChat, participant])

  useEffect(() => {
    void sync()
    if (!participant) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void sync(true)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [participant, sync])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setNotice("")
    try {
      const data = await callChat("send", text)
      applyChatResponse(data)
      setDraft("")
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pesan belum dapat dikirim.")
    } finally {
      setSending(false)
    }
  }

  async function deleteMessage(item: ChatMessage) {
    if (!item.is_own || moderatingId !== null) return
    if (!window.confirm("Hapus pesan ini dari Chat Global?")) return
    setModeratingId(item.id)
    setNotice("")
    try {
      const data = await callChat("delete", undefined, item.id)
      applyChatResponse(data)
      setError("")
      setNotice("Pesan sudah dihapus.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pesan belum dapat dihapus.")
    } finally {
      setModeratingId(null)
    }
  }

  async function reportMessage(item: ChatMessage) {
    if (!item.participant_public_id || item.is_own || moderatingId !== null) return
    const reason = window.prompt("Alasan laporan: spam, pelecehan, penipuan, konten tidak pantas, atau lainnya.", "spam")?.trim()
    if (!reason) return
    const extra = window.prompt("Keterangan tambahan (opsional).", "")?.trim() || ""
    setModeratingId(item.id)
    setNotice("")
    try {
      const context = `Chat Global #${item.id}: ${(item.message || "").slice(0, 320)}${extra ? ` | ${extra}` : ""}`.slice(0, 500)
      await moderationCall("report", { target_public_id: item.participant_public_id, reason, details: context })
      setError("")
      setNotice("Laporan sudah dikirim ke pengelola.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Laporan belum dapat dikirim.")
    } finally {
      setModeratingId(null)
    }
  }

  async function blockPlayer(item: ChatMessage) {
    if (!item.participant_public_id || item.is_own || moderatingId !== null) return
    if (!window.confirm(`Blokir ${item.nickname || "pemain ini"}? Pesannya tidak akan tampil lagi untuk Anda dan pesan pribadi akan dinonaktifkan.`)) return
    setModeratingId(item.id)
    setNotice("")
    try {
      await moderationCall("block", { target_public_id: item.participant_public_id })
      await sync(true)
      setError("")
      setNotice(`${item.nickname || "Pemain"} telah diblokir.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pemain belum dapat diblokir.")
    } finally {
      setModeratingId(null)
    }
  }

  if (!participant) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[.05] p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,.28)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300"><MessageCircle className="h-7 w-7" /></div>
        <h2 className="mt-4 text-2xl font-black text-white">Masuk untuk ikut Chat Global</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">Chat Global khusus peserta yang sudah masuk akun, supaya nama panggilan dan foto profil setiap pengirim tetap jelas.</p>
        <a href="/account" className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-black text-white shadow-[0_0_28px_rgba(99,102,241,.35)]">Masuk / Daftar</a>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#071126]/90 shadow-[0_24px_80px_rgba(0,0,0,.35)]">
      <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[.035] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300"><MessageCircle className="h-6 w-6" /></div>
            <div>
              <h2 className="text-xl font-black text-white sm:text-2xl">Saluran Chat Global</h2>
              <p className="mt-0.5 text-xs text-slate-400">Ngobrol, sharing pengalaman, dan kenalan dengan peserta lain. Klik foto atau nama untuk melihat profil pemain.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-2 text-xs font-black text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.9)]" />
          <Users className="h-4 w-4" /> {onlineCount} online
        </div>
      </div>

      <div className="h-[520px] overflow-y-auto px-4 py-5 sm:px-6">
        {loading ? (
          <div className="grid h-full place-items-center text-sm text-slate-400">Memuat percakapan…</div>
        ) : messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div><p className="text-lg font-black text-white">Belum ada obrolan.</p><p className="mt-1 text-sm text-slate-400">Jadilah yang pertama menyapa 👋</p></div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((item) => (
              <div key={item.id} className={`flex gap-3 ${item.is_own ? "justify-end" : "justify-start"}`}>
                {!item.is_own && <ChatAvatar item={item} />}
                <div className={`max-w-[82%] sm:max-w-[70%] ${item.is_own ? "text-right" : "text-left"}`}>
                  <div className={`mb-1 flex items-center gap-2 text-[11px] ${item.is_own ? "justify-end" : "justify-start"}`}>
                    {item.participant_public_id ? <a href={playerHref(item.participant_public_id)} className="font-black text-slate-300 transition-colors hover:text-cyan-300 hover:underline">{item.is_own ? "Anda" : item.nickname || "Peserta"}</a> : <span className="font-black text-slate-300">{item.is_own ? "Anda" : item.nickname || "Peserta"}</span>}
                    <span className="text-slate-600">{timeLabel(item.created_at)}</span>
                  </div>
                  <div className={`inline-block rounded-2xl px-4 py-3 text-left text-sm leading-6 shadow-lg ${item.is_own ? "rounded-tr-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white" : "rounded-tl-md border border-white/10 bg-white/[.07] text-slate-100"}`}>
                    <p className="whitespace-pre-wrap break-words">{item.message}</p>
                  </div>
                  <div className={`mt-1.5 flex items-center gap-2 text-[10px] ${item.is_own ? "justify-end" : "justify-start"}`}>
                    {item.is_own ? (
                      <button disabled={moderatingId !== null} onClick={() => void deleteMessage(item)} className="inline-flex items-center gap-1 text-slate-600 transition-colors hover:text-rose-300 disabled:opacity-40"><Trash2 className="h-3 w-3" /> Hapus</button>
                    ) : item.participant_public_id ? (
                      <>
                        <button disabled={moderatingId !== null} onClick={() => void reportMessage(item)} className="inline-flex items-center gap-1 text-slate-600 transition-colors hover:text-amber-300 disabled:opacity-40"><Flag className="h-3 w-3" /> Laporkan</button>
                        <button disabled={moderatingId !== null} onClick={() => void blockPlayer(item)} className="inline-flex items-center gap-1 text-slate-600 transition-colors hover:text-rose-300 disabled:opacity-40"><Ban className="h-3 w-3" /> Blokir</button>
                      </>
                    ) : null}
                  </div>
                </div>
                {item.is_own && <ChatAvatar item={item} own />}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-white/10 bg-slate-950/45 p-4 sm:p-5">
        {notice && <p className="mb-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200">{notice}</p>}
        {error && <p className="mb-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200">{error}</p>}
        <div className="flex items-stretch gap-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 300))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.altKey) {
                event.preventDefault()
                if (!sending && draft.trim()) event.currentTarget.form?.requestSubmit()
              }
            }}
            rows={1}
            maxLength={300}
            placeholder={`Tulis pesan sebagai ${participant.nickname || "peserta"}…`}
            className="min-h-12 max-h-28 min-w-0 flex-1 resize-y rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50 focus:bg-white/[.08]"
          />
          <button type="submit" disabled={sending || !draft.trim()} aria-label="Kirim pesan" className="grid h-12 w-12 shrink-0 place-items-center self-start rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-[0_0_24px_rgba(34,211,238,.25)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-5 w-5" /></button>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Saling menghormati · jangan spam · hindari data pribadi</span>
          <span>Enter kirim · Alt+Enter baris baru · {draft.length}/300</span>
        </div>
      </form>
    </section>
  )
}
