"use client"

import { useEffect, useRef, useState } from "react"
import { Download, Share2, X } from "lucide-react"
import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"

const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"
const SITE_URL = "https://alzava-battle-iq.pages.dev"

type Profile = {
  avatar_url?: string
  province_name?: string
  regency_name?: string
  district_name?: string
}

type Props = {
  nickname: string
  participantPublicId?: string
  battlePoint: number
  correctCount: number
  questionCount: number
  durationMs: number
  nationalRank?: number
  leaderboardTotal?: number
  provinceName?: string
  regencyName?: string
  districtName?: string
  submittedAt?: string
  rankedAttempt?: boolean
  autoOpen?: boolean
  debugQa?: boolean
  demoProfile?: Profile
}

function initials(name:string){
  return (name||"P").split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]?.toUpperCase()).join("")||"BP"
}

function cleanRegion(value?:string){
  return String(value||"").trim().replace(/^kabupaten\s+/i,"Kabupaten ").replace(/^kab\.\s*/i,"Kabupaten ").replace(/\s+/g," ")
}

async function loadImage(url:string){
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

async function loadProfile(demo?:Profile):Promise<Profile>{
  if(demo)return demo
  const token=getParticipantToken()
  if(!token)return {}
  try{
    const response=await fetch(ACCOUNT_API,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:JSON.stringify({action:"me"}),cache:"no-store"})
    const data=await response.json().catch(()=>({}))
    return response.ok?(data?.participant||{}):{}
  }catch{return {}}
}

async function trackShare(){
  const token=getParticipantToken()
  try{
    await fetch(BATTLE_API_URL,{method:"POST",headers:{"Content-Type":"application/json",...(token?{"X-Battle-Token":token}:{})},body:JSON.stringify({action:"track",event_type:"result_share",details:{surface:"result_card"}})})
  }catch{}
}

function canvasToBlob(canvas:HTMLCanvasElement){
  return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Kartu belum dapat dibuat.")),"image/png",.95))
}

async function buildCard(props:Props){
  const WIDTH=1080
  const HEIGHT=1920
  const canvas=document.createElement("canvas")
  canvas.width=WIDTH
  canvas.height=HEIGHT
  const ctx=canvas.getContext("2d")
  if(!ctx)throw new Error("Canvas tidak tersedia.")

  const profile=await loadProfile(props.demoProfile)
  const nickname=props.nickname||"Pemain"
  const score=Math.max(0,Number(props.battlePoint||0))
  const accuracy=props.questionCount?Math.round(Number(props.correctCount||0)/Number(props.questionCount)*100):0
  const rank=Math.max(0,Number(props.nationalRank||0))
  const region=[cleanRegion(props.regencyName||profile.regency_name),props.provinceName||profile.province_name].filter(Boolean).join(" · ")||"Indonesia"
  const avatar=profile.avatar_url||""

  try{
    const arena=await loadImage("/images/hero-bg.png?v=challenge-v3")
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

  const glow=ctx.createRadialGradient(540,790,70,540,790,620)
  glow.addColorStop(0,"rgba(245,158,11,.30)")
  glow.addColorStop(.42,"rgba(59,130,246,.16)")
  glow.addColorStop(1,"rgba(2,8,23,0)")
  ctx.fillStyle=glow
  ctx.fillRect(0,240,WIDTH,1160)

  try{
    const logo=await loadImage("/brand/alvaza-logo-new.svg")
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

  const heroX=150,heroY=620,heroW=780,heroH=620
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
  ctx.fill();ctx.stroke();ctx.restore()

  ctx.save()
  ctx.strokeStyle="rgba(255,247,194,.62)"
  ctx.lineWidth=3
  roundRectPath(ctx,heroX+13,heroY+13,heroW-26,heroH-26,47)
  ctx.stroke()
  const shine=ctx.createLinearGradient(heroX,heroY,heroX+heroW,heroY)
  shine.addColorStop(0,"rgba(255,255,255,0)")
  shine.addColorStop(.5,"rgba(255,248,203,.95)")
  shine.addColorStop(1,"rgba(255,255,255,0)")
  ctx.strokeStyle=shine
  ctx.lineWidth=5
  ctx.beginPath();ctx.moveTo(heroX+150,heroY+18);ctx.lineTo(heroX+heroW-150,heroY+18);ctx.stroke();ctx.restore()

  let avatarOk=false
  ctx.save()
  ctx.beginPath();ctx.arc(540,792,124,0,Math.PI*2);ctx.clip()
  if(avatar){
    try{
      const img=await loadImage(avatar)
      const scale=Math.max(248/img.naturalWidth,248/img.naturalHeight)
      const sw=248/scale,sh=248/scale
      ctx.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,416,668,248,248)
      avatarOk=true
    }catch{}
  }
  if(!avatarOk){
    const av=ctx.createLinearGradient(416,668,664,916)
    av.addColorStop(0,"#0ea5e9");av.addColorStop(.5,"#4f46e5");av.addColorStop(1,"#7c3aed")
    ctx.fillStyle=av;ctx.fillRect(416,668,248,248)
  }
  ctx.restore()

  ctx.save()
  ctx.shadowColor="rgba(251,191,36,.70)"
  ctx.shadowBlur=30
  ctx.strokeStyle="#fbbf24"
  ctx.lineWidth=10
  ctx.beginPath();ctx.arc(540,792,130,0,Math.PI*2);ctx.stroke()
  ctx.strokeStyle="rgba(255,247,194,.82)"
  ctx.lineWidth=3
  ctx.beginPath();ctx.arc(540,792,119,0,Math.PI*2);ctx.stroke();ctx.restore()

  if(!avatarOk){
    ctx.fillStyle="#fff"
    ctx.font="900 72px Arial, sans-serif"
    ctx.fillText(initials(nickname),540,816)
  }

  const nameSize=fitFont(ctx,nickname,650,54,34)
  ctx.fillStyle="#fff"
  ctx.font=`900 ${nameSize}px Arial, sans-serif`
  ctx.fillText(nickname,540,984)

  const regionSize=fitFont(ctx,region,690,26,18)
  ctx.fillStyle="#cbd5e1"
  ctx.font=`700 ${regionSize}px Arial, sans-serif`
  ctx.fillText(region,540,1027)

  ctx.save()
  ctx.shadowColor="rgba(251,191,36,.55)"
  ctx.shadowBlur=28
  const scoreGradient=ctx.createLinearGradient(350,0,730,0)
  scoreGradient.addColorStop(0,"#f59e0b")
  scoreGradient.addColorStop(.5,"#fff7c2")
  scoreGradient.addColorStop(1,"#f59e0b")
  ctx.fillStyle=scoreGradient
  ctx.font="900 142px Arial, sans-serif"
  ctx.fillText(score.toLocaleString("id-ID"),540,1156)
  ctx.restore()
  ctx.fillStyle="#fff"
  ctx.font="900 28px Arial, sans-serif"
  ctx.fillText("BATTLE POINT",540,1196)

  const statY=1280,statW=286,statH=176
  const drawStat=(x:number,label:string,value:string,accent:string)=>{
    const g=ctx.createLinearGradient(x,statY,x+statW,statY+statH)
    g.addColorStop(0,"rgba(5,20,47,.72)")
    g.addColorStop(.58,"rgba(3,12,32,.80)")
    g.addColorStop(1,"rgba(10,10,28,.72)")
    ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=24;ctx.fillStyle=g;ctx.strokeStyle=accent;ctx.lineWidth=6
    roundRectPath(ctx,x,statY,statW,statH,26);ctx.fill();ctx.stroke();ctx.restore()
    ctx.save();ctx.strokeStyle="rgba(255,255,255,.30)";ctx.lineWidth=2
    roundRectPath(ctx,x+9,statY+9,statW-18,statH-18,19);ctx.stroke()
    const hi=ctx.createLinearGradient(x+25,0,x+statW-25,0)
    hi.addColorStop(0,"rgba(255,255,255,0)");hi.addColorStop(.5,"rgba(255,255,255,.82)");hi.addColorStop(1,"rgba(255,255,255,0)")
    ctx.strokeStyle=hi;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+48,statY+17);ctx.lineTo(x+statW-48,statY+17);ctx.stroke();ctx.restore()
    ctx.fillStyle=accent;ctx.font="900 17px Arial, sans-serif";ctx.fillText(label.toUpperCase(),x+statW/2,statY+50)
    const valueSize=fitFont(ctx,value,statW-34,44,27)
    ctx.fillStyle="#fff";ctx.font=`900 ${valueSize}px Arial, sans-serif`;ctx.fillText(value,x+statW/2,statY+116)
  }

  drawStat(79,"Pemain",nickname,"#67e8f9")
  drawStat(397,"Rank Nasional",rank?`#${rank}`:"—","#fbbf24")
  drawStat(715,"Ketepatan",`${accuracy}%`,"#c084fc")

  ctx.fillStyle="#fff"
  ctx.font="italic 900 52px Arial, sans-serif"
  ctx.fillText("BISA LEWATI SKORKU?",540,1575)

  const cta=ctx.createLinearGradient(135,0,945,0)
  cta.addColorStop(0,"#7c3aed")
  cta.addColorStop(.5,"#2563eb")
  cta.addColorStop(1,"#06b6d4")
  ctx.save();ctx.shadowColor="rgba(34,211,238,.55)";ctx.shadowBlur=34;ctx.fillStyle=cta;ctx.strokeStyle="#67e8f9";ctx.lineWidth=5
  ctx.beginPath();ctx.roundRect(135,1640,810,122,61);ctx.fill();ctx.stroke();ctx.restore()

  ctx.fillStyle="#fff"
  ctx.font="900 35px Arial, sans-serif"
  ctx.fillText("⚔  AYO BATTLE SEKARANG  ›",540,1717)
  ctx.fillStyle="#cbd5e1"
  ctx.font="700 22px Arial, sans-serif"
  ctx.fillText("Buka link yang dibagikan · mulai gratis · buktikan skormu",540,1825)
  ctx.fillStyle="#64748b"
  ctx.font="700 20px Arial, sans-serif"
  ctx.fillText("Raih Poin. Taklukkan Peringkat.",540,1872)

  return canvas
}

export default function ResultShareCard(props:Props){
  const [open,setOpen]=useState(false)
  const [busy,setBusy]=useState(false)
  const [blob,setBlob]=useState<Blob|null>(null)
  const [cardCanvas,setCardCanvas]=useState<HTMLCanvasElement|null>(null)
  const [status,setStatus]=useState("")
  const previewCanvasRef=useRef<HTMLCanvasElement|null>(null)

  async function prepare(){
    setBusy(true)
    setStatus("")
    try{
      const canvas=await buildCard(props)
      const nextBlob=await canvasToBlob(canvas)
      setBlob(nextBlob)
      setCardCanvas(canvas)
      setOpen(true)
    }catch(e){
      setStatus(e instanceof Error?e.message:"Kartu belum dapat dibuat.")
    }finally{
      setBusy(false)
    }
  }

  useEffect(()=>{
    if(props.autoOpen)void prepare()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[props.autoOpen])

  useEffect(()=>{
    if(!open||!cardCanvas)return
    const previewCanvas=previewCanvasRef.current
    if(!previewCanvas)return
    previewCanvas.width=cardCanvas.width
    previewCanvas.height=cardCanvas.height
    const previewCtx=previewCanvas.getContext("2d")
    if(!previewCtx){
      setStatus("Preview belum dapat ditampilkan di browser ini.")
      return
    }
    previewCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height)
    previewCtx.drawImage(cardCanvas,0,0)
  },[open,cardCanvas])

  function download(){
    if(!blob)return
    const a=document.createElement("a")
    a.href=URL.createObjectURL(blob)
    a.download=`alzava-battle-point-${props.nickname.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"pemain"}.png`
    a.click()
    window.setTimeout(()=>URL.revokeObjectURL(a.href),1500)
  }

  async function share(){
    if(!blob)return
    const challenge=props.participantPublicId?`${SITE_URL}/challenge?id=${encodeURIComponent(props.participantPublicId)}`:`${SITE_URL}/battle`
    const file=new File([blob],`alzava-battle-point-${props.nickname}.png`,{type:"image/png"})
    try{
      if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
        await navigator.share({title:`${props.nickname} · ${props.battlePoint} Battle Point`,text:`Bisa lewati ${props.battlePoint} Battle Point milikku?`,url:challenge,files:[file]})
        void trackShare()
        return
      }
      await navigator.clipboard.writeText(challenge)
      setStatus("Link tantangan disalin. Kartu siap dibagikan.")
      void trackShare()
    }catch(e){
      if((e as Error)?.name!=="AbortError")setStatus("Bagikan belum tersedia di browser ini. Gunakan Simpan PNG.")
    }
  }

  return <>
    <button onClick={()=>void prepare()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-xl disabled:opacity-60">
      <Share2 className="h-4 w-4"/>{busy?"Menyiapkan…":"Bagikan Kartu Hasil"}
    </button>

    {open&&(
      <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#07152d] p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between px-1">
            <div><p className="text-sm font-black text-white">Kartu Hasil ALZAVA</p><p className="text-[11px] text-slate-400">Format 9:16 · template final</p></div>
            <button onClick={()=>setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300"><X className="h-4 w-4"/></button>
          </div>
          <canvas ref={previewCanvasRef} aria-label="Preview kartu hasil ALZAVA Battle Point" className="mx-auto block h-auto max-h-[72vh] max-w-full rounded-2xl border border-white/10 bg-slate-950"/>
          {status&&<div className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100">{status}</div>}
          {props.debugQa&&<div className="mt-2 text-[10px] text-slate-500">rank={props.nationalRank||0} · total={props.leaderboardTotal||0} · mode={props.rankedAttempt===false?"rematch":"ranked"} · durasi={props.durationMs||0}ms · submitted={props.submittedAt||"-"}</div>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={download} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"><Download className="h-4 w-4"/>Simpan PNG</button>
            <button onClick={()=>void share()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-black text-white"><Share2 className="h-4 w-4"/>Bagikan</button>
          </div>
        </div>
      </div>
    )}
  </>
}