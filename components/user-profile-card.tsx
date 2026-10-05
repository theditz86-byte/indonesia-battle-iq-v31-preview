import { BrainCircuit, History, LogIn, MapPin, Pencil, ShieldCheck, Unlock } from "lucide-react"
import type { BattleEntry, BattleParticipant, Scope } from "@/lib/battle"
import { entryRank, formatScore } from "@/lib/battle"

function initials(name?: string) {
  return (name || "BP").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "BP"
}

export function UserProfileCard({ participant, ownEntry, scope }: { participant: BattleParticipant | null; ownEntry?: BattleEntry; scope: Scope }) {
  if (!participant) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-[#071126]/88 p-5 shadow-[0_18px_55px_rgba(0,0,0,.24)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Akun Peserta</p>
            <p className="mt-1 text-xl font-black text-white">Simpan progres dan masuk ranking resmi</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">Latihan tetap bisa dicoba tanpa akun. Masuk saat ingin menyimpan riwayat dan mengikuti season.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/latihan-skd" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[.07]"><BrainCircuit className="h-4 w-4 text-cyan-300"/>Latihan</a>
            <a href="/account" className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"><LogIn className="h-4 w-4" /> Masuk / Daftar</a>
          </div>
        </div>
      </div>
    )
  }

  const isQa = Boolean(participant.is_qa)
  const used = Math.max(0, Math.min(3, Number(participant.attempts_used) || 0))
  const remaining = Math.max(0, Number(participant.weekly_attempts_remaining ?? 3 - used) || 0)
  const hasActive = Boolean(participant.active_attempt_id)
  const actionHref = "/battle-test"
  const actionLabel = isQa
    ? hasActive ? "Lanjutkan QA Test" : "Mulai QA Test · bebas percobaan"
    : hasActive ? "Lanjutkan Ranked Battle"
      : remaining > 0 ? `Mulai Ranked · tersisa ${remaining}x`
        : "3 Ranked season ini selesai"

  return (
    <div className={`rounded-[24px] border p-5 shadow-[0_18px_55px_rgba(0,0,0,.24)] sm:p-6 ${isQa ? "border-amber-300/20 bg-amber-300/[.05]" : "border-white/10 bg-[#071126]/88"}`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {participant.avatar_url ? <img src={participant.avatar_url} alt={participant.nickname || "Peserta"} className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-cyan-300/35" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-700 text-lg font-black text-white ring-1 ring-cyan-300/35">{initials(participant.nickname)}</div>}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{isQa ? "Akun Pengujian" : "Profil Anda"}</p>
              {isQa && <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-200"><ShieldCheck className="h-3 w-3" /> QA / TEST</span>}
              {!isQa && participant.open_beta && <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[.06] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-200">Open Beta Gratis</span>}
            </div>
            <p className="mt-1 break-words text-xl font-black leading-tight text-white">{participant.nickname}</p>
            <p className="mt-1 flex items-start gap-1 text-xs leading-5 text-slate-400"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" /><span className="break-words">{participant.district_name || ""}{participant.district_name ? " · " : ""}{participant.regency_name || ""}{participant.regency_name ? " · " : ""}{participant.province_name || ""}</span></p>
            <div className="mt-4 hidden flex-wrap gap-2 sm:flex">
              <a href="/account/results#riwayat-hasil" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/[.07]"><History className="h-4 w-4 text-cyan-300" /> Hasil & Riwayat</a>
              <a href="/account" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/[.07]"><Pencil className="h-4 w-4" /> Edit Profil</a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:gap-7">
          <div className="rounded-2xl border border-white/10 bg-white/[.025] px-5 py-3 sm:min-w-40">
            <p className="text-[11px] text-slate-500">{isQa ? "Peringkat resmi tersimpan" : `Peringkat ${scope === "country" ? "Nasional" : "Aktif"}`}</p>
            <p className="mt-0.5 text-2xl font-black text-white">{ownEntry ? `#${entryRank(ownEntry, scope) || "—"}` : "—"}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-cyan-300/80">{ownEntry ? `${formatScore(ownEntry.battle_score)} BP terbaik` : "Belum ada skor resmi"}</p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-start gap-2 sm:items-end">
            {isQa ? (
              <>
                <p className="text-xs font-bold text-amber-200">QA Mode · percobaan berulang aktif</p>
                <p className="text-[11px] text-slate-500">Hasil QA tidak mengubah leaderboard resmi</p>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400">Ranked resmi <span className="font-black text-white">3x/season</span> · {used}/3 digunakan</p>
                <p className="max-w-sm text-[11px] leading-5 text-slate-500">{hasActive ? "Percobaan sedang berjalan dan bisa dilanjutkan." : remaining > 0 ? `${remaining} kesempatan tersisa. Gunakan ketika kondisi sudah fokus.` : "Skor terbaik dari attempt yang selesai menjadi skor ranking."}</p>
              </>
            )}
            <a href={actionHref} className={`mt-1 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 ${isQa ? "bg-amber-400 text-slate-950" : "bg-violet-600 text-white shadow-[0_10px_28px_rgba(124,58,237,.18)]"}`}><Unlock className="h-4 w-4" />{actionLabel}</a>
          </div>
        </div>
      </div>
    </div>
  )
}
