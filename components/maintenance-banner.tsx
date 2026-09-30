"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ShieldCheck, Wrench } from "lucide-react"

const STATUS_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-public?system=1"
const CACHE_KEY = "alzava_maintenance_mode"

export function MaintenanceBanner(){
  const pathname = usePathname()
  const [maintenance,setMaintenance]=useState(false)

  useEffect(()=>{
    if(pathname?.startsWith("/admin")) return

    try { setMaintenance(window.sessionStorage.getItem(CACHE_KEY)==="1") } catch {}

    let cancelled=false
    const refresh=async()=>{
      if(document.visibilityState!=="visible") return
      try{
        const response=await fetch(`${STATUS_URL}&t=${Date.now()}`,{cache:"no-store"})
        const data=await response.json().catch(()=>({}))
        if(!response.ok) return
        const enabled=Boolean(data?.status?.maintenance_mode)
        if(cancelled) return
        setMaintenance(enabled)
        try { window.sessionStorage.setItem(CACHE_KEY,enabled?"1":"0") } catch {}
      }catch{}
    }

    void refresh()
    const timer=window.setInterval(refresh,10000)
    window.addEventListener("focus",refresh)
    document.addEventListener("visibilitychange",refresh)
    return()=>{
      cancelled=true
      window.clearInterval(timer)
      window.removeEventListener("focus",refresh)
      document.removeEventListener("visibilitychange",refresh)
    }
  },[pathname])

  if(pathname?.startsWith("/admin")||!maintenance) return null

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,.13),transparent_28rem),linear-gradient(180deg,#020817,#07142f)] px-5 text-white">
      <div className="w-full max-w-xl rounded-[2rem] border border-cyan-300/15 bg-white/[.055] p-7 text-center shadow-[0_35px_120px_rgba(0,0,0,.65)] backdrop-blur-xl sm:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-300">
          <Wrench className="h-8 w-8" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[.22em] text-cyan-300">ALZAVA Battle Point</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Sedang Maintenance</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base">Kami sedang melakukan pemeliharaan sistem agar pengalaman Battle tetap stabil dan nyaman.</p>
        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/15 bg-emerald-300/[.07] px-4 py-3 text-xs font-bold text-emerald-200 sm:text-sm">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Data akun, hasil, Battle Point, dan peringkat tetap tersimpan aman.
        </div>
        <p className="mt-5 text-xs text-slate-500">Silakan kembali setelah maintenance selesai.</p>
      </div>
    </div>
  )
}
