"use client"

import { Bell, Brain, ChevronDown, Search } from "lucide-react"
import { useState } from "react"
import type { BattleParticipant } from "@/lib/battle"

const links = [
  { label: "Beranda", href: "/battle" },
  { label: "Peringkat", href: "#peringkat" },
  { label: "Tes Nalar", href: "/battle-test" },
  { label: "Tentang", href: "#tentang" },
  { label: "Panduan", href: "#panduan" },
]

export function SiteNavbar({ participant }: { participant: BattleParticipant | null }) {
  const [active, setActive] = useState("Beranda")
  const name = participant?.nickname || "Akun Peserta"
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="/battle" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-[0_0_20px_rgba(0,150,255,0.5)]">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-extrabold tracking-tight text-white">Indonesia Battle IQ</p>
            <p className="text-[11px] text-slate-400">Uji Nalar. Taklukkan Peringkat.</p>
          </div>
        </a>
        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-lg lg:flex">
          {links.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setActive(link.label)} className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${active === link.label ? "bg-white text-slate-900 shadow-[0_0_16px_rgba(255,255,255,0.25)]" : "text-slate-300 hover:text-white"}`}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button aria-label="Cari" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 backdrop-blur-lg transition-colors hover:text-white">
            <Search className="h-[18px] w-[18px]" />
          </button>
          <button aria-label="Notifikasi" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 backdrop-blur-lg transition-colors hover:text-white">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.7)]">3</span>
          </button>
          <a href="/account" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 backdrop-blur-lg transition-colors hover:bg-white/10">
            {participant?.avatar_url ? (
              <img src={participant.avatar_url} alt={name} className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-400/60" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-[10px] font-black text-white ring-2 ring-cyan-400/50">IQ</span>
            )}
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-28 truncate text-sm font-semibold text-white">{name}</span>
              <span className="block text-[11px] text-slate-400">Peserta</span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </a>
        </div>
      </div>
    </header>
  )
}
