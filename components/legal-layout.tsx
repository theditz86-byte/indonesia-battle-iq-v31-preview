import type { ReactNode } from "react"

export function LegalLayout({title,eyebrow,children}:{title:string;eyebrow:string;children:ReactNode}){
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.12),transparent_32rem),linear-gradient(180deg,#020817,#07142f)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <a href="/battle" className="text-sm font-bold text-slate-400 hover:text-white">← Kembali ke Battle</a>
        <header className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-7 sm:p-9">
          <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
        </header>
        <article className="mt-5 space-y-7 rounded-3xl border border-white/10 bg-[#091a38]/90 p-6 leading-7 text-slate-300 shadow-2xl sm:p-9 prose-headings:text-white">
          {children}
        </article>
      </div>
    </main>
  )
}
