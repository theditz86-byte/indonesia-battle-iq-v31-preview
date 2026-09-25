"use client"

import { Ban, Check, Clock3, Flag, MessageCircle, RotateCcw, UserMinus, UserPlus, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import type { BattleParticipant } from "@/lib/battle"
import { moderationCall, socialCall, type FriendshipState } from "@/lib/social"

export function SocialActions({ viewer, targetPublicId, targetName }: {
  viewer: BattleParticipant | null
  targetPublicId?: string
  targetName?: string
}) {
  const [state, setState] = useState<FriendshipState>(viewer?.public_id === targetPublicId ? "self" : "none")
  const [loading, setLoading] = useState(Boolean(viewer && targetPublicId && viewer.public_id !== targetPublicId))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const refresh = useCallback(async () => {
    if (!viewer || !targetPublicId) { setLoading(false); return }
    if (viewer.public_id === targetPublicId) { setState("self"); setLoading(false); return }
    try {
      const data = await socialCall<{ state?: FriendshipState }>("profile_state", { target_public_id: targetPublicId })
      setState(data.state || "none")
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status pertemanan belum dapat dimuat.")
    } finally {
      setLoading(false)
    }
  }, [viewer, targetPublicId])

  useEffect(() => { void refresh() }, [refresh])

  async function act(action: string) {
    if (!targetPublicId || busy) return
    setBusy(true); setMessage("")
    try {
      const data = await socialCall<{ state?: FriendshipState }>(action, { target_public_id: targetPublicId })
      setState(data.state || "none")
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aksi belum dapat diproses.")
    } finally {
      setBusy(false)
    }
  }

  async function blockPlayer() {
    if (!targetPublicId || busy) return
    if (!window.confirm(`Blokir ${targetName || "pemain ini"}? Pertemanan dan pesan pribadi akan dinonaktifkan.`)) return
    setBusy(true); setMessage("")
    try {
      const data = await moderationCall<{ state?: FriendshipState }>("block", { target_public_id: targetPublicId })
      setState(data.state || "blocked_by_you")
      setError("")
      setMessage("Pemain telah diblokir.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pemain belum dapat diblokir.")
    } finally { setBusy(false) }
  }

  async function unblockPlayer() {
    if (!targetPublicId || busy) return
    if (!window.confirm(`Buka blokir ${targetName || "pemain ini"}?`)) return
    setBusy(true); setMessage("")
    try {
      const data = await moderationCall<{ state?: FriendshipState }>("unblock", { target_public_id: targetPublicId })
      setState(data.state || "none")
      setError("")
      setMessage("Blokir telah dibuka.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Blokir belum dapat dibuka.")
    } finally { setBusy(false) }
  }

  async function reportPlayer() {
    if (!targetPublicId || busy) return
    const reason = window.prompt("Alasan laporan: spam, pelecehan, penipuan, konten tidak pantas, atau lainnya.", "spam")?.trim()
    if (!reason) return
    const details = window.prompt("Keterangan tambahan (opsional, maksimal 500 karakter).", "")?.trim() || ""
    setBusy(true); setMessage("")
    try {
      await moderationCall("report", { target_public_id: targetPublicId, reason, details })
      setError("")
      setMessage("Laporan sudah dikirim untuk ditinjau pengelola.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Laporan belum dapat dikirim.")
    } finally { setBusy(false) }
  }

  if (!targetPublicId) return null
  if (!viewer) return <a href="/account" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(99,102,241,.28)]"><UserPlus className="h-4 w-4" /> Masuk untuk Berteman</a>
  if (loading) return <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-400"><Clock3 className="h-4 w-4 animate-pulse" /> Memuat status…</span>
  if (state === "self") return <a href="/account" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100">Profil Anda</a>

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {state === "none" && <button disabled={busy} onClick={() => void act("friend_request")} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(34,211,238,.22)] disabled:opacity-50"><UserPlus className="h-4 w-4" /> Tambah Teman</button>}
        {state === "outgoing" && <button disabled={busy} onClick={() => { if (window.confirm(`Batalkan permintaan pertemanan ke ${targetName || "pemain ini"}?`)) void act("friend_cancel") }} className="inline-flex items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-5 py-3 text-sm font-black text-amber-100 disabled:opacity-50"><Clock3 className="h-4 w-4" /> Permintaan Terkirim</button>}
        {state === "incoming" && <><button disabled={busy} onClick={() => void act("friend_accept")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50"><Check className="h-4 w-4" /> Terima Pertemanan</button><button disabled={busy} onClick={() => void act("friend_reject")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 disabled:opacity-50"><X className="h-4 w-4" /> Tolak</button></>}
        {state === "friends" && <><a href={`/messages/?with=${encodeURIComponent(targetPublicId)}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(99,102,241,.25)]"><MessageCircle className="h-4 w-4" /> Kirim Pesan</a><button disabled={busy} onClick={() => { if (window.confirm(`Hapus ${targetName || "pemain ini"} dari daftar teman?`)) void act("friend_remove") }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 disabled:opacity-50"><UserMinus className="h-4 w-4" /> Teman</button></>}
        {state === "blocked" && <span className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-500">Interaksi tidak tersedia</span>}
        {state === "blocked_by_you" && <button disabled={busy} onClick={() => void unblockPlayer()} className="inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100 disabled:opacity-50"><RotateCcw className="h-4 w-4" /> Buka Blokir</button>}

        {state !== "blocked" && state !== "blocked_by_you" && <button disabled={busy} onClick={() => void blockPlayer()} className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200 hover:bg-rose-500/15 disabled:opacity-50"><Ban className="h-4 w-4" /> Blokir</button>}
        <button disabled={busy} onClick={() => void reportPlayer()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/10 disabled:opacity-50"><Flag className="h-4 w-4" /> Laporkan</button>
      </div>
      {message && <p className="mt-2 text-xs font-semibold text-emerald-300">{message}</p>}
      {error && <p className="mt-2 text-xs font-semibold text-rose-300">{error}</p>}
    </div>
  )
}
