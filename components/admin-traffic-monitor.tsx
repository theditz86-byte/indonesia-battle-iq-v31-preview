"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, BarChart3, Globe2, Laptop, RefreshCw, Smartphone, Users } from "lucide-react"

const TRAFFIC_API="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-traffic"

type Daily={date:string;views:number;visitors:number}
type PageRow={path:string;views:number;visitors:number}
type RefRow={source:string;views:number}
type DeviceRow={device:string;views:number;visitors:number}
type TrafficMetrics={
  active_5m?:number
  views_today?:number
  visitors_today?:number
  views_7d?:number
  visitors_7d?:number
  visitors_30d?:number
  daily?:Daily[]
  top_pages?:PageRow[]
  referrers?:RefRow[]
  devices?:DeviceRow[]
}

function num(v:unknown){return Number(v||0).toLocaleString("id-ID")}
function dayLabel(date:string){return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID",{day:"2-digit",month:"short"})}
function fullDay(date:string){return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long"})}

export function AdminTrafficMonitor({token}:{token:string}){
  const [data,setData]=useState<TrafficMetrics>({})
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState("")
  const [hovered,setHovered]=useState<string|null>(null)

  async function load(){
    if(!token)return
    setBusy(true);setError("")
    try{
      const r=await fetch(TRAFFIC_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"admin_metrics",admin_token:token}),cache:"no-store"})
      const d=await r.json().catch(()=>({}))
      if(!r.ok)throw new Error(d?.error||"Traffic belum dapat dimuat.")
      setData(d.metrics||{})
    }catch(e){setError(e instanceof Error?e.message:"Traffic belum dapat dimuat.")}
    finally{setBusy(false)}
  }

  useEffect(()=>{void load();const id=window.setInterval(()=>void load(),60000);return()=>window.clearInterval(id)},[token])

  const daily=Array.isArray(data.daily)?data.daily:[]
  const maxMetric=Math.max(1,...daily.flatMap(x=>[Number(x.views||0),Number(x.visitors||0)]))
  const totalViews14=daily.reduce((sum,x)=>sum+Number(x.views||0),0)
  const totalVisitors14=daily.reduce((sum,x)=>sum+Number(x.visitors||0),0)
  const avgViews14=daily.length?Math.round(totalViews14/daily.length):0
  const avgVisitors14=daily.length?Math.round(totalVisitors14/daily.length):0
  const peakDay=daily.reduce<Daily|null>((best,x)=>!best||Number(x.views||0)>Number(best.views||0)?x:best,null)
  const hoveredDay=hovered?daily.find(x=>x.date===hovered)||null:null

  const cards=useMemo(()=>[
    ["Aktif ±5 menit",num(data.active_5m),Activity],
    ["Pengunjung hari ini",num(data.visitors_today),Users],
    ["Page views hari ini",num(data.views_today),BarChart3],
    ["Pengunjung 7 hari",num(data.visitors_7d),Globe2],
    ["Pengunjung 30 hari",num(data.visitors_30d),Users],
  ] as const,[data])

  return <section className="mb-6 rounded-3xl border border-sky-300/15 bg-sky-300/[.035] p-5 shadow-xl sm:p-6">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-black uppercase tracking-[.16em] text-sky-300">Traffic Monitor</p><h2 className="mt-1 text-2xl font-black">Pengunjung Situs</h2><p className="mt-1 text-sm text-slate-400">Analitik first-party anonim. IP dan identitas pribadi tidak disimpan.</p></div>
      <button onClick={()=>void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${busy?"animate-spin":""}`}/> Refresh</button>
    </div>

    {error&&<div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(([label,value,Icon])=><div key={label} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><Icon className="h-5 w-5 text-sky-300"/><p className="mt-3 text-xs text-slate-400">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>)}
    </div>

    <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="font-black">Tren 14 Hari</p><p className="text-xs text-slate-500">Perbandingan page views dan pengunjung unik per hari</p></div>
          <div className="flex flex-wrap gap-3 text-[11px] font-bold text-slate-400"><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-sky-400"/>Page Views</span><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-violet-400"/>Pengunjung Unik</span></div>
        </div>

        {daily.length===0?<div className="py-14 text-center text-sm text-slate-500">Data mulai terkumpul setelah tracker aktif.</div>:<>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-white/8 bg-white/[.025] px-3 py-2.5"><p className="text-[10px] uppercase tracking-wide text-slate-500">Total Views</p><p className="mt-1 text-lg font-black text-sky-200">{num(totalViews14)}</p></div>
            <div className="rounded-xl border border-white/8 bg-white/[.025] px-3 py-2.5"><p className="text-[10px] uppercase tracking-wide text-slate-500">Total Pengunjung</p><p className="mt-1 text-lg font-black text-violet-200">{num(totalVisitors14)}</p></div>
            <div className="rounded-xl border border-white/8 bg-white/[.025] px-3 py-2.5"><p className="text-[10px] uppercase tracking-wide text-slate-500">Rata-rata / Hari</p><p className="mt-1 text-sm font-black text-white">{num(avgViews14)} views · {num(avgVisitors14)} unik</p></div>
            <div className="rounded-xl border border-white/8 bg-white/[.025] px-3 py-2.5"><p className="text-[10px] uppercase tracking-wide text-slate-500">Hari Tertinggi</p><p className="mt-1 truncate text-sm font-black text-white">{peakDay?dayLabel(peakDay.date):"—"}</p><p className="text-[10px] text-slate-500">{peakDay?`${num(peakDay.views)} views`:"—"}</p></div>
          </div>

          <div className="relative mt-5 rounded-2xl border border-white/5 bg-black/15 px-3 pb-3 pt-5">
            <div className="pointer-events-none absolute inset-x-3 top-5 bottom-8 flex flex-col justify-between text-[9px] text-slate-600">
              {[100,75,50,25,0].map(p=><div key={p} className="flex items-center gap-2"><span className="w-7 text-right">{Math.round((maxMetric*p)/100)}</span><span className="h-px flex-1 bg-white/[.045]"/></div>)}
            </div>
            <div className="relative ml-9 flex h-52 items-end gap-1.5 overflow-x-auto pb-7 sm:gap-2">
              {daily.map(x=>{
                const views=Math.max(4,Math.round((Number(x.views||0)/maxMetric)*160))
                const visitors=Math.max(4,Math.round((Number(x.visitors||0)/maxMetric)*160))
                const active=hovered===x.date
                return <button key={x.date} type="button" onMouseEnter={()=>setHovered(x.date)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(x.date)} onBlur={()=>setHovered(null)} className="group relative flex min-w-[42px] flex-1 flex-col items-center justify-end outline-none">
                  {active&&<div className="absolute -top-16 z-20 whitespace-nowrap rounded-xl border border-white/10 bg-[#071225] px-3 py-2 text-left text-[10px] shadow-2xl"><p className="font-black text-white">{fullDay(x.date)}</p><p className="mt-1 text-sky-300">{num(x.views)} page views</p><p className="text-violet-300">{num(x.visitors)} pengunjung unik</p></div>}
                  <div className="flex h-40 w-full items-end justify-center gap-1">
                    <div className="w-[38%] rounded-t-md bg-sky-400/80 transition-all group-hover:bg-sky-300" style={{height:`${views}px`}}/>
                    <div className="w-[38%] rounded-t-md bg-violet-400/75 transition-all group-hover:bg-violet-300" style={{height:`${visitors}px`}}/>
                  </div>
                  <span className="absolute -bottom-5 text-[9px] text-slate-500 group-hover:text-slate-300">{dayLabel(x.date)}</span>
                </button>
              })}
            </div>
          </div>

          <div className="mt-3 min-h-9 rounded-xl border border-white/5 bg-white/[.02] px-3 py-2 text-xs text-slate-500">{hoveredDay?<><b className="text-white">{fullDay(hoveredDay.date)}</b> · <span className="text-sky-300">{num(hoveredDay.views)} views</span> · <span className="text-violet-300">{num(hoveredDay.visitors)} pengunjung unik</span></>:"Arahkan kursor ke batang grafik untuk melihat detail harian."}</div>
        </>}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
        <p className="font-black">Perangkat 7 Hari</p><div className="mt-3 space-y-2">{(data.devices||[]).length===0?<p className="text-sm text-slate-500">Belum ada data.</p>:(data.devices||[]).map(x=><div key={x.device} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[.03] px-3 py-2"><div className="flex items-center gap-2">{x.device==="mobile"?<Smartphone className="h-4 w-4 text-cyan-300"/>:<Laptop className="h-4 w-4 text-cyan-300"/>}<span className="text-sm font-bold capitalize">{x.device}</span></div><span className="text-sm text-slate-300">{num(x.visitors)} pengunjung</span></div>)}</div>
      </div>
    </div>

    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><p className="font-black">Halaman Terpopuler · 7 Hari</p><div className="mt-3 space-y-2">{(data.top_pages||[]).length===0?<p className="text-sm text-slate-500">Belum ada data.</p>:(data.top_pages||[]).map((x,i)=><div key={`${x.path}-${i}`} className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[.03] px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-bold text-white">{x.path}</p><p className="text-[11px] text-slate-500">{num(x.visitors)} pengunjung</p></div><span className="shrink-0 text-sm font-black text-sky-300">{num(x.views)} views</span></div>)}</div></div>
      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><p className="font-black">Sumber Trafik · 7 Hari</p><div className="mt-3 space-y-2">{(data.referrers||[]).length===0?<p className="text-sm text-slate-500">Belum ada data.</p>:(data.referrers||[]).map((x,i)=><div key={`${x.source}-${i}`} className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[.03] px-3 py-2"><span className="truncate text-sm font-bold">{x.source}</span><span className="shrink-0 text-sm text-slate-300">{num(x.views)} views</span></div>)}</div></div>
    </div>
  </section>
}
