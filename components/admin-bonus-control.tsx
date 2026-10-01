"use client"

import { useEffect, useState } from "react"
import { Minus, Plus, Settings2, X } from "lucide-react"

const ADMIN_TOOLS_URL="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin-tools"

type Props={
  token:string
  participant:{public_id:string;nickname?:string;bonus_available?:number;bonus_used?:number}
  onChanged:(message:string)=>void|Promise<void>
}

async function callTools(body:Record<string,unknown>){
  const response=await fetch(ADMIN_TOOLS_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),cache:"no-store"})
  const data=await response.json().catch(()=>({}))
  if(!response.ok)throw new Error(data?.error||"Perubahan bonus belum dapat diproses.")
  return data
}

export function AdminBonusControl({token,participant,onChanged}:Props){
  const [open,setOpen]=useState(false)
  const [mode,setMode]=useState<"grant"|"revoke">("grant")
  const [count,setCount]=useState(1)
  const [reason,setReason]=useState("")
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState("")
  const available=Math.max(0,Number(participant.bonus_available||0))
  const maxCount=mode==="grant"?20:Math.max(1,Math.min(20,available))

  useEffect(()=>{
    if(!open)return
    setMode("grant")
    setCount(1)
    setReason("")
    setError("")
  },[open,participant.public_id])

  useEffect(()=>{setCount(v=>Math.min(Math.max(1,v),maxCount))},[maxCount])

  async function submit(){
    const safeCount=Math.min(Math.max(1,Math.trunc(Number(count)||1)),maxCount)
    if(reason.trim().length<3){setError("Alasan minimal 3 karakter.");return}
    if(mode==="revoke"&&available<safeCount){setError("Bonus tersedia tidak mencukupi.");return}
    setBusy(true);setError("")
    try{
      await callTools({
        action:mode==="grant"?"ranked_bonus_grant":"ranked_bonus_revoke",
        admin_token:token,
        participant_public_id:participant.public_id,
        count:safeCount,
        reason:reason.trim(),
      })
      setOpen(false)
      await onChanged(mode==="grant"?`+${safeCount} bonus Ranked diberikan kepada ${participant.nickname||"peserta"}.`:`${safeCount} bonus Ranked yang belum dipakai dicabut dari ${participant.nickname||"peserta"}.`)
    }catch(e){setError(e instanceof Error?e.message:"Perubahan bonus belum dapat diproses.")}
    finally{setBusy(false)}
  }

  return <>
    <button onClick={()=>setOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3.5 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/15">
      <Settings2 className="h-3.5 w-3.5"/>Atur Bonus
    </button>

    {open&&<div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setOpen(false)}}>
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#071225] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">Ranked Bonus Control</p><h3 className="mt-1 text-xl font-black text-white">{participant.nickname||"Peserta"}</h3><p className="mt-1 text-xs text-slate-400">Tersedia <b className="text-cyan-200">{available}</b> bonus · Terpakai <b className="text-white">{Number(participant.bonus_used||0)}</b></p></div>
          <button disabled={busy} onClick={()=>setOpen(false)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white disabled:opacity-40"><X className="h-4 w-4"/></button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-950/45 p-1.5">
          <button onClick={()=>setMode("grant")} className={`rounded-xl px-3 py-2.5 text-xs font-black ${mode==="grant"?"bg-emerald-400 text-slate-950":"text-slate-400"}`}><Plus className="mr-1 inline h-3.5 w-3.5"/>Tambah</button>
          <button disabled={available===0} onClick={()=>setMode("revoke")} className={`rounded-xl px-3 py-2.5 text-xs font-black disabled:opacity-30 ${mode==="revoke"?"bg-rose-400 text-slate-950":"text-slate-400"}`}><Minus className="mr-1 inline h-3.5 w-3.5"/>Cabut</button>
        </div>

        <div className="mt-4">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Jumlah attempt</label>
          <div className="mt-2 flex items-center gap-2">
            <button disabled={busy||count<=1} onClick={()=>setCount(v=>Math.max(1,v-1))} className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-white disabled:opacity-30"><Minus className="h-4 w-4"/></button>
            <input type="number" min={1} max={maxCount} value={count} onChange={e=>setCount(Math.min(maxCount,Math.max(1,Number(e.target.value)||1)))} className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-center text-lg font-black text-white outline-none focus:border-cyan-300/40"/>
            <button disabled={busy||count>=maxCount} onClick={()=>setCount(v=>Math.min(maxCount,v+1))} className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-white disabled:opacity-30"><Plus className="h-4 w-4"/></button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">{[1,2,3,5,10,20].filter(n=>n<=maxCount).map(n=><button key={n} onClick={()=>setCount(n)} className={`rounded-lg px-2.5 py-1 text-[10px] font-black ${count===n?"bg-cyan-300 text-slate-950":"border border-white/10 bg-white/5 text-slate-400"}`}>{n}</button>)}</div>
        </div>

        <label className="mt-4 block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Alasan</span><textarea value={reason} onChange={e=>setReason(e.target.value.slice(0,240))} placeholder={mode==="grant"?"Contoh: kompensasi gangguan teknis":"Contoh: koreksi bonus yang salah diberikan"} rows={3} className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"/></label>

        {error&&<div className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{error}</div>}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button disabled={busy} onClick={()=>setOpen(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-black text-slate-300 disabled:opacity-40">Batal</button>
          <button disabled={busy||(mode==="revoke"&&available===0)} onClick={()=>void submit()} className={`rounded-xl px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-40 ${mode==="grant"?"bg-emerald-400":"bg-rose-400"}`}>{busy?"Memproses...":mode==="grant"?`Tambah +${count}`:`Cabut ${count}`}</button>
        </div>
      </section>
    </div>}
  </>
}
