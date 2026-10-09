"use client"

import { BrainCircuit, MapPin, RefreshCw, Trophy } from "lucide-react"
import { useEffect, useState } from "react"
import { getParticipantToken } from "@/lib/battle"

const API="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-visual-iq"

export type VisualIqRankItem={
  rank:number
  total:number
  percentile:number
  attempt_id?:string
  public_id?:string
  nickname?:string
  avatar_url?:string
  province_name?:string
  regency_name?:string
  iq_estimate:number
  correct_count:number
  question_count:number
  duration_ms:number
  created_at?:string
}
type Scope="national"|"province"|"regency"
type ParticipantLite={
  nickname?:string
  province_name?:string
  regency_name?:string
}
type Payload={scope?:Scope;total?:number;items?:VisualIqRankItem[];me?:VisualIqRankItem|null}

export function iqLevelForRank(iq:number){
  if(iq>=145)return "Genius"
  if(iq>=130)return "Sangat Superior"
  if(iq>=120)return "Superior"
  if(iq>=110)return "Di Atas Rata-rata"
  if(iq>=90)return "Rata-rata"
  if(iq>=80)return "Rata-rata Rendah"
  return "Di Bawah Rata-rata"
}
function duration(ms:number){
  const sec=Math.max(0,Math.round(Number(ms||0)/1000))
  return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0")
}
function location(item:VisualIqRankItem){
  return item.regency_name||item.province_name||"Indonesia"
}
function ScopeButton({active,disabled,onClick,children}:{active:boolean;disabled?:boolean;onClick:()=>void;children:React.ReactNode}){
  return <button type="button" disabled={disabled} onClick={onClick} className={`rounded-xl border px-3 py-2 text-[11px] font-black transition ${active?"border-cyan-300/45 bg-cyan-300/10 text-cyan-100":"border-white/10 bg-white/[.035] text-slate-400 hover:text-white"} disabled:cursor-not-allowed disabled:opacity-35`}>{children}</button>
}

export function VisualIqLeaderboard({participant,onStart}:{participant?:ParticipantLite|null;onStart?:()=>void}){
  const [scope,setScope]=useState<Scope>("national")
  const [data,setData]=useState<Payload>({items:[]})
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")

  async function load(){
    const token=getParticipantToken()
    if(!token)return
    setLoading(true);setError("")
    try{
      const response=await fetch(API,{
        method:"POST",
        headers:{"Content-Type":"application/json","X-Battle-Token":token},
        body:JSON.stringify({action:"leaderboard",scope,limit:50}),
        cache:"no-store",
      })
      const body=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(body?.error||"Ranking IQ belum dapat dimuat.")
      setData(body)
    }catch(e){
      setError(e instanceof Error?e.message:"Ranking IQ belum dapat dimuat.")
      setData({items:[]})
    }finally{setLoading(false)}
  }

  useEffect(()=>{void load()},[scope])
  const items=Array.isArray(data.items)?data.items:[]
  const me=data.me||null
  const meVisible=me?items.some(item=>item.attempt_id===me.attempt_id):false
  const scopeLabel=scope==="national"?"Nasional":scope==="province"?(participant?.province_name||"Provinsi"):(participant?.regency_name||"Kabupaten/Kota")

  return <section className="space-y-4">
    <div className="rounded-[26px] border border-cyan-300/15 bg-gradient-to-br from-cyan-400/[.06] via-violet-400/[.05] to-slate-950/70 p-4 shadow-[0_22px_65px_rgba(0,0,0,.28)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-cyan-300"><Trophy className="h-4 w-4"/>Ranking IQ ALZAVA</div>
          <h2 className="mt-2 text-2xl font-black text-white">{scopeLabel}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">Ranking menggunakan <b className="text-slate-300">hasil terbaik</b> tiap akun dari format 35 soal.</p>
        </div>
        <button type="button" onClick={()=>void load()} aria-label="Muat ulang ranking" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-slate-400 hover:text-white"><RefreshCw className={`h-4 w-4 ${loading?"animate-spin":""}`}/></button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <ScopeButton active={scope==="national"} onClick={()=>setScope("national")}>Nasional</ScopeButton>
        <ScopeButton active={scope==="province"} disabled={!participant?.province_name} onClick={()=>setScope("province")}>Provinsi</ScopeButton>
        <ScopeButton active={scope==="regency"} disabled={!participant?.regency_name} onClick={()=>setScope("regency")}>Kab/Kota</ScopeButton>
      </div>

      {loading&&<div className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-6 text-center text-sm font-bold text-slate-500">Memuat ranking IQ…</div>}
      {!loading&&error&&<div className="mt-6 rounded-2xl border border-rose-300/15 bg-rose-300/[.06] p-4 text-sm font-bold text-rose-200">{error}</div>}

      {!loading&&!error&&items.length===0&&<div className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-6 text-center">
        <BrainCircuit className="mx-auto h-8 w-8 text-cyan-300"/>
        <p className="mt-3 font-black text-white">Belum ada peserta di ranking ini</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Hanya hasil Tes IQ format 35 soal yang masuk leaderboard baru.</p>
        {onStart&&<button type="button" onClick={onStart} className="mt-4 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950">Jadi peserta pertama</button>}
      </div>}

      {!loading&&!error&&items.length>0&&<div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35">
        <div className="grid grid-cols-[42px_44px_1fr_auto] items-center gap-3 border-b border-white/10 bg-white/[.035] px-3 py-2.5 text-[9px] font-black uppercase tracking-[.12em] text-slate-500">
          <div className="text-center">Rank</div>
          <div></div>
          <div>Peserta</div>
          <div className="text-right">IQ</div>
        </div>

        <div className="divide-y divide-white/[.07]">
          {items.map(item=>{
            const isMe=me?.attempt_id===item.attempt_id
            const top1=item.rank===1
            const top2=item.rank===2
            const top3=item.rank===3
            const rankTone=top1?"border-amber-300/40 bg-amber-300/10 text-amber-200":top2?"border-slate-300/30 bg-slate-300/10 text-slate-200":top3?"border-orange-300/30 bg-orange-300/10 text-orange-200":"border-white/10 bg-white/[.035] text-slate-400"
            const rowTone=isMe?"bg-cyan-300/[.075]":top1?"bg-amber-300/[.035]":"hover:bg-white/[.025]"
            return <div key={item.attempt_id||item.rank} className={`grid grid-cols-[42px_44px_1fr_auto] items-center gap-3 px-3 py-3 transition ${rowTone}`}>
              <div className={`grid h-8 w-8 place-items-center rounded-lg border text-xs font-black ${rankTone}`}>
                {item.rank}
              </div>

              <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-cyan-500/25 to-violet-500/25 text-xs font-black text-white">
                {item.avatar_url?<img src={item.avatar_url} alt="" className="h-full w-full object-cover"/>:(item.nickname||"?").slice(0,1).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`truncate text-sm font-black ${top1?"text-amber-100":"text-white"}`}>{item.nickname||"Peserta"}</p>
                  {isMe&&<span className="shrink-0 rounded-full bg-cyan-300/10 px-2 py-0.5 text-[8px] font-black uppercase text-cyan-200">Anda</span>}
                </div>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-bold text-slate-500">
                  <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3 w-3 shrink-0"/><span className="truncate">{location(item)}</span></span>
                  <span>•</span>
                  <span>{item.correct_count}/35 benar</span>
                  <span>•</span>
                  <span>{duration(item.duration_ms)}</span>
                </div>
              </div>

              <div className="min-w-[74px] text-right">
                <div className={`text-2xl font-black leading-none ${top1?"text-amber-300":top2?"text-slate-100":top3?"text-orange-300":"text-cyan-200"}`}>{item.iq_estimate}</div>
                <div className="mt-1 max-w-[100px] text-[8px] font-black uppercase leading-tight text-slate-500">{iqLevelForRank(item.iq_estimate)}</div>
              </div>
            </div>
          })}
        </div>
      </div>}

      {!loading&&!error&&me&&!meVisible&&<div className="mt-4 rounded-2xl border border-cyan-300/25 bg-cyan-300/[.07] p-4">
        <div className="text-[9px] font-black uppercase tracking-[.14em] text-cyan-300">Posisi Anda</div>
        <div className="mt-2 flex items-end justify-between gap-3"><div><div className="text-3xl font-black text-white">#{me.rank}</div><div className="text-xs font-bold text-slate-400">dari {me.total} peserta · Top {me.percentile}%</div></div><div className="text-right"><div className="text-4xl font-black text-cyan-200">{me.iq_estimate}</div><div className="text-[9px] font-black uppercase text-slate-500">{iqLevelForRank(me.iq_estimate)}</div></div></div>
      </div>}
    </div>
  </section>
}
