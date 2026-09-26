"use client"

import { useState } from "react"
import { PvpBattleResultModal, type PvpPlayerResult } from "@/components/pvp-battle-result-modal"

const winner: PvpPlayerResult = {
  nickname: "AL - HADID",
  score: 1225,
  correct: 26,
  wrong: 3,
  totalQuestions: 29,
}

const opponent: PvpPlayerResult = {
  nickname: "hayabusa",
  score: 1050,
  correct: 24,
  wrong: 6,
  totalQuestions: 30,
}

export default function PvpResultPreviewPage() {
  const [open, setOpen] = useState(true)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] text-white">
      <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center opacity-45" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,23,.55),rgba(2,8,23,.92))]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="rounded-3xl border border-cyan-300/20 bg-slate-950/65 px-7 py-6 backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[.26em] text-cyan-300">Preview Mode</p>
          <h1 className="mt-2 text-3xl font-black">Hasil Battle PVP</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Halaman ini khusus untuk mengecek desain popup hasil tanpa harus memainkan Battle PVP selama 10 menit.</p>
          <button onClick={() => setOpen(true)} className="mt-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 px-6 py-3 font-black text-white shadow-[0_0_28px_rgba(34,211,238,.25)]">Buka Preview Hasil</button>
        </div>
      </div>

      <PvpBattleResultModal
        open={open}
        onClose={() => setOpen(false)}
        onViewDetails={() => {}}
        onRematch={() => {}}
        winner={winner}
        opponent={opponent}
        durationSeconds={600}
      />
    </main>
  )
}
