"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { CheckCircle2, Loader2, ShieldCheck, Wrench } from "lucide-react"

const ADMIN_TOOLS_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin-tools"
const TOKEN_KEY = "battle_admin_token"

type Status = {
  maintenance_mode?: boolean
  updated_at?: string | null
  note?: string | null
}

async function adminTools(body:Record<string,unknown>){
  const response=await fetch(ADMIN_TOOLS_URL,{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify(body),
  })
  const data=await response.json().catch(()=>({}))
  if(!response.ok) throw new Error(data?.error||"Kontrol maintenance belum dapat diproses.")
  return data
}

export function AdminMaintenanceControl(){
  const pathname=usePathname()
  const [token,setToken]=useState("")
  const [status,setStatus]=useState<Status>({})
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState("")
  const isAdmin=pathname?.startsWith("/admin")

  useEffect(()=>{
    if(!isAdmin) return
    const read=()=>{
      try{setToken(window.localStorage.getItem(TOKEN_KEY)||"")}catch{}
    }
    read()
    const timer=window.setInterval(read,1200)
    window.addEventListener("focus",read)
    return()=>{window.clearInterval(timer);window.removeEventListener("focus",read)}
  },[isAdmin])

  const load=useCallback(async()=>{
    if(!token) return
    try{
      const data=await adminTools({action:"maintenance_status",admin_token:token})
      setStatus(data.status||{})
      setError("")
    }catch(e){setError(e instanceof Error?e.message:"Status maintenance tidak dapat dimuat.")}
  },[token])

  useEffect(()=>{if(token) void load()},[token,load])

  async function setMaintenance(enabled:boolean){
    const label=enabled?"memulai maintenance":"mengakhiri maintenance dan membuka situs untuk peserta"
    if(!window.confirm(`Yakin ingin ${label}?`)) return
    setBusy(true);setError("")
    try{
      const data=await adminTools({
        action:"maintenance_set",
        admin_token:token,
        enabled,
        note:enabled?"Maintenance dimulai dari Dashboard Admin.":"Maintenance selesai dari Dashboard Admin.",
      })
      setStatus(data.status||{maintenance_mode:enabled})
      try{window.sessionStorage.setItem("alzava_maintenance_mode",enabled?"1":"0")}catch{}
    }catch(e){setError(e instanceof Error?e.message:"Maintenance belum dapat diubah.")}
    finally{setBusy(false)}
  }

  if(!isAdmin||!token) return null
  const enabled=Boolean(status.maintenance_mode)

  return(
    <aside className="fixed bottom-4 right-4 z-[950] w-[min(92vw,360px)] rounded-2xl border border-white/10 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-xl ${enabled?"bg-amber-400/15 text-amber-300":"bg-emerald-400/15 text-emerald-300"}`}>
            {enabled?<Wrench className="h-5 w-5"/>:<ShieldCheck className="h-5 w-5"/>}
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Status Situs</p>
            <p className={`text-sm font-black ${enabled?"text-amber-200":"text-emerald-200"}`}>{enabled?"MAINTENANCE AKTIF":"SITUS AKTIF"}</p>
          </div>
        </div>
        <button onClick={()=>void load()} disabled={busy} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 disabled:opacity-50">Cek</button>
      </div>

      {error&&<p className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</p>}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={()=>void setMaintenance(true)}
          disabled={busy||enabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2.5 text-xs font-black text-amber-200 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Wrench className="h-4 w-4"/>} Mulai Maintenance
        </button>
        <button
          onClick={()=>void setMaintenance(false)}
          disabled={busy||!enabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          {busy?<Loader2 className="h-4 w-4 animate-spin"/>:<CheckCircle2 className="h-4 w-4"/>} Selesai Maintenance
        </button>
      </div>

      <p className="mt-3 text-[10px] leading-4 text-slate-500">Perubahan tersimpan di backend dan berlaku ke halaman peserta tanpa deploy ulang.</p>
    </aside>
  )
}
