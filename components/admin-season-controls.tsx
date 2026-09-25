"use client"

import { useCallback, useEffect, useState } from "react"
import { Archive, CalendarPlus, Loader2, RefreshCw, RotateCcw, Trophy } from "lucide-react"

const API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-season-admin"

type LiveSeason = {
  id?: string
  season_number?: number
  label?: string
  starts_at?: string
  ends_at?: string
  status?: string
  leaderboard_count?: number
}

type SeasonState = {
  live_season?: LiveSeason | null
  history_count?: number
}

async function seasonApi(body: Record<string, unknown>) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || "Kontrol season gagal diproses.")
  return data
}

export function AdminSeasonControls({ token }: { token: string }) {
  const [state, setState] = useState<SeasonState>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [label, setLabel] = useState("")
  const [durationHours, setDurationHours] = useState(168)

  const load = useCallback(async () => {
    if (!token) return
    setError("")
    try {
      const data = await seasonApi({ action: "state", admin_token: token })
      setState(data.state || {})
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status season belum dapat dimuat.")
    }
  }, [token])

  useEffect(() => { void load() }, [load])

  async function run(action: "close" | "open" | "reset") {
    if (!token || busy) return
    if (action === "close" && !window.confirm("Tutup season aktif sekarang? Top 3 saat ini akan dikunci ke History Ranking.")) return
    if (action === "reset") {
      const typed = window.prompt("Reset hanya mengosongkan leaderboard season aktif, bukan riwayat attempt. Ketik RESET untuk melanjutkan.")
      if (typed !== "RESET") return
    }
    if (action === "open" && state.live_season) return

    setBusy(true); setError(""); setMessage("")
    try {
      const payload: Record<string, unknown> = { action, admin_token: token }
      if (action === "open") {
        payload.label = label.trim()
        payload.duration_hours = durationHours
      }
      const data = await seasonApi(payload)
      if (action === "close") setMessage(`Season ditutup. ${Number(data?.result?.winner_count || 0)} juara tersimpan ke History Ranking.`)
      if (action === "reset") setMessage(`Ranking dibersihkan: ${Number(data?.result?.deleted_count || 0)} entri dihapus. Riwayat attempt tetap aman.`)
      if (action === "open") { setMessage("Season baru dibuka. Semua peserta kembali mendapat Ranked Attempt pertama untuk season baru."); setLabel("") }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kontrol season gagal diproses.")
    } finally { setBusy(false) }
  }

  const live = state.live_season

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/[.08] via-indigo-500/[.06] to-slate-950/40 p-5 shadow-2xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-300"><Trophy className="h-5 w-5"/><p className="text-xs font-black uppercase tracking-[.18em]">Kontrol Season</p></div>
          <h2 className="mt-2 text-2xl font-black">Buka, tutup, dan bersihkan ranking dari Admin</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Season sekarang dikendalikan manual. Saat ditutup, hanya Top 3 final yang disimpan permanen ke History Ranking.</p>
        </div>
        <button onClick={()=>load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200"><RefreshCw className={`h-4 w-4 ${busy?"animate-spin":""}`}/>Refresh</button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Season Aktif</p>
          {live ? <>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-2xl font-black text-white">{live.label || `Season ${live.season_number}`}</p><p className="mt-1 text-sm text-slate-400">{Number(live.leaderboard_count || 0)} peserta di leaderboard · berakhir {live.ends_at ? new Date(live.ends_at).toLocaleString("id-ID") : "—"}</p></div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-black uppercase text-emerald-200">LIVE</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={()=>run("close")} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50"><Archive className="h-4 w-4"/>Tutup Season + Simpan Top 3</button>
              <button onClick={()=>run("reset")} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-200 disabled:opacity-50"><RotateCcw className="h-4 w-4"/>Reset Ranking Aktif</button>
            </div>
          </> : <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[.03] p-5 text-sm text-slate-400">Tidak ada season aktif. Gunakan panel di sebelah untuk membuka season baru.</div>}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Buka Season Baru</p><span className="text-xs font-bold text-violet-300">{Number(state.history_count || 0)} season di history</span></div>
          <label className="mt-4 grid gap-2 text-xs font-bold text-slate-400">Nama season (opsional)<input value={label} onChange={e=>setLabel(e.target.value)} disabled={Boolean(live)||busy} placeholder="Otomatis: Season 2026.xx" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50 disabled:opacity-40"/></label>
          <label className="mt-3 grid gap-2 text-xs font-bold text-slate-400">Durasi<input type="number" min={1} max={720} value={durationHours} onChange={e=>setDurationHours(Math.max(1,Math.min(720,Number(e.target.value)||168)))} disabled={Boolean(live)||busy} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50 disabled:opacity-40"/><span className="font-medium text-slate-600">Dalam jam · 168 jam = 7 hari. Untuk testing bisa 1–24 jam.</span></label>
          <button onClick={()=>run("open")} disabled={Boolean(live)||busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<CalendarPlus className="h-4 w-4"/>}Buka Season Baru</button>
        </div>
      </div>

      {message && <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}
      {error && <div className="mt-4 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>}
    </section>
  )
}
