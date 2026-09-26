import { ArrowRight, BarChart3, Share2, Sparkles, Swords, Trophy } from "lucide-react"
import type { BattleEntry, BattleSeason } from "@/lib/battle"
import { CountdownCard } from "./countdown-card"
import { Podium } from "./podium"

export function Hero({ season, entries }: { season: BattleSeason | null; entries: BattleEntry[] }) {
  const leaderScore = Number(entries?.[0]?.battle_score || 0)
  const challengeText = leaderScore > 0
    ? `Bisa lewati ${new Intl.NumberFormat("id-ID").format(leaderScore)} Battle Point?`
    : "Seberapa tinggi posisi kemampuanmu di Indonesia?"

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src="/images/hero-bg.png?v=cf5" alt="" className="h-full w-full object-cover" fetchPriority="high" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/45 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(250,204,21,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_25%,rgba(56,189,248,0.14),transparent_45%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-5 pt-8 sm:px-6 lg:pb-6 lg:pt-10">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,335px)_minmax(0,1fr)_minmax(0,285px)]">
          <div className="flex flex-col items-start text-left">
            <span className="inline-flex items-center rounded-full border-2 border-cyan-300/65 bg-cyan-400/15 px-5 py-2.5 text-[13px] font-black uppercase tracking-[.11em] text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,.26)] backdrop-blur-sm">
              Competitive Brain Game Indonesia
            </span>

            <h1 className="mt-5 text-[2.7rem] font-black leading-[0.98] tracking-tight text-white sm:text-5xl">
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">Raih Poin.</span><br />
              <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400 bg-clip-text text-transparent">Naik Peringkat.</span>
            </h1>

            <p className="mt-4 max-w-[21rem] text-[15px] font-black leading-6 text-white">
              {challengeText}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-extrabold text-cyan-100/90">
              <span>20 soal</span><span className="text-slate-500">•</span>
              <span>20 menit</span><span className="text-slate-500">•</span>
              <span>Gratis 1x/minggu</span><span className="text-slate-500">•</span>
              <span>Ranking Nasional</span>
            </div>

            <p className="mt-4 max-w-[20.5rem] text-sm font-medium leading-6 text-slate-300">
              Coba battle singkat untuk melihat Preview Battle Point, lalu masuk Ranked Battle dan rebut posisi dari kecamatan hingga Indonesia.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a href="/quick-battle" className="flex min-h-14 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-3.5 text-base font-black text-white ring-1 ring-indigo-300/30 shadow-[0_0_38px_rgba(124,58,237,.58)] transition-all hover:-translate-y-0.5 hover:scale-[1.025] hover:shadow-[0_0_46px_rgba(124,58,237,.72)]">
                <Swords className="h-5 w-5" /> Mulai Battle Gratis <ArrowRight className="h-5 w-5" />
              </a>
              <a href="#peringkat" className="flex min-h-12 items-center gap-2 rounded-xl border border-cyan-400/45 bg-white/[.07] px-5 py-3 text-[15px] font-extrabold text-white backdrop-blur-lg shadow-[0_0_20px_rgba(34,211,238,0.20)] transition-colors hover:bg-white/10">
                <BarChart3 className="h-[18px] w-[18px] text-cyan-300" /> Lihat Peringkat
              </a>
            </div>

            <div className="mt-3 text-[11px] font-bold text-slate-300/80">
              Tanpa pembayaran untuk mulai · hasil preview langsung keluar
            </div>

            <div className="mt-4 grid w-full max-w-[21rem] grid-cols-2 gap-2 text-[11px] font-extrabold sm:grid-cols-4 lg:grid-cols-2">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-slate-200 backdrop-blur-sm"><Sparkles className="h-3.5 w-3.5 text-cyan-300"/>Battle Point</div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-slate-200 backdrop-blur-sm"><BarChart3 className="h-3.5 w-3.5 text-violet-300"/>Statistik</div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-slate-200 backdrop-blur-sm"><Trophy className="h-3.5 w-3.5 text-amber-300"/>Rank Nasional</div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-slate-200 backdrop-blur-sm"><Share2 className="h-3.5 w-3.5 text-emerald-300"/>Share Card</div>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-10 -z-0 mx-auto h-72 w-3/4 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.22),transparent_70%)] blur-2xl" />
            <div className="relative z-10"><Podium entries={entries} /></div>
            {leaderScore > 0 && (
              <div className="mx-auto mt-2 flex w-fit items-center gap-3 rounded-full border-2 border-amber-300/45 bg-slate-950/75 px-7 py-3.5 text-[15px] font-black text-amber-50 shadow-[0_0_34px_rgba(251,191,36,.30)] ring-1 ring-amber-200/15 backdrop-blur-lg sm:text-base">
                <Trophy className="h-5 w-5 shrink-0 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,.65)]" />
                <span>{new Intl.NumberFormat("id-ID").format(leaderScore)} BP sedang memimpin · bisa kamu lewati?</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-5">
            <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-black text-emerald-200 backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Leaderboard diperbarui live
            </div>
            <p className="max-w-xs text-right text-[13px] italic leading-relaxed text-cyan-100/80">&ldquo;Berapa Battle Point-mu—dan siapa yang bisa mengejarnya?&rdquo;</p>
            <CountdownCard season={season} />
          </div>
        </div>
      </div>
    </section>
  )
}
