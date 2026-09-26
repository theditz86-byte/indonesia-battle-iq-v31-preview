"use client"

import { ChevronDown, History, LogOut, Mail, Menu, MessageCircle, Play, Settings, Share2, WalletCards, X } from "lucide-react"
import { useEffect, useState } from "react"
import { getParticipantToken, removeParticipantToken } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"

const SOCIAL_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-social"

const links = [
  { label: "Beranda", href: "/battle" },
  { label: "Ranking", href: "/battle#peringkat" },
  { label: "History Ranking", href: "/history-ranking" },
  { label: "Ranked Battle", href: "/battle-test" },
  { label: "Chat Global", href: "/global-chat" },
  { label: "Pesan", href: "/messages" },
  { label: "Bantuan", href: "/help" },
]

export function SiteNavbar({ participant }: { participant: BattleParticipant | null }) {
  const [active, setActive] = useState("Beranda")
  const [socialBadge, setSocialBadge] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const name = participant?.nickname || "Akun Peserta"

  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith("/global-chat")) setActive("Chat Global")
    else if (path.startsWith("/messages")) setActive("Pesan")
    else if (path.startsWith("/history-ranking")) setActive("History Ranking")
    else if (path.startsWith("/battle-test")) setActive("Ranked Battle")
    else if (path.startsWith("/help")) setActive("Bantuan")
    else if (window.location.hash === "#peringkat") setActive("Ranking")
    else setActive("Beranda")
  }, [])

  useEffect(() => {
    if (!participant?.public_id) { setSocialBadge(0); return }
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
        if (!cancelled && response.ok) setSocialBadge(Math.max(0, Number(data.unread_total || 0) + Number(data.incoming_count || 0)))
      } catch {
        if (!cancelled) setSocialBadge(0)
      }
    }
    void loadCounts()
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void loadCounts() }, 30000)
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [participant?.public_id])

  function logout() {
    removeParticipantToken()
    window.location.href = "/battle"
  }

  function selectLink(label: string) {
    setActive(label)
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <a href="/battle" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <img src="/brand/alvaza-logo-new.svg" alt="ALZAVA Battle Point" className="h-10 w-10 shrink-0 object-contain drop-shadow-[0_0_10px_rgba(212,175,55,.28)] sm:h-12 sm:w-12" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-extrabold tracking-[.01em] text-white sm:text-[15px]">ALZAVA <span className="text-[#D4AF37]">Battle Point</span></p>
            <p className="hidden text-[10px] font-medium uppercase tracking-[.13em] text-slate-400 sm:block">Raih Poin. Taklukkan Peringkat.</p>
          </div>
        </a>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-lg lg:flex">
          {links.map((link) => (
            <a key={link.label} href={link.href} onClick={() => selectLink(link.label)} className={`relative rounded-full px-3 py-2 text-sm font-medium transition-all ${active === link.label ? "bg-white text-slate-900 shadow-[0_0_16px_rgba(255,255,255,0.25)]" : "text-slate-300 hover:text-white"}`}>
              {link.label}
              {link.label === "Pesan" && socialBadge > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-slate-950">{socialBadge > 99 ? "99+" : socialBadge}</span>}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? "Tutup menu" : "Buka menu"} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 lg:hidden">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {participant ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-2 sm:pr-3 backdrop-blur-lg transition-colors hover:bg-white/10 [&::-webkit-details-marker]:hidden">
                {participant.avatar_url ? <img src={participant.avatar_url} alt={name} className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-400/60" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-[10px] font-black text-white ring-2 ring-cyan-400/50">BP</span>}
                <span className="hidden text-left leading-tight md:block"><span className="block max-w-28 truncate text-sm font-semibold text-white">{name}</span></span>
                <ChevronDown className="hidden h-4 w-4 text-slate-400 transition-transform group-open:rotate-180 sm:block" />
              </summary>

              <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#061329]/95 p-2 shadow-[0_24px_70px_rgba(0,0,0,.45)] backdrop-blur-xl">
                <div className="border-b border-white/10 px-3 py-3"><p className="truncate text-sm font-black text-white">{name}</p><p className="mt-0.5 text-[11px] text-slate-500">Profil, riwayat tes, pesan, dan pengaturan</p></div>
                <div className="grid gap-1 py-2">
                  <a href="/share-challenge" className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-cyan-400/10 to-indigo-500/10 px-3 py-2.5 text-sm font-black text-cyan-100 hover:from-cyan-400/15 hover:to-indigo-500/15"><Share2 className="h-4 w-4 text-cyan-300"/>Bagikan & Tantang</a>
                  <a href="/account/results#riwayat-hasil" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5"><History className="h-4 w-4 text-violet-300"/>Riwayat Tes</a>
                  <a href="/battle-test" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5"><Play className="h-4 w-4 text-emerald-300"/>Ranked Battle</a>
                  <a href="/global-chat" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5"><MessageCircle className="h-4 w-4 text-cyan-300"/>Chat Global</a>
                  <a href="/messages" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5"><Mail className="h-4 w-4 text-indigo-300"/><span className="flex-1">Pesan & Teman</span>{socialBadge > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">{socialBadge > 99 ? "99+" : socialBadge}</span>}</a>
                  <a href="/payment?product=attempt_credit" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5"><WalletCards className="h-4 w-4 text-amber-300"/>Kredit Rematch</a>
                  <a href="/account" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5"><Settings className="h-4 w-4 text-slate-400"/>Pengaturan Profil</a>
                  <div className="my-1 border-t border-white/10" />
                  <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rose-200 transition-colors hover:bg-rose-500/10"><LogOut className="h-4 w-4 text-rose-300"/>Keluar</button>
                </div>
              </div>
            </details>
          ) : (
            <a href="/account" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-2 sm:pr-3 backdrop-blur-lg transition-colors hover:bg-white/10">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-[10px] font-black text-white ring-2 ring-cyan-400/50">BP</span>
              <span className="hidden text-left leading-tight md:block"><span className="block text-sm font-semibold text-white">Akun Peserta</span><span className="block text-[11px] text-slate-400">Masuk / Daftar</span></span>
            </a>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#030a19]/95 px-4 py-3 shadow-2xl backdrop-blur-xl lg:hidden">
          <nav className="mx-auto grid max-w-7xl grid-cols-2 gap-2 sm:grid-cols-3">
            {participant && <a href="/share-challenge" onClick={() => setMobileOpen(false)} className="relative rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-3 text-center text-sm font-black text-cyan-100">Bagikan & Tantang</a>}
            {links.map((link) => (
              <a key={link.label} href={link.href} onClick={() => selectLink(link.label)} className={`relative rounded-xl border px-3 py-3 text-center text-sm font-bold ${active === link.label ? "border-white/30 bg-white text-slate-950" : "border-white/10 bg-white/[.04] text-slate-200 hover:bg-white/[.08]"}`}>
                {link.label}
                {link.label === "Pesan" && socialBadge > 0 && <span className="absolute right-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">{socialBadge > 99 ? "99+" : socialBadge}</span>}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
