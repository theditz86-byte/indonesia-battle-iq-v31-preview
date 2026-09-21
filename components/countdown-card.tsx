"use client"

import { useEffect, useMemo, useState } from "react"
import type { BattleSeason } from "@/lib/battle"

function pad(value: number) {
  return String(Math.max(0, value)).padStart(2, "0")
}

function remainingParts(endsAt?: string) {
  const end = endsAt ? new Date(endsAt).getTime() : 0
  const remaining = Math.max(0, end - Date.now())
  const totalSeconds = Math.floor(remaining / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

export function CountdownCard({ season }: { season: BattleSeason | null }) {
  const [nowTick, setNowTick] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick((n) => n + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const parts = useMemo(() => remainingParts(season?.ends_at), [season?.ends_at, nowTick])
  const units = [
    { value: parts.days, label: "hari" },
    { value: parts.hours, label: "jam" },
    { value: parts.minutes, label: "menit" },
    { value: parts.seconds, label: "detik" },
  ]

  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-lg shadow-[0_0_40px_rgba(0,80,200,0.15)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-white">{season?.label || "Season —"}</p>
        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${season ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-slate-400/20 bg-slate-400/10 text-slate-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${season ? "animate-pulse bg-emerald-400" : "bg-slate-500"}`} />
          {season ? "Sedang Berlangsung" : "Menunggu Season"}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-400">Berakhir dalam</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {units.map((u) => (
          <div key={u.label} className="rounded-xl border border-white/10 bg-slate-950/40 py-2 text-center">
            <span className="block text-xl font-extrabold tabular-nums text-white">{season ? pad(u.value) : "—"}</span>
            <span className="block text-[10px] text-slate-400">{u.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-slate-500">Reset mingguan: Senin, 00.00 WIB</p>
      <p className="mt-4 border-t border-white/10 pt-3 text-center text-xs italic leading-relaxed text-slate-400">
        &ldquo;Setiap jawaban adalah langkah menuju versi terbaik dari dirimu.&rdquo;
      </p>
    </div>
  )
}
