"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowRight, CalendarDays, UserRoundPlus, Users } from "lucide-react"

const ADMIN_TOOLS_URL="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin-tools"
const TOKEN_KEY="battle_admin_token"

type Metrics={registrations_total?:number;registrations_today?:number;registrations_7d?:number}

export function AdminRegistrationGrowthSummary(){
  const [target,setTarget]=useState<HTMLElement|null>(null)
  const [metrics,setMetrics]=useState<Metrics>({})

  useEffect(()=>{
    if(!window.location.pathname.startsWith("/admin"))return
    let stopped=false
    const find=()=>{
      const headings=Array.from(document.querySelectorAll("h1,h2,h3")) as HTMLElement[]
      const h=headings.find(x=>(x.textContent||"").includes("Referral & Challenge Funnel"))
      const section=(h?.closest("section")||null) as HTMLElement|null
      if(!stopped)setTarget(section)
    }
    find()
    const observer=new MutationObserver(find)
    observer.observe(document.body,{subtree:true,childList:true})
    return()=>{stopped=true;observer.disconnect()}
  },[])

  useEffect(()=>{
    if(!target)return
    const token=window.localStorage.getItem(TOKEN_KEY)||""
    if(!token)return
    void (async()=>{
      try{
        const r=await fetch(ADMIN_TOOLS_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"growth_metrics",admin_token:token}),cache:"no-store"})
        const d=await r.json().catch(()=>({}))
        if(r.ok)setMetrics(d.metrics||{})
      }catch{}
    })()
  },[target])

  if(!target)return null

  return createPortal(
    <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[.045] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-300">Registrasi Peserta</p><h3 className="mt-1 text-lg font-black text-white">Pendaftar Baru</h3><p className="mt-1 text-xs text-slate-500">Akun QA/test tidak masuk hitungan.</p></div>
        <div className="grid flex-1 gap-2 sm:grid-cols-3 lg:max-w-2xl">
          <div className="rounded-xl border border-white/8 bg-slate-950/35 p-3"><UserRoundPlus className="h-4 w-4 text-emerald-300"/><p className="mt-2 text-[10px] text-slate-500">Hari ini</p><p className="text-2xl font-black text-emerald-200">{Number(metrics.registrations_today||0).toLocaleString("id-ID")}</p></div>
          <div className="rounded-xl border border-white/8 bg-slate-950/35 p-3"><CalendarDays className="h-4 w-4 text-violet-300"/><p className="mt-2 text-[10px] text-slate-500">7 hari</p><p className="text-2xl font-black text-violet-200">{Number(metrics.registrations_7d||0).toLocaleString("id-ID")}</p></div>
          <div className="rounded-xl border border-white/8 bg-slate-950/35 p-3"><Users className="h-4 w-4 text-cyan-300"/><p className="mt-2 text-[10px] text-slate-500">Total</p><p className="text-2xl font-black text-cyan-200">{Number(metrics.registrations_total||0).toLocaleString("id-ID")}</p></div>
        </div>
        <a href="/admin/pendaftar/" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-xs font-black text-emerald-100 transition hover:bg-emerald-300/15">Lihat urutan<ArrowRight className="h-4 w-4"/></a>
      </div>
    </div>,target
  )
}
