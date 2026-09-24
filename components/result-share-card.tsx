"use client"

import { useEffect, useState } from "react"
import { Download, Share2, X } from "lucide-react"
import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"

const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"
const SITE_URL = "https://alzava-battle-iq.pages.dev"
const WIDTH = 1080
const HEIGHT = 1920

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

type Profile = {
  avatar_url?: string
  province_code?: string
  province_name?: string
  regency_name?: string
  district_name?: string
}
type Ranks = { district?: number; regency?: number; province?: number }
type QaReport = {
  avatar: "photo" | "fallback"
  region: string
  mode: "ranked" | "rematch"
  warnings: string[]
}

function weekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - start.getTime()) / 86400000) + 1) / 7)
}
function seasonLabel(value?: string) {
  const parsed = value ? new Date(value) : new Date()
  const source = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  const parts = new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(source)
  const v=Object.fromEntries(parts.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]))
  const d=new Date(Date.UTC(Number(v.year),Number(v.month)-1,Number(v.day)))
  return `${v.year}.${String(weekNumber(d)).padStart(2, "0")}`
}
function durationLabel(ms:number){
  const t=Math.max(0,Math.round(ms/1000))
  return `${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`
}
function initials(name:string){
  return (name||"P").split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]?.toUpperCase()).join("")||"P"
}
function normalizeSpace(value?: string){return String(value||"").trim().replace(/\s+/g," ")}
function normalizeRegency(value?: string){
  let v=normalizeSpace(value)
  if(!v) return ""
  v=v.replace(/^(kab\.?\s*){2,}/i,"Kab. ")
  v=v.replace(/^kabupaten\s+/i,"Kab. ")
  v=v.replace(/^kab\s+/i,"Kab. ")
  v=v.replace(/^kab\.\s*/i,"Kab. ")
  v=v.replace(/^(kota\s*){2,}/i,"Kota ")
  v=v.replace(/^kota\s*/i,"Kota ")
  return v.trim()
}
function normalizeDistrict(value?: string){return normalizeSpace(value).replace(/^(kec\.?\s*){2,}/i,"Kec. ")}
function composePlace(regency?: string, province?: string){
  const reg=normalizeRegency(regency)
  const prov=normalizeSpace(province)
  return [reg,prov].filter(Boolean).join(" · ") || "Indonesia"
}
function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function fillRound(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string|CanvasGradient){rr(ctx,x,y,w,h,r);ctx.fillStyle=fill;ctx.fill()}
function strokeRound(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,stroke:string,line=2){rr(ctx,x,y,w,h,r);ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke()}
function fit(ctx:CanvasRenderingContext2D,text:string,max:number,start:number,min=28){
  let s=start
  while(s>min){ctx.font=`900 ${s}px Arial,sans-serif`;if(ctx.measureText(text).width<=max)break;s-=2}
  return s
}
async function loadImage(url:string){
  const img=new Image()
  img.crossOrigin="anonymous"
  img.decoding="async"
  img.referrerPolicy="no-referrer"
  await new Promise<void>((resolve,reject)=>{
    const timer=window.setTimeout(()=>reject(new Error("image_timeout")),8000)
    img.onload=()=>{window.clearTimeout(timer);resolve()}
    img.onerror=()=>{window.clearTimeout(timer);reject(new Error("image_load_failed"))}
    img.src=url
  })
  if(!img.naturalWidth||!img.naturalHeight) throw new Error("image_empty")
  return img
}
function cover(ctx:CanvasRenderingContext2D,img:HTMLImageElement,x:number,y:number,w:number,h:number){
  const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight)
  const sw=w/scale,sh=h/scale
  ctx.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,x,y,w,h)
}
function drawFallbackAvatar(ctx:CanvasRenderingContext2D,name:string,cx:number,cy:number,r:number){
  const g=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r)
  g.addColorStop(0,"#0ea5e9")
  g.addColorStop(.48,"#4f46e5")
  g.addColorStop(1,"#7c3aed")
  ctx.fillStyle=g
  ctx.fillRect(cx-r,cy-r,r*2,r*2)
  ctx.fillStyle="rgba(255,255,255,.08)"
  ctx.beginPath();ctx.arc(cx-r*.2,cy-r*.22,r*.6,0,Math.PI*2);ctx.fill()
  ctx.fillStyle="#fff"
  ctx.textAlign="center"
  ctx.font=`900 ${Math.round(r*.72)}px Arial,sans-serif`
  ctx.fillText(initials(name),cx,cy+r*.24)
}

async function getProfile(demo?:Profile):Promise<Profile>{
  if(demo) return demo
  const token=getParticipantToken(); if(!token)return {}
  try{
    const r=await fetch(ACCOUNT_API,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:JSON.stringify({action:"me"})})
    const d=await r.json()
    return r.ok?(d.participant||{}):{}
  }catch{return {}}
}
async function getRanks(props:Props,profile:Profile):Promise<Ranks>{
  const token=getParticipantToken(); const headers:Record<string,string>=token?{"X-Battle-Token":token}:{}
  const province=profile.province_code||""
  const regency=normalizeRegency(profile.regency_name||props.regencyName)
  const district=normalizeDistrict(profile.district_name||props.districtName)
  const calls:Array<[keyof Ranks,string]> = []
  if(province) calls.push(["province",`province_code=${encodeURIComponent(province)}`])
  if(province&&regency) calls.push(["regency",`province_code=${encodeURIComponent(province)}&regency_name=${encodeURIComponent(regency)}`])
  if(province&&regency&&district) calls.push(["district",`province_code=${encodeURIComponent(province)}&regency_name=${encodeURIComponent(regency)}&district_name=${encodeURIComponent(district)}`])
  const out:Ranks={}
  await Promise.all(calls.map(async([key,q])=>{
    try{
      const r=await fetch(`${BATTLE_API_URL}?${q}`,{headers,cache:"no-store"})
      const d=await r.json()
      const e=Array.isArray(d.entries)?d.entries.find((x:{participant_public_id?:string;scope_rank?:number})=>x.participant_public_id===props.participantPublicId):null
      if(e?.scope_rank)out[key]=Number(e.scope_rank)
    }catch{}
  }))
  return out
}

function smallPanel(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,title:string,value:string,accent="#22d3ee"){
  const g=ctx.createLinearGradient(x,y,x+w,y+154)
  g.addColorStop(0,"rgba(8,26,57,.90)")
  g.addColorStop(1,"rgba(3,11,28,.92)")
  fillRound(ctx,x,y,w,154,22,g)
  strokeRound(ctx,x,y,w,154,22,accent+"88",2)
  ctx.textAlign="center"
  ctx.fillStyle="#94a3b8";ctx.font="800 18px Arial,sans-serif";ctx.fillText(title.toUpperCase(),x+w/2,y+42)
  const valueSize=fit(ctx,value,w-34,38,24)
  ctx.fillStyle="#fff";ctx.font=`900 ${valueSize}px Arial,sans-serif`;ctx.fillText(value,x+w/2,y+94)
  ctx.fillStyle=accent;ctx.fillRect(x+38,y+122,w-76,3)
}

async function buildCard(props:Props):Promise<{canvas:HTMLCanvasElement;qa:QaReport}>{
  const profile=await getProfile(props.demoProfile)
  const official=props.rankedAttempt !== false
  const ranks=official?await getRanks(props,profile):{}
  const qa:QaReport={avatar:"fallback",region:"",mode:official?"ranked":"rematch",warnings:[]}
  const regency=normalizeRegency(props.regencyName||profile.regency_name)
  const province=normalizeSpace(props.provinceName||profile.province_name)
  const district=normalizeDistrict(props.districtName||profile.district_name)
  const place=composePlace(regency,province)
  qa.region=place
  if(/Kab\.\s*Kab\./i.test(place)||/Kota\s+Kota/i.test(place))qa.warnings.push("region_duplicate")

  const canvas=document.createElement("canvas");canvas.width=WIDTH;canvas.height=HEIGHT
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas tidak tersedia")
  ctx.textAlign="center"

  // Background: dark arena with controlled neon. Keep the center clean for readability.
  const bg=ctx.createLinearGradient(0,0,0,HEIGHT)
  bg.addColorStop(0,"#020817");bg.addColorStop(.52,"#07142e");bg.addColorStop(1,"#02040c")
  ctx.fillStyle=bg;ctx.fillRect(0,0,WIDTH,HEIGHT)
  const glow=ctx.createRadialGradient(540,820,70,540,820,650)
  glow.addColorStop(0,official?"rgba(245,158,11,.22)":"rgba(124,58,237,.20)")
  glow.addColorStop(.45,"rgba(14,165,233,.08)");glow.addColorStop(1,"rgba(2,8,23,0)")
  ctx.fillStyle=glow;ctx.fillRect(0,220,1080,1280)
  ctx.save();ctx.globalAlpha=.42
  for(let i=0;i<10;i++){
    const left=i<5, idx=i%5
    ctx.strokeStyle=idx%3===0?"#a855f7":idx%3===1?"#22d3ee":"#2563eb"
    ctx.lineWidth=6;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=18
    ctx.beginPath();ctx.moveTo(left?0:1080,150+idx*112);ctx.lineTo(left?250:830,430+idx*68);ctx.stroke()
  }
  ctx.restore()

  // Brand.
  try{const logo=await loadImage("/alzava-emblem-v3.svg");ctx.drawImage(logo,490,52,100,100)}catch{}
  ctx.fillStyle="#fff";ctx.font="900 52px Arial,sans-serif";ctx.fillText("ALZAVA",540,196)
  ctx.fillStyle="#fbbf24";ctx.font="800 30px Arial,sans-serif";ctx.fillText("Battle Point",540,235)

  // Headline.
  ctx.save();ctx.shadowColor=official?"rgba(245,158,11,.38)":"rgba(124,58,237,.35)";ctx.shadowBlur=24
  ctx.fillStyle="#f8fafc";ctx.font="italic 900 66px Arial,sans-serif";ctx.fillText(official?"SKOR INI":"REMATCH",540,334)
  const accent=ctx.createLinearGradient(220,0,860,0)
  accent.addColorStop(0,official?"#f59e0b":"#22d3ee");accent.addColorStop(.5,"#fff4b8");accent.addColorStop(1,official?"#f59e0b":"#a855f7")
  ctx.fillStyle=accent;ctx.font="italic 900 86px Arial,sans-serif";ctx.fillText(official?"SULIT DIKEJAR!":"HIGH SCORE!",540,415)
  ctx.restore()

  // Hero shield/card.
  const shield=ctx.createLinearGradient(150,530,930,1180)
  shield.addColorStop(0,official?"rgba(30,18,8,.97)":"rgba(16,10,36,.97)")
  shield.addColorStop(.5,"rgba(7,15,31,.99)")
  shield.addColorStop(1,official?"rgba(27,14,5,.97)":"rgba(4,20,36,.97)")
  ctx.beginPath();ctx.moveTo(190,575);ctx.lineTo(890,575);ctx.lineTo(942,710);ctx.lineTo(890,1112);ctx.lineTo(540,1180);ctx.lineTo(190,1112);ctx.lineTo(138,710);ctx.closePath()
  ctx.fillStyle=shield;ctx.fill();ctx.strokeStyle=official?"#fbbf24":"#67e8f9";ctx.lineWidth=7;ctx.shadowColor=official?"rgba(245,158,11,.55)":"rgba(34,211,238,.48)";ctx.shadowBlur=24;ctx.stroke();ctx.shadowBlur=0

  // Avatar + guaranteed fallback.
  const ax=540,ay=665,r=116
  ctx.save();ctx.strokeStyle=official?"#fbbf24":"#67e8f9";ctx.lineWidth=10;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=22;ctx.beginPath();ctx.arc(ax,ay,r+10,0,Math.PI*2);ctx.stroke();ctx.restore()
  ctx.save();ctx.beginPath();ctx.arc(ax,ay,r,0,Math.PI*2);ctx.clip()
  if(profile.avatar_url){
    try{const av=await loadImage(profile.avatar_url);cover(ctx,av,ax-r,ay-r,r*2,r*2);qa.avatar="photo"}
    catch{drawFallbackAvatar(ctx,props.nickname,ax,ay,r);qa.warnings.push("avatar_fallback")}
  }else{drawFallbackAvatar(ctx,props.nickname,ax,ay,r);qa.warnings.push("avatar_missing")}
  ctx.restore()
  ctx.fillStyle=official?"#fbbf24":"#67e8f9";ctx.font="900 64px Arial,sans-serif";ctx.fillText(official?"♛":"✦",ax,520)

  const nameSize=fit(ctx,props.nickname,650,50,30)
  ctx.fillStyle="#fff";ctx.font=`900 ${nameSize}px Arial,sans-serif`;ctx.fillText(props.nickname,540,846)
  ctx.fillStyle="#94a3b8";ctx.font="700 23px Arial,sans-serif";ctx.fillText(place,540,884)

  // Score.
  const scoreGrad=ctx.createLinearGradient(330,930,750,1080)
  scoreGrad.addColorStop(0,official?"#fff7bf":"#cffafe");scoreGrad.addColorStop(.46,official?"#fbbf24":"#67e8f9");scoreGrad.addColorStop(1,official?"#f59e0b":"#a855f7")
  ctx.save();ctx.shadowColor=official?"rgba(245,158,11,.65)":"rgba(34,211,238,.55)";ctx.shadowBlur=34;ctx.fillStyle=scoreGrad;ctx.font="900 170px Arial,sans-serif";ctx.fillText(Number(props.battlePoint||0).toLocaleString("id-ID"),540,1058);ctx.restore()
  ctx.fillStyle="#e2e8f0";ctx.font="800 27px Arial,sans-serif";ctx.fillText("BATTLE POINT",540,1107)
  if(!official){ctx.fillStyle="#94a3b8";ctx.font="700 20px Arial,sans-serif";ctx.fillText("Skor latihan · tidak mengubah klasemen resmi",540,1140)}

  const accuracy=props.questionCount?Math.round(props.correctCount/props.questionCount*100):0
  const topPercent=official&&props.nationalRank&&props.leaderboardTotal?Math.max(1,Math.ceil((props.nationalRank/props.leaderboardTotal)*100)):null
  const localRank=official?(ranks.regency||ranks.district||ranks.province):undefined
  const localLabel=ranks.regency?(regency||"Kab/Kota"):ranks.district?(district||"Kecamatan"):ranks.province?(province||"Provinsi"):"Wilayah"

  // Information strip: Ranked and Rematch intentionally use different hierarchy.
  if(official){
    const w=296,gap=18,start=78,y=1240
    if(localRank)smallPanel(ctx,start,y,w,localLabel,`#${localRank}`,"#fbbf24")
    else smallPanel(ctx,start,y,w,"Ketepatan",`${accuracy}%`,"#fbbf24")
    smallPanel(ctx,start+w+gap,y,w,"Indonesia",props.nationalRank?`#${props.nationalRank}`:(topPercent?`Top ${topPercent}%`:"Top —"),"#a78bfa")
    smallPanel(ctx,start+(w+gap)*2,y,w,"Season",seasonLabel(props.submittedAt),"#22d3ee")
  }else{
    const w=296,gap=18,start=78,y=1240
    smallPanel(ctx,start,y,w,"Ketepatan",`${accuracy}%`,"#22d3ee")
    smallPanel(ctx,start+w+gap,y,w,"Mode","REMATCH","#a78bfa")
    smallPanel(ctx,start+(w+gap)*2,y,w,"Season",seasonLabel(props.submittedAt),"#fbbf24")
  }

  // CTA with more breathing room and a protected footer safe-zone.
  ctx.font="italic 900 50px Arial,sans-serif"
  const ctaA="BISA ",ctaB="LEWATI SKORKU?"
  const totalCta=ctx.measureText(ctaA).width+ctx.measureText(ctaB).width
  const ctaStart=540-totalCta/2
  ctx.textAlign="left";ctx.fillStyle="#fff";ctx.fillText(ctaA,ctaStart,1505)
  ctx.fillStyle="#fbbf24";ctx.fillText(ctaB,ctaStart+ctx.measureText(ctaA).width,1505)
  ctx.textAlign="center"
  const cta=ctx.createLinearGradient(175,0,905,0);cta.addColorStop(0,"#6d28d9");cta.addColorStop(.52,"#4f46e5");cta.addColorStop(1,"#0284c7")
  fillRound(ctx,175,1550,730,108,54,cta);strokeRound(ctx,175,1550,730,108,54,"#67e8f9",4)
  ctx.fillStyle="#fff";ctx.font="900 36px Arial,sans-serif";ctx.fillText("⚔  AYO BATTLE SEKARANG  ›",540,1617)
  ctx.fillStyle="#94a3b8";ctx.font="700 20px Arial,sans-serif";ctx.fillText(`${props.correctCount}/${props.questionCount} benar  ·  ${accuracy}% akurasi  ·  ${durationLabel(props.durationMs)}`,540,1702)
  ctx.fillStyle="#64748b";ctx.font="700 20px Arial,sans-serif";ctx.fillText(SITE_URL.replace("https://",""),540,1770)

  // Subtle crowd starts below the footer safe zone, never over text.
  ctx.save();ctx.globalAlpha=.92;ctx.fillStyle="#01030a"
  for(let i=0;i<12;i++){
    const x=25+i*98,y0=1900-(i%3)*14
    ctx.beginPath();ctx.arc(x,y0-36,19+(i%2)*4,0,Math.PI*2);ctx.fill()
    ctx.beginPath();ctx.moveTo(x-42,y0+40);ctx.quadraticCurveTo(x,y0-18,x+42,y0+40);ctx.closePath();ctx.fill()
  }
  ctx.restore()

  if(ctx.measureText(props.nickname).width>860)qa.warnings.push("name_overflow")
  if(1770>HEIGHT-120)qa.warnings.push("footer_safe_zone")
  return {canvas,qa}
}

function canvasBlob(canvas:HTMLCanvasElement){
  return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("PNG gagal dibuat")),"image/png",.98))
}

export default function ResultShareCard(props:Props){
  const [open,setOpen]=useState(false)
  const [preview,setPreview]=useState("")
  const [loading,setLoading]=useState(false)
  const [qa,setQa]=useState<QaReport|null>(null)

  async function prepare(){
    setLoading(true)
    try{
      const built=await buildCard(props)
      setQa(built.qa)
      const url=built.canvas.toDataURL("image/png",.98)
      setPreview(url)
      return built.canvas
    }finally{setLoading(false)}
  }
  async function show(){setOpen(true);await prepare()}
  async function save(){
    const canvas=await prepare();const blob=await canvasBlob(canvas);const url=URL.createObjectURL(blob)
    const a=document.createElement("a");a.href=url;a.download=`ALZAVA-${props.nickname.replace(/[^a-z0-9]+/gi,"-")}-${props.battlePoint}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)
  }
  async function share(){
    const canvas=await prepare();const blob=await canvasBlob(canvas);const file=new File([blob],`ALZAVA-${props.battlePoint}.png`,{type:"image/png"})
    const challenge=props.participantPublicId?`${SITE_URL}/challenge?id=${encodeURIComponent(props.participantPublicId)}`:SITE_URL
    const text=props.rankedAttempt===false?`Saya meraih ${Number(props.battlePoint).toLocaleString("id-ID")} Battle Point di Rematch ALZAVA. Bisa lewati skorku? ⚔️`:`Saya meraih ${Number(props.battlePoint).toLocaleString("id-ID")} Battle Point resmi di ALZAVA. Bisa lewati skorku? ⚔️`
    try{
      if(navigator.share&&navigator.canShare?.({files:[file]}))await navigator.share({title:"ALZAVA Battle Point",text,url:challenge,files:[file]})
      else if(navigator.share)await navigator.share({title:"ALZAVA Battle Point",text,url:challenge})
      else await save()
    }catch{}
  }

  useEffect(()=>{if(props.autoOpen)void show()},[props.autoOpen])

  return <>
    <button onClick={show} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-lg"><Share2 className="h-4 w-4"/>Bagikan Kartu Hasil</button>
    {open&&<div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-[#07162f] p-4 shadow-2xl sm:max-w-md">
        <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">Preview Share Card</p><p className="mt-1 text-sm font-bold text-white">{props.rankedAttempt===false?"Rematch · Non-Ranked":"Ranked Resmi"}</p></div><button onClick={()=>setOpen(false)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300"><X className="h-4 w-4"/></button></div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">{preview?<img src={preview} alt="Preview kartu hasil ALZAVA" className="h-auto w-full"/>:<div className="grid aspect-[9/16] place-items-center text-sm text-slate-400">{loading?"Merender kartu…":"Preview belum tersedia"}</div>}</div>
        {props.debugQa&&qa&&<div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300"><b className="text-cyan-300">QA:</b> avatar={qa.avatar} · mode={qa.mode} · region={qa.region}{qa.warnings.length?` · warning=${qa.warnings.join(",")}`:" · clean"}</div>}
        <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={save} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"><Download className="h-4 w-4"/>Simpan PNG</button><button onClick={share} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-black text-white"><Share2 className="h-4 w-4"/>Bagikan</button></div>
      </div>
    </div>}
  </>
}
