"use client"

import { FormEvent, useEffect, useState } from "react"
import { CalendarDays, Loader2, RefreshCw, Search, UserRoundPlus, Users } from "lucide-react"

const ADMIN_TOOLS_URL="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin-tools"
const TOKEN_KEY="battle_admin_token"

type Registrant={
  registration_no:number
  public_id:string
  nickname?:string
  username?:string
  avatar_url?:string|null
  province_name?:string|null
  regency_name?:string|null
  district_name?:string|null
  status?:string
  created_at?:string
}

type Summary={total?:number;today?:number;last_7d?:number}

function when(value?:string){
  if(!value)return"—"
  return new Date(value).toLocaleString("id-ID",{timeZone:"Asia/Jakarta",day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})
}

export default function AdminRegistrationsPage(){
  const [token,setToken]=useState("")
  const [query,setQuery]=useState("")
  const [search,setSearch]=useState("")
  const [rows,setRows]=useState<Registrant[]>([])
  const [summary,setSummary]=useState<Summary>({})
  const [busy,setBusy]=useState(true)
  const [error,setError]=useState("")

  useEffect(()=>{
    const t=window.localStorage.getItem(TOKEN_KEY)||""
    if(!t){window.location.assign("/admin/");return}
    setToken(t)
  },[])

  async function load(value=search){
    if(!token)return
    setBusy(true);setError("")
    try{
      const r=await fetch(ADMIN_TOOLS_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"registration_list",admin_token:token,search:value,limit:200,offset:0}),cache:"no-store"})
      const d=await r.json().catch(()=>({}))
      if(!r.ok)throw new Error(d?.error||"Data pendaftar belum dapat dimuat.")
      setRows(Array.isArray(d.registrants)?d.registrants:[])
      setSummary(d.summary||{})
    }catch(e){
      const msg=e instanceof Error?e.message:"Data pendaftar belum dapat dimuat."
      setError(msg)
      if(/sesi admin/i.test(msg)){window.localStorage.removeItem(TOKEN_KEY);window.location.assign("/admin/")}
    }finally{setBusy(false)}
  }

  useEffect(()=>{if(token)void load("")},[token])

  function submit(e:FormEvent){e.preventDefault();const q=query.trim();setSearch(q);void load(q)}

  return <main className="min-h-screen bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,.12),transparent_30rem),linear-gradient(180deg,#020817,#07142f)] px-4 py-8 text-white sm:px-6">
    <div className="mx-auto max-w-7xl">
      <section className="rounded-[30px] border border-cyan-300/15 bg-white/[.045] p-5 shadow-2xl sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Registrasi Peserta</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Urutan Pendaftar</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Nomor registrasi mengikuti urutan akun dibuat. Akun QA/test tidak dihitung agar statistik mencerminkan pendaftar nyata.</p>
          </div>
          <button onClick={()=>void load()} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${busy?"animate-spin":""}`}/>Muat ulang</button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><Users className="h-5 w-5 text-cyan-300"/><p className="mt-3 text-xs text-slate-500">Total pendaftar</p><p className="mt-1 text-3xl font-black">{Number(summary.total||0).toLocaleString("id-ID")}</p></div>
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.05] p-4"><UserRoundPlus className="h-5 w-5 text-emerald-300"/><p className="mt-3 text-xs text-slate-500">Pendaftar hari ini</p><p className="mt-1 text-3xl font-black text-emerald-200">{Number(summary.today||0).toLocaleString("id-ID")}</p></div>
          <div className="rounded-2xl border border-violet-300/15 bg-violet-300/[.05] p-4"><CalendarDays className="h-5 w-5 text-violet-300"/><p className="mt-3 text-xs text-slate-500">Pendaftar 7 hari</p><p className="mt-1 text-3xl font-black text-violet-200">{Number(summary.last_7d||0).toLocaleString("id-ID")}</p></div>
        </div>
      </section>

      <section className="mt-5 rounded-[28px] border border-white/10 bg-white/[.035] p-4 sm:p-5">
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari nickname, username, kabupaten, atau kecamatan..." className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-11 pr-4 text-sm outline-none focus:border-cyan-300/40"/></div>
          <button className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950">Cari</button>
          {search&&<button type="button" onClick={()=>{setQuery("");setSearch("");void load("")}} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300">Reset</button>}
        </form>

        {error&&<div className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          <div className="hidden grid-cols-[90px_1.2fr_1fr_1.4fr_170px_100px] gap-3 border-b border-white/10 bg-white/[.045] px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 lg:grid">
            <span>No.</span><span>Peserta</span><span>Username</span><span>Wilayah</span><span>Waktu Daftar</span><span>Status</span>
          </div>
          {busy&&rows.length===0?<div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin"/>Memuat urutan pendaftar...</div>:rows.length===0?<div className="py-16 text-center text-sm text-slate-500">Tidak ada pendaftar pada pencarian ini.</div>:<div className="divide-y divide-white/7">{rows.map(row=><article key={row.public_id} className="grid gap-3 px-4 py-4 transition hover:bg-white/[.025] lg:grid-cols-[90px_1.2fr_1fr_1.4fr_170px_100px] lg:items-center">
            <div><span className="inline-flex rounded-xl border border-cyan-300/15 bg-cyan-300/10 px-3 py-2 text-sm font-black text-cyan-200">#{Number(row.registration_no||0).toLocaleString("id-ID")}</span></div>
            <div className="min-w-0"><p className="truncate font-black text-white">{row.nickname||"Peserta"}</p><p className="mt-1 text-[11px] text-slate-500">ID publik · {String(row.public_id||"").slice(0,8)}</p></div>
            <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-300">@{row.username||"—"}</p></div>
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-300">{row.district_name||"—"}</p><p className="truncate text-[11px] text-slate-500">{[row.regency_name,row.province_name].filter(Boolean).join(" · ")||"—"}</p></div>
            <div><p className="text-xs font-semibold text-slate-300">{when(row.created_at)}</p></div>
            <div><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${row.status==="active"?"border border-emerald-300/15 bg-emerald-300/10 text-emerald-300":"border border-white/10 bg-white/5 text-slate-400"}`}>{row.status||"—"}</span></div>
          </article>)}</div>}
        </div>
        {rows.length>=200&&<p className="mt-3 text-center text-xs text-slate-500">Menampilkan 200 pendaftar terbaru. Gunakan pencarian untuk menemukan akun tertentu.</p>}
      </section>
    </div>
  </main>
}
