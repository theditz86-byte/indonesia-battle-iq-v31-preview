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
  // Scope queries must use the exact region strings stored on the participant, just like buildScopeQuery().
  const regency=profile.regency_name||props.regencyName||""
  const district=profile.district_name||props.districtName||""
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
  const h=170,cut=18
  const path=new Path2D()
  path.moveTo(x+cut,y);path.lineTo(x+w-cut,y);path.lineTo(x+w,y+cut);path.lineTo(x+w,y+h-cut);path.lineTo(x+w-cut,y+h);path.lineTo(x+cut,y+h);path.lineTo(x,y+h-cut);path.lineTo(x,y+cut);path.closePath()

  const g=ctx.createLinearGradient(x,y,x+w,y+h)
  g.addColorStop(0,"rgba(5,20,47,.97)")
  g.addColorStop(.55,"rgba(4,13,34,.95)")
  g.addColorStop(1,"rgba(3,8,24,.98)")
  ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=19;ctx.fillStyle=g;ctx.fill(path);ctx.restore()
  ctx.strokeStyle=accent+"dd";ctx.lineWidth=2.6;ctx.stroke(path)

  ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle=accent;ctx.lineWidth=1.4
  const inset=9,ic=13
  ctx.beginPath()
  ctx.moveTo(x+inset+ic,y+inset);ctx.lineTo(x+w-inset-ic,y+inset);ctx.lineTo(x+w-inset,y+inset+ic)
  ctx.moveTo(x+w-inset,y+h-inset-ic);ctx.lineTo(x+w-inset-ic,y+h-inset);ctx.lineTo(x+inset+ic,y+h-inset);ctx.lineTo(x+inset,y+h-inset-ic)
  ctx.stroke();ctx.restore()

  ctx.globalAlpha=.95;ctx.fillStyle=accent
  ctx.fillRect(x+24,y+24,38,2);ctx.fillRect(x+w-62,y+24,38,2);ctx.fillRect(x+w/2-30,y+23,60,3)
  ctx.globalAlpha=1
  ctx.beginPath();ctx.arc(x+w/2,y+24,8,0,Math.PI*2);ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke()
  ctx.beginPath();ctx.arc(x+w/2,y+24,3,0,Math.PI*2);ctx.fillStyle=accent;ctx.fill()

  ctx.textAlign="center"
  const valueSize=fit(ctx,value,w-28,42,23)
  ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=12;ctx.fillStyle="#f8fafc";ctx.font=`900 ${valueSize}px Arial,sans-serif`;ctx.fillText(value,x+w/2,y+90);ctx.restore()
  ctx.fillStyle="#cbd5e1";ctx.font="800 17px Arial,sans-serif";ctx.fillText(title.toUpperCase(),x+w/2,y+122)

  const bar=ctx.createLinearGradient(x+40,y,x+w-40,y)
  bar.addColorStop(0,"rgba(255,255,255,0)");bar.addColorStop(.5,accent);bar.addColorStop(1,"rgba(255,255,255,0)")
  ctx.fillStyle=bar;ctx.fillRect(x+38,y+143,w-76,3)
  ctx.globalAlpha=.7;ctx.fillStyle=accent;ctx.fillRect(x+21,y+h-17,30,2);ctx.fillRect(x+w-51,y+h-17,30,2);ctx.globalAlpha=1
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

  // Use the approved repository artwork as the real visual foundation.
  try{
    const arena=await loadImage("/images/hero-bg.png?v=cf5")
    cover(ctx,arena,0,0,WIDTH,HEIGHT)
  }catch{
    const bg=ctx.createLinearGradient(0,0,0,HEIGHT);bg.addColorStop(0,"#020817");bg.addColorStop(1,"#02040c");ctx.fillStyle=bg;ctx.fillRect(0,0,WIDTH,HEIGHT)
  }
  const shade=ctx.createLinearGradient(0,0,0,HEIGHT);shade.addColorStop(0,"rgba(1,5,18,.14)");shade.addColorStop(.55,"rgba(1,5,18,.24)");shade.addColorStop(1,"rgba(1,5,18,.72)");ctx.fillStyle=shade;ctx.fillRect(0,0,WIDTH,HEIGHT)
  const heroGlow=ctx.createRadialGradient(540,820,60,540,820,620);heroGlow.addColorStop(0,official?"rgba(245,158,11,.30)":"rgba(34,211,238,.22)");heroGlow.addColorStop(1,"rgba(2,8,23,0)");ctx.fillStyle=heroGlow;ctx.fillRect(0,260,1080,1180)

  // Brand.
  try{const logo=await loadImage("/alzava-emblem-v3.svg");ctx.drawImage(logo,490,52,100,100)}catch{}
  ctx.fillStyle="#fff";ctx.font="900 52px Arial,sans-serif";ctx.fillText("ALZAVA",540,196)
  ctx.fillStyle="#fbbf24";ctx.font="800 30px Arial,sans-serif";ctx.fillText("Battle Point",540,235)

  // Headline: dynamic text only, styled to sit on top of the approved arena art.
  const line1=official?"SKOR INI":"REMATCH"
  const line2=official?"SULIT DIKEJAR!":"HIGH SCORE!"
  ctx.save()
  ctx.font="italic 900 72px Arial,sans-serif"
  ctx.lineJoin="round"
  ctx.strokeStyle="rgba(0,0,0,.75)";ctx.lineWidth=18;ctx.strokeText(line1,540,326)
  ctx.strokeStyle=official?"rgba(180,83,9,.95)":"rgba(30,64,175,.95)";ctx.lineWidth=7;ctx.strokeText(line1,540,326)
  ctx.fillStyle="#f8fafc";ctx.shadowColor="rgba(255,255,255,.35)";ctx.shadowBlur=14;ctx.fillText(line1,540,326)
  ctx.shadowBlur=0
  ctx.font="italic 900 104px Arial,sans-serif"
  for(let off=12;off>=3;off-=3){ctx.fillStyle=official?`rgba(120,53,15,${.18+off/70})`:`rgba(49,46,129,${.18+off/70})`;ctx.fillText(line2,540+off*.28,416+off)}
  const accent=ctx.createLinearGradient(190,0,890,0)
  accent.addColorStop(0,official?"#f59e0b":"#22d3ee");accent.addColorStop(.48,"#fff7bf");accent.addColorStop(1,official?"#f59e0b":"#a855f7")
  ctx.strokeStyle="rgba(0,0,0,.8)";ctx.lineWidth=20;ctx.strokeText(line2,540,416)
  ctx.strokeStyle=official?"#fbbf24":"#67e8f9";ctx.lineWidth=6;ctx.strokeText(line2,540,416)
  ctx.fillStyle=accent;ctx.shadowColor=official?"#f59e0b":"#22d3ee";ctx.shadowBlur=26;ctx.fillText(line2,540,416)
  ctx.restore()

  // Single-scene background: avoid stacking a second full artwork layer behind the score plate.

  // Hero score plate stays dark so the dynamic values remain readable.
  const shield=ctx.createLinearGradient(150,530,930,1180)
  shield.addColorStop(0,official?"rgba(30,18,8,.97)":"rgba(16,10,36,.97)")
  shield.addColorStop(.5,"rgba(7,15,31,.99)")
  shield.addColorStop(1,official?"rgba(27,14,5,.97)":"rgba(4,20,36,.97)")
  ctx.beginPath();ctx.moveTo(190,575);ctx.lineTo(890,575);ctx.lineTo(942,710);ctx.lineTo(890,1112);ctx.lineTo(540,1180);ctx.lineTo(190,1112);ctx.lineTo(138,710);ctx.closePath()
  ctx.fillStyle=shield;ctx.fill();ctx.strokeStyle=official?"#fbbf24":"#67e8f9";ctx.lineWidth=7;ctx.shadowColor=official?"rgba(245,158,11,.55)":"rgba(34,211,238,.48)";ctx.shadowBlur=24;ctx.stroke();ctx.shadowBlur=0

  // Avatar uses the same crown + laurel assets as the podium, not a canvas imitation.
  const ax=540,ay=665,r=105
  let crownAsset:null|HTMLImageElement=null,laurelAsset:null|HTMLImageElement=null
  try{crownAsset=await loadImage(official?"/images/crown-gold.png?v=cf5":"/images/crown-silver.png?v=cf5")}catch{}
  try{laurelAsset=await loadImage(official?"/images/laurel-gold.png?v=cf5":"/images/laurel-silver.png?v=cf5")}catch{}
  if(laurelAsset){ctx.save();ctx.shadowColor=official?"#fbbf24":"#67e8f9";ctx.shadowBlur=22;ctx.drawImage(laurelAsset,365,490,350,350);ctx.restore()}
  ctx.save();ctx.beginPath();ctx.arc(ax,ay,r,0,Math.PI*2);ctx.clip()
  if(profile.avatar_url){
    try{const av=await loadImage(profile.avatar_url);cover(ctx,av,ax-r,ay-r,r*2,r*2);qa.avatar="photo"}
    catch{drawFallbackAvatar(ctx,props.nickname,ax,ay,r);qa.warnings.push("avatar_fallback")}
  }else{drawFallbackAvatar(ctx,props.nickname,ax,ay,r);qa.warnings.push("avatar_missing")}
  ctx.restore()
  ctx.save();ctx.strokeStyle=official?"#fde68a":"#cbd5e1";ctx.lineWidth=7;ctx.shadowColor=official?"#f59e0b":"#67e8f9";ctx.shadowBlur=20;ctx.beginPath();ctx.arc(ax,ay,r+4,0,Math.PI*2);ctx.stroke();ctx.restore()
  if(crownAsset){ctx.save();ctx.shadowColor=official?"#f59e0b":"#cbd5e1";ctx.shadowBlur=22;ctx.drawImage(crownAsset,470,455,140,140);ctx.restore()}
  if(official&&props.nationalRank){
    const badgeY=790
    const med=ctx.createLinearGradient(500,badgeY-36,580,badgeY+36);med.addColorStop(0,"#fff7bf");med.addColorStop(.45,"#fbbf24");med.addColorStop(1,"#b45309")
    ctx.save();ctx.shadowColor="#f59e0b";ctx.shadowBlur=18;ctx.fillStyle=med;ctx.beginPath();ctx.arc(540,badgeY,38,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fff1a8";ctx.lineWidth=4;ctx.stroke();ctx.fillStyle="#7c2d12";ctx.font="900 31px Arial,sans-serif";ctx.fillText(String(props.nationalRank),540,badgeY+11);ctx.restore()
  }

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

  // Four data tiles mirror the approved reference; only their values are dynamic.
  {
    const w=232,gap=16,start=52,y=1218
    const displayName=props.nickname.length>12?props.nickname.slice(0,11)+"…":props.nickname
    smallPanel(ctx,start,y,w,"Pemain",displayName,"#22d3ee")
    if(official){
      smallPanel(ctx,start+w+gap,y,w,localRank?localLabel:"Ketepatan",localRank?`#${localRank}`:`${accuracy}%`,"#fbbf24")
      const provinceRank=ranks.province
      smallPanel(ctx,start+(w+gap)*2,y,w,provinceRank?(province||"Provinsi"):"Indonesia",provinceRank?`#${provinceRank}`:(props.nationalRank?`#${props.nationalRank}`:(topPercent?`Top ${topPercent}%`:"Top —")),"#a78bfa")
    }else{
      smallPanel(ctx,start+w+gap,y,w,"Ketepatan",`${accuracy}%`,"#22d3ee")
      smallPanel(ctx,start+(w+gap)*2,y,w,"Mode","REMATCH","#a78bfa")
    }
    smallPanel(ctx,start+(w+gap)*3,y,w,"Musim",seasonLabel(props.submittedAt),"#22d3ee")
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
  // Footer intentionally left clean for WhatsApp / Instagram safe area.

  if(ctx.measureText(props.nickname).width>860)qa.warnings.push("name_overflow")
  return {canvas,qa}
}

function canvasBlob(canvas:HTMLCanvasElement){
  return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("PNG gagal dibuat")),"image/png",.98))
}

export default function ResultShareCard(props:Props){
  const [open,setOpen]=useState(false)
  const [preview,setPreview]=useState("")
  const [loading,setLoading]=useState(false)
  const [,setQa]=useState<QaReport|null>(null)

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
        <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={save} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"><Download className="h-4 w-4"/>Simpan PNG</button><button onClick={share} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-black text-white"><Share2 className="h-4 w-4"/>Bagikan</button></div>
      </div>
    </div>}
  </>
}
