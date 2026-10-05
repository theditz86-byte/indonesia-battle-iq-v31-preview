import { ArrowRight, BarChart3, BrainCircuit, Swords, Trophy, Zap } from "lucide-react"
import type { BattleEntry, BattleParticipant, BattleSeason } from "@/lib/battle"
import { CountdownCard } from "./countdown-card"
import { Podium } from "./podium"

export function Hero({ season, entries, participant }: { season: BattleSeason | null; entries: BattleEntry[]; participant?: BattleParticipant | null }) {
  const leaderScore = Number(entries?.[0]?.battle_score || 0)
  const guest = !participant
  const seasonLabel = String(season?.label || "Season aktif")

  return (
    <section className="relative overflow-hidden border-b border-white/[.04]">
      <div className="absolute inset-0">
        <img src="/images/hero-bg-opt.webp?v=stabilized" alt="" className="h-full w-full object-cover" fetchPriority="high" decoding="async" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,.92)_0%,rgba(2,6,23,.78)_38%,rgba(2,6,23,.64)_66%,rgba(2,6,23,.88)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/28 via-slate-950/34 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_34%,rgba(250,204,21,.10),transparent_32%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-9 sm:px-6 lg:pb-10 lg:pt-12">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,.88fr)_minmax(0,1.12fr)] lg:gap-10">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-amber-300/20 bg-amber-300/[.06] px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-amber-200">{seasonLabel}</span>
              <span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-slate-300">Persiapan CASN & BUMN</span>
            </div>

            <h1 className="mt-5 text-[2.8rem] font-black leading-[.98] tracking-[-.045em] text-white sm:text-6xl">
              Latihan serius.<br />
              <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">Kompetisi tetap seru.</span>
            </h1>

            <p className="mt-5 max-w-lg text-[15px] leading-7 text-slate-300">
              Latih kemampuan TIU, TWK, TKP, numerik, logika, dan penalaran. Saat sudah siap, masuk Ranked Battle untuk menguji skor dan mengejar peringkat dari daerahmu sampai nasional.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-bold text-slate-400">
              <span>30 soal Ranked</span><span className="text-slate-700">•</span>
              <span>20 menit</span><span className="text-slate-700">•</span>
              <span>3 attempt / season</span><span className="text-slate-700">•</span>
              <span>skor terbaik masuk ranking</span>
            </div>

            {guest ? (
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="/pretest" className="inline-flex min-h-13 items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-slate-950 shadow-[0_12px_30px_rgba(255,255,255,.08)] transition hover:-translate-y-0.5">
                  <Zap className="h-4 w-4 text-amber-500" /> Coba 5 Soal Gratis <ArrowRight className="h-4 w-4" />
                </a>
                <a href="/latihan-skd" className="inline-flex min-h-13 items-center gap-2 rounded-xl border border-white/12 bg-white/[.045] px-5 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[.07]">
                  <BrainCircuit className="h-4 w-4 text-cyan-300" /> Latihan SKD
                </a>
              </div>
            ) : (
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="/battle-test" className="inline-flex min-h-13 items-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-black text-white shadow-[0_12px_30px_rgba(124,58,237,.20)] transition hover:-translate-y-0.5 hover:bg-violet-500">
                  <Swords className="h-4 w-4" /> Mulai Ranked Battle <ArrowRight className="h-4 w-4" />
                </a>
                <a href="/latihan-skd" className="inline-flex min-h-13 items-center gap-2 rounded-xl border border-white/12 bg-white/[.045] px-5 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[.07]">
                  <BrainCircuit className="h-4 w-4 text-cyan-300" /> Latihan Dulu
                </a>
                <a href="#peringkat" className="inline-flex min-h-13 items-center gap-2 rounded-xl px-3 py-3.5 text-sm font-bold text-slate-300 transition hover:text-white">
                  <BarChart3 className="h-4 w-4 text-cyan-300" /> Lihat Ranking
                </a>
              </div>
            )}

            <p className="mt-4 text-[11px] leading-5 text-slate-500">
              ALZAVA adalah platform latihan independen. Ranked memakai soal terkurasi, jawaban tersimpan otomatis, dan skor sama diurutkan berdasarkan waktu penyelesaian tercepat.
            </p>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-x-10 top-16 h-60 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,.14),transparent_68%)] blur-2xl" />
            <div className="relative z-10"><Podium entries={entries} /></div>
            <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch">
              <CountdownCard season={season} />
              {leaderScore > 0 && (
                <div className="flex min-w-[190px] items-center gap-3 rounded-2xl border border-amber-300/18 bg-slate-950/58 px-4 py-3 backdrop-blur-md">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-300/[.08]"><Trophy className="h-4 w-4 text-amber-300" /></span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.13em] text-slate-500">Skor Pemimpin</p>
                    <p className="mt-0.5 text-lg font-black text-amber-100">{new Intl.NumberFormat("id-ID").format(leaderScore)} BP</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
