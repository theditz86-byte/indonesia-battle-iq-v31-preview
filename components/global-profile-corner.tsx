"use client"

import { BrainCircuit, ChevronDown, History, LogOut, Mail, Settings, Share2, Trophy } from "lucide-react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { NotificationCenter } from "@/components/notification-center"
import { getParticipantToken, removeParticipantToken } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"

const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"
const SESSION_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-participant-session"

const excludedPrefixes = [
  "/admin",
  "/battle-test",
  "/pvp",
  "/latihan-tiu",
  "/simulasi-tiu",
  "/daily-training",
  "/quick-battle",
  "/visual-iq",
]

export function GlobalProfileCorner() {
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [hidden, setHidden] = useState(true)
  const [participant, setParticipant] = useState<BattleParticipant | null>(null)

  useEffect(() => {
    const path = pathname || window.location.pathname
    setReady(false)
    setHidden(true)
    setParticipant(null)

    if (excludedPrefixes.some((prefix) => path.startsWith(prefix))) {
      setReady(true)
      return
    }

    let cancelled = false
    let revealTimer = 0
    let fetchStarted = false

    const loadParticipant = () => {
      if (fetchStarted || cancelled) return
      fetchStarted = true
      const token = getParticipantToken()
      if (!token) {
        setParticipant(null)
        setHidden(true)
        setReady(true)
        return
      }

      void fetch(ACCOUNT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Battle-Token": token },
        body: JSON.stringify({ action: "me" }),
        cache: "no-store",
      })
        .then(async (response) => {
          const data = await response.json().catch(() => ({}))
          if (cancelled) return
          if (response.ok && data.participant) {
            setParticipant(data.participant)
          } else {
            setParticipant(null)
            setHidden(true)
            if (response.status === 401 || response.status === 403 || data?.error === "invalid_session") {
              removeParticipantToken()
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            setParticipant(null)
            setHidden(true)
          }
        })
        .finally(() => { if (!cancelled) setReady(true) })
    }

    const syncWithNativeMenu = () => {
      if (cancelled) return
      const nativeMenu = document.querySelector('[data-alzava-profile-menu="native"]')
      if (nativeMenu) {
        window.clearTimeout(revealTimer)
        setHidden(true)
        setReady(true)
        return
      }

      const token = getParticipantToken()
      if (!token) {
        window.clearTimeout(revealTimer)
        setParticipant(null)
        setHidden(true)
        setReady(true)
        return
      }

      window.clearTimeout(revealTimer)
      revealTimer = window.setTimeout(() => {
        if (cancelled) return
        const stillNoNative = !document.querySelector('[data-alzava-profile-menu="native"]')
        if (stillNoNative) {
          setHidden(false)
          loadParticipant()
        }
      }, 180)
    }

    const observer = new MutationObserver(syncWithNativeMenu)
    observer.observe(document.body, { childList: true, subtree: true })

    const onStorage = (event: StorageEvent) => {
      if (event.key && !event.key.toLowerCase().includes("battle")) return
      syncWithNativeMenu()
    }
    window.addEventListener("storage", onStorage)

    syncWithNativeMenu()

    return () => {
      cancelled = true
      window.clearTimeout(revealTimer)
      observer.disconnect()
      window.removeEventListener("storage", onStorage)
    }
  }, [pathname])

  async function logout() {
    const token = getParticipantToken()
    try {
      if (token) await fetch(SESSION_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Battle-Token": token },
        body: JSON.stringify({ action: "logout" }),
      })
    } catch {}
    removeParticipantToken()
    setParticipant(null)
    setHidden(true)
    window.location.href = "/battle"
  }

  if (!ready || hidden || !participant) return null

  const name = participant.nickname || "Akun Peserta"

  return (
    <div className="fixed right-6 top-3 z-[90] flex items-center gap-2 sm:right-8 lg:right-12">
      <NotificationCenter />
      <details data-alzava-profile-menu="global" className="group relative">
        <summary className="relative flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-white/10 bg-[#071329]/95 py-1 pl-1 pr-2.5 shadow-[0_12px_34px_rgba(0,0,0,.30)] backdrop-blur-xl transition-colors hover:bg-[#0b1a35] [&::-webkit-details-marker]:hidden">
          {participant.avatar_url ? (
            <img src={participant.avatar_url} alt={name} className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-400/60" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-[10px] font-black text-white ring-2 ring-cyan-400/50">BP</span>
          )}
          <span className="hidden max-w-24 truncate text-[13px] font-semibold text-white sm:block">{name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="absolute right-0 mt-2 w-[208px] overflow-hidden rounded-xl border border-white/10 bg-[#061329]/95 p-1 shadow-[0_20px_55px_rgba(0,0,0,.42)] backdrop-blur-xl">
          <div className="grid gap-0.5 py-1">
            <a href="/share-challenge" className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400/10 to-indigo-500/10 px-2.5 py-1.5 text-[12px] font-black text-cyan-100 hover:from-cyan-400/15 hover:to-indigo-500/15"><Share2 className="h-3.5 w-3.5 text-cyan-300"/>Bagikan & Tantang</a>
            <a href="/daily-training" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><BrainCircuit className="h-3.5 w-3.5 text-orange-300"/>TIU Harian</a>
            {participant.public_id && <a href={`/player?id=${encodeURIComponent(participant.public_id)}`} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><Trophy className="h-3.5 w-3.5 text-amber-300"/>Profil Battle & Prestasi</a>}
            <a href="/account/results#riwayat-hasil" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><History className="h-3.5 w-3.5 text-violet-300"/>Riwayat Tes</a>
            <a href="/messages" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><Mail className="h-3.5 w-3.5 text-indigo-300"/>Pesan & Teman</a>
            <a href="/account" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><Settings className="h-3.5 w-3.5 text-slate-400"/>Pengaturan Profil</a>
            <div className="my-0.5 border-t border-white/10" />
            <button type="button" onClick={()=>void logout()} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-bold text-rose-200 transition-colors hover:bg-rose-500/10"><LogOut className="h-3.5 w-3.5 text-rose-300"/>Keluar</button>
          </div>
        </div>
      </details>
    </div>
  )
}
