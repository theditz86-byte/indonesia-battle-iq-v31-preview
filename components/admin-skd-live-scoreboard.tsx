"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Activity, Clock3, Loader2, RefreshCw, Signal, SignalZero, Trophy } from "lucide-react"

const ADMIN_TOOLS_URL="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin-tools"

type LiveStatus="active"|"disconnected"|"time_up"|"completed"
type LiveRow={
  session_id:string
  public_id:string
  nickname?:string|null
  username?:string|null
  avatar_url?:string|null
  district_name?:string|null
  regency_name?:string|null
  is_online?:boolean
  status?:LiveStatus
  current_question?:number
  answered_count?:number
  question_count?:number
  twk_score?:number
  tiu_score?:number
  tkp_score?:number
  total_score?:number
  seconds_left?:number
  started_at?:string|null
  completed_at?:string|null
  updated_at?:string|null
}
type LiveSummary={live?:number;disconnected?:number;completed_recent?:number;total?:number}

type Props={token:string}

async function callLive(token:string){
  const response=await fetch(ADMIN_TOOLS_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"skd_live",admin_token:token}),cache:"no-store"})
  const data=await response.json().catch(()=>({}))
  if(!response.ok)throw new Error(data?.error||"Live Mini SKD belum dapat dimuat.")
  return data
}

function initials(name?:string|null){return (name||"BP").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join("")||"BP"}
function clock(seconds?:number){const n=Math.max(0,Number(seconds||0));const m=Math.floor(n/60);const s=n%60;return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
function statusLabel(status?:LiveStatus){if(status==="active")return"Mengerjakan";if(status==="disconnected")return"Terputus";if(status==="time_up")return"Waktu Habis";return"Selesai"}
function statusClass(status?:LiveStatus){if(status==="active")return"border-emerald-300/20 bg-emerald-300/10 text-emerald-200";if(status==="disconnected")return"border-amber-300/20 bg-amber-300/10 text-amber-200";if(status==="time_up")return"border-rose-300/20 bg-rose-300/10 text-rose-200";return"border-cyan-300/20 bg-cyan-300/10 text-cyan-200"}

export function AdminSkdLiveScoreboard({token}:Props){
  const [rows,setRows]=useState<LiveRow[]>([])
  const [summary,setSummary]=useState<LiveSummary>({})
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")
  const [lastSync,setLastSync]=useState<Date|null>(null)

  const load=useCallback(async(silent=false)=>{
    if(!token)return
    if(!silent)setLoading(true)
    try{
      const data=await callLive(token)
      setRows(Array.isArray(data?.participants)?data.participants:[])
      setSummary(data?.summary||{})
      setLastSync(new Date())
      setError("")
    }catch(e){setError(e instanceof Error?e.message:"Live Mini SKD belum dapat dimuat.")}
    finally{if(!silent)setLoading(false)}
  },[token])

  useEffect(()=>{void load(false)},[load])
  useEffect(()=>{
    const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void load(true)},3000)
    return()=>window.clearInterval(timer)
  },[load])

  const ordered=useMemo(()=>rows.map((row,index)=>({...row,position:index+1})),[rows])

  return <section className="mt-5 overflow-hidden rounded-2xl border border-cyan-300/15 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,.09),transparent_28rem),rgba(2,8,23,.55)]">
    <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/20 bg-rose-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.16em] text-rose-200"><span className="h-2 w-2 animate-pulse rounded-full bg-rose-400"/>Live</span><p className="text-xs font-black uppercase tracking-[.16em] text-cyan-300">Mini SKD Scoreboard</p></div>
        <h3 className="mt-2 text-xl font-black text-white">Pantau progres & skor sementara peserta</h3>
        <p className="mt-1 text-xs text-slate-400">Diperbarui otomatis setiap ±3 detik dari autosave jawaban. Skor selama tes bersifat sementara.</p>
      </div>
      <div className="flex items-center gap-2">
        {lastSync&&<span className="hidden text-[10px] text-slate-500 sm:inline">Sinkron {lastSync.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>}
        <button onClick={()=>void load(false)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-slate-200 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading?"animate-spin":""}`}/>Refresh</button>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-px border-b border-white/10 bg-white/10">
      <div className="bg-[#061225] px-4 py-3 text-center"><p className="text-[10px] uppercase tracking-wider text-slate-500">Mengerjakan</p><p className="mt-1 text-xl font-black text-emerald-300">{Number(summary.live||0)}</p></div>
      <div className="bg-[#061225] px-4 py-3 text-center"><p className="text-[10px] uppercase tracking-wider text-slate-500">Terputus</p><p className="mt-1 text-xl font-black text-amber-300">{Number(summary.disconnected||0)}</p></div>
      <div className="bg-[#061225] px-4 py-3 text-center"><p className="text-[10px] uppercase tracking-wider text-slate-500">Selesai 10m</p><p className="mt-1 text-xl font-black text-cyan-300">{Number(summary.completed_recent||0)}</p></div>
    </div>

    {error&&<div className="m-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

    {loading&&rows.length===0?<div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin"/>Memuat live score...</div>:ordered.length===0?<div className="px-4 py-10 text-center"><Activity className="mx-auto h-6 w-6 text-slate-600"/><p className="mt-3 text-sm font-bold text-slate-400">Belum ada Mini SKD yang sedang berlangsung.</p><p className="mt-1 text-xs text-slate-600">Peserta akan muncul otomatis setelah memulai Mini SKD.</p></div>:<>
      <div className="hidden grid-cols-[52px_minmax(180px,1.4fr)_110px_125px_repeat(3,76px)_110px_90px] gap-3 border-b border-white/10 px-4 py-2 text-[9px] font-black uppercase tracking-wider text-slate-500 xl:grid">
        <span className="text-center">Pos</span><span>Peserta</span><span>Status</span><span>Progres</span><span className="text-center">TWK</span><span className="text-center">TIU</span><span className="text-center">TKP</span><span className="text-center">Skor</span><span className="text-center">Waktu</span>
      </div>
      <div className="divide-y divide-white/10">{ordered.map(row=><article key={row.session_id} className="px-4 py-4 transition-colors hover:bg-white/[.025]">
        <div className="grid gap-3 xl:grid-cols-[52px_minmax(180px,1.4fr)_110px_125px_repeat(3,76px)_110px_90px] xl:items-center">
          <div className="hidden text-center xl:block"><span className={`inline-grid h-8 w-8 place-items-center rounded-full text-xs font-black ${row.position<=3?"bg-amber-300/15 text-amber-200":"bg-white/5 text-slate-400"}`}>{row.position}</span></div>
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">{row.avatar_url?<img src={row.avatar_url} alt={row.nickname||"Peserta"} className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"/>:<div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-[10px] font-black">{initials(row.nickname)}</div>}{row.is_online?<Signal className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#061225] p-0.5 text-emerald-300"/>:<SignalZero className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#061225] p-0.5 text-amber-300"/>}</div>
            <div className="min-w-0"><p className="truncate text-sm font-black text-white"><span className="mr-2 text-slate-500 xl:hidden">#{row.position}</span>{row.nickname||"Peserta"}</p><p className="mt-0.5 truncate text-[10px] text-slate-500">@{row.username||"belum-set"} · {[row.district_name,row.regency_name].filter(Boolean).join(" · ")||"Wilayah belum lengkap"}</p></div>
          </div>

          <div><span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${statusClass(row.status)}`}>{statusLabel(row.status)}</span></div>

          <div>
            <div className="flex items-center justify-between text-[10px]"><span className="font-black text-white">Soal {Number(row.current_question||1)}/{Number(row.question_count||55)}</span><span className="text-slate-500">{Number(row.answered_count||0)} terjawab</span></div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{width:`${Math.min(100,Math.max(0,Number(row.answered_count||0)/Math.max(1,Number(row.question_count||55))*100))}%`}}/></div>
          </div>

          <div className="grid grid-cols-3 gap-2 xl:contents"><div className="rounded-lg bg-cyan-300/5 px-2 py-2 text-center xl:bg-transparent xl:p-0"><p className="text-[9px] text-slate-500 xl:hidden">TWK</p><p className="font-black text-cyan-200">{Number(row.twk_score||0)}<span className="text-[9px] text-slate-600">/75</span></p></div><div className="rounded-lg bg-violet-300/5 px-2 py-2 text-center xl:bg-transparent xl:p-0"><p className="text-[9px] text-slate-500 xl:hidden">TIU</p><p className="font-black text-violet-200">{Number(row.tiu_score||0)}<span className="text-[9px] text-slate-600">/125</span></p></div><div className="rounded-lg bg-emerald-300/5 px-2 py-2 text-center xl:bg-transparent xl:p-0"><p className="text-[9px] text-slate-500 xl:hidden">TKP</p><p className="font-black text-emerald-200">{Number(row.tkp_score||0)}<span className="text-[9px] text-slate-600">/75</span></p></div></div>

          <div className="flex items-center justify-between rounded-xl border border-amber-300/15 bg-amber-300/[.06] px-3 py-2 xl:block xl:text-center"><span className="text-[10px] font-bold text-slate-500 xl:hidden">Skor sementara</span><p className="text-lg font-black text-amber-200">{Number(row.total_score||0)}<span className="text-[10px] text-slate-500">/500</span></p></div>

          <div className="flex items-center justify-between xl:block xl:text-center"><span className="text-[10px] text-slate-500 xl:hidden">Sisa waktu</span><span className={`inline-flex items-center gap-1 text-xs font-black ${Number(row.seconds_left||0)<=300&&row.status!=="completed"?"text-rose-300":"text-slate-300"}`}><Clock3 className="h-3.5 w-3.5"/>{row.status==="completed"?"Selesai":clock(row.seconds_left)}</span></div>
        </div>
      </article>)}</div>
    </>}

    <div className="flex items-start gap-2 border-t border-white/10 px-4 py-3 text-[10px] leading-4 text-slate-500"><Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300"/><p>Urutan live mengikuti skor sementara untuk peserta aktif. Nilai dapat berubah sampai jawaban final dikirim. Peserta yang baru selesai tetap tampil ±10 menit agar admin dapat melihat hasil akhir.</p></div>
  </section>
}
