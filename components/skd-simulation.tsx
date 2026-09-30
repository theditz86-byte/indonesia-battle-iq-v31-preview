"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Loader2, RotateCcw, ShieldCheck, Target, Trophy, XCircle } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"

const SKD_API="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-skd"

type Question={id:string;section:"twk"|"tiu"|"tkp";category:string;subcategory?:string;difficulty?:string;prompt:string;options:string[]}
type Session={id:string;started_at?:string;deadline_at:string;question_count:number;questions:Question[];progress_answers?:Array<number|null>;progress_index?:number}
type Review=Question&{selected_index?:number|null;correct_index?:number|null;selected_score?:number|null;answer?:number;scores?:number[];explanation?:string;source_title?:string;source_ref?:string}
type Result={session_id?:string;twk_score:number;tiu_score:number;tkp_score:number;total_score:number;max_score:number;targets?:{twk:number;tiu:number;tkp:number};target_met?:boolean;breakdown?:Record<string,{total?:number;correct?:number;points?:number}>;review?:Review[];completed_at?:string}

async function callSkd(action:string,payload:Record<string,unknown>={}){
  const token=getParticipantToken(); if(!token) throw new Error("participant_required")
  const r=await fetch(SKD_API,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:JSON.stringify({action,payload}),cache:"no-store"})
  const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d?.error||"Mini SKD belum dapat diproses."); return d
}
function timeText(ms:number){const s=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}
function sectionLabel(s:string){return s==="twk"?"TWK":s==="tiu"?"TIU":"TKP"}
function sectionClass(s:string){return s==="twk"?"text-emerald-200 border-emerald-300/20 bg-emerald-300/10":s==="tiu"?"text-cyan-200 border-cyan-300/20 bg-cyan-300/10":"text-violet-200 border-violet-300/20 bg-violet-300/10"}

export function SkdSimulation(){
  const [participant,setParticipant]=useState<BattleParticipant|null>(null)
  const [session,setSession]=useState<Session|null>(null)
  const [answers,setAnswers]=useState<Array<number|null>>([])
  const [index,setIndex]=useState(0)
  const [result,setResult]=useState<Result|null>(null)
  const [history,setHistory]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState("")
  const [now,setNow]=useState(Date.now())
  const answersRef=useRef<Array<number|null>>([]); const indexRef=useRef(0); const autosubmit=useRef(false); const saveTimer=useRef<number|null>(null)

  useEffect(()=>{answersRef.current=answers},[answers]); useEffect(()=>{indexRef.current=index},[index])
  useEffect(()=>{
    const token=getParticipantToken(); if(!token){setLoading(false);return}
    Promise.all([
      fetch(BATTLE_API_URL,{headers:{"X-Battle-Token":token},cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null),
      callSkd("active").catch(()=>null),callSkd("history").catch(()=>null)
    ]).then(([ov,a,h])=>{
      setParticipant((ov?.participant||a?.participant||h?.participant||null) as BattleParticipant|null)
      setHistory(Array.isArray(h?.history)?h.history:[])
      if(a?.session){const s=a.session as Session;setSession(s);const pa=Array.isArray(s.progress_answers)&&s.progress_answers.length===55?s.progress_answers:Array(55).fill(null);setAnswers(pa);setIndex(Number.isInteger(s.progress_index)&&Number(s.progress_index)>=0&&Number(s.progress_index)<55?Number(s.progress_index):0)}
    }).finally(()=>setLoading(false))
  },[])
  useEffect(()=>{if(!session)return;const t=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(t)},[session?.id])
  const remaining=session?Math.max(0,new Date(session.deadline_at).getTime()-now):0
  const answered=answers.filter(x=>x!==null).length; const unanswered=answers.length-answered; const current=session?.questions[index]
  useEffect(()=>{if(!session||result||busy||remaining>0||autosubmit.current)return;autosubmit.current=true;void submit(true)},[remaining,session?.id,result,busy])

  useEffect(()=>{
    if(!session||answers.length!==55)return
    if(saveTimer.current)window.clearTimeout(saveTimer.current)
    saveTimer.current=window.setTimeout(()=>{void callSkd("progress",{session_id:session.id,answers,current_index:index}).catch(()=>{})},650)
    return()=>{if(saveTimer.current)window.clearTimeout(saveTimer.current)}
  },[session?.id,answers,index])
  useEffect(()=>{
    if(!session)return
    const heartbeat=window.setInterval(()=>void callSkd("progress",{session_id:session.id,answers:answersRef.current,current_index:indexRef.current}).catch(()=>{}),15000)
    const hide=()=>{void callSkd("progress",{session_id:session.id,answers:answersRef.current,current_index:indexRef.current}).catch(()=>{})}
    window.addEventListener("pagehide",hide);return()=>{window.clearInterval(heartbeat);window.removeEventListener("pagehide",hide)}
  },[session?.id])

  async function start(){
    if(!getParticipantToken()){window.location.href=`/account?next=${encodeURIComponent("/simulasi-skd")}`;return}
    setBusy(true);setError("");setResult(null)
    try{const d=await callSkd("start");const s=d.session as Session;setSession(s);setAnswers(Array.isArray(s.progress_answers)&&s.progress_answers.length===55?s.progress_answers:Array(55).fill(null));setIndex(Number(s.progress_index||0));setNow(Date.now());autosubmit.current=false;window.scrollTo({top:0,behavior:"smooth"})}
    catch(e){setError(e instanceof Error?e.message:"Mini SKD belum dapat dimulai.")}finally{setBusy(false)}
  }
  function choose(i:number){if(!session||busy||result)return;setAnswers(a=>a.map((v,n)=>n===index?i:v))}
  async function submit(force=false){
    if(!session||busy||result)return
    if(!force&&unanswered>0&&!window.confirm(`Masih ada ${unanswered} soal belum dijawab. Tetap kirim?`))return
    setBusy(true);setError("")
    try{const d=await callSkd("submit",{session_id:session.id,answers});setResult(d.result as Result);setSession(null);const h=await callSkd("history").catch(()=>null);if(Array.isArray(h?.history))setHistory(h.history);window.scrollTo({top:0,behavior:"smooth"})}
    catch(e){setError(e instanceof Error?e.message:"Hasil Mini SKD belum dapat disimpan.");autosubmit.current=false}finally{setBusy(false)}
  }

  const best=useMemo(()=>history.slice().sort((a,b)=>Number(b.total_score||0)-Number(a.total_score||0))[0]||null,[history])
  if(loading)return <main className="grid min-h-screen place-items-center bg-[#020817] text-white"><div className="text-center"><Loader2 className="mx-auto h-9 w-9 animate-spin text-cyan-300"/><p className="mt-3 text-sm font-bold text-slate-400">Menyiapkan Mini SKD…</p></div></main>

  return <div className="min-h-screen bg-[radial-gradient(circle_at_15%_-10%,rgba(34,211,238,.15),transparent_34rem),radial-gradient(circle_at_90%_12%,rgba(124,58,237,.13),transparent_30rem),linear-gradient(180deg,#020617,#07142e_55%,#020617)] text-white">
    {!session&&<SiteNavbar participant={participant}/>}<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {!getParticipantToken()?<Intro onStart={start} busy={busy} best={best}/>:result?<ResultView result={result} onRetry={()=>{setResult(null);void start()}}/>:session&&current?<section>
        <div className="mb-5 flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/[.045] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">Mini SKD · 55 Soal · 50 Menit</p><div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-xl font-black">Soal {index+1} dari 55</h1><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${sectionClass(current.section)}`}>{sectionLabel(current.section)}</span><span className="text-xs font-bold text-slate-500">{current.category}</span></div></div><div className="flex items-center gap-2"><span className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs font-bold text-slate-300">{answered}/55</span><span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-sm font-black ${remaining<180000?"border-rose-300/25 bg-rose-300/10 text-rose-200":"border-cyan-300/15 bg-cyan-300/[.06] text-cyan-100"}`}><Clock3 className="h-4 w-4"/>{timeText(remaining)}</span></div></div>
        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all" style={{width:`${Math.round(answered/55*100)}%`}}/></div>
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]"><article className="rounded-[28px] border border-white/10 bg-white/[.045] p-5 shadow-2xl sm:p-8"><div className="flex items-center justify-between gap-3"><span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] ${sectionClass(current.section)}`}>{sectionLabel(current.section)} · {current.subcategory||current.category}</span><span className="text-[10px] font-bold uppercase text-slate-500">{current.difficulty||"menengah"}</span></div><h2 className="mt-5 text-lg font-bold leading-8 sm:text-xl">{current.prompt}</h2><div className="mt-7 grid gap-3">{current.options.map((o,i)=><button key={i} onClick={()=>choose(i)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${answers[index]===i?"border-cyan-300/45 bg-cyan-300/10":"border-white/10 bg-slate-950/30 hover:border-white/20 hover:bg-white/[.05]"}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black ${answers[index]===i?"bg-cyan-300 text-slate-950":"bg-white/5 text-slate-400"}`}>{String.fromCharCode(65+i)}</span><span className="text-sm leading-6 text-slate-200">{o}</span></button>)}</div><div className="mt-7 flex items-center justify-between gap-3"><button disabled={index===0} onClick={()=>setIndex(i=>Math.max(0,i-1))} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold disabled:opacity-30"><ChevronLeft className="h-4 w-4"/>Sebelumnya</button>{index<54?<button onClick={()=>setIndex(i=>Math.min(54,i+1))} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950">Berikutnya<ChevronRight className="h-4 w-4"/></button>:<button disabled={busy} onClick={()=>void submit(false)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-sm font-black text-slate-950 disabled:opacity-50">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<CheckCircle2 className="h-4 w-4"/>}Kirim Jawaban</button>}</div></article>
          <aside className="h-fit rounded-[24px] border border-white/10 bg-white/[.04] p-4"><div className="flex items-center justify-between"><h3 className="font-black">Navigasi Soal</h3><span className="text-xs text-slate-500">{unanswered} kosong</span></div><div className="mt-4 grid grid-cols-5 gap-2">{session.questions.map((q,i)=><button key={q.id} onClick={()=>setIndex(i)} title={`${sectionLabel(q.section)} · ${q.category}`} className={`h-9 rounded-lg border text-xs font-black ${i===index?"border-white bg-white text-slate-950":answers[i]!==null?"border-cyan-300/20 bg-cyan-300/10 text-cyan-100":"border-white/10 bg-white/[.025] text-slate-500"}`}>{i+1}</button>)}</div><div className="mt-5 grid gap-2 text-xs text-slate-400"><p><b className="text-emerald-300">1–15</b> TWK</p><p><b className="text-cyan-300">16–32</b> TIU</p><p><b className="text-violet-300">33–55</b> TKP</p></div><button disabled={busy} onClick={()=>void submit(false)} className="mt-5 w-full rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-100 disabled:opacity-50">Selesaikan Mini SKD</button></aside></div>
        {error&&<div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
      </section>:<Intro onStart={start} busy={busy} best={best}/>}</main>{!session&&<SiteFooter/>}
  </div>
}

function Intro({onStart,busy,best}:{onStart:()=>void;busy:boolean;best:any}){return <><a href="/latihan-skd" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4"/>Kembali ke Latihan SKD</a><section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,.11),rgba(7,20,46,.88)_48%,rgba(124,58,237,.13))] p-7 shadow-2xl sm:p-10"><p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">Simulasi Mini SKD</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">55 soal. 50 menit.<br/><span className="text-violet-300">TWK + TIU + TKP.</span></h1><p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">Format latihan setengah paket SKD: 15 TWK, 17 TIU, dan 23 TKP. Hasil disimpan per bagian agar Anda tahu area yang masih perlu diperkuat.</p><div className="mt-7 grid gap-3 sm:grid-cols-4"><Mini label="TWK" value="15 soal · 75"/><Mini label="TIU" value="17 soal · 85"/><Mini label="TKP" value="23 soal · 115"/><Mini label="Maksimum" value="275 poin"/></div><button disabled={busy} onClick={onStart} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 px-6 py-3.5 font-black disabled:opacity-50">{busy?<Loader2 className="h-5 w-5 animate-spin"/>:<Target className="h-5 w-5"/>}{busy?"Menyiapkan paket…":"Mulai Mini SKD"}</button>{best&&<p className="mt-4 text-xs text-slate-500">Skor terbaik tersimpan: <b className="text-slate-300">{best.total_score}/275</b></p>}</section></>}
function Mini({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4"><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{label}</p><p className="mt-1 font-black text-white">{value}</p></div>}

function ResultView({result,onRetry}:{result:Result;onRetry:()=>void}){
  const [reviewOpen,setReviewOpen]=useState(false);const targets=result.targets||{twk:35,tiu:40,tkp:85};const review=Array.isArray(result.review)?result.review:[]
  return <section><div className={`rounded-[32px] border p-7 text-center sm:p-10 ${result.target_met?"border-emerald-300/20 bg-emerald-300/[.06]":"border-amber-300/20 bg-amber-300/[.055]"}`}><div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${result.target_met?"bg-emerald-300/10 text-emerald-300":"bg-amber-300/10 text-amber-300"}`}>{result.target_met?<Trophy className="h-8 w-8"/>:<Target className="h-8 w-8"/>}</div><p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-cyan-300">Hasil Mini SKD</p><h1 className="mt-2 text-5xl font-black">{result.total_score}<span className="text-xl text-slate-500">/275</span></h1><p className={`mt-3 font-black ${result.target_met?"text-emerald-300":"text-amber-300"}`}>{result.target_met?"Target Simulasi Terpenuhi":"Target Simulasi Belum Terpenuhi"}</p><p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-slate-500">Target ini adalah patokan latihan ALZAVA, bukan nilai ambang batas resmi seleksi.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-4"><Score label="TWK" score={result.twk_score} max={75} target={targets.twk}/><Score label="TIU" score={result.tiu_score} max={85} target={targets.tiu}/><Score label="TKP" score={result.tkp_score} max={115} target={targets.tkp}/><Score label="Total" score={result.total_score} max={275}/></div><div className="mt-6 flex flex-wrap gap-3"><button onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950"><RotateCcw className="h-4 w-4"/>Coba Paket Baru</button><button onClick={()=>setReviewOpen(v=>!v)} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black">{reviewOpen?"Tutup Review":"Lihat Review Soal"}</button><a href="/latihan-skd" className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black">Kembali ke Latihan SKD</a></div>{reviewOpen&&<div className="mt-7 grid gap-4">{review.map((q,i)=>{const chosen=q.selected_index;const isObj=q.section!=="tkp";const ok=isObj&&chosen!==null&&chosen!==undefined&&chosen===q.correct_index;return <article key={`${q.id}-${i}`} className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${sectionClass(q.section)}`}>{sectionLabel(q.section)}</span><span className="text-xs text-slate-500">Soal {i+1} · {q.category}</span>{isObj?(ok?<CheckCircle2 className="h-4 w-4 text-emerald-300"/>:<XCircle className="h-4 w-4 text-rose-300"/>):<span className="text-xs font-black text-violet-300">Skor pilihan: {q.selected_score??0}/5</span>}</div><p className="mt-3 text-sm font-bold leading-6">{q.prompt}</p><div className="mt-3 grid gap-2">{q.options.map((o,n)=><div key={n} className={`rounded-xl border px-3 py-2 text-xs leading-5 ${n===chosen?"border-cyan-300/30 bg-cyan-300/[.08]":"border-white/5 bg-slate-950/20"}`}><b className="mr-2">{String.fromCharCode(65+n)}.</b>{o}{isObj&&n===q.correct_index&&<span className="ml-2 font-black text-emerald-300">✓ kunci</span>}{q.section==="tkp"&&Array.isArray(q.scores)&&<span className="ml-2 font-black text-violet-300">({q.scores[n]})</span>}</div>)}</div>{q.explanation&&<p className="mt-3 rounded-xl bg-slate-950/30 p-3 text-xs leading-5 text-slate-400"><b className="text-slate-300">Pembahasan:</b> {q.explanation}</p>}</article>})}</div>}</section>
}
function Score({label,score,max,target}:{label:string;score:number;max:number;target?:number}){const pass=target===undefined||score>=target;return <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.14em] text-slate-500">{label}</p>{target!==undefined&&(pass?<ShieldCheck className="h-4 w-4 text-emerald-300"/>:<Target className="h-4 w-4 text-amber-300"/>)}</div><p className="mt-2 text-2xl font-black">{score}<span className="text-sm text-slate-500">/{max}</span></p>{target!==undefined&&<p className="mt-1 text-[10px] text-slate-500">Target latihan {target}</p>}</div>}
