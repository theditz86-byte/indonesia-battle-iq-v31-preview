"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Award, BarChart3, Clock3, MapPin, MessageCircle, ShieldCheck, Sparkles, Swords, Target, Trophy, TrendingDown, TrendingUp } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import { SocialActions } from "@/components/social-actions"
import { fetchOverview, formatDuration, formatScore } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"

const PROFILE_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-profile"

type Profile = {
  public_id?: string
  nickname?: string
  avatar_url?: string | null
  province_name?: string
  regency_name?: string
  district_name?: string
}

type RankedRow = {
  season_id?: string
  season_label?: string | null
  season_number?: number | null
  season_status?: string | null
  battle_score?: number | null
  correct_count?: number | null
  question_count?: number | null
  duration_ms?: number | null
  national_rank?: number | null
  previous_national_rank?: number | null
  rank_changed_at?: string | null
  achieved_at?: string | null
}

type PvpStats = {
  total_battles?: number | null
  wins?: number | null
  losses?: number | null
  draws?: number | null
  win_rate?: number | null
  best_score?: number | null
  points_for?: number | null
  points_against?: number | null
}

type PvpHistoryRow = {
  id?: string
  finished_at?: string | null
  started_at?: string | null
  sudden_death_started_at?: string | null
  my_score?: number | null
  opponent_score?: number | null
  my_correct?: number | null
  my_wrong?: number | null
  opponent_correct?: number | null
  opponent_wrong?: number | null
  result?: "win" | "loss" | "draw" | string
  opponent_public_id?: string | null
  opponent_nickname?: string | null
  opponent_avatar_url?: string | null
}

type BattleTitle = {
  scope_type?: string
  scope_name?: string
  title?: string
  final_rank?: number
  battle_score?: number
  awarded_at?: string
}

type Achievement = {
  key?: string
  title?: string
  description?: string
  icon?: string
}

type RankProgress = {
  national_rank?: number | null
  previous_national_rank?: number | null
  movement?: number | null
  rank_changed_at?: string | null
  province_rank?: number | null
  regency_rank?: number | null
  district_rank?: number | null
  next_target?: {
    rank?: number | null
    nickname?: string | null
    battle_score?: number | null
    points_needed?: number | null
  } | null
}

type PublicProfileResponse = {
  profile?: Profile
  current?: RankedRow | null
  stats?: {
    best_score?: number | null
    best_national_rank?: number | null
    ranked_seasons?: number | null
  }
  history?: RankedRow[]
  rank_progress?: RankProgress
  pvp_stats?: PvpStats
  pvp_history?: PvpHistoryRow[]
  achievements?: Achievement[]
  titles?: BattleTitle[]
  featured_title?: BattleTitle | null
}

function initials(name?: string) {
  return (name || "BP").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "BP"
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date)
}

function pct(correct?: number | null, total?: number | null) {
  const c = Number(correct) || 0
  const t = Number(total) || 0
  return t > 0 ? Math.round((c / t) * 100) : null
}

export default function PlayerProfilePage() {
  const [viewer, setViewer] = useState<BattleParticipant | null>(null)
  const [data, setData] = useState<PublicProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    void fetchOverview("country", null).then((overview) => setViewer(overview.participant)).catch(() => setViewer(null))
  }, [])

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") || ""
    if (!id) {
      setError("Profil peserta tidak ditemukan.")
      setLoading(false)
      return
    }
    const controller = new AbortController()
    void fetch(`${PROFILE_API}?id=${encodeURIComponent(id)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body?.error || "Profil peserta tidak tersedia.")
        setData(body)
        setError("")
      })
      .catch((err) => {
        if ((err as Error)?.name !== "AbortError") setError("Profil peserta belum dapat dimuat.")
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const profile = data?.profile
  const current = data?.current
  const history = Array.isArray(data?.history) ? data!.history! : []
  const pvpHistory = Array.isArray(data?.pvp_history) ? data!.pvp_history! : []
  const achievements = Array.isArray(data?.achievements) ? data!.achievements! : []
  const titles = Array.isArray(data?.titles) ? data!.titles! : []
  const pvpStats = data?.pvp_stats || {}
  const rankProgress = data?.rank_progress || {}
  const movement = Number(rankProgress.movement)
  const accuracy = useMemo(() => {
    const correct = Number(current?.correct_count) || 0
    const total = Number(current?.question_count) || 0
    return total > 0 ? Math.round((correct / total) * 100) : null
  }, [current])

  const movementLabel = rankProgress.movement == null
    ? "Belum ada perubahan"
    : movement > 0
      ? `Naik ${movement} peringkat`
      : movement < 0
        ? `Turun ${Math.abs(movement)} peringkat`
        : "Peringkat tetap"

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(56,189,248,.15),transparent_34rem),linear-gradient(180deg,#020617_0%,#071327_48%,#020617_100%)] text-white">
      <SiteNavbar participant={viewer} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <a href="/battle" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10"><ArrowLeft className="h-4 w-4" /> Kembali ke Battle</a>
          <a href="/global-chat" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-sm font-bold text-cyan-100 hover:bg-cyan-300/15"><MessageCircle className="h-4 w-4" /> Chat Global</a>
        </div>

        {loading ? (
          <div className="grid min-h-[420px] place-items-center rounded-3xl border border-white/10 bg-white/[.04] text-slate-400">Memuat profil pemain…</div>
        ) : error || !profile ? (
          <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-8 text-center"><p className="text-xl font-black">Profil tidak tersedia</p><p className="mt-2 text-sm text-rose-100/70">{error || "Peserta ini belum memiliki profil publik."}</p></div>
        ) : (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[.055] shadow-[0_28px_90px_rgba(0,0,0,.35)] backdrop-blur-xl">
              <div className="relative border-b border-white/10 bg-[radial-gradient(circle_at_30%_0%,rgba(34,211,238,.22),transparent_36rem),linear-gradient(135deg,rgba(15,23,42,.92),rgba(30,41,59,.74))] px-6 py-8 sm:px-9 sm:py-10">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.nickname || "Peserta"} className="h-28 w-28 rounded-[28px] object-cover ring-4 ring-cyan-300/35 shadow-[0_0_34px_rgba(34,211,238,.24)]" />
                  ) : (
                    <div className="grid h-28 w-28 place-items-center rounded-[28px] bg-gradient-to-br from-cyan-500 to-indigo-700 text-3xl font-black ring-4 ring-cyan-300/35 shadow-[0_0_34px_rgba(34,211,238,.24)]">{initials(profile.nickname)}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[.15em] text-cyan-200">Player Profile</span>
                      {current?.national_rank === 1 && <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[11px] font-black text-amber-200">🏆 Rank #1</span>}
                      {data?.featured_title?.title && <span className="rounded-full border border-amber-300/25 bg-gradient-to-r from-amber-300/10 to-yellow-400/10 px-3 py-1 text-[11px] font-black text-amber-100">★ {data.featured_title.title}</span>}
                    </div>
                    <h1 className="mt-3 truncate text-4xl font-black tracking-tight sm:text-5xl">{profile.nickname || "Peserta"}</h1>
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-300"><MapPin className="h-4 w-4 text-cyan-300" />{[profile.district_name, profile.regency_name, profile.province_name].filter(Boolean).join(" · ") || "Indonesia"}</p>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Profil publik Battle Point. Yang tampil hanya identitas permainan, wilayah ranking, dan statistik kompetisi—bukan username, email, atau data akun pribadi.</p>
                    <div className="mt-5"><SocialActions viewer={viewer} targetPublicId={profile.public_id} targetName={profile.nickname} /></div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.07] p-5"><p className="text-xs font-bold text-slate-400">Battle Point</p><p className="mt-1 text-3xl font-black text-cyan-300">{current ? formatScore(current.battle_score) : "—"}</p><p className="mt-1 text-[11px] text-slate-500">Season aktif</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[.045] p-5"><p className="text-xs font-bold text-slate-400">Peringkat Nasional</p><p className="mt-1 text-3xl font-black">{current?.national_rank ? `#${current.national_rank}` : "—"}</p><p className="mt-1 text-[11px] text-slate-500">Ranking resmi</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[.045] p-5"><p className="text-xs font-bold text-slate-400">Ketepatan</p><p className="mt-1 text-3xl font-black">{accuracy === null ? "—" : `${accuracy}%`}</p><p className="mt-1 text-[11px] text-slate-500">{current?.correct_count ?? "—"}/{current?.question_count ?? "—"} benar</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[.045] p-5"><p className="text-xs font-bold text-slate-400">Best Battle Point</p><p className="mt-1 text-3xl font-black text-amber-300">{data?.stats?.best_score == null ? "—" : formatScore(data.stats.best_score)}</p><p className="mt-1 text-[11px] text-slate-500">{data?.stats?.ranked_seasons || 0} season tercatat</p></div>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(8,145,178,.10),rgba(3,12,32,.72)_48%,rgba(124,58,237,.08))] p-6 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><TrendingUp className="h-5 w-5" /></div><div><h2 className="text-2xl font-black">Progress Ranking</h2><p className="text-xs text-slate-500">Posisi sekarang, pergerakan, dan target berikutnya.</p></div></div>
                {current?.national_rank ? <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${movement > 0 ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300" : movement < 0 ? "border-rose-300/20 bg-rose-400/10 text-rose-300" : "border-white/10 bg-white/5 text-slate-300"}`}>{movement > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : movement < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}{movementLabel}</span> : null}
              </div>

              {current ? <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.07] p-5"><p className="text-xs font-bold text-slate-500">Indonesia</p><p className="mt-1 text-3xl font-black text-cyan-300">{rankProgress.national_rank ? `#${rankProgress.national_rank}` : "—"}</p><p className="mt-1 text-[11px] text-slate-600">Peringkat nasional</p></div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5"><p className="text-xs font-bold text-slate-500">Provinsi</p><p className="mt-1 text-3xl font-black">{rankProgress.province_rank ? `#${rankProgress.province_rank}` : "—"}</p><p className="mt-1 truncate text-[11px] text-slate-600">{profile.province_name || "—"}</p></div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5"><p className="text-xs font-bold text-slate-500">Kabupaten/Kota</p><p className="mt-1 text-3xl font-black">{rankProgress.regency_rank ? `#${rankProgress.regency_rank}` : "—"}</p><p className="mt-1 truncate text-[11px] text-slate-600">{profile.regency_name || "—"}</p></div>
                  <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-5"><p className="text-xs font-bold text-slate-500">Kecamatan</p><p className="mt-1 text-3xl font-black text-amber-300">{rankProgress.district_rank ? `#${rankProgress.district_rank}` : "—"}</p><p className="mt-1 truncate text-[11px] text-slate-600">{profile.district_name || "—"}</p></div>
                </div>

                <div className="mt-4 rounded-2xl border border-violet-300/15 bg-gradient-to-r from-violet-400/[.08] to-cyan-400/[.06] p-5">
                  {rankProgress.national_rank === 1 ? <div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-300/10 text-amber-300"><Trophy className="h-6 w-6" /></div><div><p className="font-black text-amber-100">Puncak Nasional</p><p className="mt-1 text-sm text-slate-400">Saat ini tidak ada pemain di atas posisi ini. Pertahankan Battle Point sampai season berakhir.</p></div></div> : rankProgress.next_target ? <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-violet-300">Target berikutnya</p><p className="mt-1 text-lg font-black">Kejar Rank #{rankProgress.next_target.rank} · {rankProgress.next_target.nickname || "Pemain di atasmu"}</p><p className="mt-1 text-sm text-slate-400">Target saat ini {formatScore(rankProgress.next_target.battle_score)} BP.</p></div><div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-5 py-3 text-center"><p className="text-[10px] font-black uppercase tracking-wider text-amber-200/70">Butuh untuk melewati aman</p><p className="mt-1 text-3xl font-black text-amber-300">+{formatScore(rankProgress.next_target.points_needed)}</p><p className="text-[10px] text-amber-100/45">Battle Point</p></div></div> : <p className="text-sm text-slate-400">Target ranking berikutnya akan muncul setelah leaderboard tersedia.</p>}
                </div>
              </> : <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-7 text-center text-sm text-slate-500">Selesaikan Ranked Battle resmi untuk membuka Progress Ranking.</div>}
            </section>

            <section className="overflow-hidden rounded-3xl border border-violet-300/15 bg-[linear-gradient(135deg,rgba(79,70,229,.08),rgba(3,12,32,.66)_45%,rgba(34,211,238,.05))] p-6 sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-200"><Swords className="h-5 w-5" /></div><div><h2 className="text-2xl font-black">Karier Battle PVP</h2><p className="text-xs text-slate-500">Statistik duel 1v1 dari seluruh pertandingan selesai.</p></div></div>
                <div className="text-xs font-bold text-slate-500">Record: <span className="text-emerald-300">{Number(pvpStats.wins) || 0}W</span> · <span className="text-rose-300">{Number(pvpStats.losses) || 0}L</span>{Number(pvpStats.draws) ? <> · <span className="text-violet-300">{Number(pvpStats.draws)}D</span></> : null}</div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5"><p className="text-xs font-bold text-slate-500">Total Battle</p><p className="mt-1 text-3xl font-black">{Number(pvpStats.total_battles) || 0}</p><p className="mt-1 text-[11px] text-slate-600">Duel selesai</p></div>
                <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[.06] p-5"><p className="text-xs font-bold text-slate-500">Menang</p><p className="mt-1 text-3xl font-black text-emerald-300">{Number(pvpStats.wins) || 0}</p><p className="mt-1 text-[11px] text-emerald-100/45">Victory</p></div>
                <div className="rounded-2xl border border-rose-300/15 bg-rose-400/[.05] p-5"><p className="text-xs font-bold text-slate-500">Kalah</p><p className="mt-1 text-3xl font-black text-rose-300">{Number(pvpStats.losses) || 0}</p><p className="mt-1 text-[11px] text-rose-100/45">Defeat</p></div>
                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.06] p-5"><p className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><TrendingUp className="h-3.5 w-3.5" /> Win Rate</p><p className="mt-1 text-3xl font-black text-cyan-300">{Number(pvpStats.win_rate || 0).toFixed(1)}%</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${Math.min(100, Math.max(0, Number(pvpStats.win_rate) || 0))}%` }} /></div></div>
                <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-5"><p className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><Target className="h-3.5 w-3.5" /> Best PVP Point</p><p className="mt-1 text-3xl font-black text-amber-300">{pvpStats.best_score == null ? "—" : formatScore(pvpStats.best_score)}</p><p className="mt-1 text-[11px] text-slate-600">Skor duel tertinggi</p></div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[.045] p-6 sm:p-7">
              <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><BarChart3 className="h-5 w-5" /></div><div><h2 className="text-xl font-black">Riwayat Battle PVP</h2><p className="text-xs text-slate-500">20 duel terakhir · skor dan hasil pertandingan.</p></div></div>
              <div className="mt-5 space-y-3">
                {pvpHistory.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-7 text-center text-sm text-slate-500">Belum ada riwayat Battle PVP.</div> : pvpHistory.map((row, index) => {
                  const win = row.result === "win"
                  const loss = row.result === "loss"
                  const badge = win ? "MENANG" : loss ? "KALAH" : "SERI"
                  const badgeClass = win ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300" : loss ? "border-rose-300/20 bg-rose-400/10 text-rose-300" : "border-violet-300/20 bg-violet-400/10 text-violet-300"
                  return <div key={row.id || index} className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                    <div className="flex items-center gap-3">
                      {row.opponent_avatar_url ? <img src={row.opponent_avatar_url} alt={row.opponent_nickname || "Lawan"} className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/15" /> : <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-black ring-1 ring-white/10">{initials(row.opponent_nickname || "Lawan")}</div>}
                      <div><span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black tracking-wider ${badgeClass}`}>{badge}</span><p className="mt-1 text-[11px] text-slate-600">{formatDate(row.finished_at)}</p></div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">vs</p>
                      {row.opponent_public_id ? <a href={`/player?id=${encodeURIComponent(row.opponent_public_id)}`} className="truncate font-black text-slate-100 hover:text-cyan-300">{row.opponent_nickname || "Pemain"}</a> : <p className="truncate font-black">{row.opponent_nickname || "Pemain"}</p>}
                      <p className="mt-1 text-[11px] text-slate-600">Benar {row.my_correct || 0} · Salah {row.my_wrong || 0}{row.sudden_death_started_at ? " · Death Game" : ""}</p>
                    </div>
                    <div className="sm:min-w-36 sm:text-right"><p className={`text-2xl font-black ${win ? "text-emerald-300" : loss ? "text-slate-200" : "text-violet-300"}`}>{formatScore(row.my_score)} <span className="text-sm text-slate-600">—</span> {formatScore(row.opponent_score)}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">PVP Point</p></div>
                  </div>
                })}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
              <section className="rounded-3xl border border-white/10 bg-white/[.045] p-6 sm:p-7">
                <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-400/10 text-indigo-300"><Swords className="h-5 w-5" /></div><div><h2 className="text-xl font-black">Riwayat Ranked</h2><p className="text-xs text-slate-500">History skor Ranked Battle per season.</p></div></div>
                <div className="mt-5 space-y-3">
                  {history.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">Belum ada Ranked Battle resmi.</div> : history.map((row, index) => {
                    const rankedAccuracy = pct(row.correct_count, row.question_count)
                    return <div key={`${row.season_id || index}`} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                      <div><p className="font-black">{row.season_label || `Season ${row.season_number || "—"}`}</p><p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {formatDuration(row.duration_ms)}</span><span>·</span><span>{row.correct_count ?? "—"}/{row.question_count ?? "—"} benar{rankedAccuracy === null ? "" : ` · ${rankedAccuracy}%`}</span><span>·</span><span>{formatDate(row.achieved_at)}</span></p></div>
                      <div className="sm:text-right"><p className="text-xs text-slate-500">Battle Point</p><p className="text-xl font-black text-cyan-300">{formatScore(row.battle_score)}</p></div>
                      <div className="sm:min-w-16 sm:text-right"><p className="text-xs text-slate-500">Rank</p><p className="text-xl font-black">{row.national_rank ? `#${row.national_rank}` : "—"}</p></div>
                    </div>
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[.045] p-6 sm:p-7">
                <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-300/10 text-amber-300"><Trophy className="h-5 w-5" /></div><div><h2 className="text-xl font-black">Achievement & Titel</h2><p className="text-xs text-slate-500">Pencapaian aktif dan titel permanen season.</p></div></div>

                <div className="mt-5">
                  <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-cyan-300"><Sparkles className="h-3.5 w-3.5" /> Achievement</p>
                  <div className="space-y-3">
                    {achievements.length ? achievements.slice(0, 8).map((achievement, index) => <div key={`${achievement.key || "achievement"}-${index}`} className="rounded-2xl border border-cyan-300/15 bg-gradient-to-r from-cyan-300/[.06] to-violet-400/[.05] p-4"><p className="flex items-center gap-2 font-black text-cyan-100"><Award className="h-4 w-4 text-cyan-300" /> {achievement.title || "Achievement"}</p><p className="mt-1 text-xs leading-5 text-slate-500">{achievement.description || "Pencapaian Battle Point."}</p></div>) : <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center"><ShieldCheck className="mx-auto h-5 w-5 text-slate-600" /><p className="mt-2 text-xs font-bold text-slate-500">Belum ada achievement terbuka.</p></div>}
                  </div>
                </div>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="mb-3 text-xs font-black uppercase tracking-[.16em] text-amber-300">Titel Season</p>
                  <div className="space-y-3">
                    {titles.length ? titles.slice(0, 8).map((title, index) => <div key={`${title.title || "title"}-${index}`} className="rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-4"><p className="flex items-center gap-2 font-black text-amber-100"><Trophy className="h-4 w-4 text-amber-300" /> {title.title || "Prestasi Battle"}</p><p className="mt-1 text-xs text-slate-500">{title.scope_name || "Indonesia"}{title.final_rank ? ` · Rank #${title.final_rank}` : ""}{title.awarded_at ? ` · ${formatDate(title.awarded_at)}` : ""}</p></div>) : <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center"><ShieldCheck className="mx-auto h-5 w-5 text-slate-600" /><p className="mt-2 text-xs font-bold text-slate-500">Titel permanen diberikan saat season resmi ditutup.</p></div>}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
