"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, ChevronRight, Target, X } from "lucide-react"
import { getParticipantToken } from "@/lib/battle"

const ERROR_API="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-error-analysis"

type DomainStat={mistakes?:number;unanswered?:number;numbers?:number[]}
type Analysis={
  attempt_id?:string
  question_count?:number
  correct_count?:number
  wrong_count?:number
  unanswered_count?:number
  wrong_numbers?:number[]
  unanswered_numbers?:number[]
  by_domain?:Record<string,DomainStat>
  answer_key_hidden?:boolean
  message?:string
}

const domainLabels:Record<string,string>={
  fluid:"Logika & Numerik",
  verbal:"Penalaran Verbal",
  visual:"Spasial & Visual",
  memory:"Memori Kerja",
  speed:"Kecepatan Nalar",
  other:"Lainnya",
}

export function ResultErrorAnalysis(){
  const [visible,setVisible]=useState(false)
  const [open,setOpen]=useState(false)
  const [busy,setBusy]=useState(false)
  const [analysis,setAnalysis]=useState<Analysis|null>(null)
  const [error,setError]=useState("")
  const [attemptId,setAttemptId]=useState<string|null>(null)

  useEffect(()=>{
    const isResult=window.location.pathname.startsWith("/result")
    setVisible(isResult)
    if(isResult){
      const id=new URLSearchParams(window.location.search).get("attempt")
      setAttemptId(id&&/^[0-9a-f-]{36}$/i.test(id)?id:null)
    }
  },[])

  async function load(){
    setOpen(true)
    if(analysis||busy)return
    const token=getParticipantToken()
    if(!token){setError("Masuk sebagai peserta untuk melihat analisis kesalahan.");return}
    setBusy(true);setError("")
    try{
      const r=await fetch(ERROR_API,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:JSON.stringify({attempt_id:attemptId}),cache:"no-store"})
      const d=await r.json().catch(()=>({}))
      if(!r.ok)throw new Error(d?.error||"Analisis belum dapat dimuat.")
      setAnalysis(d?.analysis||null)
    }catch(e){setError(e instanceof Error?e.message:"Analisis belum dapat dimuat.")}
    finally{setBusy(false)}
  }

  if(!visible)return null
  const wrong=Number(analysis?.wrong_count||0)
  const total=Number(analysis?.question_count||0)
  const correct=Number(analysis?.correct_count||Math.max(0,total-wrong))
  const domains=Object.entries(analysis?.by_domain||{}).sort((a,b)=>Number(b[1]?.mistakes||0)-Number(a[1]?.mistakes||0))

  return <>
    <button onClick={()=>void load()} className="fixed bottom-5 right-5 z-[70] inline-flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-[#08152c]/95 px-4 py-3 text-sm font-black text-white shadow-[0_14px_45px_rgba(0,0,0,.45)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-amber-300/60">
      <Target className="h-4 w-4 text-amber-300"/>
      Analisis Kesalahan
      <ChevronRight className="h-4 w-4 text-slate-400"/>
    </button>

    {open&&<div className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#07152d] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-amber-300">Analisis Kesalahan</p>
            <h2 className="mt-1 text-2xl font-black text-white">Di mana poinmu tertahan?</h2>
            <p className="mt-1 text-sm text-slate-400">Nomor soal yang keliru ditampilkan tanpa membocorkan kunci jawaban Ranked Battle.</p>
          </div>
          <button onClick={()=>setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300"><X className="h-4 w-4"/></button>
        </div>

        {busy&&<div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm font-bold text-slate-300">Menganalisis jawabanmu…</div>}
        {error&&<div className="mt-6 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div>}

        {analysis&&!busy&&<>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-center"><div className="text-2xl font-black text-white">{correct}</div><div className="mt-1 text-[11px] font-black uppercase tracking-wider text-emerald-300">Benar</div></div>
            <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-center"><div className="text-2xl font-black text-white">{wrong}</div><div className="mt-1 text-[11px] font-black uppercase tracking-wider text-amber-300">Perlu Ditinjau</div></div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-center"><div className="text-2xl font-black text-white">{total}</div><div className="mt-1 text-[11px] font-black uppercase tracking-wider text-cyan-300">Total Soal</div></div>
          </div>

          {wrong===0?<div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-5 text-center"><div className="text-lg font-black text-white">Sempurna — tidak ada jawaban yang keliru.</div><p className="mt-1 text-sm text-emerald-100/80">Pertahankan akurasi ini di battle berikutnya.</p></div>:<>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.035] p-4">
              <div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-300"/><span className="text-sm font-black text-white">Nomor soal yang menahan skor</span></div>
              <div className="flex flex-wrap gap-2">{(analysis.wrong_numbers||[]).map(n=>{const unanswered=(analysis.unanswered_numbers||[]).includes(n);return <span key={n} className={`grid h-10 min-w-10 place-items-center rounded-xl border px-3 text-sm font-black ${unanswered?"border-rose-300/30 bg-rose-400/10 text-rose-200":"border-amber-300/30 bg-amber-400/10 text-amber-100"}`}>{n}</span>})}</div>
              {!!analysis.unanswered_count&&<p className="mt-3 text-xs text-slate-400">Kotak merah = tidak terjawab ({analysis.unanswered_count}).</p>}
            </div>

            <div className="mt-4 space-y-2">{domains.map(([key,val])=><div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3"><div><div className="text-sm font-black text-white">{domainLabels[key]||key}</div><div className="mt-0.5 text-xs text-slate-400">Soal {(val.numbers||[]).join(", ")}</div></div><div className="rounded-xl bg-amber-400/10 px-3 py-2 text-sm font-black text-amber-200">{val.mistakes||0} salah</div></div>)}</div>
          </>}

          <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4 text-xs leading-relaxed text-slate-300">{analysis.message||"Kunci jawaban tidak ditampilkan agar fairness Ranked Battle tetap terjaga."}</div>
        </>}
      </div>
    </div>}
  </>
}
