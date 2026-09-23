import { History, LogIn, MapPin, Unlock } from "lucide-react"
import type { BattleEntry, BattleParticipant, Scope } from "@/lib/battle"
import { entryRank, formatScore } from "@/lib/battle"

function initials(name?: string) {
  return (name || "IQ").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "IQ"
}

export function UserProfileCard({ participant, ownEntry, scope }: { participant: BattleParticipant | null; ownEntry?: BattleEntry; scope: Scope }) {
  if (!participant) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Posisi Anda</p>
            <p className="mt-1 text-xl font-extrabold text-white">Belum masuk arena</p>
            <p className="mt-1 text-sm text-slate-300">Masuk atau daftar akun untuk mengikuti perebutan peringkat mingguan.</p>
          </div>
          <a href="/account" className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(99,102,241,0.5)]"><LogIn className="h-4 w-4" /> Masuk / Daftar</a>
        </div>
      </div>
    )
  }

  const used = Math.max(0, Number(participant.attempts_used) || 0)
  const freeRemaining = Math.max(0, Number(participant.free_attempts_remaining ?? 1 - used) || 0)
  const paidCredits = Math.max(0, Number(participant.paid_credits) || 0)
  const remaining = Math.max(0, Number(participant.attempts_remaining ?? freeRemaining + paidCredits) || 0)
  const hasActive = Boolean(participant.active_attempt_id)
  const actionHref = hasActive || remaining > 0 ? "/battle-test" : "/payment"
  const actionLabel = hasActive ? "Lanjutkan tes Battle" : freeRemaining > 0 ? `Mulai tes · sisa gratis ${freeRemaining}` : paidCredits > 0 ? `Mulai Ranked · kredit ${paidCredits}` : "Buka Ranked · Rp5.000"

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          {participant.avatar_url ? (
            <img src={participant.avatar_url} alt={participant.nickname || "Peserta"} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-700 text-lg font-black text-white ring-2 ring-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]">{initials(participant.nickname)}</div>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Posisi Anda</p>
            <p className="truncate text-xl font-extrabold text-white">{participant.nickname}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-300"><MapPin className="h-3.5 w-3.5 text-cyan-400" /><span className="truncate">{participant.district_name || ""}{participant.district_name ? " · " : ""}{participant.regency_name || ""}{participant.regency_name ? " · " : ""}{participant.province_name || ""}</span></p>
            <div className="mt-2 hidden flex-wrap gap-2 sm:flex">
              <a href="/account/results#riwayat-hasil" className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100 transition-colors hover:bg-cyan-300/15"><History className="h-3.5 w-3.5"/>Hasil & Attempt</a>
              <a href="/account" className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10">Edit Profil</a>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden border-l border-white/10 pl-8 sm:block">
            <p className="text-xs text-slate-400">Peringkat {scope === "country" ? "Nasional" : "Aktif"}</p>
            <p className="text-3xl font-black text-white">{ownEntry ? `#${entryRank(ownEntry, scope) || "—"}` : "—"}</p>
            <p className="text-xs text-slate-400">{ownEntry ? `IQ ${ownEntry.iq_estimate ?? "—"} · ${formatScore(ownEntry.battle_score)} poin` : "Skor resmi belum tercatat"}</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-xs text-slate-400">Kuota gratis <span className="font-bold text-white">1x/season</span> · {Math.min(1, used)}/1 digunakan</p>
            <p className="text-[11px] text-slate-500">{hasActive ? "Percobaan sedang berjalan" : paidCredits > 0 ? `${paidCredits} kredit Ranked tersedia` : "1 Ranked Attempt gratis tiap season"}</p>
            <a href={actionHref} className="mt-1 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(99,102,241,0.5)] transition-transform hover:scale-[1.02]"><Unlock className="h-4 w-4" />{actionLabel}</a>
          </div>
        </div>
      </div>
    </div>
  )
}
