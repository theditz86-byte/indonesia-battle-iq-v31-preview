import { History, LogIn, MapPin, Pencil, Unlock } from "lucide-react"
import type { BattleEntry, BattleParticipant, Scope } from "@/lib/battle"
import { entryRank, formatScore } from "@/lib/battle"

function initials(name?: string) {
  return (name || "BP").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "BP"
}

export function UserProfileCard({ participant, ownEntry, scope }: { participant: BattleParticipant | null; ownEntry?: BattleEntry; scope: Scope }) {
  if (!participant) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Posisi Anda</p>
            <p className="mt-1 text-xl font-extrabold text-white">Belum masuk arena</p>
            <p className="mt-1 text-sm text-slate-300">Coba Quick Battle tanpa login atau masuk akun untuk merebut peringkat resmi.</p>
          </div>
          <div className="flex flex-wrap gap-2"><a href="/quick-battle" className="flex items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100">Quick Battle</a><a href="/account" className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(99,102,241,0.5)]"><LogIn className="h-4 w-4" /> Masuk / Daftar</a></div>
        </div>
      </div>
    )
  }

  const used = Math.max(0, Number(participant.attempts_used) || 0)
  const freeRemaining = Math.max(0, Number(participant.free_attempts_remaining ?? 1 - used) || 0)
  const paidCredits = Math.max(0, Number(participant.paid_credits) || 0)
  const remaining = Math.max(0, Number(participant.attempts_remaining ?? freeRemaining + paidCredits) || 0)
  const hasActive = Boolean(participant.active_attempt_id)
  const actionHref = hasActive || remaining > 0 ? "/battle-test" : "/payment?product=attempt_credit"
  const actionLabel = hasActive ? "Lanjutkan tes Battle" : freeRemaining > 0 ? `Mulai Ranked resmi · gratis ${freeRemaining}x` : paidCredits > 0 ? `Mulai Rematch · kredit ${paidCredits}` : "Buka Rematch · Rp5.000"

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          {participant.avatar_url ? <img src={participant.avatar_url} alt={participant.nickname || "Peserta"} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-700 text-lg font-black text-white ring-2 ring-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]">{initials(participant.nickname)}</div>}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Posisi Anda</p>
            <p className="truncate text-xl font-extrabold text-white">{participant.nickname}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-300"><MapPin className="h-3.5 w-3.5 text-cyan-400" /><span className="truncate">{participant.district_name || ""}{participant.district_name ? " · " : ""}{participant.regency_name || ""}{participant.regency_name ? " · " : ""}{participant.province_name || ""}</span></p>
            <div className="mt-4 hidden flex-wrap gap-3 sm:flex">
              <a href="/account/results#riwayat-hasil" className="inline-flex min-h-11 items-center gap-2.5 rounded-xl border border-cyan-300/40 bg-cyan-300/15 px-5 py-3 text-[15px] font-extrabold text-white shadow-[0_8px_24px_rgba(34,211,238,.14)] transition-all hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-cyan-300/20">
                <History className="h-[18px] w-[18px] text-cyan-300" /> Hasil & Riwayat
              </a>
              <a href="/account" className="inline-flex min-h-11 items-center gap-2.5 rounded-xl border border-white/25 bg-white/[.09] px-5 py-3 text-[15px] font-bold text-white shadow-[0_8px_22px_rgba(0,0,0,.16)] transition-all hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/[.13]">
                <Pencil className="h-[18px] w-[18px] text-slate-200" /> Edit Profil
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden border-l border-white/10 pl-8 sm:block"><p className="text-xs text-slate-400">Peringkat {scope === "country" ? "Nasional" : "Aktif"}</p><p className="text-3xl font-black text-white">{ownEntry ? `#${entryRank(ownEntry, scope) || "—"}` : "—"}</p><p className="text-xs font-bold text-cyan-300">{ownEntry ? `${formatScore(ownEntry.battle_score)} poin resmi` : "Skor resmi belum tercatat"}</p></div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-xs text-slate-400">Ranked resmi <span className="font-bold text-white">1x/season</span> · {Math.min(1, used)}/1 digunakan</p>
            <p className="text-[11px] text-slate-500">{hasActive ? "Percobaan sedang berjalan" : paidCredits > 0 ? `${paidCredits} kredit Rematch tersedia` : "Rematch tidak mengubah leaderboard resmi"}</p>
            <a href={actionHref} className="mt-1 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(99,102,241,0.5)] transition-transform hover:scale-[1.02]"><Unlock className="h-4 w-4" />{actionLabel}</a>
          </div>
        </div>
      </div>
    </div>
  )
}
