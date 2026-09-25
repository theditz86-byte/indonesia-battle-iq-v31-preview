import { ArrowRight, BarChart3, ShieldCheck, Sparkles, Swords, TrendingUp } from "lucide-react"
import type { BattleEntry, BattleSeason } from "@/lib/battle"
import { CountdownCard } from "./countdown-card"
import { Podium } from "./podium"

const features = [
  { icon: Sparkles, title: "Quick Battle", sub: "5 soal · tanpa login" },
  { icon: TrendingUp, title: "Peringkat Lokal", sub: "Kecamatan sampai Indonesia" },
  { icon: ShieldCheck, title: "Kompetisi Fair", sub: "Skor resmi tidak bisa dibeli" },
]

export function Hero({ season, entries }: { season: BattleSeason | null; entries: BattleEntry[] }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src="/images/hero-bg.png?v=cf5" alt="" className="h-full w-full object-cover" fetchPriority="high" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/45 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(250,204,21,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_25%,rgba(56,189,248,0.14),transparent_45%)]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 pb-36 pt-12 sm:px-6">
        <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)_minmax(0,300px)]">
          <div className="flex flex-col items-start text-left">
            <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-cyan-300">Battle Point Indonesia</span>
            <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
              Competitive<br />Brain Game.<br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">Raih Poin.</span><br />
              <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400 bg-clip-text text-transparent">Naik Peringkat.</span>
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-300">Mulai dari 5 soal singkat, lihat Preview Battle Point-mu, lalu masuk Ranked Battle untuk merebut posisi di kecamatan, kabupaten/kota, provinsi, dan Indonesia.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/quick-battle" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-black text-white shadow-[0_0_28px_rgba(99,102,241,0.55)] transition-transform hover:scale-[1.03]"><Swords className="h-4 w-4"/> Quick Battle Gratis <ArrowRight className="h-4 w-4" /></a>
              <a href="#peringkat" className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-lg shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-colors hover:bg-white/10"><BarChart3 className="h-4 w-4 text-cyan-400" /> Lihat Peringkat</a>
            </div>
            <p className="mt-3 text-[11px] font-semibold text-slate-500">Tanpa login · ±1–2 menit · Battle Point Preview</p>
            <div className="mt-8 flex flex-col gap-4">
              {features.map((f) => (
                <div key={f.title} className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-lg"><f.icon className="h-[18px] w-[18px] text-cyan-400" /></span>
                  <div className="leading-tight"><p className="text-[13px] font-bold text-white">{f.title}</p><p className="text-[11px] text-slate-400">{f.sub}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-10 -z-0 mx-auto h-72 w-3/4 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.22),transparent_70%)] blur-2xl" />
            <div className="relative z-10"><Podium entries={entries} /></div>
          </div>
          <div className="flex flex-col items-end gap-6">
            <p className="max-w-xs text-right text-sm italic leading-relaxed text-cyan-100/80">&ldquo;Berapa Battle Point-mu—dan siapa yang bisa mengejarnya?&rdquo;</p>
            <CountdownCard season={season} />
          </div>
        </div>
      </div>
    </section>
  )
}
