"use client"

import { Check, Clock3, MessageCircle, Send, UserCheck, UserPlus, Users, X } from "lucide-react"
import { FormEvent, useCallback, useEffect, useRef, useState } from "react"
import type { BattleParticipant } from "@/lib/battle"
import {
  playerProfileHref,
  socialCall,
  type ConversationItem,
  type FriendItem,
  type PrivateMessage,
  type SocialOverview,
  type SocialProfile,
  type ThreadResponse,
} from "@/lib/social"

function initials(name?: string) {
  return (name || "BP").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "BP"
}

function timeLabel(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const now = new Date()
  const sameDay = now.toDateString() === date.toDateString()
  return new Intl.DateTimeFormat("id-ID", sameDay ? { hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "short" }).format(date)
}

function Avatar({ profile, size = "md" }: { profile?: SocialProfile | null; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-9 w-9" : "h-10 w-10"
  if (profile?.avatar_url) return <img src={profile.avatar_url} alt={profile.nickname || "Peserta"} className={`${cls} shrink-0 rounded-full object-cover ring-1 ring-cyan-300/30`} />
  return <div className={`${cls} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-700 text-[10px] font-black text-white ring-1 ring-cyan-300/30`}>{initials(profile?.nickname)}</div>
}

export function PrivateMessages({ participant }: { participant: BattleParticipant | null }) {
  const [overview, setOverview] = useState<SocialOverview | null>(null)
  const [selectedId, setSelectedId] = useState("")
  const [selectedOther, setSelectedOther] = useState<SocialProfile | null>(null)
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [threadError, setThreadError] = useState("")
  const queryOpenedRef = useRef(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  const loadOverview = useCallback(async (background = false) => {
    if (!participant) { setLoading(false); return }
    if (!background) setLoading(true)
    try {
      const data = await socialCall<SocialOverview>("overview")
      setOverview(data)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pesan dan teman belum dapat dimuat.")
    } finally {
      if (!background) setLoading(false)
    }
  }, [participant])

  const applyThread = useCallback((data: ThreadResponse) => {
    setSelectedId(data.conversation?.id || "")
    setSelectedOther(data.conversation?.other || null)
    setMessages(Array.isArray(data.messages) ? data.messages : [])
    setThreadError("")
  }, [])

  const openTarget = useCallback(async (publicId?: string) => {
    if (!publicId) return
    setThreadLoading(true)
    try {
      const data = await socialCall<ThreadResponse>("open_chat", { target_public_id: publicId })
      applyThread(data)
      void loadOverview(true)
    } catch (err) {
      setThreadError(err instanceof Error ? err.message : "Percakapan belum dapat dibuka.")
    } finally {
      setThreadLoading(false)
    }
  }, [applyThread, loadOverview])

  const syncThread = useCallback(async () => {
    if (!selectedId) return
    try {
      const data = await socialCall<ThreadResponse>("sync_chat", { conversation_id: selectedId })
      applyThread(data)
    } catch (err) {
      setThreadError(err instanceof Error ? err.message : "Percakapan belum dapat diperbarui.")
    }
  }, [selectedId, applyThread])

  useEffect(() => { void loadOverview() }, [loadOverview])

  useEffect(() => {
    if (!participant || queryOpenedRef.current) return
    const target = new URLSearchParams(window.location.search).get("with") || ""
    if (!target) { queryOpenedRef.current = true; return }
    queryOpenedRef.current = true
    void openTarget(target)
  }, [participant, openTarget])

  useEffect(() => {
    if (!participant) return
    const overviewTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadOverview(true)
    }, 20000)
    return () => window.clearInterval(overviewTimer)
  }, [participant, loadOverview])

  useEffect(() => {
    if (!selectedId) return
    const threadTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") void syncThread()
    }, 5000)
    return () => window.clearInterval(threadTimer)
  }, [selectedId, syncThread])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length])

  async function respond(item: FriendItem, accept: boolean) {
    const publicId = item.participant?.public_id
    if (!publicId) return
    try {
      await socialCall(accept ? "friend_accept" : "friend_reject", { target_public_id: publicId })
      await loadOverview(true)
      if (accept) void openTarget(publicId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Permintaan belum dapat diproses.")
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !selectedId || sending) return
    setSending(true)
    try {
      const data = await socialCall<ThreadResponse>("send_message", { conversation_id: selectedId, message: text })
      applyThread(data)
      setDraft("")
      void loadOverview(true)
    } catch (err) {
      setThreadError(err instanceof Error ? err.message : "Pesan belum dapat dikirim.")
    } finally {
      setSending(false)
    }
  }

  if (!participant) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[.05] p-10 text-center">
        <MessageCircle className="mx-auto h-10 w-10 text-cyan-300" />
        <h1 className="mt-4 text-3xl font-black">Masuk untuk memakai Pesan & Teman</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">Pertemanan dan pesan pribadi hanya tersedia untuk akun peserta agar identitas pengirim tetap jelas.</p>
        <a href="/account" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-black text-white">Masuk / Daftar</a>
      </section>
    )
  }

  const incoming = overview?.incoming_requests || []
  const outgoing = overview?.outgoing_requests || []
  const friends = overview?.friends || []
  const conversations = overview?.conversations || []

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#071126]/90 shadow-[0_26px_90px_rgba(0,0,0,.36)]">
      <div className="border-b border-white/10 bg-white/[.035] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[.16em] text-cyan-300">SOCIAL BATTLE</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Pesan & Teman</h1><p className="mt-1 text-sm text-slate-400">Berteman, ngobrol pribadi, lalu kembali adu Battle Point.</p></div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"><strong className="block text-lg font-black">{friends.length}</strong><span className="text-[10px] text-slate-500">Teman</span></div>
            <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[.06] px-3 py-2"><strong className="block text-lg font-black text-cyan-300">{overview?.unread_total || 0}</strong><span className="text-[10px] text-slate-500">Belum dibaca</span></div>
            <div className="rounded-xl border border-amber-300/15 bg-amber-300/[.06] px-3 py-2"><strong className="block text-lg font-black text-amber-300">{incoming.length}</strong><span className="text-[10px] text-slate-500">Permintaan</span></div>
          </div>
        </div>
      </div>

      {error && <div className="mx-5 mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-200 sm:mx-7">{error}</div>}

      <div className="grid min-h-[650px] lg:grid-cols-[360px_1fr]">
        <aside className="border-b border-white/10 bg-slate-950/28 p-4 lg:border-b-0 lg:border-r lg:p-5">
          {loading ? <div className="grid h-48 place-items-center text-sm text-slate-500">Memuat sosial…</div> : <div className="space-y-6">
            {incoming.length > 0 && <div><div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300"><UserPlus className="h-4 w-4" /> Permintaan Teman</div><div className="space-y-2">{incoming.map((item) => <div key={item.relation_id} className="rounded-2xl border border-amber-300/15 bg-amber-300/[.055] p-3"><div className="flex items-center gap-3"><a href={playerProfileHref(item.participant?.public_id)}><Avatar profile={item.participant} /></a><div className="min-w-0 flex-1"><a href={playerProfileHref(item.participant?.public_id)} className="block truncate text-sm font-black hover:text-cyan-300">{item.participant?.nickname || "Peserta"}</a><p className="truncate text-[10px] text-slate-500">{item.participant?.regency_name || item.participant?.province_name || "Indonesia"}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => void respond(item, true)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950"><Check className="h-3.5 w-3.5" /> Terima</button><button onClick={() => void respond(item, false)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300"><X className="h-3.5 w-3.5" /> Tolak</button></div></div>)}</div></div>}

            <div><div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-300"><MessageCircle className="h-4 w-4" /> Pesan</span>{(overview?.unread_total || 0) > 0 && <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-[10px] font-black text-slate-950">{overview?.unread_total}</span>}</div><div className="space-y-1.5">{conversations.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-600">Belum ada percakapan pribadi.</div> : conversations.map((item: ConversationItem) => <button key={item.id} onClick={() => void socialCall<ThreadResponse>("sync_chat", { conversation_id: item.id }).then(applyThread).catch((err) => setThreadError(err instanceof Error ? err.message : "Percakapan belum dapat dibuka."))} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${selectedId === item.id ? "bg-indigo-500/15 ring-1 ring-indigo-400/25" : "hover:bg-white/5"}`}><Avatar profile={item.participant} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-black">{item.participant?.nickname || "Peserta"}</span><span className="shrink-0 text-[10px] text-slate-600">{timeLabel(item.last_message?.created_at || item.last_message_at)}</span></div><div className="mt-0.5 flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-xs text-slate-500">{item.last_message ? `${item.last_message.is_own ? "Anda: " : ""}${item.last_message.message || ""}` : "Mulai percakapan"}</p>{Number(item.unread_count || 0) > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-cyan-400 px-1 text-[10px] font-black text-slate-950">{item.unread_count}</span>}</div></div></button>)}</div></div>

            <div><div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-300"><Users className="h-4 w-4" /> Teman</div><div className="space-y-1.5">{friends.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-600">Belum ada teman. Tambahkan dari profil pemain.</div> : friends.map((item) => <button key={item.relation_id} onClick={() => void openTarget(item.participant?.public_id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/5"><Avatar profile={item.participant} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.participant?.nickname || "Peserta"}</p><p className="truncate text-[10px] text-slate-600">{item.participant?.regency_name || item.participant?.province_name || "Indonesia"}</p></div><MessageCircle className="h-4 w-4 text-slate-600" /></button>)}</div></div>

            {outgoing.length > 0 && <div className="text-xs text-slate-600"><Clock3 className="mr-1 inline h-3.5 w-3.5" /> {outgoing.length} permintaan pertemanan masih menunggu.</div>}
          </div>}
        </aside>

        <div className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,.08),transparent_28rem)]">
          {!selectedId || !selectedOther ? <div className="grid flex-1 place-items-center p-8 text-center"><div><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-indigo-400/10 text-indigo-300"><UserCheck className="h-8 w-8" /></div><h2 className="mt-4 text-2xl font-black">Pilih teman untuk ngobrol</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Pesan pribadi V1 hanya teks, sehingga tetap ringan. Klik teman atau percakapan di sebelah kiri.</p></div></div> : <>
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6"><a href={playerProfileHref(selectedOther.public_id)} className="flex min-w-0 items-center gap-3 rounded-xl hover:bg-white/[.035]"><Avatar profile={selectedOther} size="lg" /><div className="min-w-0"><p className="truncate font-black">{selectedOther.nickname || "Peserta"}</p><p className="truncate text-xs text-slate-500">{[selectedOther.district_name, selectedOther.regency_name].filter(Boolean).join(" · ") || selectedOther.province_name || "Indonesia"}</p></div></a><a href={playerProfileHref(selectedOther.public_id)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10">Lihat Profil</a></div>

            <div className="h-[500px] overflow-y-auto px-4 py-5 sm:px-6">{threadLoading ? <div className="grid h-full place-items-center text-sm text-slate-500">Membuka percakapan…</div> : messages.length === 0 ? <div className="grid h-full place-items-center text-center"><div><MessageCircle className="mx-auto h-8 w-8 text-slate-700" /><p className="mt-3 font-black">Belum ada pesan.</p><p className="mt-1 text-xs text-slate-600">Sapa {selectedOther.nickname || "temanmu"} untuk memulai percakapan.</p></div></div> : <div className="space-y-3">{messages.map((message) => <div key={message.id} className={`flex ${message.is_own ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg sm:max-w-[70%] ${message.is_own ? "rounded-tr-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white" : "rounded-tl-md border border-white/10 bg-white/[.07] text-slate-100"}`}><p className="whitespace-pre-wrap break-words">{message.message}</p><p className={`mt-1 text-[9px] ${message.is_own ? "text-indigo-200/70" : "text-slate-600"}`}>{timeLabel(message.created_at)}</p></div></div>)}<div ref={endRef} /></div>}</div>

            <form onSubmit={send} className="border-t border-white/10 bg-slate-950/35 p-4 sm:p-5">{threadError && <p className="mb-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200">{threadError}</p>}<div className="flex items-end gap-3"><div className="min-w-0 flex-1"><textarea value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 1000))} rows={2} maxLength={1000} placeholder={`Pesan ke ${selectedOther.nickname || "teman"}…`} className="w-full resize-none rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400/50" /><div className="mt-1 text-right text-[9px] text-slate-700">{draft.length}/1000 · teks saja</div></div><button disabled={sending || !draft.trim()} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-[0_0_24px_rgba(34,211,238,.22)] disabled:opacity-40"><Send className="h-5 w-5" /></button></div></form>
          </>}
        </div>
      </div>
    </section>
  )
}
