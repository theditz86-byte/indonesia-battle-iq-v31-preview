"use client"

import { Award, Bell, Flame, TrendingUp, Trophy, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { getParticipantToken } from "@/lib/battle"

const NOTIFICATION_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-notifications"

type NotificationRow = {
  id?: number
  notification_type?: "achievement" | "rank" | "streak" | "title" | "system" | string
  title?: string
  body?: string
  href?: string | null
  read_at?: string | null
  created_at?: string | null
}

type NotificationState = {
  notifications?: NotificationRow[]
  unread_count?: number
  streak?: number
}

async function request(action: "state" | "mark_read") {
  const token = getParticipantToken()
  if (!token) return null
  const response = await fetch(NOTIFICATION_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Battle-Token": token },
    body: JSON.stringify({ action }),
    cache: "no-store",
  })
  if (!response.ok) return null
  return await response.json().catch(() => null) as NotificationState | null
}

function relativeTime(value?: string | null) {
  if (!value) return "Baru saja"
  const ms = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(ms) || ms < 0) return "Baru saja"
  const minute = Math.floor(ms / 60000)
  if (minute < 1) return "Baru saja"
  if (minute < 60) return `${minute} menit lalu`
  const hour = Math.floor(minute / 60)
  if (hour < 24) return `${hour} jam lalu`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day} hari lalu`
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(new Date(value))
}

function Icon({ type }: { type?: string }) {
  if (type === "achievement") return <Award className="h-4 w-4 text-violet-300" />
  if (type === "rank") return <TrendingUp className="h-4 w-4 text-cyan-300" />
  if (type === "streak") return <Flame className="h-4 w-4 text-orange-300" />
  if (type === "title") return <Trophy className="h-4 w-4 text-amber-300" />
  return <Bell className="h-4 w-4 text-slate-300" />
}

export function NotificationCenter() {
  const [rows, setRows] = useState<NotificationRow[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  async function load() {
    if (!getParticipantToken()) return
    setLoading(true)
    try {
      const data = await request("state")
      if (!data) return
      setRows(Array.isArray(data.notifications) ? data.notifications : [])
      setUnread(Math.max(0, Number(data.unread_count || 0)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load()
    }, 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    function outside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", outside)
    return () => document.removeEventListener("mousedown", outside)
  }, [])

  async function toggle() {
    const next = !open
    setOpen(next)
    if (!next) return
    await load()
    if (unread > 0) {
      setUnread(0)
      void request("mark_read")
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button type="button" onClick={() => void toggle()} aria-label="Notifikasi" className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-300/20 hover:bg-white/10 hover:text-white">
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-slate-950 ring-2 ring-slate-950 shadow-[0_0_14px_rgba(251,191,36,.5)]">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[120] w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-white/10 bg-[#061329]/98 shadow-[0_26px_90px_rgba(0,0,0,.58)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
            <div><p className="text-sm font-black text-white">Notifikasi Battle</p><p className="mt-0.5 text-[10px] font-medium text-slate-500">Peringkat, achievement, titel, dan streak</p></div>
            <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>

          <div className="max-h-[430px] overflow-y-auto p-2">
            {loading && rows.length === 0 ? <div className="px-4 py-8 text-center text-xs font-semibold text-slate-500">Memuat notifikasi…</div> : rows.length === 0 ? <div className="px-5 py-9 text-center"><Bell className="mx-auto h-6 w-6 text-slate-600"/><p className="mt-2 text-sm font-bold text-slate-400">Belum ada notifikasi</p><p className="mt-1 text-xs leading-5 text-slate-600">Main Ranked, PVP, dan jaga Latihan Harian untuk membuka pencapaian.</p></div> : rows.map((row) => {
              const content = <>
                <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${row.notification_type === "title" ? "border-amber-300/15 bg-amber-300/[.07]" : row.notification_type === "streak" ? "border-orange-300/15 bg-orange-300/[.07]" : row.notification_type === "rank" ? "border-cyan-300/15 bg-cyan-300/[.07]" : "border-violet-300/15 bg-violet-300/[.07]"}`}><Icon type={row.notification_type} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-black leading-5 text-slate-100">{row.title || "Notifikasi Battle"}</span><span className="mt-1 block text-xs leading-5 text-slate-400">{row.body || ""}</span><span className="mt-1.5 block text-[10px] font-bold text-slate-600">{relativeTime(row.created_at)}</span></span>
              </>
              const cls = `flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[.055] ${row.read_at ? "opacity-75" : "bg-cyan-300/[.035]"}`
              return row.href ? <a key={row.id} href={row.href} onClick={() => setOpen(false)} className={cls}>{content}</a> : <div key={row.id} className={cls}>{content}</div>
            })}
          </div>
        </div>
      )}
    </div>
  )
}
