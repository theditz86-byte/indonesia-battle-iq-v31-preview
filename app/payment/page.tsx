"use client"

import { ArrowLeft, BrainCircuit, ShieldCheck, Swords } from "lucide-react"

export default function PaymentPage() {
  return <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,.14),transparent_32rem),linear-gradient(180deg,#020817,#07142f)] px-4 py-10 text-white sm:px-6">
    <div className="mx-auto max-w-3xl">
      <a href="/battle" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4"/>Kembali</a>
      <section className="overflow-hidden rounded-[32px] border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(16,185,129,.12),rgba(7,20,47,.9)_50%,rgba(34,211,238,.09))] p-7 shadow-2xl sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.16em] text-emerald-200"><ShieldCheck className="h-4 w-4"/>Open Beta Gratis</div>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Pembayaran sementara dinonaktifkan.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-300">Selama Open Beta, Ranked Battle, latihan TIU, simulasi, dan laporan hasil yang tersedia dapat digunakan tanpa membeli kredit. Semua pemain mendapat aturan Ranked yang sama.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <a href="/battle-test" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 font-black"><Swords className="h-5 w-5"/>Masuk Ranked Battle</a>
          <a href="/latihan-skd" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3.5 font-black text-cyan-100"><BrainCircuit className="h-5 w-5"/>Latihan SKD & TIU</a>
        </div>
        <p className="mt-6 text-xs leading-5 text-slate-500">Fitur pembayaran disimpan untuk fase produk berikutnya, tetapi tidak menerima transaksi baru selama Open Beta.</p>
      </section>
    </div>
  </main>
}
