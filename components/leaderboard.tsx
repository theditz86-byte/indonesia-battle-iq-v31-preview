"use client"

import { RefreshCw, Trophy } from "lucide-react"
import type { BattleEntry, BattleParticipant, Scope } from "@/lib/battle"
import { entryRank, formatDuration, formatScore, scopeLabel } from "@/lib/battle"

const tabs: Array<{ label: string; scope: Scope }> = [
  { label: "Kecamatan", scope: "district" },
  { label: "Kab/Kota", scope: "regency" },
  { label: "Provinsi", scope: "province" },
  { label: "Indonesia", scope: "country" },
]

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 text-sm font-black text-slate-900 shadow-[0_0_16px_rgba(250,204,21,0.5)]"><Trophy className="h-4 w-4" /></span>
  if (rank === 2) return <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-300 to-slate-500 text-sm font-black text-slate-900"><Trophy className="h-4 w-4" /></span>
  if (rank === 3) return <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-amber-700 text-sm font-black text-slate-900"><Trophy className="h-4 w-4" /></span>
  return <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-bold text-slate-400">{rank || "—"}</span>
}

function initials(name?: string) {
  return (name || "BP").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "BP"
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
        <div className="flex items-center gap-3"><Trophy className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" /><div><h2 className="text-xl font-extrabold text-white">Peringkat {scopeLabel(scope, participant)}</h2><p className="mt-0.5 text-[11px] text-slate-500">Mulai dari wilayah terdekat, lalu kejar posisi Indonesia.</p></div></div>
        <div className="flex items-center gap-2"><span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Live</span><button aria-label="Muat ulang" onClick={onRefresh} disabled={loading} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:text-white disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></div>
      </div>
      <div className="mb-4 flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-slate-950/40 p-1">
        {tabs.map((tab) => <button key={tab.scope} onClick={() => onScopeChange(tab.scope)} className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${scope === tab.scope ? "bg-gradient-to-r from-indigo-600/80 to-violet-600/80 text-white shadow-[0_0_16px_rgba(99,102,241,0.4)]" : "text-slate-400 hover:text-white"}`}>{tab.label}</button>)}
      </div>
      {!participant && scope === "country" && <div className="mb-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[.06] px-4 py-3 text-xs text-cyan-100">Masuk akun untuk membuka ranking Kecamatan, Kabupaten/Kota, dan Provinsi milikmu.</div>}
      {error ? <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-5 text-center text-sm text-rose-200">{error}</div> : loading && !entries.length ? <div className="flex min-h-56 items-center justify-center text-sm text-slate-400"><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Memuat peringkat…</div> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500"><th className="px-3 py-3 font-semibold">#</th><th className="px-3 py-3 font-semibold">Peserta</th><th className="px-3 py-3 font-semibold">Wilayah</th><th className="px-3 py-3 font-semibold">Battle Point</th><th className="px-3 py-3 font-semibold">Ketepatan</th><th className="px-3 py-3 font-semibold">Waktu</th></tr></thead>
            <tbody>
              {entries.map((p, index) => {
                const rank = entryRank(p, scope) || index + 1
                const isYou = Boolean(participant?.public_id && participant.public_id === p.participant_public_id)
                const profileHref = p.participant_public_id ? `/player/?id=${encodeURIComponent(p.participant_public_id)}` : ""
                const identity = <div className="flex items-center gap-3">{p.avatar_url ? <img src={p.avatar_url} alt={p.nickname || "Peserta"} className="h-9 w-9 rounded-full object-cover ring-1 ring-white/20 transition-transform group-hover:scale-105" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-white ring-1 ring-white/20">{initials(p.nickname)}</div>}<div className="leading-tight"><span className="flex items-center gap-2 text-sm font-semibold text-white group-hover:text-cyan-200">{p.nickname || "Peserta"}{isYou && <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">Anda</span>}</span><span className="mt-0.5 block text-[9px] text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">Lihat profil</span></div></div>
                return (
                  <tr key={`${p.participant_public_id || p.nickname}-${rank}`} className={`group border-t border-white/5 transition-colors hover:bg-white/5 ${isYou ? "bg-gradient-to-r from-cyan-500/10 to-transparent" : ""}`}>
                    <td className="px-3 py-4"><RankBadge rank={rank} /></td>
                    <td className="px-3 py-4">{profileHref ? <a href={profileHref} className="inline-flex rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300/60">{identity}</a> : identity}</td>
                    <td className="px-3 py-4 text-sm text-slate-300">{p.regency_name || "—"}{p.province_name && <><br /><span className="text-slate-400">{p.province_name}</span></>}</td>
                    <td className="px-3 py-4 text-sm font-black text-cyan-300">{formatScore(p.battle_score)} poin</td>
                    <td className="px-3 py-4 text-sm text-slate-300">{p.correct_count ?? 0}/{p.question_count ?? 0}</td>
                    <td className="px-3 py-4 text-sm text-slate-300 tabular-nums">{formatDuration(p.duration_ms)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-right text-[10px] text-slate-600">{updatedAt ? `Diperbarui ${new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta" }).format(updatedAt)} WIB` : ""}</p>
    </section>
  )
}
