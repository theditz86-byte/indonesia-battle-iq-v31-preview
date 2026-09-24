"use client"

import { ChevronDown, CircleUserRound, History, Play, Settings, WalletCards } from "lucide-react"
import { useState } from "react"
import type { BattleParticipant } from "@/lib/battle"

const links = [
  { label: "Beranda", href: "/battle" },
  { label: "Peringkat", href: "#peringkat" },
  { label: "Tes Kemampuan", href: "/battle-test" },
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
          <img src="/alzava-emblem-v3.svg" alt="ALZAVA Battle Point" className="h-12 w-12 object-contain drop-shadow-[0_0_10px_rgba(212,175,55,.28)]" />
          <div className="leading-tight">
            <p className="text-[15px] font-extrabold tracking-[.01em] text-white">ALZAVA <span className="text-[#D4AF37]">Battle Point</span></p>
            <p className="text-[10px] font-medium uppercase tracking-[.13em] text-slate-400">Raih Poin. Taklukkan Peringkat.</p>
          </div>
        </a>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-lg lg:flex">
          {links.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setActive(link.label)} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${active === link.label ? "bg-white text-slate-900 shadow-[0_0_16px_rgba(255,255,255,0.25)]" : "text-slate-300 hover:text-white"}`}>
              {link.label}
            </a>
          ))}
        </nav>

        {participant ? (
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 backdrop-blur-lg transition-colors hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              {participant.avatar_url ? (
                <img src={participant.avatar_url} alt={name} className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-400/60" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-[10px] font-black text-white ring-2 ring-cyan-400/50">BP</span>
              )}
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-28 truncate text-sm font-semibold text-white">{name}</span>
                <span className="block text-[11px] text-slate-400">Akun & hasil</span>
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>

            <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#061329]/95 p-2 shadow-[0_24px_70px_rgba(0,0,0,.45)] backdrop-blur-xl">
              <div className="border-b border-white/10 px-3 py-3">
                <p className="truncate text-sm font-black text-white">{name}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Semua akun, hasil, dan attempt di satu tempat</p>
              </div>
              <div className="grid gap-1 py-2">
                <a href="/account/results" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5"><CircleUserRound className="h-4 w-4 text-cyan-300"/>Akun & Hasil</a>
                <a href="/account/results#riwayat-hasil" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5"><History className="h-4 w-4 text-violet-300"/>Riwayat Attempt</a>
                <a href="/battle-test" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5"><Play className="h-4 w-4 text-emerald-300"/>Tes Kemampuan</a>
                <a href="/payment?product=attempt_credit" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5"><WalletCards className="h-4 w-4 text-amber-300"/>Kredit Ranked</a>
                <a href="/account" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5"><Settings className="h-4 w-4 text-slate-400"/>Pengaturan Profil</a>
              </div>
            </div>
          </details>
        ) : (
          <a href="/account" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 backdrop-blur-lg transition-colors hover:bg-white/10">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-[10px] font-black text-white ring-2 ring-cyan-400/50">BP</span>
            <span className="hidden text-left leading-tight sm:block"><span className="block text-sm font-semibold text-white">Akun Peserta</span><span className="block text-[11px] text-slate-400">Masuk / Daftar</span></span>
          </a>
        )}
      </div>
    </header>
  )
}
