import { Target, Trophy } from "lucide-react"
import { paths } from "@/lib/data"

export function PathToTop() {
  return (
    <section id="panduan" className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
      <div className="mb-5 flex items-center gap-3"><Target className="h-6 w-6 text-cyan-400" /><h2 className="text-lg font-extrabold text-white">Empat jalur menuju puncak</h2></div>
      <ul className="space-y-3">
        {paths.map((p, i) => (
          <li key={p.step} className="flex items-start gap-4 rounded-2xl border border-white/5 bg-slate-950/30 p-4">
            <span className={`text-2xl font-black leading-none ${i === paths.length - 1 ? "text-rose-400" : "text-slate-600"}`}>{p.step}</span>
            <div className="leading-tight"><p className="text-sm font-bold text-white">{p.title}</p><p className="mt-.5 text-xs text-slate-400">{p.desc}</p></div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function PromoBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#09245f] via-[#091c46] to-[#030b20] p-6">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-400/15 blur-2xl" />
      <Trophy className="absolute bottom-4 right-5 h-24 w-24 text-amber-300/70 drop-shadow-[0_0_20px_rgba(250,204,21,.45)]" />
      <div className="relative">
        <p className="text-lg font-extrabold leading-tight text-white">Bukan sekadar tes,<br />tapi perjalanan menjadi<br />diri yang lebih hebat.</p>
        <p className="mt-8 text-sm font-medium text-cyan-300">Indonesia Battle IQ</p>
      </div>
    </section>
  )
}
