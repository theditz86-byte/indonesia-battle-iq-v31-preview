"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { BrainCircuit, Loader2, RefreshCw, Search, Swords, Trophy, Users, Wifi } from "lucide-react"
import { AdminBonusControl } from "@/components/admin-bonus-control"

const ADMIN_TOOLS_URL="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin-tools"

type Activity="online"|"ranked"|"pvp"|"training"|"offline"
type ParticipantRow={
  public_id:string
  nickname?:string
  username?:string|null
  email?:string|null
  avatar_url?:string|null
  province_name?:string|null
  regency_name?:string|null
  district_name?:string|null
  created_at?:string
  online?:boolean
  activity?:Activity
  activity_detail?:string|null
  page_path?:string|null
  last_seen?:string|null
  attempts_used?:number
  bonus_available?:number
  bonus_used?:number
  battle_score?:number|null
  national_rank?:number|null
}
type Summary={total?:number;online?:number;ranked?:number;pvp?:number;training?:number;offline?:number}
type Props={token:string}

async function callTools(body:Record<string,unknown>){
  const response=await fetch(ADMIN_TOOLS_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),cache:"no-store"})
  const data=await response.json().catch(()=>({}))
  if(!response.ok)throw new Error(data?.error||"Data peserta belum dapat dimuat.")
  return data
}

function initials(name?:string){return (name||"BP").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join("")||"BP"}
function activityLabel(value?:Activity){if(value==="ranked")return"Sedang Ranked";if(value==="pvp")return"Sedang Battle PvP";if(value==="training")return"Sedang Latihan Soal";if(value==="online")return"Online di situs";return"Offline"}
function activityTextClass(value?:Activity){if(value==="ranked")return"text-cyan-300";if(value==="pvp")return"text-violet-300";if(value==="training")return"text-emerald-300";if(value==="online")return"text-sky-300";return"text-slate-500"}
function lastSeenText(value?:string|null){if(!value)return"Belum terdeteksi";const d=new Date(value);if(Number.isNaN(d.getTime()))return"—";return d.toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"})}

export function AdminParticipantMonitor({token}:Props){
  const [rows,setRows]=useState<ParticipantRow[]>([])
  const [summary,setSummary]=useState<Summary>({})
  const [filter,setFilter]=useState<"all"|Activity>("all")
  const [search,setSearch]=useState("")
  const [query,setQuery]=useState("")
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")
  const [message,setMessage]=useState("")

  useEffect(()=>{const t=window.setTimeout(()=>setQuery(search.trim()),250);return()=>window.clearTimeout(t)},[search])

  const load=useCallback(async(silent=false)=>{
    if(!token)return
    if(!silent)setLoading(true)
    try{
      const data=await callTools({action:"participant_activity",admin_token:token,search:query,filter})
      setRows(Array.isArray(data?.participants)?data.participants:[])
      setSummary(data?.summary||{})
      setError("")
    }catch(e){setError(e instanceof Error?e.message:"Data peserta belum dapat dimuat.")}
    finally{if(!silent)setLoading(false)}
  },[token,query,filter])

  useEffect(()=>{void load(false)},[load])
  useEffect(()=>{
    const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void load(true)},15000)
    return()=>window.clearInterval(timer)
  },[load])

  const cards=useMemo(()=>[
    ["Total Peserta",Number(summary.total||0),Users,"text-slate-200"],
    ["Online",Number(summary.online||0),Wifi,"text-sky-300"],
    ["Ranked",Number(summary.ranked||0),Trophy,"text-cyan-300"],
    ["Battle PVP",Number(summary.pvp||0),Swords,"text-violet-300"],
    ["Latihan",Number(summary.training||0),BrainCircuit,"text-emerald-300"],
  ] as const,[summary])

  return <section className="mb-6 rounded-3xl border border-cyan-300/15 bg-white/[.045] p-5 shadow-xl sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-[.16em] text-cyan-300">Peserta & Aktivitas</p><h2 className="mt-1 text-2xl font-black">Monitor Peserta</h2><p className="mt-1 text-sm text-slate-400">Online dihitung dari heartbeat situs. Peserta yang sedang Ranked, Battle PvP, atau Latihan tetap termasuk Online dan aktivitasnya ditampilkan terpisah.</p></div>
      <button onClick={()=>void load(false)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading?"animate-spin":""}`}/>Refresh</button>
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([label,value,Icon,color])=><div key={label} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><Icon className={`h-5 w-5 ${color}`}/><p className="mt-3 text-xs text-slate-400">{label}</p><p className="mt-1 text-2xl font-black">{value.toLocaleString("id-ID")}</p></div>)}</div>

    <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <label className="relative block w-full max-w-md"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nickname, username, atau email..." className="w-full rounded-xl border border-white/10 bg-slate-950/55 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cyan-300/40"/></label>
      <div className="flex flex-wrap gap-2">{[["all","Semua"],["online","Online"],["ranked","Ranked"],["pvp","PVP"],["training","Latihan"],["offline","Offline"]].map(([value,label])=><button key={value} onClick={()=>setFilter(value as "all"|Activity)} className={`rounded-full px-3.5 py-2 text-xs font-black ${filter===value?"bg-cyan-300 text-slate-950":"border border-white/10 bg-white/5 text-slate-300"}`}>{label}</button>)}</div>
    </div>

    {error&&<div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
    {message&&<div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}

    <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
      {loading&&rows.length===0?<div className="flex items-center justify-center gap-2 py-12 text-slate-400"><Loader2 className="h-5 w-5 animate-spin"/>Memuat peserta...</div>:rows.length===0?<div className="py-12 text-center text-sm text-slate-500">Tidak ada peserta pada filter ini.</div>:<div className="divide-y divide-white/10">{rows.map(row=>{
        const detail=row.activity_detail||activityLabel(row.activity)
        return <article key={row.public_id} className="bg-slate-950/30 p-4 transition-colors hover:bg-white/[.035] sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,.9fr)_minmax(0,.9fr)_auto] xl:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative shrink-0">{row.avatar_url?<img src={row.avatar_url} alt={row.nickname||"Peserta"} className="h-11 w-11 rounded-full object-cover ring-1 ring-white/15"/>:<div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-xs font-black">{initials(row.nickname)}</div>}<span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#07142f] ${row.online?"bg-emerald-400":"bg-slate-600"}`}/></div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><a href={`/player/?id=${encodeURIComponent(row.public_id)}`} className="truncate font-black text-white hover:text-cyan-300 hover:underline">{row.nickname||"Peserta"}</a><span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${row.online?"border-emerald-300/20 bg-emerald-300/10 text-emerald-200":"border-white/10 bg-white/5 text-slate-500"}`}>{row.online?"Online":"Offline"}</span></div>
                <p className={`mt-1 text-xs font-bold ${activityTextClass(row.activity)}`}>{detail}</p>
                <p className="mt-1 truncate text-xs text-slate-500">@{row.username||"belum-set"} · {[row.district_name,row.regency_name].filter(Boolean).join(" · ")||"Wilayah belum lengkap"}</p>
                <p className="mt-1 text-[10px] text-slate-600">Terakhir aktif: {lastSeenText(row.last_seen)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white/[.04] px-2 py-2"><p className="text-[10px] text-slate-500">Attempt</p><p className="font-black">{Number(row.attempts_used||0)}</p></div><div className="rounded-xl bg-white/[.04] px-2 py-2"><p className="text-[10px] text-slate-500">Bonus sisa</p><p className="font-black text-cyan-300">{Number(row.bonus_available||0)}</p></div><div className="rounded-xl bg-white/[.04] px-2 py-2"><p className="text-[10px] text-slate-500">Bonus terpakai</p><p className="font-black">{Number(row.bonus_used||0)}</p></div></div>

            <div className="grid grid-cols-2 gap-2 text-center"><div className="rounded-xl bg-white/[.04] px-3 py-2"><p className="text-[10px] text-slate-500">Battle Point</p><p className="font-black">{row.battle_score==null?"—":Number(row.battle_score).toLocaleString("id-ID")}</p></div><div className="rounded-xl bg-white/[.04] px-3 py-2"><p className="text-[10px] text-slate-500">Rank Nasional</p><p className="font-black">{row.national_rank==null?"—":`#${row.national_rank}`}</p></div></div>

            <div className="xl:justify-self-end"><AdminBonusControl token={token} participant={row} onChanged={async text=>{setMessage(text);setError("");await load(true)}}/></div>
          </div>
        </article>
      })}</div>}
    </div>
    <p className="mt-3 text-[11px] leading-5 text-slate-500">Tab Online selalu menampilkan semua peserta dengan heartbeat aktif, termasuk yang sedang Ranked, Battle PvP, atau Latihan. Bonus Ranked tidak mengurangi atau menimpa 3 attempt resmi. Gunakan “Atur Bonus” untuk menambah atau mencabut bonus yang belum digunakan.</p>
  </section>
}
