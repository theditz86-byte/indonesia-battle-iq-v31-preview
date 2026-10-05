import { BrainCircuit, BookOpenCheck, Share2, Target } from "lucide-react"
import { paths } from "@/lib/data"

export function PathToTop() {
  return (
    <section id="panduan" className="rounded-3xl border border-white/10 bg-[#071126]/82 p-6 shadow-[0_18px_55px_rgba(0,0,0,.22)]">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/12 bg-cyan-300/[.05]"><Target className="h-5 w-5 text-cyan-300" /></span>
        <div><h2 className="text-lg font-black text-white">Naik sedikit demi sedikit</h2><p className="mt-0.5 text-[11px] leading-5 text-slate-500">Kejar posisi terdekat dulu, bukan hanya Rank #1.</p></div>
      </div>
      <ul className="space-y-2.5">
        {paths.map((p, i) => (
          <li key={p.step} className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3.5">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-black ${i === paths.length - 1 ? "bg-amber-300/[.08] text-amber-300" : "bg-white/[.04] text-slate-500"}`}>{p.step}</span>
            <div className="leading-tight"><p className="text-sm font-bold text-white">{p.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{p.desc}</p></div>
          </li>
        ))}
      </ul>
      <a href="/latihan-skd" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"><BrainCircuit className="h-4 w-4 text-cyan-600"/>Latihan Sebelum Ranked</a>
    </section>
  )
}

export function PromoBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#071126]/88 shadow-[0_18px_55px_rgba(0,0,0,.22)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(34,211,238,.08),transparent_42%)]" />
      <div className="relative p-6">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-300/12 bg-emerald-300/[.05]"><BookOpenCheck className="h-5 w-5 text-emerald-300"/></span>
        <p className="mt-4 text-lg font-black leading-tight text-white">Persiapan CASN & BUMN<br/><span className="text-emerald-300">jangan cuma mengejar skor.</span></p>
        <p className="mt-2 text-sm leading-6 text-slate-400">Gunakan menu Latihan untuk membangun kemampuan TIU, TWK, TKP, numerik, logika, dan penalaran. Ranked sebaiknya dipakai saat kondisi sudah fokus.</p>
        <a href="/latihan-skd" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"><BrainCircuit className="h-4 w-4"/>Buka Latihan</a>
        <a href="/share-challenge" className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4 text-[11px] font-semibold text-slate-500 transition hover:text-slate-300"><Share2 className="h-3.5 w-3.5"/>Sudah punya skor bagus? Bagikan & tantang teman.</a>
      </div>
    </section>
  )
}
