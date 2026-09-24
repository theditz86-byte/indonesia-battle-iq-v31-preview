import { FileText, Share2, Target, Zap } from "lucide-react"
import { paths } from "@/lib/data"

export function PathToTop() {
  return (
    <section id="panduan" className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
      <div className="mb-5 flex items-center gap-3">
        <Target className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
        <div><h2 className="text-lg font-extrabold text-white">Dari lokal menuju Indonesia</h2><p className="mt-0.5 text-[11px] text-slate-500">Peringkat terdekat terasa lebih mungkin dikejar.</p></div>
      </div>
      <ul className="space-y-3">
        {paths.map((p, i) => (
          <li key={p.step} className="flex items-start gap-4 rounded-2xl border border-white/5 bg-slate-950/30 p-4 transition-colors hover:border-white/15 hover:bg-white/5">
            <span className={`text-2xl font-black leading-none ${i === paths.length - 1 ? "text-amber-300" : "text-slate-600"}`}>{p.step}</span>
            <div className="leading-tight"><p className="text-sm font-bold text-white">{p.title}</p><p className="mt-0.5 text-xs text-slate-400">{p.desc}</p></div>
          </li>
        ))}
      </ul>
      <a href="/quick-battle" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100"><Zap className="h-4 w-4"/>Pemanasan 5 Soal</a>
    </section>
  )
}

export function PromoBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-violet-300/20 bg-white/5 backdrop-blur-lg">
      <img src="/images/trophy-banner.png?v=cf5" alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/88 to-indigo-950/60" />
      <div className="relative p-6">
        <Share2 className="h-6 w-6 text-amber-300"/>
        <p className="mt-4 text-lg font-extrabold leading-tight text-white">Skormu bagus?<br/><span className="text-amber-300">Jangan disimpan sendiri.</span></p>
        <p className="mt-2 text-sm leading-6 text-slate-300">Selesaikan Ranked Battle lalu buat kartu 9:16 untuk Status WhatsApp atau Instagram Story. Teman yang melihatnya bisa langsung menerima tantanganmu.</p>
        <a href="/result" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-sm font-black text-slate-950"><Share2 className="h-4 w-4"/>Buka Kartu Hasil</a>
        <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4 text-[11px] text-slate-400"><FileText className="h-3.5 w-3.5"/>Riwayat hasil & Personal Best tetap tersimpan di akun.</div>
      </div>
    </section>
  )
}
