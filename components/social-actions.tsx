"use client"

import { Check, Clock3, MessageCircle, UserMinus, UserPlus, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import type { BattleParticipant } from "@/lib/battle"
import { socialCall, type FriendshipState } from "@/lib/social"

export function SocialActions({ viewer, targetPublicId, targetName }: {
  viewer: BattleParticipant | null
  targetPublicId?: string
  targetName?: string
}) {
  const [state, setState] = useState<FriendshipState>(viewer?.public_id === targetPublicId ? "self" : "none")
  const [loading, setLoading] = useState(Boolean(viewer && targetPublicId && viewer.public_id !== targetPublicId))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

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
    setBusy(true)
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

  if (!targetPublicId) return null
  if (!viewer) {
    return <a href="/account" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(99,102,241,.28)]"><UserPlus className="h-4 w-4" /> Masuk untuk Berteman</a>
  }
  if (loading) return <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-400"><Clock3 className="h-4 w-4 animate-pulse" /> Memuat status…</span>
  if (state === "self") return <a href="/account" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100">Profil Anda</a>

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {state === "none" && <button disabled={busy} onClick={() => void act("friend_request")} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(34,211,238,.22)] disabled:opacity-50"><UserPlus className="h-4 w-4" /> Tambah Teman</button>}
        {state === "outgoing" && <button disabled={busy} onClick={() => { if (window.confirm(`Batalkan permintaan pertemanan ke ${targetName || "pemain ini"}?`)) void act("friend_cancel") }} className="inline-flex items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-5 py-3 text-sm font-black text-amber-100 disabled:opacity-50"><Clock3 className="h-4 w-4" /> Permintaan Terkirim</button>}
        {state === "incoming" && <><button disabled={busy} onClick={() => void act("friend_accept")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50"><Check className="h-4 w-4" /> Terima Pertemanan</button><button disabled={busy} onClick={() => void act("friend_reject")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 disabled:opacity-50"><X className="h-4 w-4" /> Tolak</button></>}
        {state === "friends" && <><a href={`/messages/?with=${encodeURIComponent(targetPublicId)}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(99,102,241,.25)]"><MessageCircle className="h-4 w-4" /> Kirim Pesan</a><button disabled={busy} onClick={() => { if (window.confirm(`Hapus ${targetName || "pemain ini"} dari daftar teman?`)) void act("friend_remove") }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 disabled:opacity-50"><UserMinus className="h-4 w-4" /> Teman</button></>}
        {(state === "blocked" || state === "blocked_by_you") && <span className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-500">Interaksi tidak tersedia</span>}
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-rose-300">{error}</p>}
    </div>
  )
}
