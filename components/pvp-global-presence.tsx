"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BellRing, Swords, X } from "lucide-react"
import { getParticipantToken } from "@/lib/battle"

const SITE_API="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-pvp-site"
const PVP_API="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-pvp"

type Player={public_id?:string;nickname?:string;avatar_url?:string|null;regency_name?:string;province_name?:string}
type Challenge={id?:string;created_at?:string;expires_at?:string;player?:Player}
type SiteState={incoming_challenge?:Challenge|null;active_match?:{id?:string;status?:string}|null}

function initials(name?:string){return (name||"BP").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join("")||"BP"}

async function siteStatus(token:string){
  const r=await fetch(SITE_API,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:"{}",cache:"no-store"})
  const d=await r.json().catch(()=>({}))
  if(!r.ok)throw new Error(d?.error||"Status online belum dapat diperbarui.")
  return d as SiteState
}

async function pvpAction(token:string,body:Record<string,unknown>){
  const r=await fetch(PVP_API,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:JSON.stringify(body),cache:"no-store"})
  const d=await r.json().catch(()=>({}))
  if(!r.ok)throw new Error(d?.error||"Tantangan belum dapat diproses.")
  return d
}

export function PvpGlobalPresence(){
  const [incoming,setIncoming]=useState<Challenge|null>(null)
  const [activeMatch,setActiveMatch]=useState<{id?:string;status?:string}|null>(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState("")
  const lastInvite=useRef("")

  const poll=useCallback(async()=>{
    if(typeof window==="undefined")return
    const path=window.location.pathname
    if(path.startsWith("/admin")||path.startsWith("/pvp"))return
    const token=getParticipantToken()
    if(!token){setIncoming(null);setActiveMatch(null);return}
    try{
      const data=await siteStatus(token)
      setActiveMatch(data.active_match||null)
      const next=data.incoming_challenge||null
      setIncoming(next)
      if(next?.id&&next.id!==lastInvite.current){
        lastInvite.current=next.id
        try{
          if("Notification" in window&&Notification.permission==="granted"){
            new Notification("Tantangan Battle PVP",{body:`${next.player?.nickname||"Seorang pemain"} menantangmu Battle PVP 1v1.`})
          }
        }catch{}
      }
      setError("")
    }catch{}
  },[])

  useEffect(()=>{
    void poll()
    const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void poll()},8000)
    const onVisible=()=>{if(document.visibilityState==="visible")void poll()}
    document.addEventListener("visibilitychange",onVisible)
    return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",onVisible)}
  },[poll])

  async function respond(accept:boolean){
    if(!incoming?.id||busy)return
    const token=getParticipantToken();if(!token)return
    setBusy(true);setError("")
    try{
      await pvpAction(token,{action:accept?"accept":"decline",challenge_id:incoming.id})
      setIncoming(null)
      if(accept)window.location.assign("/pvp/")
      else void poll()
    }catch(e){setError(e instanceof Error?e.message:"Tantangan belum dapat diproses.")}
    finally{setBusy(false)}
  }

  if(typeof window!=="undefined"&&(window.location.pathname.startsWith("/admin")||window.location.pathname.startsWith("/pvp")))return null

  const player=incoming?.player
  return <>
    {incoming?.id&&<div className="fixed inset-x-3 top-20 z-[160] mx-auto max-w-lg overflow-hidden rounded-3xl border border-cyan-300/25 bg-[#07152d]/95 text-white shadow-[0_28px_90px_rgba(0,0,0,.62)] backdrop-blur-xl sm:right-5 sm:left-auto sm:top-24 sm:w-[430px]">
      <div className="bg-gradient-to-r from-cyan-500/18 via-blue-500/12 to-violet-500/18 p-5">
        <button onClick={()=>setIncoming(null)} aria-label="Tutup" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"><X className="h-4 w-4"/></button>
        <div className="flex items-center gap-3 pr-8">
          {player?.avatar_url?<img src={player.avatar_url} alt={player.nickname||"Pemain"} className="h-14 w-14 rounded-full object-cover ring-2 ring-cyan-300/50"/>:<div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-sm font-black ring-2 ring-cyan-300/40">{initials(player?.nickname)}</div>}
          <div className="min-w-0"><div className="flex items-center gap-2 text-cyan-300"><BellRing className="h-4 w-4"/><p className="text-[11px] font-black uppercase tracking-[.16em]">Tantangan PVP Masuk</p></div><p className="mt-1 truncate text-lg font-black">{player?.nickname||"Seorang pemain"} menantangmu!</p><p className="mt-1 text-xs text-slate-400">10 menit · soal tak terbatas · benar +50 · salah −25</p></div>
        </div>
        {error&&<p className="mt-3 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">{error}</p>}
        <div className="mt-4 grid grid-cols-2 gap-3"><button disabled={busy} onClick={()=>void respond(false)} className="rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-sm font-black text-slate-200 disabled:opacity-50">Tolak</button><button disabled={busy} onClick={()=>void respond(true)} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-3 text-sm font-black shadow-[0_0_28px_rgba(34,211,238,.24)] disabled:opacity-50"><Swords className="h-4 w-4"/>{busy?"Memproses…":"Terima & Masuk Arena"}</button></div>
      </div>
    </div>}

    {!incoming&&activeMatch?.id&&<div className="fixed bottom-5 right-5 z-[150] max-w-sm rounded-2xl border border-violet-300/25 bg-[#09152d]/95 p-4 text-white shadow-[0_20px_65px_rgba(0,0,0,.5)] backdrop-blur-xl"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/20 text-violet-200"><Swords className="h-5 w-5"/></div><div className="min-w-0 flex-1"><p className="text-sm font-black">Arena PVP sudah siap</p><p className="mt-0.5 text-xs text-slate-400">Pertandingan aktif menunggumu.</p></div><a href="/pvp/" className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-black">Masuk</a></div></div>}
  </>
}
