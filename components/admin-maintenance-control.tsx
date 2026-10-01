"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, Clock3, Loader2, RefreshCw, ShieldCheck, Wrench } from "lucide-react"

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
    cache:"no-store",
  })
  const data=await response.json().catch(()=>({}))
  if(!response.ok) throw new Error(data?.error||"Kontrol maintenance belum dapat diproses.")
  return data
}

function dateTime(value?:string|null){
  if(!value)return"Belum ada perubahan tercatat"
  const date=new Date(value)
  if(Number.isNaN(date.getTime()))return"—"
  return date.toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"medium"})
}

export function AdminMaintenanceControl(){
  const [token,setToken]=useState<string|null>(null)
  const [status,setStatus]=useState<Status>({})
  const [busy,setBusy]=useState(false)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")
  const [message,setMessage]=useState("")

  useEffect(()=>{
    try{setToken(window.localStorage.getItem(TOKEN_KEY)||"")}catch{setToken("")}
  },[])

  const load=useCallback(async()=>{
    if(!token)return
    setLoading(true)
    try{
      const data=await adminTools({action:"maintenance_status",admin_token:token})
      setStatus(data.status||{})
      setError("")
    }catch(e){setError(e instanceof Error?e.message:"Status maintenance tidak dapat dimuat.")}
    finally{setLoading(false)}
  },[token])

  useEffect(()=>{if(token)void load();else if(token!==null)setLoading(false)},[token,load])

  async function setMaintenance(enabled:boolean){
    const label=enabled?"memulai maintenance dan membatasi akses peserta":"mengakhiri maintenance dan membuka kembali situs untuk peserta"
    if(!window.confirm(`Yakin ingin ${label}?`))return
    setBusy(true);setError("");setMessage("")
    try{
      const data=await adminTools({
        action:"maintenance_set",
        admin_token:token,
        enabled,
        note:enabled?"Maintenance dimulai dari Admin Control Center.":"Maintenance selesai dari Admin Control Center.",
      })
      setStatus(data.status||{maintenance_mode:enabled,updated_at:new Date().toISOString()})
      setMessage(enabled?"Maintenance aktif. Halaman peserta kini mengikuti mode maintenance.":"Maintenance selesai. Situs peserta kembali aktif.")
      try{window.sessionStorage.setItem("alzava_maintenance_mode",enabled?"1":"0")}catch{}
    }catch(e){setError(e instanceof Error?e.message:"Maintenance belum dapat diubah.")}
    finally{setBusy(false)}
  }

  const enabled=Boolean(status.maintenance_mode)
  const statusTone=enabled?"amber":"emerald"
  const statusLabel=enabled?"MAINTENANCE AKTIF":"SITUS AKTIF"
  const summary=useMemo(()=>enabled?"Akses peserta sedang dibatasi sesuai kebijakan maintenance aktif.":"Layanan peserta berjalan normal dan dapat digunakan.",[enabled])

  if(token===null)return <section className="grid min-h-[360px] place-items-center rounded-3xl border border-white/10 bg-white/[.035]"><div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin"/>Memuat sesi admin...</div></section>

  if(!token)return <section className="mx-auto max-w-xl rounded-3xl border border-rose-300/15 bg-rose-400/[.05] p-8 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-rose-200"/><h2 className="mt-4 text-2xl font-black text-white">Sesi Admin Diperlukan</h2><p className="mt-2 text-sm text-slate-400">Login kembali untuk mengubah status maintenance situs.</p><a href="/admin/" className="mt-5 inline-flex rounded-xl bg-cyan-600 px-5 py-3 text-sm font-black text-white">Ke Login Admin</a></section>

  return <div className="grid gap-5">
    <section className={`overflow-hidden rounded-3xl border ${enabled?"border-amber-300/20":"border-emerald-300/20"} bg-white/[.045] shadow-2xl`}>
      <div className={`h-1.5 w-full ${enabled?"bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400":"bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400"}`}/>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${enabled?"bg-amber-400/15 text-amber-300":"bg-emerald-400/15 text-emerald-300"}`}>
              {enabled?<Wrench className="h-7 w-7"/>:<ShieldCheck className="h-7 w-7"/>}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Status Situs Produksi</p>
              <div className="mt-1 flex flex-wrap items-center gap-3"><h2 className={`text-3xl font-black ${enabled?"text-amber-200":"text-emerald-200"}`}>{statusLabel}</h2><span className={`h-2.5 w-2.5 rounded-full ${enabled?"animate-pulse bg-amber-400":"bg-emerald-400"}`}/></div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{summary}</p>
            </div>
          </div>
          <button onClick={()=>void load()} disabled={busy||loading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-slate-200 transition hover:border-cyan-300/25 hover:text-white disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading?"animate-spin":""}`}/>Cek Status</button>
        </div>

        {error&&<div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
        {message&&<div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><Clock3 className="h-4 w-4"/>Perubahan Terakhir</div><p className="mt-2 text-sm font-bold text-slate-200">{dateTime(status.updated_at)}</p></div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><AlertTriangle className="h-4 w-4"/>Catatan Backend</div><p className="mt-2 text-sm font-bold text-slate-200">{status.note||"Tidak ada catatan maintenance."}</p></div>
        </div>
      </div>
    </section>

    <section className="rounded-3xl border border-white/10 bg-white/[.035] p-6 sm:p-8">
      <div><p className="text-xs font-black uppercase tracking-[.16em] text-cyan-300">Kontrol Maintenance</p><h3 className="mt-1 text-xl font-black text-white">Ubah status situs</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Perubahan tersimpan langsung di backend dan berlaku ke halaman peserta tanpa deploy ulang. Gunakan maintenance saat ada perubahan penting atau pengujian yang tidak boleh diakses peserta.</p></div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <button onClick={()=>void setMaintenance(true)} disabled={busy||enabled} className="group rounded-2xl border border-amber-300/20 bg-amber-300/[.07] p-5 text-left transition hover:border-amber-300/40 hover:bg-amber-300/[.1] disabled:cursor-not-allowed disabled:opacity-35"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-300/10 text-amber-300">{busy?<Loader2 className="h-5 w-5 animate-spin"/>:<Wrench className="h-5 w-5"/>}</span><div><p className="font-black text-amber-100">Mulai Maintenance</p><p className="mt-1 text-xs leading-5 text-slate-500">Batasi akses peserta sementara sistem dikerjakan.</p></div></div></button>
        <button onClick={()=>void setMaintenance(false)} disabled={busy||!enabled} className="group rounded-2xl border border-emerald-300/20 bg-emerald-300/[.07] p-5 text-left transition hover:border-emerald-300/40 hover:bg-emerald-300/[.1] disabled:cursor-not-allowed disabled:opacity-35"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300">{busy?<Loader2 className="h-5 w-5 animate-spin"/>:<CheckCircle2 className="h-5 w-5"/>}</span><div><p className="font-black text-emerald-100">Selesai Maintenance</p><p className="mt-1 text-xs leading-5 text-slate-500">Buka kembali situs untuk seluruh peserta.</p></div></div></button>
      </div>
    </section>
  </div>
}
