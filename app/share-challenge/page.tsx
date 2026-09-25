"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Copy, Download, Link2, MessageCircle, Share2, Sparkles, Trophy, Users } from "lucide-react"
import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"
import { buildChallengeUrl, referralCall, trackReferralShare, type ReferralStats } from "@/lib/referral"

const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"

type Participant = {
  public_id?: string
  nickname?: string
  avatar_url?: string | null
  province_name?: string
  regency_name?: string
  district_name?: string
}
type ResultData = {
  leaderboard_total?: number
  result?: {
    battle_score?: number
    correct_count?: number
    question_count?: number
    national_rank?: number
    ranked_attempt?: boolean
  } | null
}

async function loadAccount(token:string){
  const r=await fetch(ACCOUNT_API,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:JSON.stringify({action:"me"}),cache:"no-store"})
  const d=await r.json().catch(()=>({})); if(!r.ok)throw new Error(d?.error||"Akun belum dapat dimuat."); return d?.participant as Participant
}
async function loadResult(token:string){
  const r=await fetch(BATTLE_API_URL,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:JSON.stringify({action:"latest_result"}),cache:"no-store"})
  const d=await r.json().catch(()=>({})); if(!r.ok)throw new Error(d?.error||"Hasil belum dapat dimuat."); return d?.data as ResultData
}
function initials(name:string){return name.split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]?.toUpperCase()).join("")||"BP"}
function canvasToBlob(canvas:HTMLCanvasElement){return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Kartu belum dapat dibuat.")),"image/png",.95))}

async function buildShareCard(participant:Participant,result:ResultData,link:string){
  const canvas=document.createElement("canvas"); canvas.width=1080; canvas.height=1920
  const ctx=canvas.getContext("2d"); if(!ctx)throw new Error("Canvas tidak tersedia.")
  const score=Number(result.result?.battle_score||0)
  const accuracy=result.result?.question_count?Math.round(Number(result.result.correct_count||0)/Number(result.result.question_count)*100):0
  const rank=result.result?.national_rank
  const bg=ctx.createLinearGradient(0,0,1080,1920); bg.addColorStop(0,"#020617"); bg.addColorStop(.48,"#0b1c3b"); bg.addColorStop(1,"#020617"); ctx.fillStyle=bg; ctx.fillRect(0,0,1080,1920)
  const glow=ctx.createRadialGradient(540,650,40,540,650,640); glow.addColorStop(0,"rgba(34,211,238,.28)"); glow.addColorStop(.55,"rgba(99,102,241,.14)"); glow.addColorStop(1,"rgba(2,6,23,0)"); ctx.fillStyle=glow; ctx.fillRect(0,0,1080,1400)
  for(let i=0;i<22;i++){ctx.strokeStyle=`rgba(103,232,249,${.025+(i%3)*.01})`;ctx.beginPath();ctx.moveTo(0,120+i*68);ctx.lineTo(1080,60+i*72);ctx.stroke()}
  try{const img=new Image();img.crossOrigin="anonymous";await new Promise<void>((ok,no)=>{img.onload=()=>ok();img.onerror=no;img.src="/brand/alvaza-logo-new.svg"});ctx.drawImage(img,462,70,156,156)}catch{}
  ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="900 54px Arial";ctx.fillText("ALZAVA",540,282);ctx.fillStyle="#fbbf24";ctx.font="800 30px Arial";ctx.fillText("BATTLE POINT",540,330)
  ctx.fillStyle="#67e8f9";ctx.font="900 28px Arial";ctx.fillText("COMPETITIVE BRAIN GAME INDONESIA",540,410)
  ctx.fillStyle="#fff";ctx.font="900 72px Arial";ctx.fillText("COBA KALAHKAN",540,535);ctx.fillStyle="#fbbf24";ctx.font="italic 900 92px Arial";ctx.fillText("SKORKU!",540,630)

  ctx.save();ctx.beginPath();ctx.arc(540,835,132,0,Math.PI*2);ctx.clip()
  if(participant.avatar_url){try{const img=new Image();img.crossOrigin="anonymous";await new Promise<void>((ok,no)=>{img.onload=()=>ok();img.onerror=no;img.src=participant.avatar_url!});const s=Math.max(264/img.naturalWidth,264/img.naturalHeight);const sw=264/s,sh=264/s;ctx.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,408,703,264,264)}catch{ctx.fillStyle="#4338ca";ctx.fillRect(408,703,264,264)}} else {ctx.fillStyle="#4338ca";ctx.fillRect(408,703,264,264)}
  ctx.restore();ctx.strokeStyle="#fbbf24";ctx.lineWidth=9;ctx.beginPath();ctx.arc(540,835,136,0,Math.PI*2);ctx.stroke()
  if(!participant.avatar_url){ctx.fillStyle="#fff";ctx.font="900 78px Arial";ctx.fillText(initials(participant.nickname||"BP"),540,862)}
  ctx.fillStyle="#fff";ctx.font="900 52px Arial";ctx.fillText(participant.nickname||"Pemain",540,1050)
  ctx.fillStyle="#94a3b8";ctx.font="700 24px Arial";ctx.fillText([participant.regency_name,participant.province_name].filter(Boolean).join(" · ")||"Indonesia",540,1095)

  const panel=(x:number,title:string,value:string,accent:string)=>{ctx.fillStyle="rgba(2,6,23,.65)";ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,1180,290,180,28);ctx.fill();ctx.stroke();ctx.fillStyle=accent;ctx.font="900 22px Arial";ctx.fillText(title,x+145,1235);ctx.fillStyle="#fff";ctx.font="900 54px Arial";ctx.fillText(value,x+145,1315)}
  panel(75,"BATTLE POINT",score.toLocaleString("id-ID"),"#67e8f9");panel(395,"RANK NASIONAL",rank?`#${rank}`:"—","#fbbf24");panel(715,"AKURASI",`${accuracy}%`,"#a78bfa")
  ctx.fillStyle="#fff";ctx.font="900 38px Arial";ctx.fillText("KAMU BISA LEWATI?",540,1485);ctx.fillStyle="#cbd5e1";ctx.font="700 26px Arial";ctx.fillText("Buka link tantangan · mulai gratis · buktikan skormu",540,1535)
  ctx.fillStyle="#22d3ee";ctx.beginPath();ctx.roundRect(145,1610,790,112,32);ctx.fill();ctx.fillStyle="#04111f";ctx.font="900 32px Arial";ctx.fillText("ALZAVA BATTLE POINT · TANTANG SEKARANG",540,1678)
  ctx.fillStyle="#94a3b8";ctx.font="700 19px Arial";ctx.fillText(link.replace(/^https?:\/\//,""),540,1785)
  ctx.fillStyle="#64748b";ctx.font="700 18px Arial";ctx.fillText("Raih Poin. Taklukkan Peringkat.",540,1840)
  return canvas
}

export default function ShareChallengePage(){
  const [participant,setParticipant]=useState<Participant|null>(null)
  const [result,setResult]=useState<ResultData|null>(null)
  const [stats,setStats]=useState<ReferralStats|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")
  const [notice,setNotice]=useState("")

  useEffect(()=>{
    const token=getParticipantToken(); if(!token){window.location.replace("/account");return}
    Promise.all([loadAccount(token),loadResult(token),referralCall<{stats?:ReferralStats}>({action:"stats"},true)])
      .then(([p,r,s])=>{setParticipant(p||null);setResult(r||null);setStats(s.stats||null)})
      .catch(e=>setError(e instanceof Error?e.message:"Data tantangan belum dapat dimuat."))
      .finally(()=>setLoading(false))
  },[])

  const publicId=participant?.public_id||stats?.public_id||""
  const score=Number(result?.result?.battle_score||0)
  const genericLink=useMemo(()=>publicId?buildChallengeUrl(publicId,"share"):"",[publicId])

  async function copyLink(){if(!publicId)return;const link=buildChallengeUrl(publicId,"copy");await navigator.clipboard.writeText(link);void trackReferralShare("copy");setNotice("Link tantangan sudah disalin.")}
  async function shareWhatsApp(){if(!publicId)return;const link=buildChallengeUrl(publicId,"whatsapp");const text=`🔥 Saya dapat ${score.toLocaleString("id-ID")} Battle Point di ALZAVA. Bisa kalahkan skorku?\n\n${link}`;void trackReferralShare("whatsapp");window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank","noopener,noreferrer")}
  async function downloadCard(){if(!participant||!result||!publicId)return;const link=buildChallengeUrl(publicId,"card");const canvas=await buildShareCard(participant,result,link);const a=document.createElement("a");a.href=canvas.toDataURL("image/png",.95);a.download=`alzava-battle-point-${(participant.nickname||"player").replace(/[^a-z0-9]+/gi,"-").toLowerCase()}.png`;a.click();setNotice("Kartu tantangan berhasil dibuat.")}
  async function nativeShare(){if(!participant||!result||!publicId)return;const link=buildChallengeUrl(publicId,"native");const canvas=await buildShareCard(participant,result,link);const blob=await canvasToBlob(canvas);const file=new File([blob],"alzava-battle-point.png",{type:"image/png"});const payload={title:"ALZAVA Battle Point",text:`Saya dapat ${score.toLocaleString("id-ID")} Battle Point. Coba kalahkan skorku!`,url:link,files:[file]};void trackReferralShare("native");if(navigator.share){try{if(!navigator.canShare||navigator.canShare({files:[file]}))await navigator.share(payload);else await navigator.share({title:payload.title,text:payload.text,url:payload.url})}catch{}}else{await navigator.clipboard.writeText(link);setNotice("Link tantangan sudah disalin.")}}

  if(loading)return <main className="grid min-h-screen place-items-center bg-[#020617] text-slate-300">Menyiapkan link tantangan…</main>
  return <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,.18),transparent_30rem),radial-gradient(circle_at_85%_10%,rgba(99,102,241,.2),transparent_32rem),linear-gradient(180deg,#020617,#07142e_55%,#020617)] px-4 py-8 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3"><a href="/battle" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4"/>Beranda</a><img src="/brand/alvaza-logo-new.svg" alt="ALZAVA" className="h-11 w-11 object-contain"/></div>
      {error&&<div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">{error}</div>}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <div className="overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07162f]/90 shadow-2xl">
          <div className="bg-gradient-to-br from-indigo-500/20 via-transparent to-cyan-400/10 p-7 text-center sm:p-9">
            <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">Mesin Penyebaran Organik</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">Bagikan. Tantang. Ajak Mereka Masuk Ranking.</h1><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">Setiap link milik Anda dapat dilacak. Orang yang membuka, menerima tantangan, lalu mendaftar akan masuk statistik referral Anda.</p>
          </div>
          <div className="p-6 sm:p-8">
            <div className="rounded-[1.7rem] border border-white/10 bg-slate-950/55 p-6 text-center">
              <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-amber-300 bg-indigo-700 text-2xl font-black">{participant?.avatar_url?<img src={participant.avatar_url} alt="" className="h-full w-full object-cover"/>:initials(participant?.nickname||"BP")}</div>
              <h2 className="mt-4 text-3xl font-black">{participant?.nickname||"Pemain"}</h2><p className="mt-1 text-sm text-slate-500">{[participant?.regency_name,participant?.province_name].filter(Boolean).join(" · ")}</p>
              <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-amber-300/20 bg-amber-300/[.07] p-5"><span className="text-xs font-black uppercase tracking-[.17em] text-amber-200">Skor tantangan</span><strong className="mt-1 block text-5xl font-black text-amber-300">{score?score.toLocaleString("id-ID"):"—"}</strong><span className="text-xs text-slate-500">Battle Point</span></div>
              {!score&&<p className="mt-4 text-sm text-amber-200">Selesaikan Tes Resmi terlebih dahulu agar link tantangan mempunyai skor.</p>}
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Link Tantangan Anda</p><div className="mt-2 flex gap-2"><input readOnly value={genericLink} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3 text-xs text-slate-300"/><button onClick={()=>void copyLink()} disabled={!publicId} className="grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-950 disabled:opacity-40"><Copy className="h-4 w-4"/></button></div></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><button onClick={()=>void shareWhatsApp()} disabled={!score} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-black text-slate-950 disabled:opacity-40"><MessageCircle className="h-5 w-5"/>Bagikan ke WhatsApp</button><button onClick={()=>void nativeShare()} disabled={!score} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 font-black disabled:opacity-40"><Share2 className="h-5 w-5"/>Bagikan Kartu</button><button onClick={()=>void downloadCard()} disabled={!score} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 font-bold text-slate-200 disabled:opacity-40"><Download className="h-5 w-5"/>Unduh Kartu 9:16</button><button onClick={()=>void copyLink()} disabled={!publicId} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 font-bold text-slate-200 disabled:opacity-40"><Link2 className="h-5 w-5"/>Salin Link</button></div>
            {notice&&<p className="mt-3 text-center text-sm font-bold text-emerald-300">{notice}</p>}
          </div>
        </div>

        <div className="space-y-5">
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-6 sm:p-7"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-300"/><h2 className="text-xl font-black">Statistik Tantangan</h2></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/[.04] p-4"><span className="text-xs text-slate-500">Membuka link</span><strong className="mt-1 block text-3xl font-black text-cyan-300">{stats?.opens||0}</strong></div><div className="rounded-2xl bg-white/[.04] p-4"><span className="text-xs text-slate-500">Terima tantangan</span><strong className="mt-1 block text-3xl font-black text-violet-300">{stats?.accepts||0}</strong></div><div className="rounded-2xl bg-white/[.04] p-4"><span className="text-xs text-slate-500">Menjadi peserta</span><strong className="mt-1 block text-3xl font-black text-emerald-300">{stats?.conversions||0}</strong></div><div className="rounded-2xl bg-white/[.04] p-4"><span className="text-xs text-slate-500">Total dibagikan</span><strong className="mt-1 block text-3xl font-black text-amber-300">{stats?.shares||0}</strong></div></div><div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm"><span className="text-slate-400">Konversi link → peserta</span><b>{Number(stats?.conversion_rate||0)}%</b></div></section>
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-6 sm:p-7"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-cyan-300"/><h2 className="text-xl font-black">Cara paling efektif</h2></div><div className="mt-4 space-y-3 text-sm leading-6 text-slate-400"><p><b className="text-white">1.</b> Bagikan kartu ke Status WhatsApp dengan kalimat pendek: <span className="text-cyan-200">“Saya dapat {score||"…"} Battle Point. Bisa kalahkan?”</span></p><p><b className="text-white">2.</b> Jangan jelaskan terlalu panjang. Biarkan rasa penasaran membawa mereka ke link tantangan.</p><p><b className="text-white">3.</b> Sebarkan lagi setelah posisi ranking Anda berubah agar kontennya tidak terasa sama.</p></div></section>
          <a href="/battle#peringkat" className="flex items-center justify-between rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-5"><span><span className="block font-black">Lihat posisi Anda</span><span className="text-sm text-slate-500">Gunakan ranking terbaru sebagai bahan challenge.</span></span><Trophy className="h-7 w-7 text-amber-300"/></a>
        </div>
      </section>
    </div>
  </main>
}
