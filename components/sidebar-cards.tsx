import { Target } from "lucide-react"
import { paths } from "@/lib/data"

export function PathToTop() {
  return (
    <section id="panduan" className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
      <div className="mb-5 flex items-center gap-3">
        <Target className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
        <h2 className="text-lg font-extrabold text-white">Empat jalur menuju puncak</h2>
      </div>
      <ul className="space-y-3">
        {paths.map((p, i) => (
          <li key={p.step} className="flex items-start gap-4 rounded-2xl border border-white/5 bg-slate-950/30 p-4 transition-colors hover:border-white/15 hover:bg-white/5">
            <span className={`text-2xl font-black leading-none ${i === paths.length - 1 ? "text-rose-400" : "text-slate-600"}`}>{p.step}</span>
            <div className="leading-tight"><p className="text-sm font-bold text-white">{p.title}</p><p className="mt-0.5 text-xs text-slate-400">{p.desc}</p></div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function PromoBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg">
      <img src="/images/trophy-banner.webp" alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
      <div className="relative p-6">
        <p className="text-lg font-extrabold leading-tight text-white">Bukan sekadar tes,<br />tapi perjalanan menjadi<br />diri yang lebih hebat.</p>
        <p className="mt-8 text-sm font-medium text-cyan-300">Indonesia Battle IQ</p>
      </div>
    </section>
  )
}
