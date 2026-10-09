"use client"

import { BrainCircuit, ChevronDown, History, LogOut, Mail, Menu, Settings, Share2, Trophy, Users, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { getParticipantToken, removeParticipantToken } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"
import { NotificationCenter } from "@/components/notification-center"

const SOCIAL_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-social"
const SESSION_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-participant-session"

const links = [
  { label: "Beranda", href: "/battle" },
  { label: "Ranking", href: "/battle#peringkat" },
  { label: "Latihan SKD", href: "/latihan-skd" },
  { label: "Tes IQ", href: "/visual-iq" },
  { label: "Battle PVP", href: "/pvp" },
  { label: "History Ranking", href: "/history-ranking" },
  { label: "Chat Global", href: "/global-chat" },
  { label: "Bantuan", href: "/help" },
]

const desktopLinks = links.filter((link) => !["Chat Global", "Bantuan"].includes(link.label))

export function SiteNavbar({ participant }: { participant: BattleParticipant | null }) {
  const [active, setActive] = useState("Beranda")
  const [socialBadge, setSocialBadge] = useState(0)
  const [friendBadge, setFriendBadge] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const name = participant?.nickname || "Akun Peserta"

  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith("/global-chat")) setActive("Chat Global")
    else if (path.startsWith("/messages") || path.startsWith("/friends")) setActive("")
    else if (path.startsWith("/player")) setActive("")
    else if (path.startsWith("/latihan-skd") || path.startsWith("/latihan-tiu") || path.startsWith("/simulasi-tiu") || path.startsWith("/daily-training")) setActive("Latihan SKD")
    else if (path.startsWith("/visual-iq")) setActive("Tes IQ")
    else if (path.startsWith("/history-ranking")) setActive("History Ranking")
    else if (path.startsWith("/battle-test")) setActive("")
    else if (path.startsWith("/pvp")) setActive("Battle PVP")
    else if (path.startsWith("/help")) setActive("Bantuan")
    else if (window.location.hash === "#peringkat") setActive("Ranking")
    else setActive("Beranda")
  }, [])

  useEffect(() => {
    if (!participant?.public_id) { setSocialBadge(0); setFriendBadge(0); return }
    let cancelled = false
    async function loadCounts() {
      const token = getParticipantToken()
      if (!token) return
      try {
        const response = await fetch(SOCIAL_API, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Battle-Token": token },
          body: JSON.stringify({ action: "counts" }),
          cache: "no-store",
        })
        const data = await response.json().catch(() => ({}))
        if (!cancelled && response.ok) {
          const incoming = Math.max(0, Number(data.incoming_count || 0))
          const unread = Math.max(0, Number(data.unread_total || 0))
          setFriendBadge(incoming)
          setSocialBadge(incoming + unread)
        }
      } catch {
        if (!cancelled) { setSocialBadge(0); setFriendBadge(0) }
      }
    }
    void loadCounts()
    const onRefresh = () => void loadCounts()
    window.addEventListener("alzava:social-refresh", onRefresh)
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void loadCounts() }, 60000)
    return () => { cancelled = true; window.removeEventListener("alzava:social-refresh", onRefresh); window.clearInterval(timer) }
  }, [participant?.public_id])

  useEffect(() => {
    if (!profileOpen) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null
      if (target && profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [profileOpen])

  async function logout() {
    const token=getParticipantToken()
    try { if(token) await fetch(SESSION_API,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:JSON.stringify({action:"logout"})}) } catch {}
    removeParticipantToken()
    window.location.href = "/battle"
  }

  function selectLink(label: string) {
    setActive(label)
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-[100] overflow-visible border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="relative mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
        <a href="/battle" className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <img src="/brand/alvaza-logo-new.svg" alt="ALZAVA Battle Point" className="h-10 w-10 shrink-0 object-contain drop-shadow-[0_0_10px_rgba(212,175,55,.28)] sm:h-12 sm:w-12" />
          <div className="hidden min-w-0 leading-tight min-[400px]:block">
            <p className="truncate text-[13px] font-extrabold tracking-[.01em] text-white sm:text-[15px]">ALZAVA <span className="text-[#D4AF37]">Battle Point</span></p>
            <p className="hidden text-[10px] font-medium uppercase tracking-[.13em] text-slate-400 sm:block">Raih Poin. Taklukkan Peringkat.</p>
          </div>
        </a>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-lg xl:flex">
          {desktopLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={() => selectLink(link.label)} className={`relative rounded-full px-2.5 py-1.5 text-[12px] font-medium transition-all ${active === link.label ? "bg-white text-slate-900 shadow-[0_0_16px_rgba(255,255,255,0.25)]" : "text-slate-300 hover:text-white"}`}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button type="button" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? "Tutup menu" : "Buka menu"} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 xl:hidden">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {participant ? (
            <>
              <NotificationCenter />
              <div ref={profileMenuRef} data-alzava-profile-menu="native" className="relative z-[120]">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  onClick={() => {
                    setProfileOpen((value) => !value)
                    setMobileOpen(false)
                  }}
                  className="relative flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-2 sm:pr-3 backdrop-blur-lg transition-colors hover:bg-white/10"
                >
                  {participant.avatar_url ? <img src={participant.avatar_url} alt={name} className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-400/60" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-[10px] font-black text-white ring-2 ring-cyan-400/50">BP</span>}
                  <span className="hidden text-left leading-tight md:block"><span className="block max-w-28 truncate text-sm font-semibold text-white">{name}</span></span>
                  <ChevronDown className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${profileOpen ? "rotate-180" : ""}`} />
                  {socialBadge > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-slate-950 shadow-[0_0_14px_rgba(244,63,94,.65)]">{socialBadge > 99 ? "99+" : socialBadge}</span>}
                </button>

                {profileOpen && (
                  <div role="menu" className="absolute right-0 top-full z-[140] mt-2 w-[220px] overflow-hidden rounded-xl border border-white/10 bg-[#061329]/[.985] p-1 shadow-[0_24px_70px_rgba(0,0,0,.58)] backdrop-blur-xl">
                    <div className="grid gap-0.5 py-1.5">
                      <a href="/share-challenge" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400/10 to-indigo-500/10 px-2.5 py-1.5 text-[12px] font-black text-cyan-100 hover:from-cyan-400/15 hover:to-indigo-500/15"><Share2 className="h-3.5 w-3.5 text-cyan-300"/>Bagikan & Tantang</a>
                      <a href="/daily-training" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><BrainCircuit className="h-3.5 w-3.5 text-orange-300"/>TIU Harian</a>
                      {participant.public_id && <a href={`/player?id=${encodeURIComponent(participant.public_id)}`} onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><Trophy className="h-3.5 w-3.5 text-amber-300"/>Profil Battle & Prestasi</a>}
                      <a href="/account/results#riwayat-hasil" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><History className="h-3.5 w-3.5 text-violet-300"/>Riwayat Tes</a>
                      <a href="/friends" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><Users className="h-3.5 w-3.5 text-cyan-300"/><span className="flex-1">Cari & Tambah Teman</span>{friendBadge > 0 && <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white">{friendBadge > 99 ? "99+" : friendBadge}</span>}</a>
                      <a href="/messages" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><Mail className="h-3.5 w-3.5 text-indigo-300"/><span className="flex-1">Pesan Pribadi</span>{socialBadge > friendBadge && <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[9px] font-black text-white">{socialBadge-friendBadge > 99 ? "99+" : socialBadge-friendBadge}</span>}</a>
                      <a href="/account" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><Settings className="h-3.5 w-3.5 text-slate-400"/>Pengaturan Profil</a>
                      <div className="my-0.5 border-t border-white/10" />
                      <button type="button" onClick={()=>void logout()} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-bold text-rose-200 transition-colors hover:bg-rose-500/10"><LogOut className="h-3.5 w-3.5 text-rose-300"/>Keluar</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <a href="/account" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-2 sm:pr-3 backdrop-blur-lg transition-colors hover:bg-white/10">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-[10px] font-black text-white ring-2 ring-cyan-400/50">BP</span>
              <span className="hidden text-left leading-tight md:block"><span className="block text-sm font-semibold text-white">Akun Peserta</span><span className="block text-[11px] text-slate-400">Masuk / Daftar</span></span>
            </a>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#030a19]/95 px-4 py-3 shadow-2xl backdrop-blur-xl xl:hidden">
          <nav className="mx-auto grid max-w-7xl grid-cols-2 gap-2 sm:grid-cols-3">
            {participant && <a href="/friends" onClick={() => setMobileOpen(false)} className="relative rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-3 text-center text-sm font-black text-cyan-100">Cari Teman{friendBadge>0&&<span className="ml-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] text-white">{friendBadge}</span>}</a>}
            {participant && <a href="/share-challenge" onClick={() => setMobileOpen(false)} className="relative rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-3 text-center text-sm font-black text-cyan-100">Bagikan & Tantang</a>}
            {participant?.public_id && <a href={`/player?id=${encodeURIComponent(participant.public_id)}`} onClick={() => setMobileOpen(false)} className="relative rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-3 text-center text-sm font-black text-amber-100">Profil Battle</a>}
            {links.map((link) => (
              <a key={link.label} href={link.href} onClick={() => selectLink(link.label)} className={`relative rounded-xl border px-3 py-3 text-center text-sm font-bold ${active === link.label ? "border-white/30 bg-white text-slate-950" : "border-white/10 bg-white/[.04] text-slate-200 hover:bg-white/[.08]"}`}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
