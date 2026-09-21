import { ArrowRight, BarChart3, FileCheck2, ShieldCheck, TrendingUp, Users } from "lucide-react"
import type { BattleEntry, BattleSeason } from "@/lib/battle"
import { CountdownCard } from "./countdown-card"
import { Podium } from "./podium"

const features = [
  { icon: FileCheck2, title: "Soal Berkualitas", sub: "dan Teruji" },
  { icon: TrendingUp, title: "Peringkat Real-time", sub: "Seluruh Indonesia" },
  { icon: ShieldCheck, title: "Aman & Fair", sub: "Anti Kecurangan" },
  { icon: Users, title: "Komunitas", sub: "Pembelajar" },
]

export function Hero({ season, entries }: { season: BattleSeason | null; entries: BattleEntry[] }) {
  return (
    <section className="relative overflow-hidden border-b border-white/5">
      <div className="absolute inset-0 bg-[#03112c]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(37,99,235,.35),transparent_40%),radial-gradient(circle_at_78%_25%,rgba(14,165,233,.18),transparent_30%),linear-gradient(120deg,#03112c_0%,#092454_52%,#04122c_100%)]" />
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle,rgba(255,255,255,.3)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="absolute right-[8%] top-28 h-64 w-96 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pb-32 pt-12 sm:px-6">
        <div className="mb-10 flex flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-300">Kompetisi IQ Online Nasional</span>
          <h1 className="text-4xl font-black leading-[.95] tracking-tight text-white sm:text-5xl">
            Uji Nalar. <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 bg-clip-text text-transparent">Taklukkan Peringkat.</span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-slate-300">Tantang kemampuan berpikir logis, analitis, dan strategis. Buktikan diri kamu di antara ribuan peserta dari seluruh Indonesia.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://indonesia-battle-iq.netlify.app/battle-test" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_28px_rgba(99,102,241,.55)] transition-transform hover:scale-[1.03]">Mulai Tes Sekarang <ArrowRight className="h-4 w-4" /></a>
            <a href="#peringkat" className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-lg"><BarChart3 className="h-4 w-4 text-cyan-400" /> Lihat Peringkat</a>
          </div>
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="pointer-events-none absolute inset-x-0 top-16 mx-auto h-72 w-3/4 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,.22),transparent_70%)] blur-2xl" />
          <div className="relative z-10"><Podium entries={entries} /></div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-8 lg:flex-row lg:items-end">
          <div className="grid grid-cols-2 gap-x-5 gap-y-5 sm:flex sm:flex-wrap sm:justify-center lg:justify-start">
            {features.map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-lg"><f.icon className="h-5 w-5 text-cyan-400" /></span>
                <div className="leading-tight"><p className="text-sm font-bold text-white">{f.title}</p><p className="text-xs text-slate-400">{f.sub}</p></div>
              </div>
            ))}
          </div>
          <CountdownCard season={season} />
        </div>
      </div>
    </section>
  )
}
