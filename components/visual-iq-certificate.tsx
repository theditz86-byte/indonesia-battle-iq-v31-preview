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
    <text x="747.5" y="137" textAnchor="middle" style={{fontFamily:"var(--font-cinzel, Georgia), 'Times New Roman', serif"}} fontSize="62" fontWeight="600" letterSpacing="3" fill="url(#zipGold)" filter="url(#zipGoldShadow)">Alzava</text>
    <text x="747.5" y="169" textAnchor="middle" style={{fontFamily:"var(--font-cinzel, Georgia), serif"}} fontSize="19" fontWeight="600" letterSpacing="8.5" fill="#e4c66d">BATTLE POINT</text>

    {/* Main title */}
    <text x="747.5" y="242" textAnchor="middle" style={{fontFamily:"var(--font-cinzel, Georgia), 'Times New Roman', serif"}} fontSize="72" fontWeight="700" letterSpacing=".7" fill="url(#zipGold)" filter="url(#zipGoldShadow)">Sertifikat Penilaian Kognitif</text>
    <Flank y={286} leftStart={182} leftEnd={351} rightStart={1144} rightEnd={1313}/>
    <text x="747.5" y="294" textAnchor="middle" style={{fontFamily:"var(--font-cinzel, Georgia), serif"}} fontSize="20" fontWeight="600" letterSpacing="7.2" fill="#f6e3b1">CERTIFICATE OF COGNITIVE ASSESSMENT</text>

    {/* Awarded row */}
    <Flank y={348} leftStart={350} leftEnd={541} rightStart={954} rightEnd={1145}/>
    <Diamond x={558} y={348}/><Diamond x={937} y={348}/>
    <text x="747.5" y="356" textAnchor="middle" style={{fontFamily:"var(--font-lora, Georgia), serif"}} fontSize="20" fill="#f9f6e9">Diberikan kepada / Awarded to</text>

    {/* Participant */}
    <text x="747.5" y="442" textAnchor="middle" style={{fontFamily:"var(--font-cinzel, Georgia), 'Times New Roman', serif"}} fontSize={nameSize(name)} fontWeight="700" letterSpacing="1.2" fill="url(#zipGold)" filter="url(#zipGoldShadow)">{name}</text>
    <line x1="330" y1="474" x2="1165" y2="474" stroke="url(#zipLine)" strokeWidth="1.5"/>
    <Diamond x={747.5} y={474} size={10}/>

    {/* Description */}
    <text x="747.5" y="516" textAnchor="middle" style={{fontFamily:"var(--font-lora, Georgia), serif"}} fontSize="21" fill="#f9f6e9">Telah menyelesaikan Tes IQ ALZAVA dan memperoleh hasil</text>

    {/* Score */}
    <text x="747.5" y="648" textAnchor="middle" style={{fontFamily:"var(--font-cinzel, Georgia), 'Times New Roman', serif"}} fontSize="140" fontWeight="700" letterSpacing="-2" fill="url(#zipGold)" filter="url(#zipGoldShadow)">{data.iqScore} IQ</text>

    {/* Text over original ZIP plaque */}
    <text x="747.5" y="724" textAnchor="middle" style={{fontFamily:"var(--font-lora, Georgia), serif"}} fontSize="30" fontWeight="700" fill="#f9f6e9">Tingkat IQ: <tspan fontWeight="800" fill="#f2d478">{data.iqLevel}</tspan></text>

    {/* Date */}
    <text x="290" y="859" textAnchor="middle" style={{fontFamily:"var(--font-lora, Georgia), serif"}} fontSize="18" fill="#f9f6e9">Tanggal: {date}</text>
    <line x1="150" y1="881" x2="280" y2="881" stroke="url(#zipLine)" strokeWidth="1.5"/>
    <Diamond x={290} y={881} size={9}/>
    <line x1="300" y1="881" x2="430" y2="881" stroke="url(#zipLine)" strokeWidth="1.5"/>

    {/* Powered by; actual HN crest is baked from ZIP asset in the shell */}
    <text x="645" y="858" textAnchor="middle" style={{fontFamily:"var(--font-lora, Georgia), serif"}} fontSize="18" fill="#f9f6e9">Powered by:</text>
    <text x="645" y="902" textAnchor="middle" style={{fontFamily:"var(--font-lora, Georgia), serif"}} fontSize="40" fontWeight="700" fill="#f9f6e9">HN FC</text>
    <line x1="752" y1="832" x2="752" y2="947" stroke="#d4af37" strokeOpacity=".7" strokeWidth="1"/>
    <Diamond x={752} y={889} size={8}/>

    {/* Certificate ID */}
    <text x="1205" y="859" textAnchor="middle" style={{fontFamily:"var(--font-lora, Georgia), serif"}} fontSize="18" fill="#f9f6e9">ID Sertifikat: {id}</text>
    <line x1="1065" y1="881" x2="1195" y2="881" stroke="url(#zipLine)" strokeWidth="1.5"/>
    <Diamond x={1205} y={881} size={9}/>
    <line x1="1215" y1="881" x2="1345" y2="881" stroke="url(#zipLine)" strokeWidth="1.5"/>

    {/* Motto — raised for safe clearance from the bottom frame */}
    <Flank y={970} leftStart={378} leftEnd={548} rightStart={947} rightEnd={1117}/>
    <Diamond x={566} y={970} size={7}/><Diamond x={929} y={970} size={7}/>
    <text x="747.5" y="975" textAnchor="middle" style={{fontFamily:"var(--font-cinzel, Georgia), serif"}} fontSize="13" fontWeight="600" letterSpacing="4.2" fill="#f6e3b1">LEBIH TAJAM PIKIRAN, LEBIH TINGGI POTENSI</text>
  </svg>
}

async function loadImage(src:string){
  return await new Promise<HTMLImageElement>((resolve,reject)=>{
    const image=new Image()
    image.decoding="async"
    image.onload=()=>resolve(image)
    image.onerror=()=>reject(new Error("image_load_failed"))
    image.src=src
  })
}

function canvasFontVariable(name:string,fallback:string){
  try{
    const raw=getComputedStyle(document.body).getPropertyValue(name).trim()
    return raw||fallback
  }catch{
    return fallback
  }
}

function canvasGold(ctx:CanvasRenderingContext2D,y:number,height:number){
  const gradient=ctx.createLinearGradient(0,y-height,0,y+8)
  gradient.addColorStop(0,"#fff3cf")
  gradient.addColorStop(.28,"#f7df99")
  gradient.addColorStop(.60,"#d4af37")
  gradient.addColorStop(1,"#f7e5ab")
  return gradient
}

function withGoldShadow(ctx:CanvasRenderingContext2D){
  ctx.shadowColor="rgba(0,0,0,.72)"
  ctx.shadowBlur=5
  ctx.shadowOffsetX=0
  ctx.shadowOffsetY=3
}

function clearCanvasShadow(ctx:CanvasRenderingContext2D){
  ctx.shadowColor="transparent"
  ctx.shadowBlur=0
  ctx.shadowOffsetX=0
  ctx.shadowOffsetY=0
}

function drawCenteredText(
  ctx:CanvasRenderingContext2D,
  text:string,
  x:number,
  y:number,
  font:string,
  fill:string|CanvasGradient,
  shadow=false,
){
  ctx.save()
  ctx.font=font
  ctx.textAlign="center"
  ctx.textBaseline="alphabetic"
  ctx.fillStyle=fill
  if(shadow)withGoldShadow(ctx)
  ctx.fillText(text,x,y)
  ctx.restore()
}

function drawSpacedCenteredText(
  ctx:CanvasRenderingContext2D,
  text:string,
  x:number,
  y:number,
  font:string,
  fill:string|CanvasGradient,
  spacing:number,
){
  ctx.save()
  ctx.font=font
  ctx.textAlign="left"
  ctx.textBaseline="alphabetic"
  ctx.fillStyle=fill
  const chars=Array.from(text)
  const widths=chars.map(char=>ctx.measureText(char).width)
  const total=widths.reduce((sum,width)=>sum+width,0)+Math.max(0,chars.length-1)*spacing
  let cursor=x-total/2
  chars.forEach((char,index)=>{
    ctx.fillText(char,cursor,y)
    cursor+=widths[index]+spacing
  })
  ctx.restore()
}

function drawCanvasDiamond(ctx:CanvasRenderingContext2D,x:number,y:number,size=9){
  ctx.save()
  ctx.translate(x,y)
  ctx.rotate(Math.PI/4)
  ctx.fillStyle="#d4af37"
  ctx.shadowColor="rgba(212,175,55,.45)"
  ctx.shadowBlur=4
  ctx.fillRect(-size/2,-size/2,size,size)
  ctx.restore()
}

function drawCanvasFlanks(ctx:CanvasRenderingContext2D,y:number,leftStart:number,leftEnd:number,rightStart:number,rightEnd:number){
  ctx.save()
  const left=ctx.createLinearGradient(leftStart,0,leftEnd,0)
  left.addColorStop(0,"rgba(139,101,27,0)")
  left.addColorStop(.75,"#d4af37")
  left.addColorStop(1,"#f6e3b1")
  ctx.strokeStyle=left
  ctx.lineWidth=1.5
  ctx.beginPath();ctx.moveTo(leftStart,y);ctx.lineTo(leftEnd,y);ctx.stroke()

  const right=ctx.createLinearGradient(rightStart,0,rightEnd,0)
  right.addColorStop(0,"#f6e3b1")
  right.addColorStop(.25,"#d4af37")
  right.addColorStop(1,"rgba(139,101,27,0)")
  ctx.strokeStyle=right
  ctx.beginPath();ctx.moveTo(rightStart,y);ctx.lineTo(rightEnd,y);ctx.stroke()
  ctx.restore()
}

function drawMixedCenteredText(
  ctx:CanvasRenderingContext2D,
  leftText:string,
  rightText:string,
  x:number,
  y:number,
  font:string,
){
  ctx.save()
  ctx.font=font
  ctx.textBaseline="alphabetic"
  const leftWidth=ctx.measureText(leftText).width
  const rightWidth=ctx.measureText(rightText).width
  let cursor=x-(leftWidth+rightWidth)/2
  ctx.textAlign="left"
  ctx.fillStyle="#f9f6e9"
  ctx.fillText(leftText,cursor,y)
  cursor+=leftWidth
  ctx.fillStyle="#f2d478"
  ctx.fillText(rightText,cursor,y)
  ctx.restore()
}

async function renderCertificatePng(data:VisualIqCertificateData){
  await document.fonts?.ready?.catch?.(()=>undefined)

  const scale=2
  const width=1495
  const height=1052
  const canvas=document.createElement("canvas")
  canvas.width=width*scale
  canvas.height=height*scale
  const ctx=canvas.getContext("2d",{alpha:false})
  if(!ctx)throw new Error("canvas_unavailable")

  ctx.imageSmoothingEnabled=true
  ctx.imageSmoothingQuality="high"
  ctx.fillStyle="#020713"
  ctx.fillRect(0,0,canvas.width,canvas.height)
  ctx.scale(scale,scale)

  const shell=await loadImage(CERTIFICATE_SHELL)
  ctx.drawImage(shell,0,0,width,height)

  const cinzel=canvasFontVariable("--font-cinzel","Georgia")
  const lora=canvasFontVariable("--font-lora","Georgia")
  const name=displayName(data.participantName)
  const id=certificateId(data)
  const date=certificateDate(data.createdAt)

  drawCanvasFlanks(ctx,110,340,574,921,1155)
  drawCanvasDiamond(ctx,590,110,9);drawCanvasDiamond(ctx,905,110,9)
  drawCenteredText(ctx,"Alzava",747.5,137,`600 62px ${cinzel}, Georgia, serif`,canvasGold(ctx,137,62),true)
  drawSpacedCenteredText(ctx,"BATTLE POINT",747.5,169,`600 19px ${cinzel}, Georgia, serif`,"#e4c66d",8.5)

  drawCenteredText(ctx,"Sertifikat Penilaian Kognitif",747.5,242,`700 72px ${cinzel}, Georgia, serif`,canvasGold(ctx,242,72),true)
  drawCanvasFlanks(ctx,286,182,351,1144,1313)
  drawSpacedCenteredText(ctx,"CERTIFICATE OF COGNITIVE ASSESSMENT",747.5,294,`600 20px ${cinzel}, Georgia, serif`,"#f6e3b1",7.2)

  drawCanvasFlanks(ctx,348,350,541,954,1145)
  drawCanvasDiamond(ctx,558,348,10);drawCanvasDiamond(ctx,937,348,10)
  drawCenteredText(ctx,"Diberikan kepada / Awarded to",747.5,356,`400 20px ${lora}, Georgia, serif`,"#f9f6e9")

  drawCenteredText(ctx,name,747.5,442,`700 ${nameSize(name)}px ${cinzel}, Georgia, serif`,canvasGold(ctx,442,nameSize(name)),true)
  drawCanvasFlanks(ctx,474,330,735,760,1165)
  drawCanvasDiamond(ctx,747.5,474,10)

  drawCenteredText(ctx,"Telah menyelesaikan Tes IQ ALZAVA dan memperoleh hasil",747.5,516,`400 21px ${lora}, Georgia, serif`,"#f9f6e9")
  drawCenteredText(ctx,`${data.iqScore} IQ`,747.5,648,`700 140px ${cinzel}, Georgia, serif`,canvasGold(ctx,648,140),true)

  drawMixedCenteredText(ctx,"Tingkat IQ: ",data.iqLevel,747.5,724,`700 30px ${lora}, Georgia, serif`)

  drawCenteredText(ctx,`Tanggal: ${date}`,290,859,`400 18px ${lora}, Georgia, serif`,"#f9f6e9")
  drawCanvasFlanks(ctx,881,150,280,300,430);drawCanvasDiamond(ctx,290,881,9)

  drawCenteredText(ctx,"Powered by:",645,858,`400 18px ${lora}, Georgia, serif`,"#f9f6e9")
  drawCenteredText(ctx,"HN FC",645,902,`700 40px ${lora}, Georgia, serif`,"#f9f6e9")
  ctx.save();ctx.strokeStyle="rgba(212,175,55,.7)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(752,832);ctx.lineTo(752,947);ctx.stroke();ctx.restore()
  drawCanvasDiamond(ctx,752,889,8)

  drawCenteredText(ctx,`ID Sertifikat: ${id}`,1205,859,`400 18px ${lora}, Georgia, serif`,"#f9f6e9")
  drawCanvasFlanks(ctx,881,1065,1195,1215,1345);drawCanvasDiamond(ctx,1205,881,9)

  drawCanvasFlanks(ctx,970,378,548,947,1117)
  drawCanvasDiamond(ctx,566,970,7);drawCanvasDiamond(ctx,929,970,7)
  drawSpacedCenteredText(ctx,"LEBIH TAJAM PIKIRAN, LEBIH TINGGI POTENSI",747.5,975,`600 13px ${cinzel}, Georgia, serif`,"#f6e3b1",4.2)

  clearCanvasShadow(ctx)

  return await new Promise<Blob>((resolve,reject)=>{
    canvas.toBlob(value=>value?resolve(value):reject(new Error("png_failed")),"image/png",1)
  })
}

async function saveBlob(blob:Blob,fileName:string){
  const url=URL.createObjectURL(blob)
  try{
    const anchor=document.createElement("a")
    anchor.href=url
    anchor.download=fileName
    anchor.rel="noopener"
    anchor.style.display="none"
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()

    const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent)
    if(isiOS){
      window.setTimeout(()=>window.open(url,"_blank","noopener,noreferrer"),150)
    }
  }finally{
    window.setTimeout(()=>URL.revokeObjectURL(url),60000)
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
    return await renderCertificatePng(data)
  }
  async function download(){
    setMessage("Menyiapkan PNG HD…")
    try{
      const blob=await makePng()
      await saveBlob(blob,safeFileName(data.participantName))
      setMessage("Sertifikat HD berhasil dibuat dan diunduh.")
    }catch(error){
      console.error("certificate_download_failed",error)
      setMessage("Sertifikat belum dapat dibuat. Muat ulang halaman lalu coba lagi.")
    }
  }
  async function share(){
    setMessage("Menyiapkan sertifikat HD…")
    try{
      const blob=await makePng()
      const file=new File([blob],safeFileName(data.participantName),{type:"image/png"})

      if(navigator.share&&navigator.canShare?.({files:[file]})){
        await navigator.share({
          title:"Sertifikat Tes IQ ALZAVA",
          text:shareText,
          files:[file],
        })
        setMessage("Sertifikat berhasil dibagikan.")
        return
      }

      await saveBlob(blob,safeFileName(data.participantName))

      if(navigator.share){
        try{
          await navigator.share({
            title:"Sertifikat Tes IQ ALZAVA",
            text:shareText+"\nFile PNG HD sudah diunduh ke perangkatmu.",
            url:window.location.origin+"/visual-iq/",
          })
        }catch{}
      }
      setMessage("Browser ini tidak mendukung share file langsung. PNG HD sudah diunduh agar bisa dibagikan.")
    }catch(error){
      if(error instanceof DOMException&&error.name==="AbortError"){
        setMessage("")
        return
      }
      console.error("certificate_share_failed",error)
      setMessage("Sertifikat belum dapat dibagikan. Coba Unduh PNG lalu bagikan dari galeri/file.")
    }
  }
  async function printCertificate(){
    setMessage("Menyiapkan versi cetak HD…")
    if(!svgRef.current){setMessage("Sertifikat belum siap dicetak.");return}
    try{
      const blob=await makePng()
      const url=URL.createObjectURL(blob)
      const printWindow=window.open("","_blank","width=1200,height=900")
      if(!printWindow){
        URL.revokeObjectURL(url)
        setMessage("Izinkan pop-up untuk mencetak sertifikat.")
        return
      }
      try{printWindow.opener=null}catch{}
      printWindow.document.open()
      printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Sertifikat Tes IQ ALZAVA</title><style>@page{size:A4 landscape;margin:0}html,body{margin:0;background:#fff}body{display:grid;place-items:center;min-height:100vh}img{display:block;width:100%;height:auto;max-height:100vh;object-fit:contain}@media print{html,body{width:297mm;height:210mm}img{width:297mm;height:210mm;object-fit:contain}}</style></head><body><img src="${url}" alt="Sertifikat Tes IQ ALZAVA"/><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));window.addEventListener('afterprint',()=>window.close());<\/script></body></html>`)
      printWindow.document.close()
      printWindow.focus()
      window.setTimeout(()=>URL.revokeObjectURL(url),60000)
      setMessage("Versi cetak HD dibuka.")
    }catch(error){
      console.error("certificate_print_failed",error)
      setMessage("Sertifikat belum dapat dicetak. Coba lagi.")
    }
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
