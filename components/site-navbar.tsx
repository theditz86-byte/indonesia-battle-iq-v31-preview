"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"
import type { BattleParticipant } from "@/lib/battle"

const links = [
  { label: "Beranda", href: "/battle" },
  { label: "Peringkat", href: "#peringkat" },
  { label: "Tes Nalar", href: "/battle-test" },
  { label: "Panduan", href: "#panduan" },
  { label: "Bantuan", href: "/help" },
]

export function SiteNavbar({ participant }: { participant: BattleParticipant | null }) {
  const [active, setActive] = useState("Beranda")
  const name = participant?.nickname || "Akun Peserta"
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="/battle" className="flex items-center gap-3">
          <img src="/alzava-icon.png" alt="ALZAVA Battle IQ" className="h-11 w-11 object-contain drop-shadow-[0_0_14px_rgba(212,175,55,.38)]" />
          <div className="leading-tight">
            <p className="text-[15px] font-extrabold tracking-[.01em] text-white">ALZAVA <span className="text-[#D4AF37]">Battle IQ</span></p>
            <p className="text-[10px] font-medium uppercase tracking-[.13em] text-slate-400">Higher Thinking Wins</p>
          </div>
        </a>
        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-lg lg:flex">
          {links.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setActive(link.label)} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${active === link.label ? "bg-white text-slate-900 shadow-[0_0_16px_rgba(255,255,255,0.25)]" : "text-slate-300 hover:text-white"}`}>
              {link.label}
            </a>
          ))}
        </nav>
        <a href="/account" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 backdrop-blur-lg transition-colors hover:bg-white/10">
          {participant?.avatar_url ? (
            <img src={participant.avatar_url} alt={name} className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-400/60" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-[10px] font-black text-white ring-2 ring-cyan-400/50">IQ</span>
          )}
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-28 truncate text-sm font-semibold text-white">{name}</span>
            <span className="block text-[11px] text-slate-400">{participant ? "Peserta aktif" : "Masuk / Daftar"}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </a>
      </div>
    </header>
  )
}
