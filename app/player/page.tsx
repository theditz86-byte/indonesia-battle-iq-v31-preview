"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Award, Clock3, MapPin, MessageCircle, ShieldCheck, Swords, Trophy } from "lucide-react"
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
  achieved_at?: string | null
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
  titles?: Array<{
    scope_type?: string
    scope_name?: string
    title?: string
    final_rank?: number
    battle_score?: number
    awarded_at?: string
  }>
}

function initials(name?: string) {
  return (name || "BP").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "BP"
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
  const accuracy = useMemo(() => {
    const correct = Number(current?.correct_count) || 0
    const total = Number(current?.question_count) || 0
    return total > 0 ? Math.round((correct / total) * 100) : null
  }, [current])

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
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[.15em] text-cyan-200">Player Profile</span>{current?.national_rank === 1 && <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[11px] font-black text-amber-200">🏆 Rank #1</span>}</div>
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

            <div className="grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
              <section className="rounded-3xl border border-white/10 bg-white/[.045] p-6 sm:p-7">
                <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-400/10 text-indigo-300"><Swords className="h-5 w-5" /></div><div><h2 className="text-xl font-black">Riwayat Ranked</h2><p className="text-xs text-slate-500">Catatan publik per season.</p></div></div>
                <div className="mt-5 space-y-3">
                  {history.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">Belum ada Ranked Battle resmi.</div> : history.map((row, index) => (
                    <div key={`${row.season_id || index}`} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                      <div><p className="font-black">{row.season_label || `Season ${row.season_number || "—"}`}</p><p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500"><Clock3 className="h-3.5 w-3.5" /> {formatDuration(row.duration_ms)}</p></div>
                      <div className="sm:text-right"><p className="text-xs text-slate-500">Battle Point</p><p className="font-black text-cyan-300">{formatScore(row.battle_score)}</p></div>
                      <div className="sm:min-w-16 sm:text-right"><p className="text-xs text-slate-500">Rank</p><p className="font-black">{row.national_rank ? `#${row.national_rank}` : "—"}</p></div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[.045] p-6 sm:p-7">
                <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-300/10 text-amber-300"><Trophy className="h-5 w-5" /></div><div><h2 className="text-xl font-black">Prestasi</h2><p className="text-xs text-slate-500">Titel dan posisi terbaik.</p></div></div>
                <div className="mt-5 space-y-3">
                  {(data?.titles || []).length ? data!.titles!.slice(0, 6).map((title, index) => <div key={`${title.title || "title"}-${index}`} className="rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-4"><p className="flex items-center gap-2 font-black text-amber-100"><Award className="h-4 w-4 text-amber-300" /> {title.title || "Prestasi Battle"}</p><p className="mt-1 text-xs text-slate-500">{title.scope_name || "Indonesia"}{title.final_rank ? ` · Rank #${title.final_rank}` : ""}</p></div>) : <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center"><ShieldCheck className="mx-auto h-6 w-6 text-slate-600" /><p className="mt-2 text-sm font-bold text-slate-400">Belum ada titel tersimpan</p><p className="mt-1 text-xs leading-5 text-slate-600">Prestasi akan muncul setelah season resmi ditutup.</p></div>}
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
