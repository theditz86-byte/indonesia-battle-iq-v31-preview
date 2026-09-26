"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Copy, Link2, MessageCircle, Share2, Swords, X } from "lucide-react"
import { getParticipantToken } from "@/lib/battle"
import { trackGrowthEvent } from "@/components/growth-tracker"

const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"
const PROFILE_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-profile"
const PVP_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-pvp"

type Player = {
  public_id?: string
  nickname?: string
  avatar_url?: string | null
  province_name?: string
  regency_name?: string
  district_name?: string
}

function initials(name?: string) {
  return (name || "BP").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "BP"
}

async function loadMe(token: string): Promise<Player | null> {
  const response = await fetch(ACCOUNT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Battle-Token": token },
    body: JSON.stringify({ action: "me" }),
    cache: "no-store",
  })
  if (!response.ok) return null
  const data = await response.json().catch(() => ({}))
  return data?.participant || null
}

async function loadPlayer(publicId: string): Promise<Player | null> {
  const response = await fetch(`${PROFILE_API}?id=${encodeURIComponent(publicId)}`, { cache: "no-store" })
  if (!response.ok) return null
  const data = await response.json().catch(() => ({}))
  return data?.profile || null
}

async function challengePlayer(targetPublicId: string) {
  const token = getParticipantToken()
  if (!token) throw new Error("Silakan masuk terlebih dahulu.")
  const response = await fetch(PVP_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Battle-Token": token },
    body: JSON.stringify({ action: "challenge", target_public_id: targetPublicId }),
    cache: "no-store",
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || "Tantangan belum dapat dikirim.")
  return data
}

function avatar(player?: Player | null) {
  if (player?.avatar_url) return <img src={player.avatar_url} alt={player.nickname || "Pemain"} className="h-12 w-12 rounded-full object-cover ring-2 ring-cyan-300/45" />
  return <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-sm font-black text-white ring-2 ring-cyan-300/35">{initials(player?.nickname)}</div>
}

export function PvpInviteBridge() {
  const [me, setMe] = useState<Player | null>(null)
  const [inviter, setInviter] = useState<Player | null>(null)
  const [inviteId, setInviteId] = useState("")
  const [shareOpen, setShareOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get("invite") || ""
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      setInviteId(id)
      void loadPlayer(id).then((profile) => setInviter(profile))
      trackGrowthEvent("pvp_invite_open", { inviter_public_id: id })
    }

    const token = getParticipantToken()
    if (token) void loadMe(token).then((participant) => setMe(participant))
  }, [])

  useEffect(() => {
    if (!inviteId || !me?.public_id || inviteId !== me.public_id) return
    const url = new URL(window.location.href)
    url.searchParams.delete("invite")
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
    setInviteId("")
    setInviter(null)
  }, [inviteId, me?.public_id])

  const inviteUrl = useMemo(() => {
    if (!me?.public_id || typeof window === "undefined") return ""
    const url = new URL("/pvp/", window.location.origin)
    url.searchParams.set("invite", me.public_id)
    url.searchParams.set("src", "pvp_invite")
    return url.toString()
  }, [me?.public_id])

  const shareText = useMemo(() => {
    const name = me?.nickname || "Temanmu"
    return `⚔️ ${name} menantangmu Battle PVP ALZAVA! Masuk ke arena dan buktikan siapa yang lebih cepat mengumpulkan PVP Point.`
  }, [me?.nickname])

  async function copyInvite() {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${inviteUrl}`)
      setCopied(true)
      setMessage("Link tantangan sudah disalin.")
      trackGrowthEvent("pvp_invite_share", { channel: "copy" })
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setMessage("Link belum dapat disalin. Coba Bagikan via WhatsApp.")
    }
  }

  function whatsappInvite() {
    if (!inviteUrl) return
    trackGrowthEvent("pvp_invite_share", { channel: "whatsapp" })
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${inviteUrl}`)}`, "_blank", "noopener,noreferrer")
  }

  async function nativeShare() {
    if (!inviteUrl) return
    if (!navigator.share) { await copyInvite(); return }
    try {
      await navigator.share({ title: "Battle PVP ALZAVA", text: shareText, url: inviteUrl })
      trackGrowthEvent("pvp_invite_share", { channel: "native" })
    } catch {}
  }

  function dismissInvite() {
    const url = new URL(window.location.href)
    url.searchParams.delete("invite")
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
    setInviteId("")
    setInviter(null)
    setMessage("")
  }

  async function challengeInviter() {
    if (!inviteId || busy) return
    setBusy(true)
    setMessage("")
    try {
      await challengePlayer(inviteId)
      setMessage(`Tantangan dikirim${inviter?.nickname ? ` ke ${inviter.nickname}` : ""}. Menunggu diterima…`)
      trackGrowthEvent("pvp_invite_challenge", { inviter_public_id: inviteId })
      window.setTimeout(() => dismissInvite(), 900)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tantangan belum dapat dikirim.")
    } finally {
      setBusy(false)
    }
  }

  const token = typeof window !== "undefined" ? getParticipantToken() : ""
  const isSelfInvite = Boolean(inviteId && me?.public_id && inviteId === me.public_id)

  return <>
    {inviteId && !isSelfInvite && (
      <div className="fixed inset-x-3 top-20 z-[105] mx-auto max-w-2xl rounded-2xl border border-cyan-300/25 bg-[#06142d]/95 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,.52)] backdrop-blur-xl sm:top-24">
        <button onClick={dismissInvite} aria-label="Tutup undangan" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"><X className="h-4 w-4" /></button>
        <div className="flex items-center gap-3 pr-9">
          {avatar(inviter)}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[.18em] text-cyan-300">Undangan Battle PVP</p>
            <p className="mt-1 truncate text-lg font-black">{inviter?.nickname || "Seorang pemain"} menantangmu!</p>
            <p className="mt-1 text-xs text-slate-400">10 menit · soal tak terbatas · benar +50 · salah −25</p>
          </div>
        </div>
        {!token ? (
          <a href={`/account?next=${encodeURIComponent(`/pvp/?invite=${inviteId}&src=pvp_invite`)}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_26px_rgba(34,211,238,.20)]"><Swords className="h-4 w-4" /> Masuk / Daftar untuk Menerima</a>
        ) : (
          <button onClick={() => void challengeInviter()} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_26px_rgba(34,211,238,.20)] disabled:opacity-60"><Swords className="h-4 w-4" /> {busy ? "Mengirim tantangan…" : `Tantang ${inviter?.nickname || "Pemain"} Sekarang`}</button>
        )}
        {message && <p className="mt-2 text-center text-xs font-semibold text-cyan-100">{message}</p>}
      </div>
    )}

    {me?.public_id && !inviteId && (
      <button onClick={() => setShareOpen(true)} className="fixed bottom-5 right-5 z-[90] flex items-center gap-2 rounded-full border border-cyan-300/25 bg-gradient-to-r from-cyan-500/95 to-indigo-600/95 px-5 py-3 text-sm font-black text-white shadow-[0_18px_55px_rgba(34,211,238,.28)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_20px_65px_rgba(34,211,238,.40)]"><Share2 className="h-4 w-4" /> Undang Teman PVP</button>
    )}

    {shareOpen && (
      <div className="fixed inset-0 z-[140] grid place-items-center bg-black/75 p-4 backdrop-blur-md" onMouseDown={(event) => { if (event.currentTarget === event.target) setShareOpen(false) }}>
        <div className="w-full max-w-md rounded-3xl border border-cyan-300/20 bg-[#07152d] p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,.65)]">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Battle PVP 1v1</p><h2 className="mt-2 text-2xl font-black">Undang teman ke arena</h2><p className="mt-2 text-sm leading-6 text-slate-400">Teman membuka link, login/daftar bila perlu, lalu bisa langsung menantangmu saat kalian sama-sama online.</p></div>
            <button onClick={() => setShareOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-400"><X className="h-4 w-4" /></button>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <div className="flex items-center gap-3">{avatar(me)}<div className="min-w-0"><p className="font-black">{me.nickname || "Pemain"}</p><p className="truncate text-xs text-slate-500">{[me.regency_name, me.province_name].filter(Boolean).join(" · ") || "Indonesia"}</p></div></div>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5"><Link2 className="h-4 w-4 shrink-0 text-cyan-300" /><span className="min-w-0 flex-1 truncate text-xs text-slate-300">{inviteUrl}</span></div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button onClick={whatsappInvite} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950"><MessageCircle className="h-4 w-4" /> WhatsApp</button>
            <button onClick={() => void nativeShare()} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3 text-sm font-black text-white"><Share2 className="h-4 w-4" /> Bagikan</button>
            <button onClick={() => void copyInvite()} className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-sm font-black text-slate-200 hover:bg-white/[.08]">{copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />} {copied ? "Tersalin" : "Salin Link Tantangan"}</button>
          </div>
          {message && <p className="mt-3 text-center text-xs font-semibold text-cyan-100">{message}</p>}
        </div>
      </div>
    )}
  </>
}
