"use client"

import { useState } from "react"
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
}

type Profile = { avatar_url?: string; province_code?: string; regency_name?: string; district_name?: string }
type Ranks = { district?: number; regency?: number; province?: number }

function weekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - start.getTime()) / 86400000) + 1) / 7)
}
function seasonLabel(value?: string) { const d=value?new Date(value):new Date(); const s=Number.isNaN(d.getTime())?new Date():d; return `${s.getFullYear()}.${String(weekNumber(s)).padStart(2,"0")}` }
function durationLabel(ms:number){const t=Math.max(0,Math.round(ms/1000));return `${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}
function initials(name:string){return (name||"P").split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]?.toUpperCase()).join("")||"P"}
function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function fillRound(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string|CanvasGradient){rr(ctx,x,y,w,h,r);ctx.fillStyle=fill;ctx.fill()}
function strokeRound(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,stroke:string,line=2){rr(ctx,x,y,w,h,r);ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke()}
function fit(ctx:CanvasRenderingContext2D,text:string,max:number,start:number,min=30){let s=start;while(s>min){ctx.font=`900 ${s}px Arial,sans-serif`;if(ctx.measureText(text).width<=max)break;s-=2}return s}
async function image(url:string){const r=await fetch(url);if(!r.ok)throw Error("image");const b=await r.blob();const u=URL.createObjectURL(b);const i=new Image();await new Promise<void>((ok,no)=>{i.onload=()=>ok();i.onerror=()=>no(new Error("image"));i.src=u});setTimeout(()=>URL.revokeObjectURL(u),1200);return i}
function cover(ctx:CanvasRenderingContext2D,i:HTMLImageElement,x:number,y:number,w:number,h:number){const s=Math.max(w/i.width,h/i.height),sw=w/s,sh=h/s;ctx.drawImage(i,(i.width-sw)/2,(i.height-sh)/2,sw,sh,x,y,w,h)}

async function getProfile():Promise<Profile>{
  const token=getParticipantToken(); if(!token)return {}
  try{const r=await fetch(ACCOUNT_API,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:JSON.stringify({action:"me"})});const d=await r.json();return r.ok?(d.participant||{}):{}}catch{return {}}
}
async function getRanks(props:Props,profile:Profile):Promise<Ranks>{
  const token=getParticipantToken(); const headers:Record<string,string>=token?{"X-Battle-Token":token}:{}
  const province=profile.province_code||"", regency=profile.regency_name||props.regencyName||"", district=profile.district_name||props.districtName||""
  const calls:Array<[keyof Ranks,string]> = []
  if(province) calls.push(["province",`province_code=${encodeURIComponent(province)}`])
  if(province&&regency) calls.push(["regency",`province_code=${encodeURIComponent(province)}&regency_name=${encodeURIComponent(regency)}`])
  if(province&&regency&&district) calls.push(["district",`province_code=${encodeURIComponent(province)}&regency_name=${encodeURIComponent(regency)}&district_name=${encodeURIComponent(district)}`])
  const out:Ranks={}
  await Promise.all(calls.map(async([key,q])=>{try{const r=await fetch(`${BATTLE_API_URL}?${q}`,{headers,cache:"no-store"});const d=await r.json();const e=Array.isArray(d.entries)?d.entries.find((x:{participant_public_id?:string;scope_rank?:number})=>x.participant_public_id===props.participantPublicId):null;if(e?.scope_rank)out[key]=Number(e.scope_rank)}catch{}}))
  return out
}

function panel(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,icon:string,big:string,small:string,accent="#22d3ee"){
  const g=ctx.createLinearGradient(x,y,x+w,y+180);g.addColorStop(0,"rgba(4,23,52,.94)");g.addColorStop(1,"rgba(3,11,28,.9)");fillRound(ctx,x,y,w,180,20,g);strokeRound(ctx,x,y,w,180,20,accent+"88",2)
  ctx.textAlign="center";ctx.fillStyle=accent;ctx.font="800 35px Arial,sans-serif";ctx.fillText(icon,x+w/2,y+45);ctx.fillStyle="#fff";ctx.font=`900 ${big.length>13?28:40}px Arial,sans-serif`;ctx.fillText(big,x+w/2,y+100);ctx.fillStyle="#94a3b8";ctx.font="700 21px Arial,sans-serif";ctx.fillText(small,x+w/2,y+138)
}

async function buildCard(props:Props){
  const profile=await getProfile(); const ranks=await getRanks(props,profile)
  const canvas=document.createElement("canvas");canvas.width=WIDTH;canvas.height=HEIGHT;const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas tidak tersedia")
  const bg=ctx.createLinearGradient(0,0,0,HEIGHT);bg.addColorStop(0,"#020817");bg.addColorStop(.48,"#06162e");bg.addColorStop(1,"#02040c");ctx.fillStyle=bg;ctx.fillRect(0,0,WIDTH,HEIGHT)
  const centerGlow=ctx.createRadialGradient(540,870,40,540,870,720);centerGlow.addColorStop(0,"rgba(245,158,11,.24)");centerGlow.addColorStop(.28,"rgba(34,211,238,.10)");centerGlow.addColorStop(.65,"rgba(79,70,229,.08)");centerGlow.addColorStop(1,"rgba(2,8,23,0)");ctx.fillStyle=centerGlow;ctx.fillRect(0,180,1080,1420)
  ctx.save();ctx.globalAlpha=.55;for(let i=0;i<12;i++){const left=i<6;const y=120+i%6*105;ctx.strokeStyle=i%3===0?"#a855f7":i%3===1?"#22d3ee":"#2563eb";ctx.lineWidth=7;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=20;ctx.beginPath();ctx.moveTo(left?0:1080,y);ctx.lineTo(left?260:820,420+(i%6)*70);ctx.stroke()}ctx.restore()
  ctx.save();ctx.globalAlpha=.32;ctx.strokeStyle="#22d3ee";ctx.lineWidth=3;ctx.setLineDash([5,14]);ctx.beginPath();ctx.moveTo(0,670);ctx.bezierCurveTo(220,610,330,740,520,650);ctx.bezierCurveTo(720,560,870,720,1080,630);ctx.stroke();ctx.restore()
  try{const logo=await image("/alzava-emblem-v3.svg");ctx.drawImage(logo,486,52,108,108)}catch{}
  ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="900 54px Arial,sans-serif";ctx.fillText("ALZAVA",540,205);ctx.fillStyle="#fbbf24";ctx.font="800 32px Arial,sans-serif";ctx.fillText("Battle Point",540,244)
  ctx.save();ctx.shadowColor="rgba(245,158,11,.45)";ctx.shadowBlur=30;ctx.fillStyle="#f8fafc";ctx.font="italic 900 72px Arial,sans-serif";ctx.fillText("SKOR INI",540,350);const gold=ctx.createLinearGradient(270,0,810,0);gold.addColorStop(0,"#f59e0b");gold.addColorStop(.5,"#fff1a8");gold.addColorStop(1,"#f59e0b");ctx.fillStyle=gold;ctx.font="italic 900 92px Arial,sans-serif";ctx.fillText("SULIT DIKEJAR!",540,435);ctx.restore()
  const shield=ctx.createLinearGradient(160,560,920,1150);shield.addColorStop(0,"rgba(30,18,8,.98)");shield.addColorStop(.5,"rgba(8,15,29,.98)");shield.addColorStop(1,"rgba(25,13,4,.98)");ctx.beginPath();ctx.moveTo(205,620);ctx.lineTo(875,620);ctx.lineTo(945,760);ctx.lineTo(895,1115);ctx.lineTo(540,1195);ctx.lineTo(185,1115);ctx.lineTo(135,760);ctx.closePath();ctx.fillStyle=shield;ctx.fill();ctx.strokeStyle="#fbbf24";ctx.lineWidth=8;ctx.shadowColor="rgba(245,158,11,.6)";ctx.shadowBlur=28;ctx.stroke();ctx.shadowBlur=0
  const ax=540,ay=665;ctx.save();ctx.strokeStyle="#fbbf24";ctx.lineWidth=11;ctx.shadowColor="#f59e0b";ctx.shadowBlur=28;ctx.beginPath();ctx.arc(ax,ay,132,0,Math.PI*2);ctx.stroke();ctx.restore();for(const side of [-1,1]){ctx.save();ctx.strokeStyle="#fde68a";ctx.lineWidth=7;ctx.beginPath();ctx.arc(ax+side*22,ay+10,170,side<0?1.75:Math.PI+1.39,side<0?Math.PI+1.35:4.53);ctx.stroke();ctx.restore()}
  ctx.save();ctx.beginPath();ctx.arc(ax,ay,120,0,Math.PI*2);ctx.clip();if(profile.avatar_url){try{const av=await image(profile.avatar_url);cover(ctx,av,ax-120,ay-120,240,240)}catch{ctx.fillStyle="#7f1d1d";ctx.fillRect(ax-120,ay-120,240,240)}}else{const a=ctx.createLinearGradient(420,545,660,785);a.addColorStop(0,"#7f1d1d");a.addColorStop(1,"#312e81");ctx.fillStyle=a;ctx.fillRect(ax-120,ay-120,240,240);ctx.fillStyle="#fff";ctx.font="900 72px Arial,sans-serif";ctx.fillText(initials(props.nickname),ax,ay+24)}ctx.restore();ctx.fillStyle="#fbbf24";ctx.font="900 72px Arial,sans-serif";ctx.fillText("♛",ax,520)
  const nameSize=fit(ctx,props.nickname,650,48,30);ctx.fillStyle="#fff";ctx.font=`900 ${nameSize}px Arial,sans-serif`;ctx.fillText(props.nickname,540,850);const place=[props.regencyName?`Kab. ${props.regencyName}`:"",props.provinceName||""].filter(Boolean).join(" · ")||"Indonesia";ctx.fillStyle="#94a3b8";ctx.font="700 24px Arial,sans-serif";ctx.fillText(place,540,892)
  const scoreGrad=ctx.createLinearGradient(350,890,730,1080);scoreGrad.addColorStop(0,"#fff7bf");scoreGrad.addColorStop(.45,"#fbbf24");scoreGrad.addColorStop(1,"#f59e0b");ctx.save();ctx.shadowColor="rgba(245,158,11,.72)";ctx.shadowBlur=38;ctx.fillStyle=scoreGrad;ctx.font="900 176px Arial,sans-serif";ctx.fillText(Number(props.battlePoint||0).toLocaleString("id-ID"),540,1060);ctx.restore();ctx.fillStyle="#e2e8f0";ctx.font="800 28px Arial,sans-serif";ctx.fillText("BATTLE POINT",540,1110)
  const topPercent=props.nationalRank&&props.leaderboardTotal?Math.max(1,Math.ceil((props.nationalRank/props.leaderboardTotal)*100)):null;const localRank=ranks.regency||ranks.district||ranks.province;const localLabel=ranks.regency?`Kab. ${props.regencyName||""}`:ranks.district?(props.districtName||"Kecamatan"):ranks.province?(props.provinceName||"Provinsi"):"Wilayah";const nationalLabel=props.nationalRank?`#${props.nationalRank}`:topPercent?`Top ${topPercent}%`:"Top —"
  const cardW=230,gap=18,start=53,y=1248;panel(ctx,start,y,cardW,"◉",props.nickname.length>12?props.nickname.slice(0,11)+"…":props.nickname,"Nama Pemain","#22d3ee");panel(ctx,start+(cardW+gap),y,cardW,"🏆",localRank?`#${localRank}`:"#—",localLabel,"#fbbf24");panel(ctx,start+(cardW+gap)*2,y,cardW,"↗",nationalLabel,topPercent?`Top ${topPercent}% Indonesia`:"Peringkat Indonesia","#a78bfa");panel(ctx,start+(cardW+gap)*3,y,cardW,"◫",seasonLabel(props.submittedAt),"Season","#22d3ee")
  ctx.fillStyle="#fff";ctx.font="italic 900 54px Arial,sans-serif";ctx.fillText("BISA",390,1535);ctx.fillStyle="#fbbf24";ctx.fillText("LEWATI SKORKU?",650,1535)
  const cta=ctx.createLinearGradient(180,0,900,0);cta.addColorStop(0,"#6d28d9");cta.addColorStop(.52,"#4f46e5");cta.addColorStop(1,"#0284c7");fillRound(ctx,175,1585,730,112,56,cta);strokeRound(ctx,175,1585,730,112,56,"#67e8f9",4);ctx.save();ctx.shadowColor="#22d3ee";ctx.shadowBlur=24;ctx.strokeStyle="#22d3ee";ctx.lineWidth=3;rr(ctx,175,1585,730,112,56);ctx.stroke();ctx.restore();ctx.fillStyle="#fff";ctx.font="900 38px Arial,sans-serif";ctx.fillText("⚔  AYO BATTLE SEKARANG  ›",540,1655)
  const accuracy=props.questionCount?Math.round(props.correctCount/props.questionCount*100):0;ctx.fillStyle="#94a3b8";ctx.font="700 21px Arial,sans-serif";ctx.fillText(`${props.correctCount}/${props.questionCount} benar  ·  ${accuracy}% akurasi  ·  ${durationLabel(props.durationMs)}`,540,1740);ctx.fillStyle="#64748b";ctx.font="700 21px Arial,sans-serif";ctx.fillText(SITE_URL.replace("https://",""),540,1810)
  ctx.fillStyle="#01030a";for(let i=0;i<12;i++){const x=35+i*95,y0=1860-(i%3)*18;ctx.beginPath();ctx.arc(x,y0-55,22+(i%2)*5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(x-46,y0+60);ctx.quadraticCurveTo(x,y0-30,x+46,y0+60);ctx.closePath();ctx.fill()}
  return canvas
}

export default function ResultShareCard(props:Props){
  const [open,setOpen]=useState(false),[preview,setPreview]=useState(""),[busy,setBusy]=useState(false),[copied,setCopied]=useState(false)
  async function prepare(){setBusy(true);try{const c=await buildCard(props);setPreview(c.toDataURL("image/png",.96));setOpen(true)}finally{setBusy(false)}}
  async function blob(){const c=await buildCard(props);return await new Promise<Blob>((ok,no)=>c.toBlob(v=>v?ok(v):no(Error("PNG gagal")),"image/png",.96))}
  async function share(){setBusy(true);try{const b=await blob();const f=new File([b],`ALZAVA-${props.nickname.replace(/[^a-z0-9]+/gi,"-")}-${props.battlePoint}.png`,{type:"image/png"});const url=props.participantPublicId?`${SITE_URL}/challenge?id=${encodeURIComponent(props.participantPublicId)}`:SITE_URL;const text=`Saya meraih ${Number(props.battlePoint).toLocaleString("id-ID")} Battle Point di ALZAVA. Bisa lewati skorku? ⚔️`;if(navigator.canShare?.({files:[f]})&&navigator.share)await navigator.share({title:"ALZAVA Battle Point",text,url,files:[f]});else if(navigator.share)await navigator.share({title:"ALZAVA Battle Point",text,url});else{await navigator.clipboard.writeText(`${text} ${url}`);setCopied(true);setTimeout(()=>setCopied(false),1600)}}catch{}finally{setBusy(false)}}
  async function download(){setBusy(true);try{const b=await blob();const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`ALZAVA-${props.nickname.replace(/[^a-z0-9]+/gi,"-")}-${props.battlePoint}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}finally{setBusy(false)}}
  return <><button onClick={prepare} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 px-4 py-2.5 text-sm font-black text-slate-950 shadow-[0_0_24px_rgba(245,158,11,.28)] disabled:opacity-60"><Share2 className="h-4 w-4"/>{busy?"Menyiapkan…":"Bagikan Kartu Hasil"}</button>{open&&<div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md"><div className="relative w-full max-w-[430px] rounded-[1.75rem] border border-white/10 bg-[#07142e] p-3 shadow-2xl"><button onClick={()=>setOpen(false)} className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white"><X className="h-4 w-4"/></button><img src={preview} alt="Preview kartu hasil ALZAVA Battle Point" className="w-full rounded-2xl"/><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={share} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-black"><Share2 className="h-4 w-4"/>{copied?"Tautan disalin":"Bagikan"}</button><button onClick={download} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black"><Download className="h-4 w-4"/>Simpan PNG</button></div><p className="mt-2 text-center text-[10px] text-slate-500">Format 9:16 · siap untuk Status WhatsApp / Instagram Story</p></div></div>}</>
}
