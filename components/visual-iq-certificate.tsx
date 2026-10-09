"use client"

import { Download, Share2, X } from "lucide-react"
import { useMemo, useRef, useState } from "react"

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
function safeFileName(name:string){
  return "sertifikat-iq-"+name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+".png"
}

function Laurel({mirror=false}:{mirror?:boolean}){
  const leaves=[
    [12,90,-48],[24,72,-38],[38,55,-27],[54,40,-17],[72,29,-8],[91,23,3],[111,22,15],[130,27,28]
  ]
  return <g transform={mirror?"translate(1495 0) scale(-1 1)":undefined}>
    <path d="M365 710 C390 650 415 594 475 542" fill="none" stroke="url(#certGold)" strokeWidth="5" opacity=".95"/>
    {leaves.map(([x,y,r],i)=><ellipse key={i} cx={350+x} cy={610+y} rx="9" ry="23" transform={`rotate(${r} ${350+x} ${610+y})`} fill="url(#certGold)" opacity=".96"/>)}
  </g>
}

export function VisualIqCertificate({data,svgRef}:{data:VisualIqCertificateData;svgRef?:React.RefObject<SVGSVGElement|null>}){
  const nameSize=data.participantName.length>28?54:data.participantName.length>20?66:82
  const id=certificateId(data)
  const date=certificateDate(data.createdAt)
  const achievementText=achievement(data)
  return <svg
    ref={svgRef}
    viewBox="0 0 1495 1052"
    width="1495"
    height="1052"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={`Sertifikat Tes IQ ${data.participantName}`}
    className="block h-auto w-full"
  >
    <defs>
      <linearGradient id="certBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#020713"/>
        <stop offset=".45" stopColor="#07182a"/>
        <stop offset="1" stopColor="#020711"/>
      </linearGradient>
      <radialGradient id="certGlow" cx="50%" cy="43%" r="58%">
        <stop offset="0" stopColor="#153455" stopOpacity=".72"/>
        <stop offset=".48" stopColor="#0a1c31" stopOpacity=".28"/>
        <stop offset="1" stopColor="#020713" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="certGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff2c4"/>
        <stop offset=".28" stopColor="#e7c66e"/>
        <stop offset=".62" stopColor="#b98226"/>
        <stop offset="1" stopColor="#f1d68b"/>
      </linearGradient>
      <linearGradient id="certGoldLine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8c641c" stopOpacity="0"/>
        <stop offset=".18" stopColor="#d6af4e"/>
        <stop offset=".5" stopColor="#fff0b7"/>
        <stop offset=".82" stopColor="#d6af4e"/>
        <stop offset="1" stopColor="#8c641c" stopOpacity="0"/>
      </linearGradient>
      <pattern id="certPattern" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <path d="M0 0H44M0 22H44" stroke="#86a4bc" strokeOpacity=".045" strokeWidth="1"/>
        <path d="M0 0V44M22 0V44" stroke="#d0af57" strokeOpacity=".025" strokeWidth="1"/>
      </pattern>
      <filter id="certShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity=".68"/>
        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#d4af37" floodOpacity=".18"/>
      </filter>
    </defs>

    <rect width="1495" height="1052" fill="url(#certBg)"/>
    <rect width="1495" height="1052" fill="url(#certGlow)"/>
    <rect width="1495" height="1052" fill="url(#certPattern)"/>

    <rect x="20" y="20" width="1455" height="1012" rx="4" fill="none" stroke="#e3c573" strokeWidth="2"/>
    <rect x="29" y="29" width="1437" height="994" rx="3" fill="none" stroke="#9c7428" strokeWidth="1"/>
    <rect x="43" y="43" width="1409" height="966" rx="2" fill="none" stroke="#efd792" strokeOpacity=".66" strokeWidth="1"/>

    <g fill="none" stroke="url(#certGold)" strokeWidth="2" opacity=".92">
      <path d="M48 150C53 88 94 48 156 43M1339 43c62 5 103 45 108 107M48 902c5 62 46 103 108 107M1339 1009c62-4 103-45 108-107"/>
      <path d="M57 119C70 76 97 53 137 44M1358 44c40 9 67 32 80 75M57 933c13 43 40 66 80 75M1358 1008c40-9 67-32 80-75" opacity=".48"/>
    </g>
    {[48,1447].map((x,i)=><g key={x} transform={`translate(${x} 52)`}>
      <rect x="-13" y="-13" width="26" height="26" fill="#071426" stroke="#d6af4e" strokeWidth="2"/>
      <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill="none" stroke="#f6e3b1"/>
    </g>)}

    <g filter="url(#certShadow)">
      <path d="M731 67l13-18 13 18 17-13-4 27h-52l-4-27z" fill="url(#certGold)"/>
      <circle cx="714" cy="52" r="3.5" fill="#f8e4aa"/><circle cx="744" cy="42" r="3.5" fill="#f8e4aa"/><circle cx="774" cy="52" r="3.5" fill="#f8e4aa"/>
      <text x="747.5" y="128" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="62" fontWeight="700" letterSpacing="8" fill="url(#certGold)">ALZAVA</text>
      <text x="747.5" y="161" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="17" fontWeight="700" letterSpacing="9" fill="#dcb95d">BATTLE POINT</text>
    </g>
    <line x1="365" y1="105" x2="555" y2="105" stroke="url(#certGoldLine)" strokeWidth="2"/>
    <line x1="940" y1="105" x2="1130" y2="105" stroke="url(#certGoldLine)" strokeWidth="2"/>
    <rect x="560" y="100" width="9" height="9" transform="rotate(45 564.5 104.5)" fill="none" stroke="#e9cc74"/>
    <rect x="926" y="100" width="9" height="9" transform="rotate(45 930.5 104.5)" fill="none" stroke="#e9cc74"/>

    <text x="747.5" y="235" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="67" fontWeight="700" letterSpacing="2" fill="url(#certGold)" filter="url(#certShadow)">SERTIFIKAT PENILAIAN KOGNITIF</text>
    <line x1="160" y1="272" x2="365" y2="272" stroke="url(#certGoldLine)" strokeWidth="2"/>
    <line x1="1130" y1="272" x2="1335" y2="272" stroke="url(#certGoldLine)" strokeWidth="2"/>
    <text x="747.5" y="280" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="600" letterSpacing="8" fill="#f2e3ba">CERTIFICATE OF COGNITIVE ASSESSMENT</text>

    <line x1="355" y1="330" x2="545" y2="330" stroke="url(#certGoldLine)" strokeWidth="1.5"/>
    <line x1="950" y1="330" x2="1140" y2="330" stroke="url(#certGoldLine)" strokeWidth="1.5"/>
    <text x="747.5" y="337" textAnchor="middle" fontFamily="Georgia, serif" fontSize="20" fill="#f7f1df">Diberikan kepada / Awarded to</text>

    <text x="747.5" y="427" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize={nameSize} fontWeight="700" fill="url(#certGold)" filter="url(#certShadow)">{data.participantName}</text>
    <line x1="360" y1="458" x2="1135" y2="458" stroke="url(#certGoldLine)" strokeWidth="1.5"/>
    <rect x="743" y="453" width="9" height="9" transform="rotate(45 747.5 457.5)" fill="#d8b458"/>

    <text x="747.5" y="496" textAnchor="middle" fontFamily="Georgia, serif" fontSize="20" fill="#f7f1df">Telah menyelesaikan Tes IQ ALZAVA dan memperoleh hasil</text>

    <Laurel/>
    <Laurel mirror/>
    <text x="747.5" y="641" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="132" fontWeight="700" fill="url(#certGold)" filter="url(#certShadow)">{data.iqScore} IQ</text>

    <path d="M493 665H1002L1032 712 1002 759H493L463 712Z" fill="#061425" stroke="#d4af37" strokeWidth="3"/>
    <path d="M502 674H993L1017 712 993 750H502L478 712Z" fill="none" stroke="#f1d98f" strokeOpacity=".62"/>
    <text x="747.5" y="707" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fill="#f7f1df">Tingkat IQ: <tspan fontWeight="700" fill="#e9c96b">{data.iqLevel}</tspan></text>
    <text x="747.5" y="738" textAnchor="middle" fontFamily="Georgia, serif" fontSize="17" letterSpacing="1" fill="#e3dfd2">Rentang Kepercayaan: {confidence(data.iqScore)}</text>

    <line x1="465" y1="795" x2="615" y2="795" stroke="url(#certGoldLine)" strokeWidth="1.5"/>
    <line x1="880" y1="795" x2="1030" y2="795" stroke="url(#certGoldLine)" strokeWidth="1.5"/>
    <text x="747.5" y="803" textAnchor="middle" fontFamily="Georgia, serif" fontSize="23" fontWeight="700" letterSpacing="7" fill="url(#certGold)">{achievementText} • {data.iqLevel.toUpperCase()}</text>

    <text x="150" y="862" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" letterSpacing="3" fill="#c9a94f">TANGGAL</text>
    <text x="150" y="892" fontFamily="Georgia, serif" fontSize="18" fill="#f7f1df">{date}</text>
    <line x1="150" y1="908" x2="405" y2="908" stroke="url(#certGoldLine)"/>

    <g transform="translate(646 846)">
      <text x="0" y="12" fontFamily="Georgia, serif" fontSize="15" fill="#d8d0b9">Powered by:</text>
      <text x="0" y="53" fontFamily="Georgia, serif" fontSize="36" fontWeight="700" letterSpacing="2" fill="#f4e5bd">HN FC</text>
      <line x1="122" y1="-8" x2="122" y2="92" stroke="#d4af37" strokeOpacity=".72"/>
      <circle cx="196" cy="42" r="56" fill="#05090e" stroke="#f0deab" strokeWidth="3"/>
      <circle cx="196" cy="42" r="47" fill="none" stroke="#c49a3d" strokeWidth="1.5"/>
      <text x="196" y="12" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="700" letterSpacing="1.2" fill="#f8f0dc">HN FOOTBALL CLUB</text>
      <path d="M177 27l8-11 11 10 11-10 8 11-4 13h-30z" fill="none" stroke="#f5edd9" strokeWidth="2"/>
      <text x="196" y="62" textAnchor="middle" fontFamily="Georgia, serif" fontSize="30" fontWeight="700" fill="#f5edd9">HN</text>
      <text x="196" y="82" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" letterSpacing="2" fill="#f5edd9">MMXXI</text>
    </g>

    <text x="1345" y="862" textAnchor="end" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" letterSpacing="3" fill="#c9a94f">ID SERTIFIKAT</text>
    <text x="1345" y="892" textAnchor="end" fontFamily="Georgia, serif" fontSize="18" fill="#f7f1df">{id}</text>
    <line x1="1090" y1="908" x2="1345" y2="908" stroke="url(#certGoldLine)"/>

    <line x1="360" y1="982" x2="535" y2="982" stroke="url(#certGoldLine)" strokeWidth="1"/>
    <line x1="960" y1="982" x2="1135" y2="982" stroke="url(#certGoldLine)" strokeWidth="1"/>
    <text x="747.5" y="988" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" letterSpacing="5" fill="#d9b967">LEBIH TAJAM PIKIRAN, LEBIH TINGGI POTENSI</text>
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

export function VisualIqCertificateModal({open,onClose,data}:{open:boolean;onClose:()=>void;data:VisualIqCertificateData}){
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

  return <div className="fixed inset-0 z-[250] overflow-y-auto bg-[#020617]/90 px-3 py-5 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Sertifikat Tes IQ">
    <div className="mx-auto max-w-6xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-amber-300">Sertifikat Tes IQ</p><p className="mt-1 text-sm text-slate-400">Powered by HN FC</p></div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.06] text-white"><X className="h-5 w-5"/></button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-amber-300/20 bg-slate-950 shadow-[0_30px_100px_rgba(0,0,0,.55)]">
        <VisualIqCertificate data={data} svgRef={svgRef}/>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={()=>void share()} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 px-4 text-sm font-black text-slate-950"><Share2 className="h-4 w-4"/>Bagikan Sertifikat</button>
        <button type="button" onClick={()=>void download()} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-4 text-sm font-black text-white"><Download className="h-4 w-4"/>Unduh PNG</button>
      </div>
      {message&&<p className="mt-2 text-center text-xs font-bold text-cyan-200">{message}</p>}
    </div>
  </div>
}
