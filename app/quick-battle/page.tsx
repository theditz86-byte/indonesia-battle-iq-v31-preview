"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Clock3, RotateCcw, Share2, Sparkles, Swords, Trophy, Zap } from "lucide-react"
import { BATTLE_API_URL } from "@/lib/battle"

type Q = { q: string; options: string[]; a: number; domain: string }
type Challenge = { nickname?: string; battle_score?: number; regency_name?: string; province_name?: string }

const BANK: Q[] = [
  { q:"5 · 9 · 17 · 33 · 65 · ?", options:["97","111","129","131"], a:2, domain:"Pola" },
  { q:"Jika semua analis teliti dan sebagian Tim A adalah analis, kesimpulan yang pasti adalah…", options:["Semua Tim A teliti","Sebagian Tim A teliti","Tidak ada Tim A teliti","Semua analis Tim A"], a:1, domain:"Logika" },
  { q:"A:B = 3:5. Jika jumlahnya 64, nilai B adalah…", options:["24","32","40","48"], a:2, domain:"Numerik" },
  { q:"Jika P→Q, Q→R, dan R tidak terjadi, maka…", options:["P terjadi","Q terjadi","P tidak terjadi","R terjadi"], a:2, domain:"Logika" },
  { q:"Harga Rp240.000 didiskon 20%, lalu pajak 10%. Harga akhirnya…", options:["Rp192.000","Rp201.600","Rp211.200","Rp216.000"], a:2, domain:"Numerik" },
  { q:"↑ diputar 90° searah jarum jam, lalu 180° berlawanan. Arah akhirnya…", options:["↑","→","↓","←"], a:3, domain:"Visual" },
  { q:"KOMPAS : ARAH = TERMOMETER : …", options:["Tekanan","Suhu","Kecepatan","Jarak"], a:1, domain:"Analogi" },
  { q:"6 orang menyelesaikan pekerjaan dalam 18 hari. Jika kecepatannya sama, 12 orang perlu…", options:["6 hari","9 hari","12 hari","36 hari"], a:1, domain:"Numerik" },
  { q:"Semua dokumen final ditandatangani. Dokumen X belum ditandatangani. Kesimpulan terkuat…", options:["X pasti salah","X belum final","X akan ditolak","Semua tanda tangan pasti final"], a:1, domain:"Logika" },
  { q:"2 · 6 · 14 · 30 · 62 · ?", options:["94","110","126","128"], a:2, domain:"Pola" },
  { q:"Jika M≤N dan N<O, maka…", options:["M<O","M=O","M>O","Tidak dapat ditentukan"], a:0, domain:"Logika" },
  { q:"Sebuah kendaraan 72 km/jam berjalan 50 menit. Jaraknya…", options:["48 km","54 km","60 km","64 km"], a:2, domain:"Numerik" },
  { q:"PREMIS : KESIMPULAN = DATA : …", options:["Arsip","Analisis","Sampel","Server"], a:1, domain:"Analogi" },
  { q:"Jika target tercapai maka produktivitas naik atau biaya turun. Target tercapai, produktivitas tidak naik. Maka…", options:["Biaya turun","Biaya naik","Target gagal","Tidak ada kesimpulan"], a:0, domain:"Logika" },
  { q:"Sebuah persegi memiliki berapa sumbu simetri?", options:["1","2","3","4"], a:3, domain:"Visual" },
]

function pickFive() {
  const copy=[...BANK]
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}
  return copy.slice(0,5)
}

function previewPoint(correct:number, elapsedSec:number){
  const speed=Math.max(0,Math.min(80,Math.round((100-elapsedSec)*.8)))
  return Math.max(350,Math.min(930,350+correct*100+speed))
}

export default function QuickBattlePage(){
  const [questions,setQuestions]=useState<Q[]>([])
  const [index,setIndex]=useState(0)
  const [answers,setAnswers]=useState<number[]>([])
  const [startedAt,setStartedAt]=useState(0)
  const [done,setDone]=useState(false)
  const [elapsed,setElapsed]=useState(0)
  const [challenge,setChallenge]=useState<Challenge|null>(null)
  const [challengeId,setChallengeId]=useState("")
  const [copied,setCopied]=useState(false)

  useEffect(()=>{
    setQuestions(pickFive());setStartedAt(Date.now())
    const id=new URLSearchParams(window.location.search).get("challenge")||""
    if(/^[0-9a-f-]{36}$/i.test(id)){
      setChallengeId(id)
      fetch(`${BATTLE_API_URL}?challenge_id=${encodeURIComponent(id)}`,{cache:"no-store"})
        .then(r=>r.ok?r.json():null).then(d=>setChallenge(d?.challenge_entry||null)).catch(()=>{})
    }
    void fetch(BATTLE_API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"track",event_type:"quick_battle_opened",details:{challenge_id:id||null}})}).catch(()=>{})
  },[])

  const correct=useMemo(()=>answers.reduce((n,v,i)=>n+(questions[i]&&v===questions[i].a?1:0),0),[answers,questions])
  const point=previewPoint(correct,elapsed)

  function choose(value:number){
    if(done||!questions[index]) return
    const next=[...answers,value]
    setAnswers(next)
    if(index===questions.length-1){
      const sec=Math.max(1,Math.round((Date.now()-startedAt)/1000));setElapsed(sec);setDone(true)
      void fetch(BATTLE_API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"track",event_type:"quick_battle_completed",details:{correct:next.reduce((n,v,i)=>n+(v===questions[i].a?1:0),0),seconds:sec,challenge_id:challengeId||null}})}).catch(()=>{})
    }else setIndex(index+1)
  }

  function restart(){setQuestions(pickFive());setIndex(0);setAnswers([]);setStartedAt(Date.now());setDone(false);setElapsed(0)}

  function ranked(){
    if(challengeId) localStorage.setItem("alzava.challenge.id",challengeId)
    window.location.href="/account"
  }

  async function share(){
    const url=window.location.origin+(challengeId?`/quick-battle?challenge=${encodeURIComponent(challengeId)}`:"/quick-battle")
    const text=`Saya dapat ${point} Preview Battle Point di Quick Battle ALZAVA. Bisa lewati? ⚔️`
    try{if(navigator.share) await navigator.share({title:"ALZAVA Quick Battle",text,url});else{await navigator.clipboard.writeText(`${text} ${url}`);setCopied(true);setTimeout(()=>setCopied(false),1600)}}catch{}
  }

  if(!questions.length) return <main className="grid min-h-screen place-items-center bg-[#020817] text-slate-300">Menyiapkan Quick Battle…</main>

  return <main className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,.28),transparent_32rem),linear-gradient(180deg,#020817,#07142f_52%,#020817)] px-4 py-7 text-white sm:px-6">
    <div className="mx-auto max-w-2xl">
      <header className="flex items-center justify-between gap-4">
        <a href="/battle" className="flex items-center gap-2"><img src="/alzava-emblem-v3.svg" alt="" className="h-10 w-10"/><div><b className="block leading-none">ALZAVA</b><span className="text-xs font-bold text-amber-300">Battle Point</span></div></a>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">Quick Battle · 5 soal</span>
      </header>

      {challenge && <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-center"><span className="text-xs font-black uppercase tracking-wider text-amber-200">Tantangan masuk</span><p className="mt-1 text-sm text-slate-200"><b>{challenge.nickname}</b> menantangmu mengejar <b className="text-amber-300">{Number(challenge.battle_score||0).toLocaleString("id-ID")} Battle Point</b>.</p></div>}

      {!done ? <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.055] shadow-2xl backdrop-blur-xl">
        <div className="border-b border-white/10 p-5 sm:p-6"><div className="flex items-center justify-between text-xs font-bold text-slate-400"><span>Soal {index+1} dari 5</span><span className="text-cyan-300">{questions[index].domain}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 transition-all" style={{width:`${((index+1)/5)*100}%`}}/></div></div>
        <div className="p-6 sm:p-8"><div className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-amber-300"><Zap className="h-4 w-4"/>Jawab cepat, tetap teliti</div><h1 className="text-2xl font-black leading-snug sm:text-3xl">{questions[index].q}</h1><div className="mt-7 grid gap-3">{questions[index].options.map((o,i)=><button key={o} onClick={()=>choose(i)} className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-4 text-left font-bold text-slate-100 transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-cyan-300/10"><span className="mr-3 inline-grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-xs text-cyan-300">{String.fromCharCode(65+i)}</span>{o}</button>)}</div></div>
      </section> : <section className="mt-8 overflow-hidden rounded-[2rem] border border-amber-300/20 bg-[radial-gradient(circle_at_50%_20%,rgba(245,158,11,.18),transparent_26rem),rgba(7,20,46,.92)] p-6 text-center shadow-2xl sm:p-9">
        <Sparkles className="mx-auto h-8 w-8 text-amber-300"/><p className="mt-3 text-xs font-black uppercase tracking-[.2em] text-amber-300">Preview Battle Point</p><div className="mt-2 bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-500 bg-clip-text text-7xl font-black text-transparent sm:text-8xl">{point}</div><p className="mt-2 text-sm text-slate-400">{correct}/5 benar · {elapsed} detik</p>
        <h1 className="mt-6 text-2xl font-black">Ini baru pemanasan.</h1><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-300">Preview ini <b>bukan skor leaderboard resmi</b>. Masuk Ranked Battle untuk mendapatkan Battle Point resmi dan melihat posisi di Kecamatan, Kabupaten/Kota, Provinsi, dan Indonesia.</p>
        {challenge && <div className="mx-auto mt-5 max-w-md rounded-2xl border border-white/10 bg-black/20 p-4"><Swords className="mx-auto h-5 w-5 text-violet-300"/><p className="mt-2 text-sm">Target tantangan: <b>{Number(challenge.battle_score||0).toLocaleString("id-ID")}</b> Battle Point milik {challenge.nickname}.</p></div>}
        <div className="mt-7 grid gap-3 sm:grid-cols-2"><button onClick={ranked} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 font-black shadow-[0_0_28px_rgba(99,102,241,.35)]"><Trophy className="h-5 w-5"/>Masuk Ranked Battle<ArrowRight className="h-4 w-4"/></button><button onClick={share} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 font-black"><Share2 className="h-5 w-5"/>{copied?"Tautan disalin":"Bagikan Quick Result"}</button></div>
        <button onClick={restart} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><RotateCcw className="h-4 w-4"/>Coba 5 soal lain</button>
      </section>}

      <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5"/>±1–2 menit</span><span>Tanpa login</span><span>Gratis</span></div>
    </div>
  </main>
}
