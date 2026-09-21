"use client"

import { RefreshCw, Trophy } from "lucide-react"
import type { BattleEntry, BattleParticipant, Scope } from "@/lib/battle"
import { entryRank, formatDuration, formatScore, scopeLabel } from "@/lib/battle"

const tabs: Array<{ label: string; scope: Scope }> = [
  { label: "Indonesia", scope: "country" },
  { label: "Provinsi", scope: "province" },
  { label: "Kab/Kota", scope: "regency" },
  { label: "Kecamatan", scope: "district" },
]

function RankBadge({ rank }: { rank: number }) {
  if (rank >= 1 && rank <= 3) {
    const style = rank === 1 ? "from-yellow-400 to-amber-600" : rank === 2 ? "from-slate-300 to-slate-500" : "from-orange-400 to-amber-700"
    return <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${style} text-sm font-black text-slate-900 ${rank === 1 ? "shadow-[0_0_16px_rgba(250,204,21,0.5)]" : ""}`}><Trophy className="h-4 w-4" /></span>
  }
  return <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-bold text-slate-400">{rank || "—"}</span>
}

function initials(name?: string) {
  return (name || "IQ").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "IQ"
}

export function Leaderboard({ entries, participant, scope, loading, error, updatedAt, onScopeChange, onRefresh }: {
  entries: BattleEntry[]
  participant: BattleParticipant | null
  scope: Scope
  loading: boolean
  error: string
  updatedAt: Date | null
  onScopeChange: (scope: Scope) => void
  onRefresh: () => void
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg shadow-[0_0_40px_rgba(0,50,150,0.1)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Live Board</p>
            <h2 className="text-xl font-extrabold text-white">Peringkat {scopeLabel(scope, participant)}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Live</span>
          <button onClick={onRefresh} aria-label="Muat ulang" disabled={loading} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:text-white disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-slate-950/40 p-1">
        {tabs.map((tab) => (
          <button key={tab.scope} onClick={() => onScopeChange(tab.scope)} className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${scope === tab.scope ? "bg-gradient-to-r from-indigo-600/80 to-violet-600/80 text-white shadow-[0_0_16px_rgba(99,102,241,0.4)]" : "text-slate-400 hover:text-white"}`}>{tab.label}</button>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-6 text-center">
          <p className="text-sm font-semibold text-rose-200">{error}</p>
          <button onClick={onRefresh} className="mt-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white">Coba lagi</button>
        </div>
      ) : loading && !entries.length ? (
        <div className="flex min-h-64 items-center justify-center text-sm text-slate-400"><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Mengambil skor terbaru…</div>
      ) : !entries.length ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-8 text-center">
          <p className="text-lg font-bold text-white">Posisi pertama masih terbuka.</p>
          <p className="mt-2 text-sm text-slate-400">Belum ada skor terverifikasi pada cakupan ini.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500"><th className="px-3 py-3 font-semibold">#</th><th className="px-3 py-3 font-semibold">Peserta</th><th className="px-3 py-3 font-semibold">Wilayah</th><th className="px-3 py-3 font-semibold">IQ Battle</th><th className="px-3 py-3 font-semibold">Poin</th><th className="px-3 py-3 font-semibold">Ketepatan</th><th className="px-3 py-3 font-semibold">Waktu</th></tr></thead>
            <tbody>
              {entries.map((entry, index) => {
                const rank = entryRank(entry, scope) || index + 1
                const isYou = Boolean(participant?.public_id && entry.participant_public_id === participant.public_id)
                return (
                  <tr key={`${entry.participant_public_id || entry.nickname}-${rank}`} className={`group border-t border-white/5 transition-colors hover:bg-white/5 ${isYou ? "bg-gradient-to-r from-cyan-500/10 to-transparent" : ""}`}>
                    <td className="px-3 py-4"><RankBadge rank={rank} /></td>
                    <td className="px-3 py-4"><div className="flex items-center gap-3">{entry.avatar_url ? <img src={entry.avatar_url} alt={entry.nickname || "Peserta"} className="h-9 w-9 rounded-full object-cover ring-1 ring-white/20" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-white ring-1 ring-white/20">{initials(entry.nickname)}</div>}<div className="leading-tight"><span className="flex items-center gap-2 text-sm font-semibold text-white">{entry.nickname || "Peserta"}{isYou && <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">Anda</span>}</span></div></div></td>
                    <td className="px-3 py-4 text-sm text-slate-300">{entry.regency_name || "—"}<br /><span className="text-slate-400">{entry.province_name || "Indonesia"}</span></td>
                    <td className="px-3 py-4"><span className="text-sm font-bold text-white"><span className="text-slate-500">IQ</span> {entry.iq_estimate ?? "—"}</span></td>
                    <td className="px-3 py-4 text-sm font-bold text-cyan-300">{formatScore(entry.battle_score)}</td>
                    <td className="px-3 py-4 text-sm text-slate-300">{entry.correct_count ?? 0}/{entry.question_count ?? 0}</td>
                    <td className="px-3 py-4 text-sm tabular-nums text-slate-300">{formatDuration(entry.duration_ms)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-right text-[11px] text-slate-500">{updatedAt ? `Diperbarui ${new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta" }).format(updatedAt)} WIB` : "Menunggu pembaruan data"}</p>
    </section>
  )
}
