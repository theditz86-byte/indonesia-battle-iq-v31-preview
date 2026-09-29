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

export function AdminTrafficMonitor({token}:{token:string}){
  const [data,setData]=useState<TrafficMetrics>({})
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState("")

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
  const maxViews=Math.max(1,...daily.map(x=>Number(x.views||0)))
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
      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
        <div className="mb-4 flex items-center justify-between"><div><p className="font-black">Tren 14 Hari</p><p className="text-xs text-slate-500">Page views dan pengunjung unik per hari</p></div><BarChart3 className="h-5 w-5 text-sky-300"/></div>
        {daily.length===0?<div className="py-12 text-center text-sm text-slate-500">Data mulai terkumpul setelah tracker aktif.</div>:<div className="flex h-44 items-end gap-2 overflow-x-auto pb-1">{daily.map(x=><div key={x.date} className="flex min-w-9 flex-1 flex-col items-center justify-end gap-1"><div title={`${x.views} views · ${x.visitors} pengunjung`} className="w-full rounded-t-md bg-sky-400/70" style={{height:`${Math.max(6,Math.round((Number(x.views||0)/maxViews)*120))}px`}}/><span className="text-[9px] text-slate-500">{new Date(`${x.date}T00:00:00`).toLocaleDateString("id-ID",{day:"2-digit",month:"short"})}</span></div>)}</div>}
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
