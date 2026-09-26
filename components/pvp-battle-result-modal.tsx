"use client"

import { useEffect, useState } from "react"
import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  Crown,
  Download,
  FileText,
  Link2,
  MessageCircle,
  RotateCcw,
  Share2,
  Sparkles,
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

function formatDuration(seconds = 600) {
  const safe = Math.max(0, Math.round(seconds || 600))
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "BP"
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "player"
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

async function loadImage(src: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function buildDownloadCard(winner: PvpPlayerResult, opponent: PvpPlayerResult, durationSeconds: number, isDraw: boolean) {
  const canvas = document.createElement("canvas")
  canvas.width = 1200
  canvas.height = 675
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas tidak tersedia")

  const bg = ctx.createLinearGradient(0, 0, 1200, 675)
  bg.addColorStop(0, "#020817")
  bg.addColorStop(0.5, "#071a35")
  bg.addColorStop(1, "#020817")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 1200, 675)

  try {
    const map = await loadImage("/images/hero-bg.png")
    const scale = Math.max(1200 / map.width, 675 / map.height)
    const w = map.width * scale
    const h = map.height * scale
    ctx.save()
    ctx.globalAlpha = 0.22
    ctx.drawImage(map, (1200 - w) / 2, (675 - h) / 2, w, h)
    ctx.restore()
  } catch {
    // Background image is decorative; fall back to the gradient when unavailable.
  }

  const overlay = ctx.createLinearGradient(0, 0, 0, 675)
  overlay.addColorStop(0, "rgba(0,6,22,.28)")
  overlay.addColorStop(0.52, "rgba(0,7,24,.46)")
  overlay.addColorStop(1, "rgba(0,5,18,.78)")
  ctx.fillStyle = overlay
  ctx.fillRect(0, 0, 1200, 675)

  ctx.textAlign = "center"
  ctx.fillStyle = "#F7C64B"
  ctx.font = "900 24px Arial, sans-serif"
  ctx.fillText("ALZAVA BATTLE POINT", 600, 54)
  ctx.fillStyle = "#D6E5FF"
  ctx.font = "700 14px Arial, sans-serif"
  ctx.fillText("BATTLE PVP • HASIL AKHIR", 600, 78)

  ctx.fillStyle = isDraw ? "#C4B5FD" : "#FFD968"
  ctx.font = "900 46px Arial, sans-serif"
  ctx.fillText(isDraw ? "HASIL SERI" : "BATTLE SELESAI!", 600, 135)
  ctx.fillStyle = "#CBD5E1"
  ctx.font = "700 16px Arial, sans-serif"
  ctx.fillText(`Durasi ${formatDuration(durationSeconds)} • Benar +50 • Salah −25`, 600, 164)

  const card = (player: PvpPlayerResult, x: number, y: number, w: number, h: number, gold: boolean, muted = false) => {
    ctx.save()
    if (muted) ctx.globalAlpha = 0.72
    const grad = ctx.createLinearGradient(x, y, x + w, y + h)
    if (gold) {
      grad.addColorStop(0, "rgba(104,66,8,.96)")
      grad.addColorStop(0.55, "rgba(31,26,18,.98)")
      grad.addColorStop(1, "rgba(84,52,5,.94)")
    } else {
      grad.addColorStop(0, "rgba(37,51,72,.92)")
      grad.addColorStop(1, "rgba(6,17,36,.98)")
    }
    roundedRect(ctx, x, y, w, h, 24)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.lineWidth = gold ? 3 : 1.5
    ctx.strokeStyle = gold ? "#F7C64B" : "rgba(148,163,184,.7)"
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(x + 72, y + 72, 42, 0, Math.PI * 2)
    ctx.fillStyle = gold ? "#153A77" : "#17243D"
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = gold ? "#F7C64B" : "#94A3B8"
    ctx.stroke()
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "900 22px Arial, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(initials(player.nickname), x + 72, y + 80)

    ctx.textAlign = "left"
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "900 26px Arial, sans-serif"
    ctx.fillText(player.nickname, x + 132, y + 58)
    ctx.fillStyle = gold ? "#FFD968" : "#CBD5E1"
    ctx.font = "800 12px Arial, sans-serif"
    ctx.fillText(isDraw ? "SERI" : gold ? "PEMENANG" : "KALAH", x + 132, y + 84)

    ctx.textAlign = "right"
    ctx.fillStyle = gold ? "#FFD968" : "#E2E8F0"
    ctx.font = "900 52px Arial, sans-serif"
    ctx.fillText(String(player.score), x + w - 28, y + 75)
    ctx.font = "800 11px Arial, sans-serif"
    ctx.fillText("PVP POINT", x + w - 28, y + 95)

    ctx.textAlign = "left"
    ctx.fillStyle = "#A7F3D0"
    ctx.font = "800 15px Arial, sans-serif"
    ctx.fillText(`Benar ${player.correct}`, x + 132, y + 132)
    ctx.fillStyle = "#FDA4AF"
    ctx.fillText(`Salah ${player.wrong}`, x + 235, y + 132)
    ctx.fillStyle = "#BAE6FD"
    ctx.fillText(`Total ${player.totalQuestions}`, x + 330, y + 132)
    ctx.restore()
  }

  card(winner, 105, 205, 990, 165, !isDraw)
  card(opponent, 165, 395, 870, 145, false, !isDraw)

  ctx.textAlign = "center"
  ctx.fillStyle = "#F8FAFC"
  ctx.font = "800 18px Arial, sans-serif"
  if (isDraw) ctx.fillText(`Battle berakhir seri di ${winner.score} PVP Point`, 600, 585)
  else ctx.fillText(`${winner.nickname} unggul ${Math.abs(winner.score - opponent.score)} poin dan memenangkan duel`, 600, 585)

  const cta = ctx.createLinearGradient(385, 612, 815, 648)
  cta.addColorStop(0, "#7C3AED")
  cta.addColorStop(0.55, "#2563EB")
  cta.addColorStop(1, "#06B6D4")
  roundedRect(ctx, 385, 610, 430, 42, 21)
  ctx.fillStyle = cta
  ctx.fill()
  ctx.fillStyle = "#FFFFFF"
  ctx.font = "900 15px Arial, sans-serif"
  ctx.fillText("TANTANG TEMANMU DI ALZAVA BATTLE POINT", 600, 637)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG gagal dibuat")), "image/png", 0.96)
  })
}

function Avatar({ player, gold = false }: { player: PvpPlayerResult; gold?: boolean }) {
  return (
    <div className={`grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full p-[3px] sm:h-24 sm:w-24 ${gold ? "bg-gradient-to-br from-[#fff5b8] via-[#f7c64b] to-[#8b5b00] shadow-[0_0_28px_rgba(247,198,75,.5)]" : "bg-gradient-to-br from-slate-100 via-sky-300 to-slate-600 shadow-[0_0_18px_rgba(96,165,250,.3)]"}`}>
      <div className="grid h-full w-full place-items-center overflow-hidden rounded-full border-2 border-[#071329] bg-gradient-to-br from-[#174b92] to-[#0a1730] text-xl font-black text-white sm:text-2xl">
        {player.avatarUrl ? <img src={player.avatarUrl} alt={player.nickname} className="h-full w-full object-cover" /> : initials(player.nickname)}
      </div>
    </div>
  )
}

function Stat({ kind, label, value }: { kind: "correct" | "wrong" | "total"; label: string; value: number }) {
  const icon = kind === "correct" ? <Check className="h-4 w-4" strokeWidth={3} /> : kind === "wrong" ? <X className="h-4 w-4" strokeWidth={3} /> : <FileText className="h-4 w-4" />
  const tone = kind === "correct" ? "bg-emerald-500/15 text-emerald-300" : kind === "wrong" ? "bg-rose-500/15 text-rose-300" : "bg-sky-500/15 text-sky-300"
  return <div className="flex min-w-0 items-center justify-center gap-2 px-2 py-2.5"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${tone}`}>{icon}</span><div className="leading-tight"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="text-lg font-black text-white sm:text-xl">{value}</p></div></div>
}

function WinnerCard({ player, draw }: { player: PvpPlayerResult; draw: boolean }) {
  return <article className={`relative overflow-hidden rounded-[24px] border-2 p-4 sm:p-5 ${draw ? "border-violet-400/70 bg-gradient-to-br from-violet-900/55 via-[#08162e] to-indigo-950/80 shadow-[0_0_34px_rgba(139,92,246,.22)]" : "border-[#f7c64b] bg-[linear-gradient(115deg,rgba(101,65,8,.94),rgba(38,29,13,.96)_45%,rgba(18,18,20,.97)_65%,rgba(92,58,6,.9))] shadow-[inset_0_0_0_1px_rgba(255,235,170,.24),0_0_34px_rgba(247,198,75,.34),0_0_80px_rgba(247,198,75,.12)]"}`}>
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_26%,rgba(255,255,255,.09)_42%,transparent_56%)]" />
    {!draw && <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,217,104,.22),transparent_66%)]" />}
    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className={`grid h-16 w-14 shrink-0 place-items-center rounded-2xl border ${draw ? "border-violet-200/50 bg-violet-400/25" : "border-[#ffe59a]/70 bg-gradient-to-b from-[#ffe899] via-[#d59b1b] to-[#684000]"}`}><Crown className={`h-5 w-5 ${draw ? "text-violet-100" : "text-[#4b2b00]"}`} fill="currentColor" /><span className={`-mt-1 text-xl font-black ${draw ? "text-white" : "text-[#3b2300]"}`}>1</span></div>
      <Avatar player={player} gold={!draw} />
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-2xl font-black text-white sm:text-[30px]">{player.nickname}</h3><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wider ${draw ? "border-violet-300/40 bg-violet-400/10 text-violet-100" : "border-[#f7c64b]/50 bg-[#f7c64b]/10 text-[#ffe59a]"}`}>{draw ? "SERI" : "PEMENANG"}</span></div><div className="mt-3 grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black/25"><Stat kind="correct" label="Benar" value={player.correct} /><Stat kind="wrong" label="Salah" value={player.wrong} /><Stat kind="total" label="Total" value={player.totalQuestions} /></div></div>
      <div className="text-left sm:text-right"><p className={`text-5xl font-black leading-none sm:text-[62px] ${draw ? "text-violet-100 drop-shadow-[0_0_16px_rgba(139,92,246,.5)]" : "bg-gradient-to-b from-[#fff7c2] via-[#ffd65e] to-[#e99b11] bg-clip-text text-transparent drop-shadow-[0_2px_0_rgba(75,40,0,.8)]"}`}>{player.score}</p><p className={`mt-1 text-xs font-black uppercase tracking-widest ${draw ? "text-violet-200" : "text-[#ffd968]"}`}>PVP Point</p></div>
    </div>
  </article>
}

function LoserCard({ player, draw }: { player: PvpPlayerResult; draw: boolean }) {
  return <div className={`${draw ? "" : "origin-center scale-[.9] -my-3 grayscale-[.5] brightness-[.76] opacity-90"}`}><article className={`relative overflow-hidden rounded-[22px] border p-4 ${draw ? "border-violet-400/60 bg-gradient-to-br from-violet-950/65 to-indigo-950/80 shadow-[0_0_24px_rgba(139,92,246,.22)]" : "border-slate-400/40 bg-gradient-to-br from-slate-700/35 via-[#0a1529] to-slate-950/85 shadow-[0_0_18px_rgba(100,116,139,.15)]"}`}><div className="relative flex flex-col gap-4 sm:flex-row sm:items-center"><div className={`grid h-14 w-12 shrink-0 place-items-center rounded-xl border ${draw ? "border-violet-300/40 bg-violet-400/20" : "border-slate-300/30 bg-slate-400/15"}`}><span className="text-lg font-black text-slate-100">{draw ? 1 : 2}</span></div><Avatar player={player} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-xl font-black text-white sm:text-2xl">{player.nickname}</h3><span className="rounded-full border border-slate-300/25 bg-slate-400/10 px-2.5 py-1 text-[10px] font-black tracking-wider text-slate-300">{draw ? "SERI" : "KALAH"}</span></div><div className="mt-3 grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black/25"><Stat kind="correct" label="Benar" value={player.correct} /><Stat kind="wrong" label="Salah" value={player.wrong} /><Stat kind="total" label="Total" value={player.totalQuestions} /></div></div><div className="text-left sm:text-right"><p className={`text-4xl font-black leading-none sm:text-[50px] ${draw ? "text-violet-100" : "text-slate-200"}`}>{player.score}</p><p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">PVP Point</p></div></div></article></div>
}

function XLogo({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.4 8.5L23 22h-6.7l-5.2-6.8L5 22H1.9l7.9-9.1L1 2h6.9l4.7 6.2L18.9 2Zm-2.4 18h1.9L7.6 3.9H5.6L16.5 20Z" /></svg>
}

export function PvpBattleResultModal({ open, onClose, onViewDetails, onRematch, winner, opponent, durationSeconds = 600 }: PvpBattleResultModalProps) {
  const [mounted, setMounted] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!open) { setMounted(false); setShareOpen(false); return }
    const frame = requestAnimationFrame(() => setMounted(true))
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", onKey) }
  }, [open, onClose])

  if (!open) return null
  const isDraw = winner.score === opponent.score
  const scoreDifference = Math.abs(winner.score - opponent.score)
  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://alzava-battle-iq.pages.dev/pvp"
  const shareText = isDraw ? `Battle PVP ALZAVA berakhir SERI! ${winner.nickname} vs ${opponent.nickname} sama-sama ${winner.score} PVP Point. ⚔️` : `${winner.nickname} menang Battle PVP ALZAVA melawan ${opponent.nickname}! 🏆 ${winner.score} vs ${opponent.score} PVP Point. Bisa kalahkan skor ini?`

  const shareWhatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`, "_blank", "noopener,noreferrer")
  const shareX = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank", "noopener,noreferrer")
  const copyLink = async () => { try { await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`); setCopied(true); window.setTimeout(() => setCopied(false), 1800) } catch {} }
  const nativeShare = async () => { if (!navigator.share) return; try { await navigator.share({ title: "Hasil Battle PVP ALZAVA", text: shareText, url: shareUrl }) } catch {} }
  const downloadResult = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      const blob = await buildDownloadCard(winner, opponent, durationSeconds, isDraw)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `alzava-pvp-${safeFileName(winner.nickname)}-vs-${safeFileName(opponent.nickname)}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1200)
    } finally { setDownloading(false) }
  }

  return <div className={`fixed inset-0 z-[170] flex items-center justify-center bg-[rgba(0,5,18,.86)] px-3 py-3 backdrop-blur-[10px] transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`} role="dialog" aria-modal="true" aria-labelledby="pvp-result-title" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className={`relative max-h-[95vh] w-[min(94vw,920px)] overflow-y-auto overflow-x-hidden rounded-[30px] border border-blue-500/70 bg-[linear-gradient(180deg,rgba(6,24,58,.97),rgba(3,12,32,.98)_48%,rgba(2,8,24,.99))] shadow-[0_0_0_1px_rgba(59,130,246,.15),0_0_50px_rgba(37,99,235,.3),0_45px_100px_-25px_rgba(0,0,0,.9)] transition-all duration-300 ${mounted ? "scale-100 opacity-100" : "scale-[.95] opacity-0"}`}>
      <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[.17] mix-blend-screen" style={{ backgroundImage: "url('/images/hero-bg.png')" }} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,23,.18),rgba(2,8,23,.58)_56%,rgba(2,8,23,.86))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[.05] [background-image:radial-gradient(circle,white_1px,transparent_1.5px)] [background-size:8px_8px]" />
      <button onClick={onClose} className="absolute right-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-xl border border-sky-400/30 bg-[#0a1730]/85 text-slate-200 transition hover:border-sky-300 hover:text-white hover:shadow-[0_0_18px_rgba(56,189,248,.35)]" aria-label="Tutup"><X className="h-5 w-5" /></button>

      <header className="relative z-10 px-4 pb-2 pt-5 text-center sm:px-8 sm:pt-6">
        <div className="pointer-events-none absolute left-1/2 top-4 h-52 w-52 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,217,104,.34),rgba(247,198,75,.09)_45%,transparent_70%)]" />
        <div className="relative mx-auto flex h-28 w-56 items-end justify-center"><Sparkles className="absolute left-5 top-4 h-5 w-5 animate-pulse text-[#ffe59a]" /><Sparkles className="absolute right-4 top-1 h-4 w-4 animate-pulse text-[#ffe59a] [animation-delay:.7s]" /><div className="absolute bottom-0 left-7 h-20 w-16 -rotate-[16deg] rounded-[60%_10%_60%_10%] border-l-[5px] border-t-2 border-[#f7c64b]/70" /><div className="absolute bottom-0 right-7 h-20 w-16 rotate-[16deg] scale-x-[-1] rounded-[60%_10%_60%_10%] border-l-[5px] border-t-2 border-[#f7c64b]/70" /><div className="relative z-10 flex flex-col items-center"><Crown className="-mb-2 h-10 w-10 text-[#ffd968] drop-shadow-[0_0_12px_rgba(255,217,104,.8)]" fill="currentColor" /><Trophy className="h-20 w-20 text-[#ffe59a] drop-shadow-[0_0_18px_rgba(247,198,75,.75)]" fill="#dca414" strokeWidth={1.2} /></div></div>
        <h2 id="pvp-result-title" className="bg-gradient-to-b from-[#fffbe0] via-[#ffd65e] to-[#e69408] bg-clip-text text-4xl font-black tracking-tight text-transparent drop-shadow-[0_3px_0_rgba(70,38,0,.8)] sm:text-6xl">Waktu Habis!</h2>
        <p className="mt-2 text-base font-extrabold text-white sm:text-2xl">{isDraw ? "Hasil Battle PVP berakhir seri" : "Pemenang Battle PVP telah ditentukan"}</p>
        <div className="mx-auto mt-4 flex max-w-3xl flex-col items-center gap-2 rounded-2xl border border-sky-400/20 bg-[#071833]/70 p-1.5 backdrop-blur-sm sm:flex-row"><div className="flex items-center gap-2 rounded-xl border border-sky-400/25 bg-[#0b2248]/75 px-4 py-2 text-sm text-slate-100"><Timer className="h-4 w-4" /> Durasi Battle: <strong className="text-cyan-300">{formatDuration(durationSeconds)}</strong></div><span className="hidden h-px w-4 bg-slate-300/50 sm:block" /><p className="px-2 text-xs text-slate-300 sm:text-sm">Pertarungan selesai. Skor akhir dihitung dari benar +50 dan salah −25.</p></div>
      </header>

      <section className="relative z-10 flex flex-col gap-4 px-4 pt-3 sm:px-8"><WinnerCard player={winner} draw={isDraw} /><LoserCard player={opponent} draw={isDraw} /></section>
      <div className="relative z-10 mx-4 mt-5 flex items-center justify-center gap-3 rounded-2xl border border-sky-400/20 bg-[#071833]/70 px-4 py-3 text-center backdrop-blur-sm sm:mx-8"><BarChart3 className="h-5 w-5 shrink-0 text-[#ffd968]" /><p className="text-sm text-slate-100 sm:text-lg">{isDraw ? <>Battle berakhir seri dengan skor <span className="font-black text-[#ffd968]">{winner.score} PVP Point</span>.</> : <>{winner.nickname} unggul <span className="font-black text-[#ffd968]">{scoreDifference} poin</span> dan memenangkan duel ini.</>}</p></div>

      <div className="relative z-20 flex flex-col gap-3 px-4 pb-6 pt-5 sm:flex-row sm:px-8">
        <button onClick={onViewDetails} className="group flex h-14 flex-1 items-center justify-center gap-2.5 rounded-2xl border border-white/20 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 px-4 text-sm font-black text-white shadow-[0_0_24px_rgba(124,58,237,.35),0_0_30px_rgba(6,182,212,.22)] transition hover:-translate-y-0.5 hover:brightness-110 sm:h-16 sm:text-lg"><ClipboardList className="h-5 w-5" /> Lihat Hasil Detail <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></button>
        <button onClick={onRematch} className="group flex h-14 flex-1 items-center justify-center gap-2.5 rounded-2xl border border-blue-400/80 bg-[#071833]/70 px-4 text-sm font-black text-white shadow-[0_0_18px_rgba(59,130,246,.22)] transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-[#0b2248]/80 sm:h-16 sm:text-lg"><RotateCcw className="h-5 w-5 transition duration-500 group-hover:-rotate-180" /> Tantang Lagi</button>
        <div className="relative flex-1"><button onClick={() => setShareOpen((value) => !value)} aria-expanded={shareOpen} className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border border-blue-400/80 bg-[#071833]/70 px-4 text-sm font-black text-white shadow-[0_0_18px_rgba(59,130,246,.22)] transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-[#0b2248]/80 sm:h-16 sm:text-lg"><Share2 className="h-5 w-5" /> Bagikan</button>
          {shareOpen && <div className="absolute bottom-[calc(100%+10px)] left-1/2 z-50 w-64 -translate-x-1/2 overflow-hidden rounded-2xl border border-sky-400/30 bg-[#08172f] p-1.5 text-sm text-slate-100 shadow-[0_22px_55px_-15px_rgba(0,0,0,.85),0_0_24px_rgba(59,130,246,.18)]">
            {typeof navigator !== "undefined" && "share" in navigator && <button onClick={() => { setShareOpen(false); void nativeShare() }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-sky-400/10"><Share2 className="h-4 w-4 text-sky-300" /> Bagikan...</button>}
            <button onClick={() => { setShareOpen(false); shareWhatsapp() }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-emerald-400/10"><MessageCircle className="h-4 w-4 text-emerald-400" /> WhatsApp</button>
            <button onClick={() => { setShareOpen(false); void downloadResult() }} disabled={downloading} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-violet-400/10 disabled:opacity-60"><Download className="h-4 w-4 text-violet-300" /> {downloading ? "Menyiapkan PNG..." : "Unduh Hasil (PNG)"}</button>
            <button onClick={() => { setShareOpen(false); shareX() }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-400/10"><XLogo className="h-4 w-4 text-slate-200" /> Bagikan ke X</button>
            <button onClick={() => { setShareOpen(false); void copyLink() }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-sky-400/10">{copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4 text-sky-300" />} {copied ? "Tersalin!" : "Salin Link"}</button>
          </div>}
        </div>
      </div>
    </div>
  </div>
}

export default PvpBattleResultModal
