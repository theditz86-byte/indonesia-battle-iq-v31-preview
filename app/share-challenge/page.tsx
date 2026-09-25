"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Copy, Download, Link2, MessageCircle, Share2, Sparkles, Trophy, Users } from "lucide-react"
import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"
import { buildChallengeUrl, referralCall, trackReferralShare, type ReferralStats } from "@/lib/referral"

const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"

type Participant = { public_id?:string; nickname?:string; avatar_url?:string|null; province_name?:string; regency_name?:string; district_name?:string }
type ChallengeEntry = { participant_public_id?:string; nickname?:string; avatar_url?:string|null; province_name?:string; regency_name?:string; district_name?:string; battle_score?:number; correct_count?:number; question_count?:number; duration_ms?:number; national_rank?:number }

async function loadAccount(token:string){
  const r=await fetch(ACCOUNT_API,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:JSON.stringify({action:"me"}),cache:"no-store"})
  const d=await r.json().catch(()=>({}))
  if(!r.ok)throw new Error(d?.error||"Akun belum dapat dimuat.")
  return d?.participant as Participant
}

async function loadOfficialEntry(publicId:string){
  const r=await fetch(`${BATTLE_API_URL}?challenge_id=${encodeURIComponent(publicId)}`,{cache:"no-store"})
  const d=await r.json().catch(()=>({}))
  if(!r.ok)throw new Error("Skor resmi belum dapat dimuat.")
  return (d?.challenge_entry||null) as ChallengeEntry|null
}

function initials(name:string){ return name.split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]?.toUpperCase()).join("")||"BP" }
function canvasToBlob(canvas:HTMLCanvasElement){ return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Kartu belum dapat dibuat.")),"image/png",.95)) }

async function loadCanvasImage(url:string){
  const img=new Image(); img.crossOrigin="anonymous"; img.decoding="async"; img.referrerPolicy="no-referrer"
  await new Promise<void>((resolve,reject)=>{ const timer=window.setTimeout(()=>reject(new Error("image_timeout")),7000); img.onload=()=>{window.clearTimeout(timer);resolve()}; img.onerror=()=>{window.clearTimeout(timer);reject(new Error("image_load_failed"))}; img.src=url })
  if(!img.naturalWidth||!img.naturalHeight)throw new Error("image_empty")
  return img
}

function cover(ctx:CanvasRenderingContext2D,img:HTMLImageElement,x:number,y:number,w:number,h:number){
  const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight); const sw=w/scale; const sh=h/scale
  ctx.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,x,y,w,h)
}

function fitFont(ctx:CanvasRenderingContext2D,text:string,maxWidth:number,start:number,min:number){
  let size=start
  while(size>min){ ctx.font=`900 ${size}px Arial, sans-serif`; if(ctx.measureText(text).width<=maxWidth)break; size-=2 }
  return size
}

async function buildShareCard(participant:Participant,entry:ChallengeEntry){
  const W=1080,H=1920
  const canvas=document.createElement("canvas"); canvas.width=W; canvas.height=H
  const ctx=canvas.getContext("2d"); if(!ctx)throw new Error("Canvas tidak tersedia.")
  const score=Number(entry.battle_score||0)
  const accuracy=entry.question_count?Math.round(Number(entry.correct_count||0)/Number(entry.question_count)*100):0
  const rank=Number(entry.national_rank||0)
  const nickname=participant.nickname||entry.nickname||"Pemain"
  const region=[entry.regency_name||participant.regency_name,entry.province_name||participant.province_name].filter(Boolean).join(" · ")||"Indonesia"
  const avatar=participant.avatar_url||entry.avatar_url||""

  const rr=(x:number,y:number,w:number,h:number,r:number)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
  const fillRR=(x:number,y:number,w:number,h:number,r:number,fill:string|CanvasGradient)=>{ctx.save();ctx.fillStyle=fill;rr(x,y,w,h,r);ctx.fill();ctx.restore()}
  const strokeRR=(x:number,y:number,w:number,h:number,r:number,color:string|CanvasGradient,width:number)=>{ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;rr(x,y,w,h,r);ctx.stroke();ctx.restore()}

  let arena:HTMLImageElement|null=null
  try{ arena=await loadCanvasImage("/images/hero-bg.png?v=challenge-gold-v4"); cover(ctx,arena,0,0,W,H) }
  catch{ const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#031126"); bg.addColorStop(.55,"#071a38"); bg.addColorStop(1,"#020617"); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H) }

  const dark=ctx.createLinearGradient(0,0,0,H); dark.addColorStop(0,"rgba(1,5,18,.14)"); dark.addColorStop(.5,"rgba(1,6,19,.30)"); dark.addColorStop(1,"rgba(1,5,18,.80)"); ctx.fillStyle=dark; ctx.fillRect(0,0,W,H)

  // Re-render the bright center of the background through a gold filter. This makes the Indonesia map/network lines read as a premium golden national motif behind the player card.
  if(arena){
    ctx.save(); rr(42,500,996,850,120); ctx.clip(); ctx.globalCompositeOperation="screen"; ctx.globalAlpha=.43; ctx.filter="sepia(1) saturate(7) hue-rotate(350deg) brightness(1.55) contrast(1.25)"; cover(ctx,arena,0,0,W,H); ctx.restore()
  }
  const mapGlow=ctx.createRadialGradient(540,930,80,540,930,600); mapGlow.addColorStop(0,"rgba(255,210,82,.28)"); mapGlow.addColorStop(.45,"rgba(245,158,11,.12)"); mapGlow.addColorStop(1,"rgba(245,158,11,0)"); ctx.fillStyle=mapGlow; ctx.fillRect(0,420,W,1060)

  // Small gold constellation accents across the map area.
  ctx.save(); ctx.strokeStyle="rgba(253,224,71,.42)"; ctx.lineWidth=2
  const pts=[[150,910],[245,850],[338,900],[430,820],[520,880],[610,835],[700,895],[790,845],[905,915]]
  ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.stroke()
  pts.forEach(([x,y],i)=>{const g=ctx.createRadialGradient(x,y,0,x,y,18+(i%3)*5);g.addColorStop(0,"rgba(255,244,180,.95)");g.addColorStop(.3,"rgba(251,191,36,.55)");g.addColorStop(1,"rgba(251,191,36,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.fill()}); ctx.restore()

  try{const logo=await loadCanvasImage("/brand/alvaza-logo-new.svg");ctx.drawImage(logo,480,28,120,120)}catch{}
  ctx.textAlign="center"; ctx.fillStyle="#fff"; ctx.font="900 50px Arial, sans-serif"; ctx.fillText("ALZAVA",540,190)
  ctx.fillStyle="#fbbf24"; ctx.font="800 29px Arial, sans-serif"; ctx.fillText("BATTLE POINT",540,230)
  ctx.fillStyle="#67e8f9"; ctx.font="900 20px Arial, sans-serif"; ctx.fillText("COMPETITIVE BRAIN GAME INDONESIA",540,290)

  ctx.save();ctx.lineJoin="round";ctx.font="italic 900 64px Arial, sans-serif";ctx.strokeStyle="rgba(0,0,0,.82)";ctx.lineWidth=17;ctx.strokeText("SKOR INI",540,390);ctx.strokeStyle="rgba(37,99,235,.95)";ctx.lineWidth=6;ctx.strokeText("SKOR INI",540,390);ctx.fillStyle="#f8fafc";ctx.shadowColor="rgba(96,165,250,.28)";ctx.shadowBlur=14;ctx.fillText("SKOR INI",540,390)
  const tg=ctx.createLinearGradient(160,0,920,0);tg.addColorStop(0,"#f59e0b");tg.addColorStop(.5,"#fff4b0");tg.addColorStop(1,"#f59e0b");ctx.font="italic 900 92px Arial, sans-serif";ctx.strokeStyle="rgba(0,0,0,.88)";ctx.lineWidth=21;ctx.strokeText("SULIT DIKEJAR!",540,482);ctx.strokeStyle="#92400e";ctx.lineWidth=7;ctx.strokeText("SULIT DIKEJAR!",540,482);ctx.fillStyle=tg;ctx.shadowColor="rgba(251,191,36,.42)";ctx.shadowBlur=20;ctx.fillText("SULIT DIKEJAR!",540,482);ctx.restore()

  // Main card: deliberately taller with more vertical breathing room.
  const cardX=170,cardY=555,cardW=740,cardH=700
  const body=ctx.createLinearGradient(cardX,cardY,cardX,cardY+cardH);body.addColorStop(0,"rgba(18,27,38,.42)");body.addColorStop(.5,"rgba(14,17,24,.45)");body.addColorStop(1,"rgba(16,12,7,.55)")
  ctx.save();ctx.shadowColor="rgba(251,191,36,.58)";ctx.shadowBlur=46;fillRR(cardX,cardY,cardW,cardH,56,body);ctx.restore()
  strokeRR(cardX,cardY,cardW,cardH,56,"#fbbf24",8)
  strokeRR(cardX+12,cardY+12,cardW-24,cardH-24,46,"rgba(255,247,194,.55)",2.4)
  const shine=ctx.createLinearGradient(cardX,cardY,cardX+cardW,cardY);shine.addColorStop(0,"rgba(255,255,255,0)");shine.addColorStop(.5,"rgba(255,250,210,.95)");shine.addColorStop(1,"rgba(255,255,255,0)");strokeRR(cardX+80,cardY+12,cardW-160,1,1,shine,5)

  const acx=540,acy=760,ar=116
  ctx.save();ctx.beginPath();ctx.arc(acx,acy,ar,0,Math.PI*2);ctx.clip()
  if(avatar){try{const img=await loadCanvasImage(avatar);const sc=Math.max((ar*2)/img.naturalWidth,(ar*2)/img.naturalHeight);const sw=(ar*2)/sc,sh=(ar*2)/sc;ctx.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,acx-ar,acy-ar,ar*2,ar*2)}catch{ctx.fillStyle="#4338ca";ctx.fillRect(acx-ar,acy-ar,ar*2,ar*2)}}else{ctx.fillStyle="#4338ca";ctx.fillRect(acx-ar,acy-ar,ar*2,ar*2)}
  ctx.restore();ctx.save();ctx.shadowColor="rgba(251,191,36,.78)";ctx.shadowBlur=28;ctx.strokeStyle="#fbbf24";ctx.lineWidth=9;ctx.beginPath();ctx.arc(acx,acy,ar+7,0,Math.PI*2);ctx.stroke();ctx.strokeStyle="rgba(255,248,210,.75)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(acx,acy,ar-4,0,Math.PI*2);ctx.stroke();ctx.restore()
  if(!avatar){ctx.fillStyle="#fff";ctx.font="900 68px Arial, sans-serif";ctx.fillText(initials(nickname),acx,acy+22)}

  const nameSize=fitFont(ctx,nickname,600,56,34);ctx.fillStyle="#fff";ctx.font=`900 ${nameSize}px Arial, sans-serif`;ctx.fillText(nickname,540,970)
  const regionSize=fitFont(ctx,region,630,27,18);ctx.fillStyle="#d1d5db";ctx.font=`700 ${regionSize}px Arial, sans-serif`;ctx.fillText(region,540,1018)
  const sg=ctx.createLinearGradient(340,0,740,0);sg.addColorStop(0,"#f59e0b");sg.addColorStop(.5,"#fff2a6");sg.addColorStop(1,"#f59e0b");ctx.save();ctx.shadowColor="rgba(251,191,36,.48)";ctx.shadowBlur=22;ctx.fillStyle=sg;ctx.font="900 142px Arial, sans-serif";ctx.fillText(score.toLocaleString("id-ID"),540,1180);ctx.restore();ctx.fillStyle="#fff";ctx.font="900 28px Arial, sans-serif";ctx.fillText("BATTLE POINT",540,1222)

  const sy=1320,sw=270,sh=158,gap=25,start=(W-(sw*3+gap*2))/2
  const drawStat=(x:number,label:string,value:string,accent:string)=>{
    const g=ctx.createLinearGradient(x,sy,x+sw,sy+sh);g.addColorStop(0,"rgba(7,23,49,.60)");g.addColorStop(.58,"rgba(3,12,32,.72)");g.addColorStop(1,"rgba(12,10,30,.63)")
    ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=26;fillRR(x,sy,sw,sh,28,g);ctx.restore();strokeRR(x,sy,sw,sh,28,accent,5.5);strokeRR(x+9,sy+9,sw-18,sh-18,20,"rgba(255,255,255,.28)",1.6)
    const hi=ctx.createLinearGradient(x+30,0,x+sw-30,0);hi.addColorStop(0,"rgba(255,255,255,0)");hi.addColorStop(.5,"rgba(255,255,255,.88)");hi.addColorStop(1,"rgba(255,255,255,0)");ctx.save();ctx.strokeStyle=hi;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+55,sy+16);ctx.lineTo(x+sw-55,sy+16);ctx.stroke();ctx.restore()
    ctx.fillStyle=accent;ctx.font="900 16px Arial, sans-serif";ctx.fillText(label.toUpperCase(),x+sw/2,sy+43);const vs=fitFont(ctx,value,sw-28,43,26);ctx.fillStyle="#fff";ctx.font=`900 ${vs}px Arial, sans-serif`;ctx.fillText(value,x+sw/2,sy+104)
  }
  drawStat(start,"Pemain",nickname,"#67e8f9");drawStat(start+sw+gap,"Rank Nasional",rank?`#${rank}`:"—","#fbbf24");drawStat(start+(sw+gap)*2,"Ketepatan",`${accuracy}%`,"#c084fc")

  ctx.fillStyle="#fff";ctx.font="italic 900 52px Arial, sans-serif";ctx.fillText("BISA LEWATI SKORKU?",540,1575)
  const cg=ctx.createLinearGradient(135,0,945,0);cg.addColorStop(0,"#7c3aed");cg.addColorStop(.5,"#2563eb");cg.addColorStop(1,"#06b6d4");ctx.save();ctx.shadowColor="rgba(34,211,238,.55)";ctx.shadowBlur=34;fillRR(135,1628,810,124,62,cg);ctx.restore();strokeRR(135,1628,810,124,62,"rgba(103,232,249,.9)",5)
  const cshine=ctx.createLinearGradient(135,1628,135,1688);cshine.addColorStop(0,"rgba(255,255,255,.24)");cshine.addColorStop(1,"rgba(255,255,255,0)");fillRR(143,1636,794,54,54,cshine)
  ctx.fillStyle="#fff";ctx.font="900 35px Arial, sans-serif";ctx.fillText("⚔  AYO BATTLE SEKARANG  ›",540,1706)
  ctx.fillStyle="#cbd5e1";ctx.font="700 21px Arial, sans-serif";ctx.fillText("Buka link yang dibagikan · mulai gratis · buktikan skormu",540,1818)
  ctx.fillStyle="#64748b";ctx.font="700 18px Arial, sans-serif";ctx.fillText("Raih Poin. Taklukkan Peringkat.",540,1864)
  return canvas
}

export default function ShareChallengePage(){
  const [participant,setParticipant]=useState<Participant|null>(null)
  const [entry,setEntry]=useState<ChallengeEntry|null>(null)
  const [stats,setStats]=useState<ReferralStats|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")
  const [notice,setNotice]=useState("")

  useEffect(()=>{
    const token=getParticipantToken(); if(!token){window.location.replace("/account");return}
    Promise.all([loadAccount(token),referralCall<{stats?:ReferralStats}>({action:"stats"},true)])
      .then(async([p,s])=>{setParticipant(p||null);setStats(s.stats||null);const id=p?.public_id||s.stats?.public_id||"";if(id)setEntry(await loadOfficialEntry(id))})
      .catch(e=>setError(e instanceof Error?e.message:"Data tantangan belum dapat dimuat."))
      .finally(()=>setLoading(false))
  },[])

  const publicId=participant?.public_id||stats?.public_id||""
  const score=Number(entry?.battle_score||0)
  const genericLink=useMemo(()=>publicId?buildChallengeUrl(publicId,"share"):"",[publicId])

  async function copyLink(){if(!publicId)return;const link=buildChallengeUrl(publicId,"copy");await navigator.clipboard.writeText(link);void trackReferralShare("copy");setNotice("Link tantangan sudah disalin.")}
  async function shareWhatsApp(){if(!publicId||!score)return;const link=buildChallengeUrl(publicId,"whatsapp");const text=`🔥 Saya dapat ${score.toLocaleString("id-ID")} Battle Point di ALZAVA. Bisa kalahkan skorku?\n\n${link}`;void trackReferralShare("whatsapp");window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank","noopener,noreferrer")}
  async function downloadCard(){if(!participant||!entry||!publicId)return;const canvas=await buildShareCard(participant,entry);const a=document.createElement("a");a.href=canvas.toDataURL("image/png",.95);a.download=`alzava-battle-point-${(participant.nickname||"player").replace(/[^a-z0-9]+/gi,"-").toLowerCase()}.png`;a.click();setNotice("Kartu tantangan 9:16 berhasil dibuat.")}
  async function nativeShare(){if(!participant||!entry||!publicId)return;const link=buildChallengeUrl(publicId,"native");const canvas=await buildShareCard(participant,entry);const blob=await canvasToBlob(canvas);const file=new File([blob],"alzava-battle-point.png",{type:"image/png"});const payload={title:"ALZAVA Battle Point",text:`Saya dapat ${score.toLocaleString("id-ID")} Battle Point. Bisa kalahkan skorku?`,url:link,files:[file]};void trackReferralShare("native");if(navigator.share){try{if(!navigator.canShare||navigator.canShare({files:[file]}))await navigator.share(payload);else await navigator.share({title:payload.title,text:payload.text,url:payload.url})}catch{}}else{await navigator.clipboard.writeText(link);setNotice("Link tantangan sudah disalin.")}}

  if(loading)return <main className="grid min-h-screen place-items-center bg-[#020617] text-slate-300">Menyiapkan link tantangan…</main>

  return <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,.18),transparent_30rem),radial-gradient(circle_at_85%_10%,rgba(99,102,241,.2),transparent_32rem),linear-gradient(180deg,#020617,#07142e_55%,#020617)] px-4 py-8 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3"><a href="/battle" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4"/>Beranda</a><img src="/brand/alvaza-logo-new.svg" alt="ALZAVA" className="h-11 w-11 object-contain"/></div>
      {error&&<div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">{error}</div>}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <div className="overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07162f]/90 shadow-2xl">
          <div className="bg-gradient-to-br from-indigo-500/20 via-transparent to-cyan-400/10 p-7 text-center sm:p-9"><p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">Bagikan & Tantang</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">Sebarkan Skormu. Ajak Teman Melewatinya.</h1><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">Kartu challenge memakai gaya visual premium 9:16, panel yang lebih lega, dan aksen peta Indonesia berkilau emas di belakang pemain.</p></div>
          <div className="p-6 sm:p-8">
            <div className="rounded-[1.7rem] border border-white/10 bg-slate-950/55 p-6 text-center"><div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-amber-300 bg-indigo-700 text-2xl font-black">{participant?.avatar_url?<img src={participant.avatar_url} alt="" className="h-full w-full object-cover"/>:initials(participant?.nickname||"BP")}</div><h2 className="mt-4 text-3xl font-black">{participant?.nickname||"Pemain"}</h2><p className="mt-1 text-sm text-slate-500">{[participant?.regency_name,participant?.province_name].filter(Boolean).join(" · ")}</p><div className="mx-auto mt-5 max-w-sm rounded-2xl border border-amber-300/20 bg-amber-300/[.07] p-5"><span className="text-xs font-black uppercase tracking-[.17em] text-amber-200">Skor resmi yang ditantang</span><strong className="mt-1 block text-5xl font-black text-amber-300">{score?score.toLocaleString("id-ID"):"—"}</strong><span className="text-xs text-slate-500">Battle Point</span></div>{!score&&<p className="mt-4 text-sm text-amber-200">Selesaikan Tes Resmi terlebih dahulu agar link tantangan mempunyai skor resmi.</p>}</div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Link Tantangan Anda</p><div className="mt-2 flex gap-2"><input readOnly value={genericLink} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3 text-xs text-slate-300"/><button onClick={()=>void copyLink()} disabled={!publicId} className="grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-950 disabled:opacity-40"><Copy className="h-4 w-4"/></button></div></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><button onClick={()=>void shareWhatsApp()} disabled={!score} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-black text-slate-950 disabled:opacity-40"><MessageCircle className="h-5 w-5"/>Bagikan ke WhatsApp</button><button onClick={()=>void nativeShare()} disabled={!score} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 font-black disabled:opacity-40"><Share2 className="h-5 w-5"/>Bagikan Kartu</button><button onClick={()=>void downloadCard()} disabled={!score} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 font-bold text-slate-200 disabled:opacity-40"><Download className="h-5 w-5"/>Unduh Kartu 9:16</button><button onClick={()=>void copyLink()} disabled={!publicId} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 font-bold text-slate-200 disabled:opacity-40"><Link2 className="h-5 w-5"/>Salin Link Tantangan</button></div>
            {notice&&<p className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[.07] px-4 py-3 text-sm font-bold text-emerald-200">{notice}</p>}
          </div>
        </div>
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-6 shadow-xl"><div className="flex items-center gap-2 text-cyan-300"><Users className="h-5 w-5"/><p className="text-xs font-black uppercase tracking-[.18em]">Statistik Referral</p></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="text-xs text-slate-500">Membuka Link</span><strong className="mt-1 block text-3xl font-black">{Number(stats?.opens||0).toLocaleString("id-ID")}</strong></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="text-xs text-slate-500">Terima Tantangan</span><strong className="mt-1 block text-3xl font-black">{Number(stats?.accepts||0).toLocaleString("id-ID")}</strong></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="text-xs text-slate-500">Peserta Baru</span><strong className="mt-1 block text-3xl font-black text-emerald-300">{Number(stats?.conversions||0).toLocaleString("id-ID")}</strong></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="text-xs text-slate-500">Dibagikan</span><strong className="mt-1 block text-3xl font-black text-violet-300">{Number(stats?.shares||0).toLocaleString("id-ID")}</strong></div></div><div className="mt-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.06] p-4"><div className="flex items-end justify-between gap-4"><div><span className="text-xs text-cyan-100/70">Conversion rate</span><strong className="mt-1 block text-3xl font-black text-cyan-200">{Number(stats?.conversion_rate||0).toFixed(1)}%</strong></div><div className="text-right"><span className="text-xs text-slate-500">Sumber terbaik</span><strong className="mt-1 block text-sm font-black text-white">{stats?.top_source||"—"}</strong></div></div></div></div>
          <div className="rounded-[2rem] border border-amber-300/15 bg-gradient-to-br from-amber-300/[.08] to-transparent p-6"><Sparkles className="h-6 w-6 text-amber-300"/><h3 className="mt-3 text-xl font-black">Cara paling mudah mulai</h3><p className="mt-2 text-sm leading-6 text-slate-400">Unduh kartu 9:16 lalu pasang di Status WhatsApp. Sertakan link tantangan di caption agar teman bisa langsung masuk.</p><div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300">🔥 Saya dapat <b>{score?score.toLocaleString("id-ID"):"___"} Battle Point</b>.<br/>Bisa kalahkan skorku?<br/>👇 Klik link tantangannya.</div></div>
          <a href="/battle#peringkat" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.035] p-5 hover:bg-white/[.06]"><span className="flex items-center gap-3"><Trophy className="h-5 w-5 text-amber-300"/><span><b className="block">Lihat Peringkat</b><small className="text-slate-500">Cek posisi sebelum membagikan challenge.</small></span></span><span>›</span></a>
        </aside>
      </section>
    </div>
  </main>
}
