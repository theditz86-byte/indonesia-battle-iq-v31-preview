"use client"

import { Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { getParticipantToken } from "@/lib/battle"

const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"
const REMOVE_AVATAR_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-avatar-remove"

export function AccountAvatarDelete() {
  const [mount, setMount] = useState<HTMLElement | null>(null)
  const [hasAvatar, setHasAvatar] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!(window.location.pathname === "/account" || window.location.pathname === "/account/")) return
    const token = getParticipantToken()
    if (!token) return

    void fetch(ACCOUNT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Battle-Token": token },
      body: JSON.stringify({ action: "me" }),
      cache: "no-store",
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}))
      if (response.ok) setHasAvatar(Boolean(data?.participant?.avatar_url))
    }).catch(() => {})

    const findMount = () => {
      const input = document.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement | null
      const form = input?.closest("form") as HTMLElement | null
      if (form) setMount(form)
    }
    findMount()
    const observer = new MutationObserver(findMount)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  async function removeAvatar() {
    if (busy || !hasAvatar) return
    if (!window.confirm("Hapus foto profil Anda? Setelah dihapus, profil akan kembali memakai inisial.")) return
    const token = getParticipantToken()
    if (!token) { setError("Sesi peserta tidak ditemukan. Silakan masuk lagi."); return }
    setBusy(true)
    setError("")
    try {
      const response = await fetch(REMOVE_AVATAR_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Battle-Token": token },
        body: JSON.stringify({ action: "remove" }),
        cache: "no-store",
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Foto profil belum dapat dihapus.")
      setHasAvatar(false)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Foto profil belum dapat dihapus.")
    } finally {
      setBusy(false)
    }
  }

  if (!mount || !hasAvatar) return null

  return createPortal(
    <div className="grid gap-2">
      <button type="button" disabled={busy} onClick={() => void removeAvatar()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-5 py-3 text-sm font-black text-rose-200 transition-colors hover:bg-rose-500/15 disabled:opacity-50">
        <Trash2 className="h-4 w-4" /> {busy ? "Menghapus foto…" : "Hapus Foto Profil"}
      </button>
      {error && <p className="text-xs font-semibold text-rose-300">{error}</p>}
    </div>,
    mount,
  )
}
