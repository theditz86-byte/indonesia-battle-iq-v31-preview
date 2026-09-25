import { ArrowRight, BarChart3, Swords } from "lucide-react"
import type { BattleEntry, BattleSeason } from "@/lib/battle"
import { CountdownCard } from "./countdown-card"
import { Podium } from "./podium"

export function Hero({ season, entries }: { season: BattleSeason | null; entries: BattleEntry[] }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src="/images/hero-bg.png?v=cf5" alt="" className="h-full w-full object-cover" fetchPriority="high" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/45 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(250,204,21,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_25%,rgba(56,189,248,0.14),transparent_45%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-5 pt-8 sm:px-6 lg:pb-6 lg:pt-10">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,285px)]">
          <div className="flex flex-col items-start text-left">
            <span className="inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-400/12 px-4 py-2 text-xs font-extrabold uppercase tracking-[.13em] text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,.10)]">
              Competitive Brain Game Indonesia
            </span>

            <h1 className="mt-5 text-[2.7rem] font-black leading-[0.98] tracking-tight text-white sm:text-5xl">
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">Raih Poin.</span><br />
              <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400 bg-clip-text text-transparent">Naik Peringkat.</span>
            </h1>

            <p className="mt-5 max-w-[20.5rem] text-sm font-medium leading-6 text-slate-200/95">
              Mulai dari 5 soal singkat, lihat Preview Battle Point-mu, lalu masuk Ranked Battle untuk merebut posisi dari kecamatan hingga Indonesia.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/quick-battle" className="flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-[15px] font-black text-white shadow-[0_0_28px_rgba(99,102,241,0.55)] transition-transform hover:scale-[1.03]">
                <Swords className="h-[18px] w-[18px]" /> Quick Battle Gratis <ArrowRight className="h-[18px] w-[18px]" />
              </a>
              <a href="#peringkat" className="flex min-h-12 items-center gap-2 rounded-xl border border-cyan-400/45 bg-white/[.07] px-5 py-3 text-[15px] font-extrabold text-white backdrop-blur-lg shadow-[0_0_20px_rgba(34,211,238,0.20)] transition-colors hover:bg-white/10">
                <BarChart3 className="h-[18px] w-[18px] text-cyan-300" /> Lihat Peringkat
              </a>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-300/80">
              <span>5 soal · tanpa login</span>
              <span className="text-slate-500">•</span>
              <span>±1–2 menit</span>
              <span className="text-slate-500">•</span>
              <span>Preview Battle Point</span>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-10 -z-0 mx-auto h-72 w-3/4 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.22),transparent_70%)] blur-2xl" />
            <div className="relative z-10"><Podium entries={entries} /></div>
          </div>

          <div className="flex flex-col items-end gap-5">
            <p className="max-w-xs text-right text-[13px] italic leading-relaxed text-cyan-100/80">&ldquo;Berapa Battle Point-mu—dan siapa yang bisa mengejarnya?&rdquo;</p>
            <CountdownCard season={season} />
          </div>
        </div>
      </div>
    </section>
  )
}
