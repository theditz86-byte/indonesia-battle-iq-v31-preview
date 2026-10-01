"use client"

import { Gauge, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { PARTICIPANT_TOKEN_KEY } from "@/lib/battle"
import { PRETEST_API } from "@/components/pretest-experience"

type Baseline = { id?: string; battle_score?: number; best_count?: number; question_count?: number; breakdown?: Record<string, number>; completed_at?: string }

export function PretestHistoryCard() {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [baseline, setBaseline] = useState<Baseline | null>(null)

  useEffect(() => {
    if (!window.location.pathname.startsWith("/account/results")) return
    let stopped = false
    let tries = 0

    async function load() {
      if (stopped) return
      const token = localStorage.getItem(PARTICIPANT_TOKEN_KEY) || ""
      if (!token) return
      try {
        const response = await fetch(PRETEST_API, { method: "POST", headers: { "Content-Type": "application/json", "X-Battle-Token": token }, body: JSON.stringify({ action: "history" }), cache: "no-store" })
        const data = await response.json().catch(() => ({}))
        if (!stopped && response.ok) setBaseline(data?.baseline || null)
      } catch {}
    }

    function findTarget() {
      if (stopped) return
      const node = document.getElementById("riwayat-hasil")
      if (node) setTarget(node)
      else if (tries++ < 30) window.setTimeout(findTarget, 250)
    }

    findTarget(); void load()
    const claimed = () => void load()
    window.addEventListener("alzava-pretest-claimed", claimed)
    const timer = window.setTimeout(() => void load(), 2500)
    return () => { stopped = true; window.clearTimeout(timer); window.removeEventListener("alzava-pretest-claimed", claimed) }
  }, [])

  if (!target || !baseline) return null

  return createPortal(
    <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-300/[.07] via-indigo-400/[.05] to-violet-400/[.07] p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-300"><Sparkles className="h-4 w-4"/><span className="text-[10px] font-black uppercase tracking-[.16em]">Pre-Test Pertama</span></div>
          <div className="mt-2 flex items-end gap-3"><strong className="text-4xl font-black text-white">{Number(baseline.battle_score || 0)}</strong><span className="pb-1 text-sm font-black text-slate-500">/500 Battle Point awal</span></div>
          <p className="mt-2 text-sm text-slate-400">Baseline pertama tersimpan permanen di akun dan tidak memengaruhi leaderboard Ranked.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"><span className="block text-slate-500">TWK</span><strong className="mt-1 block text-lg">{Number(baseline.breakdown?.twk || 0)}/5</strong></div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"><span className="block text-slate-500">TIU</span><strong className="mt-1 block text-lg">{Number(baseline.breakdown?.tiu || 0)}/10</strong></div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"><span className="block text-slate-500">TKP</span><strong className="mt-1 block text-lg">{Number(baseline.breakdown?.tkp || 0)}/10</strong></div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500"><Gauge className="h-4 w-4 text-cyan-300"/><span>{Number(baseline.best_count || 0)}/5 pilihan terbaik</span>{baseline.completed_at && <><span>•</span><span>{new Date(baseline.completed_at).toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</span></>}</div>
    </div>,
    target,
  )
}
