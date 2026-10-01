import Image from "next/image"
import { ArrowRight, Check, ClipboardList, Crown, ShieldCheck, Target, Trophy, X, Zap } from "lucide-react"
import type { ReactNode } from "react"

export const TITLE_ID = "quick-battle-title"
export const DESC_ID = "quick-battle-desc"

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/brand/alvaza-logo-new.svg"
        alt=""
        width={72}
        height={72}
        className={`object-contain ${compact ? "h-11 w-11" : "h-[88px] w-[88px]"}`}
        style={{ filter: "drop-shadow(0 0 10px rgba(255,190,40,.6))" }}
      />
      <div>
        <p className={`${compact ? "text-xl" : "text-[28px]"} font-black leading-none text-white`}>
          ALZAVA <span className="text-[#f7c531]">Battle Point</span>
        </p>
        <p className={`${compact ? "mt-1 text-[9px]" : "mt-2 text-[13px]"} uppercase tracking-[0.22em] text-slate-300`}>
          Raih poin. Taklukkan peringkat.
        </p>
      </div>
    </div>
  )
}

export function CloseButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Tutup Quick Battle"
      className={`flex items-center justify-center rounded-full border-2 border-[rgba(180,200,255,.75)] bg-[#0a1236]/80 text-white backdrop-blur-sm transition hover:border-cyan-300 hover:shadow-[0_0_22px_rgba(34,211,238,.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${className}`}
    >
      <X className="h-1/2 w-1/2" strokeWidth={2.5} aria-hidden="true" />
    </button>
  )
}

export function Badge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-3 rounded-full border-2 border-[#f7c531] bg-[#0a1030]/70 font-black uppercase text-[#f7c531] shadow-[0_0_22px_rgba(247,197,49,.45),inset_0_0_14px_rgba(247,197,49,.15)] ${className}`}
    >
      <Zap className="h-[1.25em] w-[1.25em] fill-[#f7c531]" aria-hidden="true" />
      <span className="tracking-[0.14em]">Untuk Pengunjung Baru</span>
    </div>
  )
}

export function Headline({ className = "" }: { className?: string }) {
  return (
    <h2 id={TITLE_ID} className={`font-black italic ${className}`}>
      <span className="block bg-gradient-to-b from-white to-[#cfe0ff] bg-clip-text text-transparent [text-shadow:none] [filter:drop-shadow(0_4px_10px_rgba(0,0,0,.5))]">
        Coba
      </span>
      <span className="block bg-gradient-to-r from-[#ffe21a] via-[#ffb02e] to-[#ff5fd2] bg-clip-text pr-4 text-transparent [filter:drop-shadow(0_4px_14px_rgba(255,120,60,.45))]">
        Quick Battle
      </span>
      <span className="flex items-center gap-3">
        <span className="bg-gradient-to-r from-[#25d9ff] via-[#6aa4ff] to-[#e24bff] bg-clip-text pr-3 text-transparent [filter:drop-shadow(0_4px_14px_rgba(80,140,255,.5))]">
          Gratis!
        </span>
        <span aria-hidden="true" className="not-italic text-[0.55em] [filter:drop-shadow(0_0_12px_rgba(120,160,255,.8))]">
          🚀
        </span>
      </span>
    </h2>
  )
}

const gold = "font-black text-[#ffc72e]"

export function Description({ className = "" }: { className?: string }) {
  return (
    <p id={DESC_ID} className={`text-white/95 ${className}`}>
      Uji kemampuan awalmu lewat <b className="text-white">TWK, TIU, TKP</b> dalam{" "}
      <span className={gold}>5 soal · ±3 menit.</span> Pemanasan untuk <span className={gold}>SKD, CASN</span> &amp;{" "}
      <span className={gold}>BUMN.</span>
    </p>
  )
}

const BENEFITS: { icon: ReactNode; lines: string[] }[] = [
  { icon: <ClipboardList />, lines: ["5 Soal", "Pilihan"] },
  { icon: <Target />, lines: ["TWK + TIU", "+ TKP"] },
  { icon: <Zap />, lines: ["Hasil", "Langsung"] },
  { icon: <Trophy />, lines: ["Tidak", "Memengaruhi", "Ranking"] },
]

export function Benefits({ className = "", cardClass = "", textClass = "" }: { className?: string; cardClass?: string; textClass?: string }) {
  return (
    <ul className={className}>
      {BENEFITS.map((b) => (
        <li
          key={b.lines.join(" ")}
          className={`flex flex-col items-center justify-center rounded-[18px] border border-[rgba(70,150,255,.45)] bg-[#0a1236]/75 text-center shadow-[0_0_18px_rgba(60,120,255,.22),inset_0_0_16px_rgba(60,120,255,.08)] ${cardClass}`}
        >
          <span className="text-[#c66bff] [&_svg]:h-full [&_svg]:w-full [&_svg]:stroke-[1.7] [&_svg]:drop-shadow-[0_0_8px_rgba(198,107,255,.7)]" style={{ width: 42, height: 42 }}>
            {b.icon}
          </span>
          <span className={`mt-2 font-bold leading-tight text-white ${textClass}`}>
            {b.lines.map((l) => (
              <span key={l} className="block">{l}</span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function ScoreCard({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`rounded-[22px] border-2 border-[#4aa3ff] bg-gradient-to-b from-[#12256e]/95 to-[#070f33]/95 p-5 shadow-[0_0_52px_rgba(60,170,255,.85),0_18px_40px_rgba(0,0,0,.5),inset_0_0_24px_rgba(60,140,255,.25)] ${className}`}
    >
      <div className="flex items-center gap-3">
        <Crown className="h-8 w-8 text-[#ffc72e] drop-shadow-[0_0_8px_rgba(255,190,40,.8)]" />
        <span className="text-[15px] font-bold text-white">Battle Point Awal</span>
      </div>
      <p className="mt-2 text-center text-[34px] font-black leading-none text-white">??? / 500</p>
      <div className="mt-3 h-[14px] rounded-full bg-[#1b3a8f]/70 p-[2px]">
        <div className="h-full w-[30%] rounded-full bg-gradient-to-r from-[#ffb02e] to-[#ffd23f] shadow-[0_0_10px_rgba(255,190,40,.8)]" />
      </div>
      <ul className="mt-4 space-y-2 rounded-xl border border-[#4aa3ff]/40 bg-[#0a1744]/80 p-3">
        {(["TWK", "TIU", "TKP"] as const).map((t) => (
          <li key={t} className="flex items-center gap-3 text-[15px] font-semibold text-white">
            <ClipboardList className="h-5 w-5 text-[#c66bff]" />
            <span className="flex-1">{t}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400 text-[#06122e]">
              <Check className="h-4 w-4" strokeWidth={3.5} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Tagline({ className = "" }: { className?: string }) {
  return (
    <p className={`relative isolate font-black italic leading-[1.1] ${className}`}>
      <span aria-hidden="true" className="absolute -inset-x-5 -inset-y-3 -z-10 rounded-[22px] bg-[#040a24]/60 blur-[2px]" />
      <span className="block whitespace-nowrap font-semibold text-white [font-size:0.72em] [text-shadow:0_2px_8px_rgba(0,0,0,.7)]">Seberapa siap kamu menghadapi</span>
      <span className="block whitespace-nowrap text-[#ffc72e] [text-shadow:0_0_16px_rgba(255,190,40,.55)]">SKD, CASN &amp; BUMN?</span>
      <span className="mt-1 block h-[4px] w-[92%] rounded-full bg-gradient-to-r from-transparent via-[#ffc72e] to-[#ffc72e]" />
    </p>
  )
}

export function PrimaryCta({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`qb-cta-pulse flex items-center justify-center gap-5 border border-white/50 bg-gradient-to-r from-[#ffd319] via-[#ffb83f] via-45% to-[#e32bf5] font-black text-[#0a0a1a] shadow-[0_0_30px_rgba(255,200,40,.5),0_0_44px_rgba(227,43,245,.4)] transition duration-200 hover:-translate-y-0.5 hover:scale-[1.015] hover:shadow-[0_0_44px_rgba(255,200,40,.75),0_0_64px_rgba(227,43,245,.6)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70 ${className}`}
    >
      <Zap className="h-[1.1em] w-[1.1em]" strokeWidth={2.2} aria-hidden="true" />
      <span>Mulai Quick Battle</span>
      <ArrowRight className="h-[1.1em] w-[1.1em]" strokeWidth={2.5} aria-hidden="true" />
    </button>
  )
}

export function SecondaryCta({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return <button type="button" onClick={onClick} className={`rounded-full border border-[#3b82f6] bg-[#0a1236]/80 font-bold text-white shadow-[0_0_14px_rgba(59,130,246,.35)] transition hover:bg-[#12206a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${className}`}>Nanti saja</button>
}

export function FooterNote({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-center justify-center gap-3 text-slate-200 ${className}`}>
      <ShieldCheck className="h-5 w-5 shrink-0 text-violet-300" aria-hidden="true" />
      <span>Tanpa login</span><span aria-hidden="true">•</span><span>Gratis</span><span aria-hidden="true">•</span><span>Tidak memengaruhi leaderboard</span>
    </p>
  )
}
