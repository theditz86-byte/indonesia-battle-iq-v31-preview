"use client"

import { useEffect, useState } from "react"
import { CalendarDays, Crown, Loader2, Medal, Trophy } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { fetchOverview } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"

const HISTORY_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-history"

type Winner = {
  place: number
  participant_public_id?: string
  nickname?: string
  avatar_url?: string | null
  province_name?: string
  regency_name?: string
  district_name?: string
  battle_score?: number
  correct_count?: number
  question_count?: number
  duration_ms?: number
  achieved_at?: string
}

type SeasonHistory = {
  season_number?: number
  season_label?: string
  closed_at?: string
  winners?: Winner[]
}

function initials(name?: string) {
  return (name || "BP").trim().split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]).join("").toUpperCase() || "BP"
}

const medalStyle: Record<number,string> = {
  1:"border-amber-300/35 bg-gradient-to-br from-amber-400/15 via-yellow-300/[.06] to-slate-950/60 shadow-[0_0_50px_rgba(245,158,11,.12)]",
  2:"border-slate-300/25 bg-gradient-to-br from-slate-300/10 to-slate-950/60",
  3:"border-orange-300/25 bg-gradient-to-br from-orange-400/10 to-slate-950/60",
}

export default function HistoryRankingPage(){
  const [history,setHistory]=useState<SeasonHistory[]>([])
  const [participant,setParticipant]=useState<BattleParticipant|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")

  useEffect(()=>{
    const controller=new AbortController()
    fetchOverview("country",null,controller.signal)
      .then(data=>setParticipant(data.participant))
      .catch(()=>{})
    return()=>controller.abort()
  },[])

  useEffect(()=>{
    let alive=true
    fetch(HISTORY_API,{cache:"no-store"})
      .then(async r=>{if(!r.ok)throw new Error("History belum dapat dimuat.");return r.json()})
      .then(data=>{if(alive)setHistory(Array.isArray(data)?data:[])})
      .catch(e=>{if(alive)setError(e instanceof Error?e.message:"History belum dapat dimuat.")})
      .finally(()=>{if(alive)setLoading(false)})
    return()=>{alive=false}
  },[])

  return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,.25),transparent_32rem),linear-gradient(180deg,#020617,#07142e_55%,#020617)] text-white">
    <SiteNavbar participant={participant}/>
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-amber-200"><Trophy className="h-4 w-4"/>Hall of Champions</span>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">History Ranking</h1>
        <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">Arsip Top 3 resmi setiap season yang sudah ditutup. Setelah tersimpan, podium season lama tidak ikut berubah ketika ranking season berikutnya berjalan.</p>
      </div>

      {loading ? <div className="mt-14 flex items-center justify-center gap-2 text-slate-400"><Loader2 className="h-5 w-5 animate-spin"/>Memuat history ranking...</div> : error ? <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-rose-300/20 bg-rose-400/10 p-5 text-center text-rose-100">{error}</div> : history.length===0 ? <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-dashed border-white/15 bg-white/[.035] p-10 text-center"><Crown className="mx-auto h-10 w-10 text-amber-300/60"/><h2 className="mt-4 text-xl font-black">Belum ada season yang dikunci</h2><p className="mt-2 text-sm leading-6 text-slate-500">History akan mulai terisi saat admin menutup season. Hanya Top 3 yang disimpan.</p></div> : <div className="mt-12 grid gap-8">
        {history.map((season)=><section key={String(season.season_number)} className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/45 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-5 sm:px-7">
            <div><p className="text-xs font-black uppercase tracking-[.16em] text-cyan-300">Season Selesai</p><h2 className="mt-1 text-2xl font-black">{season.season_label || `Season ${season.season_number}`}</h2></div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-400"><CalendarDays className="h-4 w-4"/>{season.closed_at?new Date(season.closed_at).toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric"}):"—"}</div>
          </div>
          <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-3">
            {(season.winners||[]).sort((a,b)=>a.place-b.place).map(w=><article key={w.place} className={`relative overflow-hidden rounded-3xl border p-5 ${medalStyle[w.place]||medalStyle[3]}`}>
              <div className="absolute right-4 top-3 text-6xl font-black text-white/[.035]">{w.place}</div>
              <div className="relative flex items-center gap-4">
                <div className={`grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 ${w.place===1?"border-amber-300":w.place===2?"border-slate-300":"border-orange-400"} bg-slate-900 text-lg font-black`}>
                  {w.avatar_url?<img src={w.avatar_url} alt={w.nickname||"Juara"} className="h-full w-full object-cover"/>:initials(w.nickname)}
                </div>
                <div className="min-w-0"><div className="flex items-center gap-2">{w.place===1?<Crown className="h-5 w-5 text-amber-300"/>:<Medal className={`h-5 w-5 ${w.place===2?"text-slate-300":"text-orange-300"}`}/>}<span className="text-xs font-black uppercase tracking-wider text-slate-400">Juara {w.place}</span></div><h3 className="mt-1 truncate text-xl font-black">{w.nickname||"Peserta"}</h3><p className="mt-1 truncate text-xs text-slate-500">{[w.regency_name,w.province_name].filter(Boolean).join(" · ")||"Indonesia"}</p></div>
              </div>
              <div className="mt-6 flex items-end justify-between gap-3"><div><span className="text-xs text-slate-500">Battle Point</span><strong className={`block text-4xl font-black ${w.place===1?"text-amber-300":w.place===2?"text-slate-200":"text-orange-300"}`}>{Number(w.battle_score||0).toLocaleString("id-ID")}</strong></div><div className="text-right text-xs text-slate-500"><span className="block">{w.correct_count||0}/{w.question_count||0} benar</span></div></div>
            </article>)}
          </div>
        </section>)}
      </div>}
    </main>
    <SiteFooter/>
  </div>
}
