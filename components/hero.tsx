import { ArrowRight, BarChart3, FileCheck2, ShieldCheck, TrendingUp, Users } from "lucide-react"
import type { BattleEntry, BattleSeason } from "@/lib/battle"
import { CountdownCard } from "./countdown-card"
import { Podium } from "./podium"

const features=[
  {icon:FileCheck2,title:"Soal Berkualitas",sub:"dan Teruji"},
  {icon:TrendingUp,title:"Peringkat Real-time",sub:"Seluruh Indonesia"},
  {icon:ShieldCheck,title:"Aman & Fair",sub:"Anti Kecurangan"},
  {icon:Users,title:"Komunitas",sub:"Pembelajar"},
]

export function Hero({season,entries}:{season:BattleSeason|null;entries:BattleEntry[]}){
  return (
    <section className="relative isolate overflow-hidden bg-[#020a1e]">
      <img src="/images/hero-scene.svg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center opacity-95"/>
      <div className="absolute inset-0 bg-gradient-to-b from-[#020816]/10 via-transparent to-[#020817]/45"/>
      <div className="absolute left-[44%] top-[16%] h-[330px] w-[330px] rounded-full bg-amber-300/10 blur-[85px]"/>
      
      <div className="relative mx-auto max-w-[1500px] px-5 pb-[112px] pt-10 lg:px-8 xl:px-10">
        <div className="grid min-h-[590px] items-center gap-8 lg:grid-cols-[.92fr_1.25fr_.72fr] lg:gap-7">
          <div className="relative z-20 flex flex-col items-start">
            <span className="mb-6 inline-flex rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,.12)]">
              Kompetisi IQ Online Nasional
            </span>
            <h1 className="max-w-[470px] text-[46px] font-black leading-[.93] tracking-[-.035em] text-white sm:text-[58px] lg:text-[62px]">
              Uji Nalar.<br/>
              <span className="bg-gradient-to-r from-[#54c7ff] via-[#4ea7ff] to-[#a55cff] bg-clip-text text-transparent">Taklukkan<br/>Peringkat.</span>
            </h1>
            <p className="mt-6 max-w-[420px] text-[15px] leading-7 text-slate-200/90">
              Tantang kemampuan berpikir logis, analitis, dan strategis. Buktikan diri kamu di antara ribuan peserta dari seluruh Indonesia.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="https://indonesia-battle-iq.netlify.app/battle-test" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5753ff] to-[#7c36f5] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_0_30px_rgba(99,102,241,.5)] transition-transform hover:-translate-y-0.5">
                Mulai Tes Sekarang <ArrowRight className="h-4 w-4"/>
              </a>
              <a href="#peringkat" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-[#081936]/70 px-5 py-3.5 text-sm font-extrabold text-white backdrop-blur-md transition-colors hover:bg-[#0d2855]/80">
                <BarChart3 className="h-4 w-4 text-cyan-300"/> Lihat Peringkat
              </a>
            </div>
            <div className="mt-8 grid w-full max-w-[470px] grid-cols-2 gap-x-5 gap-y-4">
              {features.map(f=><div key={f.title} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-indigo-300/35 bg-[#0a1c41]/75 shadow-[0_0_18px_rgba(99,102,241,.16)]">
                  <f.icon className="h-[17px] w-[17px] text-indigo-200"/>
                </span>
                <div><p className="text-[11px] font-bold text-white">{f.title}</p><p className="text-[10px] text-slate-400">{f.sub}</p></div>
              </div>)}
            </div>
          </div>

          <div className="relative z-10 flex items-end justify-center self-end pb-1 lg:min-h-[520px]">
            <div className="absolute left-1/2 top-[38%] h-[270px] w-[520px] -translate-x-1/2 rounded-full bg-amber-300/10 blur-[70px]"/>
            <Podium entries={entries}/>
          </div>

          <div className="relative z-20 flex h-full flex-col justify-between gap-8 py-8 lg:py-[46px]">
            <blockquote className="ml-auto max-w-[300px] text-right text-[16px] italic leading-7 text-slate-100/95 drop-shadow">
              “Kemampuan berpikir hari ini,<br/>membentuk masa depan yang lebih besar.”
            </blockquote>
            <div className="mt-auto">
              <CountdownCard season={season}/>
            </div>
            <p className="ml-auto max-w-[260px] text-right text-[12px] italic leading-5 text-slate-300/80">
              “Setiap jawaban adalah langkah menuju versi terbaik dari dirimu.”
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
