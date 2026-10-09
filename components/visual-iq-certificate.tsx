"use client"

import { Download, Printer, Share2, X } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import shell0 from "@/components/certificate-shell-data-0"
import shell1 from "@/components/certificate-shell-data-1"
import shell2 from "@/components/certificate-shell-data-2"
import shell3 from "@/components/certificate-shell-data-3"
import shell4 from "@/components/certificate-shell-data-4"
import shell5 from "@/components/certificate-shell-data-5"
import shell6 from "@/components/certificate-shell-data-6"
import shell7 from "@/components/certificate-shell-data-7"

const CERTIFICATE_SHELL="data:image/webp;base64,"+[shell0,shell1,shell2,shell3,shell4,shell5,shell6,shell7].join("")

export type VisualIqCertificateData = {
  participantName: string
  iqScore: number
  iqLevel: string
  createdAt?: string
  attemptId?: string
  rank?: number | null
  total?: number | null
  percentile?: number | null
}

function certificateId(data:VisualIqCertificateData){
  const year=new Date(data.createdAt||Date.now()).getFullYear()
  const suffix=(data.attemptId||"ALZAVA").replace(/-/g,"").slice(0,8).toUpperCase()
  return `ABP-IQ-${year}-${suffix}`
}
function certificateDate(value?:string){
  return new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"long",year:"numeric"}).format(value?new Date(value):new Date())
}
function confidence(iq:number){
  return `${Math.max(70,iq-5)} – ${Math.min(160,iq+5)}`
}
function achievement(data:VisualIqCertificateData){
  if(data.rank&&data.total){
    if(data.total>=20&&data.percentile)return `TOP ${Math.max(1,data.percentile)}%`
    return `RANK #${data.rank}/${data.total}`
  }
  return "HASIL TERSIMPAN"
}
function displayName(value:string){
  const clean=value.trim()||"Peserta ALZAVA"
  return clean.toLowerCase().replace(/(^|\s)(\S)/g,(_,space:string,char:string)=>space+char.toUpperCase())
}
function safeFileName(name:string){
  return "sertifikat-iq-"+name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+".png"
}
function nameSize(name:string){
  if(name.length>30)return 56
  if(name.length>24)return 64
  if(name.length>18)return 74
  return 88
}

function Diamond({x,y,size=10}:{x:number;y:number;size?:number}){
  return <rect x={x-size/2} y={y-size/2} width={size} height={size} transform={`rotate(45 ${x} ${y})`} fill="url(#zipGold)" filter="url(#zipSoftGlow)"/>
}
function Flank({y,leftStart,leftEnd,rightStart,rightEnd}:{y:number;leftStart:number;leftEnd:number;rightStart:number;rightEnd:number}){
  return <>
    <line x1={leftStart} y1={y} x2={leftEnd} y2={y} stroke="url(#zipLine)" strokeWidth="1.8"/>
    <line x1={rightStart} y1={y} x2={rightEnd} y2={y} stroke="url(#zipLine)" strokeWidth="1.8"/>
  </>
}

export function VisualIqCertificate({data,svgRef}:{data:VisualIqCertificateData;svgRef?:React.RefObject<SVGSVGElement|null>}){
  const name=displayName(data.participantName)
  const id=certificateId(data)
  const date=certificateDate(data.createdAt)
  const achievementText=achievement(data)

  return <svg
    ref={svgRef}
    viewBox="0 0 1495 1052"
    width="1495"
    height="1052"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    role="img"
    aria-label={`Sertifikat Tes IQ ${data.participantName}`}
    className="block h-auto w-full"
  >
    <defs>
      <linearGradient id="zipGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff3cf"/>
        <stop offset=".28" stopColor="#f7df99"/>
        <stop offset=".60" stopColor="#d4af37"/>
        <stop offset="1" stopColor="#f7e5ab"/>
      </linearGradient>
      <linearGradient id="zipLine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8b651b" stopOpacity="0"/>
        <stop offset=".22" stopColor="#d4af37"/>
        <stop offset=".5" stopColor="#f6e3b1"/>
        <stop offset=".78" stopColor="#d4af37"/>
        <stop offset="1" stopColor="#8b651b" stopOpacity="0"/>
      </linearGradient>
      <filter id="zipGoldShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity=".65"/>
        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#d4af37" floodOpacity=".18"/>
      </filter>
      <filter id="zipSoftGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#d4af37" floodOpacity=".35"/>
      </filter>
    </defs>

    <image href={CERTIFICATE_SHELL} xlinkHref={CERTIFICATE_SHELL} x="0" y="0" width="1495" height="1052" preserveAspectRatio="none"/>

    {/* ALZAVA brand — exact ZIP hierarchy */}
    <Flank y={110} leftStart={340} leftEnd={574} rightStart={921} rightEnd={1155}/>
    <Diamond x={590} y={110} size={9}/><Diamond x={905} y={110} size={9}/>
    <text x="747.5" y="137" textAnchor="middle" style={{fontFamily:"var(--font-cinzel), Georgia, 'Times New Roman', serif"}} fontSize="62" fontWeight="600" letterSpacing="3" fill="url(#zipGold)" filter="url(#zipGoldShadow)">Alzava</text>
    <text x="747.5" y="169" textAnchor="middle" style={{fontFamily:"var(--font-cinzel), Georgia, serif"}} fontSize="19" fontWeight="600" letterSpacing="8.5" fill="#e4c66d">BATTLE POINT</text>

    {/* Main title */}
    <text x="747.5" y="249" textAnchor="middle" style={{fontFamily:"var(--font-cinzel), Georgia, 'Times New Roman', serif"}} fontSize="72" fontWeight="700" letterSpacing=".7" fill="url(#zipGold)" filter="url(#zipGoldShadow)">Sertifikat Penilaian Kognitif</text>
    <Flank y={280} leftStart={182} leftEnd={351} rightStart={1144} rightEnd={1313}/>
    <text x="747.5" y="287" textAnchor="middle" style={{fontFamily:"var(--font-cinzel), Georgia, serif"}} fontSize="20" fontWeight="600" letterSpacing="7.2" fill="#f6e3b1">CERTIFICATE OF COGNITIVE ASSESSMENT</text>

    {/* Awarded row */}
    <Flank y={333} leftStart={350} leftEnd={541} rightStart={954} rightEnd={1145}/>
    <Diamond x={558} y={333}/><Diamond x={937} y={333}/>
    <text x="747.5" y="341" textAnchor="middle" style={{fontFamily:"var(--font-lora), Georgia, serif"}} fontSize="20" fill="#f9f6e9">Diberikan kepada / Awarded to</text>

    {/* Participant */}
    <text x="747.5" y="432" textAnchor="middle" style={{fontFamily:"var(--font-cinzel), Georgia, 'Times New Roman', serif"}} fontSize={nameSize(name)} fontWeight="700" letterSpacing="1.2" fill="url(#zipGold)" filter="url(#zipGoldShadow)">{name}</text>
    <line x1="330" y1="458" x2="1165" y2="458" stroke="url(#zipLine)" strokeWidth="1.5"/>
    <Diamond x={747.5} y={458} size={10}/>

    {/* Description */}
    <text x="747.5" y="501" textAnchor="middle" style={{fontFamily:"var(--font-lora), Georgia, serif"}} fontSize="21" fill="#f9f6e9">Telah menyelesaikan Tes IQ ALZAVA dan memperoleh hasil</text>

    {/* Score */}
    <text x="747.5" y="648" textAnchor="middle" style={{fontFamily:"var(--font-cinzel), Georgia, 'Times New Roman', serif"}} fontSize="140" fontWeight="700" letterSpacing="-2" fill="url(#zipGold)" filter="url(#zipGoldShadow)">{data.iqScore} IQ</text>

    {/* Text over original ZIP plaque */}
    <text x="747.5" y="704" textAnchor="middle" style={{fontFamily:"var(--font-lora), Georgia, serif"}} fontSize="22" fill="#f9f6e9">Tingkat IQ: <tspan fontWeight="700" fill="#f2d478">{data.iqLevel}</tspan></text>
    <text x="747.5" y="735" textAnchor="middle" style={{fontFamily:"var(--font-lora), Georgia, serif"}} fontSize="18" letterSpacing=".7" fill="#f2eee2">Rentang Kepercayaan: {confidence(data.iqScore)}</text>

    {/* Rank row */}
    <Flank y={794} leftStart={452} leftEnd={562} rightStart={933} rightEnd={1043}/>
    <Diamond x={584} y={794} size={8}/><Diamond x={911} y={794} size={8}/>
    <text x="747.5" y="804" textAnchor="middle" style={{fontFamily:"var(--font-cinzel), Georgia, serif"}} fontSize="25" fontWeight="700" letterSpacing="5.2" fill="url(#zipGold)">{achievementText} • {data.iqLevel.toUpperCase()}</text>

    {/* Date */}
    <text x="290" y="859" textAnchor="middle" style={{fontFamily:"var(--font-lora), Georgia, serif"}} fontSize="18" fill="#f9f6e9">Tanggal: {date}</text>
    <line x1="150" y1="881" x2="280" y2="881" stroke="url(#zipLine)" strokeWidth="1.5"/>
    <Diamond x={290} y={881} size={9}/>
    <line x1="300" y1="881" x2="430" y2="881" stroke="url(#zipLine)" strokeWidth="1.5"/>

    {/* Powered by; actual HN crest is baked from ZIP asset in the shell */}
    <text x="645" y="858" textAnchor="middle" style={{fontFamily:"var(--font-lora), Georgia, serif"}} fontSize="18" fill="#f9f6e9">Powered by:</text>
    <text x="645" y="902" textAnchor="middle" style={{fontFamily:"var(--font-lora), Georgia, serif"}} fontSize="40" fontWeight="700" fill="#f9f6e9">HN FC</text>
    <line x1="752" y1="832" x2="752" y2="947" stroke="#d4af37" strokeOpacity=".7" strokeWidth="1"/>
    <Diamond x={752} y={889} size={8}/>

    {/* Certificate ID */}
    <text x="1205" y="859" textAnchor="middle" style={{fontFamily:"var(--font-lora), Georgia, serif"}} fontSize="18" fill="#f9f6e9">ID Sertifikat: {id}</text>
    <line x1="1065" y1="881" x2="1195" y2="881" stroke="url(#zipLine)" strokeWidth="1.5"/>
    <Diamond x={1205} y={881} size={9}/>
    <line x1="1215" y1="881" x2="1345" y2="881" stroke="url(#zipLine)" strokeWidth="1.5"/>

    {/* Motto */}
    <Flank y={990} leftStart={378} leftEnd={548} rightStart={947} rightEnd={1117}/>
    <Diamond x={566} y={990} size={7}/><Diamond x={929} y={990} size={7}/>
    <text x="747.5" y="995" textAnchor="middle" style={{fontFamily:"var(--font-cinzel), Georgia, serif"}} fontSize="13" fontWeight="600" letterSpacing="4.2" fill="#f6e3b1">LEBIH TAJAM PIKIRAN, LEBIH TINGGI POTENSI</text>
  </svg>
}

async function svgToPng(svg:SVGSVGElement){
  const xml=new XMLSerializer().serializeToString(svg)
  const blob=new Blob([xml],{type:"image/svg+xml;charset=utf-8"})
  const url=URL.createObjectURL(blob)
  try{
    const image=new Image()
    image.decoding="async"
    await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error("image_load_failed"));image.src=url})
    const canvas=document.createElement("canvas")
    canvas.width=1495
    canvas.height=1052
    const ctx=canvas.getContext("2d")
    if(!ctx)throw new Error("canvas_unavailable")
    ctx.drawImage(image,0,0,1495,1052)
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("png_failed")),"image/png",.96))
  }finally{
    URL.revokeObjectURL(url)
  }
}

export function VisualIqCertificateModal({
  open,onClose,data,onShareResult
}:{
  open:boolean
  onClose:()=>void
  data:VisualIqCertificateData
  onShareResult?:()=>Promise<string|void>|string|void
}){
  const svgRef=useRef<SVGSVGElement|null>(null)
  const [message,setMessage]=useState("")
  const shareText=useMemo(()=>`Sertifikat Tes IQ ALZAVA — ${data.participantName}, IQ ${data.iqScore} (${data.iqLevel}).`,[data])

  if(!open)return null

  async function makePng(){
    if(!svgRef.current)throw new Error("certificate_not_ready")
    return await svgToPng(svgRef.current)
  }
  async function download(){
    setMessage("")
    try{
      const blob=await makePng()
      const url=URL.createObjectURL(blob)
      const a=document.createElement("a")
      a.href=url
      a.download=safeFileName(data.participantName)
      document.body.appendChild(a);a.click();a.remove()
      window.setTimeout(()=>URL.revokeObjectURL(url),1500)
      setMessage("Sertifikat PNG siap.")
    }catch{setMessage("Sertifikat belum dapat dibuat. Coba lagi.")}
  }
  async function share(){
    setMessage("")
    try{
      const blob=await makePng()
      const file=new File([blob],safeFileName(data.participantName),{type:"image/png"})
      if(navigator.share&&navigator.canShare?.({files:[file]})){
        await navigator.share({title:"Sertifikat Tes IQ ALZAVA",text:shareText,files:[file]})
        setMessage("Sertifikat siap dibagikan.")
        return
      }
      if(navigator.share){
        await navigator.share({title:"Sertifikat Tes IQ ALZAVA",text:shareText,url:window.location.origin+"/visual-iq/"})
        setMessage("Tautan hasil siap dibagikan.")
        return
      }
      await download()
    }catch{setMessage("")}
  }
  function printCertificate(){
    setMessage("")
    if(!svgRef.current){setMessage("Sertifikat belum siap dicetak.");return}
    try{
      const svg=new XMLSerializer().serializeToString(svgRef.current)
      const printWindow=window.open("","_blank","width=1200,height=900")
      if(!printWindow){setMessage("Izinkan pop-up untuk mencetak sertifikat.");return}
      try{printWindow.opener=null}catch{}
      printWindow.document.open()
      printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Sertifikat Tes IQ ALZAVA</title><style>@page{size:A4 landscape;margin:0}html,body{margin:0;background:#fff}body{display:grid;place-items:center;min-height:100vh}svg{width:100%;height:auto;max-height:100vh;display:block}@media print{html,body{width:297mm;height:210mm}svg{width:297mm;height:209mm}}</style></head><body>${svg}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),180));<\/script></body></html>`)
      printWindow.document.close();printWindow.focus()
      setMessage("Jendela cetak sertifikat dibuka.")
    }catch{setMessage("Sertifikat belum dapat dicetak. Coba lagi.")}
  }
  async function shareResult(){
    if(!onShareResult)return
    setMessage("")
    try{
      const result=await onShareResult()
      setMessage(typeof result==="string"&&result?result:"Hasil siap dibagikan.")
    }catch{setMessage("Hasil belum dapat dibagikan.")}
  }

  return <div className="fixed inset-0 z-[250] overflow-y-auto bg-[#020617]/90 px-3 py-5 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Sertifikat Tes IQ">
    <div className="mx-auto max-w-6xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-amber-300">Sertifikat Tes IQ</p><p className="mt-1 text-sm text-slate-400">Powered by HN FC</p></div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.06] text-white"><X className="h-5 w-5"/></button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-amber-300/20 bg-slate-950 shadow-[0_30px_100px_rgba(0,0,0,.55)]">
        <VisualIqCertificate data={data} svgRef={svgRef}/>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {onShareResult&&<button type="button" onClick={()=>void shareResult()} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/[.08] px-4 text-sm font-black text-cyan-100"><Share2 className="h-4 w-4"/>Bagikan Hasil</button>}
        <button type="button" onClick={()=>void share()} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 px-4 text-sm font-black text-slate-950"><Share2 className="h-4 w-4"/>Bagikan Sertifikat</button>
        <button type="button" onClick={printCertificate} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/[.07] px-4 text-sm font-black text-amber-100"><Printer className="h-4 w-4"/>Cetak Sertifikat</button>
        <button type="button" onClick={()=>void download()} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-4 text-sm font-black text-white"><Download className="h-4 w-4"/>Unduh PNG</button>
      </div>
      {message&&<p className="mt-2 text-center text-xs font-bold text-cyan-200">{message}</p>}
    </div>
  </div>
}
