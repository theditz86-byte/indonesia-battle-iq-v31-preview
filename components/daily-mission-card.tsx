"use client"

import { useEffect, useState } from "react"
import { ArrowRight, CheckCircle2, Flame, Loader2, Sparkles, Target } from "lucide-react"
import { getParticipantToken } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"
import { trackGrowthEvent } from "@/components/growth-tracker"

const DAILY_API="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-daily"

type DailyState={
  completed?: boolean
  streak?: number
  result?: {
    correct_count?: number
    question_count?: number
  } | null
}

export function DailyMissionCard({participant}:{participant:BattleParticipant|null}){
  const [state,setState]=useState<DailyState|null>(null)
  const [loading,setLoading]=useState(Boolean(participant))
  const [error,setError]=useState("")

  useEffect(()=>{
    if(!participant){setLoading(false);return}
    const token=getParticipantToken()
    if(!token){setLoading(false);return}
    let cancelled=false
    fetch(DAILY_API,{
      method:"POST",
      headers:{"Content-Type":"application/json","X-Battle-Token":token},
      body:JSON.stringify({action:"state"}),
      cache:"no-store",
    })
      .then(async r=>{
        const data=await r.json().catch(()=>({}))
        if(!r.ok)throw new Error(data?.error||"Misi harian belum dapat dimuat.")
        return data as DailyState
      })
      .then(data=>{
        if(cancelled)return
        setState(data)
        setError("")
        trackGrowthEvent("daily_mission_view",{completed:Boolean(data.completed),streak:Number(data.streak||0)})
      })
      .catch(err=>{if(!cancelled)setError(err instanceof Error?err.message:"Misi harian belum dapat dimuat.")})
      .finally(()=>{if(!cancelled)setLoading(false)})
    return()=>{cancelled=true}
  },[participant?.public_id])

  if(!participant)return null

  const completed=Boolean(state?.completed)
  const streak=Math.max(0,Number(state?.streak||0))
  const correct=Number(state?.result?.correct_count||0)
  const total=Number(state?.result?.question_count||5)

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-orange-300/20 bg-[radial-gradient(circle_at_12%_0%,rgba(251,146,60,.18),transparent_22rem),linear-gradient(135deg,rgba(15,23,42,.96),rgba(7,20,46,.94))] p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-6">
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-orange-400/10 blur-3xl"/>
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-orange-200">
              <Sparkles className="h-3.5 w-3.5"/>Misi Hari Ini
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black text-slate-300">
              <Flame className="h-3.5 w-3.5 text-orange-300"/>{streak} hari streak
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            {completed ? "Misi hari ini selesai." : "5 soal TIU · sekitar 3 menit"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {completed
              ? `Bagus. Kamu menyelesaikan misi hari ini dengan ${correct}/${total} benar. Besok tersedia paket baru agar streak terus hidup.`
              : "Satu latihan singkat per hari untuk menjaga ketajaman. Selesaikan sebelum hari berganti agar streak-mu tidak putus."}
          </p>
          {error&&<p className="mt-2 text-xs text-amber-200">{error}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {loading ? (
            <div className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-black text-slate-300"><Loader2 className="h-4 w-4 animate-spin"/>Memuat misi…</div>
          ) : completed ? (
            <a href="/daily-training" onClick={()=>trackGrowthEvent("daily_mission_click",{completed:true,streak})} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/15">
              <CheckCircle2 className="h-5 w-5"/>Lihat Hasil Hari Ini
            </a>
          ) : (
            <a href="/daily-training" onClick={()=>trackGrowthEvent("daily_mission_click",{completed:false,streak})} className="inline-flex min-h-14 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 px-6 py-3.5 text-base font-black text-slate-950 shadow-[0_0_32px_rgba(251,146,60,.28)] transition hover:-translate-y-0.5">
              <Target className="h-5 w-5"/>Main Sekarang<ArrowRight className="h-5 w-5"/>
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
