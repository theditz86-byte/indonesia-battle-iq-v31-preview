import { FileText, Target } from "lucide-react"
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
    <section className="relative overflow-hidden rounded-3xl border border-violet-300/20 bg-white/5 backdrop-blur-lg">
      <img src="/images/trophy-banner.png?v=cf5" alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-indigo-950/55" />
      <div className="relative p-6">
        <FileText className="h-6 w-6 text-violet-300"/>
        <p className="mt-4 text-lg font-extrabold leading-tight text-white">Skor hanyalah awal.<br/>Kenali perkembanganmu.</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">Semua hasil tes, riwayat attempt, Personal Best, dan status Premium kini tersimpan di menu Akun.</p>
        <a href="/account/results#riwayat-hasil" className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-black text-white">Hasil & Attempt Saya</a>
      </div>
    </section>
  )
}
