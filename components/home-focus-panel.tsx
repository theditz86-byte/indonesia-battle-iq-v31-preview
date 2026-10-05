"use client"

import { ArrowRight, BrainCircuit, CheckCircle2, Clock3, ShieldCheck, Swords, Target, Trophy } from "lucide-react"
import type { BattleEntry, BattleParticipant, BattleSeason } from "@/lib/battle"
import { formatScore } from "@/lib/battle"

function seasonLabel(season?: BattleSeason | null) {
  return String(season?.label || "Season aktif").trim() || "Season aktif"
}

export function HomeFocusPanel({
  season,
  participant,
  ownEntry,
}: {
  season: BattleSeason | null
  participant: BattleParticipant | null
  ownEntry?: BattleEntry
}) {
  const label = seasonLabel(season)
  const remaining = participant
    ? Math.max(0, Number(participant.weekly_attempts_remaining ?? Math.max(0, 3 - Number(participant.attempts_used || 0))) || 0)
    : 0
  const rank = Number(ownEntry?.national_rank) || 0
  const score = Number(ownEntry?.battle_score) || 0
  const hasActive = Boolean(participant?.active_attempt_id)

  return (
    <section className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(145deg,rgba(8,18,40,.94),rgba(9,24,51,.88)_48%,rgba(10,31,50,.90))] shadow-[0_22px_70px_rgba(0,0,0,.30)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(34,211,238,.10),transparent_32%),radial-gradient(circle_at_88%_0%,rgba(245,158,11,.08),transparent_28%)]" />
      <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.35fr_.85fr] lg:p-7">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[.07] px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-cyan-200">Fokus Hari Ini</span>
            <span className="rounded-full border border-amber-300/15 bg-amber-300/[.06] px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-amber-200">{label}</span>
          </div>

          <h2 className="mt-4 max-w-2xl text-2xl font-black leading-tight text-white sm:text-3xl">
            {participant ? `Halo, ${participant.nickname || "Pejuang"}. Mau latihan dulu atau langsung ke Ranked?` : "Mulai dari latihan singkat, lalu ukur kemampuanmu di arena Ranked."}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {participant
              ? "Saran terbaik: pemanasan singkat lebih dulu, lalu gunakan Ranked saat sudah fokus. Ranking mengambil skor terbaikmu pada season aktif."
              : "Coba kemampuan awal tanpa tekanan, pelajari pola soal, lalu daftar saat ingin menyimpan progres dan masuk leaderboard resmi."}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a href={participant ? "/daily-training" : "/pretest"} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-[0_10px_26px_rgba(255,255,255,.08)] transition hover:-translate-y-0.5">
              <BrainCircuit className="h-4 w-4 text-cyan-600" />
              {participant ? "Latihan TIU Hari Ini" : "Coba 5 Soal Gratis"}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href={participant ? "/battle-test" : "/latihan-skd"} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/[.08] px-5 py-3 text-sm font-black text-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-400/[.12]">
              <Swords className="h-4 w-4 text-violet-300" />
              {participant ? (hasActive ? "Lanjutkan Ranked" : "Mulai Ranked Battle") : "Lihat Latihan SKD"}
            </a>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-slate-500">Peringkat Nasional</span>
              <Trophy className="h-4 w-4 text-amber-300" />
            </div>
            <p className="mt-1 text-2xl font-black text-white">{rank ? `#${rank}` : "—"}</p>
            <p className="mt-1 text-[11px] text-slate-500">{score ? `${formatScore(score)} Battle Point` : "Belum ada skor season ini"}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-slate-500">Ranked Tersisa</span>
              <Target className="h-4 w-4 text-cyan-300" />
            </div>
            <p className="mt-1 text-2xl font-black text-white">{participant ? `${remaining}/3` : "3/3"}</p>
            <p className="mt-1 text-[11px] text-slate-500">{hasActive ? "Ada attempt yang sedang berjalan" : "Gunakan saat benar-benar siap"}</p>
          </div>

          <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[.035] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-slate-500">Fair Play Ranked</span>
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
            </div>
            <p className="mt-1 text-sm font-black text-emerald-100">Skor terbaik masuk ranking</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">Skor sama ditentukan waktu tercepat.</p>
          </div>
        </div>
      </div>

      <div className="relative grid border-t border-white/10 bg-slate-950/25 sm:grid-cols-4">
        {[
          [Clock3, "30 soal • 20 menit"],
          [CheckCircle2, "Jawaban tersimpan otomatis"],
          [ShieldCheck, "Soal Ranked disaring kualitasnya"],
          [Target, "3 attempt per season"],
        ].map(([Icon, text], index) => {
          const C = Icon as typeof Clock3
          return <div key={String(text)} className={`flex items-center gap-2.5 px-4 py-3 text-[11px] font-semibold text-slate-400 ${index ? "border-t border-white/10 sm:border-l sm:border-t-0" : ""}`}><C className="h-4 w-4 shrink-0 text-cyan-300/80" />{String(text)}</div>
        })}
      </div>
    </section>
  )
}
