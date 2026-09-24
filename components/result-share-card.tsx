"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Share2, Sparkles, X } from "lucide-react"
import { getParticipantToken } from "@/lib/battle"

const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"
const SITE_URL = "https://alzava-battle-iq.pages.dev"
const WIDTH = 1080
const HEIGHT = 1920

type Props = {
  nickname: string
  participantPublicId?: string
  battlePoint: number
  correctCount: number
  questionCount: number
  durationMs: number
  nationalRank?: number
  leaderboardTotal?: number
  provinceName?: string
  regencyName?: string
  districtName?: string
  submittedAt?: string
}

function weekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function seasonLabel(value?: string) {
  const date = value ? new Date(value) : new Date()
  const safe = Number.isNaN(date.getTime()) ? new Date() : date
  return `${safe.getFullYear()}.${String(weekNumber(safe)).padStart(2, "0")}`
}

function durationLabel(ms: number) {
  const total = Math.max(0, Math.round(Number(ms || 0) / 1000))
  const min = Math.floor(total / 60)
  const sec = total % 60
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

function initials(name: string) {
  return (name || "P")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P"
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function fillRounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) {
  roundedRect(ctx, x, y, w, h, r)
  ctx.fillStyle = fill
  ctx.fill()
}

function strokeRounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, stroke: string, line = 2) {
  roundedRect(ctx, x, y, w, h, r)
  ctx.strokeStyle = stroke
  ctx.lineWidth = line
  ctx.stroke()
}

async function loadImage(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error("image")
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error("image"))
      image.src = objectUrl
    })
    return image
  } finally {
    // Browser keeps decoded pixels available after image load.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / image.width, h / image.height)
  const sw = w / scale
  const sh = h / scale
  const sx = (image.width - sw) / 2
  const sy = (image.height - sh) / 2
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h)
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, minSize = 34, weight = 800) {
  let size = startSize
  while (size > minSize) {
    ctx.font = `${weight} ${size}px Arial, sans-serif`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 2
  }
  return size
}

async function currentAvatar() {
  const token = getParticipantToken()
  if (!token) return ""
  try {
    const response = await fetch(ACCOUNT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Battle-Token": token },
      body: JSON.stringify({ action: "me" }),
    })
    const data = await response.json().catch(() => ({}))
    return response.ok ? String(data?.participant?.avatar_url || "") : ""
  } catch {
    return ""
  }
}

function drawStat(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, icon: string, main: string, sub: string, accent: string) {
  fillRounded(ctx, x, y, w, 168, 28, "rgba(7,20,46,.88)")
  strokeRounded(ctx, x, y, w, 168, 28, "rgba(148,163,184,.22)", 2)
  ctx.textAlign = "center"
  ctx.fillStyle = accent
  ctx.font = "700 34px Arial, sans-serif"
  ctx.fillText(icon, x + w / 2, y + 44)
  ctx.fillStyle = "#f8fafc"
  ctx.font = "900 38px Arial, sans-serif"
  ctx.fillText(main, x + w / 2, y + 100)
  ctx.fillStyle = "#94a3b8"
  ctx.font = "600 22px Arial, sans-serif"
  ctx.fillText(sub, x + w / 2, y + 137)
}

async function buildCard(props: Props, avatarUrl: string) {
  const canvas = document.createElement("canvas")
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas tidak tersedia")

  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT)
  bg.addColorStop(0, "#020817")
  bg.addColorStop(.48, "#061936")
  bg.addColorStop(1, "#02040d")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const glowA = ctx.createRadialGradient(540, 620, 40, 540, 620, 610)
  glowA.addColorStop(0, "rgba(245,158,11,.20)")
  glowA.addColorStop(.5, "rgba(14,165,233,.08)")
  glowA.addColorStop(1, "rgba(2,8,23,0)")
  ctx.fillStyle = glowA
  ctx.fillRect(0, 0, WIDTH, 1300)

  ctx.globalAlpha = .16
  ctx.strokeStyle = "#38bdf8"
  ctx.lineWidth = 1
  for (let x = -300; x < WIDTH + 300; x += 90) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + 620, HEIGHT)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  for (let i = 0; i < 95; i++) {
    const x = (i * 173) % WIDTH
    const y = (i * 239) % 1480
    const r = 1 + (i % 3)
    ctx.fillStyle = i % 4 === 0 ? "rgba(251,191,36,.65)" : "rgba(125,211,252,.38)"
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  try {
    const logo = await loadImage("/alzava-emblem-v3.svg")
    ctx.drawImage(logo, 465, 80, 150, 150)
  } catch {}

  ctx.textAlign = "center"
  ctx.fillStyle = "#f8fafc"
  ctx.font = "900 72px Arial, sans-serif"
  ctx.fillText("ALZAVA", 540, 275)
  const brandGrad = ctx.createLinearGradient(370, 0, 710, 0)
  brandGrad.addColorStop(0, "#f59e0b")
  brandGrad.addColorStop(.5, "#fde68a")
  brandGrad.addColorStop(1, "#d97706")
  ctx.fillStyle = brandGrad
  ctx.font = "800 46px Arial, sans-serif"
  ctx.fillText("Battle Point", 540, 326)
  ctx.fillStyle = "#64748b"
  ctx.font = "700 22px Arial, sans-serif"
  ctx.fillText("RESULT SHARE CARD  •  SEASON " + seasonLabel(props.submittedAt), 540, 374)

  ctx.fillStyle = "#f8fafc"
  ctx.font = "900 57px Arial, sans-serif"
  ctx.fillText("HASIL BATTLE-MU", 540, 467)
  ctx.fillStyle = "#fbbf24"
  ctx.font = "900 72px Arial, sans-serif"
  ctx.fillText("SIAP DIPAMERKAN", 540, 540)

  const centerX = 540
  const avatarY = 722
  ctx.save()
  ctx.shadowColor = "rgba(251,191,36,.65)"
  ctx.shadowBlur = 45
  ctx.strokeStyle = "#fbbf24"
  ctx.lineWidth = 13
  ctx.beginPath()
  ctx.arc(centerX, avatarY, 154, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, avatarY, 142, 0, Math.PI * 2)
  ctx.clip()
  if (avatarUrl) {
    try {
      const avatar = await loadImage(avatarUrl)
      drawCover(ctx, avatar, centerX - 142, avatarY - 142, 284, 284)
    } catch {
      ctx.fillStyle = "#2b1739"
      ctx.fillRect(centerX - 142, avatarY - 142, 284, 284)
      ctx.fillStyle = "#fff"
      ctx.font = "900 86px Arial, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(initials(props.nickname), centerX, avatarY + 30)
    }
  } else {
    const avatarBg = ctx.createLinearGradient(400, 580, 680, 860)
    avatarBg.addColorStop(0, "#7f1d1d")
    avatarBg.addColorStop(1, "#312e81")
    ctx.fillStyle = avatarBg
    ctx.fillRect(centerX - 142, avatarY - 142, 284, 284)
    ctx.fillStyle = "#fff"
    ctx.font = "900 86px Arial, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(initials(props.nickname), centerX, avatarY + 30)
  }
  ctx.restore()

  ctx.font = "900 76px Arial, sans-serif"
  ctx.fillStyle = "#fbbf24"
  ctx.fillText("♛", centerX, 575)

  const nameSize = fitText(ctx, props.nickname, 760, 58, 38, 900)
  ctx.font = `900 ${nameSize}px Arial, sans-serif`
  ctx.fillStyle = "#fff"
  ctx.fillText(props.nickname, 540, 930)
  const location = [props.regencyName ? `Kab. ${props.regencyName}` : "", props.provinceName || ""].filter(Boolean).join(" • ") || "Indonesia"
  ctx.fillStyle = "#cbd5e1"
  ctx.font = "600 30px Arial, sans-serif"
  ctx.fillText("⌖  " + location, 540, 980)

  fillRounded(ctx, 92, 1025, 896, 340, 42, "rgba(3,12,31,.94)")
  strokeRounded(ctx, 92, 1025, 896, 340, 42, "rgba(251,191,36,.55)", 4)
  ctx.fillStyle = "#94a3b8"
  ctx.font = "800 27px Arial, sans-serif"
  ctx.fillText("BATTLE POINT", 540, 1090)

  ctx.save()
  ctx.shadowColor = "rgba(245,158,11,.7)"
  ctx.shadowBlur = 42
  ctx.fillStyle = "#fde68a"
  ctx.font = "900 176px Arial, sans-serif"
  ctx.fillText(Number(props.battlePoint || 0).toLocaleString("id-ID"), 540, 1265)
  ctx.restore()

  const rank = props.nationalRank ? `#${props.nationalRank} Nasional` : "Peringkat Nasional"
  const topPercent = props.nationalRank && props.leaderboardTotal
    ? Math.max(1, Math.ceil((props.nationalRank / props.leaderboardTotal) * 100))
    : null
  const accuracy = props.questionCount ? Math.round((props.correctCount / props.questionCount) * 100) : 0

  const ribbon = ctx.createLinearGradient(145, 0, 935, 0)
  ribbon.addColorStop(0, "rgba(120,53,15,.85)")
  ribbon.addColorStop(.5, "rgba(180,83,9,.92)")
  ribbon.addColorStop(1, "rgba(120,53,15,.85)")
  fillRounded(ctx, 145, 1298, 790, 84, 30, ribbon)
  strokeRounded(ctx, 145, 1298, 790, 84, 30, "rgba(253,230,138,.72)", 2)
  ctx.fillStyle = "#fef3c7"
  ctx.font = "900 34px Arial, sans-serif"
  ctx.fillText(`🏆  ${rank}`, 540, 1352)

  const cardW = 206
  const gap = 18
  const startX = 92
  drawStat(ctx, startX, 1425, cardW, "✓", `${props.correctCount}/${props.questionCount}`, `${accuracy}% benar`, "#22d3ee")
  drawStat(ctx, startX + cardW + gap, 1425, cardW, "◷", durationLabel(props.durationMs), "waktu", "#fbbf24")
  drawStat(ctx, startX + (cardW + gap) * 2, 1425, cardW, "↗", topPercent ? `Top ${topPercent}%` : "Top —", "Indonesia", "#a78bfa")
  drawStat(ctx, startX + (cardW + gap) * 3, 1425, cardW, "★", seasonLabel(props.submittedAt), "season", "#34d399")

  ctx.fillStyle = "#f8fafc"
  ctx.font = "900 47px Arial, sans-serif"
  ctx.fillText("BISA LEWATI SKORKU?", 540, 1692)
  ctx.fillStyle = "#94a3b8"
  ctx.font = "600 27px Arial, sans-serif"
  ctx.fillText("Tantang temanmu dan buktikan Battle Point-mu.", 540, 1740)

  const cta = ctx.createLinearGradient(170, 0, 910, 0)
  cta.addColorStop(0, "#f59e0b")
  cta.addColorStop(.5, "#fde68a")
  cta.addColorStop(1, "#f59e0b")
  fillRounded(ctx, 165, 1780, 750, 92, 34, cta)
  ctx.fillStyle = "#111827"
  ctx.font = "900 35px Arial, sans-serif"
  ctx.fillText("⚔  AYO BATTLE SEKARANG", 540, 1837)
  ctx.fillStyle = "#94a3b8"
  ctx.font = "700 22px Arial, sans-serif"
  ctx.fillText("alzava-battle-iq.pages.dev", 540, 1895)

  return canvas
}

export default function ResultShareCard(props: Props) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState("")
  const [blob, setBlob] = useState<Blob | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  const challengeUrl = useMemo(() => {
    const id = props.participantPublicId ? `?id=${encodeURIComponent(props.participantPublicId)}` : ""
    return `${SITE_URL}/challenge${id}`
  }, [props.participantPublicId])

  useEffect(() => {
    if (!open) return
    let active = true
    setBusy(true)
    setMessage("")
    void (async () => {
      try {
        const avatar = await currentAvatar()
        const canvas = await buildCard(props, avatar)
        const nextBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", .96))
        if (!active || !nextBlob) return
        const nextPreview = URL.createObjectURL(nextBlob)
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old)
          return nextPreview
        })
        setBlob(nextBlob)
      } catch {
        if (active) setMessage("Kartu belum dapat dibuat. Silakan coba lagi.")
      } finally {
        if (active) setBusy(false)
      }
    })()
    return () => { active = false }
  }, [open, props])

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  async function shareImage() {
    if (!blob) return
    const file = new File([blob], `ALZAVA-${props.nickname.replace(/[^a-z0-9]+/gi, "-")}-${props.battlePoint}-Battle-Point.png`, { type: "image/png" })
    const text = `${props.nickname} meraih ${props.battlePoint.toLocaleString("id-ID")} Battle Point di ALZAVA Battle Point. Bisa lewati skornya?`
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: "ALZAVA Battle Point", text, url: challengeUrl, files: [file] })
        setMessage("Kartu siap dibagikan.")
        return
      }
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return
    }
    downloadImage()
    try { await navigator.clipboard.writeText(`${text} ${challengeUrl}`) } catch {}
    setMessage("Gambar disimpan. Teks tantangan juga disalin bila browser mengizinkan.")
  }

  function downloadImage() {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `ALZAVA-${props.battlePoint}-Battle-Point.png`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1200)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-4 py-2.5 text-sm font-black text-slate-950 shadow-[0_10px_35px_rgba(245,158,11,.24)] transition hover:-translate-y-0.5"
      >
        <Share2 className="h-4 w-4" />Bagikan Kartu Hasil
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/85 p-0 backdrop-blur-md sm:items-center sm:p-5">
          <div className="relative flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#061027] shadow-2xl sm:rounded-[2rem] lg:flex-row">
            <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur hover:bg-white/10" aria-label="Tutup">
              <X className="h-5 w-5" />
            </button>

            <div className="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_50%_25%,rgba(245,158,11,.12),transparent_32rem),#020817] p-4 sm:p-6">
              <div className="mx-auto max-w-[390px] overflow-hidden rounded-[1.5rem] border border-amber-300/20 bg-slate-950 shadow-[0_25px_80px_rgba(0,0,0,.45)]">
                {busy && <div className="grid aspect-[9/16] place-items-center text-center text-sm font-bold text-slate-400"><div><Sparkles className="mx-auto mb-3 h-7 w-7 animate-pulse text-amber-300"/>Membuat kartu 9:16…</div></div>}
                {!busy && preview && <img src={preview} alt="Preview kartu hasil ALZAVA Battle Point" className="block aspect-[9/16] w-full object-cover" />}
                {!busy && !preview && <div className="grid aspect-[9/16] place-items-center px-6 text-center text-sm text-rose-200">{message || "Preview belum tersedia."}</div>}
              </div>
            </div>

            <div className="w-full border-t border-white/10 p-5 lg:w-[360px] lg:border-l lg:border-t-0 lg:p-7">
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-amber-300">Share Result</p>
              <h2 className="mt-2 text-2xl font-black text-white">Pamerkan Battle Point-mu</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Format 9:16 dibuat khusus agar pas untuk Status WhatsApp dan Instagram Story. Foto, poin, ranking, akurasi, waktu, dan season terisi otomatis.</p>

              <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.06] p-4 text-sm text-cyan-100">
                <strong className="block text-white">{props.battlePoint.toLocaleString("id-ID")} Battle Point</strong>
                <span className="mt-1 block text-xs text-cyan-200/75">{props.nationalRank ? `Peringkat nasional #${props.nationalRank}` : "Siap ditantang temanmu"}</span>
              </div>

              <button type="button" disabled={busy || !blob} onClick={() => void shareImage()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-5 py-4 font-black text-slate-950 disabled:opacity-50">
                <Share2 className="h-5 w-5" />Bagikan ke Status / Teman
              </button>
              <button type="button" disabled={busy || !blob} onClick={downloadImage} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 font-black text-white disabled:opacity-50">
                <Download className="h-5 w-5" />Simpan PNG
              </button>

              {!!message && <p className="mt-4 text-xs leading-5 text-emerald-300">{message}</p>}
              <p className="mt-5 text-[11px] leading-5 text-slate-500">Tautan tantangan ikut dibagikan: {challengeUrl.replace("https://", "")}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
