"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Clock3, Copy, Loader2, RefreshCw, Share2, Target, Trophy, XCircle } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { getParticipantToken } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"

const SKD_API="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-skd"

type HistoryItem={
  id:string
  twk_score:number
  tiu_score:number
  tkp_score:number
  total_score:number
  started_at?:string
  completed_at?:string
  breakdown?:Record<string,{total?:number;correct?:number;points?:number}>
}
type ReviewItem={
  id:string
  section:"twk"|"tiu"|"tkp"
  category:string
  subcategory?:string
  difficulty?:string
  prompt:string
  options:string[]
  selected_index?:number|null
  correct_index?:number|null
  selected_score?:number|null
  scores?:number[]
  explanation?:string
}
type Result={
  session_id:string
  twk_score:number
  tiu_score:number
  tkp_score:number
  total_score:number
  max_score:number
  completed_at?:string
  target_met?:boolean
  review?:ReviewItem[]
}

async function callSkd(action:string,payload:Record<string,unknown>={}){
  const token=getParticipantToken()
  if(!token)throw new Error("participant_required")
  const r=await fetch(SKD_API,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:JSON.stringify({action,payload}),cache:"no-store"})
  const d=await r.json().catch(()=>({}))
  if(!r.ok)throw new Error(d?.error||"Riwayat Mini SKD belum dapat dimuat.")
  return d
}
function dateText(v?:string){if(!v)return"—";const d=new Date(v);if(Number.isNaN(d.getTime()))return"—";return d.toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"})}
function sectionLabel(s:string){return s==="twk"?"TWK":s==="tiu"?"TIU":"TKP"}
function sectionClass(s:string){return s==="twk"?"border-emerald-300/20 bg-emerald-300/10 text-emerald-200":s==="tiu"?"border-cyan-300/20 bg-cyan-300/10 text-cyan-200":"border-violet-300/20 bg-violet-300/10 text-violet-200"}

export function SkdHistory(){
  const [participant,setParticipant]=useState<BattleParticipant|null>(null)
  const [history,setHistory]=useState<HistoryItem[]>([])
  const [loading,setLoading]=useState(true)
  const [detailLoading,setDetailLoading]=useState("")
  const [selected,setSelected]=useState<Result|null>(null)
  const [reviewOpen,setReviewOpen]=useState(false)
  const [error,setError]=useState("")
  const [message,setMessage]=useState("")

  async function load(){
    if(!getParticipantToken()){window.location.href=`/account?next=${encodeURIComponent("/riwayat-skd")}`;return}
    setLoading(true);setError("")
    try{const d=await callSkd("history");setParticipant((d?.participant||null) as BattleParticipant|null);setHistory(Array.isArray(d?.history)?d.history:[])}
    catch(e){setError(e instanceof Error?e.message:"Riwayat Mini SKD belum dapat dimuat.")}
    finally{setLoading(false)}
  }
  useEffect(()=>{void load()},[])

  const best=useMemo(()=>history.slice().sort((a,b)=>Number(b.total_score||0)-Number(a.total_score||0))[0]||null,[history])
  const latest=history[0]||null

  async function openDetail(id:string){
    if(selected?.session_id===id){setSelected(null);setReviewOpen(false);return}
    setDetailLoading(id);setError("");setMessage("")
    try{const d=await callSkd("result",{session_id:id});setSelected(d.result as Result);setReviewOpen(false);window.setTimeout(()=>document.getElementById("detail-skd")?.scrollIntoView({behavior:"smooth",block:"start"}),60)}
    catch(e){setError(e instanceof Error?e.message:"Detail hasil belum dapat dimuat.")}
    finally{setDetailLoading("")}
  }

  async function share(item:HistoryItem|Result){
    const nickname=participant?.nickname||"Peserta ALZAVA"
    const text=`Hasil Mini SKD ALZAVA Battle Point\n${nickname}\nSkor: ${Number(item.total_score||0)}/500\nTWK: ${Number(item.twk_score||0)}/75 · TIU: ${Number(item.tiu_score||0)}/85 · TKP: ${Number(item.tkp_score||0)}/115\n55 soal · 50 menit\n\nBerani kalahkan skorku?`
    const url=`${window.location.origin}/latihan-skd`
    try{
      if(navigator.share){await navigator.share({title:"Hasil Mini SKD ALZAVA Battle Point",text,url});setMessage("Hasil siap dibagikan.")}
      else{await navigator.clipboard.writeText(`${text}\n${url}`);setMessage("Hasil sudah disalin. Tinggal tempel ke WhatsApp atau media sosial.")}
    }catch(e){if(e instanceof DOMException&&e.name==="AbortError")return;try{await navigator.clipboard.writeText(`${text}\n${url}`);setMessage("Hasil sudah disalin. Tinggal tempel ke WhatsApp atau media sosial.")}catch{setError("Hasil belum dapat dibagikan dari browser ini.")}}
  }

  return <div className="min-h-screen bg-[radial-gradient(circle_at_15%_-10%,rgba(34,211,238,.15),transparent_34rem),radial-gradient(circle_at_90%_12%,rgba(124,58,237,.13),transparent_30rem),linear-gradient(180deg,#020617,#07142e_55%,#020617)] text-white">
    <SiteNavbar participant={participant}/>
    <main className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><a href="/latihan-skd" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4"/>Kembali ke Latihan SKD</a><p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-cyan-300">ALZAVA Learning Arena</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Riwayat Mini SKD</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Semua hasil Mini SKD tersimpan di sini. Buka detail untuk melihat pembahasan atau bagikan skor ke teman.</p></div>
        <button onClick={()=>void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading?"animate-spin":""}`}/>Refresh</button>
      </div>

      {message&&<div className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}
      {error&&<div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{error}</div>}

      <section className="mt-7 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total Latihan" value={String(history.length)} icon={<CalendarDays className="h-5 w-5 text-cyan-300"/>}/>
        <SummaryCard label="Skor Terbaik" value={best?`${best.total_score}/500`:"—"} icon={<Trophy className="h-5 w-5 text-amber-300"/>}/>
        <SummaryCard label="Terakhir" value={latest?dateText(latest.completed_at):"—"} icon={<Clock3 className="h-5 w-5 text-violet-300"/>}/>
      </section>

      <section className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-white/[.04] shadow-2xl">
        {loading?<div className="flex items-center justify-center gap-2 py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin"/>Memuat riwayat...</div>:history.length===0?<div className="py-16 text-center"><Target className="mx-auto h-9 w-9 text-slate-600"/><h2 className="mt-4 text-xl font-black">Belum ada hasil Mini SKD</h2><p className="mt-2 text-sm text-slate-500">Selesaikan Mini SKD pertama Anda, lalu hasilnya akan muncul di sini.</p><a href="/simulasi-skd" className="mt-5 inline-flex rounded-xl bg-cyan-600 px-5 py-3 text-sm font-black">Mulai Mini SKD</a></div>:<div className="divide-y divide-white/10">{history.map((item,i)=><article key={item.id} className="p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[.07] text-lg font-black text-cyan-200">#{history.length-i}</div><div><p className="text-xs font-black uppercase tracking-[.14em] text-slate-500">Mini SKD · 55 soal</p><h2 className="mt-1 text-2xl font-black">{item.total_score}<span className="text-sm text-slate-500">/500</span></h2><p className="mt-1 text-xs text-slate-500">{dateText(item.completed_at)}</p></div></div><div className="grid grid-cols-3 gap-2 sm:min-w-[330px]"><MiniScore label="TWK" value={`${item.twk_score}/75`}/><MiniScore label="TIU" value={`${item.tiu_score}/85`}/><MiniScore label="TKP" value={`${item.tkp_score}/115`}/></div><div className="flex flex-wrap gap-2 lg:justify-end"><button onClick={()=>void share(item)} className="inline-flex items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-300/10 px-4 py-2.5 text-xs font-black text-violet-100"><Share2 className="h-4 w-4"/>Bagikan</button><button onClick={()=>void openDetail(item.id)} disabled={detailLoading===item.id} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-60">{detailLoading===item.id?<Loader2 className="h-4 w-4 animate-spin"/>:selected?.session_id===item.id?<ChevronUp className="h-4 w-4"/>:<ChevronDown className="h-4 w-4"/>}{selected?.session_id===item.id?"Tutup Detail":"Lihat Hasil"}</button></div></div></article>)}</div>}
      </section>

      {selected&&<section id="detail-skd" className="mt-7 scroll-mt-6 rounded-[30px] border border-white/10 bg-white/[.045] p-5 shadow-2xl sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Detail Hasil Mini SKD</p><h2 className="mt-2 text-4xl font-black">{selected.total_score}<span className="text-lg text-slate-500">/500</span></h2><p className="mt-2 text-xs text-slate-500">{dateText(selected.completed_at)}</p></div><button onClick={()=>void share(selected)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-3 text-sm font-black"><Share2 className="h-4 w-4"/>Bagikan Hasil</button></div><div className="mt-5 grid gap-3 sm:grid-cols-4"><ScoreCard label="TWK" value={selected.twk_score} max={75}/><ScoreCard label="TIU" value={selected.tiu_score} max={85}/><ScoreCard label="TKP" value={selected.tkp_score} max={115}/><ScoreCard label="Total" value={selected.total_score} max={500}/></div><button onClick={()=>setReviewOpen(v=>!v)} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black">{reviewOpen?<ChevronUp className="h-4 w-4"/>:<ChevronDown className="h-4 w-4"/>}{reviewOpen?"Tutup Pembahasan":"Lihat Jawaban & Pembahasan"}</button>{reviewOpen&&<div className="mt-5 grid gap-4">{(selected.review||[]).map((q,i)=>{const chosen=q.selected_index;const objective=q.section!=="tkp";const ok=objective&&chosen!==null&&chosen!==undefined&&chosen===q.correct_index;return <article key={`${q.id}-${i}`} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${sectionClass(q.section)}`}>{sectionLabel(q.section)}</span><span className="text-xs text-slate-500">Soal {i+1} · {q.category}</span>{objective?(ok?<CheckCircle2 className="h-4 w-4 text-emerald-300"/>:<XCircle className="h-4 w-4 text-rose-300"/>):<span className="text-xs font-black text-violet-300">Skor: {q.selected_score??0}/5</span>}</div><p className="mt-3 text-sm font-bold leading-6">{q.prompt}</p><div className="mt-3 grid gap-2">{q.options.map((o,n)=><div key={n} className={`rounded-xl border px-3 py-2 text-xs leading-5 ${n===chosen?"border-cyan-300/30 bg-cyan-300/[.08]":"border-white/5 bg-white/[.02]"}`}><b className="mr-2">{String.fromCharCode(65+n)}.</b>{o}{objective&&n===q.correct_index&&<span className="ml-2 font-black text-emerald-300">✓ kunci</span>}{q.section==="tkp"&&Array.isArray(q.scores)&&<span className="ml-2 font-black text-violet-300">({q.scores[n]})</span>}</div>)}</div>{q.explanation&&<p className="mt-3 rounded-xl bg-black/20 p-3 text-xs leading-5 text-slate-400"><b className="text-slate-300">Pembahasan:</b> {q.explanation}</p>}</article>})}</div>}</section>}
    </main>
    <SiteFooter/>
  </div>
}
function SummaryCard({label,value,icon}:{label:string;value:string;icon:React.ReactNode}){return <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">{icon}<p className="mt-3 text-xs font-black uppercase tracking-[.13em] text-slate-500">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>}
function MiniScore({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-center"><p className="text-[10px] font-black text-slate-500">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>}
function ScoreCard({label,value,max}:{label:string;value:number;max:number}){return <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><p className="text-xs font-black uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}<span className="text-sm text-slate-500">/{max}</span></p></div>}
