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

type ChallengeEntry = {
  participant_public_id?: string
  nickname?: string
  avatar_url?: string | null
  province_name?: string
  regency_name?: string
  district_name?: string
  battle_score?: number
  correct_count?: number
  question_count?: number
  duration_ms?: number
  national_rank?: number
}

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

function initials(name:string){
  return name.split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]?.toUpperCase()).join("")||"BP"
}

function canvasToBlob(canvas:HTMLCanvasElement){
  return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Kartu belum dapat dibuat.")),"image/png",.95))
}

async function loadCanvasImage(url:string){
  const img=new Image()
  img.crossOrigin="anonymous"
  img.decoding="async"
  img.referrerPolicy="no-referrer"
  await new Promise<void>((resolve,reject)=>{
    const timer=window.setTimeout(()=>reject(new Error("image_timeout")),7000)
    img.onload=()=>{window.clearTimeout(timer);resolve()}
    img.onerror=()=>{window.clearTimeout(timer);reject(new Error("image_load_failed"))}
    img.src=url
  })
  if(!img.naturalWidth||!img.naturalHeight)throw new Error("image_empty")
  return img
}

function cover(ctx:CanvasRenderingContext2D,img:HTMLImageElement,x:number,y:number,w:number,h:number){
  const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight)
  const sw=w/scale
  const sh=h/scale
  ctx.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,x,y,w,h)
}

function fitFont(ctx:CanvasRenderingContext2D,text:string,maxWidth:number,start:number,min:number){
  let size=start
  while(size>min){
    ctx.font=`900 ${size}px Arial, sans-serif`
    if(ctx.measureText(text).width<=maxWidth)break
    size-=2
  }
  return size
}

function roundRectPath(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath()
  ctx.roundRect(x,y,w,h,r)
}

async function buildShareCard(participant:Participant,entry:ChallengeEntry){
  const WIDTH=1080
  const HEIGHT=1920
  const canvas=document.createElement("canvas")
  canvas.width=WIDTH
  canvas.height=HEIGHT
  const ctx=canvas.getContext("2d")
  if(!ctx)throw new Error("Canvas tidak tersedia.")

  const score=Number(entry.battle_score||0)
  const accuracy=entry.question_count?Math.round(Number(entry.correct_count||0)/Number(entry.question_count)*100):0
  const rank=Number(entry.national_rank||0)
  const nickname=participant.nickname||entry.nickname||"Pemain"
  const region=[entry.regency_name||participant.regency_name,entry.province_name||participant.province_name].filter(Boolean).join(" · ")||"Indonesia"
  const avatar=participant.avatar_url||entry.avatar_url||""

  try{
    const arena=await loadCanvasImage("/images/hero-bg.png?v=challenge-v3")
    cover(ctx,arena,0,0,WIDTH,HEIGHT)
  }catch{
    const bg=ctx.createLinearGradient(0,0,0,HEIGHT)
    bg.addColorStop(0,"#031126")
    bg.addColorStop(.55,"#071a38")
    bg.addColorStop(1,"#020617")
    ctx.fillStyle=bg
    ctx.fillRect(0,0,WIDTH,HEIGHT)
  }

  const shade=ctx.createLinearGradient(0,0,0,HEIGHT)
  shade.addColorStop(0,"rgba(1,5,18,.18)")
  shade.addColorStop(.48,"rgba(1,6,19,.24)")
  shade.addColorStop(1,"rgba(1,5,18,.78)")
  ctx.fillStyle=shade
  ctx.fillRect(0,0,WIDTH,HEIGHT)

  const heroGlow=ctx.createRadialGradient(540,790,70,540,790,620)
  heroGlow.addColorStop(0,"rgba(245,158,11,.30)")
  heroGlow.addColorStop(.42,"rgba(59,130,246,.16)")
  heroGlow.addColorStop(1,"rgba(2,8,23,0)")
  ctx.fillStyle=heroGlow
  ctx.fillRect(0,240,WIDTH,1160)

  try{
    const logo=await loadCanvasImage("/brand/alvaza-logo-new.svg")
    ctx.drawImage(logo,476,42,128,128)
  }catch{}

  ctx.textAlign="center"
  ctx.fillStyle="#fff"
  ctx.font="900 50px Arial, sans-serif"
  ctx.fillText("ALZAVA",540,220)
  ctx.fillStyle="#fbbf24"
  ctx.font="800 30px Arial, sans-serif"
  ctx.fillText("BATTLE POINT",540,260)

  ctx.fillStyle="#67e8f9"
  ctx.font="900 22px Arial, sans-serif"
  ctx.fillText("COMPETITIVE BRAIN GAME INDONESIA",540,318)

  ctx.save()
  ctx.lineJoin="round"
  ctx.font="italic 900 68px Arial, sans-serif"
  ctx.strokeStyle="rgba(0,0,0,.75)"
  ctx.lineWidth=18
  ctx.strokeText("SKOR INI",540,420)
  ctx.strokeStyle="rgba(30,64,175,.85)"
  ctx.lineWidth=7
  ctx.strokeText("SKOR INI",540,420)
  ctx.fillStyle="#f8fafc"
  ctx.fillText("SKOR INI",540,420)

  const titleGradient=ctx.createLinearGradient(180,0,900,0)
  titleGradient.addColorStop(0,"#f59e0b")
  titleGradient.addColorStop(.48,"#fff4b5")
  titleGradient.addColorStop(1,"#f59e0b")
  ctx.font="italic 900 96px Arial, sans-serif"
  ctx.strokeStyle="rgba(0,0,0,.82)"
  ctx.lineWidth=22
  ctx.strokeText("SULIT DIKEJAR!",540,520)
  ctx.strokeStyle="#92400e"
  ctx.lineWidth=8
  ctx.strokeText("SULIT DIKEJAR!",540,520)
  ctx.fillStyle=titleGradient
  ctx.shadowColor="rgba(251,191,36,.38)"
  ctx.shadowBlur=18
  ctx.fillText("SULIT DIKEJAR!",540,520)
  ctx.restore()

  // Previous premium styling restored; only the panel border is lowered slightly so it does not touch the headline or Battle Point label.
  const heroX=150
  const heroY=620
  const heroW=780
  const heroH=572
  const frameGradient=ctx.createLinearGradient(heroX,heroY,heroX+heroW,heroY+heroH)
  frameGradient.addColorStop(0,"rgba(8,31,64,.68)")
  frameGradient.addColorStop(.52,"rgba(3,12,32,.76)")
  frameGradient.addColorStop(1,"rgba(20,11,4,.72)")
  ctx.save()
  ctx.shadowColor="rgba(251,191,36,.72)"
  ctx.shadowBlur=48
  ctx.fillStyle=frameGradient
  ctx.strokeStyle="#fbbf24"
  ctx.lineWidth=10
  roundRectPath(ctx,heroX,heroY,heroW,heroH,58)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.strokeStyle="rgba(255,247,194,.62)"
  ctx.lineWidth=3
  roundRectPath(ctx,heroX+13,heroY+13,heroW-26,heroH-26,47)
  ctx.stroke()
  const heroShine=ctx.createLinearGradient(heroX,heroY,heroX+heroW,heroY)
  heroShine.addColorStop(0,"rgba(255,255,255,0)")
  heroShine.addColorStop(.5,"rgba(255,248,203,.95)")
  heroShine.addColorStop(1,"rgba(255,255,255,0)")
  ctx.strokeStyle=heroShine
  ctx.lineWidth=5
  ctx.beginPath()
  ctx.moveTo(heroX+150,heroY+18)
  ctx.lineTo(heroX+heroW-150,heroY+18)
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(540,760,124,0,Math.PI*2)
  ctx.clip()
  if(avatar){
    try{
      const img=await loadCanvasImage(avatar)
      const scale=Math.max(248/img.naturalWidth,248/img.naturalHeight)
      const sw=248/scale
      const sh=248/scale
      ctx.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,416,636,248,248)
    }catch{
      ctx.fillStyle="#7f1d1d"
      ctx.fillRect(416,636,248,248)
    }
  }else{
    ctx.fillStyle="#4338ca"
    ctx.fillRect(416,636,248,248)
  }
  ctx.restore()

  ctx.save()
  ctx.shadowColor="rgba(251,191,36,.70)"
  ctx.shadowBlur=30
  ctx.strokeStyle="#fbbf24"
  ctx.lineWidth=10
  ctx.beginPath()
  ctx.arc(540,760,130,0,Math.PI*2)
  ctx.stroke()
  ctx.strokeStyle="rgba(255,247,194,.82)"
  ctx.lineWidth=3
  ctx.beginPath()
  ctx.arc(540,760,119,0,Math.PI*2)
  ctx.stroke()
  ctx.restore()

  if(!avatar){
    ctx.fillStyle="#fff"
    ctx.font="900 72px Arial, sans-serif"
    ctx.fillText(initials(nickname),540,784)
  }

  const nameSize=fitFont(ctx,nickname,650,54,34)
  ctx.fillStyle="#fff"
  ctx.font=`900 ${nameSize}px Arial, sans-serif`
  ctx.fillText(nickname,540,952)

  const regionSize=fitFont(ctx,region,690,26,18)
  ctx.fillStyle="#cbd5e1"
  ctx.font=`700 ${regionSize}px Arial, sans-serif`
  ctx.fillText(region,540,995)

  ctx.save()
  ctx.shadowColor="rgba(251,191,36,.55)"
  ctx.shadowBlur=28
  const scoreGradient=ctx.createLinearGradient(350,0,730,0)
  scoreGradient.addColorStop(0,"#f59e0b")
  scoreGradient.addColorStop(.5,"#fff7c2")
  scoreGradient.addColorStop(1,"#f59e0b")
  ctx.fillStyle=scoreGradient
  ctx.font="900 142px Arial, sans-serif"
  ctx.fillText(score.toLocaleString("id-ID"),540,1120)
  ctx.restore()
  ctx.fillStyle="#fff"
  ctx.font="900 28px Arial, sans-serif"
  ctx.fillText("BATTLE POINT",540,1158)

  const statY=1238
  const statW=286
  const statH=176
  const statX=[79,397,715]
  const drawStat=(x:number,label:string,value:string,accent:string)=>{
    const g=ctx.createLinearGradient(x,statY,x+statW,statY+statH)
    g.addColorStop(0,"rgba(5,20,47,.72)")
    g.addColorStop(.58,"rgba(3,12,32,.80)")
    g.addColorStop(1,"rgba(10,10,28,.72)")
    ctx.save()
    ctx.shadowColor=accent
    ctx.shadowBlur=24
    ctx.fillStyle=g
    ctx.strokeStyle=accent
    ctx.lineWidth=6
    roundRectPath(ctx,x,statY,statW,statH,26)
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.strokeStyle="rgba(255,255,255,.30)"
    ctx.lineWidth=2
    roundRectPath(ctx,x+9,statY+9,statW-18,statH-18,19)
    ctx.stroke()
    const shine=ctx.createLinearGradient(x+25,0,x+statW-25,0)
    shine.addColorStop(0,"rgba(255,255,255,0)")
    shine.addColorStop(.5,"rgba(255,255,255,.82)")
    shine.addColorStop(1,"rgba(255,255,255,0)")
    ctx.strokeStyle=shine
    ctx.lineWidth=3
    ctx.beginPath()
    ctx.moveTo(x+48,statY+17)
    ctx.lineTo(x+statW-48,statY+17)
    ctx.stroke()
    ctx.restore()

    ctx.fillStyle=accent
    ctx.font="900 17px Arial, sans-serif"
    ctx.fillText(label.toUpperCase(),x+statW/2,statY+50)
    const valueSize=fitFont(ctx,value,statW-34,44,27)
    ctx.fillStyle="#fff"
    ctx.font=`900 ${valueSize}px Arial, sans-serif`
    ctx.fillText(value,x+statW/2,statY+116)
  }

  drawStat(statX[0],"Pemain",nickname,"#67e8f9")
  drawStat(statX[1],"Rank Nasional",rank?`#${rank}`:"—","#fbbf24")
  drawStat(statX[2],"Ketepatan",`${accuracy}%`,"#c084fc")

  ctx.fillStyle="#fff"
  ctx.font="italic 900 52px Arial, sans-serif"
  ctx.fillText("BISA LEWATI SKORKU?",540,1535)

  const ctaGradient=ctx.createLinearGradient(135,0,945,0)
  ctaGradient.addColorStop(0,"#7c3aed")
  ctaGradient.addColorStop(.5,"#2563eb")
  ctaGradient.addColorStop(1,"#06b6d4")
  ctx.save()
  ctx.shadowColor="rgba(34,211,238,.55)"
  ctx.shadowBlur=34
  ctx.fillStyle=ctaGradient
  ctx.strokeStyle="#67e8f9"
  ctx.lineWidth=5
  ctx.beginPath()
  ctx.roundRect(135,1602,810,122,61)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  ctx.fillStyle="#fff"
  ctx.font="900 35px Arial, sans-serif"
  ctx.fillText("⚔  AYO BATTLE SEKARANG  ›",540,1679)

  ctx.fillStyle="#cbd5e1"
  ctx.font="700 22px Arial, sans-serif"
  ctx.fillText("Buka link yang dibagikan · mulai gratis · buktikan skormu",540,1792)
  ctx.fillStyle="#64748b"
  ctx.font="700 19px Arial, sans-serif"
  ctx.fillText("Raih Poin. Taklukkan Peringkat.",540,1842)

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
    const token=getParticipantToken()
    if(!token){window.location.replace("/account");return}
    Promise.all([loadAccount(token),referralCall<{stats?:ReferralStats}>({action:"stats"},true)])
      .then(async([p,s])=>{
        setParticipant(p||null)
        setStats(s.stats||null)
        const id=p?.public_id||s.stats?.public_id||""
        if(id)setEntry(await loadOfficialEntry(id))
      })
      .catch(e=>setError(e instanceof Error?e.message:"Data tantangan belum dapat dimuat."))
      .finally(()=>setLoading(false))
  },[])

  const publicId=participant?.public_id||stats?.public_id||""
  const score=Number(entry?.battle_score||0)
  const genericLink=useMemo(()=>publicId?buildChallengeUrl(publicId,"share"):"",[publicId])

  async function copyLink(){
    if(!publicId)return
    const link=buildChallengeUrl(publicId,"copy")
    await navigator.clipboard.writeText(link)
    void trackReferralShare("copy")
    setNotice("Link tantangan sudah disalin.")
  }

  async function shareWhatsApp(){
    if(!publicId||!score)return
    const link=buildChallengeUrl(publicId,"whatsapp")
    const text=`🔥 Saya dapat ${score.toLocaleString("id-ID")} Battle Point di ALZAVA. Bisa kalahkan skorku?\n\n${link}`
    void trackReferralShare("whatsapp")
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank","noopener,noreferrer")
  }

  async function downloadCard(){
    if(!participant||!entry||!publicId)return
    const canvas=await buildShareCard(participant,entry)
    const a=document.createElement("a")
    a.href=canvas.toDataURL("image/png",.95)
    a.download=`alzava-battle-point-${(participant.nickname||"player").replace(/[^a-z0-9]+/gi,"-").toLowerCase()}.png`
    a.click()
    setNotice("Kartu tantangan 9:16 berhasil dibuat.")
  }

  async function nativeShare(){
    if(!participant||!entry||!publicId)return
    const link=buildChallengeUrl(publicId,"native")
    const canvas=await buildShareCard(participant,entry)
    const blob=await canvasToBlob(canvas)
    const file=new File([blob],"alzava-battle-point.png",{type:"image/png"})
    const payload={title:"ALZAVA Battle Point",text:`Saya dapat ${score.toLocaleString("id-ID")} Battle Point. Bisa kalahkan skorku?`,url:link,files:[file]}
    void trackReferralShare("native")
    if(navigator.share){
      try{
        if(!navigator.canShare||navigator.canShare({files:[file]}))await navigator.share(payload)
        else await navigator.share({title:payload.title,text:payload.text,url:payload.url})
      }catch{}
    }else{
      await navigator.clipboard.writeText(link)
      setNotice("Link tantangan sudah disalin.")
    }
  }

  if(loading)return <main className="grid min-h-screen place-items-center bg-[#020617] text-slate-300">Menyiapkan link tantangan…</main>

  return <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,.18),transparent_30rem),radial-gradient(circle_at_85%_10%,rgba(99,102,241,.2),transparent_32rem),linear-gradient(180deg,#020617,#07142e_55%,#020617)] px-4 py-8 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a href="/battle" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4"/>Beranda</a>
        <img src="/brand/alvaza-logo-new.svg" alt="ALZAVA" className="h-11 w-11 object-contain"/>
      </div>

      {error&&<div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">{error}</div>}

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <div className="overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07162f]/90 shadow-2xl">
          <div className="bg-gradient-to-br from-indigo-500/20 via-transparent to-cyan-400/10 p-7 text-center sm:p-9">
            <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">Bagikan & Tantang</p>
            <h1 className="mt-3 text-3xl font-black sm:text-5xl">Sebarkan Skormu. Ajak Teman Melewatinya.</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">Kartu challenge memakai gaya visual yang sama dengan kartu hasil, dengan panel transparan premium dan format 9:16 yang aman untuk Status maupun Story.</p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="rounded-[1.7rem] border border-white/10 bg-slate-950/55 p-6 text-center">
              <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-amber-300 bg-indigo-700 text-2xl font-black">
                {participant?.avatar_url?<img src={participant.avatar_url} alt="" className="h-full w-full object-cover"/>:initials(participant?.nickname||"BP")}
              </div>
              <h2 className="mt-4 text-3xl font-black">{participant?.nickname||"Pemain"}</h2>
              <p className="mt-1 text-sm text-slate-500">{[participant?.regency_name,participant?.province_name].filter(Boolean).join(" · ")}</p>
              <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-amber-300/20 bg-amber-300/[.07] p-5">
                <span className="text-xs font-black uppercase tracking-[.17em] text-amber-200">Skor resmi yang ditantang</span>
                <strong className="mt-1 block text-5xl font-black text-amber-300">{score?score.toLocaleString("id-ID"):"—"}</strong>
                <span className="text-xs text-slate-500">Battle Point</span>
              </div>
              {!score&&<p className="mt-4 text-sm text-amber-200">Selesaikan Tes Resmi terlebih dahulu agar link tantangan mempunyai skor resmi.</p>}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.035] p-4">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Link Tantangan Anda</p>
              <div className="mt-2 flex gap-2">
                <input readOnly value={genericLink} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3 text-xs text-slate-300"/>
                <button onClick={()=>void copyLink()} disabled={!publicId} className="grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-950 disabled:opacity-40"><Copy className="h-4 w-4"/></button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button onClick={()=>void shareWhatsApp()} disabled={!score} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-black text-slate-950 disabled:opacity-40"><MessageCircle className="h-5 w-5"/>Bagikan ke WhatsApp</button>
              <button onClick={()=>void nativeShare()} disabled={!score} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 font-black disabled:opacity-40"><Share2 className="h-5 w-5"/>Bagikan Kartu</button>
              <button onClick={()=>void downloadCard()} disabled={!score} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 font-bold text-slate-200 disabled:opacity-40"><Download className="h-5 w-5"/>Unduh Kartu 9:16</button>
              <button onClick={()=>void copyLink()} disabled={!publicId} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 font-bold text-slate-200 disabled:opacity-40"><Link2 className="h-5 w-5"/>Salin Link Tantangan</button>
            </div>

            {notice&&<p className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[.07] px-4 py-3 text-sm font-bold text-emerald-200">{notice}</p>}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-6 shadow-xl">
            <div className="flex items-center gap-2 text-cyan-300"><Users className="h-5 w-5"/><p className="text-xs font-black uppercase tracking-[.18em]">Statistik Referral</p></div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="text-xs text-slate-500">Membuka Link</span><strong className="mt-1 block text-3xl font-black">{Number(stats?.opens||0).toLocaleString("id-ID")}</strong></div>
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="text-xs text-slate-500">Terima Tantangan</span><strong className="mt-1 block text-3xl font-black">{Number(stats?.accepts||0).toLocaleString("id-ID")}</strong></div>
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="text-xs text-slate-500">Peserta Baru</span><strong className="mt-1 block text-3xl font-black text-emerald-300">{Number(stats?.conversions||0).toLocaleString("id-ID")}</strong></div>
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="text-xs text-slate-500">Dibagikan</span><strong className="mt-1 block text-3xl font-black text-violet-300">{Number(stats?.shares||0).toLocaleString("id-ID")}</strong></div>
            </div>
            <div className="mt-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.06] p-4">
              <div className="flex items-end justify-between gap-4"><div><span className="text-xs text-cyan-100/70">Conversion rate</span><strong className="mt-1 block text-3xl font-black text-cyan-200">{Number(stats?.conversion_rate||0).toFixed(1)}%</strong></div><div className="text-right"><span className="text-xs text-slate-500">Sumber terbaik</span><strong className="mt-1 block text-sm font-black text-white">{stats?.top_source||"—"}</strong></div></div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-300/15 bg-gradient-to-br from-amber-300/[.08] to-transparent p-6">
            <Sparkles className="h-6 w-6 text-amber-300"/>
            <h3 className="mt-3 text-xl font-black">Cara paling mudah mulai</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Unduh kartu 9:16 lalu pasang di Status WhatsApp. Sertakan link tantangan di caption agar teman bisa langsung masuk.</p>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300">🔥 Saya dapat <b>{score?score.toLocaleString("id-ID"):"___"} Battle Point</b>.<br/>Bisa kalahkan skorku?<br/>👇 Klik link tantangannya.</div>
          </div>

          <a href="/battle#peringkat" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.035] p-5 hover:bg-white/[.06]"><span className="flex items-center gap-3"><Trophy className="h-5 w-5 text-amber-300"/><span><b className="block">Lihat Peringkat</b><small className="text-slate-500">Cek posisi sebelum membagikan challenge.</small></span></span><span>›</span></a>
        </aside>
      </section>
    </div>
  </main>
}
