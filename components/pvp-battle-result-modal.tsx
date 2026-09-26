"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  ClipboardList,
  Crown,
  FileText,
  RotateCcw,
  Sparkles,
  Swords,
  Timer,
  Trophy,
  X,
} from "lucide-react"

export type PvpPlayerResult = {
  nickname: string
  avatarUrl?: string | null
  score: number
  correct: number
  wrong: number
  totalQuestions: number
}

export type PvpBattleResultModalProps = {
  open: boolean
  onClose: () => void
  onViewDetails: () => void
  onRematch: () => void
  winner: PvpPlayerResult
  opponent: PvpPlayerResult
  durationSeconds?: number
}

const CSS = `
@keyframes pvpResultIn{from{opacity:0;transform:scale(.95) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes pvpResultFade{from{opacity:0}to{opacity:1}}
@keyframes pvpResultRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes pvpResultPulse{0%{opacity:.35;transform:scale(.78)}55%{opacity:1;transform:scale(1.14)}100%{opacity:.78;transform:scale(1)}}
@keyframes pvpResultSpark{0%,100%{opacity:.25;transform:scale(.7) rotate(0deg)}50%{opacity:1;transform:scale(1.2) rotate(18deg)}}
.pvp-result-backdrop{animation:pvpResultFade .28s ease-out both}
.pvp-result-modal{animation:pvpResultIn .36s cubic-bezier(.22,1,.36,1) both;scrollbar-width:thin;scrollbar-color:rgba(59,130,246,.45) transparent}
.pvp-result-rise{animation:pvpResultRise .42s cubic-bezier(.22,1,.36,1) both}
.pvp-result-trophy-glow{animation:pvpResultPulse 1.05s ease-out 1 both}
.pvp-result-spark{animation:pvpResultSpark 2.5s ease-in-out infinite}
.pvp-result-gold-text{background:linear-gradient(180deg,#fffbe0 0%,#ffe889 30%,#ffc53e 58%,#e89a0d 82%,#a95e00 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:1px rgba(255,243,176,.28);filter:drop-shadow(0 3px 0 rgba(82,45,0,.86)) drop-shadow(0 0 20px rgba(247,198,75,.42))}
.pvp-result-gold-number{background:linear-gradient(180deg,#fff7c2 0%,#ffe47b 38%,#f7b72c 72%,#bd7600 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 rgba(72,42,0,.9)) drop-shadow(0 0 14px rgba(247,198,75,.5))}
.pvp-result-silver-number{background:linear-gradient(180deg,#fff 0%,#e7eef8 50%,#9fb4d4 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 rgba(15,23,42,.9)) drop-shadow(0 0 12px rgba(96,165,250,.4))}
.pvp-result-violet-number{background:linear-gradient(180deg,#fff 0%,#e9ddff 48%,#9a8cff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 rgba(30,27,75,.9)) drop-shadow(0 0 12px rgba(139,92,246,.48))}
@media(prefers-reduced-motion:reduce){.pvp-result-backdrop,.pvp-result-modal,.pvp-result-rise,.pvp-result-trophy-glow,.pvp-result-spark{animation:none!important}}
`

function formatDuration(seconds = 1200) {
  const safe = Math.max(0, Math.round(seconds || 1200))
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "BP"
}

function TrophyHeader() {
  return (
    <div className="relative mx-auto flex h-[138px] w-[300px] items-end justify-center max-sm:h-[106px] max-sm:w-[240px]">
      <div className="pvp-result-trophy-glow absolute left-1/2 top-[56%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,217,104,.72),rgba(247,198,75,.22)_42%,transparent_69%)]" />
      <div className="absolute left-1/2 top-[58%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,.2),transparent_66%)]" />
      <Sparkles className="pvp-result-spark absolute left-[13%] top-[15%] h-5 w-5 text-[#FFE59A]" />
      <Sparkles className="pvp-result-spark absolute right-[11%] top-[7%] h-4 w-4 text-[#FFE59A] [animation-delay:.8s]" />
      <span className="pvp-result-spark absolute left-[27%] top-[5%] h-1.5 w-1.5 rounded-full bg-[#FFE59A] shadow-[0_0_10px_3px_rgba(255,217,104,.85)] [animation-delay:.35s]" />
      <span className="pvp-result-spark absolute right-[27%] top-[22%] h-1 w-1 rounded-full bg-[#FFE59A] shadow-[0_0_9px_3px_rgba(255,217,104,.75)] [animation-delay:1.1s]" />
      <div className="absolute bottom-2 left-[14%] h-[92px] w-[86px] rotate-[-18deg] rounded-[55%_15%_55%_15%] border-l-[6px] border-t-[2px] border-[#F7C64B]/80 opacity-90 shadow-[0_0_14px_rgba(247,198,75,.35)]" />
      <div className="absolute bottom-2 right-[14%] h-[92px] w-[86px] rotate-[18deg] scale-x-[-1] rounded-[55%_15%_55%_15%] border-l-[6px] border-t-[2px] border-[#F7C64B]/80 opacity-90 shadow-[0_0_14px_rgba(247,198,75,.35)]" />
      <div className="relative z-10 flex flex-col items-center">
        <Crown className="-mb-2 h-11 w-11 text-[#FFD968] drop-shadow-[0_0_11px_rgba(255,217,104,.85)] max-sm:h-9 max-sm:w-9" fill="currentColor" strokeWidth={1.2} />
        <Trophy className="h-24 w-24 text-[#FFE59A] drop-shadow-[0_0_18px_rgba(247,198,75,.75)] max-sm:h-[76px] max-sm:w-[76px]" fill="#DCA414" strokeWidth={1.2} />
      </div>
    </div>
  )
}

function RankCrest({ rank, draw, winner }: { rank: number; draw: boolean; winner: boolean }) {
  const gold = winner && !draw
  return (
    <div className={`relative grid h-[74px] w-[60px] shrink-0 place-items-center rounded-[18px] border ${gold ? "border-[#FFE59A]/80 bg-gradient-to-b from-[#FAD96D] via-[#D89A18] to-[#6D4300] shadow-[0_0_18px_rgba(247,198,75,.38)]" : draw ? "border-violet-300/60 bg-gradient-to-b from-violet-200 via-violet-500 to-indigo-950 shadow-[0_0_16px_rgba(139,92,246,.35)]" : "border-sky-200/70 bg-gradient-to-b from-slate-100 via-slate-400 to-slate-800 shadow-[0_0_16px_rgba(96,165,250,.32)]"}`}>
      <Crown className={`absolute -top-3 h-6 w-6 ${gold ? "text-[#FFD968]" : draw ? "text-violet-100" : "text-slate-100"}`} fill="currentColor" strokeWidth={1.4} />
      <span className={`mt-2 text-2xl font-black ${gold ? "text-[#3B2300]" : "text-slate-950"}`}>{rank}</span>
    </div>
  )
}

function Avatar({ player, winner, draw }: { player: PvpPlayerResult; winner: boolean; draw: boolean }) {
  const ring = winner && !draw ? "from-[#FFF3B0] via-[#F7C64B] to-[#9A6700]" : draw ? "from-violet-200 via-violet-500 to-blue-600" : "from-white via-sky-300 to-slate-500"
  return (
    <div className={`h-[106px] w-[106px] shrink-0 rounded-full bg-gradient-to-br p-[4px] ${ring} shadow-[0_0_24px_rgba(59,130,246,.32)] max-sm:h-[84px] max-sm:w-[84px]`}>
      <div className="grid h-full w-full place-items-center overflow-hidden rounded-full border-2 border-[#061126] bg-gradient-to-br from-[#103A6D] to-[#081326] text-2xl font-black text-white">
        {player.avatarUrl ? <img src={player.avatarUrl} alt={player.nickname} className="h-full w-full object-cover" /> : initials(player.nickname)}
      </div>
    </div>
  )
}

function Stat({ kind, label, value }: { kind: "correct" | "wrong" | "total"; label: string; value: number }) {
  const icon = kind === "correct" ? <Check className="h-5 w-5" strokeWidth={3} /> : kind === "wrong" ? <X className="h-5 w-5" strokeWidth={3} /> : <FileText className="h-5 w-5" />
  const box = kind === "correct" ? "bg-emerald-500 text-white" : kind === "wrong" ? "bg-rose-500 text-white" : "bg-blue-500/25 text-blue-100"
  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5 px-2 py-2">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${box}`}>{icon}</span>
      <div className="min-w-0 leading-tight"><p className="text-[11px] font-semibold text-slate-300 sm:text-xs">{label}</p><p className="text-xl font-black text-white sm:text-2xl">{value}</p></div>
    </div>
  )
}

function PlayerCard({ player, rank, winner, draw, delay }: { player: PvpPlayerResult; rank: number; winner: boolean; draw: boolean; delay: number }) {
  const gold = winner && !draw
  const cardStyle = gold
    ? "border-[#F7C64B] bg-[linear-gradient(115deg,rgba(104,66,8,.94),rgba(42,30,10,.95)_42%,rgba(28,22,12,.96)_60%,rgba(96,62,8,.88))] shadow-[inset_0_0_0_1px_rgba(255,229,154,.28),0_0_26px_rgba(247,198,75,.38),0_0_70px_rgba(247,198,75,.14)]"
    : draw
      ? "border-violet-400/80 bg-[linear-gradient(115deg,rgba(65,42,125,.88),rgba(15,24,64,.96)_50%,rgba(24,40,105,.88))] shadow-[inset_0_0_0_1px_rgba(196,181,253,.18),0_0_24px_rgba(139,92,246,.3)]"
      : "border-sky-400/80 bg-[linear-gradient(115deg,rgba(34,66,112,.88),rgba(9,27,59,.96)_50%,rgba(26,55,101,.86))] shadow-[inset_0_0_0_1px_rgba(147,197,253,.18),0_0_22px_rgba(59,130,246,.28)]"
  const scoreClass = gold ? "pvp-result-gold-number" : draw ? "pvp-result-violet-number" : "pvp-result-silver-number"

  return (
    <article className={`pvp-result-rise relative overflow-hidden rounded-[22px] border-[1.5px] ${cardStyle}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_28%,rgba(255,255,255,.08)_42%,rgba(255,255,255,.02)_50%,transparent_60%)]" />
      <div className="relative grid gap-4 p-4 sm:grid-cols-[auto_auto_1fr_auto] sm:items-center sm:px-5 sm:py-4">
        <RankCrest rank={rank} winner={winner} draw={draw} />
        <Avatar player={player} winner={winner} draw={draw} />
        <div className="min-w-0">
          <div className="flex items-center gap-2"><h3 className="truncate text-2xl font-black text-white sm:text-[28px]">{player.nickname}</h3><BadgeCheck className="h-5 w-5 shrink-0 text-blue-400" fill="#2563EB" /></div>
          <div className="mt-2">
            {draw ? <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/45 bg-violet-400/10 px-3 py-1 text-xs font-black text-violet-100"><Swords className="h-3.5 w-3.5" /> SERI</span> : winner ? <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F7C64B]/65 bg-[#F7C64B]/14 px-3 py-1 text-sm font-black text-[#FFE59A]"><Crown className="h-4 w-4" fill="currentColor" /> PEMENANG</span> : <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/40 bg-sky-400/10 px-3 py-1 text-xs font-black text-sky-100"><Swords className="h-3.5 w-3.5" /> LAWAN</span>}
          </div>
        </div>
        <div className="text-left sm:text-right"><p className={`text-5xl font-black leading-none sm:text-[58px] ${scoreClass}`}>{player.score}</p><p className={`mt-1 text-sm font-bold ${gold ? "text-[#FFD968]" : draw ? "text-violet-200" : "text-slate-200"}`}>PVP Point</p></div>
      </div>
      <div className="relative mx-4 mb-4 grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black/30 sm:ml-[196px] sm:mr-5 sm:mt-[-6px]">
        <Stat kind="correct" label="Benar" value={player.correct} />
        <Stat kind="wrong" label="Salah" value={player.wrong} />
        <Stat kind="total" label="Total Soal" value={player.totalQuestions} />
      </div>
    </article>
  )
}

function GoldTitle({ children }: { children: ReactNode }) {
  return <h2 className="pvp-result-gold-text text-[46px] font-black leading-none tracking-tight sm:text-[68px]">{children}</h2>
}

export function PvpBattleResultModal({ open, onClose, onViewDetails, onRematch, winner, opponent, durationSeconds = 1200 }: PvpBattleResultModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!open) { setMounted(false); return }
    const frame = requestAnimationFrame(() => setMounted(true))
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", onKey) }
  }, [open, onClose])

  if (!open) return null
  const isDraw = winner.score === opponent.score
  const diff = Math.abs(winner.score - opponent.score)

  return (
    <div className={`pvp-result-backdrop fixed inset-0 z-[170] flex items-center justify-center bg-[rgba(0,5,18,.86)] px-3 py-3 backdrop-blur-[10px] transition-opacity ${mounted ? "opacity-100" : "opacity-0"}`} role="dialog" aria-modal="true" aria-labelledby="pvp-result-title" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pvp-result-modal relative max-h-[94vh] w-[min(94vw,900px)] overflow-y-auto overflow-x-hidden rounded-[28px] border border-blue-500/80 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(30,64,175,.34),transparent_70%),linear-gradient(180deg,rgba(6,24,58,.99),rgba(3,12,32,.99)_45%,rgba(2,8,24,.99))] shadow-[0_0_0_1px_rgba(59,130,246,.18),0_0_42px_rgba(59,130,246,.32),0_0_90px_rgba(37,99,235,.18),0_40px_80px_-20px_rgba(0,0,0,.82)]">
        <button onClick={onClose} aria-label="Tutup" className="absolute right-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-xl border border-sky-400/35 bg-[#0A1730]/80 text-slate-200 backdrop-blur transition hover:border-sky-300 hover:bg-[#12264A] hover:text-white hover:shadow-[0_0_16px_rgba(56,189,248,.42)]"><X className="h-5 w-5" /></button>

        <header className="relative overflow-hidden px-4 pt-4 sm:px-8 sm:pt-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[260px] opacity-20 [background-image:radial-gradient(circle,rgba(125,190,255,.8)_1px,transparent_1.6px)] [background-size:7px_7px] [mask-image:radial-gradient(ellipse_55%_65%_at_50%_28%,black,transparent_72%)]" />
          <div className="pointer-events-none absolute left-1/2 top-[155px] h-[190px] w-[120%] -translate-x-1/2 rounded-[50%] border-t-2 border-blue-400/60 shadow-[0_-9px_28px_-5px_rgba(59,130,246,.52)]" />
          <div className="relative flex flex-col items-center text-center">
            <TrophyHeader />
            <GoldTitle>Waktu Habis!</GoldTitle>
            <p id="pvp-result-title" className="mt-2 text-lg font-extrabold text-white sm:text-[27px]">{isDraw ? "Hasil Battle PVP berakhir seri" : "Pemenang Battle PVP telah ditentukan"}</p>
            <div className="mt-4 flex w-full flex-col items-center gap-2 rounded-2xl border border-sky-400/20 bg-[#071833]/75 p-1.5 backdrop-blur sm:flex-row sm:gap-3">
              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-sky-400/30 bg-[#0B2248]/80 px-4 py-2"><Timer className="h-4 w-4"/><span className="text-sm text-slate-100">Durasi Battle: <strong className="text-cyan-300">{formatDuration(durationSeconds)}</strong></span></div>
              <span className="hidden h-px w-4 bg-slate-300/60 sm:block" />
              <p className="px-2 pb-1 text-center text-xs text-slate-300 sm:pb-0 sm:text-left sm:text-sm">Pertarungan telah berakhir sesuai waktu yang ditentukan.</p>
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-4 px-4 pt-4 sm:px-8">
          <PlayerCard player={winner} rank={1} winner={!isDraw} draw={isDraw} delay={120} />
          <PlayerCard player={opponent} rank={isDraw ? 1 : 2} winner={false} draw={isDraw} delay={200} />
        </section>

        <div className="pvp-result-rise mx-4 mt-[18px] flex items-center justify-center gap-3 rounded-2xl border border-sky-400/20 bg-[#071833]/75 px-4 py-3 text-center sm:mx-8" style={{ animationDelay: "240ms" }}>
          <BarChart3 className="h-5 w-5 shrink-0 text-[#FFD968]" strokeWidth={2.5} />
          <p className="text-sm text-slate-100 sm:text-lg">{isDraw ? <>Battle berakhir seri dengan skor <span className="font-black text-[#FFD968]">{winner.score} PVP Point</span>.</> : <>{winner.nickname} unggul <span className="font-black text-[#FFD968]">{diff} poin</span> dan memenangkan duel ini.</>}</p>
        </div>

        <div className="pvp-result-rise flex flex-col gap-3 px-4 pb-6 pt-5 sm:flex-row sm:gap-5 sm:px-8" style={{ animationDelay: "280ms" }}>
          <button onClick={onViewDetails} className="group flex h-14 flex-1 items-center justify-center gap-3 rounded-2xl border border-white/25 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 px-5 text-base font-black text-white shadow-[0_0_22px_rgba(124,58,237,.4),0_0_28px_rgba(6,182,212,.3)] transition hover:-translate-y-0.5 hover:brightness-110 sm:h-16 sm:text-xl"><ClipboardList className="h-6 w-6"/>Lihat Hasil Detail<ArrowRight className="h-5 w-5 transition group-hover:translate-x-1"/></button>
          <button onClick={onRematch} className="group flex h-14 flex-1 items-center justify-center gap-3 rounded-2xl border-[1.5px] border-blue-400 bg-[#071833]/75 px-5 text-base font-black text-white shadow-[0_0_16px_rgba(59,130,246,.25)] transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-[#0B2248]/85 hover:shadow-[0_0_26px_rgba(59,130,246,.46)] sm:h-16 sm:text-xl"><RotateCcw className="h-6 w-6 transition duration-500 group-hover:-rotate-180"/>Tantang Lagi</button>
        </div>
      </div>
    </div>
  )
}

export default PvpBattleResultModal
