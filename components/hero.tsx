import { ArrowRight, BarChart3, FileCheck2, ShieldCheck, TrendingUp } from "lucide-react"
import type { BattleEntry, BattleSeason } from "@/lib/battle"
import { CountdownCard } from "./countdown-card"
import { Podium } from "./podium"

const features = [
  { icon: FileCheck2, title: "Soal Berkualitas", sub: "dan Teruji" },
  { icon: TrendingUp, title: "Peringkat Real-time", sub: "Seluruh Indonesia" },
  { icon: ShieldCheck, title: "Aman & Fair", sub: "Anti Kecurangan" },
]

export function Hero({ season, entries }: { season: BattleSeason | null; entries: BattleEntry[] }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src="/images/hero-bg-cf.webp?v=cf4" alt="" className="h-full w-full object-cover" fetchPriority="high" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/45 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(250,204,21,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_25%,rgba(56,189,248,0.14),transparent_45%)]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 pb-36 pt-12 sm:px-6">
        <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,330px)_minmax(0,1fr)_minmax(0,300px)]">
          <div className="flex flex-col items-start text-left">
            <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-cyan-300">Kompetisi IQ Online Nasional</span>
            <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
              Uji Nalar.<br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">Taklukkan</span><br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">Peringkat.</span>
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-300">Tantang kemampuan berpikir logis, analitis, dan strategis. Buktikan diri kamu di antara ribuan peserta dari seluruh Indonesia.</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <a href="/battle-test" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_28px_rgba(99,102,241,0.55)] transition-transform hover:scale-[1.03]">Mulai Tes Sekarang <ArrowRight className="h-4 w-4" /></a>
              <a href="#peringkat" className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-lg shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-colors hover:bg-white/10"><BarChart3 className="h-4 w-4 text-cyan-400" /> Lihat Peringkat</a>
            </div>
            <div className="mt-10 flex flex-col gap-4">
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
            <p className="max-w-xs text-right text-sm italic leading-relaxed text-cyan-100/80">&ldquo;Kemampuan berpikir hari ini, membentuk masa depan yang lebih besar.&rdquo;</p>
            <CountdownCard season={season} />
          </div>
        </div>
      </div>
    </section>
  )
}
